import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Instagram API OAuth URL (via Facebook)
    const instagramAuthUrl = new URL('https://www.facebook.com/v18.0/dialog/oauth')
    const params = {
      client_id: process.env.INSTAGRAM_CLIENT_ID!,
      redirect_uri: `${process.env.NEXTAUTH_URL}/api/social/instagram/callback`,
      scope: 'instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement', // Instagram API scopes
      response_type: 'code',
      state: session.user.id, // Pass user ID as state for security
    }

    // Add parameters to URL
    Object.entries(params).forEach(([key, value]) => {
      instagramAuthUrl.searchParams.set(key, value)
    })

    return NextResponse.json({
      success: true,
      authUrl: instagramAuthUrl.toString(),
      message: 'Redirect to this URL to connect Instagram account',
      note: 'This uses Instagram Content Publishing API via Facebook - allows both profile access and posting capabilities.'
    })

  } catch (error: any) {
    console.error('Instagram connect error:', error)
    return NextResponse.json(
      { error: 'Failed to generate Instagram auth URL', details: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  return NextResponse.redirect('/api/social/instagram/connect')
}