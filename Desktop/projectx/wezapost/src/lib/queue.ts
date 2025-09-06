import Bull, { Job, Queue } from 'bull'
import { getRedisClient } from './redis'
import { socialPostingService } from './social-posting-service'
import { databasePostingService } from './database-posting-service'

// Queue configuration
const REDIS_CONFIG = {
  redis: {
    port: parseInt(process.env.REDIS_PORT || '6379'),
    host: process.env.REDIS_HOST || 'localhost',
    password: process.env.REDIS_PASSWORD || undefined,
  }
}

// Job types
export interface PostJobData {
  postId: string
  userId: string
  platforms: string[]
  content: string
  media?: string[]
  scheduledFor: Date
}

export interface RecurringPostJobData {
  templateId: string
  userId: string
  platforms: string[]
  content: string
  cronExpression: string
}

// Queue instances
let postQueue: Queue<PostJobData> | null = null
let recurringQueue: Queue<RecurringPostJobData> | null = null

// Initialize queues
export const getPostQueue = (): Queue<PostJobData> => {
  if (!postQueue) {
    postQueue = new Bull<PostJobData>('post publishing', REDIS_CONFIG)
    
    // Process jobs
    postQueue.process('publish-post', async (job: Job<PostJobData>) => {
      return await processPostJob(job.data)
    })

    // Job event listeners
    postQueue.on('completed', (job, result) => {
      console.log(`Post job ${job.id} completed:`, result)
    })

    postQueue.on('failed', (job, err) => {
      console.error(`Post job ${job.id} failed:`, err)
    })

    postQueue.on('stalled', (job) => {
      console.warn(`Post job ${job.id} stalled`)
    })
  }
  return postQueue
}

export const getRecurringQueue = (): Queue<RecurringPostJobData> => {
  if (!recurringQueue) {
    recurringQueue = new Bull<RecurringPostJobData>('recurring posts', REDIS_CONFIG)
    
    // Process recurring jobs
    recurringQueue.process('create-recurring-post', async (job: Job<RecurringPostJobData>) => {
      return await processRecurringJob(job.data)
    })

    // Job event listeners
    recurringQueue.on('completed', (job, result) => {
      console.log(`Recurring job ${job.id} completed:`, result)
    })

    recurringQueue.on('failed', (job, err) => {
      console.error(`Recurring job ${job.id} failed:`, err)
    })
  }
  return recurringQueue
}

// Job processors
const processPostJob = async (data: PostJobData): Promise<{ success: boolean; results: any[] }> => {
  console.log(`Processing post job for post ${data.postId} on platforms:`, data.platforms)
  
  try {
    // Use real social posting service
    const results = await socialPostingService.postToPlatforms(
      data.userId,
      data.platforms,
      data.content,
      data.media
    )
    
    console.log('Real posting results:', results)
    
    // Save results to database
    const dbUpdateSuccess = await databasePostingService.updatePostResults(
      data.postId,
      data.userId,
      results
    )
    
    if (dbUpdateSuccess) {
      console.log(`✅ Successfully saved posting results to database for post ${data.postId}`)
    } else {
      console.error(`❌ Failed to save posting results to database for post ${data.postId}`)
    }
    
    // Log individual platform results
    for (const result of results) {
      if (result.success) {
        console.log(`✅ Successfully posted to ${result.platform}:`, result.postId)
      } else {
        console.error(`❌ Failed to post to ${result.platform}:`, result.error)
      }
    }
    
    return { success: true, results }
  } catch (error) {
    console.error('Error in processPostJob:', error)
    
    // Try to update database with error status
    try {
      await databasePostingService.updatePostStatus(data.postId, data.userId, 'failed')
    } catch (dbError) {
      console.error('Failed to update database with error status:', dbError)
    }
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      results: []
    }
  }
}

const processRecurringJob = async (data: RecurringPostJobData): Promise<{ success: boolean; nextRun?: Date }> => {
  console.log(`Processing recurring job for template ${data.templateId}`)
  
  // Create a new scheduled post based on the template
  const nextRunDate = calculateNextRun(data.cronExpression)
  
  // TODO: Create new post in database and schedule it
  // const newPost = await createPostFromTemplate(data.templateId, nextRunDate)
  // await schedulePost(newPost.id, nextRunDate)
  
  return { success: true, nextRun: nextRunDate }
}

// Mock function - replace with actual social media API calls
const mockPostToPlatform = async (platform: string, content: string, media?: string[]): Promise<any> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))
  
  // Simulate success/failure
  if (Math.random() > 0.1) { // 90% success rate
    return {
      postId: `${platform}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      url: `https://${platform}.com/post/${Date.now()}`,
      publishedAt: new Date().toISOString()
    }
  } else {
    throw new Error(`Failed to post to ${platform}: Mock API error`)
  }
}

// Utility functions
const calculateNextRun = (cronExpression: string): Date => {
  // Simple cron parser - in production use a proper cron library
  const now = new Date()
  
  // For demo purposes, just add 24 hours for daily posts
  if (cronExpression.includes('0 9 * * *')) { // Daily at 9 AM
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(9, 0, 0, 0)
    return tomorrow
  }
  
  // Default to next hour
  const nextHour = new Date(now)
  nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0)
  return nextHour
}

// Queue management functions
export const schedulePost = async (
  postId: string,
  userId: string,
  platforms: string[],
  content: string,
  scheduledFor: Date,
  media?: string[]
): Promise<Job<PostJobData>> => {
  const queue = getPostQueue()
  
  const jobData: PostJobData = {
    postId,
    userId,
    platforms,
    content,
    media,
    scheduledFor
  }
  
  const delay = scheduledFor.getTime() - Date.now()
  
  return await queue.add('publish-post', jobData, {
    delay: Math.max(0, delay),
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000
    },
    removeOnComplete: 10,
    removeOnFail: 5
  })
}

export const scheduleRecurringPost = async (
  templateId: string,
  userId: string,
  platforms: string[],
  content: string,
  cronExpression: string
): Promise<Job<RecurringPostJobData>> => {
  const queue = getRecurringQueue()
  
  const jobData: RecurringPostJobData = {
    templateId,
    userId,
    platforms,
    content,
    cronExpression
  }
  
  return await queue.add('create-recurring-post', jobData, {
    repeat: { cron: cronExpression },
    attempts: 3,
    removeOnComplete: 5,
    removeOnFail: 3
  })
}

export const cancelScheduledPost = async (jobId: string): Promise<boolean> => {
  const queue = getPostQueue()
  const job = await queue.getJob(jobId)
  
  if (job) {
    await job.remove()
    return true
  }
  
  return false
}

export const getQueueStats = async () => {
  const postQueue = getPostQueue()
  const recurringQueue = getRecurringQueue()
  
  const [
    postWaiting,
    postActive,
    postCompleted,
    postFailed,
    recurringWaiting,
    recurringActive,
    recurringCompleted,
    recurringFailed
  ] = await Promise.all([
    postQueue.getWaiting(),
    postQueue.getActive(),
    postQueue.getCompleted(),
    postQueue.getFailed(),
    recurringQueue.getWaiting(),
    recurringQueue.getActive(),
    recurringQueue.getCompleted(),
    recurringQueue.getFailed()
  ])
  
  return {
    posts: {
      waiting: postWaiting.length,
      active: postActive.length,
      completed: postCompleted.length,
      failed: postFailed.length
    },
    recurring: {
      waiting: recurringWaiting.length,
      active: recurringActive.length,
      completed: recurringCompleted.length,
      failed: recurringFailed.length
    }
  }
}

// Cleanup function
export const closeQueues = async () => {
  if (postQueue) {
    await postQueue.close()
    postQueue = null
  }
  
  if (recurringQueue) {
    await recurringQueue.close()
    recurringQueue = null
  }
}