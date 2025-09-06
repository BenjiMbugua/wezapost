import { createClient } from '@supabase/supabase-js'

// Admin client that completely bypasses RLS
// This should only be used in API routes where we've already verified user authentication
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    db: {
      schema: 'public'
    }
  }
)

// Test function to verify admin access
export async function testAdminAccess() {
  try {
    // Try to create a test record
    const { data, error } = await supabaseAdmin
      .from('posts')
      .insert({
        user_id: 'test-admin-access',
        content: 'Test admin access',
        platforms: ['test'],
        status: 'draft'
      })
      .select('id')
      .single()

    if (error) {
      console.error('Admin access test failed:', error)
      return false
    }

    // Clean up test record
    await supabaseAdmin
      .from('posts')
      .delete()
      .eq('id', data.id)

    console.log('✅ Admin access test successful')
    return true
  } catch (error) {
    console.error('Admin access test error:', error)
    return false
  }
} 