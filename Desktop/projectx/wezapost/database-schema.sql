-- WezaPost Database Schema
-- Create all required tables for WezaPost functionality

-- Enable Row Level Security
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;

-- Create profiles table (extends NextAuth users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
    usage_limits JSONB DEFAULT '{
        "posts_per_month": 50,
        "social_accounts": 3,
        "ai_generations": 100
    }'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create social_accounts table
CREATE TABLE IF NOT EXISTS public.social_accounts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    platform TEXT NOT NULL CHECK (platform IN ('twitter', 'linkedin', 'facebook', 'instagram', 'tiktok')),
    platform_user_id TEXT NOT NULL,
    username TEXT NOT NULL,
    display_name TEXT NOT NULL,
    avatar_url TEXT,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    settings JSONB DEFAULT '{
        "auto_post": true,
        "default_visibility": "public",
        "custom_hashtags": []
    }'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, platform, platform_user_id)
);

-- Create posts table
CREATE TABLE IF NOT EXISTS public.posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT,
    content TEXT NOT NULL,
    platforms TEXT[] NOT NULL DEFAULT '{}',
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published', 'failed')),
    scheduled_for TIMESTAMP WITH TIME ZONE,
    published_at TIMESTAMP WITH TIME ZONE,
    platform_posts JSONB DEFAULT '[]'::jsonb,
    media_urls TEXT[] DEFAULT '{}',
    ai_generated BOOLEAN DEFAULT false,
    recurring_template_id UUID,
    queue_job_id TEXT,
    queued_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create recurring_templates table
CREATE TABLE IF NOT EXISTS public.recurring_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    content_template TEXT NOT NULL,
    platforms TEXT[] NOT NULL DEFAULT '{}',
    cron_expression TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    last_executed TIMESTAMP WITH TIME ZONE,
    next_execution TIMESTAMP WITH TIME ZONE,
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create analytics table
CREATE TABLE IF NOT EXISTS public.analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    platform TEXT NOT NULL,
    metric_type TEXT NOT NULL CHECK (metric_type IN ('views', 'likes', 'shares', 'comments', 'clicks')),
    metric_value INTEGER NOT NULL DEFAULT 0,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create curated_posts table for n8n workflow integration
CREATE TABLE IF NOT EXISTS public.curated_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id TEXT NOT NULL, -- Using TEXT to support both UUID and special IDs like 'webhook_global'
    content TEXT NOT NULL,
    hashtags TEXT[] DEFAULT '{}',
    images JSONB DEFAULT '[]',
    links JSONB DEFAULT '[]',
    platforms TEXT[] DEFAULT '{"twitter"}',
    source JSONB NOT NULL,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'reviewed', 'approved', 'scheduled', 'published', 'rejected')),
    metadata JSONB NOT NULL,
    scheduling JSONB NOT NULL,
    reviewed_by TEXT,
    reviewed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_social_accounts_user_id ON public.social_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_social_accounts_platform ON public.social_accounts(platform);
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON public.posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_status ON public.posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_scheduled_for ON public.posts(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_recurring_templates_user_id ON public.recurring_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_user_id ON public.analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_post_id ON public.analytics(post_id);
CREATE INDEX IF NOT EXISTS idx_curated_posts_user_id ON public.curated_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_curated_posts_status ON public.curated_posts(status);
CREATE INDEX IF NOT EXISTS idx_curated_posts_created_at ON public.curated_posts(created_at);
CREATE INDEX IF NOT EXISTS idx_curated_posts_platforms ON public.curated_posts USING GIN(platforms);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curated_posts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for social_accounts
CREATE POLICY "Users can view own social accounts" ON public.social_accounts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own social accounts" ON public.social_accounts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own social accounts" ON public.social_accounts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own social accounts" ON public.social_accounts
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for posts
CREATE POLICY "Users can view own posts" ON public.posts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own posts" ON public.posts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts" ON public.posts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts" ON public.posts
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for recurring_templates
CREATE POLICY "Users can view own templates" ON public.recurring_templates
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own templates" ON public.recurring_templates
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own templates" ON public.recurring_templates
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own templates" ON public.recurring_templates
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for analytics
CREATE POLICY "Users can view own analytics" ON public.analytics
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own analytics" ON public.analytics
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for curated_posts
-- Users can view their own curated posts AND webhook posts
CREATE POLICY "Users can view curated posts" ON public.curated_posts
    FOR SELECT USING (auth.uid()::text = user_id OR user_id = 'webhook_global');

CREATE POLICY "Users can insert own curated posts" ON public.curated_posts
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own curated posts" ON public.curated_posts
    FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own curated posts" ON public.curated_posts
    FOR DELETE USING (auth.uid()::text = user_id);

-- Allow service role to manage all curated posts (for webhooks)
CREATE POLICY "Service role can manage all curated posts" ON public.curated_posts
    FOR ALL USING (auth.role() = 'service_role');

-- Allow anonymous access to webhook posts (for development)
CREATE POLICY "Allow anonymous read access to webhook posts" ON public.curated_posts
    FOR SELECT USING (user_id = 'webhook_global');

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language plpgsql;

CREATE TRIGGER handle_updated_at_profiles
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_updated_at_social_accounts
    BEFORE UPDATE ON public.social_accounts
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_updated_at_posts
    BEFORE UPDATE ON public.posts
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_updated_at_recurring_templates
    BEFORE UPDATE ON public.recurring_templates
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_updated_at_curated_posts
    BEFORE UPDATE ON public.curated_posts
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Note: Demo users should be created through the application's user registration process
-- or through Supabase Auth directly, not through this schema file