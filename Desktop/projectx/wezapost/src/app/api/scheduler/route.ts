import { NextRequest, NextResponse } from 'next/server'
import { postScheduler } from '@/lib/scheduler'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const status = postScheduler.getStatus()
    
    return NextResponse.json({
      success: true,
      data: status
    })
  } catch (error) {
    console.error('Error getting scheduler status:', error)
    return NextResponse.json(
      { error: 'Failed to get scheduler status' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { action } = await request.json()
    
    switch (action) {
      case 'start':
        postScheduler.start()
        return NextResponse.json({
          success: true,
          message: 'Scheduler started'
        })
        
      case 'stop':
        postScheduler.stop()
        return NextResponse.json({
          success: true,
          message: 'Scheduler stopped'
        })
        
      default:
        return NextResponse.json(
          { error: 'Invalid action. Use "start" or "stop"' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error managing scheduler:', error)
    return NextResponse.json(
      { error: 'Failed to manage scheduler' },
      { status: 500 }
    )
  }
}