"use client"

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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

      <main className="max-w-7xl mx-auto px-6 sm:px-8 py-12">
        <div className="space-y-12">
          {/* Hero Section */}
          <section className="text-center py-8">
            <h1 className="text-4xl font-bold tracking-tight mb-4 animate-slide-up">
              <span className="text-gradient-primary">Dashboard</span>
            </h1>
            <p className="text-lg text-muted-foreground font-mono max-w-2xl mx-auto animate-fade-in">
              {isDemoMode 
                ? 'Manage your social media presence in demo mode'
                : 'Manage your social media presence across all platforms'
              }
            </p>
          </section>

          {/* Welcome Section */}
          <Card className="glass border-border/30 shadow-theme-xl hover:shadow-theme-2xl transition-all theme-transition animate-scale-in">
            <CardContent className="p-8">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold font-mono mb-2">
                    {isDemoMode ? 'Welcome to WezaPost Demo!' : 'Welcome Back!'}
                  </h2>
                  <p className="text-muted-foreground font-mono">
                    {isDemoMode 
                      ? 'Exploring WezaPost features in demo mode'
                      : 'You&apos;re ready to manage your social media'
                    }
                  </p>
                </div>
                <div className={`px-4 py-2 rounded-2xl text-sm font-mono ${isDemoMode ? 'status-warning' : 'status-published'}`}>
                  {isDemoMode ? 'Demo Mode' : 'Authenticated'}
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold font-mono text-foreground">Account Details</h3>
                  <div className="space-y-3 text-sm font-mono">
                    <div className="flex items-center justify-between p-3 rounded-lg glass-dark">
                      <span className="text-muted-foreground">Email</span> 
                      <span className="text-foreground">{session?.user?.email || 'demo@wezapost.com'}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg glass-dark">
                      <span className="text-muted-foreground">Name</span> 
                      <span className="text-foreground">{session?.user?.name || 'Demo User'}</span>
                    </div>
                  </div>
                </div>
                
                {isDemoMode && (
                  <div className="glass-dark rounded-xl p-6 border border-border/20 animate-slide-up">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-semibold font-mono mb-1 text-foreground">Demo Mode Active</h4>
                        <p className="text-sm text-muted-foreground font-mono leading-relaxed">
                          To use real functionality, sign in with OAuth providers configured in your environment.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Social Accounts Management */}
          <section className="animate-fade-in">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-3 font-mono">Connected Accounts</h2>
              <p className="text-muted-foreground font-mono">
                Manage your social media accounts and connections
              </p>
            </div>
            <SocialAccountsManager />
          </section>

          {/* Enhanced Post Creator with Curated Posts */}
          <section className="animate-fade-in">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-3 font-mono">Create & Schedule Posts</h2>
              <p className="text-muted-foreground font-mono">
                Compose posts and schedule them across all your platforms
              </p>
            </div>
            <EnhancedPostCreator />
          </section>

          {/* Calendar View */}
          <section className="animate-fade-in">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-3 font-mono">Content Calendar</h2>
              <p className="text-muted-foreground font-mono">
                Visualize your posting schedule across all platforms
              </p>
            </div>
            <CalendarView />
          </section>

          {/* Scheduler Dashboard */}
          <section className="animate-fade-in">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-3 font-mono">Automation & Scheduling</h2>
              <p className="text-muted-foreground font-mono">
                Monitor and control your automated posting system
              </p>
            </div>
            <SchedulerDashboard />
          </section>

          {/* Analytics & Insights */}
          <section className="animate-fade-in">
            <div className="text-center mb-12">
              <h2 className="text-2xl font-bold mb-3 font-mono">Analytics & Insights</h2>
              <p className="text-muted-foreground font-mono">
                Monitor your performance and track your growth across platforms
              </p>
            </div>
            
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              <RecentPosts limit={5} />

              <Card className="glass border-border/30 shadow-theme-lg hover:shadow-theme-xl transition-all group animate-scale-in">
                <CardContent className="p-8">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-3 font-mono">Scheduled Posts</h3>
                  <p className="text-muted-foreground font-mono text-sm mb-6 leading-relaxed">
                    Posts queued for automatic publishing across your connected platforms
                  </p>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-muted-foreground font-mono mb-2">0</div>
                    <div className="px-3 py-1 rounded-full status-scheduled text-xs inline-block">
                      Coming Soon!
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass border-border/30 shadow-theme-lg hover:shadow-theme-xl transition-all group animate-scale-in">
                <CardContent className="p-8">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-3 font-mono">Performance Analytics</h3>
                  <p className="text-muted-foreground font-mono text-sm mb-6 leading-relaxed">
                    Track engagement, reach, and growth metrics across all platforms
                  </p>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-muted-foreground font-mono mb-2">—</div>
                    <div className="px-3 py-1 rounded-full status-draft text-xs inline-block">
                      Phase 5
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}