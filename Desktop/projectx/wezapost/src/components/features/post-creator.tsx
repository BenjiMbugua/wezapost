"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { SocialAccount, SocialProviderManager } from '@/lib/social-providers'
import { createSupabaseClientComponentClient } from '@/lib/supabase'
import { format } from 'date-fns'

interface Post {
  id: string
  title?: string
  content: string
  platforms: string[]
  status: 'draft' | 'scheduled' | 'published' | 'failed'
  scheduled_for?: string
  created_at: string
}

export function PostCreator() {
  const { data: session } = useSession()
  const [content, setContent] = useState('')
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
  const [accounts, setAccounts] = useState<SocialAccount[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  
  // Scheduling states
  const [scheduleMode, setScheduleMode] = useState<'now' | 'later'>('now')
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')

  const socialManager = new SocialProviderManager()
  const supabase = createSupabaseClientComponentClient()

  useEffect(() => {
    if (session?.user?.id) {
      loadData()
    }
  }, [session?.user?.id])

  const loadData = async () => {
    if (!session?.user?.id) return
    
    try {
      setLoading(true)
      // Load connected accounts
      const connectedAccounts = await socialManager.getConnectedAccounts(session.user.id)
      setAccounts(connectedAccounts)

      // Load recent posts
      const { data: postsData } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(10)

      if (postsData) {
        setPosts(postsData)
      }
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePlatformToggle = (platform: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(platform)
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    )
  }

  const handleCreatePost = async (action: 'draft' | 'publish' | 'schedule') => {
    if (!session?.user?.id || !content.trim()) return
    
    // Validation for scheduling
    if (action === 'schedule' && scheduleMode === 'later') {
      if (!scheduledDate || !scheduledTime) {
        alert('Please select both date and time for scheduling')
        return
      }
      
      const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`)
      if (scheduledDateTime <= new Date()) {
        alert('Scheduled time must be in the future')
        return
      }
    }
    
    setIsSubmitting(true)
    
    try {
      let scheduledFor = null
      let status: 'draft' | 'published' | 'scheduled' = 'draft'
      
      if (action === 'schedule' && scheduleMode === 'later') {
        scheduledFor = new Date(`${scheduledDate}T${scheduledTime}`).toISOString()
        status = 'scheduled'
      } else if (action === 'publish') {
        status = 'published'
      }
      
      const postData = {
        user_id: session.user.id,
        content: content.trim(),
        platforms: selectedPlatforms,
        status,
        scheduled_for: scheduledFor,
        platform_posts: selectedPlatforms.map(platform => ({
          platform,
          post_id: null,
          status: status === 'published' ? 'published' as const : 'pending' as const,
          error_message: null,
          published_at: status === 'published' ? new Date().toISOString() : null,
        })),
        ai_generated: false,
      }

      const { data, error } = await supabase
        .from('posts')
        .insert(postData)
        .select()
        .single()

      if (error) {
        console.error('Error creating post:', error)
        return
      }

      // Add to posts list
      if (data) {
        setPosts(prev => [data, ...prev])
      }

      // Reset form
      setContent('')
      setSelectedPlatforms([])
      setScheduledDate('')
      setScheduledTime('')
      setScheduleMode('now')
      
      // TODO: If publishing, actually post to social media platforms
      if (action === 'publish') {
        console.log('Publishing to platforms:', selectedPlatforms)
        // This would integrate with actual social media APIs
      } else if (action === 'schedule') {
        console.log('Scheduled post for:', scheduledFor)
        // TODO: Add to Redis queue for scheduled processing
      }

    } catch (error) {
      console.error('Failed to create post:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusColor = (status: Post['status']) => {
    switch (status) {
      case 'published':
        return 'bg-green-600'
      case 'scheduled':
        return 'bg-blue-600'
      case 'failed':
        return 'bg-red-600'
      default:
        return 'bg-gray-600'
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Create Post</CardTitle>
            <CardDescription>Loading...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-sm font-mono">Loading...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (accounts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Create Post</CardTitle>
          <CardDescription>
            Connect social media accounts first to start posting
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground font-mono">
              No connected social accounts found.
              <br />
              Connect your accounts above to start creating posts.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Post Creator */}
      <Card>
        <CardHeader>
          <CardTitle>Create Post</CardTitle>
          <CardDescription>
            Write your content and select platforms to post to
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Textarea
              placeholder="What's happening?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[120px] font-mono"
              maxLength={280}
            />
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-muted-foreground">
                {content.length}/280 characters
              </span>
            </div>
          </div>

          <div>
            <div className="mb-3">
              <span className="text-sm font-medium font-mono">Select Platforms:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {accounts.map((account) => {
                const platformInfo = socialManager.getPlatformInfo(account.platform)
                const isSelected = selectedPlatforms.includes(account.platform)
                
                return (
                  <button
                    key={account.id}
                    onClick={() => handlePlatformToggle(account.platform)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg border transition-colors ${
                      isSelected 
                        ? 'border-primary bg-primary/10 text-primary' 
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded flex items-center justify-center ${platformInfo.color}`}>
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                        <path d={platformInfo.icon} />
                      </svg>
                    </div>
                    <span className="text-xs font-mono">@{account.username}</span>
                  </button>
                )
              })}
            </div>
            {selectedPlatforms.length === 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                Select at least one platform to post to
              </p>
            )}
          </div>

          {/* Scheduling Options */}
          <div>
            <div className="mb-3">
              <span className="text-sm font-medium font-mono">When to Post:</span>
            </div>
            <div className="flex space-x-4 mb-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  value="now"
                  checked={scheduleMode === 'now'}
                  onChange={(e) => setScheduleMode(e.target.value as 'now' | 'later')}
                  className="text-primary focus:ring-primary"
                />
                <span className="text-sm font-mono">Post Now</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  value="later"
                  checked={scheduleMode === 'later'}
                  onChange={(e) => setScheduleMode(e.target.value as 'now' | 'later')}
                  className="text-primary focus:ring-primary"
                />
                <span className="text-sm font-mono">Schedule for Later</span>
              </label>
            </div>
            
            {scheduleMode === 'later' && (
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-xs font-medium font-mono mb-1">
                    Date
                  </label>
                  <Input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    min={format(new Date(), 'yyyy-MM-dd')}
                    className="font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium font-mono mb-1">
                    Time
                  </label>
                  <Input
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="font-mono"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex space-x-2">
            <Button
              onClick={() => handleCreatePost('draft')}
              disabled={!content.trim() || isSubmitting}
              variant="outline"
              className="flex-1"
            >
              {isSubmitting ? 'Saving...' : 'Save as Draft'}
            </Button>
            
            {scheduleMode === 'now' ? (
              <Button
                onClick={() => handleCreatePost('publish')}
                disabled={!content.trim() || selectedPlatforms.length === 0 || isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? 'Publishing...' : 'Publish Now'}
              </Button>
            ) : (
              <Button
                onClick={() => handleCreatePost('schedule')}
                disabled={!content.trim() || selectedPlatforms.length === 0 || isSubmitting || !scheduledDate || !scheduledTime}
                className="flex-1"
              >
                {isSubmitting ? 'Scheduling...' : 'Schedule Post'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Posts */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Posts</CardTitle>
          <CardDescription>
            Your latest posts and their status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {posts.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-muted-foreground font-mono">
                No posts created yet. Create your first post above!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <div key={post.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="text-sm font-mono line-clamp-3">
                        {post.content}
                      </p>
                    </div>
                    <Badge className={`ml-4 ${getStatusColor(post.status)}`}>
                      {post.status}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2 mt-3">
                    <span className="text-xs text-muted-foreground font-mono">
                      {post.status === 'scheduled' && post.scheduled_for
                        ? `Scheduled: ${format(new Date(post.scheduled_for), 'MMM dd, yyyy HH:mm')}`
                        : `Created: ${format(new Date(post.created_at), 'MMM dd, yyyy')}`
                      }
                    </span>
                    <span className="text-xs text-muted-foreground">•</span>
                    <div className="flex space-x-1">
                      {post.platforms.map((platform) => {
                        const platformInfo = socialManager.getPlatformInfo(platform as any)
                        return (
                          <div 
                            key={platform}
                            className={`w-5 h-5 rounded flex items-center justify-center ${platformInfo.color}`}
                            title={platformInfo.name}
                          >
                            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                              <path d={platformInfo.icon} />
                            </svg>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}