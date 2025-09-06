import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { TikTokPoster } from '@/lib/posting/tiktok-poster'

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
        error: 'Content is required for TikTok posting'
      }, { status: 400 })
    }

    console.log('TikTok posting request for user:', session.user.id)

    // If account data was provided from client, use it for TikTok posting
    if (account && (account.platform === 'tiktok' || account.access_token)) {
      console.log('🎯 Using TikTok account for posting:', account.username || account.display_name)
      
      const tiktokPoster = new TikTokPoster()
      
      // Attempt to post to TikTok
      const result = await tiktokPoster.postToTikTok(
        account.access_token,
        {
          content,
          media_urls: mediaUrls || [],
          platforms: ['tiktok']
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
                platforms: ['tiktok'],
                status: 'published',
                published_at: new Date().toISOString(),
                media_urls: mediaUrls || [],
                platform_posts: [{
                  platform: 'tiktok',
                  post_id: result.post_id,
                  url: `https://www.tiktok.com/@${account.username || 'user'}/video/${result.post_id}`,
                  published_at: result.published_at || new Date().toISOString()
                }]
              }])
              .select('id')
              .single()

            if (saveError) {
              console.error('Failed to save TikTok post to database:', saveError)
            } else {
              console.log('✅ TikTok post saved to database:', savedPost?.id)
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
            url: `https://www.tiktok.com/@${account.username || 'user'}/video/${result.post_id}`,
          },
          simulated: !!result.platform_response?.simulated,
          note: result.platform_response?.simulated ? 'TikTok posting requires video content' : undefined
        })
      } else {
        return NextResponse.json({
          success: false,
          error: result.error,
          details: result.platform_response,
          simulated: false
        }, { status: 400 })
      }
    }

    // If no account data, return demo response
    return NextResponse.json({
      success: true,
      post: {
        id: `tiktok_demo_${Date.now()}`,
        created_at: new Date().toISOString(),
        url: 'https://www.tiktok.com/@demo/video/demo',
      },
      simulated: true,
      note: 'TikTok account not configured - demo response'
    })

  } catch (error: any) {
    console.error('TikTok posting error:', error)
    
    return NextResponse.json({
      success: false,
      error: `TikTok posting failed: ${error.message}`,
      details: {
        message: error.message,
        type: error.constructor.name
      },
      note: 'TikTok posting requires valid access token and video content'
    }, { status: 500 })
  }
}