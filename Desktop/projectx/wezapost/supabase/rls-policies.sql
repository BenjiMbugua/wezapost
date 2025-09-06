-- Updated RLS Policies for WezaPost
-- These policies allow service role access while maintaining user data isolation

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own posts" ON posts;
DROP POLICY IF EXISTS "Users can manage their own posts" ON posts;
DROP POLICY IF EXISTS "Users can view their own social accounts" ON social_accounts;
DROP POLICY IF EXISTS "Users can manage their own social accounts" ON social_accounts;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;

-- Posts policies - Allow service role and user access
CREATE POLICY "Posts access policy" ON posts
  FOR ALL USING (
    -- Allow service role (bypasses RLS)
    auth.role() = 'service_role' OR
    -- Allow users to access their own posts
    auth.uid() = user_id
  );

-- Social accounts policies
CREATE POLICY "Social accounts access policy" ON social_accounts
  FOR ALL USING (
    -- Allow service role
    auth.role() = 'service_role' OR
    -- Allow users to access their own accounts
    auth.uid() = user_id
  );

-- Profiles policies
CREATE POLICY "Profiles access policy" ON profiles
  FOR ALL USING (
    -- Allow service role
    auth.role() = 'service_role' OR
    -- Allow users to access their own profile
    auth.uid() = id
  );

-- Enable RLS on all tables
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY; 