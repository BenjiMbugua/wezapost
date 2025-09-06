"use client"

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ThemeToggle } from '@/components/theme-toggle'
import { SocialAccountsManager } from '@/components/features/social-accounts'
import { EnhancedPostCreator } from '@/components/features/enhanced-post-creator'
import { CalendarView } from '@/components/features/calendar-view'
import { SchedulerDashboard } from '@/components/features/scheduler-dashboard'
import { RecentPosts } from '@/components/features/recent-posts'

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return
    
    // For development, allow access without authentication
    if (!session && process.env.NODE_ENV === 'production') {
      router.push('/auth/signin')
    }

    // Handle OAuth callback success
    const urlParams = new URLSearchParams(window.location.search)
    const socialConnected = urlParams.get('social_connected')
    const accountData = urlParams.get('account_data')
    
    if (socialConnected && accountData) {
      try {
        const decodedData = JSON.parse(Buffer.from(accountData, 'base64').toString())
        
        // Save to localStorage for immediate UI update
        const existingAccounts = JSON.parse(localStorage.getItem('wezapost-demo-accounts') || '[]')
        
        // Check if personal account already exists
        const personalAccountExists = existingAccounts.some((account: any) => 
          account.platform === socialConnected && 
          account.username === decodedData.username &&
          account.account_type !== 'business'
        )
        
        // Check if business account already exists
        const businessAccountExists = existingAccounts.some((account: any) => 
          account.platform === socialConnected && 
          account.account_type === 'business'
        )
        
        const accountsToAdd = []
        
        // Add personal account if it doesn't exist
        if (!personalAccountExists) {
          const personalAccount = {
            id: `real-${socialConnected}-personal-${Date.now()}`,
            platform: socialConnected,
            platform_user_id: decodedData.platform_user_id,
            username: decodedData.username,
            display_name: decodedData.display_name,
            avatar_url: decodedData.avatar_url,
            is_active: true,
            access_token: decodedData.access_token,
            refresh_token: decodedData.refresh_token,
            expires_at: decodedData.expires_at,
            account_type: 'personal',
            settings: {
              auto_post: true,
              default_visibility: 'public',
              custom_hashtags: [`#${socialConnected}`],
            }
          }
          accountsToAdd.push(personalAccount)
        }
        
        // Add business account if it doesn't exist (LinkedIn only)
        if (socialConnected === 'linkedin' && !businessAccountExists) {
          const businessAccount = {
            id: `real-${socialConnected}-business-${Date.now()}`,
            platform: socialConnected,
            platform_user_id: decodedData.platform_user_id,
            username: 'wezalabs',
            display_name: 'WezaLabs (Business Page)',
            avatar_url: decodedData.avatar_url,
            is_active: true,
            access_token: decodedData.access_token,
            refresh_token: decodedData.refresh_token,
            expires_at: decodedData.expires_at,
            account_type: 'business',
            company_id: '108484251',
            settings: {
              auto_post: true,
              default_visibility: 'public',
              custom_hashtags: ['#wezalabs', '#business'],
            }
          }
          accountsToAdd.push(businessAccount)
        }
        
        if (accountsToAdd.length > 0) {
          const updatedAccounts = [...existingAccounts, ...accountsToAdd]
          localStorage.setItem('wezapost-demo-accounts', JSON.stringify(updatedAccounts))
          console.log(`✅ ${socialConnected} accounts connected:`, accountsToAdd.map(acc => acc.display_name))
        } else {
          console.log(`ℹ️ ${socialConnected} accounts already exist, skipping duplicate`)
        }
        
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname)
        
        // Show success message
        console.log(`✅ ${socialConnected} account connected successfully!`)
      } catch (error) {
        console.error('Error processing OAuth callback:', error)
      }
    }

    // Handle Facebook OAuth callback
    const success = urlParams.get('success')
    const accountParam = urlParams.get('account')
    
    if (success === 'facebook_connected' && accountParam) {
      try {
        const accountData = JSON.parse(decodeURIComponent(accountParam))
        
        // Save Facebook account to localStorage
        const existingAccounts = JSON.parse(localStorage.getItem('wezapost-demo-accounts') || '[]')
        
        // Remove any existing Facebook account for this user
        const filteredAccounts = existingAccounts.filter((acc: any) => 
          !(acc.platform === 'facebook' && acc.user_id === accountData.user_id)
        )
        
        // Add the new Facebook account
        const updatedAccounts = [...filteredAccounts, accountData]
        localStorage.setItem('wezapost-demo-accounts', JSON.stringify(updatedAccounts))
        
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname)
        
        console.log('✅ Facebook account connected and saved to localStorage!', accountData)
      } catch (error) {
        console.error('Error processing Facebook OAuth callback:', error)
      }
    }

    // Handle Instagram OAuth callback
    if (success === 'instagram_connected' && accountParam) {
      try {
        const accountData = JSON.parse(decodeURIComponent(accountParam))
        
        // Save Instagram account to localStorage
        const existingAccounts = JSON.parse(localStorage.getItem('wezapost-demo-accounts') || '[]')
        
        // Remove any existing Instagram account for this user
        const filteredAccounts = existingAccounts.filter((acc: any) => 
          !(acc.platform === 'instagram' && acc.user_id === accountData.user_id)
        )
        
        // Add the new Instagram account
        const updatedAccounts = [...filteredAccounts, accountData]
        localStorage.setItem('wezapost-demo-accounts', JSON.stringify(updatedAccounts))
        
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname)
        
        console.log('✅ Instagram account connected and saved to localStorage!', accountData)
      } catch (error) {
        console.error('Error processing Instagram OAuth callback:', error)
      }
    }

    // Handle TikTok OAuth callback
    if (success === 'tiktok_connected' && accountParam) {
      try {
        const accountData = JSON.parse(decodeURIComponent(accountParam))
        
        // Save TikTok account to localStorage
        const existingAccounts = JSON.parse(localStorage.getItem('wezapost-demo-accounts') || '[]')
        
        // Remove any existing TikTok account for this user
        const filteredAccounts = existingAccounts.filter((acc: any) => 
          !(acc.platform === 'tiktok' && acc.user_id === accountData.user_id)
        )
        
        // Add the new TikTok account
        const updatedAccounts = [...filteredAccounts, accountData]
        localStorage.setItem('wezapost-demo-accounts', JSON.stringify(updatedAccounts))
        
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname)
        
        console.log('✅ TikTok account connected and saved to localStorage!', accountData)
      } catch (error) {
        console.error('Error processing TikTok OAuth callback:', error)
      }
    }
  }, [session, status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="font-mono">Loading...</span>
        </div>
      </div>
    )
  }

  // Show demo mode notice if no session
  const isDemoMode = !session

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/40 glass sticky top-0 z-50 theme-transition">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-6">
              <h1 className="text-xl font-bold font-mono text-gradient-primary">WezaPost</h1>
              <div className="text-sm text-muted-foreground font-mono">
                Dashboard
              </div>
              {isDemoMode && (
                <div className="px-3 py-1 rounded-full text-xs font-mono status-warning animate-fade-in">
                  Demo Mode
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <div className="flex items-center space-x-3 px-3 py-2 rounded-lg glass-dark">
                {session?.user?.image && (
                  <Image 
                    src={session.user.image} 
                    alt="Profile"
                    width={32}
                    height={32}
                    className="w-8 h-8 rounded-full ring-2 ring-border/20"
                  />
                )}
                <span className="text-sm font-mono text-foreground">
                  {session?.user?.name || session?.user?.email || 'Demo User'}
                </span>
              </div>
              {session ? (
                <Button 
                  variant="outline" 
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="text-sm font-mono focus-ring shadow-theme-sm hover:shadow-theme-md"
                >
                  Sign Out
                </Button>
              ) : (
                <Button 
                  variant="outline" 
                  onClick={() => router.push('/auth/signin')}
                  className="text-sm font-mono focus-ring shadow-theme-sm hover:shadow-theme-md"
                >
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 sm:px-8 py-8">
        <div className="space-y-8">
          {/* Welcome Section */}
          <Card className="shadow-theme-md border-border/50 hover:shadow-theme-lg transition-all theme-transition animate-fade-in">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl font-mono">
                {isDemoMode ? 'Welcome to WezaPost Demo!' : 'Welcome Back!'}
              </CardTitle>
              <CardDescription className="font-mono">
                {isDemoMode 
                  ? 'Exploring WezaPost features in demo mode'
                  : 'You&apos;re now signed in to WezaPost'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 text-sm font-mono">
                <div className="flex items-center space-x-2">
                  <span className="text-muted-foreground">Email:</span> 
                  <span className="text-foreground">{session?.user?.email || 'demo@wezapost.com'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-muted-foreground">Name:</span> 
                  <span className="text-foreground">{session?.user?.name || 'Demo User'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-muted-foreground">Status:</span> 
                  <span className={`px-2 py-1 rounded-full text-xs ${isDemoMode ? 'status-warning' : 'status-published'}`}>
                    {isDemoMode ? 'Demo Mode' : 'Authenticated'}
                  </span>
                </div>
              </div>
              {isDemoMode && (
                <div className="mt-6 p-4 glass-dark rounded-xl border border-border/30 animate-slide-up">
                  <p className="text-sm text-info font-mono leading-relaxed">
                    💡 This is a demo mode. To use real functionality, please sign in with OAuth providers configured in the .env.local file.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Social Accounts Management */}
          <SocialAccountsManager />

          {/* Enhanced Post Creator with Curated Posts */}
          <EnhancedPostCreator />

          {/* Calendar View */}
          <CalendarView />

          {/* Scheduler Dashboard */}
          <SchedulerDashboard />

          {/* Quick Stats */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <RecentPosts limit={5} />

            <Card className="shadow-theme-md border-border/50 hover:shadow-theme-lg transition-all animate-fade-in">
              <CardHeader className="pb-4">
                <CardTitle className="font-mono flex items-center space-x-2">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>Scheduled Posts</span>
                </CardTitle>
                <CardDescription className="font-mono">
                  Posts waiting to be published
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-6">
                  <div className="text-3xl font-bold text-muted-foreground font-mono mb-2">0</div>
                  <div className="text-sm text-muted-foreground font-mono">
                    No scheduled posts
                  </div>
                  <div className="mt-3 px-3 py-1 rounded-full status-scheduled text-xs">
                    Coming next!
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-theme-md border-border/50 hover:shadow-theme-lg transition-all animate-fade-in">
              <CardHeader className="pb-4">
                <CardTitle className="font-mono flex items-center space-x-2">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span>Analytics</span>
                </CardTitle>
                <CardDescription className="font-mono">
                  Performance insights
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-6">
                  <div className="text-3xl font-bold text-muted-foreground font-mono mb-2">—</div>
                  <div className="text-sm text-muted-foreground font-mono">
                    Analytics coming soon
                  </div>
                  <div className="mt-3 px-3 py-1 rounded-full status-draft text-xs">
                    Coming in Phase 5!
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}