import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { SocialProviderManager } from '@/lib/social-providers'

interface FacebookTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
}

interface FacebookUserResponse {
  id: string
  name: string
  email?: string
  picture?: {
    data: {
      url: string
    }
  }
}

interface FacebookPage {
  id: string
  name: string
  access_token: string
  category: string
  tasks: string[]
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    if (error) {
      console.error('Facebook OAuth error:', error)
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard?error=facebook_auth_failed`)
    }

    if (!code) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard?error=no_code`)
    }

    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.id !== state) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard?error=invalid_state`)
    }

    // Exchange code for access token
    const tokenUrl = 'https://graph.facebook.com/v18.0/oauth/access_token'
    const tokenParams = new URLSearchParams({
      client_id: process.env.FACEBOOK_CLIENT_ID!,
      client_secret: process.env.FACEBOOK_CLIENT_SECRET!,
      redirect_uri: `${process.env.NEXTAUTH_URL}/api/social/facebook/callback`,
      code
    })

    const tokenResponse = await fetch(`${tokenUrl}?${tokenParams}`, {
      method: 'GET',
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text()
      console.error('Facebook token exchange error:', {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        errorData,
        tokenUrl: tokenUrl + '?' + tokenParams.toString()
      })
      throw new Error(`Facebook token exchange failed: ${tokenResponse.statusText} - ${errorData}`)
    }

    const tokenData: FacebookTokenResponse = await tokenResponse.json()

    // Get user information
    const userResponse = await fetch(
      `https://graph.facebook.com/v18.0/me?fields=id,name,email,picture&access_token=${tokenData.access_token}`
    )

    if (!userResponse.ok) {
      throw new Error('Failed to fetch Facebook user data')
    }

    const userData: FacebookUserResponse = await userResponse.json()

    // Get user's Facebook pages (for posting)
    const pagesResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?access_token=${tokenData.access_token}`
    )

    let pages: FacebookPage[] = []
    if (pagesResponse.ok) {
      const pagesData = await pagesResponse.json()
      pages = pagesData.data || []
    }

    // Connect the Facebook account
    const socialManager = new SocialProviderManager()
    
    // Facebook long-lived tokens typically last 60 days if no expires_in is provided
    let expiresAt: string | undefined
    if (tokenData.expires_in && !isNaN(tokenData.expires_in)) {
      expiresAt = new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
    } else {
      // Default to 60 days for long-lived tokens
      expiresAt = new Date(Date.now() + 60 * 24 * 3600 * 1000).toISOString()
    }
    
    console.log('Facebook token data:', {
      hasToken: !!tokenData.access_token,
      expiresIn: tokenData.expires_in,
      expiresAt
    })

    console.log('About to connect Facebook account with data:', {
      platform: 'facebook',
      platform_user_id: userData.id,
      username: userData.name,
      display_name: userData.name,
      avatar_url: userData.picture?.data.url,
      hasAccessToken: !!tokenData.access_token,
      expiresAt
    })

    // Use page access token if available (required for posting to pages)
    let finalAccessToken = tokenData.access_token
    let finalPlatformUserId = userData.id
    
    if (pages.length > 0) {
      // Use the first page's access token for posting
      const firstPage = pages[0]
      console.log('Using Facebook page for posting:', firstPage.name, firstPage.id)
      console.log('Page access token exists:', !!firstPage.access_token)
      console.log('Page tasks/permissions:', firstPage.tasks)
      
      // Try to get a long-lived page access token
      try {
        const longLivedTokenResponse = await fetch(
          `https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${process.env.FACEBOOK_CLIENT_ID}&client_secret=${process.env.FACEBOOK_CLIENT_SECRET}&fb_exchange_token=${firstPage.access_token}`
        )
        
        if (longLivedTokenResponse.ok) {
          const longLivedData = await longLivedTokenResponse.json()
          console.log('Got long-lived page token:', !!longLivedData.access_token)
          finalAccessToken = longLivedData.access_token
        } else {
          console.log('Failed to get long-lived token, using original page token')
          finalAccessToken = firstPage.access_token
        }
      } catch (error) {
        console.error('Error getting long-lived token:', error)
        finalAccessToken = firstPage.access_token
      }
      
      finalPlatformUserId = firstPage.id
    }

    const connectedAccount = await socialManager.connectAccount(session.user.id, {
      platform: 'facebook',
      platform_user_id: finalPlatformUserId,
      username: userData.name,
      display_name: userData.name,
      avatar_url: userData.picture?.data.url,
      access_token: finalAccessToken,
      expires_at: expiresAt
    })

    console.log('Facebook connectAccount returned:', connectedAccount)

    if (!connectedAccount) {
      throw new Error('Failed to save Facebook account connection')
    }

    console.log('Facebook account connected successfully:', {
      userId: session.user.id,
      facebookId: userData.id,
      name: userData.name,
      pagesCount: pages.length
    })

    // Store page information for posting capabilities
    if (typeof window !== 'undefined' && pages.length > 0) {
      localStorage.setItem(`facebook-pages-${session.user.id}`, JSON.stringify(pages))
    }

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
      refresh_token: undefined,
      expires_at: expiresAt,
      real_oauth: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard?success=facebook_connected&pages=${pages.length}&account=${encodeURIComponent(JSON.stringify(accountData))}`)

  } catch (error: any) {
    console.error('Facebook callback error:', error)
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/dashboard?error=facebook_connection_failed&details=${encodeURIComponent(error.message)}`
    )
  }
}