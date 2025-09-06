import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No session' }, { status: 401 })
    }

    // Try to manually lookup the UUID like the session callback does
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    let profileLookupResult = null
    let profileLookupError = null

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .eq('email', session.user.email)
        .single()

      profileLookupResult = profile
      profileLookupError = error
    } catch (error: any) {
      profileLookupError = error
    }

    // Check if we have any profiles at all
    const { data: allProfiles, error: allProfilesError } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .limit(5)

    return NextResponse.json({
      session_info: {
        user_id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        user_id_type: typeof session.user.id,
        user_id_length: session.user.id?.length,
        is_uuid_format: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(session.user.id)
      },
      profile_lookup: {
        found: !!profileLookupResult,
        profile: profileLookupResult,
        error: profileLookupError?.message || null
      },
      all_profiles_sample: {
        count: allProfiles?.length || 0,
        profiles: allProfiles?.map(p => ({ id: p.id, email: p.email, full_name: p.full_name })) || [],
        error: allProfilesError?.message || null
      },
      recommendations: session.user.id?.length === 36 
        ? "✅ User ID is UUID format - should work with Supabase"
        : "❌ User ID is not UUID format - this is why database operations are failing"
    })

  } catch (error: any) {
    console.error('Debug UUID error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error.message 
      },
      { status: 500 }
    )
  }
}