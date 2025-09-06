import { NextRequest, NextResponse } from 'next/server'

/**
 * Test endpoint to verify Instagram OAuth URL generation works with real credentials
 */
export async function GET(request: NextRequest) {
  try {
    // Mock user ID for testing
    const mockUserId = 'test_user_123'
    
    // Generate Instagram OAuth URL via Facebook
    const instagramAuthUrl = new URL('https://www.facebook.com/v18.0/dialog/oauth')
    const params = {
      client_id: process.env.INSTAGRAM_CLIENT_ID!,
      redirect_uri: `${process.env.NEXTAUTH_URL}/api/social/instagram/callback`,
      scope: 'instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement',
      response_type: 'code',
      state: mockUserId,
    }

    // Add parameters to URL
    Object.entries(params).forEach(([key, value]) => {
      instagramAuthUrl.searchParams.set(key, value)
    })

    return NextResponse.json({
      success: true,
      message: 'Instagram OAuth URL generated successfully with your credentials',
      credentials: {
        client_id: process.env.INSTAGRAM_CLIENT_ID,
        redirect_uri: `${process.env.NEXTAUTH_URL}/api/social/instagram/callback`,
        scopes: 'instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement'
      },
      authUrl: instagramAuthUrl.toString(),
      instructions: [
        '1. Click the authUrl to test OAuth flow',
        '2. Grant permissions on Instagram', 
        '3. You will be redirected back to the callback',
        '4. Check server logs for connection result'
      ],
      note: 'This URL will work if your Instagram app is properly configured and you are added as a tester'
    })

  } catch (error: any) {
    console.error('Instagram OAuth test error:', error)
    return NextResponse.json(
      { error: 'Failed to generate Instagram OAuth test', details: error.message },
      { status: 500 }
    )
  }
}