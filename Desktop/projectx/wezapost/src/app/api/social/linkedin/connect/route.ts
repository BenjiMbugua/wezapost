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
    let clientId = process.env.LINKEDIN_CLIENT_ID
    
    // Check if user has configured their own credentials
    try {
      // Import the credential manager for server-side use
      const { getServerCredentials } = await import('@/lib/social-credential-manager')
      const userCredentials = getServerCredentials(session.user.id, 'linkedin')
      
      if (userCredentials) {
        clientId = userCredentials.clientId
        console.log('Using user-configured LinkedIn credentials')
      }
    } catch (error) {
      console.log('No user credentials found, using environment variables')
    }
    
    if (!clientId || clientId.includes('your_')) {
      return NextResponse.json({ 
        error: 'LinkedIn OAuth not configured',
        message: 'Please configure your LinkedIn app credentials in the setup wizard'
      }, { status: 400 })
    }

    // Generate state parameter for security
    const state = Buffer.from(JSON.stringify({
      userId: session.user.id,
      timestamp: Date.now()
    })).toString('base64')

    // LinkedIn OAuth 2.0 authorization URL with organization scopes for business posting
    const scopes = ['openid', 'profile', 'w_member_social', 'w_organization_social', 'rw_organization_admin']
    const authUrl = new URL('https://www.linkedin.com/oauth/v2/authorization')
    
    authUrl.searchParams.append('response_type', 'code')
    authUrl.searchParams.append('client_id', clientId)
    authUrl.searchParams.append('redirect_uri', `${process.env.NEXTAUTH_URL}/api/social/linkedin/callback`)
    authUrl.searchParams.append('scope', scopes.join(' '))
    authUrl.searchParams.append('state', state)

    return NextResponse.json({
      success: true,
      authUrl: authUrl.toString(),
      message: 'Redirect to LinkedIn for authorization'
    })
  } catch (error) {
    console.error('Error initiating LinkedIn OAuth:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}