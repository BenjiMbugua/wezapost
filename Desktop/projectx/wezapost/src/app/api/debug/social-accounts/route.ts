import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const supabase = createSupabaseServerClient()
    
    // Get original user ID and converted UUID
    const originalUserId = session.user.id
    const crypto = await import('crypto')
    const hash = crypto.createHash('sha1').update(`oauth-${originalUserId}`).digest('hex')
    const convertedUUID = [
      hash.substring(0, 8),
      hash.substring(8, 12),
      hash.substring(12, 16),
      hash.substring(16, 20),
      hash.substring(20, 32)
    ].join('-')

    // Check accounts with both user IDs
    const { data: originalAccounts, error: originalError } = await supabase
      .from('social_accounts')
      .select('*')
      .eq('user_id', originalUserId)

    const { data: convertedAccounts, error: convertedError } = await supabase
      .from('social_accounts')
      .select('*')
      .eq('user_id', convertedUUID)

    // Also get all accounts to see what's in the table
    const { data: allAccounts, error: allError } = await supabase
      .from('social_accounts')
      .select('*')
      .limit(20)

    return NextResponse.json({
      session: {
        userId: originalUserId,
        convertedUUID,
      },
      originalAccounts: originalAccounts || [],
      convertedAccounts: convertedAccounts || [],
      allAccounts: allAccounts || [],
      errors: {
        original: originalError?.message,
        converted: convertedError?.message,
        all: allError?.message,
      }
    })

  } catch (error: any) {
    console.error('Debug API error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}