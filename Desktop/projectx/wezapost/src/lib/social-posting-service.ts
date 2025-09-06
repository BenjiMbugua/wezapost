import { createSupabaseClientComponentClient } from './supabase'
import { TwitterApi } from 'twitter-api-v2'
import { FacebookPoster } from './posting/facebook-poster'
import { InstagramPoster } from './posting/instagram-poster'
import { PostData } from '@/types'

interface PostingResult {
  platform: string
  success: boolean
  postId?: string
  url?: string
  error?: string
  publishedAt?: string
}

interface SocialAccount {
  id: string
  user_id: string
  platform: 'twitter' | 'linkedin' | 'facebook' | 'instagram' | 'tiktok'
  platform_user_id: string
  username: string
  display_name: string
  avatar_url: string | null
  access_token: string
  refresh_token: string | null
  expires_at: string | null
  is_active: boolean
  settings: {
    auto_post: boolean
    default_visibility: string
    custom_hashtags: string[]
  }
}

export class SocialPostingService {
  private supabase = createSupabaseClientComponentClient()
  private facebookPoster = new FacebookPoster()
  private instagramPoster = new InstagramPoster()

  /**
   * Post content to multiple social media platforms
   */
  async postToPlatforms(
    userId: string, 
    platforms: string[], 
    content: string, 
    media?: string[]
  ): Promise<PostingResult[]> {
    const results: PostingResult[] = []
    
    // Get user's connected social accounts
    const accounts = await this.getUserSocialAccounts(userId)
    
    console.log(`Found ${accounts.length} social accounts for user ${userId}:`, 
      accounts.map(acc => ({ platform: acc.platform, username: acc.username })))
    
    for (const platform of platforms) {
      const account = accounts.find(acc => acc.platform === platform && acc.is_active)
      
      if (!account) {
        console.log(`No active ${platform} account found for user ${userId}, trying fallback...`)
        
        // Fallback: Try to post using environment credentials if available
        if (platform === 'twitter' && this.hasTwitterCredentials()) {
          console.log('Using environment Twitter credentials as fallback')
          const result = await this.postToTwitterFallback(content, media)
          results.push(result)
        } else {
          results.push({
            platform,
            success: false,
            error: `No active ${platform} account found for user`
          })
        }
        continue
      }

      try {
        const result = await this.postToPlatform(account, content, media)
        results.push(result)
      } catch (error) {
        console.error(`Error posting to ${platform}:`, error)
        results.push({
          platform,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }
    
    return results
  }

  /**
   * Post to a specific platform using the account's access token
   */
  private async postToPlatform(
    account: SocialAccount, 
    content: string, 
    media?: string[]
  ): Promise<PostingResult> {
    switch (account.platform) {
      case 'twitter':
        return await this.postToTwitter(account, content, media)
      case 'linkedin':
        return await this.postToLinkedIn(account, content, media)
      case 'facebook':
        return await this.postToFacebook(account, content, media)
      case 'instagram':
        return await this.postToInstagram(account, content, media)
      default:
        return {
          platform: account.platform,
          success: false,
          error: `Platform ${account.platform} not yet implemented`
        }
    }
  }

  /**
   * Post to Twitter using Twitter API v2
   */
  private async postToTwitter(
    account: SocialAccount, 
    content: string, 
    media?: string[]
  ): Promise<PostingResult> {
    try {
      // Check if we have OAuth 1.0a credentials (preferred for posting)
      const apiKey = process.env.TWITTER_API_KEY
      const apiSecret = process.env.TWITTER_API_SECRET
      const accessToken = process.env.TWITTER_ACCESS_TOKEN
      const accessTokenSecret = process.env.TWITTER_ACCESS_TOKEN_SECRET

      if (apiKey && apiSecret && accessToken && accessTokenSecret) {
        // Use OAuth 1.0a credentials (has write permissions)
        const twitterClient = new TwitterApi({
          appKey: apiKey,
          appSecret: apiSecret,
          accessToken: accessToken,
          accessSecret: accessTokenSecret,
        })

        const tweet = await twitterClient.v2.tweet(content.trim())
        
        return {
          platform: 'twitter',
          success: true,
          postId: tweet.data.id,
          url: `https://twitter.com/Wezalabstech/status/${tweet.data.id}`,
          publishedAt: new Date().toISOString()
        }
      } else {
        // Fallback to OAuth 2.0 access token (read-only, but we can try)
        console.warn('OAuth 1.0a credentials not available, using OAuth 2.0 token (may be read-only)')
        
        const twitterClient = new TwitterApi(account.access_token)
        const tweet = await twitterClient.v2.tweet(content.trim())
        
        return {
          platform: 'twitter',
          success: true,
          postId: tweet.data.id,
          url: `https://twitter.com/${account.username}/status/${tweet.data.id}`,
          publishedAt: new Date().toISOString()
        }
      }
    } catch (error: any) {
      console.error('Twitter posting error:', error)
      return {
        platform: 'twitter',
        success: false,
        error: error.message || 'Failed to post to Twitter'
      }
    }
  }

  /**
   * Post to LinkedIn using LinkedIn API
   */
  private async postToLinkedIn(
    account: SocialAccount, 
    content: string, 
    media?: string[]
  ): Promise<PostingResult> {
    try {
      console.log('Posting to LinkedIn via API endpoint...')
      
      // Call our LinkedIn posting API endpoint
      const response = await fetch('/api/linkedin/post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postData: { content },
          accountData: account
        })
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        return {
          platform: 'linkedin',
          success: false,
          error: result.error || 'LinkedIn posting failed'
        }
      }

      return {
        platform: 'linkedin',
        success: true,
        postId: result.post_id,
        url: `https://linkedin.com/in/${account.username}`,
        publishedAt: new Date().toISOString()
      }
    } catch (error: any) {
      console.error('LinkedIn posting error:', error)
      return {
        platform: 'linkedin',
        success: false,
        error: error.message || 'Failed to post to LinkedIn'
      }
    }
  }

  /**
   * Post to Facebook using Facebook Graph API
   */
  private async postToFacebook(
    account: SocialAccount, 
    content: string, 
    media?: string[]
  ): Promise<PostingResult> {
    try {
      // First, get Facebook pages for this user
      const pages = await this.facebookPoster.getPages(account.access_token)
      
      if (pages.length === 0) {
        return {
          platform: 'facebook',
          success: false,
          error: 'No Facebook pages found. You need to manage Facebook pages to post.'
        }
      }

      // Use the first available page (in production, let user choose)
      const page = pages[0]
      
      // Get page access token
      const pageAccessToken = await this.facebookPoster.getPageAccessToken(account.access_token, page.id)
      
      if (!pageAccessToken) {
        return {
          platform: 'facebook',
          success: false,
          error: 'Unable to get page access token'
        }
      }

      const postData: PostData = {
        content,
        media_urls: media || [],
        title: '',
        platforms: ['facebook'],
        scheduled_for: null
      }

      const result = await this.facebookPoster.postToFacebook(pageAccessToken, page.id, postData)
      
      return {
        platform: 'facebook',
        success: result.success,
        postId: result.post_id || undefined,
        url: result.post_id ? `https://facebook.com/${result.post_id}` : undefined,
        error: result.error,
        publishedAt: result.published_at
      }
    } catch (error: any) {
      console.error('Facebook posting error:', error)
      return {
        platform: 'facebook',
        success: false,
        error: error.message || 'Failed to post to Facebook'
      }
    }
  }

  /**
   * Post to Instagram using Instagram Content Publishing API
   */
  private async postToInstagram(
    account: SocialAccount, 
    content: string, 
    media?: string[]
  ): Promise<PostingResult> {
    try {
      if (!media || media.length === 0) {
        return {
          platform: 'instagram',
          success: false,
          error: 'Instagram requires at least one media file (photo or video)'
        }
      }

      // For Instagram posting via Content Publishing API, we need:
      // 1. A connected Facebook page
      // 2. An Instagram Business account connected to that page
      // For now, we'll assume the access token is for a Facebook page that has Instagram connected

      // We need the Instagram Business Account ID
      // In a real implementation, you'd store this during the connection process
      // For now, we'll try to get it from the Facebook account

      const postData: PostData = {
        content,
        media_urls: media,
        title: '',
        platforms: ['instagram'],
        scheduled_for: null
      }

      // This is a simplified version - in production, you'd need to:
      // 1. Get the Facebook page ID from the account
      // 2. Get the Instagram Business Account ID from that page
      // 3. Use that Instagram Business Account ID for posting
      
      // For demo purposes, we'll return a mock success
      const mockInstagramBusinessId = 'instagram_business_' + account.platform_user_id
      
      const result = await this.instagramPoster.postToInstagram(
        account.access_token,
        mockInstagramBusinessId,
        postData
      )
      
      return {
        platform: 'instagram',
        success: result.success,
        postId: result.post_id || undefined,
        url: result.post_id ? `https://instagram.com/p/${result.post_id}` : undefined,
        error: result.error,
        publishedAt: result.published_at
      }
    } catch (error: any) {
      console.error('Instagram posting error:', error)
      return {
        platform: 'instagram',
        success: false,
        error: error.message || 'Failed to post to Instagram'
      }
    }
  }

  /**
   * Check if Twitter credentials are available in environment
   */
  private hasTwitterCredentials(): boolean {
    return !!(process.env.TWITTER_API_KEY && 
              process.env.TWITTER_API_SECRET && 
              process.env.TWITTER_ACCESS_TOKEN && 
              process.env.TWITTER_ACCESS_TOKEN_SECRET)
  }

  /**
   * Post to Twitter using environment credentials as fallback
   */
  private async postToTwitterFallback(content: string, media?: string[]): Promise<PostingResult> {
    try {
      const apiKey = process.env.TWITTER_API_KEY!
      const apiSecret = process.env.TWITTER_API_SECRET!
      const accessToken = process.env.TWITTER_ACCESS_TOKEN!
      const accessTokenSecret = process.env.TWITTER_ACCESS_TOKEN_SECRET!

      const twitterClient = new TwitterApi({
        appKey: apiKey,
        appSecret: apiSecret,
        accessToken: accessToken,
        accessSecret: accessTokenSecret,
      })

      const tweet = await twitterClient.v2.tweet(content.trim())
      
      return {
        platform: 'twitter',
        success: true,
        postId: tweet.data.id,
        url: `https://twitter.com/Wezalabstech/status/${tweet.data.id}`,
        publishedAt: new Date().toISOString()
      }
    } catch (error: any) {
      console.error('Twitter fallback posting error:', error)
      return {
        platform: 'twitter',
        success: false,
        error: error.message || 'Failed to post to Twitter'
      }
    }
  }

  /**
   * Get user's connected social accounts from database
   */
  private async getUserSocialAccounts(userId: string): Promise<SocialAccount[]> {
    try {
      const { data, error } = await this.supabase
        .from('social_accounts')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)

      if (error) {
        console.error('Error fetching social accounts:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Failed to fetch social accounts:', error)
      return []
    }
  }
}

// Export singleton instance
export const socialPostingService = new SocialPostingService() 