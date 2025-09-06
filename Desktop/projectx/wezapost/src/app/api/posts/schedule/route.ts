import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { schedulePost } from '@/lib/queue'
import { createSupabaseClientComponentClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { postId, scheduledFor, platforms, userId } = await request.json()

    // Validate input
    if (!postId || !scheduledFor || !platforms || !Array.isArray(platforms)) {
      return NextResponse.json(
        { error: 'Missing required fields: postId, scheduledFor, platforms' },
        { status: 400 }
      )
    }

    // Verify user owns the post
    if (userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const supabase = createSupabaseClientComponentClient()
    
    // Get post content
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('content')
      .eq('id', postId)
      .eq('user_id', session.user.id)
      .single()

    if (postError || !post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Schedule the post with Redis queue
    const scheduledDate = new Date(scheduledFor)
    const job = await schedulePost(
      postId,
      session.user.id,
      platforms,
      post.content,
      scheduledDate
    )

    // Update post status to indicate it's been queued
    await supabase
      .from('posts')
      .update({
        status: 'scheduled',
        queue_job_id: job.id,
        queued_at: new Date().toISOString()
      })
      .eq('id', postId)

    return NextResponse.json({
      success: true,
      jobId: job.id,
      scheduledFor,
      message: 'Post scheduled successfully'
    })
  } catch (error) {
    console.error('Error scheduling post:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}