import * as cron from 'node-cron'
import { createSupabaseClientComponentClient } from './supabase'
import { schedulePost, getPostQueue } from './queue'

export class PostScheduler {
  private isRunning = false
  private cronJobs: Map<string, cron.ScheduledTask> = new Map()
  private supabase = createSupabaseClientComponentClient()

  // Start the scheduler
  start() {
    if (this.isRunning) {
      console.log('Scheduler already running')
      return
    }

    console.log('Starting post scheduler...')
    this.isRunning = true

    // Schedule job to run every minute to check for scheduled posts
    const task = cron.schedule('* * * * *', async () => {
      try {
        await this.processScheduledPosts()
      } catch (error) {
        console.error('Error in scheduled post processor:', error)
      }
    })

    this.cronJobs.set('main-scheduler', task)
    task.start()

    console.log('Post scheduler started')
  }

  // Stop the scheduler
  stop() {
    if (!this.isRunning) {
      console.log('Scheduler not running')
      return
    }

    console.log('Stopping post scheduler...')
    
    // Stop all cron jobs
    this.cronJobs.forEach((task, key) => {
      task.stop()
      task.destroy()
      console.log(`Stopped cron job: ${key}`)
    })
    
    this.cronJobs.clear()
    this.isRunning = false
    
    console.log('Post scheduler stopped')
  }

  // Process scheduled posts that are due
  private async processScheduledPosts() {
    try {
      const now = new Date()
      const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000) // 5 minutes buffer

      // Get posts scheduled for now or in the past (including 5-minute buffer for future posts)
      const { data: scheduledPosts, error } = await this.supabase
        .from('posts')
        .select('*')
        .eq('status', 'scheduled')
        .lte('scheduled_for', fiveMinutesFromNow.toISOString())
        .order('scheduled_for', { ascending: true })

      if (error) {
        console.error('Error fetching scheduled posts:', error)
        return
      }

      if (!scheduledPosts || scheduledPosts.length === 0) {
        return // No posts to process
      }

      console.log(`Processing ${scheduledPosts.length} scheduled posts`)

      for (const post of scheduledPosts) {
        try {
          await this.processPost(post)
        } catch (error) {
          console.error(`Error processing post ${post.id}:`, error)
          
          // Mark post as failed
          await this.updatePostStatus(post.id, 'failed')
        }
      }
    } catch (error) {
      console.error('Error in processScheduledPosts:', error)
    }
  }

  // Process individual post
  private async processPost(post: any) {
    const scheduledTime = new Date(post.scheduled_for)
    const now = new Date()

    // If the post is scheduled for the future (within 5 minutes), add it to the queue with delay
    if (scheduledTime > now) {
      const delay = scheduledTime.getTime() - now.getTime()
      
      await schedulePost(
        post.id,
        post.user_id,
        post.platforms,
        post.content,
        scheduledTime,
        post.media_urls
      )

      console.log(`Queued post ${post.id} for ${scheduledTime.toISOString()}`)
      
      // Update status to indicate it's been queued
      await this.updatePostStatus(post.id, 'scheduled', {
        queue_status: 'queued',
        queued_at: now.toISOString()
      })
    } else {
      // Post is due now or overdue, process immediately
      await this.publishPost(post)
    }
  }

  // Immediately publish a post
  private async publishPost(post: any) {
    try {
      console.log(`Publishing post ${post.id} immediately`)
      
      // Update status to publishing
      await this.updatePostStatus(post.id, 'published', {
        publishing_started_at: new Date().toISOString()
      })

      // Mock publishing process - replace with actual social media API calls
      const publishingResults = await this.mockPublishToSocialMedia(post)
      
      // Update platform_posts with results
      const updatedPlatformPosts = post.platform_posts.map((platformPost: any) => {
        const result = publishingResults.find((r: any) => r.platform === platformPost.platform)
        
        if (result) {
          return {
            ...platformPost,
            status: result.success ? 'published' : 'failed',
            post_id: result.success ? result.postId : null,
            error_message: result.success ? null : result.error,
            published_at: result.success ? new Date().toISOString() : null
          }
        }
        
        return platformPost
      })

      // Update the post with final results
      await this.supabase
        .from('posts')
        .update({
          platform_posts: updatedPlatformPosts,
          status: publishingResults.every((r: any) => r.success) ? 'published' : 'failed'
        })
        .eq('id', post.id)

      console.log(`Post ${post.id} published successfully`)
    } catch (error) {
      console.error(`Error publishing post ${post.id}:`, error)
      await this.updatePostStatus(post.id, 'failed')
      throw error
    }
  }

  // Mock function for social media publishing
  private async mockPublishToSocialMedia(post: any): Promise<any[]> {
    const results = []
    
    for (const platform of post.platforms) {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000))
      
      // Simulate success/failure (90% success rate)
      const success = Math.random() > 0.1
      
      if (success) {
        results.push({
          platform,
          success: true,
          postId: `${platform}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          url: `https://${platform}.com/post/${Date.now()}`
        })
      } else {
        results.push({
          platform,
          success: false,
          error: `Mock API error for ${platform}`
        })
      }
    }
    
    return results
  }

  // Update post status
  private async updatePostStatus(postId: string, status: string, additionalData?: any) {
    try {
      const updateData = {
        status,
        ...additionalData
      }

      const { error } = await this.supabase
        .from('posts')
        .update(updateData)
        .eq('id', postId)

      if (error) {
        console.error(`Error updating post ${postId} status:`, error)
      }
    } catch (error) {
      console.error(`Error updating post ${postId} status:`, error)
    }
  }

  // Schedule a recurring post
  scheduleRecurringPost(
    cronExpression: string,
    userId: string,
    content: string,
    platforms: string[],
    templateId?: string
  ) {
    const jobId = `recurring-${templateId || Date.now()}`
    
    if (this.cronJobs.has(jobId)) {
      console.log(`Recurring job ${jobId} already exists`)
      return false
    }

    try {
      const task = cron.schedule(cronExpression, async () => {
        try {
          console.log(`Creating recurring post from template ${templateId}`)
          
          // Create a new post entry
          const { data: newPost, error } = await this.supabase
            .from('posts')
            .insert({
              user_id: userId,
              content,
              platforms,
              status: 'published',
              scheduled_for: null,
              platform_posts: platforms.map(platform => ({
                platform,
                post_id: null,
                status: 'pending',
                error_message: null,
                published_at: null,
              })),
              ai_generated: false,
              recurring_template_id: templateId
            })
            .select()
            .single()

          if (error) {
            console.error('Error creating recurring post:', error)
            return
          }

          if (newPost) {
            // Immediately publish the recurring post
            await this.publishPost(newPost)
          }
        } catch (error) {
          console.error(`Error in recurring post job ${jobId}:`, error)
        }
      })

      this.cronJobs.set(jobId, task)
      task.start()
      
      console.log(`Scheduled recurring post job: ${jobId} with expression: ${cronExpression}`)
      return true
    } catch (error) {
      console.error(`Error scheduling recurring post ${jobId}:`, error)
      return false
    }
  }

  // Remove a recurring post
  removeRecurringPost(templateId: string) {
    const jobId = `recurring-${templateId}`
    
    if (this.cronJobs.has(jobId)) {
      const task = this.cronJobs.get(jobId)!
      task.stop()
      task.destroy()
      this.cronJobs.delete(jobId)
      
      console.log(`Removed recurring post job: ${jobId}`)
      return true
    }
    
    console.log(`Recurring post job ${jobId} not found`)
    return false
  }

  // Get scheduler status
  getStatus() {
    return {
      isRunning: this.isRunning,
      activeJobs: Array.from(this.cronJobs.keys()),
      jobCount: this.cronJobs.size
    }
  }
}

// Singleton instance
export const postScheduler = new PostScheduler()

// Auto-start in production
if (typeof window === 'undefined' && process.env.NODE_ENV === 'production') {
  postScheduler.start()
}