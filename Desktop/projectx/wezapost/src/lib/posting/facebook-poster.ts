import { PostData, PlatformPostResult } from '@/types'

export interface FacebookPageInfo {
  id: string
  name: string
  access_token: string
  category: string
  tasks: string[]
}

export class FacebookPoster {
  private baseUrl = 'https://graph.facebook.com/v18.0'

  async postToFacebook(
    pageAccessToken: string,
    pageId: string,
    postData: PostData
  ): Promise<PlatformPostResult> {
    try {
      console.log('🔵 Posting to Facebook page:', pageId)

      // Prepare post content
      const postContent = this.formatContent(postData)
      
      if (postData.media_urls && postData.media_urls.length > 0) {
        // Post with media
        return await this.postWithMedia(pageAccessToken, pageId, postContent, postData.media_urls)
      } else {
        // Text-only post
        return await this.postTextOnly(pageAccessToken, pageId, postContent)
      }

    } catch (error: any) {
      console.error('❌ Facebook posting error:', error)
      return {
        platform: 'facebook',
        success: false,
        error: `Facebook posting failed: ${error.message}`,
        post_id: null,
        platform_response: error.response?.data || error.message
      }
    }
  }

  private async postTextOnly(
    pageAccessToken: string,
    pageId: string,
    message: string
  ): Promise<PlatformPostResult> {
    const response = await fetch(`${this.baseUrl}/${pageId}/feed`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        access_token: pageAccessToken
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`Facebook API error: ${errorData.error?.message || response.statusText}`)
    }

    const result = await response.json()

    return {
      platform: 'facebook',
      success: true,
      post_id: result.id,
      platform_response: result,
      published_at: new Date().toISOString()
    }
  }

  private async postWithMedia(
    pageAccessToken: string,
    pageId: string,
    message: string,
    mediaUrls: string[]
  ): Promise<PlatformPostResult> {
    // For media posts, we need to upload the media first, then create the post
    // This is a simplified version - in production, you'd want to handle different media types
    
    if (mediaUrls.length === 1) {
      // Single media post
      const response = await fetch(`${this.baseUrl}/${pageId}/photos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: mediaUrls[0],
          caption: message,
          access_token: pageAccessToken
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`Facebook photo API error: ${errorData.error?.message || response.statusText}`)
      }

      const result = await response.json()

      return {
        platform: 'facebook',
        success: true,
        post_id: result.id,
        platform_response: result,
        published_at: new Date().toISOString()
      }
    } else {
      // Multiple media would require album creation - for now, fall back to text
      return await this.postTextOnly(pageAccessToken, pageId, `${message}\n\nMedia: ${mediaUrls.join(', ')}`)
    }
  }

  private formatContent(postData: PostData): string {
    let content = postData.content || ''
    
    // Add title if present
    if (postData.title && postData.title !== content) {
      content = `${postData.title}\n\n${content}`
    }

    return content.trim()
  }

  async getPages(userAccessToken: string): Promise<FacebookPageInfo[]> {
    try {
      const response = await fetch(`${this.baseUrl}/me/accounts?access_token=${userAccessToken}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch Facebook pages')
      }

      const data = await response.json()
      return data.data || []
    } catch (error) {
      console.error('Error fetching Facebook pages:', error)
      return []
    }
  }

  async getPageAccessToken(userAccessToken: string, pageId: string): Promise<string | null> {
    try {
      const pages = await this.getPages(userAccessToken)
      const page = pages.find(p => p.id === pageId)
      return page?.access_token || null
    } catch (error) {
      console.error('Error getting page access token:', error)
      return null
    }
  }

  // Validate if the user has permission to post to pages
  async validatePagePermissions(userAccessToken: string): Promise<{
    hasPermissions: boolean
    pages: FacebookPageInfo[]
    error?: string
  }> {
    try {
      const pages = await this.getPages(userAccessToken)
      
      const validPages = pages.filter(page => 
        page.tasks && page.tasks.includes('MANAGE')
      )

      return {
        hasPermissions: validPages.length > 0,
        pages: validPages
      }
    } catch (error: any) {
      return {
        hasPermissions: false,
        pages: [],
        error: error.message
      }
    }
  }
}