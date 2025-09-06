import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No session or email' }, { status: 401 })
    }

    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Check if profile already exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', session.user.email)
      .single()

    if (existingProfile) {
      return NextResponse.json({
        success: true,
        message: 'Profile already exists',
        profile_id: existingProfile.id,
        action: 'none'
      })
    }

    // Create new profile with proper UUID
    const newUUID = crypto.randomUUID()
    const { data: newProfile, error } = await supabase
      .from('profiles')
      .insert([
        {
          id: newUUID,
          email: session.user.email,
          full_name: session.user.name,
          avatar_url: session.user.image,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select('id, email')
      .single()

    if (error) {
      console.error('Error creating profile:', error)
      return NextResponse.json({
        success: false,
        error: 'Failed to create profile',
        details: error.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Profile created successfully',
      profile_id: newProfile.id,
      action: 'created',
      next_step: 'Please refresh the page or sign out and sign back in to use the new UUID'
    })

  } catch (error: any) {
    console.error('Fix UUID error:', error)
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