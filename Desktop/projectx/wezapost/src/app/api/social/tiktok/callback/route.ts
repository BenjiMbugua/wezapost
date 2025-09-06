import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { SocialProviderManager } from '@/lib/social-providers'

interface TikTokTokenResponse {
  access_token: string
  expires_in: number
  refresh_token: string
  refresh_expires_in: number
  scope: string
  token_type: string
}

interface TikTokUserResponse {
  data: {
    user: {
      open_id: string
      union_id: string
      avatar_url: string
      display_name: string
      bio_description: string
      profile_deep_link: string
      is_verified: boolean
      follower_count: number
      following_count: number
      likes_count: number
      video_count: number
    }
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    if (error) {
      console.error('TikTok OAuth error:', error)
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard?error=tiktok_auth_failed`)
    }

    if (!code) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard?error=no_code`)
    }

    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.id !== state) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard?error=invalid_state`)
    }

    // Exchange code for access token
    const tokenUrl = 'https://open.tiktokapis.com/v2/oauth/token/'
    const tokenParams = new URLSearchParams({
      client_key: process.env.TIKTOK_CLIENT_KEY!,
      client_secret: process.env.TIKTOK_CLIENT_SECRET!,
      code: code,
      grant_type: 'authorization_code',
      redirect_uri: `${process.env.NEXTAUTH_URL}/api/social/tiktok/callback`
    })

    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: tokenParams
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text()
      console.error('TikTok token exchange error:', {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        errorData
      })
      throw new Error(`TikTok token exchange failed: ${tokenResponse.statusText}`)
    }

    const tokenData: TikTokTokenResponse = await tokenResponse.json()

    // Get user information
    const userResponse = await fetch('https://open.tiktokapis.com/v2/user/info/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fields: [
          'open_id',
          'union_id', 
          'avatar_url',
          'display_name',
          'bio_description',
          'profile_deep_link',
          'is_verified',
          'follower_count',
          'following_count',
          'likes_count',
          'video_count'
        ]
      })
    })

    if (!userResponse.ok) {
      const errorData = await userResponse.text()
      console.error('TikTok user info error:', errorData)
      throw new Error('Failed to fetch TikTok user data')
    }

    const userData: TikTokUserResponse = await userResponse.json()
    const user = userData.data.user

    // Connect the TikTok account
    const socialManager = new SocialProviderManager()
    
    // Calculate token expiry
    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
    
    console.log('TikTok token data:', {
      hasToken: !!tokenData.access_token,
      hasRefreshToken: !!tokenData.refresh_token,
      expiresIn: tokenData.expires_in,
      expiresAt,
      scope: tokenData.scope
    })

    console.log('About to connect TikTok account with data:', {
      platform: 'tiktok',
      platform_user_id: user.open_id,
      username: user.display_name,
      display_name: user.display_name,
      avatar_url: user.avatar_url,
      hasAccessToken: !!tokenData.access_token,
      followerCount: user.follower_count,
      isVerified: user.is_verified
    })

    const connectedAccount = await socialManager.connectAccount(session.user.id, {
      platform: 'tiktok',
      platform_user_id: user.open_id,
      username: user.display_name,
      display_name: user.display_name,
      avatar_url: user.avatar_url,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_at: expiresAt
    })

    console.log('TikTok connectAccount returned:', connectedAccount)

    if (!connectedAccount) {
      throw new Error('Failed to save TikTok account connection')
    }

    console.log('TikTok account connected successfully:', {
      userId: session.user.id,
      tiktokId: user.open_id,
      displayName: user.display_name,
      followers: user.follower_count,
      isVerified: user.is_verified
    })

    // Pass account data to client for localStorage storage
    const accountData = {
      id: connectedAccount.id,
      platform: connectedAccount.platform,
      username: connectedAccount.username,
      display_name: connectedAccount.display_name,
      avatar_url: connectedAccount.avatar_url,
      is_active: connectedAccount.is_active,
      settings: connectedAccount.settings,
      user_id: session.user.id,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_at: expiresAt,
      real_oauth: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      // TikTok-specific metadata
      metadata: {
        follower_count: user.follower_count,
        following_count: user.following_count,
        likes_count: user.likes_count,
        video_count: user.video_count,
        is_verified: user.is_verified,
        bio_description: user.bio_description,
        profile_deep_link: user.profile_deep_link
      }
    }

    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard?success=tiktok_connected&account=${encodeURIComponent(JSON.stringify(accountData))}`)

  } catch (error: any) {
    console.error('TikTok callback error:', error)
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/dashboard?error=tiktok_connection_failed&details=${encodeURIComponent(error.message)}`
    )
  }
}