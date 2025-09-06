import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { socialPostingService } from '@/lib/social-posting-service'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { platforms, content, media } = await request.json()

    if (!platforms || !Array.isArray(platforms) || platforms.length === 0) {
      return NextResponse.json({ error: 'Platforms array is required' }, { status: 400 })
    }

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    console.log('🧪 Testing social posting:', {
      userId: session.user.id,
      platforms,
      contentLength: content.length,
      mediaCount: media?.length || 0
    })

    const results = await socialPostingService.postToPlatforms(
      session.user.id,
      platforms,
      content,
      media
    )

    return NextResponse.json({
      success: true,
      results,
      summary: {
        total: results.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      }
    })

  } catch (error: any) {
    console.error('❌ Social posting test error:', error)
    return NextResponse.json(
      { error: 'Social posting test failed', details: error.message },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Social Media Posting Test Endpoint',
    usage: {
      method: 'POST',
      body: {
        platforms: ['twitter', 'facebook', 'instagram'],
        content: 'Your test post content',
        media: ['optional_image_url_1', 'optional_image_url_2']
      }
    },
    example: {
      platforms: ['twitter'],
      content: '🧪 Testing WezaPost social media integration! #test #socialmedia',
      media: []
    }
  })
}