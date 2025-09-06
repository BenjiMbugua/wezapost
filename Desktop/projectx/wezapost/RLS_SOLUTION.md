# 🔒 RLS (Row Level Security) Solution Guide

## **What is RLS?**

Row Level Security (RLS) is a PostgreSQL feature that automatically filters database queries based on policies. In Supabase, it ensures users can only access their own data.

## **Current RLS Issues in WezaPost**

### **Problem 1: Service Role Not Working**
- **Issue**: Service role key not bypassing RLS properly
- **Cause**: RLS policies too restrictive or service role not configured correctly
- **Solution**: Use admin client with explicit RLS bypass

### **Problem 2: API Routes Lack Authentication Context**
- **Issue**: NextAuth session doesn't create Supabase session
- **Cause**: Different authentication systems
- **Solution**: Use service role for server-side operations

### **Problem 3: RLS Policies Too Restrictive**
- **Issue**: Policies don't allow service role access
- **Cause**: Policies only allow `auth.uid()` access
- **Solution**: Update policies to allow service role

## **Solutions Implemented**

### **1. Admin Client (`src/lib/supabase-admin.ts`)**
```typescript
// Admin client that completely bypasses RLS
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: { autoRefreshToken: false, persistSession: false },
    db: { schema: 'public' }
  }
)
```

### **2. Updated Database Service**
- Uses admin client for all operations
- Handles RLS errors gracefully
- Provides fallback methods

### **3. RLS Policy Updates (`supabase/rls-policies.sql`)**
```sql
CREATE POLICY "Posts access policy" ON posts
  FOR ALL USING (
    auth.role() = 'service_role' OR  -- Allow service role
    auth.uid() = user_id OR          -- Allow user access
    user_id = 'webhook_global'       -- Allow webhook posts
  );
```

## **How to Apply the Fix**

### **Step 1: Apply RLS Policies**
Run this SQL in your Supabase dashboard:
```sql
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own posts" ON posts;
DROP POLICY IF EXISTS "Users can manage their own posts" ON posts;

-- Create new policies
CREATE POLICY "Posts access policy" ON posts
  FOR ALL USING (
    auth.role() = 'service_role' OR
    auth.uid() = user_id OR
    user_id = 'webhook_global'
  );
```

### **Step 2: Verify Service Role Key**
Ensure your `.env.local` has:
```bash
SUPABASE_SERVICE_ROLE_KEY="your_service_role_key_here"
```

### **Step 3: Test the Fix**
```bash
curl -X POST http://localhost:3000/api/test-rls-fix \
  -H "Content-Type: application/json" \
  -d '{"content": "Test", "platforms": ["twitter"], "userId": "test-user"}'
```

## **Security Implications**

### **✅ What RLS Protects:**
- **User data isolation**: Users can't see each other's posts
- **Unauthorized access**: Prevents direct database access
- **Data leakage**: Ensures proper data boundaries

### **⚠️ What Service Role Bypasses:**
- **RLS policies**: Service role can access all data
- **User context**: No automatic user filtering
- **Audit trails**: May not log user-specific actions

### **🔒 Security Best Practices:**
1. **Only use service role in API routes** where you've verified authentication
2. **Always validate user ownership** before operations
3. **Log all service role operations** for audit trails
4. **Use user-specific queries** when possible

## **Alternative Approaches**

### **Option 1: Disable RLS (Not Recommended)**
```sql
ALTER TABLE posts DISABLE ROW LEVEL SECURITY;
```
**❌ Risk**: No data isolation between users

### **Option 2: Use Supabase Auth (Recommended for Production)**
- Replace NextAuth with Supabase Auth
- Automatic RLS integration
- Better security model

### **Option 3: Hybrid Approach (Current Implementation)**
- Use service role for API operations
- Maintain RLS for direct client access
- Manual user validation in API routes

## **Testing the Solution**

### **Test 1: Database Access**
```bash
# Should succeed with admin client
curl -X POST http://localhost:3000/api/test-rls-fix \
  -H "Content-Type: application/json" \
  -d '{"content": "Test", "platforms": ["twitter"], "userId": "test-user"}'
```

### **Test 2: Real Posting**
1. Create a post through WezaPost dashboard
2. Check if it's saved to database
3. Verify posting results are stored

### **Test 3: Scheduled Posts**
1. Schedule a post for 5 minutes from now
2. Check if it's processed and posted
3. Verify results in database

## **Production Considerations**

### **Environment Variables**
```bash
# Required for production
SUPABASE_SERVICE_ROLE_KEY="your_production_service_role_key"
NEXT_PUBLIC_SUPABASE_URL="your_production_supabase_url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your_production_anon_key"
```

### **Monitoring**
- Monitor service role usage
- Log all database operations
- Set up alerts for unusual access patterns

### **Backup Strategy**
- Regular database backups
- Test restore procedures
- Document recovery processes

## **Troubleshooting**

### **Common Issues:**
1. **"Service role key invalid"**: Check environment variables
2. **"RLS policy violation"**: Apply updated policies
3. **"Permission denied"**: Verify service role permissions

### **Debug Steps:**
1. Check Supabase logs
2. Verify RLS policies are applied
3. Test with admin client
4. Check environment variables

## **Next Steps**

1. **Apply RLS policies** to your Supabase database
2. **Test the admin client** with the test endpoint
3. **Verify real posting** works with database integration
4. **Monitor for any issues** in production
5. **Consider migrating to Supabase Auth** for better integration 