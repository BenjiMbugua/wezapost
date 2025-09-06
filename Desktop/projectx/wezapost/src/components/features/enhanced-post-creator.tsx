"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PostCreator } from './post-creator'
import { CuratedPosts } from './curated-posts'
import { CuratedPost } from '@/types/curated-posts'

export function EnhancedPostCreator() {
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState('create')
  const [selectedCuratedPost, setSelectedCuratedPost] = useState<CuratedPost | null>(null)

  const handleSelectCuratedPost = (post: CuratedPost) => {
    setSelectedCuratedPost(post)
    setActiveTab('create') // Switch to create tab to edit/post the curated content
  }

  if (!session?.user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Post Creator</CardTitle>
          <CardDescription>Please sign in to create and manage posts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <div className="mb-2">🔐</div>
            <p>Authentication required</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Content Management</CardTitle>
          <CardDescription>
            Create new posts or manage content curated by your automated workflows
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="create">
                📝 Create Post
                {selectedCuratedPost && (
                  <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                    Curated
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="curated">
                🤖 Curated Posts
              </TabsTrigger>
              <TabsTrigger value="webhooks">
                🔗 n8n Integration
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="create" className="mt-6">
              <PostCreator 
                prefillData={selectedCuratedPost ? {
                  content: selectedCuratedPost.content,
                  hashtags: selectedCuratedPost.hashtags,
                  images: selectedCuratedPost.images,
                  links: selectedCuratedPost.links,
                  platforms: selectedCuratedPost.platforms,
                  curatedPostId: selectedCuratedPost.id // Pass the curated post ID
                } : undefined}
                onPostCreated={() => setSelectedCuratedPost(null)}
              />
            </TabsContent>
            
            <TabsContent value="curated" className="mt-6">
              <CuratedPosts onSelectPost={handleSelectCuratedPost} />
            </TabsContent>
            
            <TabsContent value="webhooks" className="mt-6">
              <N8nIntegrationGuide />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

// N8n Integration Guide Component
function N8nIntegrationGuide() {
  const { data: session } = useSession()
  const [webhookUrl, setWebhookUrl] = useState('')
  const [testPayload, setTestPayload] = useState('')

  useEffect(() => {
    // Generate webhook URL
    const baseUrl = window.location.origin
    setWebhookUrl(`${baseUrl}/api/webhooks/n8n/curated-posts`)
    
    // Generate test payload
    setTestPayload(JSON.stringify({
      content: "🚀 Exciting news! We've just launched our new AI-powered feature that helps streamline your workflow. Check out the amazing benefits and start saving time today! #AI #ProductLaunch #Innovation #Productivity",
      hashtags: ["#AI", "#ProductLaunch", "#Innovation", "#Productivity", "#TechNews"],
      images: [
        {
          url: "https://example.com/launch-image.jpg",
          alt_text: "Product launch announcement",
          caption: "Our new AI feature in action"
        }
      ],
      links: [
        {
          url: "https://example.com/blog/ai-feature-launch",
          title: "Introducing Our Revolutionary AI Feature",
          description: "Learn how our new AI-powered tools can transform your daily workflow"
        }
      ],
      platforms: ["twitter", "linkedin"],
      metadata: {
        source_url: "https://example.com/source-article",
        topics: ["artificial intelligence", "product launch", "innovation"],
        content_type: "mixed",
        priority: "high"
      },
      scheduling: {
        suggested_time: "2024-01-15T14:00:00Z",
        optimal_platforms: ["twitter", "linkedin"]
      },
      workflow_id: "n8n_content_curator_v1",
      source_type: "n8n"
    }, null, 2))
  }, [])

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('Copied to clipboard!')
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>n8n Webhook Integration</CardTitle>
          <CardDescription>
            Connect your n8n workflows to automatically curate and queue posts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Webhook URL */}
          <div>
            <h4 className="font-medium mb-2">Webhook Endpoint</h4>
            <div className="flex items-center space-x-2">
              <code className="flex-1 p-2 bg-gray-100 rounded text-sm font-mono">
                {webhookUrl}
              </code>
              <button
                onClick={() => copyToClipboard(webhookUrl)}
                className="px-3 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
              >
                📋 Copy
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Use this URL as your n8n webhook destination
            </p>
          </div>

          {/* Authentication */}
          <div>
            <h4 className="font-medium mb-2">Authentication</h4>
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Important:</strong> Make sure your n8n workflow includes authentication.
                The webhook endpoint requires a valid session. Consider using API keys for production.
              </p>
            </div>
          </div>

          {/* Method and Headers */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">HTTP Method</h4>
              <code className="block p-2 bg-gray-100 rounded text-sm">POST</code>
            </div>
            <div>
              <h4 className="font-medium mb-2">Content-Type</h4>
              <code className="block p-2 bg-gray-100 rounded text-sm">application/json</code>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Example Payload</CardTitle>
          <CardDescription>
            Use this structure when sending curated content from n8n
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <pre className="text-xs bg-gray-50 p-4 rounded-lg overflow-auto max-h-96 font-mono">
              {testPayload}
            </pre>
            <button
              onClick={() => copyToClipboard(testPayload)}
              className="absolute top-2 right-2 px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
            >
              📋
            </button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>n8n Workflow Setup</CardTitle>
          <CardDescription>
            Step-by-step guide to configure your content curation workflow
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
              <div>
                <h5 className="font-medium">Content Source</h5>
                <p className="text-sm text-gray-600">Configure your content sources (RSS feeds, social media monitoring, news APIs, etc.)</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
              <div>
                <h5 className="font-medium">Content Processing</h5>
                <p className="text-sm text-gray-600">Add processing nodes to extract key information, generate hashtags, analyze sentiment, etc.</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
              <div>
                <h5 className="font-medium">Content Filtering</h5>
                <p className="text-sm text-gray-600">Apply filters based on relevance, quality scores, keyword matching, etc.</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">4</span>
              <div>
                <h5 className="font-medium">Webhook Node</h5>
                <p className="text-sm text-gray-600">Add an HTTP Request node pointing to the webhook URL above with the structured payload</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">5</span>
              <div>
                <h5 className="font-medium">Review & Approve</h5>
                <p className="text-sm text-gray-600">Curated posts will appear in the "Curated Posts" tab for review and editing before publishing</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Test Integration</CardTitle>
          <CardDescription>
            Test your n8n integration with a sample request
          </CardDescription>
        </CardHeader>
        <CardContent>
          <button
            onClick={async () => {
              try {
                const response = await fetch('/api/webhooks/n8n/curated-posts', {
                  method: 'POST',
                  headers: { 
                    'Content-Type': 'application/json',
                    'x-api-key': 'wezapost_n8n_secure_key_2024'
                  },
                  body: testPayload
                })
                
                if (response.ok) {
                  alert('✅ Test successful! Check the Curated Posts tab.')
                } else {
                  const error = await response.text()
                  alert(`❌ Test failed: ${error}`)
                }
              } catch (error) {
                alert(`❌ Test failed: ${error}`)
              }
            }}
            className="w-full py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            🧪 Send Test Payload
          </button>
          <p className="text-xs text-gray-500 mt-2 text-center">
            This will create a sample curated post for testing
          </p>
        </CardContent>
      </Card>
    </div>
  )
}