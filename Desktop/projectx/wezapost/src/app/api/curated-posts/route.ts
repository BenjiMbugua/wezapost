import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { CuratedPost, N8nCuratedPostPayload } from '@/types/curated-posts'
import { 
  getCuratedPostsFromSupabase, 
  saveCuratedPost, 
  CuratedPostFilters 
} from '@/lib/storage/supabase-curated-posts'

// GET - Fetch curated posts with filtering
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Allow demo mode access
    const isDemo = !session?.user?.id
    if (!session?.user?.id && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const platform = searchParams.get('platform')
    const contentType = searchParams.get('content_type')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Use Supabase storage
    const userId = session?.user?.id || 'demo_user'
    
    const filters: CuratedPostFilters = {
      status: status as any,
      platform,
      contentType: contentType as any,
      limit,
      offset
    }
    
    const curatedPosts: CuratedPost[] = await getCuratedPostsFromSupabase(userId, filters)

    const total = curatedPosts.length
    const filteredPosts = curatedPosts.slice(offset, offset + limit)

    return NextResponse.json({
      success: true,
      data: {
        posts: filteredPosts,
        pagination: {
          total,
          limit,
          offset,
          has_more: offset + limit < total
        }
      }
    })

  } catch (error: any) {
    console.error('Error fetching curated posts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch curated posts', details: error.message },
      { status: 500 }
    )
  }
}

// POST - Create new curated post (from n8n or manual)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload: N8nCuratedPostPayload = await request.json()

    // Validate required fields
    if (!payload.content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      )
    }

    // Process and normalize the payload
    const curatedPost: CuratedPost = {
      id: `curated_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      content: payload.content.trim(),
      hashtags: normalizeHashtags(payload.hashtags),
      images: normalizeImages(payload.images),
      links: normalizeLinks(payload.links),
      platforms: normalizePlatforms(payload.platforms),
      source: {
        type: (payload.source_type as any) || 'n8n',
        workflow_id: payload.workflow_id,
        source_url: payload.metadata?.source_url,
        curated_at: new Date().toISOString()
      },
      status: 'draft',
      metadata: {
        character_count: payload.content.length,
        estimated_engagement: estimateEngagement(payload.content, payload.hashtags, payload.images),
        content_type: determineContentType(payload),
        topics: payload.metadata?.topics || extractTopics(payload.content),
        sentiment: analyzeSentiment(payload.content)
      },
      scheduling: {
        suggested_time: payload.scheduling?.suggested_time,
        optimal_platforms: payload.scheduling?.optimal_platforms,
        priority: (payload.metadata?.priority as any) || 'medium'
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // Save to Supabase
    const userId = session?.user?.id || 'demo_user'
    const saved = await saveCuratedPost(userId, curatedPost)

    if (saved) {
      console.log('New curated post created:', {
        id: curatedPost.id,
        content_preview: curatedPost.content.substring(0, 50) + '...',
        source: curatedPost.source.type,
        hashtags_count: curatedPost.hashtags.length,
        images_count: curatedPost.images.length,
        links_count: curatedPost.links.length
      })

      return NextResponse.json({
        success: true,
        data: curatedPost,
        message: 'Curated post created successfully'
      })
    } else {
      throw new Error('Failed to save curated post')
    }

  } catch (error: any) {
    console.error('Error creating curated post:', error)
    return NextResponse.json(
      { error: 'Failed to create curated post', details: error.message },
      { status: 500 }
    )
  }
}

// Helper functions
function normalizeHashtags(hashtags?: string[] | string): string[] {
  if (!hashtags) return []
  
  if (typeof hashtags === 'string') {
    return hashtags.split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0)
      .map(tag => tag.startsWith('#') ? tag : `#${tag}`)
  }
  
  return hashtags
    .filter(tag => tag && tag.trim().length > 0)
    .map(tag => tag.trim())
    .map(tag => tag.startsWith('#') ? tag : `#${tag}`)
}

function normalizeImages(images?: Array<{ url: string, alt_text?: string, caption?: string }>): CuratedPost['images'] {
  if (!images) return []
  
  return images.map((img, index) => ({
    id: `img_${Date.now()}_${index}`,
    url: img.url,
    alt_text: img.alt_text,
    caption: img.caption,
    is_primary: index === 0
  }))
}

function normalizeLinks(links?: Array<{ url: string, title?: string, description?: string }>): CuratedPost['links'] {
  if (!links) return []
  
  return links.map((link, index) => ({
    id: `link_${Date.now()}_${index}`,
    url: link.url,
    title: link.title,
    description: link.description,
    domain: new URL(link.url).hostname
  }))
}

function normalizePlatforms(platforms?: string[] | string): string[] {
  if (!platforms) return ['twitter']
  
  if (typeof platforms === 'string') {
    return platforms.split(',').map(p => p.trim().toLowerCase()).filter(p => p.length > 0)
  }
  
  return platforms.map(p => p.trim().toLowerCase()).filter(p => p.length > 0)
}

function determineContentType(payload: N8nCuratedPostPayload): CuratedPost['metadata']['content_type'] {
  const hasImages = payload.images && payload.images.length > 0
  const hasLinks = payload.links && payload.links.length > 0
  
  if (hasImages && hasLinks) return 'mixed'
  if (hasImages) return 'image'
  if (hasLinks) return 'link'
  return 'text'
}

function estimateEngagement(content: string, hashtags?: string[] | string, images?: any[]): number {
  let score = 50 // Base score
  
  // Content length factor
  if (content.length > 100 && content.length < 200) score += 10
  if (content.length > 200) score -= 5
  
  // Hashtags factor
  const hashtagCount = Array.isArray(hashtags) ? hashtags.length : 
    (typeof hashtags === 'string' ? hashtags.split(',').length : 0)
  if (hashtagCount > 0 && hashtagCount <= 3) score += 15
  if (hashtagCount > 3) score -= 5
  
  // Images factor
  if (images && images.length > 0) score += 20
  
  // Question factor
  if (content.includes('?')) score += 10
  
  return Math.min(100, Math.max(0, score))
}

function extractTopics(content: string): string[] {
  // Simple topic extraction (in production, use NLP)
  const commonTopics = [
    'technology', 'business', 'marketing', 'social media', 'innovation',
    'productivity', 'leadership', 'entrepreneurship', 'digital transformation',
    'AI', 'data', 'growth', 'strategy', 'tips', 'insights'
  ]
  
  return commonTopics.filter(topic => 
    content.toLowerCase().includes(topic.toLowerCase())
  ).slice(0, 3)
}

function analyzeSentiment(content: string): CuratedPost['metadata']['sentiment'] {
  // Simple sentiment analysis (in production, use proper NLP)
  const positiveWords = ['great', 'amazing', 'excellent', 'fantastic', 'awesome', 'love', 'best', 'perfect']
  const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'worst', 'problem', 'issue', 'difficult']
  
  const lowerContent = content.toLowerCase()
  const positiveCount = positiveWords.filter(word => lowerContent.includes(word)).length
  const negativeCount = negativeWords.filter(word => lowerContent.includes(word)).length
  
  if (positiveCount > negativeCount) return 'positive'
  if (negativeCount > positiveCount) return 'negative'
  return 'neutral'
}

// Storage functions moved to shared module: /lib/storage/curated-posts.ts