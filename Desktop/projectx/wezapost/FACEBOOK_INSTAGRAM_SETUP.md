# Facebook & Instagram Integration Setup Guide

This guide will help you set up Facebook and Instagram posting capabilities for WezaPost.

## Prerequisites

1. A Facebook Developer Account
2. A Facebook Business Manager Account (for Instagram posting)
3. A Facebook Page (required for posting to both Facebook and Instagram)
4. An Instagram Business Account connected to your Facebook Page

## Step 1: Create Facebook App

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click **"Create App"**
3. Choose **"Business"** as the app type
4. Fill in your app details:
   - **App Name**: `WezaPost Integration`
   - **Contact Email**: Your email
   - **Business Manager Account**: Select your business account

## Step 2: Configure Facebook Login

1. In your app dashboard, go to **"Add a Product"**
2. Add **"Facebook Login"**
3. Go to **Facebook Login > Settings**
4. Add these **Valid OAuth Redirect URIs**:
   ```
   http://localhost:3000/api/social/facebook/callback
   https://your-domain.com/api/social/facebook/callback
   ```

## Step 3: Add Required Permissions

In **App Review > Permissions and Features**, request these permissions:

### Facebook Posting
- `pages_manage_posts` - Post to pages
- `pages_read_engagement` - Read page data  
- `pages_show_list` - Access page list
- `business_management` - Business Manager access

### Instagram Posting
- `instagram_basic` - Basic Instagram access
- `instagram_content_publish` - Publish to Instagram

## Step 4: Configure Instagram Basic Display

1. Add **"Instagram Basic Display"** product to your app
2. Go to **Instagram Basic Display > Settings**
3. Add these **Valid OAuth Redirect URIs**:
   ```
   http://localhost:3000/api/social/instagram/callback
   https://your-domain.com/api/social/instagram/callback
   ```

## Step 5: Get Your App Credentials

1. Go to **Settings > Basic**
2. Copy your **App ID** and **App Secret**

## Step 6: Update Environment Variables

Add these to your `.env.local` file:

```bash
# Facebook App Credentials
FACEBOOK_CLIENT_ID="your_facebook_app_id_here"
FACEBOOK_CLIENT_SECRET="your_facebook_app_secret_here"

# Instagram App Credentials (same as Facebook for Content Publishing API)
INSTAGRAM_CLIENT_ID="your_facebook_app_id_here" 
INSTAGRAM_CLIENT_SECRET="your_facebook_app_secret_here"
```

## Step 7: Connect Instagram Business Account

1. Go to your Facebook Page Settings
2. Navigate to **Instagram > Connected Accounts**
3. Connect your Instagram Business Account
4. Ensure your Instagram account is set to **Business** (not Personal)

## Step 8: Test the Integration

1. Start your WezaPost server: `npm run dev`
2. Go to **Dashboard > Social Accounts**
3. Click **"Connect"** on Facebook
4. Grant the requested permissions
5. Click **"Connect"** on Instagram
6. Test posting with media to both platforms

## Important Notes

### Facebook Posting
- Posts go to your Facebook **Page**, not your personal profile
- You need **pages_manage_posts** permission
- Media is optional for Facebook posts

### Instagram Posting  
- **Media is required** for Instagram posts (photos/videos)
- Uses Instagram Content Publishing API via Facebook
- Instagram account must be a **Business Account**
- Instagram account must be connected to a Facebook Page

### API Limits
- Facebook: Standard rate limits apply
- Instagram: 200 API calls per hour per user

### Sandbox vs Live
- During development, your app runs in **Sandbox Mode**
- Only app admins/developers can connect accounts
- Submit for **App Review** to allow public access

## Troubleshooting

### "Invalid OAuth Redirect URI"
- Ensure your callback URLs are exactly correct
- Check for trailing slashes
- Verify HTTP vs HTTPS

### "Missing Permissions"
- Request required permissions in App Review
- Some permissions require business verification

### "Instagram Account Not Connected"  
- Ensure Instagram account is set to Business
- Verify it's connected to your Facebook Page
- Check that the Page has proper permissions

### "No Facebook Pages Found"
- You need at least one Facebook Page to post
- Create a Page in Facebook Business Manager
- Grant your app access to the Page

## Testing Checklist

- [ ] Facebook app created and configured
- [ ] Required permissions requested and approved
- [ ] Callback URLs added correctly
- [ ] Environment variables set
- [ ] Facebook Page exists and connected
- [ ] Instagram Business account connected to Page
- [ ] Test Facebook text post
- [ ] Test Facebook post with media
- [ ] Test Instagram post with media
- [ ] Verify posts appear on both platforms

## Production Deployment

1. Submit your app for **App Review**
2. Update callback URLs for your production domain
3. Set up proper webhook verification
4. Monitor API usage and rate limits
5. Implement proper error handling and retry logic

---

For support, refer to the [Facebook Developer Documentation](https://developers.facebook.com/docs/) or [Instagram Content Publishing API docs](https://developers.facebook.com/docs/instagram-api/content-publishing).