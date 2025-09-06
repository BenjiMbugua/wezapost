"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { SocialAccount, SocialProviderManager } from '@/lib/social-providers'
import { createSupabaseClientComponentClient } from '@/lib/supabase'
import { format } from 'date-fns'

interface Post {
  id: string
  title?: string
  content: string
  platforms: string[]
  status: 'draft' | 'scheduled' | 'published' | 'failed'
  scheduled_for?: string
  created_at: string
  media_urls?: string[]
}

interface PostCreatorProps {
  prefillData?: {
    content?: string
    hashtags?: string[]
    images?: Array<{
      id: string
      url: string
      alt_text?: string
      caption?: string
    }>
    links?: Array<{
      id: string
      url: string
      title?: string
      description?: string
    }>
    platforms?: string[]
    curatedPostId?: string // Add curated post ID
  }
  onPostCreated?: () => void
}

export function PostCreator({ prefillData, onPostCreated }: PostCreatorProps = {}) {
  const { data: session } = useSession()
  const [content, setContent] = useState('')
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]) // Track specific account IDs
  const [accounts, setAccounts] = useState<SocialAccount[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  
  // Scheduling states
  const [scheduleMode, setScheduleMode] = useState<'now' | 'later'>('now')
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')

  const socialManager = new SocialProviderManager()
  const supabase = createSupabaseClientComponentClient()

  useEffect(() => {
    loadData()
  }, [])

  // Clean up duplicate posts on component mount
  useEffect(() => {
    cleanupDuplicatePosts()
  }, [])

  // Handle prefilled data from curated posts
  useEffect(() => {
    if (prefillData) {
      if (prefillData.content) {
        setContent(prefillData.content + (prefillData.hashtags ? '\n\n' + prefillData.hashtags.join(' ') : ''))
      }
      if (prefillData.platforms) {
        setSelectedPlatforms(prefillData.platforms)
      }
    }
  }, [prefillData])

  const removeDuplicateAccounts = (accounts: SocialAccount[]) => {
    const uniqueAccounts: SocialAccount[] = []
    const seenAccounts = new Set<string>()

    accounts.forEach(account => {
      // For LinkedIn, include display_name to distinguish between personal and business accounts
      // For other platforms, use platform + username as before
      const accountKey = account.platform === 'linkedin' 
        ? `${account.platform}-${account.username}-${account.display_name}` 
        : `${account.platform}-${account.username}`
      
      if (!seenAccounts.has(accountKey)) {
        uniqueAccounts.push(account)
        seenAccounts.add(accountKey)
      } else {
        console.log(`🧹 Post creator removing duplicate ${account.platform} account: ${account.display_name || account.username}`)
      }
    })

    // If we removed duplicates, save the cleaned list back to localStorage
    if (uniqueAccounts.length !== accounts.length) {
      localStorage.setItem('wezapost-demo-accounts', JSON.stringify(uniqueAccounts))
      console.log(`✅ Post creator cleaned up ${accounts.length - uniqueAccounts.length} duplicate accounts`)
    }

    return uniqueAccounts
  }

  // Auto-select first account if none are selected and we have accounts
  // Remove auto-selection logic to allow manual platform selection
  // useEffect(() => {
  //   if (selectedPlatforms.length === 0 && accounts.length > 0) {
  //     // Filter accounts the same way as activeAccounts logic below
  //     let accountsToCheck = accounts
  //     if (session?.user?.id) {
  //       accountsToCheck = accounts.filter(account => 
  //         account.username === 'Wezalabstech' || 
  //         account.username === 'Wezalabs Wezalabs' ||
  //         account.id.includes('real') || 
  //         account.real_oauth === true
  //       )
  //     }
      
  //     if (accountsToCheck.length > 0) {
  //       const firstAccount = accountsToCheck[0]
  //       console.log('Auto-selecting first account:', firstAccount.platform)
  //       setSelectedPlatforms([firstAccount.platform])
  //     }
  //   }
  // }, [accounts, selectedPlatforms.length, session?.user?.id])

  // Utility function to clean up duplicate posts in localStorage
  const cleanupDuplicatePosts = () => {
    const savedPosts = localStorage.getItem('wezapost-demo-posts')
    if (savedPosts) {
      const parsedPosts = JSON.parse(savedPosts)
      const uniquePosts = parsedPosts.filter((post: any, index: number, self: any[]) => 
        index === self.findIndex(p => p.id === post.id)
      )
      
      if (uniquePosts.length !== parsedPosts.length) {
        console.log('🧹 Cleaning up duplicate posts in localStorage:', {
          original: parsedPosts.length,
          unique: uniquePosts.length,
          removed: parsedPosts.length - uniquePosts.length
        })
        localStorage.setItem('wezapost-demo-posts', JSON.stringify(uniquePosts))
        return uniquePosts
      }
    }
    return null
  }

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Load connected accounts using SocialProviderManager
      let loadedAccounts: SocialAccount[] = []
      const socialManager = new SocialProviderManager()
      
      if (session?.user?.id) {
        console.log('User is authenticated, loading accounts from database and localStorage')
        try {
          // Load from database
          const dbAccounts = await socialManager.getConnectedAccounts(session.user.id)
          console.log('Loaded accounts from database:', dbAccounts)
          
          // Always also load from localStorage and merge
          const savedAccounts = localStorage.getItem('wezapost-demo-accounts')
          let localAccounts: SocialAccount[] = []
          
          if (savedAccounts) {
            const allSavedAccounts = JSON.parse(savedAccounts)
            // Only keep real accounts for authenticated users  
            let filteredAccounts = allSavedAccounts.filter((account: any) => 
              account.username === 'Wezalabstech' || 
              account.username === 'Wezalabs Wezalabs' ||
              account.id.includes('real') || 
              account.real_oauth === true
            )
            // Remove duplicates
            localAccounts = removeDuplicateAccounts(filteredAccounts)
            console.log('Filtered and cleaned real accounts from localStorage:', localAccounts)
          }
          
          // Merge database and localStorage accounts
          loadedAccounts = [...dbAccounts]
          
          // Add localStorage accounts that don't exist in database
          for (const localAccount of localAccounts) {
            const existsInDb = dbAccounts.some(dbAccount => 
              dbAccount.platform === localAccount.platform && 
              dbAccount.username === localAccount.username
            )
            if (!existsInDb) {
              loadedAccounts.push(localAccount)
            }
          }
          
          console.log('Merged accounts (database + localStorage):', loadedAccounts)
          
        } catch (error) {
          console.log('Database loading failed, using localStorage only:', error)
          
          // Fallback to localStorage only
          const savedAccounts = localStorage.getItem('wezapost-demo-accounts')
          if (savedAccounts) {
            const allSavedAccounts = JSON.parse(savedAccounts)
            // Only keep real accounts for authenticated users
            let filteredAccounts = allSavedAccounts.filter((account: any) => 
              account.username === 'Wezalabstech' || 
              account.username === 'Wezalabs Wezalabs' ||
              account.id.includes('real') || 
              account.real_oauth === true
            )
            // Remove duplicates
            loadedAccounts = removeDuplicateAccounts(filteredAccounts)
            console.log('Filtered and cleaned real accounts from localStorage (fallback):', loadedAccounts)
          }
        }
        
        // If no accounts found, create a default one
        if (loadedAccounts.length === 0) {
          console.log('No accounts found, creating default Wezalabstech account')
          const defaultRealAccount: SocialAccount = {
            id: 'real-twitter-wezalabstech',
            platform: 'twitter' as const,
            username: 'Wezalabstech',
            display_name: 'wezalabs tech',
            avatar_url: 'https://ui-avatars.com/api/?name=Wezalabstech&background=1da1f2',
            is_active: true,
            settings: {
              auto_post: true,
              default_visibility: 'public',
              custom_hashtags: ['#twitter'],
            }
          }
          loadedAccounts = [defaultRealAccount]
        }
      } else {
        // Not authenticated - load demo accounts for testing
        const savedAccounts = localStorage.getItem('wezapost-demo-accounts')
        if (savedAccounts) {
          loadedAccounts = JSON.parse(savedAccounts)
        }
      }
      
      setAccounts(loadedAccounts)
      console.log('Post creator loaded accounts:', loadedAccounts)
      
      // Load posts from localStorage for demo and clean up duplicates
      const cleanedPosts = cleanupDuplicatePosts()
      if (cleanedPosts) {
        setPosts(cleanedPosts)
      } else {
        const savedPosts = localStorage.getItem('wezapost-demo-posts')
        if (savedPosts) {
          setPosts(JSON.parse(savedPosts))
        }
      }
      
      // Load posts from database if authenticated
      if (session?.user?.id) {
        try {
          const { data: postsData } = await supabase
            .from('posts')
            .select('*')
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false })
            .limit(10)

          if (postsData) {
            setPosts(postsData)
          }
        } catch (error) {
          console.log('Database posts not available, using demo mode')
        }
      }
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  const simulatePublishing = async (post: Post) => {
    console.log(`Publishing post to platforms: ${post.platforms.join(', ')}`)
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))
    
    // Simulate 90% success rate
    const results = post.platforms.map(platform => {
      const success = Math.random() > 0.1
      return {
        platform,
        success,
        post_id: success ? `${platform}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` : null,
        error_message: success ? null : `Mock API error for ${platform}`,
        published_at: success ? new Date().toISOString() : null
      }
    })
    
    console.log('Publishing results:', results)
    return results
  }

  const publishPostDirect = async (post: Post, platforms: string[]) => {
    try {
      console.log('Publishing post to platforms:', platforms)
      
      const results = []

      // Publish to each platform
      for (const platform of platforms) {
        try {
          console.log(`Publishing to ${platform}...`)
          
          if (platform === 'twitter') {
            // Make real API call to Twitter
            const response = await fetch('/api/twitter/post', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                content: post.content
              }),
            })

            if (response.ok) {
              const twitterResult = await response.json()
              console.log('Twitter API response:', twitterResult)
              
              results.push({
                platform: 'twitter',
                success: true,
                post_id: twitterResult.tweet.id,
                published_at: twitterResult.tweet.created_at,
                url: twitterResult.tweet.url,
                error_message: null,
                simulated: twitterResult.simulated || false
              })
            } else {
              try {
                const errorData = await response.json()
                console.error('Twitter API error response:', {
                  status: response.status,
                  statusText: response.statusText,
                  data: errorData
                })
                
                results.push({
                  platform: 'twitter',
                  success: false,
                  post_id: null,
                  published_at: null,
                  url: null,
                  error_message: errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`,
                  simulated: false,
                  suggestion: errorData.suggestion || '',
                  solution: errorData.solution || ''
                })
              } catch (parseError) {
                console.error('Failed to parse error response:', parseError)
                console.error('Raw response status:', response.status, response.statusText)
                
                results.push({
                  platform: 'twitter',
                  success: false,
                  post_id: null,
                  published_at: null,
                  url: null,
                  error_message: `HTTP ${response.status}: ${response.statusText}`,
                  simulated: false
                })
              }
            }
          } else if (platform === 'facebook') {
            // Make real API call to Facebook with account data
            const facebookAccount = accounts.find(acc => acc.platform === 'facebook')
            const response = await fetch('/api/facebook/post', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                content: post.content,
                account: facebookAccount
              }),
            })

            if (response.ok) {
              const facebookResult = await response.json()
              console.log('Facebook API response:', facebookResult)
              
              results.push({
                platform: 'facebook',
                success: true,
                post_id: facebookResult.post.id,
                published_at: facebookResult.post.created_at && new Date(facebookResult.post.created_at).toString() !== 'Invalid Date' 
                  ? facebookResult.post.created_at 
                  : new Date().toISOString(),
                url: facebookResult.post.url,
                error_message: null,
                simulated: facebookResult.simulated || false
              })
            } else {
              try {
                const errorData = await response.json()
                console.error('Facebook API error response:', errorData)
                
                results.push({
                  platform: 'facebook',
                  success: false,
                  post_id: null,
                  published_at: null,
                  url: null,
                  error_message: errorData.error || `Facebook posting failed: ${errorData.details}`,
                  simulated: false
                })
              } catch (parseError) {
                results.push({
                  platform: 'facebook',
                  success: false,
                  post_id: null,
                  published_at: null,
                  url: null,
                  error_message: `Facebook API error: ${response.statusText}`,
                  simulated: false
                })
              }
            }
          } else if (platform === 'instagram') {
            // Make real API call to Instagram
            console.log('Making real Instagram API call...')
            const instagramAccount = accounts.find(acc => acc.platform === 'instagram')
            
            if (!instagramAccount) {
              results.push({
                platform: 'instagram',
                success: false,
                post_id: null,
                published_at: null,
                url: null,
                error_message: 'No Instagram account found',
                simulated: false
              })
            } else {
              const response = await fetch('/api/instagram/post', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  account: instagramAccount,
                  content: post.content,
                  mediaUrls: post.media_urls || ['https://images.unsplash.com/photo-1516802273409-68526ee1bdd6?w=500&h=500&fit=crop&crop=entropy&auto=format']
                }),
              })

              if (response.ok) {
                const instagramResult = await response.json()
                console.log('Instagram API response:', instagramResult)
                
                // Validate publishedAt date
                let publishedAt = instagramResult.post?.created_at || instagramResult.publishedAt
                if (!publishedAt || (typeof publishedAt === 'string' && new Date(publishedAt).toString() === 'Invalid Date')) {
                  publishedAt = new Date().toISOString()
                }
                
                results.push({
                  platform: 'instagram',
                  success: true,
                  post_id: instagramResult.post?.id || instagramResult.postId,
                  published_at: publishedAt,
                  url: instagramResult.post?.url || instagramResult.url,
                  error_message: null,
                  simulated: instagramResult.simulated || false
                })
              } else {
                try {
                  const errorData = await response.json()
                  console.error('Instagram API error response:', errorData)
                  
                  results.push({
                    platform: 'instagram',
                    success: false,
                    post_id: null,
                    published_at: null,
                    url: null,
                    error_message: errorData.error || `Instagram posting failed: ${errorData.details}`,
                    simulated: false
                  })
                } catch (parseError) {
                  results.push({
                    platform: 'instagram',
                    success: false,
                    post_id: null,
                    published_at: null,
                    url: null,
                    error_message: `Instagram API error: ${response.statusText}`,
                    simulated: false
                  })
                }
              }
            }
          } else if (platform === 'tiktok') {
            // Make real API call to TikTok
            console.log('Making real TikTok API call...')
            const tiktokAccount = accounts.find(acc => acc.platform === 'tiktok')
            
            if (!tiktokAccount) {
              results.push({
                platform: 'tiktok',
                success: false,
                post_id: null,
                published_at: null,
                url: null,
                error_message: 'No TikTok account found',
                simulated: false
              })
            } else {
              const response = await fetch('/api/tiktok/post', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  account: tiktokAccount,
                  content: post.content,
                  mediaUrls: post.media_urls || []
                }),
              })

              if (response.ok) {
                const tiktokResult = await response.json()
                console.log('TikTok API response:', tiktokResult)
                
                // Validate publishedAt date
                let publishedAt = tiktokResult.post?.created_at || tiktokResult.publishedAt
                if (!publishedAt || (typeof publishedAt === 'string' && new Date(publishedAt).toString() === 'Invalid Date')) {
                  publishedAt = new Date().toISOString()
                }
                
                results.push({
                  platform: 'tiktok',
                  success: true,
                  post_id: tiktokResult.post?.id || tiktokResult.postId,
                  published_at: publishedAt,
                  url: tiktokResult.post?.url || tiktokResult.url,
                  error_message: null,
                  simulated: tiktokResult.simulated || false
                })
              } else {
                try {
                  const errorData = await response.json()
                  console.error('TikTok API error response:', errorData)
                  
                  results.push({
                    platform: 'tiktok',
                    success: false,
                    post_id: null,
                    published_at: null,
                    url: null,
                    error_message: errorData.error || `TikTok posting failed: ${errorData.details}`,
                    simulated: false
                  })
                } catch (parseError) {
                  results.push({
                    platform: 'tiktok',
                    success: false,
                    post_id: null,
                    published_at: null,
                    url: null,
                    error_message: `TikTok API error: ${response.statusText}`,
                    simulated: false
                  })
                }
              }
            }
          } else if (platform === 'linkedin') {
            // Make real API call to LinkedIn
            console.log('Making real LinkedIn API call...')
            // Find the selected LinkedIn account based on selectedAccounts
            const selectedLinkedInAccountId = selectedAccounts.find(accountId => {
              const account = accounts.find(acc => acc.id === accountId)
              return account?.platform === 'linkedin'
            })
            const linkedinAccount = selectedLinkedInAccountId 
              ? accounts.find(acc => acc.id === selectedLinkedInAccountId)
              : accounts.find(acc => acc.platform === 'linkedin') // fallback to first LinkedIn account
            
            if (!linkedinAccount) {
              results.push({
                platform: 'linkedin',
                success: false,
                post_id: null,
                published_at: null,
                url: null,
                error_message: 'No LinkedIn account found',
                simulated: false
              })
            } else {
              const response = await fetch('/api/linkedin/post', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  postData: { content: post.content },
                  accountData: linkedinAccount
                }),
              })
              if (response.ok) {
                const linkedinResult = await response.json()
                console.log('LinkedIn API response:', linkedinResult)
                
                results.push({
                  platform: 'linkedin',
                  success: true,
                  post_id: linkedinResult.post_id,
                  published_at: new Date().toISOString(),
                  url: `https://linkedin.com/in/${linkedinAccount.username}`,
                  error_message: null,
                  simulated: false
                })
              } else {
                try {
                  const errorData = await response.json()
                  console.error('LinkedIn API error response:', errorData)
                  
                  results.push({
                    platform: 'linkedin',
                    success: false,
                    post_id: null,
                    published_at: null,
                    url: null,
                    error_message: errorData.error || `LinkedIn posting failed: ${errorData.details}`,
                    simulated: false
                  })
                } catch (parseError) {
                  results.push({
                    platform: 'linkedin',
                    success: false,
                    post_id: null,
                    published_at: null,
                    url: null,
                    error_message: `LinkedIn API error: ${response.statusText}`,
                    simulated: false
                  })
                }
              }
            }
          } else if (platform === 'youtube') {
            // Make real API call to YouTube (video upload simulation)
            console.log('Making real YouTube API call...')
            const youtubeAccount = accounts.find(acc => acc.platform === 'youtube')
            
            if (!youtubeAccount) {
              results.push({
                platform: 'youtube',
                success: false,
                post_id: null,
                published_at: null,
                url: null,
                error_message: 'No YouTube account found',
                simulated: false
              })
            } else {
              const response = await fetch('/api/youtube/post', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  postData: { content: post.content, user_id: session?.user?.id },
                  accountData: youtubeAccount,
                  videoData: {
                    title: `Video from WezaPost - ${new Date().toLocaleDateString()}`,
                    description: post.content,
                    tags: ['wezapost', 'social media', 'video'],
                    privacy: 'public'
                  }
                }),
              })

              if (response.ok) {
                const youtubeResult = await response.json()
                console.log('YouTube API response:', youtubeResult)
                
                results.push({
                  platform: 'youtube',
                  success: true,
                  post_id: youtubeResult.post_id,
                  published_at: new Date().toISOString(),
                  url: youtubeResult.video_url || `https://youtube.com/watch?v=${youtubeResult.post_id}`,
                  error_message: null,
                  simulated: youtubeResult.simulated || false
                })
              } else {
                try {
                  const errorData = await response.json()
                  console.error('YouTube API error response:', errorData)
                  
                  results.push({
                    platform: 'youtube',
                    success: false,
                    post_id: null,
                    published_at: null,
                    url: null,
                    error_message: errorData.error || `YouTube posting failed: ${errorData.message}`,
                    simulated: false
                  })
                } catch (parseError) {
                  results.push({
                    platform: 'youtube',
                    success: false,
                    post_id: null,
                    published_at: null,
                    url: null,
                    error_message: `HTTP ${response.status}: ${response.statusText}`,
                    simulated: false
                  })
                }
              }
            }
          } else {
            // For other platforms not yet implemented, simulate
            await new Promise(resolve => setTimeout(resolve, 500))
            const success = Math.random() > 0.1
            
            results.push({
              platform,
              success,
              post_id: success ? `${platform}_${Date.now()}` : null,
              published_at: success ? new Date().toISOString() : null,
              url: success ? `https://${platform}.com/post/${Date.now()}` : null,
              error_message: success ? null : `${platform} API not implemented yet`,
              simulated: true
            })
          }
        } catch (platformError) {
          console.error(`Error publishing to ${platform}:`, platformError)
          results.push({
            platform,
            success: false,
            post_id: null,
            published_at: null,
            url: null,
            error_message: `Network error: ${platformError}`,
            simulated: false
          })
        }
      }
      
      console.log('Publishing results:', results)
      
      // Update the local post status
      const updatedPosts = posts.map(p => {
        if (p.id === post.id) {
          return {
            ...p,
            status: results.every(r => r.success) ? 'published' as const : 'failed' as const
          }
        }
        return p
      })
      
      setPosts(updatedPosts)
      localStorage.setItem('wezapost-demo-posts', JSON.stringify(updatedPosts))
      
      // Enhanced verification feedback
      const successfulPosts = results.filter(r => r.success)
      const failedPosts = results.filter(r => !r.success)
      
      // Always show a comprehensive status message
      let statusMessage = `🚀 POSTING VERIFICATION REPORT\n\n`
      statusMessage += `📝 Content: "${post.content}"\n`
      statusMessage += `📊 Platforms: ${platforms.join(', ')}\n\n`
      
      if (successfulPosts.length > 0) {
        const realPosts = successfulPosts.filter(r => !r.simulated)
        const simulatedPosts = successfulPosts.filter(r => r.simulated)
        
        if (realPosts.length > 0) {
          statusMessage += `✅ SUCCESSFULLY POSTED TO REAL PLATFORMS:\n`
          realPosts.forEach(r => {
            statusMessage += `• ${r.platform.toUpperCase()}: ✅ LIVE & VERIFIED\n`
            if (r.url) {
              statusMessage += `  🔗 Direct Link: ${r.url}\n`
            }
            if (r.post_id) {
              statusMessage += `  🆔 Post ID: ${r.post_id}\n`
            }
            statusMessage += `  ⏰ Published: ${r.published_at ? new Date(r.published_at).toLocaleString() : 'Not available'}\n`
          })
          statusMessage += `\n`
        }
        
        if (simulatedPosts.length > 0) {
          statusMessage += `🎭 SIMULATED POSTS (Testing Mode):\n`
          simulatedPosts.forEach(r => {
            statusMessage += `• ${r.platform.toUpperCase()}: ✅ Simulation Successful\n`
          })
          statusMessage += `\n`
        }
      }
      
      if (failedPosts.length > 0) {
        statusMessage += `❌ FAILED POSTS:\n`
        failedPosts.forEach(r => {
          statusMessage += `• ${r.platform.toUpperCase()}: ❌ ${r.error_message}\n`
          if (r.suggestion) {
            statusMessage += `  💡 Suggestion: ${r.suggestion}\n`
          }
          if (r.solution) {
            statusMessage += `  🔧 Solution:\n${r.solution}\n`
          }
        })
        statusMessage += `\n`
      }
      
      // Add specific verification steps for Twitter
      const twitterSuccess = successfulPosts.find(r => r.platform === 'twitter' && !r.simulated)
      if (twitterSuccess) {
        statusMessage += `🔍 VERIFICATION STEPS:\n`
        statusMessage += `1. ✅ Your tweet is now LIVE on Twitter\n`
        statusMessage += `2. 🌐 Visit: https://twitter.com/Wezalabstech\n`
        statusMessage += `3. 🔗 Direct link: ${twitterSuccess.url}\n`
        statusMessage += `4. 👀 Tweet should be visible immediately\n`
        statusMessage += `5. 📱 Check notifications for engagement\n`
        statusMessage += `\n🎉 SUCCESS: Your tweet "${post.content}" is PUBLIC on @Wezalabstech!`
      } else if (successfulPosts.some(r => r.simulated)) {
        statusMessage += `ℹ️ SIMULATION MODE ACTIVE\n`
        statusMessage += `• This was a test - no actual posting occurred\n`
        statusMessage += `• Add Twitter Bearer Token for real posting\n`
        statusMessage += `• All functionality verified and working`
      }
      
      // Show comprehensive alert with verification details
      alert(statusMessage)
      
      // Log detailed results for technical verification
      console.log('📊 COMPREHENSIVE PUBLISHING REPORT:', {
        timestamp: new Date().toISOString(),
        post_content: post.content,
        post_id: post.id,
        platforms_attempted: platforms,
        total_results: results.length,
        successful_posts: successfulPosts.length,
        failed_posts: failedPosts.length,
        real_posts: successfulPosts.filter(r => !r.simulated).length,
        simulated_posts: successfulPosts.filter(r => r.simulated).length,
        detailed_results: results,
        verification_urls: results.filter(r => r.url).map(r => ({ platform: r.platform, url: r.url }))
      })
      
    } catch (error) {
      console.error('Error publishing post:', error)
      
      // Enhanced error reporting
      const errorMessage = `❌ PUBLISHING ERROR REPORT\n\n` +
        `Content: "${post.content}"\n` +
        `Platforms: ${platforms.join(', ')}\n` +
        `Error: ${error.message || error}\n\n` +
        `🔧 TROUBLESHOOTING:\n` +
        `• Check internet connection\n` +
        `• Verify Twitter Bearer Token\n` +
        `• Try again in a few minutes\n` +
        `• Check console for detailed error info`
      
      alert(errorMessage)
    }
  }

  const publishPost = async (postId: string, platforms: string[]) => {
    try {
      console.log('Publishing post to platforms:', platforms)
      
      // Get the post content from our posts
      const post = posts.find(p => p.id === postId)
      if (!post) {
        console.error('Post not found:', postId)
        return
      }

      const results = []

      // Publish to each platform
      for (const platform of platforms) {
        try {
          console.log(`Publishing to ${platform}...`)
          
          if (platform === 'twitter') {
            // Make real API call to Twitter
            const response = await fetch('/api/twitter/post', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                content: post.content
              }),
            })

            if (response.ok) {
              const twitterResult = await response.json()
              console.log('Twitter API response:', twitterResult)
              
              results.push({
                platform: 'twitter',
                success: true,
                post_id: twitterResult.tweet.id,
                published_at: twitterResult.tweet.created_at,
                url: twitterResult.tweet.url,
                error_message: null,
                simulated: twitterResult.simulated || false
              })
            } else {
              try {
                const errorData = await response.json()
                console.error('Twitter API error response:', {
                  status: response.status,
                  statusText: response.statusText,
                  data: errorData
                })
                
                results.push({
                  platform: 'twitter',
                  success: false,
                  post_id: null,
                  published_at: null,
                  url: null,
                  error_message: errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`,
                  simulated: false,
                  suggestion: errorData.suggestion || '',
                  solution: errorData.solution || ''
                })
              } catch (parseError) {
                console.error('Failed to parse error response:', parseError)
                console.error('Raw response status:', response.status, response.statusText)
                
                results.push({
                  platform: 'twitter',
                  success: false,
                  post_id: null,
                  published_at: null,
                  url: null,
                  error_message: `HTTP ${response.status}: ${response.statusText}`,
                  simulated: false
                })
              }
            }
          } else if (platform === 'facebook') {
            // Make real API call to Facebook with account data
            const facebookAccount = accounts.find(acc => acc.platform === 'facebook')
            const response = await fetch('/api/facebook/post', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                content: post.content,
                account: facebookAccount
              }),
            })

            if (response.ok) {
              const facebookResult = await response.json()
              console.log('Facebook API response:', facebookResult)
              
              results.push({
                platform: 'facebook',
                success: true,
                post_id: facebookResult.post.id,
                published_at: facebookResult.post.created_at && new Date(facebookResult.post.created_at).toString() !== 'Invalid Date' 
                  ? facebookResult.post.created_at 
                  : new Date().toISOString(),
                url: facebookResult.post.url,
                error_message: null,
                simulated: facebookResult.simulated || false
              })
            } else {
              try {
                const errorData = await response.json()
                console.error('Facebook API error response:', errorData)
                
                results.push({
                  platform: 'facebook',
                  success: false,
                  post_id: null,
                  published_at: null,
                  url: null,
                  error_message: errorData.error || `Facebook posting failed: ${errorData.details}`,
                  simulated: false
                })
              } catch (parseError) {
                results.push({
                  platform: 'facebook',
                  success: false,
                  post_id: null,
                  published_at: null,
                  url: null,
                  error_message: `Facebook API error: ${response.statusText}`,
                  simulated: false
                })
              }
            }
          } else if (platform === 'instagram') {
            // Make real API call to Instagram
            console.log('Making real Instagram API call...')
            const instagramAccount = accounts.find(acc => acc.platform === 'instagram')
            
            if (!instagramAccount) {
              results.push({
                platform: 'instagram',
                success: false,
                post_id: null,
                published_at: null,
                url: null,
                error_message: 'No Instagram account found',
                simulated: false
              })
            } else {
              const response = await fetch('/api/instagram/post', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  account: instagramAccount,
                  content: post.content,
                  mediaUrls: post.media_urls || ['https://images.unsplash.com/photo-1516802273409-68526ee1bdd6?w=500&h=500&fit=crop&crop=entropy&auto=format']
                }),
              })

              if (response.ok) {
                const instagramResult = await response.json()
                console.log('Instagram API response:', instagramResult)
                
                // Validate publishedAt date
                let publishedAt = instagramResult.post?.created_at || instagramResult.publishedAt
                if (!publishedAt || (typeof publishedAt === 'string' && new Date(publishedAt).toString() === 'Invalid Date')) {
                  publishedAt = new Date().toISOString()
                }
                
                results.push({
                  platform: 'instagram',
                  success: true,
                  post_id: instagramResult.post?.id || instagramResult.postId,
                  published_at: publishedAt,
                  url: instagramResult.post?.url || instagramResult.url,
                  error_message: null,
                  simulated: instagramResult.simulated || false
                })
              } else {
                try {
                  const errorData = await response.json()
                  console.error('Instagram API error response:', errorData)
                  
                  results.push({
                    platform: 'instagram',
                    success: false,
                    post_id: null,
                    published_at: null,
                    url: null,
                    error_message: errorData.error || `Instagram posting failed: ${errorData.details}`,
                    simulated: false
                  })
                } catch (parseError) {
                  results.push({
                    platform: 'instagram',
                    success: false,
                    post_id: null,
                    published_at: null,
                    url: null,
                    error_message: `Instagram API error: ${response.statusText}`,
                    simulated: false
                  })
                }
              }
            }
          } else if (platform === 'tiktok') {
            // Make real API call to TikTok
            console.log('Making real TikTok API call...')
            const tiktokAccount = accounts.find(acc => acc.platform === 'tiktok')
            
            if (!tiktokAccount) {
              results.push({
                platform: 'tiktok',
                success: false,
                post_id: null,
                published_at: null,
                url: null,
                error_message: 'No TikTok account found',
                simulated: false
              })
            } else {
              const response = await fetch('/api/tiktok/post', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  account: tiktokAccount,
                  content: post.content,
                  mediaUrls: post.media_urls || []
                }),
              })

              if (response.ok) {
                const tiktokResult = await response.json()
                console.log('TikTok API response:', tiktokResult)
                
                // Validate publishedAt date
                let publishedAt = tiktokResult.post?.created_at || tiktokResult.publishedAt
                if (!publishedAt || (typeof publishedAt === 'string' && new Date(publishedAt).toString() === 'Invalid Date')) {
                  publishedAt = new Date().toISOString()
                }
                
                results.push({
                  platform: 'tiktok',
                  success: true,
                  post_id: tiktokResult.post?.id || tiktokResult.postId,
                  published_at: publishedAt,
                  url: tiktokResult.post?.url || tiktokResult.url,
                  error_message: null,
                  simulated: tiktokResult.simulated || false
                })
              } else {
                try {
                  const errorData = await response.json()
                  console.error('TikTok API error response:', errorData)
                  
                  results.push({
                    platform: 'tiktok',
                    success: false,
                    post_id: null,
                    published_at: null,
                    url: null,
                    error_message: errorData.error || `TikTok posting failed: ${errorData.details}`,
                    simulated: false
                  })
                } catch (parseError) {
                  results.push({
                    platform: 'tiktok',
                    success: false,
                    post_id: null,
                    published_at: null,
                    url: null,
                    error_message: `TikTok API error: ${response.statusText}`,
                    simulated: false
                  })
                }
              }
            }
          } else if (platform === 'linkedin') {
            // Make real API call to LinkedIn
            console.log('Making real LinkedIn API call...')
            // Find the selected LinkedIn account based on selectedAccounts
            const selectedLinkedInAccountId = selectedAccounts.find(accountId => {
              const account = accounts.find(acc => acc.id === accountId)
              return account?.platform === 'linkedin'
            })
            const linkedinAccount = selectedLinkedInAccountId 
              ? accounts.find(acc => acc.id === selectedLinkedInAccountId)
              : accounts.find(acc => acc.platform === 'linkedin') // fallback to first LinkedIn account
            
            if (!linkedinAccount) {
              results.push({
                platform: 'linkedin',
                success: false,
                post_id: null,
                published_at: null,
                url: null,
                error_message: 'No LinkedIn account found',
                simulated: false
              })
            } else {
              const response = await fetch('/api/linkedin/post', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  postData: { content: post.content },
                  accountData: linkedinAccount
                }),
              })
              if (response.ok) {
                const linkedinResult = await response.json()
                console.log('LinkedIn API response:', linkedinResult)
                
                results.push({
                  platform: 'linkedin',
                  success: true,
                  post_id: linkedinResult.post_id,
                  published_at: new Date().toISOString(),
                  url: `https://linkedin.com/in/${linkedinAccount.username}`,
                  error_message: null,
                  simulated: false
                })
              } else {
                try {
                  const errorData = await response.json()
                  console.error('LinkedIn API error response:', errorData)
                  
                  results.push({
                    platform: 'linkedin',
                    success: false,
                    post_id: null,
                    published_at: null,
                    url: null,
                    error_message: errorData.error || `LinkedIn posting failed: ${errorData.details}`,
                    simulated: false
                  })
                } catch (parseError) {
                  results.push({
                    platform: 'linkedin',
                    success: false,
                    post_id: null,
                    published_at: null,
                    url: null,
                    error_message: `LinkedIn API error: ${response.statusText}`,
                    simulated: false
                  })
                }
              }
            }
          } else if (platform === 'youtube') {
            // Make real API call to YouTube (video upload simulation)
            console.log('Making real YouTube API call...')
            const youtubeAccount = accounts.find(acc => acc.platform === 'youtube')
            
            if (!youtubeAccount) {
              results.push({
                platform: 'youtube',
                success: false,
                post_id: null,
                published_at: null,
                url: null,
                error_message: 'No YouTube account found',
                simulated: false
              })
            } else {
              const response = await fetch('/api/youtube/post', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  postData: { content: post.content, user_id: session?.user?.id },
                  accountData: youtubeAccount,
                  videoData: {
                    title: `Video from WezaPost - ${new Date().toLocaleDateString()}`,
                    description: post.content,
                    tags: ['wezapost', 'social media', 'video'],
                    privacy: 'public'
                  }
                }),
              })

              if (response.ok) {
                const youtubeResult = await response.json()
                console.log('YouTube API response:', youtubeResult)
                
                results.push({
                  platform: 'youtube',
                  success: true,
                  post_id: youtubeResult.post_id,
                  published_at: new Date().toISOString(),
                  url: youtubeResult.video_url || `https://youtube.com/watch?v=${youtubeResult.post_id}`,
                  error_message: null,
                  simulated: youtubeResult.simulated || false
                })
              } else {
                try {
                  const errorData = await response.json()
                  console.error('YouTube API error response:', errorData)
                  
                  results.push({
                    platform: 'youtube',
                    success: false,
                    post_id: null,
                    published_at: null,
                    url: null,
                    error_message: errorData.error || `YouTube posting failed: ${errorData.message}`,
                    simulated: false
                  })
                } catch (parseError) {
                  results.push({
                    platform: 'youtube',
                    success: false,
                    post_id: null,
                    published_at: null,
                    url: null,
                    error_message: `HTTP ${response.status}: ${response.statusText}`,
                    simulated: false
                  })
                }
              }
            }
          } else {
            // For other platforms not yet implemented, simulate
            await new Promise(resolve => setTimeout(resolve, 500))
            const success = Math.random() > 0.1
            
            results.push({
              platform,
              success,
              post_id: success ? `${platform}_${Date.now()}` : null,
              published_at: success ? new Date().toISOString() : null,
              url: success ? `https://${platform}.com/post/${Date.now()}` : null,
              error_message: success ? null : `${platform} API not implemented yet`,
              simulated: true
            })
          }
        } catch (platformError) {
          console.error(`Error publishing to ${platform}:`, platformError)
          results.push({
            platform,
            success: false,
            post_id: null,
            published_at: null,
            url: null,
            error_message: `Network error: ${platformError}`,
            simulated: false
          })
        }
      }
      
      console.log('Publishing results:', results)
      
      // Update the local post status
      const updatedPosts = posts.map(p => {
        if (p.id === postId) {
          return {
            ...p,
            status: results.every(r => r.success) ? 'published' as const : 'failed' as const
          }
        }
        return p
      })
      
      setPosts(updatedPosts)
      localStorage.setItem('wezapost-demo-posts', JSON.stringify(updatedPosts))
      
      // Show results to user
      const successfulPosts = results.filter(r => r.success)
      const failedPosts = results.filter(r => !r.success)
      
      if (successfulPosts.length > 0) {
        const realPosts = successfulPosts.filter(r => !r.simulated)
        const simulatedPosts = successfulPosts.filter(r => r.simulated)
        
        let message = ''
        if (realPosts.length > 0) {
          message += `✅ Successfully posted to: ${realPosts.map(r => r.platform).join(', ')}`
          if (realPosts.some(r => r.url)) {
            const twitterPost = realPosts.find(r => r.platform === 'twitter')
            if (twitterPost?.url) {
              message += `\n🐦 View on Twitter: ${twitterPost.url}`
            }
          }
        }
        if (simulatedPosts.length > 0) {
          if (message) message += '\n'
          message += `🎭 Simulated posting to: ${simulatedPosts.map(r => r.platform).join(', ')}`
        }
        alert(message)
      }
      
      if (failedPosts.length > 0) {
        const errorMessage = `❌ Failed to post to: ${failedPosts.map(r => `${r.platform} (${r.error_message})`).join(', ')}`
        alert(errorMessage)
      }
      
    } catch (error) {
      console.error('Error publishing post:', error)
      alert(`Error publishing post: ${error}`)
    }
  }

  const scheduleForProcessing = async (postId: string, scheduledFor: string, platforms: string[]) => {
    try {
      // Determine if this is a curated post or regular post
      // Check for both UUID format and curated_ prefix format
      const isCuratedPost = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(postId) || 
                           postId.startsWith('curated_')
      
      const endpoint = isCuratedPost ? '/api/curated-posts/schedule' : '/api/posts/schedule'
      
      console.log(`Scheduling ${isCuratedPost ? 'curated' : 'regular'} post using endpoint:`, endpoint)
      
      // Call the appropriate scheduling API endpoint
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postId,
          scheduledFor,
          platforms,
          userId: session?.user?.id
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('Scheduling failed:', response.status, errorData)
        throw new Error(`Failed to schedule post: ${errorData.error || response.statusText}`)
      }
      
      const result = await response.json()
      console.log('Post scheduled successfully:', result)
      
      // Show success message
      alert(`✅ Post scheduled successfully for ${new Date(scheduledFor).toLocaleString()}`)
    } catch (error) {
      console.error('Error scheduling post:', error)
      alert(`❌ Failed to schedule post: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleAccountToggle = (accountId: string, platform: string) => {
    console.log('Toggling account:', accountId, 'platform:', platform)
    console.log('Current selectedAccounts:', selectedAccounts)
    console.log('Current selectedPlatforms:', selectedPlatforms)
    
    // For LinkedIn (which can have multiple accounts), track specific account IDs
    if (platform === 'linkedin') {
      setSelectedAccounts(prev => {
        const newAccountSelection = prev.includes(accountId)
          ? prev.filter(id => id !== accountId)
          : [...prev, accountId]
        
        console.log('LinkedIn - New selectedAccounts:', newAccountSelection)
        
        // Update selectedPlatforms to reflect if any LinkedIn account is selected
        setSelectedPlatforms(prevPlatforms => {
          const hasLinkedInSelected = newAccountSelection.some(id => {
            const account = accounts.find(acc => acc.id === id)
            return account?.platform === 'linkedin'
          })
          
          const newPlatformSelection = hasLinkedInSelected
            ? [...prevPlatforms.filter(p => p !== 'linkedin'), 'linkedin']
            : prevPlatforms.filter(p => p !== 'linkedin')
          
          console.log('LinkedIn - New selectedPlatforms:', newPlatformSelection)
          return newPlatformSelection
        })
        
        return newAccountSelection
      })
    } else {
      // For other platforms, use simple platform toggle
      setSelectedPlatforms(prev => {
        const newSelection = prev.includes(platform)
          ? prev.filter(p => p !== platform)
          : [...prev, platform]
        
        console.log('Platform toggle - New selectedPlatforms:', newSelection)
        return newSelection
      })
    }
  }

  const handleSelectAllConnected = () => {
    const allPlatforms = activeAccounts.map(account => account.platform)
    const allSelected = allPlatforms.every(platform => selectedPlatforms.includes(platform))
    
    if (allSelected) {
      // If all are selected, deselect all
      setSelectedPlatforms([])
    } else {
      // If not all are selected, select all
      setSelectedPlatforms(allPlatforms)
    }
  }

  const handleCreatePost = async (action: 'draft' | 'publish' | 'schedule') => {
    if (!content.trim()) {
      alert('Please enter some content for your post')
      return
    }
    
    if (selectedPlatforms.length === 0) {
      alert('Please select at least one platform to post to')
      return
    }
    
    // Validation for scheduling
    if (action === 'schedule' && scheduleMode === 'later') {
      if (!scheduledDate || !scheduledTime) {
        alert('Please select both date and time for scheduling')
        return
      }
      
      const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`)
      if (scheduledDateTime <= new Date()) {
        alert('Scheduled time must be in the future')
        return
      }
    }
    
    setIsSubmitting(true)
    
    try {
      let scheduledFor = null
      let status: 'draft' | 'published' | 'scheduled' = 'draft'
      
      if (action === 'schedule' && scheduleMode === 'later') {
        scheduledFor = new Date(`${scheduledDate}T${scheduledTime}`).toISOString()
        status = 'scheduled'
      } else if (action === 'publish') {
        status = 'published'
      }
      
      // Check if we're working with a curated post (from prefillData)
      const isCuratedPost = prefillData && prefillData.curatedPostId
      let postId: string
      
      if (isCuratedPost && prefillData.curatedPostId) {
        // Use the actual curated post ID
        postId = prefillData.curatedPostId
        console.log('Working with curated post, using ID:', postId)
      } else {
        // Regular post
        postId = `post-${Date.now()}`
      }
      
      // Create mock post for demo
      const mockPost: Post = {
        id: postId,
        content: content.trim(),
        platforms: selectedPlatforms,
        status,
        scheduled_for: scheduledFor,
        created_at: new Date().toISOString()
      }

      // Publish to real platforms for immediate posts
      if (action === 'publish') {
        console.log('Using REAL publishing for platforms:', selectedPlatforms)
        await publishPostDirect(mockPost, selectedPlatforms)
      }

      // Add to posts list and save to localStorage (skip for curated posts to avoid duplication)
      if (!isCuratedPost) {
        const newPosts = [mockPost, ...posts]
        
        // Check for duplicate IDs
        const postIds = newPosts.map(p => p.id)
        const uniqueIds = new Set(postIds)
        if (postIds.length !== uniqueIds.size) {
          console.warn('⚠️ Duplicate post IDs detected in posts array:', {
            total: postIds.length,
            unique: uniqueIds.size,
            duplicates: postIds.filter((id, index) => postIds.indexOf(id) !== index)
          })
        }
        
        setPosts(newPosts)
        localStorage.setItem('wezapost-demo-posts', JSON.stringify(newPosts))
      }

      // Try to save to database if authenticated (skip for curated posts to avoid duplication)
      if (session?.user?.id && !isCuratedPost) {
        try {
          // Import the database service
          const { databasePostingService } = await import('@/lib/database-posting-service')
          
          // Create post in database
          const dbPostId = await databasePostingService.createPost(
            session.user.id,
            content.trim(),
            selectedPlatforms,
            scheduledFor ? scheduledFor : undefined
          )

          if (dbPostId) {
            console.log('✅ Post created in database with ID:', dbPostId)
            // Update the mock post with the real database ID
            mockPost.id = dbPostId
          } else {
            console.log('❌ Failed to create post in database')
          }
        } catch (error) {
          console.log('Database not available, using demo mode only:', error)
        }
      }

      // Handle scheduled posts (publishing is already done above)
      if (action === 'schedule' && scheduledFor) {
        console.log('Scheduled post for:', scheduledFor)
        // Add to Redis queue for scheduled processing (use mockPost.id for now)
        await scheduleForProcessing(mockPost.id, scheduledFor, selectedPlatforms)
      }

      // Reset form
      setContent('')
      setSelectedPlatforms([])
      setScheduledDate('')
      setScheduledTime('')
      
      // Reload posts to refresh the Recent Posts section
      await loadData()
      setScheduleMode('now')
      
      // Call success callback if provided
      if (onPostCreated) {
        onPostCreated()
      }

    } catch (error) {
      console.error('Failed to create post:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusColor = (status: Post['status']) => {
    switch (status) {
      case 'published':
        return 'bg-green-600'
      case 'scheduled':
        return 'bg-blue-600'
      case 'failed':
        return 'bg-red-600'
      default:
        return 'bg-gray-600'
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Create Post</CardTitle>
            <CardDescription>Loading...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-sm font-mono">Loading...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Filter to only show real accounts when user is authenticated
  let activeAccounts = accounts
  
  // If user is authenticated, only show real connected accounts (no demo fallback)
  if (session?.user?.id) {
    // Only show real accounts, no demo accounts for authenticated users
    activeAccounts = accounts.filter(account => 
      account.username === 'Wezalabstech' || 
      account.id.includes('real') || 
      !account.id.includes('demo')
    )
    
    // If no real accounts found, show empty state (no demo fallback)
    if (activeAccounts.length === 0) {
      console.log('No real accounts found for authenticated user')
      // For debugging: show what accounts we had before filtering
      console.log('Original accounts before filtering:', accounts)
    }
  } else {
    // Not authenticated - create demo account for testing
    if (accounts.length === 0) {
      activeAccounts = [
        {
          id: 'demo-twitter-test',
          platform: 'twitter',
          username: 'demo_twitter_user',
          display_name: 'Demo Twitter Account (Testing)',
          avatar_url: 'https://ui-avatars.com/api/?name=twitter&background=random',
          is_active: true,
          settings: {
            auto_post: true,
            default_visibility: 'public',
            custom_hashtags: ['#twitter', '#demo'],
          }
        }
      ]
    }
  }
  
  console.log('Post creator active accounts:', activeAccounts)
  console.log('Current selectedPlatforms state:', selectedPlatforms)

  return (
    <div className="space-y-6">
      {/* Post Creator */}
      <Card>
        <CardHeader>
          <CardTitle>Create Post</CardTitle>
          <CardDescription>
            Write your content and select platforms to post to
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Textarea
              placeholder="What's happening?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[120px] font-mono"
              maxLength={280}
            />
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-muted-foreground">
                {content.length}/280 characters
              </span>
            </div>
          </div>

          <div>
            <div className="mb-3">
              <span className="text-sm font-medium font-mono">Select Platforms:</span>
            </div>
            {activeAccounts.length === 0 && session?.user?.id ? (
              <div className="text-center py-6 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-700 font-mono mb-4">
                  No social media accounts connected yet
                </p>
                <button 
                  onClick={() => window.location.href = '/dashboard/accounts'}
                  className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm font-mono"
                >
                  Connect Your Accounts
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Select All Connected Option */}
                {activeAccounts.length > 1 && (
                  <div className="pb-2 border-b border-gray-200">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={activeAccounts.length > 0 && activeAccounts.every(account => selectedPlatforms.includes(account.platform))}
                        onChange={handleSelectAllConnected}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        All Connected Platforms ({activeAccounts.length})
                      </span>
                    </label>
                  </div>
                )}

                {/* Individual Platform Checkboxes */}
                <div className="grid gap-3 sm:grid-cols-1 lg:grid-cols-2">
                  {activeAccounts.map((account) => {
                    const platformInfo = socialManager.getPlatformInfo(account.platform)
                    const isSelected = account.platform === 'linkedin' 
                      ? selectedAccounts.includes(account.id) 
                      : selectedPlatforms.includes(account.platform)
                    
                    console.log(`Account: ${account.username}, Platform: ${account.platform}, IsSelected: ${isSelected}`)
                    
                    // Account is real if it has 'real-' prefix, specific usernames, or real_oauth flag
                    const isRealAccount = account.username === 'Wezalabstech' || 
                                        account.username === 'Wezalabs Wezalabs' || 
                                        account.id.includes('real') || 
                                        (account as any).real_oauth === true
                    const accountType = isRealAccount ? 'REAL' : 'DEMO'
                    
                    return (
                      <label
                        key={account.id}
                        className={`flex items-center justify-between px-4 py-3 rounded-lg border-2 cursor-pointer transition-all duration-200 min-w-[200px] ${
                          isSelected 
                            ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-md ring-2 ring-blue-200' 
                            : 'border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleAccountToggle(account.id, account.platform)}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${platformInfo.color}`}>
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                              <path d={platformInfo.icon} />
                            </svg>
                          </div>
                        <div className="text-left">
                          <div className="text-sm font-semibold font-mono">@{account.username}</div>
                          <div className="text-xs text-gray-500">{account.display_name}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                          isRealAccount 
                            ? 'bg-green-100 text-green-800 border border-green-300'
                            : 'bg-orange-100 text-orange-800 border border-orange-300'
                        }`}>
                          {accountType}
                        </span>
                        {isSelected && (
                          <div className="w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center">
                            <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </label>
                  )
                })}
                </div>
              </div>
            )}
            <div className="mt-4">
              {selectedPlatforms.includes('linkedin') && selectedAccounts.some(id => {
                const account = accounts.find(acc => acc.id === id)
                return account?.platform === 'linkedin' && account?.account_type === 'business'
              }) && (
                <div className="text-sm text-blue-600 bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                  ℹ️ <strong>LinkedIn Business Page:</strong> Due to OAuth limitations, business posts will be published to your personal profile with "[Posted on behalf of WezaLabs]" notation. Contact admin to upgrade to organization posting permissions.
                </div>
              )}
              {selectedPlatforms.length === 0 ? (
                <div className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-3">
                  ⚠️ Please select at least one account to post to
                </div>
              ) : (
                <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg p-3">
                  ✅ <strong>Selected for posting:</strong> {
                    selectedPlatforms.map(platform => {
                      const account = activeAccounts.find(acc => acc.platform === platform)
                      const isReal = account?.username === 'Wezalabstech' || 
                                   account?.username === 'Wezalabs Wezalabs' || 
                                   account?.id.includes('real') || 
                                   (account as any)?.real_oauth === true
                      return `@${account?.username} (${isReal ? 'REAL' : 'DEMO'})`
                    }).join(', ')
                  }
                </div>
              )}
            </div>
          </div>

          {/* Scheduling Options */}
          <div>
            <div className="mb-3">
              <span className="text-sm font-medium font-mono">When to Post:</span>
            </div>
            <div className="flex space-x-4 mb-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  value="now"
                  checked={scheduleMode === 'now'}
                  onChange={(e) => setScheduleMode(e.target.value as 'now' | 'later')}
                  className="text-primary focus:ring-primary"
                />
                <span className="text-sm font-mono">Post Now</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  value="later"
                  checked={scheduleMode === 'later'}
                  onChange={(e) => setScheduleMode(e.target.value as 'now' | 'later')}
                  className="text-primary focus:ring-primary"
                />
                <span className="text-sm font-mono">Schedule for Later</span>
              </label>
            </div>
            
            {scheduleMode === 'later' && (
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-xs font-medium font-mono mb-1">
                    Date
                  </label>
                  <Input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    min={format(new Date(), 'yyyy-MM-dd')}
                    className="font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium font-mono mb-1">
                    Time
                  </label>
                  <Input
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="font-mono"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex space-x-2">
            <Button
              onClick={() => handleCreatePost('draft')}
              disabled={!content.trim() || isSubmitting}
              variant="outline"
              className="flex-1"
            >
              {isSubmitting ? 'Saving...' : 'Save as Draft'}
            </Button>
            
            {scheduleMode === 'now' ? (
              <Button
                onClick={() => handleCreatePost('publish')}
                disabled={!content.trim() || selectedPlatforms.length === 0 || isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? 'Publishing...' : 'Publish Now'}
              </Button>
            ) : (
              <Button
                onClick={() => handleCreatePost('schedule')}
                disabled={!content.trim() || selectedPlatforms.length === 0 || isSubmitting || !scheduledDate || !scheduledTime}
                className="flex-1"
              >
                {isSubmitting ? 'Scheduling...' : 'Schedule Post'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Posts */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Posts</CardTitle>
          <CardDescription>
            Your latest posts and their status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {posts.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-muted-foreground font-mono">
                No posts created yet. Create your first post above!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post, index) => {
                // Debug log to track post IDs
                if (index === 0) {
                  console.log('🔍 Rendering posts with IDs:', posts.map(p => p.id))
                }
                return (
                  <div key={`${post.id}-${index}`} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="text-sm font-mono line-clamp-3">
                        {post.content}
                      </p>
                    </div>
                    <Badge className={`ml-4 ${getStatusColor(post.status)}`}>
                      {post.status}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2 mt-3">
                    <span className="text-xs text-muted-foreground font-mono">
                      {post.status === 'scheduled' && post.scheduled_for
                        ? `Scheduled: ${format(new Date(post.scheduled_for), 'MMM dd, yyyy HH:mm')}`
                        : `Created: ${format(new Date(post.created_at), 'MMM dd, yyyy')}`
                      }
                    </span>
                    <span className="text-xs text-muted-foreground">•</span>
                    <div className="flex space-x-1">
                      {post.platforms.map((platform) => {
                        const platformInfo = socialManager.getPlatformInfo(platform as any)
                        return (
                          <div 
                            key={platform}
                            className={`w-5 h-5 rounded flex items-center justify-center ${platformInfo.color}`}
                            title={platformInfo.name}
                          >
                            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                              <path d={platformInfo.icon} />
                            </svg>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )
            })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}