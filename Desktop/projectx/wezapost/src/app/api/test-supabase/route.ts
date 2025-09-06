import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseStorageStats, saveWebhookCuratedPost } from '@/lib/storage/supabase-curated-posts'
import { CuratedPost } from '@/types/curated-posts'
import { randomUUID } from 'crypto'

export async function GET(request: NextRequest) {
  try {
    const stats = await getSupabaseStorageStats()
    
    return NextResponse.json({
      success: true,
      message: 'Supabase connection test successful',
      stats,
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: 'Supabase connection failed',
      details: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const testPost: CuratedPost = {
      id: randomUUID(),
      content: "🧪 Test curated post from Supabase integration - this validates our n8n workflow can save posts to the database!",
      hashtags: ["#test", "#supabase", "#wezapost"],
      images: [{
        id: randomUUID(),
        url: "https://cdn.wezalabs.com/social/supabase-test.png",
        alt_text: "Test image for Supabase integration",
        is_primary: true
      }],
      links: [],
      platforms: ["twitter"],
      source: {
        type: "test",
        workflow_id: "supabase_test",
        curated_at: new Date().toISOString()
      },
      status: "draft",
      metadata: {
        character_count: 128,
        estimated_engagement: 75,
        content_type: "text",
        topics: ["testing", "integration"],
        sentiment: "positive"
      },
      scheduling: {
        priority: "medium",
        optimal_platforms: ["twitter"]
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const saved = await saveWebhookCuratedPost(testPost)

    if (saved) {
      return NextResponse.json({
        success: true,
        message: 'Test post saved to Supabase successfully',
        postId: testPost.id,
        timestamp: new Date().toISOString()
      })
    } else {
      throw new Error('Failed to save test post')
    }
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: 'Failed to save test post to Supabase',
      details: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}