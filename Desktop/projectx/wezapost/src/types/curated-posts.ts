export interface CuratedPost {
  id: string
  title?: string
  content: string
  hashtags: string[]
  images: CuratedImage[]
  links: CuratedLink[]
  platforms: string[]
  source: {
    type: 'n8n' | 'manual' | 'ai'
    workflow_id?: string
    source_url?: string
    curated_at: string
  }
  status: 'draft' | 'reviewed' | 'approved' | 'scheduled' | 'published' | 'rejected'
  metadata: {
    character_count: number
    estimated_engagement: number
    content_type: 'text' | 'image' | 'video' | 'link' | 'mixed'
    topics: string[]
    sentiment: 'positive' | 'neutral' | 'negative'
  }
  scheduling: {
    suggested_time?: string
    optimal_platforms?: string[]
    priority: 'low' | 'medium' | 'high' | 'urgent'
  }
  created_at: string
  updated_at: string
  reviewed_by?: string
  reviewed_at?: string
  scheduled_for?: string
  published_at?: string
  analytics?: {
    impressions?: number
    engagements?: number
    clicks?: number
    shares?: number
  }
}

export interface CuratedImage {
  id: string
  url: string
  alt_text?: string
  width?: number
  height?: number
  file_size?: number
  format?: string
  caption?: string
  source_url?: string
  is_primary?: boolean
}

export interface CuratedLink {
  id: string
  url: string
  title?: string
  description?: string
  image?: string
  domain: string
  is_shortened?: boolean
  original_url?: string
  preview_data?: {
    title: string
    description: string
    image: string
    site_name: string
    type: string
  }
}

export interface CuratedPostFilters {
  status?: CuratedPost['status'][]
  platforms?: string[]
  content_type?: CuratedPost['metadata']['content_type'][]
  priority?: CuratedPost['scheduling']['priority'][]
  source_type?: CuratedPost['source']['type'][]
  date_range?: {
    start: string
    end: string
  }
  topics?: string[]
  has_images?: boolean
  has_links?: boolean
  search_query?: string
}

export interface CuratedPostStats {
  total: number
  by_status: Record<CuratedPost['status'], number>
  by_platform: Record<string, number>
  by_content_type: Record<CuratedPost['metadata']['content_type'], number>
  recent_activity: {
    new_drafts: number
    pending_review: number
    scheduled_today: number
    published_today: number
  }
}

// N8N Webhook payload structure
export interface N8nCuratedPostPayload {
  content: string
  hashtags?: string[] | string // Can be array or comma-separated string
  images?: Array<{
    url: string
    alt_text?: string
    caption?: string
  }>
  links?: Array<{
    url: string
    title?: string
    description?: string
  }>
  platforms?: string[] | string // Can be array or comma-separated string
  metadata?: {
    source_url?: string
    topics?: string[]
    content_type?: string
    priority?: string
  }
  scheduling?: {
    suggested_time?: string
    optimal_platforms?: string[]
  }
  workflow_id?: string
  source_type?: string
}