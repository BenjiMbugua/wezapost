import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Facebook OAuth URL with required scopes for posting
    const facebookAuthUrl = new URL('https://www.facebook.com/v18.0/dialog/oauth')
    const params = {
      client_id: process.env.FACEBOOK_CLIENT_ID!,
      redirect_uri: `${process.env.NEXTAUTH_URL}/api/social/facebook/callback`,
      scope: [
        'pages_manage_posts',        // Post to pages
        'pages_read_engagement',     // Read page data
        'pages_show_list',          // Access page list
        'business_management',       // Business Manager access
        'instagram_basic',          // Basic Instagram access
        'instagram_content_publish' // Publish to Instagram
      ].join(','),
      response_type: 'code',
      state: session.user.id, // Pass user ID as state for security
    }

    // Add parameters to URL
    Object.entries(params).forEach(([key, value]) => {
      facebookAuthUrl.searchParams.set(key, value)
    })

    return NextResponse.json({
      success: true,
      authUrl: facebookAuthUrl.toString(),
      message: 'Redirect to this URL to connect Facebook account'
    })

  } catch (error: any) {
    console.error('Facebook connect error:', error)
    return NextResponse.json(
      { error: 'Failed to generate Facebook auth URL', details: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  return NextResponse.redirect('/api/social/facebook/connect')
}