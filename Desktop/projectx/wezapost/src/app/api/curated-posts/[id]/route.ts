import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { CuratedPost } from '@/types/curated-posts'
import { 
  getCuratedPostByIdFromSupabase, 
  updateCuratedPostInSupabase, 
  deleteCuratedPostFromSupabase 
} from '@/lib/storage/supabase-curated-posts'

// GET - Fetch specific curated post
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params
    
    // Allow demo mode access
    const userId = session?.user?.id || 'demo_user'
    if (!session?.user?.id && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const post = await getCuratedPostByIdFromSupabase(userId, id)

    if (!post) {
      return NextResponse.json({ error: 'Curated post not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: post
    })

  } catch (error: any) {
    console.error('Error fetching curated post:', error)
    return NextResponse.json(
      { error: 'Failed to fetch curated post', details: error.message },
      { status: 500 }
    )
  }
}

// PUT - Update curated post
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params
    
    // Allow demo mode access
    const userId = session?.user?.id || 'demo_user'
    if (!session?.user?.id && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const updates = await request.json()
    
    // Get current post first
    const currentPost = await getCuratedPostByIdFromSupabase(userId, id)
    if (!currentPost) {
      return NextResponse.json({ error: 'Curated post not found' }, { status: 404 })
    }

    // Prepare updates with metadata
    const finalUpdates = {
      ...updates,
      updated_at: new Date().toISOString(),
      metadata: {
        ...currentPost.metadata,
        ...updates.metadata,
        character_count: updates.content ? updates.content.length : currentPost.metadata.character_count
      }
    }

    // Add review information if status is being changed to reviewed/approved
    if (updates.status && ['reviewed', 'approved'].includes(updates.status)) {
      finalUpdates.reviewed_by = session?.user?.email || session?.user?.id || 'demo_user'
      finalUpdates.reviewed_at = new Date().toISOString()
    }

    const updated = await updateCuratedPostInSupabase(userId, id, finalUpdates)

    if (!updated) {
      return NextResponse.json({ error: 'Failed to update curated post' }, { status: 500 })
    }

    // Get the updated post
    const updatedPost = await getCuratedPostByIdFromSupabase(userId, id)

    console.log('✏️ Curated post updated:', {
      id: id,
      status: updatedPost?.status,
      updated_fields: Object.keys(updates)
    })

    return NextResponse.json({
      success: true,
      data: updatedPost,
      message: 'Curated post updated successfully'
    })

  } catch (error: any) {
    console.error('Error updating curated post:', error)
    return NextResponse.json(
      { error: 'Failed to update curated post', details: error.message },
      { status: 500 }
    )
  }
}

// DELETE - Delete curated post
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params
    
    // Allow demo mode access
    const userId = session?.user?.id || 'demo_user'
    if (!session?.user?.id && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the post before deleting for logging
    const postToDelete = await getCuratedPostByIdFromSupabase(userId, id)
    if (!postToDelete) {
      return NextResponse.json({ error: 'Curated post not found' }, { status: 404 })
    }

    const deleted = await deleteCuratedPostFromSupabase(userId, id)

    if (!deleted) {
      return NextResponse.json({ error: 'Failed to delete curated post' }, { status: 500 })
    }

    console.log('🗑️ Curated post deleted:', {
      id: postToDelete.id,
      content_preview: postToDelete.content.substring(0, 50) + '...'
    })

    return NextResponse.json({
      success: true,
      message: 'Curated post deleted successfully'
    })

  } catch (error: any) {
    console.error('Error deleting curated post:', error)
    return NextResponse.json(
      { error: 'Failed to delete curated post', details: error.message },
      { status: 500 }
    )
  }
}