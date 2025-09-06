"use client"

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, CheckCircle, ExternalLink, Copy } from 'lucide-react'

interface SocialPlatformConfig {
  platform: string
  name: string
  color: string
  icon: string
  devPortalUrl: string
  callbackUrl: string
  setupSteps: string[]
  requiredScopes: string[]
}

const platformConfigs: SocialPlatformConfig[] = [
  {
    platform: 'twitter',
    name: 'Twitter',
    color: 'bg-black text-white',
    icon: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z',
    devPortalUrl: 'https://developer.twitter.com/en/portal/dashboard',
    callbackUrl: 'http://localhost:3001/api/social/twitter/callback',
    setupSteps: [
      'Create a Twitter Developer account',
      'Create a new App in the developer portal',
      'Set App Type to "Web App"',
      'Set permissions to "Read and Write"',
      'Add the callback URL below'
    ],
    requiredScopes: ['tweet.read', 'tweet.write', 'users.read', 'offline.access']
  },
  {
    platform: 'linkedin',
    name: 'LinkedIn',
    color: 'bg-blue-600 text-white',
    icon: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z',
    devPortalUrl: 'https://www.linkedin.com/developers/apps',
    callbackUrl: 'http://localhost:3001/api/social/linkedin/callback',
    setupSteps: [
      'Go to LinkedIn Developer Portal',
      'Create a new App',
      'Verify your LinkedIn company page',
      'Request Sign In with LinkedIn using OpenID Connect product',
      'Add the callback URL below'
    ],
    requiredScopes: ['openid', 'profile', 'w_member_social']
  }
]

export function SocialSetupWizard() {
  const { data: session } = useSession()
  const [selectedPlatform, setSelectedPlatform] = useState<SocialPlatformConfig | null>(null)
  const [credentials, setCredentials] = useState({ clientId: '', clientSecret: '' })
  const [isSaving, setIsSaving] = useState(false)
  const [savedPlatforms, setSavedPlatforms] = useState<string[]>([])

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const saveCredentials = async () => {
    if (!selectedPlatform || !session?.user?.id) return
    
    setIsSaving(true)
    
    try {
      const response = await fetch('/api/social/configure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: selectedPlatform.platform,
          clientId: credentials.clientId,
          clientSecret: credentials.clientSecret,
          userId: session.user.id
        })
      })
      
      const result = await response.json()
      
      if (response.ok && result.success) {
        // Store credentials using the credential manager
        const { SocialCredentialManager } = await import('@/lib/social-credential-manager')
        
        if (result.credentialData) {
          SocialCredentialManager.saveCredentials(
            session.user.id,
            selectedPlatform.platform,
            result.credentialData.clientId,
            result.credentialData.clientSecret
          )
        }
        
        setSavedPlatforms([...savedPlatforms, selectedPlatform.platform])
        setCredentials({ clientId: '', clientSecret: '' })
        setSelectedPlatform(null)
      } else {
        console.error('Failed to save credentials:', result.error)
      }
    } catch (error) {
      console.error('Failed to save credentials:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const initiateConnection = async (platform: string) => {
    try {
      const response = await fetch(`/api/social/${platform}/connect`)
      const result = await response.json()
      
      if (result.success && result.authUrl) {
        window.location.href = result.authUrl
      }
    } catch (error) {
      console.error('Failed to initiate connection:', error)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Connect Social Media Accounts</CardTitle>
          <CardDescription>
            Set up your social media integrations to start posting content
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!selectedPlatform ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {platformConfigs.map((config) => {
                const isConfigured = savedPlatforms.includes(config.platform)
                
                return (
                  <Card key={config.platform} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${config.color}`}>
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                            <path d={config.icon} />
                          </svg>
                        </div>
                        <div>
                          <h3 className="font-semibold">{config.name}</h3>
                          {isConfigured ? (
                            <Badge variant="outline" className="text-green-600 border-green-600">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Configured
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-orange-600 border-orange-600">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              Setup Required
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        {isConfigured ? (
                          <Button 
                            className="w-full" 
                            onClick={() => initiateConnection(config.platform)}
                          >
                            Connect {config.name} Account
                          </Button>
                        ) : (
                          <Button 
                            variant="outline" 
                            className="w-full"
                            onClick={() => setSelectedPlatform(config)}
                          >
                            Set Up {config.name} Integration
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Set Up {selectedPlatform.name} Integration</h3>
                <Button variant="ghost" onClick={() => setSelectedPlatform(null)}>
                  Back to Platform Selection
                </Button>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h4 className="font-medium mb-2 flex items-center">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Setup Instructions
                </h4>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  {selectedPlatform.setupSteps.map((step, index) => (
                    <li key={index}>{step}</li>
                  ))}
                </ol>
                
                <div className="mt-4 space-y-2">
                  <div>
                    <Label className="text-xs font-medium">Callback URL (copy this exactly):</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      <Input 
                        value={selectedPlatform.callbackUrl} 
                        readOnly 
                        className="text-xs"
                      />
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => copyToClipboard(selectedPlatform.callbackUrl)}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    onClick={() => window.open(selectedPlatform.devPortalUrl, '_blank')}
                    className="w-full"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open {selectedPlatform.name} Developer Portal
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="clientId">Client ID</Label>
                  <Input
                    id="clientId"
                    value={credentials.clientId}
                    onChange={(e) => setCredentials({ ...credentials, clientId: e.target.value })}
                    placeholder="Enter your app's Client ID"
                  />
                </div>
                
                <div>
                  <Label htmlFor="clientSecret">Client Secret</Label>
                  <Input
                    id="clientSecret"
                    type="password"
                    value={credentials.clientSecret}
                    onChange={(e) => setCredentials({ ...credentials, clientSecret: e.target.value })}
                    placeholder="Enter your app's Client Secret"
                  />
                </div>

                <Button 
                  onClick={saveCredentials}
                  disabled={!credentials.clientId || !credentials.clientSecret || isSaving}
                  className="w-full"
                >
                  {isSaving ? 'Saving...' : `Save ${selectedPlatform.name} Configuration`}
                </Button>
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <h4 className="font-medium mb-2">What happens next?</h4>
                <ul className="text-sm space-y-1">
                  <li>• Your credentials are securely stored</li>
                  <li>• You can connect your {selectedPlatform.name} account</li>
                  <li>• Start posting content directly to {selectedPlatform.name}</li>
                  <li>• Schedule posts for automatic publishing</li>
                </ul>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}