"use client"

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ThemeToggle } from '@/components/theme-toggle'
import { SocialAccountsManager } from '@/components/features/social-accounts'
import { PostCreator } from '@/components/features/post-creator'
import { CalendarView } from '@/components/features/calendar-view'
import { SchedulerDashboard } from '@/components/features/scheduler-dashboard'

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/auth/signin')
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

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold font-mono">WezaPost</h1>
              <div className="text-sm text-muted-foreground font-mono">
                Dashboard
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <div className="flex items-center space-x-2">
                {session.user?.image && (
                  <Image 
                    src={session.user.image} 
                    alt="Profile"
                    width={32}
                    height={32}
                    className="w-8 h-8 rounded-full"
                  />
                )}
                <span className="text-sm font-mono">
                  {session.user?.name || session.user?.email}
                </span>
              </div>
              <Button 
                variant="outline" 
                onClick={() => signOut({ callbackUrl: '/' })}
                className="text-sm font-mono"
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Welcome Section */}
          <Card>
            <CardHeader>
              <CardTitle>Welcome Back!</CardTitle>
              <CardDescription>
                You&apos;re now signed in to WezaPost
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm font-mono">
                <div><strong>Email:</strong> {session.user?.email}</div>
                <div><strong>Name:</strong> {session.user?.name}</div>
                <div><strong>Status:</strong> Authenticated</div>
              </div>
            </CardContent>
          </Card>

          {/* Social Accounts Management */}
          <SocialAccountsManager />

          {/* Post Creator */}
          <PostCreator />

          {/* Calendar View */}
          <CalendarView />

          {/* Scheduler Dashboard */}
          <SchedulerDashboard />

          {/* Quick Stats */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Recent Posts</CardTitle>
                <CardDescription>
                  Your latest social media posts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground font-mono">
                  No posts created yet.
                  <br />
                  <span className="text-xs">Coming next!</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Scheduled Posts</CardTitle>
                <CardDescription>
                  Posts waiting to be published
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground font-mono">
                  No scheduled posts.
                  <br />
                  <span className="text-xs">Coming next!</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Analytics</CardTitle>
                <CardDescription>
                  Performance insights
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground font-mono">
                  Analytics coming soon.
                  <br />
                  <span className="text-xs">Coming in Phase 5!</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}