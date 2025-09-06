import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Use Google OAuth credentials for YouTube
    const clientId = process.env.GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET
    
    if (!clientId || !clientSecret) {
      return NextResponse.json({ 
        error: 'YouTube OAuth not configured',
        message: 'Please configure your Google OAuth credentials for YouTube integration'
      }, { status: 400 })
    }

    // Generate state parameter for security
    const state = Buffer.from(JSON.stringify({
      userId: session.user.id,
      timestamp: Date.now()
    })).toString('base64')

    // YouTube requires specific Google OAuth 2.0 scopes
    const scopes = [
      'openid',
      'profile',
      'email',
      'https://www.googleapis.com/auth/youtube.upload',
      'https://www.googleapis.com/auth/youtube.readonly'
    ]
    
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
    
    authUrl.searchParams.append('response_type', 'code')
    authUrl.searchParams.append('client_id', clientId)
    authUrl.searchParams.append('redirect_uri', `${process.env.NEXTAUTH_URL}/api/social/youtube/callback`)
    authUrl.searchParams.append('scope', scopes.join(' '))
    authUrl.searchParams.append('state', state)
    authUrl.searchParams.append('access_type', 'offline') // Required for refresh token
    authUrl.searchParams.append('prompt', 'consent') // Force consent screen to get refresh token

    return NextResponse.json({
      success: true,
      authUrl: authUrl.toString(),
      message: 'Redirect to Google for YouTube authorization'
    })
  } catch (error) {
    console.error('Error initiating YouTube OAuth:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}