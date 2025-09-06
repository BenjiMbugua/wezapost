# Instagram Login API Setup Guide

This guide will help you set up Instagram login using Instagram Basic Display API for WezaPost.

## 📋 Prerequisites

1. Facebook Developer Account
2. Instagram account (Personal or Business)

## 🚀 Step-by-Step Setup

### Step 1: Create Facebook App (Instagram Basic Display uses Facebook Developer Platform)

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click **"Create App"**
3. Choose **"Consumer"** or **"Business"** type
4. Fill in details:
   - **App Name**: `WezaPost Instagram`
   - **Contact Email**: Your email
5. Click **"Create App"**

### Step 2: Add Instagram Basic Display Product

1. In your app dashboard, click **"Add Product"**
2. Find **"Instagram Basic Display"** and click **"Set Up"**
3. This will add Instagram Basic Display to your app

### Step 3: Configure Instagram Basic Display

1. Go to **Instagram Basic Display > Settings**
2. Add **Valid OAuth Redirect URIs**:
   ```
   http://localhost:3000/api/social/instagram/callback
   ```
   For production, also add:
   ```
   https://your-domain.com/api/social/instagram/callback
   ```

3. Add **Deauthorize Callback URL**:
   ```
   http://localhost:3000/api/social/instagram/deauth
   ```

4. Add **Data Deletion Request URL**:
   ```
   http://localhost:3000/api/social/instagram/delete
   ```

### Step 4: Add Instagram Tester

1. In **Instagram Basic Display > Settings**
2. Scroll to **Instagram Testers**
3. Click **"Add Instagram Testers"**
4. Enter the Instagram username you want to test with
5. The Instagram user needs to accept the invitation

### Step 5: Get Your Credentials

1. Go to **Settings > Basic**
2. Copy:
   - **App ID** → This is your `INSTAGRAM_CLIENT_ID`
   - **App Secret** → This is your `INSTAGRAM_CLIENT_SECRET`

### Step 6: Update Environment Variables

```bash
# Instagram Basic Display API Credentials
INSTAGRAM_CLIENT_ID="your_facebook_app_id"
INSTAGRAM_CLIENT_SECRET="your_facebook_app_secret"
```

## 🔧 What Our API Does

### Instagram Connect Endpoint (`/api/social/instagram/connect`)
- Generates Instagram OAuth authorization URL
- Scopes: `user_profile,user_media`
- Redirects to Instagram for permission

### Instagram Callback Endpoint (`/api/social/instagram/callback`)
- Handles OAuth callback from Instagram
- Exchanges authorization code for access token
- Gets long-lived token (60 days validity)
- Fetches user profile data
- Saves connection to database

### Data Retrieved
- Instagram User ID
- Username
- Account Type (Personal/Business)
- Media Count
- Long-lived Access Token

## 🧪 Testing the Integration

1. Start your server: `npm run dev`
2. Go to your dashboard
3. Click **"Connect Instagram"**
4. You'll be redirected to Instagram
5. Grant permissions
6. You'll be redirected back with success message

## 📱 Instagram API Capabilities

### What You Can Do:
- Get user profile information
- Access user's media (photos/videos)
- Get media insights (for Business accounts)

### What You Cannot Do:
- Post content (requires Instagram Content Publishing API via Facebook Business)
- Access other users' data
- Perform actions on behalf of user

## 🔐 Security Features

- **State Parameter**: Prevents CSRF attacks
- **Access Token Encryption**: Tokens stored securely
- **Long-lived Tokens**: 60-day validity reduces re-auth frequency
- **Automatic Token Refresh**: Handles token expiration

## 📊 API Rate Limits

- **200 requests per hour** per access token
- Rate limits reset every hour
- Monitor usage in Facebook Developer Console

## 🐛 Troubleshooting

### "Invalid OAuth Redirect URI"
- Ensure callback URL matches exactly in Facebook app settings
- Check for typos, trailing slashes, HTTP vs HTTPS

### "Instagram Tester Required"
- Add Instagram username as tester in Facebook app
- Instagram user must accept invitation
- Only works with tester accounts during development

### "Invalid Client ID"
- Verify `INSTAGRAM_CLIENT_ID` in `.env.local`
- Ensure it matches Facebook App ID

### "Access Token Invalid"
- Token may have expired (60 days for long-lived)
- User may have changed Instagram password
- Re-authenticate user

## 🚀 Production Checklist

- [ ] Submit app for Instagram Basic Display review
- [ ] Update callback URLs for production domain
- [ ] Set up proper error logging
- [ ] Implement token refresh logic
- [ ] Monitor API usage
- [ ] Set up webhook for deauthorization

## 📚 API Documentation

- [Instagram Basic Display API](https://developers.facebook.com/docs/instagram-basic-display-api)
- [Facebook App Development](https://developers.facebook.com/docs/development)
- [OAuth 2.0 Flow](https://developers.facebook.com/docs/instagram-basic-display-api/getting-started)

---

Your Instagram login API is ready to use once you configure the credentials!