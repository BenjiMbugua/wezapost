import { createSupabaseClientComponentClient } from '@/lib/supabase'
import type { SupabaseClient } from '@supabase/supabase-js'

export interface SocialAccount {
  id: string
  platform: 'twitter' | 'linkedin' | 'facebook' | 'instagram' | 'tiktok' | 'youtube'
  username: string
  display_name: string
  avatar_url?: string
  is_active: boolean
  settings: {
    auto_post: boolean
    default_visibility: string
    custom_hashtags: string[]
  }
}

export interface ConnectAccountData {
  platform: 'twitter' | 'linkedin' | 'facebook' | 'instagram' | 'tiktok' | 'youtube'
  platform_user_id: string
  username: string
  display_name: string
  avatar_url?: string
  access_token: string
  refresh_token?: string
  expires_at?: string
}

export class SocialProviderManager {
  private supabase: SupabaseClient
  
  constructor(customSupabaseClient?: SupabaseClient) {
    this.supabase = customSupabaseClient || createSupabaseClientComponentClient()
  }

  async connectAccount(userId: string, accountData: ConnectAccountData): Promise<SocialAccount | null> {
    try {
      console.log(`Connecting account for user: ${userId}`)
      
      // Convert non-UUID user ID to UUID format for database compatibility
      let dbUserId = userId
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)
      
      if (!isUUID) {
        // Create a consistent UUID from the user ID using the same method as auth callbacks
        const crypto = await import('crypto')
        const hash = crypto.createHash('sha1').update(`oauth-${userId}`).digest('hex')
        dbUserId = [
          hash.substring(0, 8),
          hash.substring(8, 12),
          hash.substring(12, 16),
          hash.substring(16, 20),
          hash.substring(20, 32)
        ].join('-')
        console.log(`Converted user ID ${userId} to UUID ${dbUserId} for database`)
      }
      
      const newAccount: SocialAccount = {
        id: `real-${accountData.platform}-${accountData.platform_user_id}`,
        platform: accountData.platform,
        username: accountData.username,
        display_name: accountData.display_name,
        avatar_url: accountData.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(accountData.display_name)}`,
        is_active: true,
        settings: {
          auto_post: true,
          default_visibility: 'public',
          custom_hashtags: [`#${accountData.platform}`],
        },
      }

      // Add additional properties for localStorage storage (use original userId for localStorage compatibility)
      const accountWithMeta = {
        ...newAccount,
        user_id: userId,
        access_token: accountData.access_token,
        refresh_token: accountData.refresh_token,
        expires_at: accountData.expires_at,
        real_oauth: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      // Try to save to Supabase database first (use dbUserId for database operations)
      try {
        console.log('Attempting to save account to database...')
        const { data, error } = await this.supabase
          .from('social_accounts')
          .upsert({
            user_id: dbUserId,
            platform: accountData.platform,
            platform_user_id: accountData.platform_user_id,
            username: accountData.username,
            display_name: accountData.display_name,
            avatar_url: accountData.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(accountData.display_name)}`,
            access_token: accountData.access_token,
            refresh_token: accountData.refresh_token || null,
            expires_at: accountData.expires_at ? new Date(accountData.expires_at).toISOString() : null,
            is_active: true,
            settings: {
              auto_post: true,
              default_visibility: 'public',
              custom_hashtags: [`#${accountData.platform}`]
            }
          }, { 
            onConflict: 'user_id,platform,platform_user_id',
            ignoreDuplicates: false 
          })
          .select()
          .single()

        if (!error && data) {
          console.log(`${accountData.platform} account saved to database for user ${userId} (UUID: ${dbUserId})`)
          return {
            id: data.id,
            platform: data.platform,
            username: data.username,
            display_name: data.display_name,
            avatar_url: data.avatar_url,
            is_active: data.is_active,
            settings: data.settings
          }
        } else {
          console.log('Database save failed, falling back to localStorage:', error?.message)
        }
      } catch (dbError) {
        console.log('Database error, falling back to localStorage:', dbError)
      }

      // Fallback to localStorage if database fails
      try {
        // Try to use localStorage if available
        if (typeof localStorage !== 'undefined') {
          const savedAccounts = localStorage.getItem('wezapost-demo-accounts')
          let accounts = []
          
          if (savedAccounts) {
            accounts = JSON.parse(savedAccounts)
            // Remove any existing account for this platform and user
            accounts = accounts.filter((acc: any) => 
              !(acc.platform === accountData.platform && acc.user_id === userId)
            )
          }
          
          accounts.push(accountWithMeta)
          localStorage.setItem('wezapost-demo-accounts', JSON.stringify(accounts))
          console.log('Saved account to localStorage:', accountWithMeta)
        } else {
          console.log('localStorage not available, account saved in memory only')
        }
      } catch (storageError) {
        console.warn('Could not save to localStorage:', storageError)
      }

      return newAccount
    } catch (error) {
      console.error('Failed to connect social account:', error)
      return null
    }
  }


  async getConnectedAccounts(userId: string): Promise<SocialAccount[]> {
    try {
      console.log('Getting connected accounts for user:', userId)
      
      // Convert non-UUID user ID to UUID format for database compatibility
      let dbUserId = userId
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)
      
      if (!isUUID) {
        // Create a consistent UUID from the user ID using the same method as auth callbacks
        const crypto = await import('crypto')
        const hash = crypto.createHash('sha1').update(`oauth-${userId}`).digest('hex')
        dbUserId = [
          hash.substring(0, 8),
          hash.substring(8, 12),
          hash.substring(12, 16),
          hash.substring(16, 20),
          hash.substring(20, 32)
        ].join('-')
        console.log(`Converted user ID ${userId} to UUID ${dbUserId} for database query`)
      }
      
      // Try to get accounts from Supabase database
      const { data: dbAccounts, error } = await this.supabase
        .from('social_accounts')
        .select('*')
        .eq('user_id', dbUserId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
      
      if (error) {
        console.log('Database error, falling back to localStorage:', error.message)
        
        // Fallback to localStorage for demo/development
        let accounts = []
        if (typeof window !== 'undefined') {
          const savedAccounts = localStorage.getItem('wezapost-demo-accounts')
          if (savedAccounts) {
            const allAccounts = JSON.parse(savedAccounts)
            // Filter for accounts belonging to this user (use original userId for localStorage)
            accounts = allAccounts.filter((acc: any) => 
              acc.user_id === userId && acc.real_oauth === true
            )
          }
        }
        return accounts
      }
      
      // Transform database records to SocialAccount interface
      const accounts = dbAccounts.map(account => ({
        id: account.id,
        platform: account.platform,
        username: account.username,
        display_name: account.display_name,
        avatar_url: account.avatar_url,
        is_active: account.is_active,
        settings: account.settings || {
          auto_post: true,
          default_visibility: 'public',
          custom_hashtags: []
        }
      }))
      
      console.log(`Found ${accounts.length} connected accounts in database`)
      return accounts
      
    } catch (error) {
      console.error('Failed to fetch connected accounts:', error)
      return []
    }
  }

  async disconnectAccount(userId: string, accountId: string): Promise<boolean> {
    try {
      // Convert non-UUID user ID to UUID format for database compatibility
      let dbUserId = userId
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)
      
      if (!isUUID) {
        // Create a consistent UUID from the user ID using the same method as auth callbacks
        const crypto = await import('crypto')
        const hash = crypto.createHash('sha1').update(`oauth-${userId}`).digest('hex')
        dbUserId = [
          hash.substring(0, 8),
          hash.substring(8, 12),
          hash.substring(12, 16),
          hash.substring(16, 20),
          hash.substring(20, 32)
        ].join('-')
        console.log(`Converted user ID ${userId} to UUID ${dbUserId} for disconnect operation`)
      }

      const { error } = await this.supabase
        .from('social_accounts')
        .update({ is_active: false })
        .eq('id', accountId)
        .eq('user_id', dbUserId)

      if (error) {
        console.error('Error disconnecting account:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Failed to disconnect account:', error)
      return false
    }
  }

  async updateAccountSettings(
    userId: string, 
    accountId: string, 
    settings: Partial<SocialAccount['settings']>
  ): Promise<boolean> {
    try {
      // Convert non-UUID user ID to UUID format for database compatibility
      let dbUserId = userId
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)
      
      if (!isUUID) {
        // Create a consistent UUID from the user ID using the same method as auth callbacks
        const crypto = await import('crypto')
        const hash = crypto.createHash('sha1').update(`oauth-${userId}`).digest('hex')
        dbUserId = [
          hash.substring(0, 8),
          hash.substring(8, 12),
          hash.substring(12, 16),
          hash.substring(16, 20),
          hash.substring(20, 32)
        ].join('-')
        console.log(`Converted user ID ${userId} to UUID ${dbUserId} for settings update`)
      }

      const { error } = await this.supabase
        .from('social_accounts')
        .update({ settings })
        .eq('id', accountId)
        .eq('user_id', dbUserId)

      if (error) {
        console.error('Error updating account settings:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Failed to update account settings:', error)
      return false
    }
  }

  getPlatformInfo(platform: SocialAccount['platform']) {
    const platforms = {
      twitter: {
        name: 'Twitter/X',
        color: 'bg-black text-white',
        icon: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z',
      },
      linkedin: {
        name: 'LinkedIn',
        color: 'bg-blue-600 text-white',
        icon: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z',
      },
      facebook: {
        name: 'Facebook',
        color: 'bg-blue-500 text-white',
        icon: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z',
      },
      instagram: {
        name: 'Instagram',
        color: 'bg-gradient-to-r from-purple-500 via-red-500 to-yellow-500 text-white',
        icon: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z',
      },
      tiktok: {
        name: 'TikTok',
        color: 'bg-black text-white',
        icon: 'M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-.88-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z',
      },
      youtube: {
        name: 'YouTube',
        color: 'bg-red-600 text-white',
        icon: 'M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z',
      },
    }

    return platforms[platform] || platforms.twitter
  }
}