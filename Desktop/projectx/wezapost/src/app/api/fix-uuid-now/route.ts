import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
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

    // Check current user ID format
    const currentUserId = session.user.id
    const isCurrentlyUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(currentUserId)

    console.log('Current user ID:', currentUserId)
    console.log('Is UUID format:', isCurrentlyUUID)

    if (isCurrentlyUUID) {
      return NextResponse.json({
        success: true,
        message: 'User ID is already in UUID format',
        currentUserId,
        action: 'none'
      })
    }

    // Check if profile already exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', session.user.email)
      .single()

    if (existingProfile) {
      return NextResponse.json({
        success: true,
        message: 'Profile already exists with UUID',
        profileId: existingProfile.id,
        currentUserId,
        action: 'profile_exists',
        note: 'Profile exists but session callback may not be working. Try signing out and back in.'
      })
    }

    // Create new profile with proper UUID
    const newUUID = crypto.randomUUID()
    console.log('Creating new profile with UUID:', newUUID)

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
        details: error.message,
        currentUserId
      }, { status: 500 })
    }

    console.log('Successfully created profile:', newProfile)

    // Now try to move any localStorage social accounts to the database with the new UUID
    // We'll return instructions for the user
    return NextResponse.json({
      success: true,
      message: 'UUID profile created successfully!',
      profileId: newProfile.id,
      currentUserId,
      action: 'created',
      instructions: [
        '1. Sign out and sign back in to use the new UUID',
        '2. Reconnect your Facebook and Instagram accounts',
        '3. Test posting - should now be REAL instead of simulated'
      ],
      debug: {
        oldUserId: currentUserId,
        newProfileId: newProfile.id,
        email: session.user.email
      }
    })

  } catch (error: any) {
    console.error('Fix UUID error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error', 
        details: error.message,
        currentUserId: session?.user?.id || 'unknown'
      },
      { status: 500 }
    )
  }
}