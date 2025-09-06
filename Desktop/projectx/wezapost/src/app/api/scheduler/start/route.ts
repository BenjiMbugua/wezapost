import { NextRequest, NextResponse } from 'next/server'
import { postScheduler } from '@/lib/scheduler'

export async function POST(request: NextRequest) {
  try {
    postScheduler.start()
    
    return NextResponse.json({
      success: true,
      message: 'Post scheduler started successfully',
      status: postScheduler.getStatus()
    })
  } catch (error) {
    console.error('Error starting scheduler:', error)
    return NextResponse.json(
      { error: 'Failed to start scheduler' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const status = postScheduler.getStatus()
    
    return NextResponse.json({
      success: true,
      status
    })
  } catch (error) {
    console.error('Error getting scheduler status:', error)
    return NextResponse.json(
      { error: 'Failed to get scheduler status' },
      { status: 500 }
    )
  }
}