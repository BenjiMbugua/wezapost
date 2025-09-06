import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseClientComponentClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    if (error) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard?error=linkedin_auth_denied`)
    }

    if (!code || !state) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard?error=linkedin_invalid_response`)
    }

    // Decode state to get user info
    let userId: string
    try {
      const stateData = JSON.parse(Buffer.from(state, 'base64').toString())
      userId = stateData.userId
    } catch {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard?error=linkedin_invalid_state`)
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: process.env.LINKEDIN_CLIENT_ID!,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
        redirect_uri: `${process.env.NEXTAUTH_URL}/api/social/linkedin/callback`,
      })
    })

    const tokenData = await tokenResponse.json()

    if (!tokenResponse.ok) {
      console.error('LinkedIn token exchange failed:', tokenData)
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard?error=linkedin_token_failed`)
    }

    // Get user info from LinkedIn
    const userResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`
      }
    })

    const userData = await userResponse.json()

    if (!userResponse.ok) {
      console.error('LinkedIn user info failed:', userData)
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard?error=linkedin_user_failed`)
    }

    // Store account data
    const accountData = {
      platform: 'linkedin',
      platform_user_id: userData.sub,
      username: userData.email?.split('@')[0] || userData.given_name?.toLowerCase(),
      display_name: userData.name || `${userData.given_name} ${userData.family_name}`,
      avatar_url: userData.picture,
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
            custom_hashtags: ['#linkedin', '#professional'],
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
    successUrl.searchParams.append('social_connected', 'linkedin')
    successUrl.searchParams.append('account_data', Buffer.from(JSON.stringify(accountData)).toString('base64'))

    return NextResponse.redirect(successUrl.toString())
  } catch (error) {
    console.error('Error in LinkedIn callback:', error)
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard?error=linkedin_callback_error`)
  }
}