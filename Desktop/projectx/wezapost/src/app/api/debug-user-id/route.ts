import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    return NextResponse.json({
      session_user: session?.user,
      session_user_id: session?.user?.id,
      session_user_id_type: typeof session?.user?.id,
      session_user_id_length: session?.user?.id?.length,
      full_session: session,
      message: 'This helps debug the user ID format issue with Supabase UUID'
    })
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message,
      message: 'Error getting session data'
    }, { status: 500 })
  }
}