import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the access token from localStorage data (from URL params)
    const { searchParams } = new URL(request.url)
    const accessToken = searchParams.get('token')
    const pageId = searchParams.get('pageId')

    if (!accessToken || !pageId) {
      return NextResponse.json({ 
        error: 'Missing token or pageId parameters',
        usage: 'GET /api/debug-facebook-permissions?token=YOUR_TOKEN&pageId=YOUR_PAGE_ID'
      }, { status: 400 })
    }

    console.log('Debugging Facebook permissions for page:', pageId)

    // Check what permissions the token has
    const permissionsResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/permissions?access_token=${accessToken}`
    )
    
    let permissions = []
    if (permissionsResponse.ok) {
      const permissionsData = await permissionsResponse.json()
      permissions = permissionsData.data || []
    }

    // Check page info and permissions
    const pageResponse = await fetch(
      `https://graph.facebook.com/v18.0/${pageId}?fields=id,name,category,tasks&access_token=${accessToken}`
    )
    
    let pageInfo = null
    if (pageResponse.ok) {
      pageInfo = await pageResponse.json()
    }

    // Test if we can get the page's posts (requires pages_read_engagement)
    const postsResponse = await fetch(
      `https://graph.facebook.com/v18.0/${pageId}/posts?limit=1&access_token=${accessToken}`
    )
    
    let postsAccess = null
    if (postsResponse.ok) {
      const postsData = await postsResponse.json()
      postsAccess = { success: true, count: postsData.data?.length || 0 }
    } else {
      const errorData = await postsResponse.json()
      postsAccess = { success: false, error: errorData.error?.message }
    }

    // Test posting permissions by trying to get publishing limits
    const publishingResponse = await fetch(
      `https://graph.facebook.com/v18.0/${pageId}?fields=posts.limit(1)&access_token=${accessToken}`
    )
    
    let publishingAccess = null
    if (publishingResponse.ok) {
      publishingAccess = { success: true }
    } else {
      const errorData = await publishingResponse.json()
      publishingAccess = { success: false, error: errorData.error?.message }
    }

    return NextResponse.json({
      pageId,
      pageInfo,
      permissions: permissions.map(p => ({ permission: p.permission, status: p.status })),
      accessChecks: {
        postsAccess,
        publishingAccess
      },
      requiredPermissions: [
        'pages_read_engagement',
        'pages_manage_posts'
      ]
    })

  } catch (error: any) {
    console.error('Debug Facebook permissions error:', error)
    return NextResponse.json({
      error: 'Failed to debug Facebook permissions',
      details: error.message
    }, { status: 500 })
  }
}