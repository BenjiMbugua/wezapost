# Personal Social Media Management Tool - Product Requirements Document (PRD)

## 1. Executive Summary

### Vision
A personal, self-hosted social media management tool for individual content creators to efficiently schedule, repurpose, and analyze content across multiple platforms from a single dashboard.

### Goals
- Eliminate the need for expensive SaaS solutions ($100-500/month)
- Centralize social media workflow in one personal tool
- Automate content repurposing across platforms
- Provide insightful analytics for content performance
- Maintain full data ownership and privacy

### Success Metrics
- Reduce time spent on social media management by 70%
- Increase posting consistency across all platforms
- Improve content engagement through optimization
- Successfully deploy and maintain on personal infrastructure

## 2. Product Overview

### Target User
**Primary**: Individual content creator (yourself) managing multiple social media accounts

### Core Value Proposition
- **Time Efficiency**: Schedule weeks of content in advance
- **Consistency**: Never miss posting opportunities
- **Optimization**: AI-powered content adaptation for each platform
- **Analytics**: Data-driven insights for better engagement
- **Privacy**: Self-hosted solution with complete data control
- **Cost-Effective**: One-time development vs ongoing SaaS fees

### Platform Scope
- **Primary Platforms**: Twitter/X, LinkedIn, Instagram, Facebook
- **Secondary Platforms**: YouTube (future), TikTok (future)
- **Content Types**: Text, Images, Videos, Links, Carousels

## 3. Technical Architecture

### Technology Stack

#### Frontend
- **Framework**: Next.js 14+ (TypeScript)
- **UI Library**: Tailwind CSS + shadcn/ui with custom cyan theme
- **Design System**: OKLCH color space with monospace typography
- **State Management**: Zustand or React Query
- **Charts**: Recharts with themed colors
- **Authentication**: Supabase Auth
- **Theme**: Custom cyan/blue design system with Source Code Pro/Courier New fonts

#### Backend
- **Runtime**: Node.js (TypeScript)
- **Framework**: Express.js or Fastify
- **Database**: Supabase (PostgreSQL)
- **Queue System**: Bull/BullMQ with Redis
- **File Storage**: Supabase Storage
- **Caching**: Redis

#### Infrastructure
- **Hosting**: Coolify (self-hosted)
- **Database**: Supabase Cloud (or self-hosted)
- **File Storage**: Supabase Storage or S3-compatible
- **Domain**: Personal domain with SSL
- **Monitoring**: Built-in health checks

#### External APIs
- **AI Content**: OpenAI API or Claude API for text content optimization
- **AI Video**: Google Cloud Vertex AI with Veo 3 for video generation
- **Social Platforms**: 
  - Twitter API v2 (Basic tier - $100/month)
  - Facebook Graph API (Free)
  - LinkedIn API (Free)
  - Instagram Basic Display API (Free)
- **Media Processing**: FFmpeg for video processing
- **Content Safety**: Google Cloud Vision API for content moderation

## 4. Core Features

### 4.1 Authentication & Account Management

#### Features
- Single sign-on with email/password
- Social media account connection management
- API key/token management interface
- Account status monitoring

#### Technical Requirements
- Supabase Auth integration
- Encrypted storage of social media tokens
- Token refresh automation
- Connection health checks

### 4.2 Content Creation & Management

#### Content Creation Workflow
```
┌─────────────────────────────────────────────────────────┐
│                 Create New Content                      │
│                                                         │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       │
│ │ [📝] Text   │ │ [🎥] Video  │ │ [🖼️] Image  │       │
│ │    Post     │ │   with AI   │ │    Upload   │       │
│ └─────────────┘ └─────────────┘ └─────────────┘       │
├─────────────────────────────────────────────────────────┤
│              AI Video Generation                        │
│                                                         │
│ Prompt: "Create a 30-second video showing..."          │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Style: [Cinematic ▼] Duration: [30s ▼]            │ │
│ │ Aspect: [16:9 ▼] Quality: [High ▼]               │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ [Generate Video] [Processing... ⏳] [Preview 👁️]      │
└─────────────────────────────────────────────────────────┘
```

#### Features
- **Rich Text Editor**: Markdown support, character counting
- **Media Upload**: Images, videos, GIFs with preview
- **AI Video Generation**: Veo 3 integration for text-to-video content
- **AI Content Generation**: Text content optimization and creation
- **Template System**: Reusable content templates
- **Hashtag Manager**: Platform-specific hashtag suggestions
- **Link Shortening**: UTM tracking integration
- **Content Drafts**: Auto-save and version history
- **Video Editor**: Basic trimming, captions, thumbnail selection
- **Content Variations**: Generate multiple versions for A/B testing

#### Technical Requirements
- WYSIWYG editor with platform-specific formatting
- Image/video processing and optimization
- **Veo 3 API integration for video generation**
- **Google Cloud Vertex AI setup for Veo 3 access**
- File upload with drag-and-drop
- Template storage in database
- Auto-save functionality every 30 seconds
- Video transcoding and compression pipeline
- AI content generation with prompt engineering

### 4.3 Content Scheduling

#### Features
- **Calendar View**: Monthly/weekly/daily content calendar
- **Bulk Scheduling**: Upload CSV for mass scheduling
- **Time Zone Support**: Schedule in multiple time zones
- **Optimal Timing**: AI-suggested best posting times
- **Recurring Posts**: Weekly/monthly recurring content
- **Queue Management**: Drag-and-drop reordering

#### Technical Requirements
- Cron job system for automated posting
- Queue management with Redis/Bull
- Timezone conversion and storage
- Calendar component with drag-and-drop
- Retry logic for failed posts
- Post status tracking (scheduled, posted, failed)

### 4.4 AI Content Generation Engine

#### AI Content Dashboard
```
┌─────────────────────────────────────────────────────────┐
│                 AI Generation Queue                     │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 🎥 "Product demo video"        [Processing] [45%]  │ │
│ │ 📝 "LinkedIn post about AI"    [Completed] [✓]    │ │
│ │ 🎥 "Behind the scenes..."      [Queued]    [⏳]   │ │
│ └─────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│                Usage Statistics                         │
│ Videos Generated: 15/50 (monthly limit)                │
│ Processing Time: Avg 8 minutes                         │
│ Success Rate: 94%                                      │
└─────────────────────────────────────────────────────────┘
```

#### Features
- **Text Content Generation**: AI-powered post creation and optimization
- **Video Generation**: Veo 3 integration for text-to-video content creation
- **Platform Optimization**: Auto-adapt content for each platform
- **Character Limit Handling**: Smart truncation and threading
- **Hashtag Optimization**: Platform-specific hashtag strategies
- **Image Resizing**: Auto-resize for platform requirements
- **Cross-Platform Templates**: One content, multiple formats
- **Video Templates**: Pre-built video styles and formats
- **Content Brainstorming**: AI-powered topic and idea generation
- **Brand Voice Consistency**: Maintain consistent tone across content

#### Technical Requirements
- **Google Cloud Vertex AI integration for Veo 3 video generation**
- **OpenAI/Claude API integration for text content**
- Video processing pipeline for Veo 3 outputs
- AI integration for content adaptation
- Image processing pipeline
- Platform-specific formatting rules
- Template engine for content transformation
- Preview generation for each platform
- Video quality optimization and compression
- Prompt engineering for consistent AI outputs

### 4.5 Analytics Dashboard

#### Features
- **Performance Metrics**: Likes, comments, shares, reach
- **Engagement Analytics**: Best performing content types
- **Growth Tracking**: Follower growth over time
- **Platform Comparison**: Performance across platforms
- **Export Reports**: PDF/CSV analytics reports
- **Content Insights**: Top-performing posts analysis

#### Technical Requirements
- Data fetching from social media APIs
- Data aggregation and storage
- Chart visualization components
- Report generation system
- Automated data refresh (daily/hourly)
- Historical data retention

### 4.6 AI-Powered Media Management

#### Features
- **Media Library**: Organized file storage with AI tagging
- **Batch Upload**: Multiple file upload
- **Image Editor**: Basic cropping, filters, text overlay
- **Video Editor**: Trimming, captions, thumbnail generation
- **AI Video Generation**: Create videos from text prompts using Veo 3
- **Video Thumbnails**: Auto-generated video previews
- **Stock Integration**: Unsplash/Pexels integration
- **AI Content Suggestions**: Smart media recommendations
- **Usage Tracking**: Where media files are used
- **Video Transcription**: Automatic caption generation
- **Content Moderation**: AI-powered content safety checks

#### Technical Requirements
- File storage with Supabase Storage
- **Google Cloud Vertex AI setup for Veo 3 access**
- Image processing (sharp.js)
- Video processing (FFmpeg)
- **Veo 3 API integration and webhook handling**
- Video thumbnail generation
- File organization and tagging system
- Search functionality with AI-powered tags
- Duplicate detection
- Video transcoding pipeline
- Content safety API integration

## 5. API Design

### AI Content Generation
```
GET /api/ai/content/generate - Generate text content
POST /api/ai/video/generate - Start Veo 3 video generation
GET /api/ai/jobs/:id - Check generation job status
GET /api/ai/jobs - List user's generation jobs
DELETE /api/ai/jobs/:id - Cancel pending job
POST /api/ai/content/optimize - Optimize existing content
POST /api/ai/content/repurpose - Repurpose content for different platforms
```

### Video Management
```
GET /api/videos - List generated videos
POST /api/videos/process - Process uploaded videos
GET /api/videos/:id/thumbnail - Get video thumbnail
POST /api/videos/:id/transcode - Transcode video for platforms
DELETE /api/videos/:id - Delete video and associated files
```

### Core API Endpoints

#### Authentication
```
POST /api/auth/login
POST /api/auth/logout
GET /api/auth/me
```

#### Social Accounts
```
GET /api/accounts - List connected accounts
POST /api/accounts - Connect new account
PUT /api/accounts/:id - Update account
DELETE /api/accounts/:id - Disconnect account
POST /api/accounts/:id/test - Test connection
```

#### Posts
```
GET /api/posts - List posts with filters
POST /api/posts - Create new post
GET /api/posts/:id - Get specific post
PUT /api/posts/:id - Update post
DELETE /api/posts/:id - Delete post
POST /api/posts/:id/schedule - Schedule post
POST /api/posts/:id/publish - Publish immediately
```

#### Media
```
GET /api/media - List media files
POST /api/media - Upload media
DELETE /api/media/:id - Delete media
POST /api/media/process - Process/optimize media
```

#### Analytics
```
GET /api/analytics/overview - Dashboard overview
GET /api/analytics/posts/:id - Post-specific analytics
GET /api/analytics/platforms - Platform comparison
POST /api/analytics/refresh - Refresh analytics data
```

## 6. Database Schema

### Core Tables

```sql
-- Users table (handled by Supabase Auth)
-- profiles table for extended user data

-- Social Media Accounts
CREATE TABLE social_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  platform VARCHAR(50) NOT NULL, -- 'twitter', 'linkedin', etc.
  account_name VARCHAR(255),
  access_token TEXT ENCRYPTED,
  refresh_token TEXT ENCRYPTED,
  token_expires_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Posts
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  title VARCHAR(255),
  content TEXT,
  media_urls JSONB, -- Array of media file URLs
  platforms JSONB, -- Array of platform names
  scheduled_at TIMESTAMP,
  published_at TIMESTAMP,
  status VARCHAR(50) DEFAULT 'draft', -- draft, scheduled, published, failed
  platform_posts JSONB, -- Platform-specific post IDs and data
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Media Files
CREATE TABLE media_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  file_name VARCHAR(255),
  file_path TEXT,
  file_type VARCHAR(50), -- 'image', 'video', 'ai_generated_video'
  file_size INTEGER,
  duration INTEGER, -- For videos (seconds)
  width INTEGER,
  height INTEGER,
  alt_text TEXT,
  tags JSONB,
  ai_generated BOOLEAN DEFAULT false,
  ai_prompt TEXT, -- Original prompt for AI-generated content
  ai_model VARCHAR(100), -- 'veo3', 'openai', 'claude'
  processing_status VARCHAR(50) DEFAULT 'completed', -- 'processing', 'completed', 'failed'
  created_at TIMESTAMP DEFAULT NOW()
);

-- AI Generation Jobs
CREATE TABLE ai_generation_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  job_type VARCHAR(50), -- 'video', 'text', 'image'
  prompt TEXT NOT NULL,
  parameters JSONB, -- Generation parameters (style, duration, etc.)
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  result_media_id UUID REFERENCES media_files(id),
  error_message TEXT,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Analytics
CREATE TABLE post_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id),
  platform VARCHAR(50),
  platform_post_id VARCHAR(255),
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  reach INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  recorded_at TIMESTAMP DEFAULT NOW()
);

-- Templates
CREATE TABLE content_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  name VARCHAR(255),
  content TEXT,
  platforms JSONB,
  variables JSONB, -- Template variables
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 7. User Interface Design

### Design System & Theme

#### Color Palette (OKLCH)
**Light Theme:**
- **Background**: oklch(0.9491 0.0085 197.0126) - Light cyan-tinted gray
- **Foreground**: oklch(0.3772 0.0619 212.6640) - Dark blue-gray
- **Primary**: oklch(0.5624 0.0947 203.2755) - Medium cyan-blue
- **Card**: oklch(0.9724 0.0053 197.0692) - Very light cyan-tinted white
- **Accent**: oklch(0.9021 0.0297 201.8915) - Light cyan-blue

**Dark Theme:**
- **Background**: oklch(0.2068 0.0247 224.4533) - Dark blue-gray
- **Foreground**: oklch(0.8520 0.1269 195.0354) - Light cyan
- **Primary**: oklch(0.8520 0.1269 195.0354) - Bright cyan
- **Card**: oklch(0.2293 0.0276 216.0674) - Dark blue-gray (slightly lighter)
- **Accent**: oklch(0.3775 0.0564 216.5010) - Medium blue-gray

#### Typography
- **Primary Font**: Source Code Pro (monospace) for dark theme
- **Secondary Font**: Courier New (monospace) for light theme
- **Character**: Developer-focused, technical aesthetic
- **Sizes**: Consistent type scale with 0.125rem base radius

### Dashboard Layout

#### Sidebar Navigation (Collapsible)
```
┌─────────────────┐
│ [≡] SocialTool  │ <- Logo + hamburger menu
├─────────────────┤
│ [🏠] Dashboard  │ <- Main navigation
│ [📅] Calendar   │
│ [📊] Analytics  │
│ [⚙️] Settings   │
├─────────────────┤
│ Platform Status │ <- Connection indicators
│ [🐦] Twitter ●  │ <- Green dot = connected
│ [💼] LinkedIn ● │
│ [📸] Instagram ○│ <- Gray dot = disconnected
└─────────────────┘
```

#### Dashboard Home
```
┌─────────────────────────────────────────────────────────┐
│                    Quick Stats                          │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐       │
│ │   47    │ │   12    │ │    8    │ │    3    │       │
│ │ Posts   │ │Scheduled│ │ Drafts  │ │ Failed  │       │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘       │
├─────────────────────────────────────────────────────────┤
│                 Recent Activity                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 🚀 Just shipped... [Twitter][LinkedIn] [Published] │ │
│ │ ❤️ 47  💬 12  🔄 8                    2 hrs ago    │ │
│ └─────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Behind the scenes... [Twitter] [Scheduled]         │ │
│ │ ⏰ Tomorrow at 10:00 AM                            │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

#### Content Calendar
```
┌─────────────────────────────────────────────────────────┐
│ [◀] August 2025 [▶]  [Month][Week][Day]  [+ New Post]  │
├─────────────────────────────────────────────────────────┤
│  Sun    Mon    Tue    Wed    Thu    Fri    Sat         │
│   4      5      6      7      8      9     10          │
│          📝     📷                   🎥                 │
│         10am   2pm                  3pm                 │
│  11     12     13     14     15     16     17          │
│   📱     📊           📝     📷                        │
│  9am    1pm          11am   4pm                        │
└─────────────────────────────────────────────────────────┘
```

## 8. Implementation Phases

### Phase 1: Core Infrastructure & Design System (Weeks 1-2)
- Set up Supabase database and authentication
- Create Next.js application with custom cyan theme integration
- Implement design system with OKLCH colors and monospace fonts
- Set up Tailwind CSS with custom theme configuration
- Create base UI components (Button, Card, Input, Badge) with theme
- Implement user authentication and profiles
- Set up Coolify deployment pipeline with theme assets
- Create responsive layout with themed sidebar and header
- Implement dark/light mode toggle

### Phase 2: Basic Posting with Themed UI (Weeks 3-4)
- Social media account connection (Twitter, LinkedIn) with themed status indicators
- Basic post creation and editing with monospace editor
- Direct posting functionality (no scheduling) with themed success/error states
- Media upload and management with themed file browser
- Platform-specific formatting with themed preview cards
- Post history view with themed engagement metrics display

### Phase 3: Scheduling System with Calendar UI (Weeks 5-6)
- Redis setup and queue management
- Post scheduling functionality with themed time picker
- Calendar view implementation with cyan color coding
- Drag-and-drop scheduling with themed interaction feedback
- Automated posting system with themed status notifications
- Retry logic and error handling with themed error displays

### Phase 4: AI Content Generation (Weeks 7-8)
- **Google Cloud Vertex AI setup for Veo 3 access**
- **Video generation interface with prompt engineering**
- **AI text content generation integration**
- Platform-specific optimization
- **Video processing pipeline setup**
- Hashtag management
- **AI job queue and status tracking**
- Image processing and resizing
- Template system
- **Content safety and moderation integration**

### Phase 5: Analytics with Themed Visualizations (Weeks 9-10)
- Analytics data collection
- Dashboard charts and visualizations with cyan color scheme
- Performance tracking with themed metrics cards
- Report generation with branded PDF exports
- Historical data analysis with themed trend charts

### Phase 6: Advanced Features & Polish (Weeks 11-12)
- Content repurposing engine with themed workflow
- Bulk operations with themed batch processing UI
- Advanced scheduling options with enhanced calendar
- Mobile responsive design with touch-optimized themed components
- Performance optimization and themed loading states
- Accessibility improvements with proper color contrast
- Final UI polish and animation refinements

## 9. Cost Analysis

### Operational Costs (Monthly)

#### Required Services
- **Supabase Pro**: $25/month (2 projects, 8GB database)
- **Twitter API Basic**: $100/month
- **Google Cloud (Vertex AI + Veo 3)**: $200-500/month (depending on video generation usage)
- **OpenAI/Claude API**: $20-50/month (for text content)
- **Video Storage & CDN**: $30-100/month (depending on video volume)
- **Domain/SSL**: $10-15/month
- **Total**: ~$385-690/month

#### Optional Services
- **Additional Storage**: $20-50/month (for increased video storage)
- **Advanced Analytics**: $10-30/month
- **Monitoring Tools**: $10-25/month
- **Content Moderation API**: $10-30/month

### ROI Comparison
- **Current SaaS costs**: $300-800/month (Hootsuite + video tools like Loom, Synthesia)
- **Personal tool costs**: $385-690/month
- **Savings**: Up to $110/month + complete creative control
- **Payback period**: 6-9 months
- **Additional value**: Custom video generation, no usage limits, full data ownership

## 10. Success Criteria

### Functional Success
- [ ] Successfully connect to all target platforms
- [ ] Schedule and publish posts automatically
- [ ] Generate and display analytics data
- [ ] Process and optimize media files
- [ ] Deploy and run stably on Coolify

### Performance Success
- [ ] 99%+ uptime for scheduled posts
- [ ] <2 second page load times
- [ ] <10 second posting execution
- [ ] Support 50+ posts per day
- [ ] Maintain 6 months of analytics history

### User Experience Success
- [ ] Reduce posting time by 70%
- [ ] Enable weekly batch content creation
- [ ] Provide actionable analytics insights
- [ ] Maintain consistent posting schedule
- [ ] Eliminate need for external tools

## 11. Future Enhancements

### Platform Expansion
- YouTube Shorts integration
- TikTok posting (when API becomes available)
- Pinterest integration
- Reddit posting
- Mastodon/Bluesky support

### Advanced Features
- AI-powered content generation
- Audience analysis and insights
- Competitor content tracking
- Automated hashtag research
- Content performance prediction
- Team collaboration features
- Mobile app development
- Browser extension
- Content approval workflows
- Advanced analytics and reporting

### Integrations
- CRM integration (HubSpot, Pipedrive)
- Email marketing tools (Mailchimp, ConvertKit)
- Analytics tools (Google Analytics)
- Design tools (Canva, Figma)
- Stock photo services
- URL shorteners (Bitly)

## 12. Conclusion

This Personal Social Media Management Tool represents a strategic investment in personal productivity and content management efficiency. By building a custom solution tailored to individual needs, it provides long-term value through:

1. **Complete Control**: Full ownership of data and functionality
2. **Cost Efficiency**: Significant savings compared to enterprise SaaS solutions
3. **Customization**: Features specifically designed for personal workflow
4. **Privacy**: No third-party data sharing or vendor lock-in
5. **Learning**: Valuable technical skills development

The proposed architecture using Supabase, Node.js TypeScript, and Coolify provides a modern, scalable foundation that can evolve with changing requirements while maintaining simplicity and reliability.

**Recommended Next Steps:**
1. Set up development environment and Supabase project
2. Begin Phase 1 implementation with core infrastructure
3. Connect first social media platform (Twitter/LinkedIn)
4. Build and deploy MVP for personal testing
5. Iterate and expand based on real-world usage