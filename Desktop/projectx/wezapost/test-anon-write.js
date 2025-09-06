// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' })

const { createClient } = require('@supabase/supabase-js')
const { v4: uuidv4 } = require('uuid')

async function testAnonKeyWrite() {
  console.log('🔍 Testing anon key write permissions...')
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !anonKey) {
    console.error('❌ Missing environment variables')
    return
  }
  
  try {
    const supabase = createClient(supabaseUrl, anonKey)
    
    // Test inserting a curated post with anon key
    const testPost = {
      id: uuidv4(), // Use proper UUID format
      user_id: 'webhook_global',
      content: '🧪 Test post with anon key write',
      hashtags: ['#test', '#anon', '#write'],
      images: [],
      links: [],
      platforms: ['twitter'],
      source: {
        type: 'test',
        workflow_id: 'test_anon_write',
        curated_at: new Date().toISOString()
      },
      status: 'draft',
      metadata: {
        character_count: 35,
        estimated_engagement: 10,
        content_type: 'text',
        topics: ['testing'],
        sentiment: 'neutral'
      },
      scheduling: {
        priority: 'low',
        optimal_platforms: ['twitter']
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    console.log('📝 Testing anon key insert...')
    
    const { data: insertData, error: insertError } = await supabase
      .from('curated_posts')
      .insert(testPost)
      .select()
      .single()
    
    if (insertError) {
      console.error('❌ Anon key insert failed:', insertError)
      console.error('❌ Error details:', {
        code: insertError.code,
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint
      })
      return
    }
    
    console.log('✅ Anon key insert successful:', {
      id: insertData.id,
      content: insertData.content,
      status: insertData.status
    })
    
    // Clean up test data
    console.log('🧹 Cleaning up test data...')
    const { error: deleteError } = await supabase
      .from('curated_posts')
      .delete()
      .eq('id', testPost.id)
    
    if (deleteError) {
      console.error('⚠️ Failed to clean up test data:', deleteError)
    } else {
      console.log('✅ Test data cleaned up')
    }
    
    console.log('🎉 Anon key can write to database!')
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

testAnonKeyWrite() 