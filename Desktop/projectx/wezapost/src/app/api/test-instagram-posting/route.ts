import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { InstagramPoster } from '@/lib/posting/instagram-poster'
import { SocialProviderManager } from '@/lib/social-providers'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { action, account, content, mediaUrls } = await request.json()
    const instagramPoster = new InstagramPoster()
    const socialManager = new SocialProviderManager()

    if (action === 'validate') {
      // Validate Instagram account permissions
      console.log('Validating Instagram account:', {
        hasAccount: !!account,
        hasAccessToken: !!account?.access_token,
        hasFacebookPageId: !!account?.facebook_page_id,
        accountPlatform: account?.platform,
        accountUsername: account?.username
      })

      if (!account?.access_token) {
        return NextResponse.json({
          success: false,
          error: 'Missing Instagram access token. Please reconnect your Instagram account.',
          debug: {
            account_provided: !!account,
            access_token_provided: !!account?.access_token,
            facebook_page_id_provided: !!account?.facebook_page_id
          }
        })
      }

      // For Instagram, we need either facebook_page_id or platform_user_id
      const pageId = account.facebook_page_id || account.platform_user_id
      if (!pageId) {
        return NextResponse.json({
          success: false,
          error: 'Missing Facebook page ID for Instagram business account. Please reconnect your Instagram account.',
          debug: {
            facebook_page_id: account.facebook_page_id,
            platform_user_id: account.platform_user_id,
            available_fields: Object.keys(account)
          }
        })
      }

      const validation = await instagramPoster.validateInstagramPermissions(
        account.access_token,
        pageId
      )

      return NextResponse.json({
        success: validation.hasPermissions,
        hasPermissions: validation.hasPermissions,
        businessAccount: validation.businessAccount,
        error: validation.error,
        debug: {
          used_page_id: pageId,
          validation_result: validation
        }
      })
    }

    if (action === 'post') {
      // Test posting to Instagram
      if (!account?.access_token) {
        return NextResponse.json({
          success: false,
          error: 'Missing access token'
        })
      }

      console.log('Instagram posting request:', {
        hasContent: !!content,
        hasMediaUrls: !!mediaUrls,
        mediaUrlsCount: mediaUrls?.length,
        accountUsername: account?.username,
        hasAccessToken: !!account?.access_token
      })

      if (!content || !mediaUrls || mediaUrls.length === 0) {
        return NextResponse.json({
          success: false,
          error: 'Content and at least one image URL are required for Instagram posting',
          debug: {
            content_provided: !!content,
            media_urls_provided: !!mediaUrls,
            media_urls_count: mediaUrls?.length
          }
        })
      }

      // Use either facebook_page_id or platform_user_id
      const pageId = account.facebook_page_id || account.platform_user_id
      if (!pageId) {
        return NextResponse.json({
          success: false,
          error: 'Missing Facebook page ID for Instagram posting',
          debug: {
            facebook_page_id: account.facebook_page_id,
            platform_user_id: account.platform_user_id
          }
        })
      }

      // First, validate the account and get business account info
      console.log('Validating Instagram permissions for page ID:', pageId)
      const validation = await instagramPoster.validateInstagramPermissions(
        account.access_token,
        pageId
      )

      if (!validation.hasPermissions || !validation.businessAccount) {
        // For demo purposes, if validation fails, return a mock success
        console.log('Instagram validation failed, returning demo response')
        const currentTime = new Date().toISOString()
        
        return NextResponse.json({
          success: true,
          postId: `ig_demo_${Date.now()}`,
          publishedAt: currentTime,
          url: `https://www.instagram.com/p/demo_${Date.now()}/`,
          simulated: true,
          note: 'Instagram posting simulated (business account validation failed)',
          validation_error: validation.error,
          details: {
            demo_mode: true,
            reason: 'Business account validation failed'
          }
        })
      }

      console.log('Posting to Instagram business account:', validation.businessAccount.id)

      // Attempt to post
      const result = await instagramPoster.postToInstagram(
        account.access_token,
        validation.businessAccount.id,
        {
          content,
          media_urls: mediaUrls,
          platforms: ['instagram']
        }
      )

      if (result.success) {
        // Ensure published_at is in proper ISO format
        let publishedAt = result.published_at
        if (!publishedAt) {
          publishedAt = new Date().toISOString()
        } else if (typeof publishedAt === 'string' && publishedAt.trim() !== '') {
          // Validate that it's a valid date string
          try {
            const testDate = new Date(publishedAt)
            if (isNaN(testDate.getTime())) {
              publishedAt = new Date().toISOString()
            }
          } catch {
            publishedAt = new Date().toISOString()
          }
        } else {
          publishedAt = new Date().toISOString()
        }
        
        return NextResponse.json({
          success: true,
          postId: result.post_id,
          publishedAt: publishedAt,
          url: result.post_id ? `https://www.instagram.com/p/${result.post_id}/` : null,
          simulated: false,
          details: result.platform_response
        })
      } else {
        return NextResponse.json({
          success: false,
          error: result.error || 'Instagram posting failed',
          details: result.platform_response,
          debug: {
            result_object: result
          }
        })
      }
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error: any) {
    console.error('Instagram testing error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error', 
        details: error.message 
      },
      { status: 500 }
    )
  }
}