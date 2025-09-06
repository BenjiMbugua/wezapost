import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the access token from URL params (from the Instagram account you connected)
    const { searchParams } = new URL(request.url)
    const accessToken = searchParams.get('token')
    const pageId = searchParams.get('pageId')

    if (!accessToken || !pageId) {
      return NextResponse.json({ 
        error: 'Missing token or pageId parameters',
        usage: 'GET /api/debug-instagram-permissions?token=YOUR_TOKEN&pageId=YOUR_PAGE_ID',
        note: 'Use the page ID from your Facebook page (like 302623692926333)'
      }, { status: 400 })
    }

    console.log('🔍 Debugging Instagram permissions for Facebook Page:', pageId)

    // Step 1: Check if Facebook page has Instagram Business Account connected
    const pageResponse = await fetch(
      `https://graph.facebook.com/v18.0/${pageId}?fields=instagram_business_account,name,id&access_token=${accessToken}`
    )
    
    let pageInfo = null
    let instagramBusinessAccount = null
    
    if (pageResponse.ok) {
      pageInfo = await pageResponse.json()
      instagramBusinessAccount = pageInfo.instagram_business_account
      console.log('📘 Facebook page info:', {
        id: pageInfo.id,
        name: pageInfo.name,
        hasInstagramAccount: !!instagramBusinessAccount
      })
    } else {
      const errorData = await pageResponse.json()
      console.error('❌ Failed to get Facebook page info:', errorData)
    }

    // Step 2: If Instagram account exists, get its details
    let instagramAccountDetails = null
    if (instagramBusinessAccount?.id) {
      const instagramResponse = await fetch(
        `https://graph.facebook.com/v18.0/${instagramBusinessAccount.id}?fields=id,username,profile_picture_url,followers_count,media_count&access_token=${accessToken}`
      )
      
      if (instagramResponse.ok) {
        instagramAccountDetails = await instagramResponse.json()
        console.log('📸 Instagram account details:', instagramAccountDetails)
      } else {
        const errorData = await instagramResponse.json()
        console.error('❌ Failed to get Instagram account details:', errorData)
      }
    }

    // Step 3: Test if we can create media (without actually posting)
    let canCreateMedia = false
    let mediaTestError = null
    
    if (instagramBusinessAccount?.id) {
      // Test with a sample image URL
      const testImageUrl = 'https://via.placeholder.com/1080x1080/4267B2/FFFFFF?text=Test'
      
      try {
        const mediaResponse = await fetch(
          `https://graph.facebook.com/v18.0/${instagramBusinessAccount.id}/media`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              image_url: testImageUrl,
              caption: 'Test caption (not published)',
              access_token: accessToken
            })
          }
        )
        
        if (mediaResponse.ok) {
          const mediaResult = await mediaResponse.json()
          canCreateMedia = true
          console.log('✅ Can create media containers:', mediaResult.id)
        } else {
          const errorData = await mediaResponse.json()
          mediaTestError = errorData.error?.message || 'Unknown error'
          console.log('❌ Cannot create media containers:', mediaTestError)
        }
      } catch (error: any) {
        mediaTestError = error.message
        console.log('❌ Media creation test failed:', error.message)
      }
    }

    // Step 4: Check access token permissions
    const permissionsResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/permissions?access_token=${accessToken}`
    )
    
    let permissions = []
    if (permissionsResponse.ok) {
      const permissionsData = await permissionsResponse.json()
      permissions = permissionsData.data || []
    }

    return NextResponse.json({
      pageId,
      facebookPage: pageInfo,
      instagramBusinessAccount,
      instagramAccountDetails,
      canCreateMedia,
      mediaTestError,
      permissions: permissions.map(p => ({ permission: p.permission, status: p.status })),
      requiredPermissions: [
        'instagram_basic',
        'instagram_content_publish',
        'pages_show_list',
        'pages_read_engagement'
      ],
      diagnosis: {
        hasInstagramAccount: !!instagramBusinessAccount,
        canAccessInstagramDetails: !!instagramAccountDetails,
        canCreateMediaContainers: canCreateMedia,
        readyForPosting: !!(instagramBusinessAccount && instagramAccountDetails && canCreateMedia)
      }
    })

  } catch (error: any) {
    console.error('Debug Instagram permissions error:', error)
    return NextResponse.json({
      error: 'Failed to debug Instagram permissions',
      details: error.message
    }, { status: 500 })
  }
}