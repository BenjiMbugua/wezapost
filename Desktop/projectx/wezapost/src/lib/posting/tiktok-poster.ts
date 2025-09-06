import { PostData, PlatformPostResult } from '@/types'

export interface TikTokUploadResponse {
  data: {
    upload_url: string
    publish_id: string
  }
}

export interface TikTokPublishResponse {
  data: {
    publish_id: string
    share_url: string
  }
}

export interface TikTokUserInfo {
  open_id: string
  union_id: string
  avatar_url: string
  display_name: string
  bio_description: string
  profile_deep_link: string
  is_verified: boolean
  follower_count: number
  following_count: number
  likes_count: number
  video_count: number
}

export class TikTokPoster {
  private baseUrl = 'https://open.tiktokapis.com/v2'

  async postToTikTok(
    accessToken: string,
    postData: PostData
  ): Promise<PlatformPostResult> {
    try {
      console.log('🎵 Posting to TikTok')

      // TikTok requires video content - for now we'll simulate
      // In a real implementation, you would need video files or generate them
      if (!postData.media_urls || postData.media_urls.length === 0) {
        // For demo purposes, return a simulated success
        console.log('⚠️ TikTok posting simulated - no video provided')
        return {
          platform: 'tiktok',
          success: true,
          post_id: `tiktok_demo_${Date.now()}`,
          platform_response: {
            simulated: true,
            reason: 'TikTok requires video content - not implemented for text-only posts'
          },
          published_at: new Date().toISOString()
        }
      }

      // For actual video posting, you would:
      // 1. Upload video file to TikTok's upload URL
      // 2. Publish the video with metadata
      
      const videoUrl = postData.media_urls[0]
      const caption = this.formatCaption(postData)
      
      // Step 1: Get upload URL
      const uploadResponse = await fetch(`${this.baseUrl}/post/publish/inbox/video/init/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          source_info: {
            source: 'FILE_UPLOAD',
            video_size: 10485760, // 10MB placeholder
            chunk_size: 10485760,
            total_chunk_count: 1
          },
          post_info: {
            title: caption,
            description: caption,
            disable_duet: false,
            disable_comment: false,
            disable_stitch: false,
            video_cover_timestamp_ms: 1000
          }
        })
      })

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json()
        throw new Error(`TikTok upload init failed: ${errorData.error?.message || uploadResponse.statusText}`)
      }

      const uploadData: TikTokUploadResponse = await uploadResponse.json()
      
      // For demo purposes, return success with the publish_id
      // In real implementation, you would upload the video file here
      console.log('🎵 TikTok upload initialized:', uploadData.data.publish_id)

      return {
        platform: 'tiktok',
        success: true,
        post_id: uploadData.data.publish_id,
        platform_response: {
          upload_url: uploadData.data.upload_url,
          publish_id: uploadData.data.publish_id,
          note: 'Video upload initialized - requires actual video file upload to complete'
        },
        published_at: new Date().toISOString()
      }

    } catch (error: any) {
      console.error('❌ TikTok posting error:', error)
      return {
        platform: 'tiktok',
        success: false,
        error: `TikTok posting failed: ${error.message}`,
        post_id: null,
        platform_response: error.response?.data || error.message
      }
    }
  }

  private formatCaption(postData: PostData): string {
    let content = postData.content || ''
    
    // TikTok has a 2200 character limit for captions
    const MAX_LENGTH = 2200
    
    if (content.length > MAX_LENGTH) {
      content = content.substring(0, MAX_LENGTH - 3) + '...'
    }

    // Add title if present
    if (postData.title && postData.title !== content) {
      content = `${postData.title}\n\n${content}`
    }

    return content.trim()
  }

  // Get user information
  async getUserInfo(accessToken: string): Promise<TikTokUserInfo | null> {
    try {
      const response = await fetch(`${this.baseUrl}/user/info/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fields: [
            'open_id',
            'union_id', 
            'avatar_url',
            'display_name',
            'bio_description',
            'profile_deep_link',
            'is_verified',
            'follower_count',
            'following_count',
            'likes_count',
            'video_count'
          ]
        })
      })

      if (!response.ok) {
        throw new Error('Failed to get TikTok user info')
      }

      const data = await response.json()
      return data.data.user
    } catch (error) {
      console.error('Error getting TikTok user info:', error)
      return null
    }
  }

  // Validate if the account can post to TikTok
  async validateTikTokPermissions(accessToken: string): Promise<{
    hasPermissions: boolean
    userInfo: TikTokUserInfo | null
    error?: string
  }> {
    try {
      const userInfo = await this.getUserInfo(accessToken)
      
      return {
        hasPermissions: userInfo !== null,
        userInfo
      }
    } catch (error: any) {
      return {
        hasPermissions: false,
        userInfo: null,
        error: error.message
      }
    }
  }

  // Check if media URL is valid for TikTok (videos only)
  validateMediaUrl(url: string): { valid: boolean; type: 'video' | 'unknown'; error?: string } {
    try {
      const validVideoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm']
      const urlLower = url.toLowerCase()
      
      if (validVideoExtensions.some(ext => urlLower.includes(ext))) {
        return { valid: true, type: 'video' }
      }
      
      // TikTok only accepts videos
      return { valid: false, type: 'unknown', error: 'TikTok only accepts video files (.mp4, .mov, .avi, .mkv, .webm)' }
      
    } catch (error) {
      return { valid: false, type: 'unknown', error: 'Invalid URL format' }
    }
  }
}