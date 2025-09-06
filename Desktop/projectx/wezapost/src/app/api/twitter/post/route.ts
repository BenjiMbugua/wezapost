import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { TwitterApi } from 'twitter-api-v2'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { content } = await request.json()

    // Validate input
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Missing or invalid content' },
        { status: 400 }
      )
    }

    // Check content length (Twitter limit is 280 characters)
    if (content.length > 280) {
      return NextResponse.json(
        { error: 'Content exceeds 280 character limit' },
        { status: 400 }
      )
    }

    // For posting tweets, we need OAuth 1.0a credentials with write permissions
    // Bearer tokens typically only have read access
    const apiKey = process.env.TWITTER_API_KEY
    const apiSecret = process.env.TWITTER_API_SECRET
    const accessToken = process.env.TWITTER_ACCESS_TOKEN
    const accessTokenSecret = process.env.TWITTER_ACCESS_TOKEN_SECRET
    const bearerToken = process.env.TWITTER_BEARER_TOKEN
    
    // Check if we have OAuth 1.0a credentials (preferred for posting)
    console.log('Checking OAuth 1.0a credentials:', {
      hasApiKey: !!apiKey,
      hasApiSecret: !!apiSecret, 
      hasAccessToken: !!accessToken,
      hasAccessTokenSecret: !!accessTokenSecret,
      apiKeyLength: apiKey?.length,
      accessTokenStartsWith: accessToken?.substring(0, 10)
    })
    
    if (apiKey && apiSecret && accessToken && accessTokenSecret) {
      console.log('Using OAuth 1.0a credentials for posting...')
      // Use OAuth 1.0a for posting (has write permissions)
      try {
        const twitterClient = new TwitterApi({
          appKey: apiKey,
          appSecret: apiSecret,
          accessToken: accessToken,
          accessSecret: accessTokenSecret,
        })

        const tweet = await twitterClient.v2.tweet(content.trim())
        
        console.log('Tweet posted successfully with OAuth 1.0a:', tweet)

        return NextResponse.json({
          success: true,
          simulated: false,
          tweet: {
            id: tweet.data.id,
            text: tweet.data.text,
            created_at: new Date().toISOString(),
            url: `https://twitter.com/Wezalabstech/status/${tweet.data.id}`,
            public_metrics: tweet.data.public_metrics || {
              retweet_count: 0,
              like_count: 0,
              reply_count: 0,
              quote_count: 0
            }
          },
          message: 'Tweet posted successfully to @Wezalabstech'
        })

      } catch (twitterError: any) {
        console.error('Twitter OAuth 1.0a Error:', twitterError)
        
        let errorMessage = 'Failed to post to Twitter'
        
        if (twitterError.code === 403) {
          errorMessage = 'Twitter API access forbidden - check your app permissions'
        } else if (twitterError.code === 401) {
          errorMessage = 'Twitter API authentication failed - check your credentials'
        } else if (twitterError.code === 429) {
          errorMessage = 'Twitter API rate limit exceeded'
        } else if (twitterError.errors?.[0]?.message) {
          errorMessage = twitterError.errors[0].message
        }

        return NextResponse.json({
          error: errorMessage,
          twitter_error: twitterError.message || 'Unknown Twitter API error',
          suggestion: 'Make sure your Twitter app has Read and Write permissions enabled'
        }, { status: 500 })
      }
    }
    
    if (!bearerToken || bearerToken === 'your_twitter_bearer_token_here') {
      // If no bearer token, simulate the posting for demo purposes
      console.log('No Twitter Bearer Token configured, simulating post...')
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))
      
      return NextResponse.json({
        success: true,
        simulated: true,
        tweet: {
          id: `simulated_${Date.now()}`,
          text: content,
          created_at: new Date().toISOString(),
          url: `https://twitter.com/Wezalabstech/status/simulated_${Date.now()}`,
          public_metrics: {
            retweet_count: 0,
            like_count: 0,
            reply_count: 0,
            quote_count: 0
          }
        },
        message: 'Tweet simulated successfully (no real API key configured)'
      })
    }

    // Try Bearer Token (read-only, will likely fail for posting)
    console.log('Attempting to post with Bearer Token (may have limited permissions)...')
    const twitterClient = new TwitterApi(bearerToken)

    try {
      // Post the tweet
      const tweet = await twitterClient.v2.tweet(content.trim())
      
      console.log('Tweet posted successfully with Bearer Token:', tweet)

      return NextResponse.json({
        success: true,
        simulated: false,
        tweet: {
          id: tweet.data.id,
          text: tweet.data.text,
          created_at: new Date().toISOString(),
          url: `https://twitter.com/Wezalabstech/status/${tweet.data.id}`,
          public_metrics: tweet.data.public_metrics || {
            retweet_count: 0,
            like_count: 0,
            reply_count: 0,
            quote_count: 0
          }
        },
        message: 'Tweet posted successfully to @Wezalabstech'
      })

    } catch (twitterError: any) {
      console.error('Twitter Bearer Token Error:', twitterError)
      
      // Handle specific Twitter API errors
      let errorMessage = 'Failed to post to Twitter'
      let suggestion = ''
      
      if (twitterError.code === 403) {
        errorMessage = 'Twitter API access forbidden - Bearer Token lacks write permissions'
        suggestion = 'Bearer Tokens typically only have read access. You need OAuth 1.0a credentials (API Key, API Secret, Access Token, Access Token Secret) with Read and Write permissions to post tweets.'
      } else if (twitterError.code === 401) {
        errorMessage = 'Twitter API authentication failed'
        suggestion = 'Check that your Bearer Token is valid and properly configured.'
      } else if (twitterError.code === 429) {
        errorMessage = 'Twitter API rate limit exceeded'
        suggestion = 'Wait a few minutes before trying again.'
      } else if (twitterError.errors?.[0]?.message) {
        errorMessage = twitterError.errors[0].message
      }

      return NextResponse.json({
        error: errorMessage,
        twitter_error: twitterError.message || 'Unknown Twitter API error',
        suggestion: suggestion,
        solution: 'To enable real posting, add these to your .env.local:\nTWITTER_API_KEY="your_api_key"\nTWITTER_API_SECRET="your_api_secret"\nTWITTER_ACCESS_TOKEN="your_access_token"\nTWITTER_ACCESS_TOKEN_SECRET="your_access_token_secret"'
      }, { status: 500 })
    }

  } catch (error: any) {
    console.error('Error posting to Twitter:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}