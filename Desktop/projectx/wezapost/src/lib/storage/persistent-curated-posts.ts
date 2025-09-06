import { CuratedPost } from '@/types/curated-posts'
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'

// File-based persistent storage for development
const STORAGE_DIR = join(process.cwd(), '.storage')
const STORAGE_FILE = join(STORAGE_DIR, 'curated-posts.json')

export interface CuratedPostFilters {
  status?: CuratedPost['status']
  platform?: string
  contentType?: CuratedPost['metadata']['content_type']
  limit?: number
  offset?: number
}

interface StorageData {
  [userId: string]: CuratedPost[]
}

// Ensure storage directory exists
function ensureStorageDir() {
  if (!existsSync(STORAGE_DIR)) {
    mkdirSync(STORAGE_DIR, { recursive: true })
  }
}

// Load data from file
function loadStorage(): StorageData {
  try {
    ensureStorageDir()
    if (existsSync(STORAGE_FILE)) {
      const data = readFileSync(STORAGE_FILE, 'utf-8')
      return JSON.parse(data)
    }
  } catch (error) {
    console.error('Error loading storage:', error)
  }
  return {}
}

// Save data to file
function saveStorage(data: StorageData) {
  try {
    ensureStorageDir()
    writeFileSync(STORAGE_FILE, JSON.stringify(data, null, 2))
  } catch (error) {
    console.error('Error saving storage:', error)
  }
}

// Save a curated post
export function saveCuratedPost(userId: string, post: CuratedPost): boolean {
  try {
    const storage = loadStorage()
    
    if (!storage[userId]) {
      storage[userId] = []
    }
    
    storage[userId].push(post)
    
    // Also save to global_curated and demo_user for compatibility
    if (!storage['global_curated']) {
      storage['global_curated'] = []
    }
    storage['global_curated'].push(post)
    
    if (!storage['demo_user']) {
      storage['demo_user'] = []
    }
    storage['demo_user'].push(post)
    
    saveStorage(storage)
    
    console.log(`💾 Curated post saved to file:`, {
      userId,
      postId: post.id,
      totalPosts: storage[userId].length,
      globalPosts: storage['global_curated'].length
    })
    
    return true
  } catch (error) {
    console.error('Error saving curated post:', error)
    return false
  }
}

// Get curated posts with filtering
export function getCuratedPostsFromStorage(userId: string, filters: CuratedPostFilters = {}): CuratedPost[] {
  try {
    const storage = loadStorage()
    
    // Combine posts from multiple sources
    let allPosts: CuratedPost[] = []
    
    // Add user's own posts
    if (storage[userId]) {
      allPosts = allPosts.concat(storage[userId])
    }
    
    // Add global curated posts (from webhooks)
    if (storage['global_curated']) {
      allPosts = allPosts.concat(storage['global_curated'])
    }
    
    // Add demo posts
    if (storage['demo_user']) {
      allPosts = allPosts.concat(storage['demo_user'])
    }
    
    // Remove duplicates by ID
    const userPosts = allPosts.filter((post, index, self) => 
      index === self.findIndex(p => p.id === post.id)
    )
    
    console.log(`📂 Loaded curated posts from file:`, {
      userId,
      availablePosts: userPosts.length,
      filters,
      storageKeys: Object.keys(storage),
      storageCounts: Object.entries(storage).map(([key, posts]) => `${key}:${posts.length}`)
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
    
  } catch (error) {
    console.error('Error loading curated posts:', error)
    return []
  }
}

// Get a single curated post by ID
export function getCuratedPostById(userId: string, postId: string): CuratedPost | null {
  const storage = loadStorage()
  const allPosts = [
    ...(storage[userId] || []),
    ...(storage['global_curated'] || []),
    ...(storage['demo_user'] || [])
  ]
  return allPosts.find(post => post.id === postId) || null
}

// Update a curated post
export function updateCuratedPost(userId: string, postId: string, updates: Partial<CuratedPost>): boolean {
  try {
    const storage = loadStorage()
    let updated = false
    
    // Update in all relevant storage buckets
    for (const key of [userId, 'global_curated', 'demo_user']) {
      if (storage[key]) {
        const postIndex = storage[key].findIndex(post => post.id === postId)
        if (postIndex !== -1) {
          storage[key][postIndex] = {
            ...storage[key][postIndex],
            ...updates,
            updated_at: new Date().toISOString()
          }
          updated = true
        }
      }
    }
    
    if (updated) {
      saveStorage(storage)
      console.log(`✏️ Curated post updated in file:`, { userId, postId, updates: Object.keys(updates) })
    }
    
    return updated
  } catch (error) {
    console.error('Error updating curated post:', error)
    return false
  }
}

// Delete a curated post
export function deleteCuratedPost(userId: string, postId: string): boolean {
  try {
    const storage = loadStorage()
    let deleted = false
    
    // Delete from all relevant storage buckets
    for (const key of [userId, 'global_curated', 'demo_user']) {
      if (storage[key]) {
        const initialLength = storage[key].length
        storage[key] = storage[key].filter(post => post.id !== postId)
        if (storage[key].length < initialLength) {
          deleted = true
        }
      }
    }
    
    if (deleted) {
      saveStorage(storage)
      console.log(`🗑️ Curated post deleted from file:`, { userId, postId })
    }
    
    return deleted
  } catch (error) {
    console.error('Error deleting curated post:', error)
    return false
  }
}

// Get storage statistics
export function getStorageStats(): Record<string, any> {
  const storage = loadStorage()
  return {
    totalUsers: Object.keys(storage).length,
    userStats: Object.entries(storage).map(([userId, posts]) => ({
      userId,
      postCount: posts.length,
      latestPost: posts.length > 0 ? posts[posts.length - 1].created_at : null
    })),
    storageFile: STORAGE_FILE
  }
}