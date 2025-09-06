import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    console.log('🎵 TikTok webhook received')

    // Get the raw body for signature verification
    const body = await request.text()
    const headersList = headers()
    
    // TikTok sends these headers for webhook verification
    const signature = headersList.get('x-tiktok-signature')
    const timestamp = headersList.get('x-tiktok-timestamp')
    const event = headersList.get('x-tiktok-event')
    
    console.log('TikTok webhook headers:', {
      signature: signature ? '***provided***' : 'missing',
      timestamp,
      event,
      bodyLength: body.length
    })

    // Verify webhook signature (implement signature verification in production)
    // const expectedSignature = generateTikTokSignature(body, timestamp)
    // if (signature !== expectedSignature) {
    //   console.error('Invalid TikTok webhook signature')
    //   return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    // }

    let webhookData
    try {
      webhookData = JSON.parse(body)
    } catch (error) {
      console.error('Failed to parse TikTok webhook body:', error)
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    console.log('TikTok webhook data:', webhookData)

    // Handle different TikTok webhook events
    switch (event) {
      case 'video.publish':
        await handleVideoPublish(webhookData)
        break
        
      case 'video.update':
        await handleVideoUpdate(webhookData)
        break
        
      case 'user.authorization.revoke':
        await handleAuthRevoke(webhookData)
        break
        
      default:
        console.log('Unhandled TikTok webhook event:', event)
    }

    // TikTok expects a 200 response to confirm webhook receipt
    return NextResponse.json({ 
      status: 'success',
      message: 'Webhook processed successfully' 
    })

  } catch (error: any) {
    console.error('TikTok webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed', details: error.message },
      { status: 500 }
    )
  }
}

// Handle TikTok webhook challenge (for endpoint verification)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const challenge = searchParams.get('challenge')
    
    if (challenge) {
      console.log('TikTok webhook challenge received:', challenge)
      // Return the challenge to verify the webhook endpoint
      return NextResponse.json({ challenge })
    }
    
    return NextResponse.json({ 
      status: 'TikTok webhook endpoint active',
      timestamp: new Date().toISOString()
    })
    
  } catch (error: any) {
    console.error('TikTok webhook challenge error:', error)
    return NextResponse.json(
      { error: 'Challenge verification failed' },
      { status: 500 }
    )
  }
}

async function handleVideoPublish(data: any) {
  try {
    console.log('📹 TikTok video published:', {
      videoId: data.video_id,
      userId: data.user_id,
      status: data.status
    })

    // Update post status in database if we have matching post
    if (data.video_id && data.status === 'published') {
      // Find and update the post in your database
      // You could match by post_id if you stored the TikTok video ID
      console.log('✅ TikTok video successfully published:', data.video_id)
    }
    
  } catch (error) {
    console.error('Error handling TikTok video publish:', error)
  }
}

async function handleVideoUpdate(data: any) {
  try {
    console.log('📝 TikTok video updated:', {
      videoId: data.video_id,
      userId: data.user_id,
      changes: data.changes
    })
    
    // Handle video metadata updates
    
  } catch (error) {
    console.error('Error handling TikTok video update:', error)
  }
}

async function handleAuthRevoke(data: any) {
  try {
    console.log('🚫 TikTok authorization revoked for user:', data.user_id)
    
    // Remove or deactivate the user's TikTok account connection
    // You might want to update your database to mark the account as inactive
    
  } catch (error) {
    console.error('Error handling TikTok auth revoke:', error)
  }
}

// Signature verification function (implement for production security)
function generateTikTokSignature(body: string, timestamp: string): string {
  // Implement HMAC-SHA256 signature verification
  // using your TikTok app secret and the webhook payload
  
  const crypto = require('crypto')
  const secret = process.env.TIKTOK_CLIENT_SECRET!
  const data = timestamp + body
  
  return crypto
    .createHmac('sha256', secret)
    .update(data)
    .digest('hex')
}