import { createClient } from '@supabase/supabase-js'
import { CuratedPost } from '@/types/curated-posts'
import type { Database } from '@/lib/supabase'

// Create a service role client for server-side operations (bypasses RLS)
const supabaseServiceRole = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Regular client for user operations
const supabaseClient = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export interface CuratedPostFilters {
  status?: CuratedPost['status']
  platform?: string
  contentType?: CuratedPost['metadata']['content_type']
  limit?: number
  offset?: number
}

// Save a curated post (using service role for webhooks)
export async function saveCuratedPost(userId: string, post: CuratedPost, useServiceRole = false): Promise<boolean> {
  try {
    const client = useServiceRole ? supabaseServiceRole : supabaseClient
    
    // Transform CuratedPost to match database schema
    const dbPost = {
      id: post.id,
      user_id: userId,
      content: post.content,
      hashtags: post.hashtags,
      images: post.images,
      links: post.links,
      platforms: post.platforms,
      source: post.source,
      status: post.status,
      metadata: post.metadata,
      scheduling: post.scheduling,
      reviewed_by: post.reviewed_by,
      reviewed_at: post.reviewed_at,
      created_at: post.created_at,
      updated_at: post.updated_at
    }

    const { data, error } = await client
      .from('curated_posts')
      .insert(dbPost)
      .select()
      .single()

    if (error) {
      console.error('❌ Supabase save error:', error)
      return false
    }

    console.log('💾 Curated post saved to Supabase:', {
      id: data.id,
      userId,
      content_preview: post.content.substring(0, 50) + '...',
      status: data.status
    })

    return true
  } catch (error) {
    console.error('❌ Error saving curated post to Supabase:', error)
    return false
  }
}

// Get curated posts with filtering
export async function getCuratedPostsFromSupabase(userId: string, filters: CuratedPostFilters = {}): Promise<CuratedPost[]> {
  try {
    // For now, get posts from both user's own posts AND webhook posts
    let query = supabaseClient
      .from('curated_posts')
      .select('*')
      .or(`user_id.eq.${userId},user_id.eq.webhook_global`)
      .order('created_at', { ascending: false })

    // Apply filters
    if (filters.status) {
      query = query.eq('status', filters.status)
    }

    if (filters.platform) {
      query = query.contains('platforms', [filters.platform])
    }

    if (filters.contentType) {
      query = query.eq('metadata->>content_type', filters.contentType)
    }

    // Apply pagination
    const limit = filters.limit || 20
    const offset = filters.offset || 0
    query = query.range(offset, offset + limit - 1)

    const { data, error } = await query

    if (error) {
      console.error('❌ Supabase fetch error:', error)
      return []
    }

    // Transform database records back to CuratedPost format and deduplicate by ID
    const curatedPostsMap = new Map<string, CuratedPost>()
    
    ;(data || []).forEach(dbPost => {
      const curatedPost: CuratedPost = {
        id: dbPost.id,
        content: dbPost.content,
        hashtags: dbPost.hashtags || [],
        images: dbPost.images || [],
        links: dbPost.links || [],
        platforms: dbPost.platforms || ['twitter'],
        source: dbPost.source,
        status: dbPost.status as CuratedPost['status'],
        metadata: dbPost.metadata,
        scheduling: dbPost.scheduling,
        reviewed_by: dbPost.reviewed_by,
        reviewed_at: dbPost.reviewed_at,
        created_at: dbPost.created_at,
        updated_at: dbPost.updated_at
      }
      
      // Use Map to ensure unique IDs (last one wins)
      curatedPostsMap.set(dbPost.id, curatedPost)
    })
    
    const curatedPosts = Array.from(curatedPostsMap.values())

    console.log('📂 Loaded curated posts from Supabase:', {
      userId,
      count: curatedPosts.length,
      originalCount: data?.length || 0,
      filters
    })

    return curatedPosts
  } catch (error) {
    console.error('❌ Error loading curated posts from Supabase:', error)
    return []
  }
}

// Get a single curated post by ID
export async function getCuratedPostByIdFromSupabase(userId: string, postId: string): Promise<CuratedPost | null> {
  try {
    const { data, error } = await supabaseClient
      .from('curated_posts')
      .select('*')
      .or(`user_id.eq.${userId},user_id.eq.webhook_global`)
      .eq('id', postId)
      .single()

    if (error) {
      console.error('❌ Supabase fetch single post error:', error)
      return null
    }

    if (!data) return null

    // Transform database record back to CuratedPost format
    const curatedPost: CuratedPost = {
      id: data.id,
      content: data.content,
      hashtags: data.hashtags || [],
      images: data.images || [],
      links: data.links || [],
      platforms: data.platforms || ['twitter'],
      source: data.source,
      status: data.status as CuratedPost['status'],
      metadata: data.metadata,
      scheduling: data.scheduling,
      reviewed_by: data.reviewed_by,
      reviewed_at: data.reviewed_at,
      created_at: data.created_at,
      updated_at: data.updated_at
    }

    return curatedPost
  } catch (error) {
    console.error('❌ Error fetching curated post from Supabase:', error)
    return null
  }
}

// Update a curated post
export async function updateCuratedPostInSupabase(userId: string, postId: string, updates: Partial<CuratedPost>): Promise<boolean> {
  try {
    // Prepare database updates
    const dbUpdates: any = {
      updated_at: new Date().toISOString()
    }

    // Map CuratedPost fields to database fields
    if (updates.content !== undefined) dbUpdates.content = updates.content
    if (updates.hashtags !== undefined) dbUpdates.hashtags = updates.hashtags
    if (updates.images !== undefined) dbUpdates.images = updates.images
    if (updates.links !== undefined) dbUpdates.links = updates.links
    if (updates.platforms !== undefined) dbUpdates.platforms = updates.platforms
    if (updates.source !== undefined) dbUpdates.source = updates.source
    if (updates.status !== undefined) dbUpdates.status = updates.status
    if (updates.metadata !== undefined) dbUpdates.metadata = updates.metadata
    if (updates.scheduling !== undefined) dbUpdates.scheduling = updates.scheduling
    if (updates.reviewed_by !== undefined) dbUpdates.reviewed_by = updates.reviewed_by
    if (updates.reviewed_at !== undefined) dbUpdates.reviewed_at = updates.reviewed_at

    const { data, error } = await supabaseClient
      .from('curated_posts')
      .update(dbUpdates)
      .or(`user_id.eq.${userId},user_id.eq.webhook_global`)
      .eq('id', postId)
      .select()
      .single()

    if (error) {
      console.error('❌ Supabase update error:', error)
      return false
    }

    console.log('✏️ Curated post updated in Supabase:', {
      id: postId,
      userId,
      updated_fields: Object.keys(updates)
    })

    return true
  } catch (error) {
    console.error('❌ Error updating curated post in Supabase:', error)
    return false
  }
}

// Delete a curated post
export async function deleteCuratedPostFromSupabase(userId: string, postId: string): Promise<boolean> {
  try {
    const { error } = await supabaseClient
      .from('curated_posts')
      .delete()
      .or(`user_id.eq.${userId},user_id.eq.webhook_global`)
      .eq('id', postId)

    if (error) {
      console.error('❌ Supabase delete error:', error)
      return false
    }

    console.log('🗑️ Curated post deleted from Supabase:', {
      id: postId,
      userId
    })

    return true
  } catch (error) {
    console.error('❌ Error deleting curated post from Supabase:', error)
    return false
  }
}

// Get storage statistics
export async function getSupabaseStorageStats(): Promise<Record<string, any>> {
  try {
    const { data, error } = await supabaseServiceRole
      .from('curated_posts')
      .select('user_id, status, created_at')

    if (error) {
      console.error('❌ Supabase stats error:', error)
      return {}
    }

    const userStats = data.reduce((acc: any, post) => {
      if (!acc[post.user_id]) {
        acc[post.user_id] = { total: 0, by_status: {} }
      }
      acc[post.user_id].total++
      acc[post.user_id].by_status[post.status] = (acc[post.user_id].by_status[post.status] || 0) + 1
      return acc
    }, {})

    return {
      totalPosts: data.length,
      totalUsers: Object.keys(userStats).length,
      userStats,
      storageType: 'supabase'
    }
  } catch (error) {
    console.error('❌ Error getting Supabase storage stats:', error)
    return {}
  }
}

// Helper function to save webhook posts (uses anon key temporarily since service role key is not working)
export async function saveWebhookCuratedPost(post: CuratedPost): Promise<boolean> {
  // For webhook posts, we'll save them with a special user_id that can be accessed by all users
  // Temporarily using anon key instead of service role key
  return await saveCuratedPost('webhook_global', post, false)
}