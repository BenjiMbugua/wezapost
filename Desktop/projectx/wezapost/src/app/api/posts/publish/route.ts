import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { createSupabaseClientComponentClient } from '@/lib/supabase'
import { socialPostingService } from '@/lib/social-posting-service'
import { databasePostingService } from '@/lib/database-posting-service'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { postId, platforms } = await request.json()

    // Validate input
    if (!postId || !platforms || !Array.isArray(platforms)) {
      return NextResponse.json(
        { error: 'Missing required fields: postId, platforms' },
        { status: 400 }
      )
    }

    const supabase = createSupabaseClientComponentClient()
    
    // Get post content and verify ownership
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('*')
      .eq('id', postId)
      .eq('user_id', session.user.id)
      .single()

    if (postError || !post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Use real social posting service
    const results = await socialPostingService.postToPlatforms(
      session.user.id,
      platforms,
      post.content,
      post.media_urls
    )

    // Save results to database
    const dbUpdateSuccess = await databasePostingService.updatePostResults(
      postId,
      session.user.id,
      results
    )

    if (!dbUpdateSuccess) {
      console.error('Failed to save posting results to database')
      return NextResponse.json({ error: 'Failed to save posting results' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      results: results,
      message: 'Post published successfully'
    })
  } catch (error) {
    console.error('Error publishing post:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}