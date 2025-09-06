import { PostData, PlatformPostResult } from '@/types'

export interface InstagramBusinessAccount {
  id: string
  username: string
  profile_picture_url: string
  followers_count: number
  media_count: number
}

export class InstagramPoster {
  private baseUrl = 'https://graph.facebook.com/v18.0'

  async postToInstagram(
    accessToken: string,
    instagramBusinessId: string,
    postData: PostData
  ): Promise<PlatformPostResult> {
    try {
      console.log('🟣 Posting to Instagram business account:', instagramBusinessId)

      if (!postData.media_urls || postData.media_urls.length === 0) {
        throw new Error('Instagram requires at least one media item (photo or video)')
      }

      const content = this.formatContent(postData)
      
      if (postData.media_urls.length === 1) {
        return await this.postSingleMedia(accessToken, instagramBusinessId, content, postData.media_urls[0])
      } else {
        return await this.postCarousel(accessToken, instagramBusinessId, content, postData.media_urls)
      }

    } catch (error: any) {
      console.error('❌ Instagram posting error:', error)
      return {
        platform: 'instagram',
        success: false,
        error: `Instagram posting failed: ${error.message}`,
        post_id: null,
        platform_response: error.response?.data || error.message
      }
    }
  }

  private async postSingleMedia(
    accessToken: string,
    instagramBusinessId: string,
    caption: string,
    mediaUrl: string
  ): Promise<PlatformPostResult> {
    // Step 1: Create media container
    const containerResponse = await fetch(`${this.baseUrl}/${instagramBusinessId}/media`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image_url: mediaUrl, // Use image_url for photos, video_url for videos
        caption: caption,
        access_token: accessToken
      })
    })

    if (!containerResponse.ok) {
      const errorData = await containerResponse.json()
      throw new Error(`Instagram container creation failed: ${errorData.error?.message || containerResponse.statusText}`)
    }

    const containerResult = await containerResponse.json()
    const containerId = containerResult.id

    // Step 2: Publish the container
    const publishResponse = await fetch(`${this.baseUrl}/${instagramBusinessId}/media_publish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        creation_id: containerId,
        access_token: accessToken
      })
    })

    if (!publishResponse.ok) {
      const errorData = await publishResponse.json()
      throw new Error(`Instagram publish failed: ${errorData.error?.message || publishResponse.statusText}`)
    }

    const publishResult = await publishResponse.json()

    return {
      platform: 'instagram',
      success: true,
      post_id: publishResult.id,
      platform_response: {
        container_id: containerId,
        media_id: publishResult.id
      },
      published_at: new Date().toISOString()
    }
  }

  private async postCarousel(
    accessToken: string,
    instagramBusinessId: string,
    caption: string,
    mediaUrls: string[]
  ): Promise<PlatformPostResult> {
    // Step 1: Create individual media containers
    const containerIds: string[] = []

    for (const mediaUrl of mediaUrls.slice(0, 10)) { // Instagram allows max 10 items in carousel
      const containerResponse = await fetch(`${this.baseUrl}/${instagramBusinessId}/media`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image_url: mediaUrl,
          is_carousel_item: true,
          access_token: accessToken
        })
      })

      if (!containerResponse.ok) {
        const errorData = await containerResponse.json()
        throw new Error(`Instagram carousel item creation failed: ${errorData.error?.message}`)
      }

      const containerResult = await containerResponse.json()
      containerIds.push(containerResult.id)
    }

    // Step 2: Create carousel container
    const carouselResponse = await fetch(`${this.baseUrl}/${instagramBusinessId}/media`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        media_type: 'CAROUSEL',
        children: containerIds.join(','),
        caption: caption,
        access_token: accessToken
      })
    })

    if (!carouselResponse.ok) {
      const errorData = await carouselResponse.json()
      throw new Error(`Instagram carousel creation failed: ${errorData.error?.message}`)
    }

    const carouselResult = await carouselResponse.json()

    // Step 3: Publish the carousel
    const publishResponse = await fetch(`${this.baseUrl}/${instagramBusinessId}/media_publish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        creation_id: carouselResult.id,
        access_token: accessToken
      })
    })

    if (!publishResponse.ok) {
      const errorData = await publishResponse.json()
      throw new Error(`Instagram carousel publish failed: ${errorData.error?.message}`)
    }

    const publishResult = await publishResponse.json()

    return {
      platform: 'instagram',
      success: true,
      post_id: publishResult.id,
      platform_response: {
        carousel_id: carouselResult.id,
        media_id: publishResult.id,
        container_ids: containerIds
      },
      published_at: new Date().toISOString()
    }
  }

  private formatContent(postData: PostData): string {
    let content = postData.content || ''
    
    // Instagram has a 2200 character limit for captions
    const MAX_LENGTH = 2200
    
    if (content.length > MAX_LENGTH) {
      content = content.substring(0, MAX_LENGTH - 3) + '...'
    }

    return content.trim()
  }

  // Get Instagram business account info
  async getBusinessAccountInfo(accessToken: string, facebookPageId: string): Promise<InstagramBusinessAccount | null> {
    try {
      // First get the Instagram business account ID from the Facebook page
      const pageResponse = await fetch(`${this.baseUrl}/${facebookPageId}?fields=instagram_business_account&access_token=${accessToken}`)
      
      if (!pageResponse.ok) {
        throw new Error('Failed to get Instagram business account from Facebook page')
      }

      const pageData = await pageResponse.json()
      const instagramAccountId = pageData.instagram_business_account?.id

      if (!instagramAccountId) {
        return null // No Instagram business account connected to this Facebook page
      }

      // Get Instagram account details
      const instagramResponse = await fetch(
        `${this.baseUrl}/${instagramAccountId}?fields=id,username,profile_picture_url,followers_count,media_count&access_token=${accessToken}`
      )

      if (!instagramResponse.ok) {
        throw new Error('Failed to get Instagram account details')
      }

      return await instagramResponse.json()
    } catch (error) {
      console.error('Error getting Instagram business account info:', error)
      return null
    }
  }

  // Validate if the account can post to Instagram
  async validateInstagramPermissions(accessToken: string, facebookPageId: string): Promise<{
    hasPermissions: boolean
    businessAccount: InstagramBusinessAccount | null
    error?: string
  }> {
    try {
      const businessAccount = await this.getBusinessAccountInfo(accessToken, facebookPageId)
      
      return {
        hasPermissions: businessAccount !== null,
        businessAccount
      }
    } catch (error: any) {
      return {
        hasPermissions: false,
        businessAccount: null,
        error: error.message
      }
    }
  }

  // Check if media URL is valid for Instagram
  validateMediaUrl(url: string): { valid: boolean; type: 'image' | 'video' | 'unknown'; error?: string } {
    try {
      const validImageExtensions = ['.jpg', '.jpeg', '.png', '.webp']
      const validVideoExtensions = ['.mp4', '.mov', '.avi']
      
      const urlLower = url.toLowerCase()
      
      if (validImageExtensions.some(ext => urlLower.includes(ext))) {
        return { valid: true, type: 'image' }
      }
      
      if (validVideoExtensions.some(ext => urlLower.includes(ext))) {
        return { valid: true, type: 'video' }
      }
      
      // If no extension detected, assume it might be valid (could be a processed URL)
      return { valid: true, type: 'unknown' }
      
    } catch (error) {
      return { valid: false, type: 'unknown', error: 'Invalid URL format' }
    }
  }
}