import { CuratedPost } from '@/types/curated-posts'

// Shared in-memory storage for curated posts (in production, this would be a database)
let globalCuratedPostsStorage: Record<string, CuratedPost[]> = {}

export interface CuratedPostFilters {
  status?: CuratedPost['status']
  platform?: string
  contentType?: CuratedPost['metadata']['content_type']
  limit?: number
  offset?: number
}

// Save a curated post
export function saveCuratedPost(userId: string, post: CuratedPost): boolean {
  try {
    if (!globalCuratedPostsStorage[userId]) {
      globalCuratedPostsStorage[userId] = []
    }
    
    globalCuratedPostsStorage[userId].push(post)
    
    // Also save to a shared demo user account for demo purposes
    if (!globalCuratedPostsStorage['demo_user']) {
      globalCuratedPostsStorage['demo_user'] = []
    }
    globalCuratedPostsStorage['demo_user'].push(post)
    
    console.log(`📝 Curated post saved:`, {
      userId,
      postId: post.id,
      totalPosts: globalCuratedPostsStorage[userId].length,
      demoUserPosts: globalCuratedPostsStorage['demo_user'].length
    })
    
    return true
  } catch (error) {
    console.error('Error saving curated post:', error)
    return false
  }
}

// Get curated posts with filtering
export function getCuratedPostsFromStorage(userId: string, filters: CuratedPostFilters = {}): CuratedPost[] {
  // Combine posts from multiple sources for authenticated users
  let allPosts: CuratedPost[] = []
  
  // Add user's own posts if they exist
  if (globalCuratedPostsStorage[userId]) {
    allPosts = allPosts.concat(globalCuratedPostsStorage[userId])
  }
  
  // Add global curated posts (from webhooks) for all users
  if (globalCuratedPostsStorage['global_curated']) {
    allPosts = allPosts.concat(globalCuratedPostsStorage['global_curated'])
  }
  
  // Add n8n posts (legacy webhook posts) for all users
  if (globalCuratedPostsStorage['n8n_user']) {
    allPosts = allPosts.concat(globalCuratedPostsStorage['n8n_user'])
  }
  
  // Add demo posts if no user-specific posts
  if (globalCuratedPostsStorage['demo_user']) {
    allPosts = allPosts.concat(globalCuratedPostsStorage['demo_user'])
  }
  
  // Remove duplicates by ID
  const userPosts = allPosts.filter((post, index, self) => 
    index === self.findIndex(p => p.id === post.id)
  )
  
  console.log(`🔍 Getting curated posts:`, {
    userId,
    availablePosts: userPosts.length,
    filters,
    storage: Object.keys(globalCuratedPostsStorage)
  })
  
  // Apply filters
  let filtered = userPosts
  
  if (filters.status) {
    filtered = filtered.filter(post => post.status === filters.status)
  }
  
  if (filters.platform) {
    filtered = filtered.filter(post => post.platforms.includes(filters.platform))
  }
  
  if (filters.contentType) {
    filtered = filtered.filter(post => post.metadata.content_type === filters.contentType)
  }
  
  // Sort by created date (newest first)
  filtered = filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  
  return filtered
}

// Get a single curated post by ID
export function getCuratedPostById(userId: string, postId: string): CuratedPost | null {
  const userPosts = globalCuratedPostsStorage[userId] || globalCuratedPostsStorage['demo_user'] || []
  return userPosts.find(post => post.id === postId) || null
}

// Update a curated post
export function updateCuratedPost(userId: string, postId: string, updates: Partial<CuratedPost>): boolean {
  try {
    const userPosts = globalCuratedPostsStorage[userId] || globalCuratedPostsStorage['demo_user'] || []
    const postIndex = userPosts.findIndex(post => post.id === postId)
    
    if (postIndex === -1) return false
    
    userPosts[postIndex] = {
      ...userPosts[postIndex],
      ...updates,
      updated_at: new Date().toISOString()
    }
    
    console.log(`✏️ Curated post updated:`, {
      userId,
      postId,
      updates: Object.keys(updates)
    })
    
    return true
  } catch (error) {
    console.error('Error updating curated post:', error)
    return false
  }
}

// Delete a curated post
export function deleteCuratedPost(userId: string, postId: string): boolean {
  try {
    if (globalCuratedPostsStorage[userId]) {
      const initialLength = globalCuratedPostsStorage[userId].length
      globalCuratedPostsStorage[userId] = globalCuratedPostsStorage[userId].filter(post => post.id !== postId)
      const deleted = initialLength > globalCuratedPostsStorage[userId].length
      
      if (deleted) {
        console.log(`🗑️ Curated post deleted:`, { userId, postId })
        return true
      }
    }
    
    // Also try demo_user storage
    if (globalCuratedPostsStorage['demo_user']) {
      const initialLength = globalCuratedPostsStorage['demo_user'].length
      globalCuratedPostsStorage['demo_user'] = globalCuratedPostsStorage['demo_user'].filter(post => post.id !== postId)
      const deleted = initialLength > globalCuratedPostsStorage['demo_user'].length
      
      if (deleted) {
        console.log(`🗑️ Curated post deleted from demo_user:`, { postId })
        return true
      }
    }
    
    return false
  } catch (error) {
    console.error('Error deleting curated post:', error)
    return false
  }
}

// Get storage statistics
export function getStorageStats(): Record<string, any> {
  return {
    totalUsers: Object.keys(globalCuratedPostsStorage).length,
    userStats: Object.entries(globalCuratedPostsStorage).map(([userId, posts]) => ({
      userId,
      postCount: posts.length,
      latestPost: posts.length > 0 ? posts[posts.length - 1].created_at : null
    }))
  }
}