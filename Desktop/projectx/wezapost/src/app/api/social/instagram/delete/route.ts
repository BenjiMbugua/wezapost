import { NextRequest, NextResponse } from 'next/server'

/**
 * Instagram Basic Display API Data Deletion Callback
 * Called when a user requests deletion of their data
 * This endpoint is required for Instagram Basic Display API compliance
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Instagram sends the user_id of the user requesting data deletion
    const { user_id } = body
    
    if (user_id) {
      console.log('Instagram data deletion request received for user:', user_id)
      
      // Here you would typically:
      // 1. Find the user in your database by instagram user_id  
      // 2. Delete all stored Instagram data for this user
      // 3. Remove Instagram connection
      // 4. Log the deletion for compliance
      
      // For now, we'll just log it
      console.log('TODO: Delete all Instagram data for user_id:', user_id)
      
      // You should implement actual data deletion logic here
      // Example:
      // await deleteInstagramUserData(user_id)
    }
    
    // Instagram expects a confirmation URL where they can verify deletion
    const confirmationCode = `deletion_${user_id}_${Date.now()}`
    const confirmationUrl = `${process.env.NEXTAUTH_URL}/api/social/instagram/delete-confirm?code=${confirmationCode}`
    
    return NextResponse.json({ 
      url: confirmationUrl,
      confirmation_code: confirmationCode
    })
  } catch (error) {
    console.error('Instagram data deletion webhook error:', error)
    return NextResponse.json({ error: 'Failed to process deletion request' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Instagram data deletion webhook endpoint',
    method: 'POST only',
    note: 'This endpoint handles user data deletion requests from Instagram'
  })
}