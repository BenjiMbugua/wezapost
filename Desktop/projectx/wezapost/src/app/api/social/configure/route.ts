import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { createSupabaseClientComponentClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { platform, clientId, clientSecret, userId } = await request.json()

    // Validate input
    if (!platform || !clientId || !clientSecret) {
      return NextResponse.json(
        { error: 'Missing required fields: platform, clientId, clientSecret' },
        { status: 400 }
      )
    }

    // Verify user ID matches session
    if (userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Store credentials on server-side for API access
    const { saveServerCredentials } = await import('@/lib/social-credential-manager')
    saveServerCredentials(session.user.id, platform, clientId, clientSecret)
    
    // For demo purposes, we'll also tell the client to store credentials
    // In production, you'd encrypt and store in database
    const credentialData = {
      platform,
      clientId,
      clientSecret,
      userId: session.user.id,
      configured: true,
      configuredAt: new Date().toISOString()
    }
    
    return NextResponse.json({
      success: true,
      message: 'Credentials configured successfully',
      platform,
      credentialData, // Send back for client-side storage
      // Return encrypted/hashed version for display
      config: {
        platform,
        clientId: clientId.substring(0, 8) + '...', // Show only first 8 chars for security
        configured: true,
        configuredAt: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Error configuring social platform:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Return list of configured platforms for this user
    // In production, this would query the database
    
    return NextResponse.json({
      success: true,
      configuredPlatforms: [] // This would come from database
    })
  } catch (error) {
    console.error('Error fetching social configurations:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}