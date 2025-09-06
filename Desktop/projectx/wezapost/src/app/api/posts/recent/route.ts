import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { createSupabaseClientComponentClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')

    // Check if the user ID is a UUID format
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(session.user.id)
    
    if (!isUUID) {
      console.log('User ID is not UUID format, returning empty posts for now:', session.user.id)
      // Return empty posts for non-UUID users (Google OAuth users)
      return NextResponse.json({
        success: true,
        posts: [],
        total: 0,
        message: 'Database requires UUID user format. Recent posts will be available after account migration.'
      })
    }

    const supabase = createSupabaseClientComponentClient()
    
    // Get recent posts for the user
    const { data: posts, error } = await supabase
      .from('posts')
      .select(`
        id,
        content,
        platforms,
        status,
        published_at,
        platform_posts,
        media_urls,
        created_at
      `)
      .eq('user_id', session.user.id)
      .in('status', ['published', 'failed'])
      .order('published_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching recent posts:', error)
      return NextResponse.json({ 
        error: 'Failed to fetch recent posts',
        details: error.message 
      }, { status: 500 })
    }

    // Format posts for display
    const formattedPosts = posts?.map(post => ({
      id: post.id,
      content: post.content?.substring(0, 100) + (post.content?.length > 100 ? '...' : ''),
      fullContent: post.content,
      platforms: post.platforms || [],
      status: post.status,
      publishedAt: post.published_at,
      createdAt: post.created_at,
      platformPosts: post.platform_posts || [],
      mediaUrls: post.media_urls || [],
      // Generate display URLs for each platform
      urls: (post.platform_posts || []).map((pp: any) => ({
        platform: pp.platform,
        url: pp.url || `https://${pp.platform}.com/${pp.post_id}`,
        postId: pp.post_id
      }))
    })) || []

    return NextResponse.json({
      success: true,
      posts: formattedPosts,
      total: formattedPosts.length
    })

  } catch (error: any) {
    console.error('Recent posts API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}