import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // TikTok OAuth URL with required scopes for posting
    const tiktokAuthUrl = new URL('https://www.tiktok.com/v2/auth/authorize/')
    const params = {
      client_key: process.env.TIKTOK_CLIENT_KEY!,
      redirect_uri: `${process.env.NEXTAUTH_URL}/api/social/tiktok/callback`,
      response_type: 'code',
      scope: [
        'user.info.basic',     // Basic user info
        'video.upload',        // Upload videos
        'video.publish'        // Publish videos
      ].join(','),
      state: session.user.id, // Pass user ID as state for security
    }

    // Add parameters to URL
    Object.entries(params).forEach(([key, value]) => {
      tiktokAuthUrl.searchParams.set(key, value)
    })

    return NextResponse.json({
      success: true,
      authUrl: tiktokAuthUrl.toString(),
      message: 'Redirect to this URL to connect TikTok account'
    })

  } catch (error: any) {
    console.error('TikTok connect error:', error)
    return NextResponse.json(
      { error: 'Failed to generate TikTok auth URL', details: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  return NextResponse.redirect('/api/social/tiktok/connect')
}