// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' })

const { createClient } = require('@supabase/supabase-js')

async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase connection...')
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  console.log('📋 Configuration:')
  console.log('- URL:', supabaseUrl)
  console.log('- Service Role Key (first 20 chars):', serviceRoleKey ? serviceRoleKey.substring(0, 20) + '...' : 'Missing')
  console.log('- Anon Key (first 20 chars):', anonKey ? anonKey.substring(0, 20) + '...' : 'Missing')
  
  // Test with anon key first
  console.log('\n🔌 Testing with anon key...')
  try {
    const anonClient = createClient(supabaseUrl, anonKey)
    const { data: anonData, error: anonError } = await anonClient
      .from('curated_posts')
      .select('count')
      .limit(1)
    
    if (anonError) {
      console.log('❌ Anon key test failed:', anonError.message)
    } else {
      console.log('✅ Anon key works - can read data')
    }
  } catch (error) {
    console.log('❌ Anon key connection failed:', error.message)
  }
  
  // Test with service role key
  console.log('\n🔌 Testing with service role key...')
  try {
    const serviceClient = createClient(supabaseUrl, serviceRoleKey)
    const { data: serviceData, error: serviceError } = await serviceClient
      .from('curated_posts')
      .select('count')
      .limit(1)
    
    if (serviceError) {
      console.log('❌ Service role key test failed:', serviceError.message)
      
      // Try to get more details about the error
      if (serviceError.message.includes('Invalid authentication credentials')) {
        console.log('💡 This usually means:')
        console.log('   - Service role key is incorrect')
        console.log('   - Service role key is for a different project')
        console.log('   - Project URL is incorrect')
      }
    } else {
      console.log('✅ Service role key works - can read data')
    }
  } catch (error) {
    console.log('❌ Service role key connection failed:', error.message)
  }
  
  // Test if the URL is accessible
  console.log('\n🌐 Testing URL accessibility...')
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`
      }
    })
    
    if (response.ok) {
      console.log('✅ Supabase URL is accessible')
    } else {
      console.log(`❌ Supabase URL returned status: ${response.status}`)
    }
  } catch (error) {
    console.log('❌ Cannot reach Supabase URL:', error.message)
  }
}

testSupabaseConnection() 