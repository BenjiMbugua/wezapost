import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseClientComponentClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    console.log('📤 YouTube posting request received')

    const { postData, accountData, videoData } = await request.json()

    if (!postData || !accountData) {
      return NextResponse.json({
        success: false,
        error: 'Missing post data or account data'
      }, { status: 400 })
    }

    // For YouTube, we need either video data or it's a community post
    if (!videoData) {
      // YouTube Community Posts require different API
      return NextResponse.json({
        success: false,
        error: 'YouTube posting requires video upload. Community posts not yet supported.',
        message: 'Please upload a video file for YouTube posting'
      }, { status: 400 })
    }

    console.log('🎥 Posting video to YouTube:', {
      account: accountData.display_name,
      title: videoData.title || 'Untitled Video',
      description: postData.content.substring(0, 50) + '...'
    })

    // Get access token from account data
    let accessToken = accountData.access_token

    if (!accessToken) {
      console.error('❌ No YouTube access token found')
      return NextResponse.json({
        success: false,
        error: 'No access token available for YouTube account'
      }, { status: 400 })
    }

    // Refresh token if needed (YouTube tokens expire)
    if (accountData.expires_at && new Date() > new Date(accountData.expires_at)) {
      console.log('🔄 Refreshing YouTube access token...')
      
      if (!accountData.refresh_token) {
        return NextResponse.json({
          success: false,
          error: 'Access token expired and no refresh token available'
        }, { status: 401 })
      }

      const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: accountData.refresh_token,
          client_id: process.env.GOOGLE_CLIENT_ID!,
          client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        })
      })

      const refreshData = await refreshResponse.json()
      
      if (!refreshResponse.ok) {
        console.error('Token refresh failed:', refreshData)
        return NextResponse.json({
          success: false,
          error: 'Failed to refresh access token'
        }, { status: 401 })
      }

      accessToken = refreshData.access_token
      console.log('✅ Token refreshed successfully')
    }

    // Prepare YouTube video upload metadata
    const videoMetadata = {
      snippet: {
        title: videoData.title || 'Video from WezaPost',
        description: postData.content,
        tags: videoData.tags || ['wezapost', 'social media'],
        categoryId: '22', // People & Blogs category
        defaultLanguage: 'en',
        defaultAudioLanguage: 'en'
      },
      status: {
        privacyStatus: videoData.privacy || 'public', // public, unlisted, private
        embeddable: true,
        license: 'youtube',
        publicStatsViewable: true
      }
    }

    console.log('🔄 Uploading video to YouTube API...')

    // For now, we'll simulate the upload since we need multipart file upload
    // In a real implementation, you'd use resumable upload protocol
    console.log('⚠️  YouTube video upload simulation - Real implementation requires multipart upload')
    console.log('📝 Video metadata:', JSON.stringify(videoMetadata, null, 2))

    // Simulate successful upload (replace with real implementation)
    const simulatedResponse = {
      id: `youtube_video_${Date.now()}`,
      snippet: videoMetadata.snippet,
      status: videoMetadata.status
    }

    console.log('✅ YouTube video upload simulated:', simulatedResponse.id)

    // Try to save post to database
    try {
      const supabase = createSupabaseClientComponentClient()
      
      // Convert Google OAuth user ID to UUID if needed
      let userId = postData.user_id
      if (userId && !userId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        console.log('Converting non-UUID user ID for database compatibility')
        userId = null // Will skip database save for non-UUID users
      }

      if (userId) {
        const { error: dbError } = await supabase
          .from('posts')
          .insert({
            user_id: userId,
            content: postData.content,
            platforms: ['youtube'],
            status: 'published',
            scheduled_at: new Date().toISOString(),
            published_at: new Date().toISOString(),
            external_ids: {
              youtube: simulatedResponse.id
            }
          })

        if (dbError) {
          console.log('Database save failed:', dbError.message)
        } else {
          console.log('✅ Post saved to database')
        }
      }
    } catch (error) {
      console.log('Database not available, skipping save:', error)
    }

    return NextResponse.json({
      success: true,
      platform: 'youtube',
      post_id: simulatedResponse.id,
      message: 'Video upload simulated - Real implementation requires file upload',
      video_url: `https://youtube.com/watch?v=${simulatedResponse.id}`,
      simulated: true
    })

  } catch (error: any) {
    console.error('❌ YouTube posting error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'YouTube posting failed'
    }, { status: 500 })
  }
}