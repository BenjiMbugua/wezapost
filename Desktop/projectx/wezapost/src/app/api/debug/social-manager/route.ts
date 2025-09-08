import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { SocialProviderManager } from '@/lib/social-providers'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const socialManager = new SocialProviderManager()
    const accounts = await socialManager.getConnectedAccounts(session.user.id)

    return NextResponse.json({
      sessionUserId: session.user.id,
      accountsCount: accounts.length,
      accounts: accounts.map(acc => ({
        id: acc.id,
        platform: acc.platform,
        username: acc.username,
        display_name: acc.display_name,
        is_active: acc.is_active
      }))
    })

  } catch (error: any) {
    console.error('Social Manager debug error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}