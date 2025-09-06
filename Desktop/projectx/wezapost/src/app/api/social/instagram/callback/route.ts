import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { SocialProviderManager } from '@/lib/social-providers'

interface InstagramTokenResponse {
  access_token: string
  user_id: number
}

interface InstagramUserResponse {
  id: string
  username: string
  account_type: string
  media_count: number
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    if (error) {
      console.error('Instagram OAuth error:', error)
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard?error=instagram_auth_failed`)
    }

    if (!code) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard?error=no_code`)
    }

    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.id !== state) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard?error=invalid_state`)
    }

    // Exchange code for access token via Facebook Graph API
    const tokenUrl = new URL('https://graph.facebook.com/v18.0/oauth/access_token')
    tokenUrl.searchParams.set('client_id', process.env.INSTAGRAM_CLIENT_ID!)
    tokenUrl.searchParams.set('client_secret', process.env.INSTAGRAM_CLIENT_SECRET!)
    tokenUrl.searchParams.set('redirect_uri', `${process.env.NEXTAUTH_URL}/api/social/instagram/callback`)
    tokenUrl.searchParams.set('code', code)

    const tokenResponse = await fetch(tokenUrl.toString())

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text()
      throw new Error(`Instagram token exchange failed: ${errorData}`)
    }

    const tokenData = await tokenResponse.json()

    // Facebook access tokens are typically long-lived by default
    const finalAccessToken = tokenData.access_token
    const expiresAt = tokenData.expires_in 
      ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
      : new Date(Date.now() + 60 * 24 * 3600 * 1000).toISOString() // 60 days default

    // Get user information via Facebook Graph API
    const userResponse = await fetch(
      `https://graph.facebook.com/v18.0/me?fields=id,name&access_token=${finalAccessToken}`
    )

    if (!userResponse.ok) {
      throw new Error('Failed to fetch Instagram user data')
    }

    const userData = await userResponse.json()

    // Connect the Instagram account
    const socialManager = new SocialProviderManager()
    
    const connectedAccount = await socialManager.connectAccount(session.user.id, {
      platform: 'instagram',
      platform_user_id: userData.id,
      username: userData.name || `user_${userData.id}`,
      display_name: userData.name || `Instagram User`,
      avatar_url: `https://ui-avatars.com/api/?name=${userData.name || 'Instagram'}&background=e4405f`,
      access_token: finalAccessToken,
      expires_at: expiresAt
    })

    if (!connectedAccount) {
      throw new Error('Failed to save Instagram account connection')
    }

    console.log('Instagram account connected successfully:', {
      userId: session.user.id,
      instagramId: userData.id,
      username: userData.name,
    })

    // Pass account data to client for localStorage storage (same pattern as Facebook)
    const accountData = {
      id: connectedAccount.id,
      platform: connectedAccount.platform,
      username: connectedAccount.username,
      display_name: connectedAccount.display_name,
      avatar_url: connectedAccount.avatar_url,
      is_active: connectedAccount.is_active,
      settings: connectedAccount.settings,
      user_id: session.user.id,
      access_token: finalAccessToken,
      refresh_token: undefined,
      expires_at: expiresAt,
      real_oauth: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard?success=instagram_connected&username=${userData.name}&account=${encodeURIComponent(JSON.stringify(accountData))}`)

  } catch (error: any) {
    console.error('Instagram callback error:', error)
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/dashboard?error=instagram_connection_failed&details=${encodeURIComponent(error.message)}`
    )
  }
}