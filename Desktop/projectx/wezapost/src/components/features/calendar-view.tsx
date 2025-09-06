"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { createSupabaseClientComponentClient } from '@/lib/supabase'
import { SocialProviderManager } from '@/lib/social-providers'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, startOfWeek, endOfWeek } from 'date-fns'

interface ScheduledPost {
  id: string
  content: string
  platforms: string[]
  scheduled_for: string
  status: 'scheduled' | 'published' | 'failed'
  created_at: string
}

export function CalendarView() {
  const { data: session } = useSession()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([])
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [loading, setLoading] = useState(true)

  const supabase = createSupabaseClientComponentClient()
  const socialManager = new SocialProviderManager()

  useEffect(() => {
    loadScheduledPosts()
  }, [currentDate])

  const loadScheduledPosts = async () => {
    try {
      setLoading(true)
      
      // Load posts from localStorage for demo
      const savedPosts = localStorage.getItem('wezapost-demo-posts')
      if (savedPosts) {
        const posts = JSON.parse(savedPosts)
        const monthStart = startOfMonth(currentDate)
        const monthEnd = endOfMonth(currentDate)
        
        const filteredPosts = posts.filter((post: any) => {
          if (!post.scheduled_for) return false
          const postDate = new Date(post.scheduled_for)
          return postDate >= monthStart && postDate <= monthEnd && 
                 ['scheduled', 'published', 'failed'].includes(post.status)
        })
        
        setScheduledPosts(filteredPosts)
      }

      // If user is authenticated, try to load from database
      if (session?.user?.id) {
        try {
          const monthStart = startOfMonth(currentDate)
          const monthEnd = endOfMonth(currentDate)

          const { data, error } = await supabase
            .from('posts')
            .select('*')
            .eq('user_id', session.user.id)
            .in('status', ['scheduled', 'published', 'failed'])
            .gte('scheduled_for', monthStart.toISOString())
            .lte('scheduled_for', monthEnd.toISOString())
            .order('scheduled_for', { ascending: true })

          if (!error && data) {
            setScheduledPosts(data)
          }
        } catch (error) {
          console.log('Database not available, using demo mode')
        }
      }
    } catch (error) {
      console.error('Failed to load scheduled posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const getPostsForDate = (date: Date) => {
    return scheduledPosts.filter(post => 
      post.scheduled_for && isSameDay(new Date(post.scheduled_for), date)
    )
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1))
    setCurrentDate(newDate)
  }

  const generateCalendarDays = () => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    const calendarStart = startOfWeek(monthStart)
    const calendarEnd = endOfWeek(monthEnd)
    
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd })
  }

  const getStatusColor = (status: ScheduledPost['status']) => {
    switch (status) {
      case 'published':
        return 'bg-green-600 text-white'
      case 'scheduled':
        return 'bg-blue-600 text-white'
      case 'failed':
        return 'bg-red-600 text-white'
      default:
        return 'bg-gray-600 text-white'
    }
  }

  const selectedDatePosts = selectedDate ? getPostsForDate(selectedDate) : []

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Calendar View</CardTitle>
          <CardDescription>Loading scheduled posts...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-mono">Loading calendar...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Calendar View</CardTitle>
              <CardDescription>
                View and manage your scheduled posts
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                onClick={() => navigateMonth('prev')}
                className="px-3"
              >
                ←
              </Button>
              <div className="font-mono font-semibold min-w-[120px] text-center">
                {format(currentDate, 'MMMM yyyy')}
              </div>
              <Button
                variant="outline"
                onClick={() => navigateMonth('next')}
                className="px-3"
              >
                →
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {/* Day Headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div
                key={day}
                className="h-8 flex items-center justify-center text-sm font-medium font-mono text-muted-foreground border-b"
              >
                {day}
              </div>
            ))}
            
            {/* Calendar Days */}
            {generateCalendarDays().map((date, index) => {
              const postsForDate = getPostsForDate(date)
              const isCurrentMonth = date.getMonth() === currentDate.getMonth()
              const isSelected = selectedDate && isSameDay(date, selectedDate)
              const hasToday = isToday(date)
              
              return (
                <div
                  key={index}
                  onClick={() => setSelectedDate(date)}
                  className={`
                    h-16 p-1 border rounded cursor-pointer transition-colors relative
                    ${isCurrentMonth ? 'hover:bg-accent' : 'text-muted-foreground'}
                    ${isSelected ? 'bg-primary text-primary-foreground' : ''}
                    ${hasToday ? 'border-primary border-2' : 'border-border'}
                  `}
                >
                  <div className={`text-sm font-mono ${hasToday ? 'font-bold' : ''}`}>
                    {date.getDate()}
                  </div>
                  
                  {/* Post indicators */}
                  {postsForDate.length > 0 && (
                    <div className="absolute bottom-1 left-1 right-1">
                      <div className="flex space-x-1">
                        {postsForDate.slice(0, 3).map((post, postIndex) => (
                          <div
                            key={postIndex}
                            className={`w-2 h-2 rounded-full ${getStatusColor(post.status)}`}
                            title={`${post.status}: ${post.content.substring(0, 50)}...`}
                          />
                        ))}
                        {postsForDate.length > 3 && (
                          <div className="w-2 h-2 rounded-full bg-gray-400 text-white text-xs flex items-center justify-center">
                            +{postsForDate.length - 3}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          
          {/* Legend */}
          <div className="flex items-center space-x-4 mt-4 pt-4 border-t">
            <span className="text-sm font-mono text-muted-foreground">Legend:</span>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 rounded-full bg-blue-600"></div>
              <span className="text-xs font-mono">Scheduled</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 rounded-full bg-green-600"></div>
              <span className="text-xs font-mono">Published</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 rounded-full bg-red-600"></div>
              <span className="text-xs font-mono">Failed</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selected Date Details */}
      {selectedDate && (
        <Card>
          <CardHeader>
            <CardTitle>
              {format(selectedDate, 'EEEE, MMMM d, yyyy')}
            </CardTitle>
            <CardDescription>
              {selectedDatePosts.length === 0 
                ? 'No posts scheduled for this date'
                : `${selectedDatePosts.length} post${selectedDatePosts.length === 1 ? '' : 's'} scheduled`
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedDatePosts.length > 0 ? (
              <div className="space-y-4">
                {selectedDatePosts.map((post) => (
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
                        {post.scheduled_for && format(new Date(post.scheduled_for), 'HH:mm')}
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
            ) : (
              <div className="text-center py-6">
                <p className="text-sm text-muted-foreground font-mono">
                  No posts scheduled for this date.
                  <br />
                  <span className="text-xs">Create a new post to get started!</span>
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}