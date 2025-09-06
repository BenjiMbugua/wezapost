import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { SocialProviderManager } from '@/lib/social-providers'
import { createSupabaseClientComponentClient } from '@/lib/supabase'

/**
 * Simple endpoint to check Instagram OAuth test status
 */
export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      status: 'ready',
      message: 'Instagram OAuth test monitoring active',
      server_time: new Date().toISOString(),
      callback_endpoint: `${process.env.NEXTAUTH_URL}/api/social/instagram/callback`,
      instructions: [
        'Watch the server logs while testing OAuth',
        'Any callback activity will show in the server output',
        'Success/failure will be logged with details'
      ],
      test_urls: {
        direct_oauth: `https://api.instagram.com/oauth/authorize?client_id=${process.env.INSTAGRAM_CLIENT_ID}&redirect_uri=${encodeURIComponent(`${process.env.NEXTAUTH_URL}/api/social/instagram/callback`)}&scope=user_profile%2Cuser_media&response_type=code&state=test_user_123`,
        dashboard: `${process.env.NEXTAUTH_URL}/dashboard`
      }
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { action } = await request.json()
    const socialManager = new SocialProviderManager()

    if (action === 'check_database') {
      // Check what accounts exist in the database
      const supabase = createSupabaseClientComponentClient()
      
      const { data: accounts, error } = await supabase
        .from('social_accounts')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('platform', 'instagram')
        .eq('is_active', true)

      if (error) {
        return NextResponse.json({ 
          success: false, 
          error: `Database error: ${error.message}` 
        })
      }

      return NextResponse.json({
        success: true,
        accounts: accounts || [],
        message: `Found ${accounts?.length || 0} Instagram accounts in database`
      })
    }

    if (action === 'test_connection') {
      // Test connection to Instagram accounts
      try {
        const accounts = await socialManager.getConnectedAccounts(session.user.id)
        const instagramAccounts = accounts.filter(acc => acc.platform === 'instagram')
        
        if (instagramAccounts.length === 0) {
          return NextResponse.json({
            success: false,
            error: 'No Instagram accounts found. Please connect an Instagram account first.'
          })
        }

        return NextResponse.json({
          success: true,
          accounts: instagramAccounts,
          message: `Found ${instagramAccounts.length} Instagram accounts ready for posting`
        })
      } catch (error: any) {
        return NextResponse.json({
          success: false,
          error: `Connection test failed: ${error.message}`
        })
      }
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error: any) {
    console.error('Instagram status check error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error', 
        details: error.message 
      },
      { status: 500 }
    )
  }
}