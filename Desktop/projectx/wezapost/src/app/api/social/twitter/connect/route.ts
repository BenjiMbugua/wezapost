import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Try to get credentials from user configuration first, then fall back to environment
    let clientId = process.env.TWITTER_CLIENT_ID
    
    // Check if user has configured their own credentials
    try {
      // Import the credential manager for server-side use
      const { getServerCredentials } = await import('@/lib/social-credential-manager')
      const userCredentials = getServerCredentials(session.user.id, 'twitter')
      
      if (userCredentials) {
        clientId = userCredentials.clientId
        console.log('Using user-configured Twitter credentials')
      }
    } catch (error) {
      console.log('No user credentials found, using environment variables')
    }
    
    if (!clientId || clientId.includes('your_')) {
      return NextResponse.json({ 
        error: 'Twitter OAuth not configured',
        message: 'Please configure your Twitter app credentials in the setup wizard'
      }, { status: 400 })
    }

    // Generate state parameter for security
    const state = Buffer.from(JSON.stringify({
      userId: session.user.id,
      timestamp: Date.now()
    })).toString('base64')

    // Twitter OAuth 2.0 authorization URL
    const scopes = ['tweet.read', 'tweet.write', 'users.read', 'offline.access']
    const authUrl = new URL('https://twitter.com/i/oauth2/authorize')
    
    authUrl.searchParams.append('response_type', 'code')
    authUrl.searchParams.append('client_id', clientId)
    authUrl.searchParams.append('redirect_uri', `${process.env.NEXTAUTH_URL}/api/social/twitter/callback`)
    authUrl.searchParams.append('scope', scopes.join(' '))
    authUrl.searchParams.append('state', state)
    authUrl.searchParams.append('code_challenge', 'challenge')
    authUrl.searchParams.append('code_challenge_method', 'plain')

    return NextResponse.json({
      success: true,
      authUrl: authUrl.toString(),
      message: 'Redirect to Twitter for authorization'
    })
  } catch (error) {
    console.error('Error initiating Twitter OAuth:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}