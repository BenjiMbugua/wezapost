import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { InstagramPoster } from '@/lib/posting/instagram-poster'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { content, account, mediaUrls } = await request.json()
    
    if (!content) {
      return NextResponse.json({
        success: false,
        error: 'Content is required for Instagram posting'
      }, { status: 400 })
    }

    if (!mediaUrls || mediaUrls.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'At least one image is required for Instagram posting'
      }, { status: 400 })
    }

    console.log('Instagram posting request for user:', session.user.id)

    // Use the same working Facebook page access token for Instagram
    // Instagram posting works through Facebook's Graph API using the page token
    const workingFacebookToken = 'EAAcAxcFoPXgBPU0GgS7hiaEfSgY3Jcqwn2uZARjkbOCUesZAaKSQZBPigYlfvifqm3zHaunxUmWH3WntAPKZB7ZB1w6D1f0lxym6FvgFUaGtTEJjrm0KJSZCsVTviQ8ZCPtZC5Ae5Y7CY39jKp81NPCI4bruLke5CNsImr3F991KVsiZAjggAjpQ1Mvv5AQOH5eZA6pLmkwd4J'
    const facebookPageId = '302623692926333'
    
    // If account data was provided from client, use working token for Instagram
    if (account && (account.platform === 'instagram' || account.username === 'Wezalabs Wezalabs')) {
      console.log('🎯 Using working Facebook page token for Instagram posting:', account.username)
      
      const instagramPoster = new InstagramPoster()
      
      // First, get the Instagram Business Account ID from the Facebook page
      try {
        console.log('🔍 Getting Instagram Business Account from Facebook page:', facebookPageId)
        
        const pageResponse = await fetch(
          `https://graph.facebook.com/v18.0/${facebookPageId}?fields=instagram_business_account&access_token=${workingFacebookToken}`
        )
        
        if (!pageResponse.ok) {
          const errorData = await pageResponse.json()
          throw new Error(`Failed to get Instagram account: ${errorData.error?.message || pageResponse.statusText}`)
        }
        
        const pageData = await pageResponse.json()
        const instagramBusinessAccount = pageData.instagram_business_account
        
        if (!instagramBusinessAccount?.id) {
          return NextResponse.json({
            success: false,
            error: 'No Instagram Business Account connected to this Facebook page',
            details: 'Please connect an Instagram Business Account to your Facebook page at business.facebook.com',
            simulated: false
          }, { status: 400 })
        }
        
        console.log('📸 Found Instagram Business Account:', instagramBusinessAccount.id)
        
        // Attempt to post to Instagram
        const result = await instagramPoster.postToInstagram(
          workingFacebookToken,
          instagramBusinessAccount.id,
          {
            content,
            media_urls: mediaUrls,
            platforms: ['instagram']
          }
        )

        if (result.success) {
          // Save successful post to database (only for UUID users)
          try {
            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(session.user.id)
            
            if (isUUID) {
              const { createSupabaseClientComponentClient } = await import('@/lib/supabase')
              const supabase = createSupabaseClientComponentClient()
              
              const { data: savedPost, error: saveError } = await supabase
                .from('posts')
                .insert([{
                  user_id: session.user.id,
                  content: content,
                  platforms: ['instagram'],
                  status: 'published',
                  published_at: new Date().toISOString(),
                  media_urls: mediaUrls,
                  platform_posts: [{
                    platform: 'instagram',
                    post_id: result.post_id,
                    url: `https://www.instagram.com/p/${result.post_id}/`,
                    published_at: result.published_at || new Date().toISOString()
                  }]
                }])
                .select('id')
                .single()

              if (saveError) {
                console.error('Failed to save Instagram post to database:', saveError)
              } else {
                console.log('✅ Instagram post saved to database:', savedPost?.id)
              }
            } else {
              console.log('ℹ️ Skipping database save for non-UUID user:', session.user.id)
            }
          } catch (dbError) {
            console.error('Database save error (non-fatal):', dbError)
          }

          return NextResponse.json({
            success: true,
            post: {
              id: result.post_id,
              created_at: result.published_at,
              url: `https://www.instagram.com/p/${result.post_id}/`,
            },
            simulated: false
          })
        } else {
          return NextResponse.json({
            success: false,
            error: result.error,
            details: result.platform_response,
            simulated: false
          }, { status: 400 })
        }
        
      } catch (error: any) {
        console.error('Instagram API error:', error)
        return NextResponse.json({
          success: false,
          error: `Instagram posting failed: ${error.message}`,
          details: error.message,
          simulated: false
        }, { status: 500 })
      }
    }

    // If no account data or not Instagram, return error
    return NextResponse.json({
      success: false,
      error: 'Instagram account data not provided',
      simulated: false
    }, { status: 400 })

  } catch (error: any) {
    console.error('Instagram posting error:', error)
    
    return NextResponse.json({
      success: false,
      error: `Instagram posting failed: ${error.message}`,
      details: {
        message: error.message,
        type: error.constructor.name
      },
      fallback_available: true,
      note: 'Please ensure Instagram Business Account is connected to Facebook page'
    }, { status: 500 })
  }
}