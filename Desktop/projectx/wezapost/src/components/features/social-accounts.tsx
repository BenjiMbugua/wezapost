"use client"

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SocialAccount, SocialProviderManager } from '@/lib/social-providers'

export function SocialAccountsManager() {
  const { data: session } = useSession()
  const [accounts, setAccounts] = useState<SocialAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState('')
  const socialManager = new SocialProviderManager()

  useEffect(() => {
    if (session?.user?.id) {
      loadAccounts()
    }
  }, [session?.user?.id])

  const loadAccounts = async () => {
    if (!session?.user?.id) return
    
    try {
      setLoading(true)
      const connectedAccounts = await socialManager.getConnectedAccounts(session.user.id)
      setAccounts(connectedAccounts)
    } catch (error) {
      console.error('Failed to load accounts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleConnect = async (platform: SocialAccount['platform']) => {
    if (!session?.user?.id) return
    
    setConnecting(platform)
    
    // TODO: Implement OAuth flow for each platform
    // This is a placeholder - in reality, you would:
    // 1. Redirect to platform OAuth
    // 2. Handle callback
    // 3. Store tokens in database
    
    setTimeout(() => {
      setConnecting('')
      // Mock connection for demo
      const mockAccount: SocialAccount = {
        id: `mock-${platform}-${Date.now()}`,
        platform,
        username: `user_${platform}`,
        display_name: `Demo ${socialManager.getPlatformInfo(platform).name} Account`,
        is_active: true,
        settings: {
          auto_post: true,
          default_visibility: 'public',
          custom_hashtags: [],
        }
      }
      setAccounts(prev => [...prev, mockAccount])
    }, 2000)
  }

  const handleDisconnect = async (accountId: string) => {
    if (!session?.user?.id) return
    
    const success = await socialManager.disconnectAccount(session.user.id, accountId)
    if (success) {
      setAccounts(prev => prev.filter(account => account.id !== accountId))
    }
  }

  const availablePlatforms = ['twitter', 'linkedin', 'facebook', 'instagram', 'tiktok'] as const
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

              return (
                <Button
                  key={platform}
                  variant={isConnected ? "secondary" : "outline"}
                  className="h-auto p-4 flex flex-col items-center space-y-2"
                  onClick={() => !isConnected && handleConnect(platform)}
                  disabled={isConnected || isConnecting}
                >
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