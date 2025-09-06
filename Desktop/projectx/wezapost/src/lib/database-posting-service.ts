import { supabaseAdmin } from './supabase-admin'

interface PostingResult {
  platform: string
  success: boolean
  postId?: string
  url?: string
  error?: string
  publishedAt?: string
}

interface PlatformPost {
  platform: string
  post_id: string | null
  status: 'pending' | 'published' | 'failed'
  error_message: string | null
  published_at: string | null
  url?: string
}

export class DatabasePostingService {
  private supabase = supabaseAdmin

  /**
   * Update post status and platform results in the database
   */
  async updatePostResults(
    postId: string,
    userId: string,
    results: PostingResult[]
  ): Promise<boolean> {
    try {
      console.log(`Updating post results for post ${postId}:`, results)

      // Convert posting results to platform_posts format
      const platformPosts: PlatformPost[] = results.map(result => ({
        platform: result.platform,
        post_id: result.success ? result.postId || null : null,
        status: result.success ? 'published' as const : 'failed' as const,
        error_message: result.success ? null : result.error || 'Unknown error',
        published_at: result.success ? result.publishedAt || new Date().toISOString() : null,
        url: result.url || undefined
      }))

      // Determine overall post status
      const hasFailures = results.some(r => !r.success)
      const hasSuccesses = results.some(r => r.success)
      let overallStatus: 'published' | 'failed' | 'partial'
      
      if (hasSuccesses && !hasFailures) {
        overallStatus = 'published'
      } else if (hasSuccesses && hasFailures) {
        overallStatus = 'partial'
      } else {
        overallStatus = 'failed'
      }

      // Update the post in the database using service role
      const { error } = await this.supabase
        .from('posts')
        .update({
          status: overallStatus,
          platform_posts: platformPosts,
          updated_at: new Date().toISOString()
        })
        .eq('id', postId)
        .eq('user_id', userId)

      if (error) {
        console.error('Error updating post results:', error)
        return false
      }

      console.log(`✅ Successfully updated post ${postId} with results`)
      return true

    } catch (error) {
      console.error('Failed to update post results:', error)
      return false
    }
  }

  /**
   * Create a new post in the database
   */
  async createPost(
    userId: string,
    content: string,
    platforms: string[],
    scheduledFor?: string,
    media?: string[]
  ): Promise<string | null> {
    try {
      // Handle different user ID types
      const isWebhookUser = userId === 'webhook_global' || userId === 'n8n_user' || userId === 'demo_user'
      
      if (isWebhookUser) {
        console.log('Webhook user detected, using curated_posts table instead of posts table')
        return await this.createCuratedPost(userId, content, platforms, scheduledFor, media)
      }

      // Validate userId is a valid UUID for regular posts
      if (!this.isValidUUID(userId)) {
        console.error('Invalid UUID for user_id:', userId)
        return null
      }

      const postData = {
        user_id: userId,
        content: content.trim(),
        platforms: platforms,
        scheduled_for: scheduledFor ? new Date(scheduledFor).toISOString() : null,
        status: scheduledFor ? 'scheduled' as const : 'draft' as const,
        media_urls: media || [],
        platform_posts: platforms.map(platform => ({
          platform,
          post_id: null,
          status: 'pending' as const,
          error_message: null,
          published_at: null
        }))
      }

      // Use service role client to bypass RLS
      const { data, error } = await this.supabase
        .from('posts')
        .insert(postData)
        .select('id')
        .single()

      if (error) {
        console.error('Error creating post:', error)
        // If RLS is blocking, try a different approach
        if (error.message.includes('policy') || error.message.includes('RLS')) {
          console.log('RLS blocking access, trying alternative approach...')
          return await this.createPostAlternative(userId, content, platforms, scheduledFor, media)
        }
        return null
      }

      console.log(`✅ Created post ${data.id} in database`)
      return data.id

    } catch (error) {
      console.error('Failed to create post:', error)
      return null
    }
  }

  /**
   * Create a curated post (for webhook users)
   */
  private async createCuratedPost(
    userId: string,
    content: string,
    platforms: string[],
    scheduledFor?: string,
    media?: string[]
  ): Promise<string | null> {
    try {
      const postData = {
        user_id: userId,
        content: content.trim(),
        platforms: platforms,
        status: scheduledFor ? 'scheduled' as const : 'draft' as const,
        hashtags: [],
        images: media || [],
        links: [],
        source: {
          type: 'manual',
          created_at: new Date().toISOString()
        },
        metadata: {
          character_count: content.length,
          content_type: 'text',
          topics: [],
          sentiment: 'neutral'
        },
        scheduling: {
          suggested_time: scheduledFor,
          optimal_platforms: platforms,
          priority: 'medium'
        }
      }

      const { data, error } = await this.supabase
        .from('curated_posts')
        .insert(postData)
        .select('id')
        .single()

      if (error) {
        console.error('Error creating curated post:', error)
        return null
      }

      console.log(`✅ Created curated post ${data.id} in database`)
      return data.id

    } catch (error) {
      console.error('Failed to create curated post:', error)
      return null
    }
  }

  /**
   * Alternative post creation method that handles RLS issues
   */
  private async createPostAlternative(
    userId: string,
    content: string,
    platforms: string[],
    scheduledFor?: string,
    media?: string[]
  ): Promise<string | null> {
    try {
      // Validate userId is a valid UUID
      if (!this.isValidUUID(userId)) {
        console.error('Invalid UUID for user_id:', userId)
        return null
      }

      // Generate a UUID for the post
      const postId = crypto.randomUUID()
      
      const postData = {
        id: postId,
        user_id: userId,
        content: content.trim(),
        platforms: platforms,
        scheduled_for: scheduledFor ? new Date(scheduledFor).toISOString() : null,
        status: scheduledFor ? 'scheduled' as const : 'draft' as const,
        media_urls: media || [],
        platform_posts: platforms.map(platform => ({
          platform,
          post_id: null,
          status: 'pending' as const,
          error_message: null,
          published_at: null
        })),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      // Try direct insert with explicit ID
      const { error } = await this.supabase
        .from('posts')
        .insert(postData)

      if (error) {
        console.error('Alternative post creation also failed:', error)
        return null
      }

      console.log(`✅ Created post ${postId} using alternative method`)
      return postId

    } catch (error) {
      console.error('Failed to create post with alternative method:', error)
      return null
    }
  }

  /**
   * Validate if a string is a valid UUID
   */
  private isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    return uuidRegex.test(uuid)
  }

  /**
   * Get post by ID
   */
  async getPost(postId: string, userId: string): Promise<any | null> {
    try {
      const { data, error } = await this.supabase
        .from('posts')
        .select('*')
        .eq('id', postId)
        .eq('user_id', userId)
        .single()

      if (error) {
        console.error('Error fetching post:', error)
        return null
      }

      return data

    } catch (error) {
      console.error('Failed to fetch post:', error)
      return null
    }
  }

  /**
   * Update post status
   */
  async updatePostStatus(
    postId: string,
    userId: string,
    status: 'draft' | 'scheduled' | 'published' | 'failed' | 'partial'
  ): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('posts')
        .update({
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', postId)
        .eq('user_id', userId)

      if (error) {
        console.error('Error updating post status:', error)
        return false
      }

      return true

    } catch (error) {
      console.error('Failed to update post status:', error)
      return false
    }
  }

  /**
   * Get user's posts
   */
  async getUserPosts(userId: string, limit: number = 50): Promise<any[]> {
    try {
      const { data, error } = await this.supabase
        .from('posts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Error fetching user posts:', error)
        return []
      }

      return data || []

    } catch (error) {
      console.error('Failed to fetch user posts:', error)
      return []
    }
  }

  /**
   * Delete post
   */
  async deletePost(postId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('posts')
        .delete()
        .eq('id', postId)
        .eq('user_id', userId)

      if (error) {
        console.error('Error deleting post:', error)
        return false
      }

      return true

    } catch (error) {
      console.error('Failed to delete post:', error)
      return false
    }
  }
}

// Export singleton instance
export const databasePostingService = new DatabasePostingService() 