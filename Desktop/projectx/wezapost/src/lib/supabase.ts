import { createClient } from '@supabase/supabase-js'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Client-side Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Client component client
export const createSupabaseClientComponentClient = () => 
  createClientComponentClient()

// Types for database
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          created_at: string
          email: string
          full_name: string | null
          avatar_url: string | null
          plan: 'free' | 'pro' | 'enterprise'
          usage_limits: {
            posts_per_month: number
            social_accounts: number
            ai_generations: number
          }
        }
        Insert: {
          id: string
          created_at?: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          plan?: 'free' | 'pro' | 'enterprise'
          usage_limits?: {
            posts_per_month: number
            social_accounts: number
            ai_generations: number
          }
        }
        Update: {
          id?: string
          created_at?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          plan?: 'free' | 'pro' | 'enterprise'
          usage_limits?: {
            posts_per_month: number
            social_accounts: number
            ai_generations: number
          }
        }
      }
      social_accounts: {
        Row: {
          id: string
          created_at: string
          user_id: string
          platform: 'twitter' | 'linkedin' | 'facebook' | 'instagram' | 'tiktok'
          platform_user_id: string
          username: string
          display_name: string
          avatar_url: string | null
          access_token: string
          refresh_token: string | null
          expires_at: string | null
          is_active: boolean
          settings: {
            auto_post: boolean
            default_visibility: string
            custom_hashtags: string[]
          }
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          platform: 'twitter' | 'linkedin' | 'facebook' | 'instagram' | 'tiktok'
          platform_user_id: string
          username: string
          display_name: string
          avatar_url?: string | null
          access_token: string
          refresh_token?: string | null
          expires_at?: string | null
          is_active?: boolean
          settings?: {
            auto_post: boolean
            default_visibility: string
            custom_hashtags: string[]
          }
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          platform?: 'twitter' | 'linkedin' | 'facebook' | 'instagram' | 'tiktok'
          platform_user_id?: string
          username?: string
          display_name?: string
          avatar_url?: string | null
          access_token?: string
          refresh_token?: string | null
          expires_at?: string | null
          is_active?: boolean
          settings?: {
            auto_post: boolean
            default_visibility: string
            custom_hashtags: string[]
          }
        }
      }
      posts: {
        Row: {
          id: string
          created_at: string
          user_id: string
          title: string | null
          content: string
          media_urls: string[]
          scheduled_for: string | null
          status: 'draft' | 'scheduled' | 'published' | 'failed'
          platforms: string[]
          platform_posts: {
            platform: string
            post_id: string | null
            status: 'pending' | 'published' | 'failed'
            error_message: string | null
            published_at: string | null
          }[]
          ai_generated: boolean
          ai_prompt: string | null
          analytics: {
            views: number
            likes: number
            shares: number
            comments: number
            clicks: number
          }
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          title?: string | null
          content: string
          media_urls?: string[]
          scheduled_for?: string | null
          status?: 'draft' | 'scheduled' | 'published' | 'failed'
          platforms: string[]
          platform_posts?: {
            platform: string
            post_id: string | null
            status: 'pending' | 'published' | 'failed'
            error_message: string | null
            published_at: string | null
          }[]
          ai_generated?: boolean
          ai_prompt?: string | null
          analytics?: {
            views: number
            likes: number
            shares: number
            comments: number
            clicks: number
          }
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          title?: string | null
          content?: string
          media_urls?: string[]
          scheduled_for?: string | null
          status?: 'draft' | 'scheduled' | 'published' | 'failed'
          platforms?: string[]
          platform_posts?: {
            platform: string
            post_id: string | null
            status: 'pending' | 'published' | 'failed'
            error_message: string | null
            published_at: string | null
          }[]
          ai_generated?: boolean
          ai_prompt?: string | null
          analytics?: {
            views: number
            likes: number
            shares: number
            comments: number
            clicks: number
          }
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}