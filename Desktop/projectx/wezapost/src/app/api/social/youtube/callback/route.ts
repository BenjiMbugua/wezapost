import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseClientComponentClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    if (error) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard?error=youtube_auth_denied`)
    }

    if (!code || !state) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard?error=youtube_invalid_response`)
    }

    // Decode state to get user info
    let userId: string
    try {
      const stateData = JSON.parse(Buffer.from(state, 'base64').toString())
      userId = stateData.userId
    } catch {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard?error=youtube_invalid_state`)
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: `${process.env.NEXTAUTH_URL}/api/social/youtube/callback`,
      })
    })

    const tokenData = await tokenResponse.json()

    if (!tokenResponse.ok) {
      console.error('YouTube token exchange failed:', tokenData)
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard?error=youtube_token_failed`)
    }

    // Get user info from Google
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`
      }
    })

    const userData = await userResponse.json()

    if (!userResponse.ok) {
      console.error('Google user info failed:', userData)
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard?error=youtube_user_failed`)
    }

    // Get YouTube channel info
    const channelResponse = await fetch('https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`
      }
    })

    const channelData = await channelResponse.json()

    if (!channelResponse.ok || !channelData.items || channelData.items.length === 0) {
      console.error('YouTube channel info failed:', channelData)
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard?error=youtube_no_channel`)
    }

    const channel = channelData.items[0]

    // Store account data
    const accountData = {
      platform: 'youtube' as const,
      platform_user_id: channel.id,
      username: channel.snippet.customUrl || channel.snippet.title.toLowerCase().replace(/\s+/g, ''),
      display_name: channel.snippet.title,
      avatar_url: channel.snippet.thumbnails?.default?.url || userData.picture,
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
            custom_hashtags: ['#youtube', '#video'],
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
    successUrl.searchParams.append('social_connected', 'youtube')
    successUrl.searchParams.append('account_data', Buffer.from(JSON.stringify(accountData)).toString('base64'))

    return NextResponse.redirect(successUrl.toString())
  } catch (error) {
    console.error('Error in YouTube callback:', error)
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard?error=youtube_callback_error`)
  }
}