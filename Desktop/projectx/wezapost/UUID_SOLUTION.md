# 🔧 UUID Issue Solution Guide

## **The Problem**

The error `ERROR: 22P02: invalid input syntax for type uuid: "webhook_global"` occurs because:

1. **`posts` table** uses `user_id UUID` (requires valid UUID format)
2. **`curated_posts` table** uses `user_id TEXT` (allows strings like "webhook_global")
3. **System is trying to insert** `"webhook_global"` into the `posts` table

## **Root Cause Analysis**

### **Database Schema Mismatch**
```sql
-- posts table (requires UUID)
CREATE TABLE posts (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  -- ...
);

-- curated_posts table (allows TEXT)
CREATE TABLE curated_posts (
  user_id TEXT NOT NULL, -- Can be "webhook_global"
  -- ...
);
```

### **User ID Types in System**
- **Regular users**: UUID format (e.g., `123e4567-e89b-12d3-a456-426614174000`)
- **Webhook users**: String format (e.g., `"webhook_global"`, `"n8n_user"`, `"demo_user"`)

## **Solutions Implemented**

### **1. Smart User ID Detection**
```typescript
// Handle different user ID types
const isWebhookUser = userId === 'webhook_global' || userId === 'n8n_user' || userId === 'demo_user'

if (isWebhookUser) {
  // Use curated_posts table
  return await this.createCuratedPost(userId, content, platforms, scheduledFor, media)
} else {
  // Use posts table (requires UUID validation)
  if (!this.isValidUUID(userId)) {
    return null
  }
  // Create in posts table
}
```

### **2. UUID Validation**
```typescript
private isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}
```

### **3. Dual Table Support**
- **Regular posts**: Stored in `posts` table with UUID user_id
- **Webhook posts**: Stored in `curated_posts` table with TEXT user_id

## **How to Apply the Fix**

### **Step 1: Verify Database Schema**
Ensure both tables exist with correct schemas:

```sql
-- Check posts table
\d posts

-- Check curated_posts table  
\d curated_posts
```

### **Step 2: Apply RLS Policies**
Run the updated RLS policies:

```sql
-- Drop old policies
DROP POLICY IF EXISTS "Users can view their own posts" ON posts;
DROP POLICY IF EXISTS "Users can manage their own posts" ON posts;

-- Create new policies
CREATE POLICY "Posts access policy" ON posts
  FOR ALL USING (
    auth.role() = 'service_role' OR
    auth.uid() = user_id
  );
```

### **Step 3: Test the Fix**
```bash
# Test webhook user
curl -X POST http://localhost:3000/api/test-uuid-fix \
  -H "Content-Type: application/json" \
  -d '{"content": "Test", "platforms": ["twitter"], "userId": "webhook_global"}'

# Test regular user
curl -X POST http://localhost:3000/api/test-uuid-fix \
  -H "Content-Type: application/json" \
  -d '{"content": "Test", "platforms": ["twitter"], "userId": "123e4567-e89b-12d3-a456-426614174000"}'
```

## **Alternative Solutions**

### **Option 1: Unified Schema (Recommended)**
Convert all user IDs to UUID format:

```sql
-- Update curated_posts table
ALTER TABLE curated_posts ALTER COLUMN user_id TYPE UUID USING 
  CASE 
    WHEN user_id = 'webhook_global' THEN '00000000-0000-0000-0000-000000000001'::UUID
    WHEN user_id = 'n8n_user' THEN '00000000-0000-0000-0000-000000000002'::UUID
    WHEN user_id = 'demo_user' THEN '00000000-0000-0000-0000-000000000003'::UUID
    ELSE user_id::UUID
  END;
```

### **Option 2: Separate Tables (Current Implementation)**
Keep two separate tables for different user types.

### **Option 3: Polymorphic Association**
Use a single table with user_type and user_id fields:

```sql
CREATE TABLE unified_posts (
  id UUID PRIMARY KEY,
  user_type TEXT NOT NULL, -- 'uuid' or 'string'
  user_id TEXT NOT NULL,   -- Can store both UUID and string
  content TEXT NOT NULL,
  -- ...
);
```

## **Testing Strategy**

### **Test Cases**
1. **Webhook user**: `"webhook_global"` → `curated_posts` table
2. **Regular user**: Valid UUID → `posts` table  
3. **Invalid UUID**: Should fail gracefully
4. **Mixed content**: Both tables should work

### **Expected Results**
- ✅ Webhook users create posts in `curated_posts`
- ✅ Regular users create posts in `posts`
- ✅ UUID validation prevents invalid formats
- ✅ RLS policies allow service role access

## **Production Considerations**

### **Data Migration**
If migrating existing data:
```sql
-- Migrate webhook posts to use UUID
UPDATE curated_posts 
SET user_id = '00000000-0000-0000-0000-000000000001'::UUID 
WHERE user_id = 'webhook_global';
```

### **Backup Strategy**
- Backup both tables before schema changes
- Test migration on staging environment
- Plan rollback procedures

### **Monitoring**
- Monitor for UUID validation errors
- Track which table is being used
- Alert on unexpected user ID formats

## **Troubleshooting**

### **Common Issues**
1. **"Invalid UUID format"**: Check user ID validation
2. **"Table doesn't exist"**: Verify both tables are created
3. **"RLS policy violation"**: Apply updated policies
4. **"Service role not working"**: Check environment variables

### **Debug Steps**
1. Check database schema
2. Verify RLS policies
3. Test with admin client
4. Check environment variables
5. Review user ID formats

## **Next Steps**

1. **Apply RLS policies** to your Supabase database
2. **Test the UUID fix** with both user types
3. **Verify real posting** works with database integration
4. **Monitor for any UUID-related errors**
5. **Consider unified schema** for production 