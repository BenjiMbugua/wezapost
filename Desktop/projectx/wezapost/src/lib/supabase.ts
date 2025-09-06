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
      curated_posts: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          user_id: string
          content: string
          hashtags: string[]
          images: {
            id: string
            url: string
            alt_text?: string
            caption?: string
            is_primary: boolean
          }[]
          links: {
            id: string
            url: string
            title?: string
            description?: string
            domain: string
          }[]
          platforms: string[]
          source: {
            type: string
            workflow_id?: string
            source_url?: string
            curated_at: string
          }
          status: 'draft' | 'reviewed' | 'approved' | 'scheduled' | 'published' | 'rejected'
          metadata: {
            character_count: number
            estimated_engagement: number
            content_type: 'text' | 'image' | 'link' | 'mixed'
            topics: string[]
            sentiment: 'positive' | 'negative' | 'neutral'
          }
          scheduling: {
            suggested_time?: string
            optimal_platforms?: string[]
            priority: 'low' | 'medium' | 'high' | 'urgent'
          }
          reviewed_by?: string
          reviewed_at?: string
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id: string
          content: string
          hashtags?: string[]
          images?: {
            id: string
            url: string
            alt_text?: string
            caption?: string
            is_primary: boolean
          }[]
          links?: {
            id: string
            url: string
            title?: string
            description?: string
            domain: string
          }[]
          platforms?: string[]
          source: {
            type: string
            workflow_id?: string
            source_url?: string
            curated_at: string
          }
          status?: 'draft' | 'reviewed' | 'approved' | 'scheduled' | 'published' | 'rejected'
          metadata: {
            character_count: number
            estimated_engagement: number
            content_type: 'text' | 'image' | 'link' | 'mixed'
            topics: string[]
            sentiment: 'positive' | 'negative' | 'neutral'
          }
          scheduling: {
            suggested_time?: string
            optimal_platforms?: string[]
            priority: 'low' | 'medium' | 'high' | 'urgent'
          }
          reviewed_by?: string
          reviewed_at?: string
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id?: string
          content?: string
          hashtags?: string[]
          images?: {
            id: string
            url: string
            alt_text?: string
            caption?: string
            is_primary: boolean
          }[]
          links?: {
            id: string
            url: string
            title?: string
            description?: string
            domain: string
          }[]
          platforms?: string[]
          source?: {
            type: string
            workflow_id?: string
            source_url?: string
            curated_at: string
          }
          status?: 'draft' | 'reviewed' | 'approved' | 'scheduled' | 'published' | 'rejected'
          metadata?: {
            character_count: number
            estimated_engagement: number
            content_type: 'text' | 'image' | 'link' | 'mixed'
            topics: string[]
            sentiment: 'positive' | 'negative' | 'neutral'
          }
          scheduling?: {
            suggested_time?: string
            optimal_platforms?: string[]
            priority: 'low' | 'medium' | 'high' | 'urgent'
          }
          reviewed_by?: string
          reviewed_at?: string
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