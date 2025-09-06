"use client"

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SocialAccount, SocialProviderManager } from '@/lib/social-providers'
import { SocialSetupWizard } from './social-setup-wizard'
import { SocialCredentialManager } from '@/lib/social-credential-manager'

export function SocialAccountsManager() {
  const { data: session } = useSession()
  const [accounts, setAccounts] = useState<SocialAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState('')
  const [showSetup, setShowSetup] = useState(false)
  const socialManager = new SocialProviderManager()

  useEffect(() => {
    loadAccounts()
  }, [session])

  // Listen for storage changes to reload accounts when new connections are made
  useEffect(() => {
    const handleStorageChange = () => {
      loadAccounts()
    }

    window.addEventListener('storage', handleStorageChange)
    
    // Also listen for URL changes that indicate successful connection
    const checkForNewConnection = () => {
      const urlParams = new URLSearchParams(window.location.search)
      const success = urlParams.get('success')
      const socialConnected = urlParams.get('social_connected')
      
      if (success === 'facebook_connected' || success === 'instagram_connected' || success === 'tiktok_connected' ||
          socialConnected === 'linkedin' || socialConnected === 'youtube') {
        setTimeout(() => loadAccounts(), 500) // Small delay to ensure localStorage is updated
      }
    }
    
    checkForNewConnection()
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

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
        console.log(`🧹 Removing duplicate ${account.platform} account: ${account.display_name || account.username}`)
      }
    })

    // If we removed duplicates, save the cleaned list back to localStorage
    if (uniqueAccounts.length !== accounts.length) {
      localStorage.setItem('wezapost-demo-accounts', JSON.stringify(uniqueAccounts))
      console.log(`✅ Cleaned up ${accounts.length - uniqueAccounts.length} duplicate accounts`)
    }

    return uniqueAccounts
  }

  const loadAccounts = async () => {
    try {
      setLoading(true)
      
      // Always load from localStorage first
      const savedAccounts = localStorage.getItem('wezapost-demo-accounts')
      let localAccounts = savedAccounts ? JSON.parse(savedAccounts) : []
      
      // Clean up any duplicates in localStorage
      localAccounts = removeDuplicateAccounts(localAccounts)
      
      // If user is authenticated, try to load from database and merge
      if (session?.user?.id) {
        try {
          const connectedAccounts = await socialManager.getConnectedAccounts(session.user.id)
          
          // Merge database accounts with localStorage accounts
          // Remove duplicates based on platform, preferring database accounts
          const mergedAccounts = [...connectedAccounts]
          
          // Add localStorage accounts that don't exist in database
          for (const localAccount of localAccounts) {
            const existsInDb = connectedAccounts.some(dbAccount => 
              dbAccount.platform === localAccount.platform && 
              dbAccount.username === localAccount.username
            )
            if (!existsInDb) {
              mergedAccounts.push(localAccount)
            }
          }
          
          setAccounts(mergedAccounts)
        } catch (error) {
          console.log('Database not available, using localStorage only')
          setAccounts(localAccounts)
        }
      } else {
        // Not authenticated, use localStorage only
        setAccounts(localAccounts)
      }
    } catch (error) {
      console.error('Failed to load accounts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleConnect = async (platform: SocialAccount['platform']) => {
    if (!session?.user?.id) {
      // If not authenticated, fall back to demo mode
      return handleDemoConnect(platform)
    }

    setConnecting(platform)
    
    try {
      // Check if user has configured credentials for this platform
      const hasCredentials = SocialCredentialManager.isPlatformConfigured(session.user.id, platform)
      
      if (!hasCredentials && ['twitter', 'linkedin'].includes(platform)) {
        // Show setup wizard if credentials not configured
        setConnecting('')
        setShowSetup(true)
        return
      }
      
      // Check if platform supports real OAuth
      const supportedPlatforms = ['twitter', 'linkedin', 'facebook', 'instagram', 'tiktok', 'youtube']
      
      if (supportedPlatforms.includes(platform)) {
        // Use real OAuth flow with user's credentials
        const response = await fetch(`/api/social/${platform}/connect`)
        const result = await response.json()
        
        if (result.success && result.authUrl) {
          // Redirect to platform OAuth
          window.location.href = result.authUrl
          return
        } else {
          console.log(`${platform} OAuth failed:`, result.message)
          // Fall back to demo mode
          return handleDemoConnect(platform)
        }
      } else {
        // Platform not yet supported or no credentials, use demo mode
        console.log(`${platform} using demo mode`)
        return handleDemoConnect(platform)
      }
    } catch (error) {
      console.error(`Error initiating ${platform} OAuth:`, error)
      // Fall back to demo mode on error
      return handleDemoConnect(platform)
    } finally {
      setConnecting('')
    }
  }

  const handleDemoConnect = async (platform: SocialAccount['platform']) => {
    setConnecting(platform)
    
    try {
      // Simulate OAuth flow delay
      await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000))
      
      // Create mock account for demo
      const mockAccount: SocialAccount = {
        id: `mock-${platform}-${Date.now()}`,
        platform,
        username: `demo_${platform}_user`,
        display_name: `Demo ${socialManager.getPlatformInfo(platform).name} Account`,
        avatar_url: `https://ui-avatars.com/api/?name=${platform}&background=random`,
        is_active: true,
        settings: {
          auto_post: true,
          default_visibility: 'public',
          custom_hashtags: [`#${platform}`, '#socialmedia', '#wezapost'],
        }
      }
      
      // Update local state
      const newAccounts = [...accounts, mockAccount]
      setAccounts(newAccounts)
      
      // Save to localStorage for demo persistence
      localStorage.setItem('wezapost-demo-accounts', JSON.stringify(newAccounts))
      
      console.log(`${platform} demo account connected:`, mockAccount)
    } catch (error) {
      console.error(`Error connecting ${platform} account:`, error)
    } finally {
      setConnecting('')
    }
  }

  const handleDisconnect = async (accountId: string) => {
    // Remove from local state
    const newAccounts = accounts.filter(account => account.id !== accountId)
    setAccounts(newAccounts)
    
    // Update localStorage for demo persistence
    localStorage.setItem('wezapost-demo-accounts', JSON.stringify(newAccounts))
    
    // If user is authenticated, try to disconnect from database
    if (session?.user?.id) {
      try {
        await socialManager.disconnectAccount(session.user.id, accountId)
        console.log('Account also disconnected from database')
      } catch (error) {
        console.log('Database not available, using demo mode only')
      }
    }
  }

  const availablePlatforms = ['twitter', 'linkedin', 'facebook', 'instagram', 'tiktok', 'youtube'] as const
  const connectedPlatforms = new Set(accounts.map(account => account.platform))

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Social Accounts</CardTitle>
          <CardDescription>Loading your connected accounts...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-mono">Loading...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (showSetup) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Set Up Social Media Integration</h2>
          <Button variant="outline" onClick={() => setShowSetup(false)}>
            ← Back to Accounts
          </Button>
        </div>
        <SocialSetupWizard />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <Card className="glass border-border/30 shadow-theme-lg hover:shadow-theme-xl transition-all theme-transition">
        <CardContent className="p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold font-mono mb-2">Connected Accounts</h3>
              <p className="text-muted-foreground font-mono text-sm">
                Your active social media connections
              </p>
            </div>
            <div className="px-3 py-1 rounded-full bg-gradient-secondary text-xs font-mono">
              {accounts.length} Connected
            </div>
          </div>
          
          {accounts.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-2xl bg-gradient-primary/20 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2m-2-4H9m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2h8a2 2 0 002-2V9z" />
                </svg>
              </div>
              <p className="text-muted-foreground font-mono">
                No social accounts connected yet
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {accounts.map((account) => {
                const platformInfo = socialManager.getPlatformInfo(account.platform)
                return (
                  <div
                    key={account.id}
                    className="glass-dark rounded-xl p-4 border border-border/20 hover:border-border/40 transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${platformInfo.color} group-hover:scale-110 transition-transform`}>
                          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                            <path d={platformInfo.icon} />
                          </svg>
                        </div>
                        <div>
                          <div className="font-semibold font-mono text-foreground">{account.display_name}</div>
                          <div className="text-sm text-muted-foreground font-mono">
                            @{account.username}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className={`px-3 py-1 rounded-full text-xs font-mono ${account.is_active ? 'status-published' : 'status-draft'}`}>
                          {account.is_active ? 'Active' : 'Inactive'}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDisconnect(account.id)}
                          className="text-xs font-mono focus-ring hover:shadow-theme-sm transition-all"
                        >
                          Disconnect
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="glass border-border/30 shadow-theme-lg hover:shadow-theme-xl transition-all theme-transition">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <h3 className="text-xl font-bold font-mono mb-2">Connect New Platform</h3>
            <p className="text-muted-foreground font-mono text-sm">
              Expand your reach across more social media platforms
            </p>
          </div>
          
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {availablePlatforms.map((platform) => {
              const platformInfo = socialManager.getPlatformInfo(platform)
              const isConnected = connectedPlatforms.has(platform)
              const isConnecting = connecting === platform
              const supportsRealOAuth = ['twitter', 'linkedin', 'facebook', 'instagram', 'tiktok', 'youtube'].includes(platform)
              const hasOAuthConfigured = supportsRealOAuth && session?.user?.id

              return (
                <Button
                  key={platform}
                  variant={isConnected ? "secondary" : "outline"}
                  className="h-auto p-6 flex flex-col items-center space-y-3 relative glass-dark hover:shadow-theme-md transition-all focus-ring group border-border/30"
                  onClick={() => !isConnected && handleConnect(platform)}
                  disabled={isConnected || isConnecting}
                >
                  {hasOAuthConfigured && (
                    <div className="absolute -top-2 -right-2 w-4 h-4 bg-gradient-primary rounded-full border-2 border-card flex items-center justify-center" 
                         title="Real OAuth Available">
                      <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                  
                  {isConnecting ? (
                    <div className="w-8 h-8 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${platformInfo.color} group-hover:scale-110 transition-transform`}>
                      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                        <path d={platformInfo.icon} />
                      </svg>
                    </div>
                  )}
                  <div className="text-center">
                    <div className="font-semibold text-sm font-mono mb-1">
                      {isConnected ? 'Connected' : isConnecting ? 'Connecting...' : 'Connect'}
                    </div>
                    <div className="text-xs text-muted-foreground font-mono">
                      {platformInfo.name}
                    </div>
                    {hasOAuthConfigured && (
                      <div className="mt-1 px-2 py-1 rounded-full status-published text-xs">
                        Real OAuth
                      </div>
                    )}
                    {supportsRealOAuth && !hasOAuthConfigured && (
                      <div className="mt-1 px-2 py-1 rounded-full status-warning text-xs">
                        Demo Mode
                      </div>
                    )}
                  </div>
                </Button>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}