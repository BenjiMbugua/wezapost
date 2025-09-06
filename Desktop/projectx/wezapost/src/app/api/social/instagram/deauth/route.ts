import { NextRequest, NextResponse } from 'next/server'

/**
 * Instagram Basic Display API Deauthorization Callback
 * Called when a user deauthorizes your app from Instagram
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Instagram sends the user_id of the user who deauthorized
    const { user_id } = body
    
    if (user_id) {
      console.log('Instagram deauthorization received for user:', user_id)
      
      // Here you would typically:
      // 1. Find the user in your database by instagram user_id
      // 2. Remove or deactivate their Instagram connection
      // 3. Delete any cached Instagram data
      
      // For now, we'll just log it
      console.log('TODO: Remove Instagram connection for user_id:', user_id)
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Instagram deauth webhook error:', error)
    return NextResponse.json({ error: 'Failed to process deauthorization' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Instagram deauthorization webhook endpoint',
    method: 'POST only'
  })
}