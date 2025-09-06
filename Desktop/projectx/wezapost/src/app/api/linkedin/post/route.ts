import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseClientComponentClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    console.log('📤 LinkedIn posting request received')

    const { postData, accountData } = await request.json()

    if (!postData || !accountData) {
      return NextResponse.json({
        success: false,
        error: 'Missing post data or account data'
      }, { status: 400 })
    }

    console.log('📝 Posting to LinkedIn:', {
      account: accountData.display_name,
      content: postData.content.substring(0, 50) + '...'
    })

    // Get access token from account data
    let accessToken = accountData.access_token

    if (!accessToken) {
      console.error('❌ No LinkedIn access token found')
      return NextResponse.json({
        success: false,
        error: 'No access token available for LinkedIn account'
      }, { status: 400 })
    }

    // Get the platform user ID - try different possible field names
    const platformUserId = accountData.platform_user_id || accountData.id || accountData.sub
    
    if (!platformUserId) {
      console.error('❌ No platform user ID found in account data:', accountData)
      return NextResponse.json({
        success: false,
        error: 'No platform user ID available'
      }, { status: 400 })
    }

    // Determine author URN based on account type
    let authorUrn
    if (accountData.account_type === 'business' && accountData.company_id) {
      // Business page posting with organization URN
      authorUrn = `urn:li:organization:${accountData.company_id}`
      console.log('🏢 Posting as LinkedIn business page:', accountData.display_name)
      console.log('🏢 Company ID:', accountData.company_id)
      console.log('🏢 Using organization URN:', authorUrn)
    } else {
      // Personal account posting
      authorUrn = `urn:li:person:${platformUserId}`
      console.log('👤 Posting as LinkedIn personal account:', accountData.display_name)
      console.log('🔍 Using platform user ID:', platformUserId)
    }

    // Prepare LinkedIn post payload
    const postContent = postData.content
    
    const linkedinPayload = {
      author: authorUrn,
      commentary: postContent,
      visibility: 'PUBLIC',
      distribution: {
        feedDistribution: 'MAIN_FEED',
        targetEntities: [],
        thirdPartyDistributionChannels: []
      },
      lifecycleState: 'PUBLISHED'
    }

    console.log('🔄 Sending LinkedIn API request with Posts API...')
    console.log('📝 Payload:', JSON.stringify(linkedinPayload, null, 2))

    // Post to LinkedIn API using modern Posts API
    const linkedinResponse = await fetch('https://api.linkedin.com/rest/posts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'LinkedIn-Version': '202508',
        'X-Restli-Protocol-Version': '2.0.0'
      },
      body: JSON.stringify(linkedinPayload)
    })

    const responseText = await linkedinResponse.text()
    console.log('LinkedIn API Response:', {
      status: linkedinResponse.status,
      statusText: linkedinResponse.statusText,
      body: responseText
    })

    if (!linkedinResponse.ok) {
      console.error('❌ LinkedIn API error:', responseText)
      return NextResponse.json({
        success: false,
        error: `LinkedIn API error: ${responseText}`
      }, { status: linkedinResponse.status })
    }

    let linkedinData
    try {
      linkedinData = JSON.parse(responseText)
    } catch (error) {
      console.error('Failed to parse LinkedIn response:', error)
      linkedinData = { id: 'unknown' }
    }

    console.log('✅ LinkedIn post created:', linkedinData.id)

    // Try to save post to database
    try {
      const supabase = createSupabaseClientComponentClient()
      
      // Convert Google OAuth user ID to UUID if needed
      let userId = postData.user_id
      if (userId && !userId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        console.log('Converting non-UUID user ID for database compatibility')
        userId = null // Will skip database save for non-UUID users
      }

      if (userId) {
        const { error: dbError } = await supabase
          .from('posts')
          .insert({
            user_id: userId,
            content: postData.content,
            platforms: ['linkedin'],
            status: 'published',
            scheduled_at: new Date().toISOString(),
            published_at: new Date().toISOString(),
            external_ids: {
              linkedin: linkedinData.id
            }
          })

        if (dbError) {
          console.log('Database save failed:', dbError.message)
        } else {
          console.log('✅ Post saved to database')
        }
      }
    } catch (error) {
      console.log('Database not available, skipping save:', error)
    }

    return NextResponse.json({
      success: true,
      platform: 'linkedin',
      post_id: linkedinData.id,
      message: 'Posted to LinkedIn successfully'
    })

  } catch (error: any) {
    console.error('❌ LinkedIn posting error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'LinkedIn posting failed'
    }, { status: 500 })
  }
}