"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ExternalLink, RefreshCw } from 'lucide-react'

interface PlatformPost {
  platform: string
  url: string
  postId: string
}

interface RecentPost {
  id: string
  content: string
  fullContent: string
  platforms: string[]
  status: string
  publishedAt: string | null
  createdAt: string
  platformPosts: any[]
  mediaUrls: string[]
  urls: PlatformPost[]
}

export function RecentPosts({ limit = 5 }: { limit?: number }) {
  const [posts, setPosts] = useState<RecentPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchRecentPosts = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/posts/recent?limit=${limit}`)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch recent posts')
      }
      
      setPosts(data.posts || [])
    } catch (err: any) {
      console.error('Error fetching recent posts:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRecentPosts()
  }, [limit])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      case 'failed': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      case 'scheduled': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    }
  }

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'facebook': return '📘'
      case 'instagram': return '📸'
      case 'twitter': return '🐦'
      case 'linkedin': return '💼'
      default: return '🌐'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Recent Posts
            <RefreshCw className="h-4 w-4 animate-spin" />
          </CardTitle>
          <CardDescription>
            Loading your latest posts...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Recent Posts
            <Button
              variant="outline"
              size="sm"
              onClick={fetchRecentPosts}
              className="h-8"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          </CardTitle>
          <CardDescription>
            Failed to load recent posts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-red-600 dark:text-red-400 font-mono">
            Error: {error}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Recent Posts
          <Button
            variant="outline"
            size="sm"
            onClick={fetchRecentPosts}
            className="h-8"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Refresh
          </Button>
        </CardTitle>
        <CardDescription>
          Your latest social media posts
        </CardDescription>
      </CardHeader>
      <CardContent>
        {posts.length === 0 ? (
          <div className="text-sm text-muted-foreground font-mono text-center py-4">
            No posts in database yet.
            <br />
            <span className="text-xs">
              Posts are being saved to localStorage for now.
              <br />
              Database persistence requires UUID user format.
            </span>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map(post => (
              <div key={post.id} className="border-l-2 border-gray-200 dark:border-gray-700 pl-3 pb-3">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1">
                    <p className="text-sm text-foreground line-clamp-2">
                      {post.content}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">
                        {formatDate(post.publishedAt || post.createdAt)}
                      </span>
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${getStatusColor(post.status)}`}
                      >
                        {post.status}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {post.platforms.map(platform => (
                      <span key={platform} className="text-sm" title={platform}>
                        {getPlatformIcon(platform)}
                      </span>
                    ))}
                  </div>
                  
                  {post.urls.length > 0 && (
                    <div className="flex gap-1">
                      {post.urls.map((url, idx) => (
                        <Button
                          key={idx}
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs"
                          onClick={() => window.open(url.url, '_blank')}
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          View
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}