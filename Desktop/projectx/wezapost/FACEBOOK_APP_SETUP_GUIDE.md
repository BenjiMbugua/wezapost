# Facebook App Connection Setup Guide

## Current App Status
- **Facebook App ID**: `1027224232372211`
- **Instagram App ID**: `782836174435153`
- **App Mode**: Development (needs to be Live for webhooks)
- **App Type**: Business ✅

## Step 1: Get Your App Secret

1. In your Meta App Dashboard, go to **Settings > Basic**
2. Click **"Show"** next to **App Secret**
3. Copy the secret (it's currently masked as ".........")

## Step 2: Configure OAuth Redirect URIs

### In Facebook App Dashboard:
1. Go to **Facebook Login > Settings**
2. Add these **Valid OAuth Redirect URIs**:
   ```
   http://localhost:3000/api/social/facebook/callback
   https://your-production-domain.com/api/social/facebook/callback
   ```

### In Instagram Basic Display:
1. Go to **Instagram Basic Display > Settings**
2. Add these **Valid OAuth Redirect URIs**:
   ```
   http://localhost:3000/api/social/instagram/callback
   https://your-production-domain.com/api/social/instagram/callback
   ```

## Step 3: Request Required Permissions

In **App Review > Permissions and Features**, request these permissions:

### Facebook Posting Permissions:
- `pages_manage_posts` - Post to pages
- `pages_read_engagement` - Read page data  
- `pages_show_list` - Access page list
- `business_management` - Business Manager access

### Instagram Posting Permissions:
- `instagram_basic` - Basic Instagram access
- `instagram_content_publish` - Publish to Instagram

## Step 4: Set Up Environment Variables

Create a `.env.local` file in your project root with:

```bash
# Facebook App Credentials
FACEBOOK_CLIENT_ID="1027224232372211"
FACEBOOK_CLIENT_SECRET="your_facebook_app_secret_here"

# Instagram App Credentials (same as Facebook for Content Publishing API)
INSTAGRAM_CLIENT_ID="1027224232372211"
INSTAGRAM_CLIENT_SECRET="your_facebook_app_secret_here"

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your_nextauth_secret_here"
```

## Step 5: Configure Webhooks (Optional for Development)

1. In **Webhooks > Settings**:
   - **Callback URL**: `https://your-domain.com/api/webhooks/facebook`
   - **Verify Token**: Create a random string for verification
   - **Subscribe to**: `pages` and `instagram` events

2. **Note**: Webhooks require App Mode to be "Live"

## Step 6: Test the Connection

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Open the test page:
   ```
   http://localhost:3000/test-facebook-instagram-setup.html
   ```

3. Click **"Connect Facebook Account"** to test OAuth flow

## Step 7: Prerequisites Checklist

Before posting will work, ensure you have:

- [ ] **Facebook Business Manager Account**
- [ ] **At least one Facebook Page** (create in Business Manager)
- [ ] **Instagram Business Account** connected to your Facebook Page
- [ ] **App permissions approved** (may require business verification)

## Step 8: Connect Instagram Business Account

1. Go to your **Facebook Page Settings**
2. Navigate to **Instagram > Connected Accounts**
3. Connect your Instagram Business Account
4. Ensure Instagram account is set to **Business** (not Personal)

## Troubleshooting Common Issues

### "Invalid OAuth Redirect URI"
- Ensure callback URLs are exactly correct
- Check for trailing slashes
- Verify HTTP vs HTTPS

### "Missing Permissions"
- Request required permissions in App Review
- Some permissions require business verification
- Development mode limits access to app admins only

### "No Facebook Pages Found"
- You need at least one Facebook Page to post
- Create a Page in Facebook Business Manager
- Grant your app access to the Page

### "Instagram Account Not Connected"
- Ensure Instagram account is set to Business
- Verify it's connected to your Facebook Page
- Check that the Page has proper permissions

## Production Deployment

1. **Submit App Review** to allow public access
2. **Switch App Mode to "Live"**
3. **Update callback URLs** for your production domain
4. **Set up webhook verification**
5. **Monitor API usage** and rate limits

## Testing Your Setup

Use the provided test files:
- `test-facebook-instagram-setup.html` - Comprehensive setup testing
- `test-oauth-setup.html` - OAuth flow testing
- `test-post-creation.html` - Post creation testing

## API Endpoints Available

Your app has these Facebook/Instagram endpoints:
- `GET /api/social/facebook/connect` - Start Facebook OAuth
- `GET /api/social/facebook/callback` - Handle Facebook OAuth callback
- `POST /api/posts` - Create posts (supports Facebook/Instagram)
- `GET /api/scheduler` - Schedule posts

## Next Steps

1. Complete the environment variable setup
2. Test the OAuth connection
3. Connect your Facebook Page and Instagram Business Account
4. Test posting functionality
5. Submit for App Review when ready for production

---

**Need Help?** Check the existing guides:
- `FACEBOOK_INSTAGRAM_SETUP.md` - Detailed technical setup
- `SOCIAL_MEDIA_OAUTH_SETUP.md` - OAuth configuration
- `OAUTH_SETUP_GUIDE.md` - General OAuth setup
