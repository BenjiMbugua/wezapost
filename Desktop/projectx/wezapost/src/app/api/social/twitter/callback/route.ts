import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseClientComponentClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    if (error) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard?error=twitter_auth_denied`)
    }

    if (!code || !state) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard?error=twitter_invalid_response`)
    }

    // Decode state to get user info
    let userId: string
    try {
      const stateData = JSON.parse(Buffer.from(state, 'base64').toString())
      userId = stateData.userId
    } catch {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard?error=twitter_invalid_state`)
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${process.env.TWITTER_CLIENT_ID}:${process.env.TWITTER_CLIENT_SECRET}`).toString('base64')}`
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: `${process.env.NEXTAUTH_URL}/api/social/twitter/callback`,
        code_verifier: 'challenge'
      })
    })

    const tokenData = await tokenResponse.json()

    if (!tokenResponse.ok) {
      console.error('Twitter token exchange failed:', tokenData)
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard?error=twitter_token_failed`)
    }

    // Get user info from Twitter
    const userResponse = await fetch('https://api.twitter.com/2/users/me?user.fields=name,username,profile_image_url', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`
      }
    })

    const userData = await userResponse.json()

    if (!userResponse.ok) {
      console.error('Twitter user info failed:', userData)
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard?error=twitter_user_failed`)
    }

    // Store in database/localStorage hybrid approach
    const accountData = {
      platform: 'twitter',
      platform_user_id: userData.data.id,
      username: userData.data.username,
      display_name: userData.data.name,
      avatar_url: userData.data.profile_image_url,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_at: tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString() : null,
    }

    // Try to save to database
    try {
      const supabase = createSupabaseClientComponentClient()
      const { error: dbError } = await supabase
        .from('social_accounts')
        .upsert({
          user_id: userId,
          ...accountData,
          is_active: true,
          settings: {
            auto_post: true,
            default_visibility: 'public',
            custom_hashtags: ['#twitter'],
          },
        })

      if (dbError) {
        console.log('Database save failed, will use localStorage fallback')
      }
    } catch (error) {
      console.log('Database not available, using localStorage fallback')
    }

    // Redirect back to dashboard with success
    const successUrl = new URL(`${process.env.NEXTAUTH_URL}/dashboard`)
    successUrl.searchParams.append('social_connected', 'twitter')
    successUrl.searchParams.append('account_data', Buffer.from(JSON.stringify(accountData)).toString('base64'))

    return NextResponse.redirect(successUrl.toString())
  } catch (error) {
    console.error('Error in Twitter callback:', error)
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard?error=twitter_callback_error`)
  }
}