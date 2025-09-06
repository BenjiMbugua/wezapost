import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { FacebookPoster } from '@/lib/posting/facebook-poster'
import { SocialProviderManager } from '@/lib/social-providers'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { content, account } = await request.json()
    const facebookPoster = new FacebookPoster()
    const socialManager = new SocialProviderManager()

    if (!content) {
      return NextResponse.json({
        success: false,
        error: 'Content is required for Facebook posting'
      }, { status: 400 })
    }

    console.log('Facebook posting request for user:', session.user.id)

    // Try to get Facebook account from SocialProviderManager
    let fbAccountData = null
    let errorDetails = []

    // Use the working long-lived access token for Facebook posting
    const workingFacebookToken = 'EAAcAxcFoPXgBPU0GgS7hiaEfSgY3Jcqwn2uZARjkbOCUesZAaKSQZBPigYlfvifqm3zHaunxUmWH3WntAPKZB7ZB1w6D1f0lxym6FvgFUaGtTEJjrm0KJSZCsVTviQ8ZCPtZC5Ae5Y7CY39jKp81NPCI4bruLke5CNsImr3F991KVsiZAjggAjpQ1Mvv5AQOH5eZA6pLmkwd4J'
    const workingPageId = '302623692926333'
    
    // If account data was provided directly from client (localStorage), use working token
    if (account && (account.platform === 'facebook' || account.username === 'Wezalabs Wezalabs')) {
      console.log('🎯 Using working long-lived token for Facebook posting:', account.username)
      
      fbAccountData = {
        access_token: workingFacebookToken,
        platform_user_id: workingPageId,
        username: account.username || 'Wezalabs Wezalabs'
      }
      
      console.log('✅ Using working Facebook configuration:', {
        pageId: workingPageId,
        username: fbAccountData.username,
        hasToken: !!fbAccountData.access_token
      })
    }

    // Only try database lookup if we don't have account data from client
    if (!fbAccountData) {
      try {
        const accounts = await socialManager.getConnectedAccounts(session.user.id)
        const facebookAccount = accounts.find(acc => acc.platform === 'facebook')
        
        if (facebookAccount) {
          console.log('Found Facebook account via SocialProviderManager:', facebookAccount.username)
          // This gives us basic info, but we need access tokens from stored data
        } else {
          errorDetails.push('No Facebook account found via SocialProviderManager')
        }
      } catch (error: any) {
        errorDetails.push(`SocialProviderManager error: ${error.message}`)
      }

      // Try to get from Supabase database
      try {
        const { createSupabaseClientComponentClient } = await import('@/lib/supabase')
        const supabase = createSupabaseClientComponentClient()
        
        const { data: dbAccountData, error: dbError } = await supabase
          .from('social_accounts')
          .select('*')
          .eq('user_id', session.user.id)
          .eq('platform', 'facebook')
          .eq('is_active', true)
          .single()

        if (!dbError && dbAccountData?.access_token) {
          fbAccountData = dbAccountData
          console.log('Found Facebook account in database with access token')
        } else {
          errorDetails.push(`Database error: ${dbError?.message || 'No access token found'}`)
        }
      } catch (error: any) {
        errorDetails.push(`Database connection error: ${error.message}`)
      }
    }

    // If no real account data found, return demo mode
    if (!fbAccountData?.access_token) {
      console.log('Facebook posting falling back to demo mode. Errors:', errorDetails)
      
      // Return simulated success for demo
      return NextResponse.json({
        success: true,
        post: {
          id: `fb_demo_${Date.now()}`,
          created_at: new Date().toISOString(),
          url: 'https://www.facebook.com/demo-post',
        },
        simulated: true,
        note: 'Simulated Facebook post (no real account configured)',
        debug_info: errorDetails
      })
    }

    // Attempt to post to Facebook  
    // Note: platform_user_id should contain the Facebook page ID
    const result = await facebookPoster.postToFacebook(
      fbAccountData.access_token,
      fbAccountData.platform_user_id,
      {
        content,
        platforms: ['facebook']
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
              platforms: ['facebook'],
              status: 'published',
              published_at: new Date().toISOString(),
              platform_posts: [{
                platform: 'facebook',
                post_id: result.post_id,
                url: `https://www.facebook.com/${result.post_id}`,
                published_at: result.published_at || new Date().toISOString()
              }]
            }])
            .select('id')
            .single()

          if (saveError) {
            console.error('Failed to save Facebook post to database:', saveError)
          } else {
            console.log('✅ Facebook post saved to database:', savedPost?.id)
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
          url: `https://www.facebook.com/${result.post_id}`,
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
    console.error('Facebook posting error:', error)
    console.error('Error stack:', error.stack)
    
    // Return detailed error information
    return NextResponse.json({
      success: false,
      error: `Facebook posting failed: ${error.message}`,
      details: {
        message: error.message,
        stack: error.stack,
        type: error.constructor.name
      },
      fallback_available: true,
      note: 'You can enable demo mode by connecting a Facebook account first'
    }, { status: 500 })
  }
}