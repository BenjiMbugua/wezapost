import { NextRequest, NextResponse } from 'next/server'
import { CuratedPost, N8nCuratedPostPayload } from '@/types/curated-posts'
import { saveWebhookCuratedPost } from '@/lib/storage/supabase-curated-posts'
import { randomUUID } from 'crypto'

// This endpoint is specifically for n8n webhooks and doesn't require authentication
// Use API keys or other authentication methods in production

export async function POST(request: NextRequest) {
  try {
    // Log incoming request details
    console.log('🔍 Incoming n8n request:', {
      method: request.method,
      url: request.url,
      headers: Object.fromEntries(request.headers.entries()),
      contentType: request.headers.get('content-type')
    })

    // Optional API key validation
    const apiKey = request.headers.get('x-api-key')
    const expectedApiKey = process.env.N8N_WEBHOOK_API_KEY
    
    if (expectedApiKey && apiKey !== expectedApiKey) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
    }

    // Get raw body text first for debugging
    const rawBody = await request.text()
    console.log('📦 Raw request body:', {
      length: rawBody.length,
      preview: rawBody.substring(0, 200),
      isEmpty: rawBody.trim() === ''
    })

    // Try to parse JSON
    let payload: N8nCuratedPostPayload
    if (rawBody.trim() === '') {
      console.log('❌ Empty request body')
      return NextResponse.json(
        { 
          error: 'Empty request body',
          debug: 'n8n HTTP Request node is not sending JSON data',
          help: {
            step1: 'In your n8n HTTP Request node, set Body to "JSON"',
            step2: 'Add JSON content like: {"content": "test", "hashtags": ["#test"], "platforms": ["twitter"], "workflow_id": "test"}',
            step3: 'Make sure previous nodes are providing data if using expressions',
            headers_received: Object.fromEntries(request.headers.entries()),
            content_length: rawBody.length
          }
        },
        { status: 400 }
      )
    }

    try {
      payload = JSON.parse(rawBody)
    } catch (parseError: any) {
      console.log('❌ JSON parse error:', parseError.message)
      return NextResponse.json(
        { 
          error: 'Invalid JSON format',
          debug: parseError.message,
          help: {
            step1: 'Ensure your n8n HTTP Request node is sending valid JSON',
            step2: 'Check that the body content type is set to "JSON"',
            step3: 'Validate your JSON structure',
            raw_body_preview: rawBody.substring(0, 200)
          }
        },
        { status: 400 }
      )
    }

    console.log('🤖 n8n webhook received:', {
      content_preview: payload.content?.substring(0, 50) + '...',
      workflow_id: payload.workflow_id,
      source_type: payload.source_type,
      platforms: payload.platforms,
      hashtags_count: Array.isArray(payload.hashtags) ? payload.hashtags.length : (payload.hashtags ? payload.hashtags.split(',').length : 0),
      images_count: payload.images?.length || 0,
      links_count: payload.links?.length || 0
    })

    // Validate required fields
    if (!payload.content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      )
    }

    // Process and normalize the payload
    const curatedPost: CuratedPost = {
      id: randomUUID(), // Use built-in crypto.randomUUID()
      content: payload.content.trim(),
      hashtags: normalizeHashtags(payload.hashtags),
      images: normalizeImages(payload.images),
      links: normalizeLinks(payload.links),
      platforms: normalizePlatforms(payload.platforms),
      source: {
        type: 'n8n',
        workflow_id: payload.workflow_id || 'unknown',
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
        optimal_platforms: payload.scheduling?.optimal_platforms || normalizePlatforms(payload.platforms),
        priority: (payload.metadata?.priority as any) || 'medium'
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // Save to Supabase using webhook function (bypasses RLS)
    const saved = await saveWebhookCuratedPost(curatedPost)

    if (saved) {
      // Immediate response to prevent timeout
      const quickResponse = {
        success: true,
        id: curatedPost.id,
        status: 'received',
        message: 'Curated post received and processing'
      }

      // Log details asynchronously
      setImmediate(() => {
        console.log('✅ n8n curated post created successfully:', {
          id: curatedPost.id,
          content_length: curatedPost.content.length,
          platforms: curatedPost.platforms,
          priority: curatedPost.scheduling.priority,
          estimated_engagement: curatedPost.metadata.estimated_engagement
        })
      })

      return NextResponse.json(quickResponse)
    } else {
      throw new Error('Failed to save curated post')
    }

  } catch (error: any) {
    console.error('❌ n8n webhook error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to process n8n webhook', 
        details: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

// GET endpoint for webhook verification (optional)
export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'active',
    endpoint: 'n8n curated posts webhook',
    methods: ['POST'],
    timestamp: new Date().toISOString(),
    example_payload: {
      content: "Your curated content here...",
      hashtags: ["#example", "#curated"],
      images: [
        {
          url: "https://example.com/image.jpg",
          alt_text: "Example image",
          caption: "Image caption"
        }
      ],
      links: [
        {
          url: "https://example.com/article",
          title: "Article Title",
          description: "Article description"
        }
      ],
      platforms: ["twitter", "linkedin"],
      metadata: {
        source_url: "https://example.com/source",
        topics: ["technology", "innovation"],
        priority: "high"
      },
      workflow_id: "your_n8n_workflow_id"
    }
  })
}

// Helper functions (duplicated from main API for independence)
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