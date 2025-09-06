-- Create curated_posts table for WezaPost
-- This table stores content curated by n8n workflows

CREATE TABLE curated_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  user_id TEXT NOT NULL,
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
CREATE INDEX idx_curated_posts_user_id ON curated_posts(user_id);
CREATE INDEX idx_curated_posts_status ON curated_posts(status);
CREATE INDEX idx_curated_posts_created_at ON curated_posts(created_at);
CREATE INDEX idx_curated_posts_platforms ON curated_posts USING GIN(platforms);

-- Add trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_curated_posts_updated_at 
  BEFORE UPDATE ON curated_posts 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE curated_posts ENABLE ROW LEVEL SECURITY;

-- Create policies for Row Level Security
-- Users can view their own curated posts AND webhook posts
CREATE POLICY "Users can view their own curated posts" ON curated_posts
  FOR SELECT USING (user_id = auth.uid()::text OR user_id = 'webhook_global');

CREATE POLICY "Users can insert their own curated posts" ON curated_posts
  FOR INSERT WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can update their own curated posts" ON curated_posts
  FOR UPDATE USING (user_id = auth.uid()::text);

CREATE POLICY "Users can delete their own curated posts" ON curated_posts
  FOR DELETE USING (user_id = auth.uid()::text);

-- Allow service role to bypass RLS for webhook endpoints
CREATE POLICY "Service role can manage all curated posts" ON curated_posts
  FOR ALL USING (auth.role() = 'service_role');

-- Allow anonymous access to webhook posts (for development)
CREATE POLICY "Allow anonymous read access to webhook posts" ON curated_posts
  FOR SELECT USING (user_id = 'webhook_global');

-- Create a view for easier querying with computed fields
CREATE OR REPLACE VIEW curated_posts_with_stats AS
SELECT 
  *,
  (SELECT COUNT(*) FROM jsonb_array_elements_text(hashtags)) as hashtag_count,
  (SELECT COUNT(*) FROM jsonb_array_elements(images)) as image_count,
  (SELECT COUNT(*) FROM jsonb_array_elements(links)) as link_count,
  LENGTH(content) as content_length
FROM curated_posts;

-- Grant permissions
GRANT ALL ON curated_posts TO authenticated;
GRANT SELECT ON curated_posts_with_stats TO authenticated;