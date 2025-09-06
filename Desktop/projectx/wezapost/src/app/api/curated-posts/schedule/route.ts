import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { schedulePost } from '@/lib/queue'
import { getCuratedPostByIdFromSupabase, updateCuratedPostInSupabase } from '@/lib/storage/supabase-curated-posts'

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

    // Get curated post content
    const post = await getCuratedPostByIdFromSupabase(userId, postId)

    if (!post) {
      return NextResponse.json({ error: 'Curated post not found' }, { status: 404 })
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

    // Update curated post status to indicate it's been queued
    const updated = await updateCuratedPostInSupabase(userId, postId, {
      status: 'scheduled',
      scheduling: {
        ...post.scheduling,
        scheduled_for: scheduledFor,
        queue_job_id: job.id,
        queued_at: new Date().toISOString()
      }
    })

    if (!updated) {
      return NextResponse.json({ error: 'Failed to update curated post status' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      jobId: job.id,
      scheduledFor,
      message: 'Curated post scheduled successfully'
    })
  } catch (error) {
    console.error('Error scheduling curated post:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 