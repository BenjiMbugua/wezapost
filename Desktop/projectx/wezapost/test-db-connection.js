// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' })

const { createClient } = require('@supabase/supabase-js')

// Test database connection and curated posts table
async function testDatabaseConnection() {
  console.log('🔍 Testing Supabase database connection...')
  
  // Check environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  console.log('📋 Environment check:')
  console.log('- Supabase URL:', supabaseUrl ? '✅ Set' : '❌ Missing')
  console.log('- Service Role Key:', serviceRoleKey ? '✅ Set' : '❌ Missing')
  
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Missing required environment variables')
    return
  }
  
  try {
    // Create service role client
    const supabase = createClient(supabaseUrl, serviceRoleKey)
    
    console.log('🔌 Testing connection...')
    
    // Test basic connection
    const { data: testData, error: testError } = await supabase
      .from('curated_posts')
      .select('count')
      .limit(1)
    
    if (testError) {
      console.error('❌ Database connection failed:', testError)
      return
    }
    
    console.log('✅ Database connection successful')
    
    // Test inserting a curated post
    const testPost = {
      id: `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      user_id: 'webhook_global',
      content: '🧪 Test post for database connection',
      hashtags: ['#test', '#database'],
      images: [],
      links: [],
      platforms: ['twitter'],
      source: {
        type: 'test',
        workflow_id: 'test_connection',
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
    
    console.log('📝 Testing curated post insertion...')
    
    const { data: insertData, error: insertError } = await supabase
      .from('curated_posts')
      .insert(testPost)
      .select()
      .single()
    
    if (insertError) {
      console.error('❌ Insert failed:', insertError)
      console.error('❌ Error details:', {
        code: insertError.code,
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint
      })
      return
    }
    
    console.log('✅ Curated post inserted successfully:', {
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
    
    console.log('🎉 All tests passed! Database is working correctly.')
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

// Run the test
testDatabaseConnection() 