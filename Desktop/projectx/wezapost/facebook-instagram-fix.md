# Facebook & Instagram Posting Fix Guide

## 🚨 **Current Issues**

### **Facebook Posting Problems:**
1. **Missing Page Permissions** - Need `pages_manage_posts` permission
2. **No Page Selection** - Uses first available page without user choice
3. **Access Token Issues** - May not have correct page access tokens

### **Instagram Posting Problems:**
1. **Mock Instagram Business ID** - Uses fake ID instead of real account
2. **Missing Instagram Business Account** - Needs proper connection
3. **Media Requirements** - Instagram requires media for all posts

## ✅ **Step-by-Step Fix**

### **Step 1: Fix Facebook App Permissions**

In your Meta App Dashboard (App ID: `1971174190366072`):

1. **Go to App Review > Permissions and Features**
2. **Request these permissions:**
   - `pages_manage_posts` - **CRITICAL** for posting to pages
   - `pages_read_engagement` - Read page data
   - `pages_show_list` - Access page list
   - `business_management` - Business Manager access
   - `instagram_basic` - Basic Instagram access
   - `instagram_content_publish` - **CRITICAL** for Instagram posting

3. **Submit for App Review** (some permissions require business verification)

### **Step 2: Fix Instagram Business Account Connection**

1. **Ensure you have a Facebook Page** (required for Instagram posting)
2. **Connect Instagram Business Account** to your Facebook Page:
   - Go to your Facebook Page Settings
   - Navigate to Instagram > Connected Accounts
   - Connect your Instagram Business Account
   - Ensure Instagram account is set to **Business** (not Personal)

### **Step 3: Update Environment Variables**

Your `.env.local` should have:
```bash
# Facebook App Credentials
FACEBOOK_CLIENT_ID="1971174190366072"
FACEBOOK_CLIENT_SECRET="9ab8977ae92b29cd1e76de87d1d7d396"

# Instagram App Credentials (same as Facebook for Content Publishing API)
INSTAGRAM_CLIENT_ID="1971174190366072"
INSTAGRAM_CLIENT_SECRET="9ab8977ae92b29cd1e76de87d1d7d396"
```

### **Step 4: Fix Instagram Business Account ID**

The current code uses a mock Instagram Business ID. You need to:

1. **Get your real Instagram Business Account ID**
2. **Update the posting service** to use the real ID

### **Step 5: Test the Fix**

1. **Test Facebook posting** with a simple text post
2. **Test Instagram posting** with a photo/video
3. **Verify permissions** are working correctly

## 🔧 **Code Fixes Needed**

### **Fix 1: Update Instagram Posting Service**

Replace the mock Instagram Business ID with real account detection:

```typescript
// In social-posting-service.ts, replace the mock ID with:
const instagramAccount = await this.instagramPoster.getBusinessAccountInfo(
  account.access_token, 
  facebookPageId
)

if (!instagramAccount) {
  return {
    platform: 'instagram',
    success: false,
    error: 'No Instagram Business Account connected to Facebook page'
  }
}

const result = await this.instagramPoster.postToInstagram(
  account.access_token,
  instagramAccount.id, // Use real Instagram Business Account ID
  postData
)
```

### **Fix 2: Add Page Selection**

Allow users to choose which Facebook page to post to:

```typescript
// Get all available pages
const pages = await this.facebookPoster.getPages(account.access_token)

// Let user select page (in UI)
// For now, use first page with proper permissions
const validPage = pages.find(page => 
  page.tasks && page.tasks.includes('MANAGE')
)
```

### **Fix 3: Add Permission Validation**

Add checks to ensure proper permissions:

```typescript
// Validate Facebook permissions
const fbPermissions = await this.facebookPoster.validatePagePermissions(account.access_token)
if (!fbPermissions.hasPermissions) {
  return {
    platform: 'facebook',
    success: false,
    error: 'Missing required Facebook page permissions'
  }
}

// Validate Instagram permissions
const igPermissions = await this.instagramPoster.validateInstagramPermissions(
  account.access_token, 
  facebookPageId
)
if (!igPermissions.hasPermissions) {
  return {
    platform: 'instagram',
    success: false,
    error: 'No Instagram Business Account connected'
  }
}
```

## 🧪 **Testing Checklist**

### **Before Testing:**
- [ ] Facebook app permissions requested and approved
- [ ] Instagram Business Account connected to Facebook Page
- [ ] Environment variables updated
- [ ] Development server restarted

### **Test Facebook:**
- [ ] Simple text post works
- [ ] Post with image works
- [ ] Post appears on Facebook Page

### **Test Instagram:**
- [ ] Post with photo works
- [ ] Post with video works
- [ ] Post appears on Instagram Business Account

## 🚀 **Quick Test Commands**

```bash
# Test Facebook posting
curl -X POST http://localhost:3000/api/posts \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Test Facebook post from WezaPost!",
    "platforms": ["facebook"]
  }'

# Test Instagram posting (requires media)
curl -X POST http://localhost:3000/api/posts \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Test Instagram post from WezaPost!",
    "platforms": ["instagram"],
    "media_urls": ["https://example.com/test-image.jpg"]
  }'
```

## 📋 **Common Error Messages & Solutions**

### **"No Facebook pages found"**
- **Solution**: Create a Facebook Page in Business Manager
- **Solution**: Grant your app access to the page

### **"Missing required Facebook page permissions"**
- **Solution**: Request `pages_manage_posts` permission in App Review
- **Solution**: Ensure business verification is complete

### **"No Instagram Business Account connected"**
- **Solution**: Connect Instagram Business Account to Facebook Page
- **Solution**: Ensure Instagram account is set to Business (not Personal)

### **"Instagram requires at least one media item"**
- **Solution**: Always include media URLs for Instagram posts
- **Solution**: Ensure media URLs are publicly accessible

## 🎯 **Next Steps**

1. **Request Facebook app permissions** in App Review
2. **Connect Instagram Business Account** to Facebook Page
3. **Update the code** to use real Instagram Business Account ID
4. **Test posting** with simple content first
5. **Monitor for errors** and fix any remaining issues

---

**Need Help?** Check the existing guides:
- `FACEBOOK_APP_SETUP_GUIDE.md` - Detailed setup instructions
- `FACEBOOK_INSTAGRAM_SETUP.md` - Technical configuration
- `SOCIAL_MEDIA_OAUTH_SETUP.md` - OAuth configuration
