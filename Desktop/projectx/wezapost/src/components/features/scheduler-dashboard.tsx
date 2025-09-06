"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface SchedulerStatus {
  isRunning: boolean
  activeJobs: string[]
  jobCount: number
}

export function SchedulerDashboard() {
  const { data: session } = useSession()
  const [status, setStatus] = useState<SchedulerStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    if (session?.user) {
      loadStatus()
      
      // Refresh status every 30 seconds
      const interval = setInterval(loadStatus, 30000)
      return () => clearInterval(interval)
    }
  }, [session?.user])

  const loadStatus = async () => {
    try {
      const response = await fetch('/api/scheduler')
      
      if (!response.ok) {
        console.log('Scheduler API not available, skipping status update')
        return
      }
      
      const result = await response.json()
      
      if (result.success) {
        setStatus(result.data)
      }
    } catch (error) {
      console.log('Scheduler service not available (this is normal for basic functionality):', error.message)
      // Set a default status so UI doesn't break
      setStatus({
        isRunning: false,
        activeJobs: [],
        jobCount: 0
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (action: 'start' | 'stop') => {
    try {
      setActionLoading(true)
      
      const response = await fetch('/api/scheduler', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action })
      })
      
      const result = await response.json()
      
      if (result.success) {
        await loadStatus() // Reload status
      } else {
        console.error('Scheduler action failed:', result.error)
      }
    } catch (error) {
      console.error('Error performing scheduler action:', error)
    } finally {
      setActionLoading(false)
    }
  }

  if (!session?.user) {
    return null
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Scheduler Status</CardTitle>
          <CardDescription>Loading scheduler information...</CardDescription>
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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Scheduler Status</CardTitle>
            <CardDescription>
              Background job processor for scheduled posts
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant={status?.isRunning ? 'default' : 'secondary'}>
              {status?.isRunning ? 'Running' : 'Stopped'}
            </Badge>
            {status?.isRunning ? (
              <Button
                variant="outline"
                onClick={() => handleAction('stop')}
                disabled={actionLoading}
                className="text-sm"
              >
                {actionLoading ? 'Stopping...' : 'Stop'}
              </Button>
            ) : (
              <Button
                onClick={() => handleAction('start')}
                disabled={actionLoading}
                className="text-sm"
              >
                {actionLoading ? 'Starting...' : 'Start'}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <div className="text-sm font-medium font-mono">Status</div>
            <div className={`flex items-center space-x-2 ${
              status?.isRunning ? 'text-green-600' : 'text-gray-600'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                status?.isRunning ? 'bg-green-600' : 'bg-gray-400'
              }`} />
              <span className="text-sm font-mono">
                {status?.isRunning ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="text-sm font-medium font-mono">Active Jobs</div>
            <div className="text-2xl font-bold font-mono">
              {status?.jobCount || 0}
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="text-sm font-medium font-mono">Last Updated</div>
            <div className="text-sm font-mono text-muted-foreground">
              {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>

        {status?.activeJobs && status.activeJobs.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <div className="text-sm font-medium font-mono mb-2">Active Jobs:</div>
            <div className="space-y-1">
              {status.activeJobs.map((jobId, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div className="w-1 h-1 rounded-full bg-green-500" />
                  <span className="text-xs font-mono text-muted-foreground">
                    {jobId}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4 pt-4 border-t">
          <div className="text-xs text-muted-foreground font-mono">
            The scheduler checks for due posts every minute and processes them automatically.
            {!status?.isRunning && ' Start the scheduler to enable automatic posting.'}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}