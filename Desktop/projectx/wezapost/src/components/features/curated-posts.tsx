"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CuratedPost, CuratedPostFilters } from '@/types/curated-posts'

interface CuratedPostsProps {
  onSelectPost?: (post: CuratedPost) => void
}

export function CuratedPosts({ onSelectPost }: CuratedPostsProps) {
  const { data: session } = useSession()
  const [curatedPosts, setCuratedPosts] = useState<CuratedPost[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<CuratedPostFilters>({
    status: ['draft', 'reviewed']
  })
  const [selectedPost, setSelectedPost] = useState<CuratedPost | null>(null)
  const [editingPost, setEditingPost] = useState<CuratedPost | null>(null)

  useEffect(() => {
    // Load posts regardless of auth status
    loadCuratedPosts()
  }, [filters])

  // Also load posts when component mounts (ignore auth status)
  useEffect(() => {
    loadCuratedPosts()
  }, [])

  const loadCuratedPosts = async () => {
    try {
      setLoading(true)
      const queryParams = new URLSearchParams()
      
      if (filters.status && filters.status.length > 0) {
        queryParams.append('status', filters.status[0]) // API currently supports single status
      }
      
      const response = await fetch(`/api/curated-posts?${queryParams}`)
      
      if (!response.ok) {
        console.error('❌ API response not OK:', response.status, response.statusText)
        if (response.status === 401) {
          console.log('🔓 Auth issue detected, but curated posts should still work')
        }
        return
      }
      
      const result = await response.json()
      console.log('📦 Loaded curated posts response:', {
        success: result.success,
        postCount: result.data?.posts?.length || 0,
        error: result.error
      })
      
      if (result.success && result.data && result.data.posts) {
        // Check for duplicate IDs
        const postIds = result.data.posts.map(p => p.id)
        const uniqueIds = new Set(postIds)
        if (postIds.length !== uniqueIds.size) {
          console.warn('⚠️ Duplicate post IDs detected:', {
            total: postIds.length,
            unique: uniqueIds.size,
            duplicates: postIds.filter((id, index) => postIds.indexOf(id) !== index)
          })
        }
        
        setCuratedPosts(result.data.posts)
        console.log('✅ Successfully set curated posts:', result.data.posts.length, 'posts')
        console.log('📋 Post details:', result.data.posts.map(p => ({ id: p.id, content: p.content.substring(0, 50) + '...' })))
      } else {
        console.error('❌ Failed to load curated posts:', result.error || 'No posts data')
        setCuratedPosts([]) // Set empty array as fallback
      }
    } catch (error) {
      console.error('Error loading curated posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const updatePostStatus = async (postId: string, status: CuratedPost['status']) => {
    try {
      const response = await fetch(`/api/curated-posts/${postId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })

      const result = await response.json()
      if (result.success) {
        await loadCuratedPosts() // Reload the list
        if (selectedPost?.id === postId) {
          setSelectedPost(result.data)
        }
      }
    } catch (error) {
      console.error('Error updating post status:', error)
    }
  }

  const deletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this curated post?')) return

    try {
      const response = await fetch(`/api/curated-posts/${postId}`, {
        method: 'DELETE'
      })

      const result = await response.json()
      if (result.success) {
        await loadCuratedPosts()
        if (selectedPost?.id === postId) {
          setSelectedPost(null)
        }
      }
    } catch (error) {
      console.error('Error deleting post:', error)
    }
  }

  const handleEditPost = (post: CuratedPost) => {
    setEditingPost({ ...post })
  }

  const saveEditedPost = async () => {
    if (!editingPost) return

    try {
      const response = await fetch(`/api/curated-posts/${editingPost.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingPost)
      })

      const result = await response.json()
      if (result.success) {
        await loadCuratedPosts()
        setEditingPost(null)
        if (selectedPost?.id === editingPost.id) {
          setSelectedPost(result.data)
        }
      }
    } catch (error) {
      console.error('Error saving edited post:', error)
    }
  }

  const getStatusColor = (status: CuratedPost['status']) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800'
      case 'reviewed': return 'bg-blue-100 text-blue-800'
      case 'approved': return 'bg-green-100 text-green-800'
      case 'scheduled': return 'bg-purple-100 text-purple-800'
      case 'published': return 'bg-emerald-100 text-emerald-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: CuratedPost['scheduling']['priority']) => {
    switch (priority) {
      case 'urgent': return 'text-red-600'
      case 'high': return 'text-orange-600'
      case 'medium': return 'text-yellow-600'
      case 'low': return 'text-green-600'
      default: return 'text-gray-600'
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Curated Posts</CardTitle>
          <CardDescription>Loading curated content...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-mono">Loading...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Curated Posts</CardTitle>
          <CardDescription>
            Review and edit content curated by your n8n workflows
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="list" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="list">Post List</TabsTrigger>
              <TabsTrigger value="preview">Preview & Edit</TabsTrigger>
            </TabsList>
            
            <TabsContent value="list" className="space-y-4">
              {/* Filters */}
              <div className="flex flex-wrap gap-2 p-4 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium">Filter by status:</span>
                {(['draft', 'reviewed', 'approved', 'scheduled'] as const).map(status => (
                  <Button
                    key={status}
                    variant={filters.status?.includes(status) ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      const newStatuses = filters.status?.includes(status)
                        ? filters.status.filter(s => s !== status)
                        : [...(filters.status || []), status]
                      setFilters({ ...filters, status: newStatuses })
                    }}
                  >
                    {status}
                  </Button>
                ))}
              </div>

              {/* Post List */}
              <div className="space-y-3">
                {curatedPosts.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <div className="mb-2">📝</div>
                    <p>No curated posts found</p>
                    <p className="text-sm">Posts from your n8n workflow will appear here</p>
                  </div>
                ) : (
                  curatedPosts.map(post => (
                    <Card 
                      key={post.id} 
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedPost?.id === post.id ? 'ring-2 ring-blue-500 shadow-md' : ''
                      }`}
                      onClick={() => setSelectedPost(post)}
                    >
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center space-x-2">
                            <Badge className={getStatusColor(post.status)}>
                              {post.status}
                            </Badge>
                            <Badge variant="outline" className={getPriorityColor(post.scheduling.priority)}>
                              {post.scheduling.priority}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {post.source.type.toUpperCase()}
                            </span>
                          </div>
                          <span className="text-xs text-gray-400 font-mono">
                            {new Date(post.created_at).toLocaleDateString()} {new Date(post.created_at).toLocaleTimeString()}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-700 mb-2 line-clamp-2">
                          {post.content}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span>{post.metadata.character_count} chars</span>
                            {post.hashtags.length > 0 && (
                              <span>{post.hashtags.length} hashtags</span>
                            )}
                            {post.images.length > 0 && (
                              <span>{post.images.length} images</span>
                            )}
                            {post.links.length > 0 && (
                              <span>{post.links.length} links</span>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            {post.platforms.map(platform => (
                              <div key={platform} className="w-4 h-4 bg-blue-500 rounded-full" title={platform} />
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="preview" className="space-y-4">
              {selectedPost ? (
                <CuratedPostPreview 
                  post={selectedPost}
                  onEdit={handleEditPost}
                  onUpdateStatus={updatePostStatus}
                  onDelete={deletePost}
                  onSelectForPosting={onSelectPost}
                />
              ) : (
                <Card>
                  <CardContent className="p-8 text-center text-gray-500">
                    <div className="mb-2">👀</div>
                    <p>Select a post from the list to preview</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Edit Modal */}
      {editingPost && (
        <CuratedPostEditor
          post={editingPost}
          onSave={saveEditedPost}
          onCancel={() => setEditingPost(null)}
          onChange={setEditingPost}
        />
      )}
    </div>
  )
}

// Preview Component
function CuratedPostPreview({ 
  post, 
  onEdit, 
  onUpdateStatus, 
  onDelete, 
  onSelectForPosting 
}: {
  post: CuratedPost
  onEdit: (post: CuratedPost) => void
  onUpdateStatus: (id: string, status: CuratedPost['status']) => void
  onDelete: (id: string) => void
  onSelectForPosting?: (post: CuratedPost) => void
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">Post Preview</CardTitle>
            <CardDescription>{post.id}</CardDescription>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={() => onEdit(post)}>
              ✏️ Edit
            </Button>
            {onSelectForPosting && (
              <Button size="sm" onClick={() => onSelectForPosting(post)}>
                📤 Use for Posting
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Content */}
        <div>
          <h4 className="font-medium mb-2">Content</h4>
          <div className="p-3 bg-gray-50 rounded-lg font-mono text-sm">
            {post.content}
          </div>
        </div>

        {/* Hashtags */}
        {post.hashtags.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">Hashtags</h4>
            <div className="flex flex-wrap gap-1">
              {post.hashtags.map((tag, index) => (
                <Badge key={index} variant="secondary">{tag}</Badge>
              ))}
            </div>
          </div>
        )}

        {/* Images */}
        {post.images.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">Images</h4>
            <div className="grid grid-cols-2 gap-2">
              {post.images.map(image => (
                <div key={image.id} className="border rounded-lg overflow-hidden">
                  <img 
                    src={image.url} 
                    alt={image.alt_text || 'Curated image'}
                    className="w-full h-32 object-cover"
                  />
                  {image.caption && (
                    <div className="p-2 text-xs text-gray-600">{image.caption}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Links */}
        {post.links.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">Links</h4>
            <div className="space-y-2">
              {post.links.map(link => (
                <div key={link.id} className="p-3 border rounded-lg">
                  <a 
                    href={link.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm"
                  >
                    {link.title || link.url}
                  </a>
                  {link.description && (
                    <p className="text-xs text-gray-600 mt-1">{link.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded-lg text-sm">
          <div>
            <span className="font-medium">Status:</span> {post.status}
          </div>
          <div>
            <span className="font-medium">Priority:</span> {post.scheduling.priority}
          </div>
          <div>
            <span className="font-medium">Source:</span> {post.source.type}
          </div>
          <div>
            <span className="font-medium">Engagement:</span> {post.metadata.estimated_engagement}%
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between pt-4 border-t">
          <div className="space-x-2">
            {post.status === 'draft' && (
              <Button size="sm" onClick={() => onUpdateStatus(post.id, 'reviewed')}>
                ✅ Mark Reviewed
              </Button>
            )}
            {post.status === 'reviewed' && (
              <Button size="sm" onClick={() => onUpdateStatus(post.id, 'approved')}>
                👍 Approve
              </Button>
            )}
            {post.status === 'approved' && (
              <Button size="sm" onClick={() => onUpdateStatus(post.id, 'scheduled')}>
                📅 Schedule
              </Button>
            )}
          </div>
          
          <Button variant="destructive" size="sm" onClick={() => onDelete(post.id)}>
            🗑️ Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Editor Component
function CuratedPostEditor({
  post,
  onSave,
  onCancel,
  onChange
}: {
  post: CuratedPost
  onSave: () => void
  onCancel: () => void
  onChange: (post: CuratedPost) => void
}) {
  return (
    <Card className="fixed inset-4 z-50 overflow-auto">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Edit Curated Post</CardTitle>
          <div className="space-x-2">
            <Button variant="outline" onClick={onCancel}>Cancel</Button>
            <Button onClick={onSave}>Save Changes</Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium">Content</label>
          <Textarea
            value={post.content}
            onChange={(e) => onChange({ ...post, content: e.target.value })}
            className="min-h-[120px] font-mono"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Hashtags (comma-separated)</label>
          <Input
            value={post.hashtags.join(', ')}
            onChange={(e) => onChange({ 
              ...post, 
              hashtags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag) 
            })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Priority</label>
            <select
              value={post.scheduling.priority}
              onChange={(e) => onChange({
                ...post,
                scheduling: { ...post.scheduling, priority: e.target.value as any }
              })}
              className="w-full p-2 border rounded"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">Status</label>
            <select
              value={post.status}
              onChange={(e) => onChange({ ...post, status: e.target.value as any })}
              className="w-full p-2 border rounded"
            >
              <option value="draft">Draft</option>
              <option value="reviewed">Reviewed</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}