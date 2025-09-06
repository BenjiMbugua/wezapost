"use client"

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Connected Accounts</CardTitle>
          <CardDescription>
            Manage your social media accounts for posting
          </CardDescription>
        </CardHeader>
        <CardContent>
          {accounts.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-muted-foreground font-mono">
                No social accounts connected yet
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              {accounts.map((account) => {
                const platformInfo = socialManager.getPlatformInfo(account.platform)
                return (
                  <div
                    key={account.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${platformInfo.color}`}>
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                          <path d={platformInfo.icon} />
                        </svg>
                      </div>
                      <div>
                        <div className="font-medium font-mono">{account.display_name}</div>
                        <div className="text-sm text-muted-foreground font-mono">
                          @{account.username}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={account.is_active ? 'default' : 'secondary'}>
                        {account.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDisconnect(account.id)}
                        className="text-xs"
                      >
                        Disconnect
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Connect New Account</CardTitle>
          <CardDescription>
            Add more social media platforms to expand your reach
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
                  className="h-auto p-4 flex flex-col items-center space-y-2 relative"
                  onClick={() => !isConnected && handleConnect(platform)}
                  disabled={isConnected || isConnecting}
                >
                  {hasOAuthConfigured && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border border-white" 
                         title="Real OAuth Available" />
                  )}
                  
                  {isConnecting ? (
                    <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${platformInfo.color}`}>
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d={platformInfo.icon} />
                      </svg>
                    </div>
                  )}
                  <div className="text-center">
                    <div className="font-medium text-sm">
                      {isConnected ? 'Connected' : isConnecting ? 'Connecting...' : 'Connect'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {platformInfo.name}
                      {hasOAuthConfigured && <div className="text-green-600">Real OAuth</div>}
                      {supportsRealOAuth && !hasOAuthConfigured && <div className="text-orange-600">Demo Mode</div>}
                    </div>
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