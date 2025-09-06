import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { FacebookPoster } from '@/lib/posting/facebook-poster'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { content } = await request.json()
    
    if (!content) {
      return NextResponse.json({
        success: false,
        error: 'Content is required for Facebook posting'
      }, { status: 400 })
    }

    // Use the provided long-lived access token
    const longLivedToken = 'EAAcAxcFoPXgBPU0GgS7hiaEfSgY3Jcqwn2uZARjkbOCUesZAaKSQZBPigYlfvifqm3zHaunxUmWH3WntAPKZB7ZB1w6D1f0lxym6FvgFUaGtTEJjrm0KJSZCsVTviQ8ZCPtZC5Ae5Y7CY39jKp81NPCI4bruLke5CNsImr3F991KVsiZAjggAjpQ1Mvv5AQOH5eZA6pLmkwd4J'
    const pageId = '302623692926333' // Wezalabs page ID from logs

    console.log('🧪 Testing Facebook posting with long-lived token')
    console.log('Page ID:', pageId)
    console.log('Content:', content)

    // First, let's check what permissions this token has
    try {
      const permissionsResponse = await fetch(
        `https://graph.facebook.com/v18.0/me/permissions?access_token=${longLivedToken}`
      )
      
      if (permissionsResponse.ok) {
        const permissionsData = await permissionsResponse.json()
        console.log('Token permissions:', permissionsData.data?.map(p => `${p.permission}: ${p.status}`))
      }

      // Check page info
      const pageResponse = await fetch(
        `https://graph.facebook.com/v18.0/${pageId}?fields=id,name,category,tasks&access_token=${longLivedToken}`
      )
      
      if (pageResponse.ok) {
        const pageData = await pageResponse.json()
        console.log('Page info:', pageData)
      }
    } catch (debugError) {
      console.log('Debug info failed:', debugError.message)
    }

    // Attempt to post using the long-lived token
    const facebookPoster = new FacebookPoster()
    const result = await facebookPoster.postToFacebook(
      longLivedToken,
      pageId,
      {
        content,
        platforms: ['facebook']
      }
    )

    if (result.success) {
      return NextResponse.json({
        success: true,
        post: {
          id: result.post_id,
          created_at: result.published_at,
          url: `https://www.facebook.com/${result.post_id}`,
        },
        message: 'Posted using long-lived access token!',
        simulated: false
      })
    } else {
      return NextResponse.json({
        success: false,
        error: result.error,
        details: result.platform_response,
        message: 'Failed with long-lived token',
        simulated: false
      }, { status: 400 })
    }

  } catch (error: any) {
    console.error('Long-lived token Facebook posting error:', error)
    
    return NextResponse.json({
      success: false,
      error: `Facebook posting failed: ${error.message}`,
      details: {
        message: error.message,
        type: error.constructor.name
      }
    }, { status: 500 })
  }
}