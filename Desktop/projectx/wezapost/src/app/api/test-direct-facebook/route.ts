import { NextRequest, NextResponse } from 'next/server'
import { FacebookPoster } from '@/lib/posting/facebook-poster'

const WORKING_ACCESS_TOKEN = "EAAcAxcFoPXgBPWFxDn67Wp6ZB3nZAdYa5sbcJ4EK7f71hqQlOcBIL0TI8tXKPMfpMc3AxyaCDZArgMSZA0LWNZAdkCACWeENS5KV8G8VtpfPHtD7s5wDATSj2H8iY5Vopp1hTDD9XtSyU73kt0tI3OeJAzgUgLlRTaFfzFZABL6dHfjInortJmCjbJonluVLzhbZAGDULQT"
const WORKING_PAGE_ID = "302623692926333"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { content, media_urls } = body

    if (!content) {
      return NextResponse.json({
        success: false,
        error: 'Content is required'
      }, { status: 400 })
    }

    const facebookPoster = new FacebookPoster()

    // Test posting using the working access token and page ID
    const postData = {
      content,
      media_urls: media_urls || []
    }

    console.log('🔵 Testing direct Facebook post with:', {
      pageId: WORKING_PAGE_ID,
      hasToken: !!WORKING_ACCESS_TOKEN,
      content: content.substring(0, 50) + '...',
      mediaCount: media_urls?.length || 0
    })

    const result = await facebookPoster.postToFacebook(
      WORKING_ACCESS_TOKEN,
      WORKING_PAGE_ID,
      postData
    )

    return NextResponse.json({
      success: result.success,
      data: result,
      working_credentials: {
        page_id: WORKING_PAGE_ID,
        token_length: WORKING_ACCESS_TOKEN.length,
        token_preview: WORKING_ACCESS_TOKEN.substring(0, 20) + '...'
      }
    })

  } catch (error: any) {
    console.error('❌ Direct Facebook test error:', error)
    return NextResponse.json({
      success: false,
      error: `Direct Facebook test failed: ${error.message}`,
      details: error.stack
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Direct Facebook Test Endpoint',
    usage: 'POST with { content: "message", media_urls: ["url"] }',
    working_page_id: WORKING_PAGE_ID,
    token_configured: !!WORKING_ACCESS_TOKEN
  })
}