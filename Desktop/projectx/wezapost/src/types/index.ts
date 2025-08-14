// User types
export interface User {
  id: string
  email: string
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  user_id: string
  full_name?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

// Social Media Account types
export interface SocialAccount {
  id: string
  user_id: string
  platform: 'twitter' | 'linkedin' | 'instagram' | 'facebook'
  account_name: string
  access_token: string
  refresh_token?: string
  token_expires_at?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

// Post types
export interface Post {
  id: string
  user_id: string
  title?: string
  content: string
  media_urls?: string[]
  platforms: string[]
  scheduled_at?: string
  published_at?: string
  status: 'draft' | 'scheduled' | 'published' | 'failed'
  platform_posts?: Record<string, any>
  created_at: string
  updated_at: string
}

// Media File types
export interface MediaFile {
  id: string
  user_id: string
  file_name: string
  file_path: string
  file_type: 'image' | 'video' | 'ai_generated_video'
  file_size: number
  duration?: number
  width?: number
  height?: number
  alt_text?: string
  tags?: string[]
  ai_generated: boolean
  ai_prompt?: string
  ai_model?: string
  processing_status: 'processing' | 'completed' | 'failed'
  created_at: string
}

// AI Generation Job types
export interface AIGenerationJob {
  id: string
  user_id: string
  job_type: 'video' | 'text' | 'image'
  prompt: string
  parameters: Record<string, any>
  status: 'pending' | 'processing' | 'completed' | 'failed'
  result_media_id?: string
  error_message?: string
  started_at?: string
  completed_at?: string
  created_at: string
}

// Analytics types
export interface PostAnalytics {
  id: string
  post_id: string
  platform: string
  platform_post_id: string
  likes: number
  comments: number
  shares: number
  reach: number
  impressions: number
  recorded_at: string
}

// Template types
export interface ContentTemplate {
  id: string
  user_id: string
  name: string
  content: string
  platforms: string[]
  variables?: Record<string, any>
  created_at: string
}

// API Response types
export interface ApiResponse<T = any> {
  data?: T
  error?: string
  message?: string
}

// Theme types
export type Theme = 'light' | 'dark' | 'system'

// Component prop types
export interface BaseComponentProps {
  className?: string
  children?: React.ReactNode
}