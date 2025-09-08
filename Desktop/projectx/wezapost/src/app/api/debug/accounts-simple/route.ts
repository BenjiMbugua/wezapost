import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient()
    
    // Get all accounts to see what's in the table
    const { data: allAccounts, error } = await supabase
      .from('social_accounts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      accounts: allAccounts,
      count: allAccounts?.length || 0
    })

  } catch (error: any) {
    console.error('Debug API error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}