# 🔐 OAuth Setup Guide - Connect Real Social Media Accounts

## Overview
This guide will help you configure real OAuth credentials so you can connect your actual social media accounts to WezaPost.

## 📝 Prerequisites
- Access to your social media accounts
- Developer account access for each platform
- About 15-20 minutes per platform

---

## 🚀 Step-by-Step Setup

### 1. Google OAuth Setup

#### Create Google OAuth App:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the **Google+ API** (for user info)
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client IDs**
5. Configure OAuth consent screen:
   - Application name: "WezaPost"
   - User support email: Your email
   - Developer contact: Your email
6. Create OAuth 2.0 Client ID:
   - Application type: **Web application**
   - Name: "WezaPost OAuth"
   - Authorized redirect URIs: `http://localhost:3001/api/auth/callback/google`

#### Copy Credentials:
```bash
GOOGLE_CLIENT_ID="your_google_client_id_here"
GOOGLE_CLIENT_SECRET="your_google_client_secret_here"
```

---

### 2. Twitter OAuth Setup

#### Create Twitter App:
1. Go to [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. Apply for developer account if needed
3. Create a new App
4. Configure App settings:
   - App name: "WezaPost"
   - Description: "Social media management tool"
   - Website URL: `http://localhost:3001`
   - Callback URL: `http://localhost:3001/api/auth/callback/twitter`
5. Go to **Keys and tokens** tab
6. Generate **API Key** and **API Secret Key**

#### OAuth 2.0 Settings:
1. In your app settings, go to **Authentication settings**
2. Enable **OAuth 2.0**
3. Set callback URL: `http://localhost:3001/api/auth/callback/twitter`
4. Request permissions: **Read and write**

#### Copy Credentials:
```bash
TWITTER_CLIENT_ID="your_twitter_api_key_here"
TWITTER_CLIENT_SECRET="your_twitter_api_secret_here"
```

---

### 3. LinkedIn OAuth Setup

#### Create LinkedIn App:
1. Go to [LinkedIn Developer Portal](https://www.linkedin.com/developers/)
2. Click **Create App**
3. Fill in app details:
   - App name: "WezaPost"
   - LinkedIn Page: Your personal/company page
   - App logo: Upload any logo
   - Legal agreement: Accept terms
4. Go to **Auth** tab
5. Add redirect URL: `http://localhost:3001/api/auth/callback/linkedin`
6. Request products:
   - **Sign In with LinkedIn using OpenID Connect**
   - **Share on LinkedIn** (if available)

#### Copy Credentials:
```bash
LINKEDIN_CLIENT_ID="your_linkedin_client_id_here"
LINKEDIN_CLIENT_SECRET="your_linkedin_client_secret_here"
```

---

### 4. Facebook OAuth Setup

#### Create Facebook App:
1. Go to [Facebook for Developers](https://developers.facebook.com/)
2. Click **Create App**
3. Choose **Consumer** app type
4. Fill in app details:
   - App name: "WezaPost"
   - Contact email: Your email
5. Add **Facebook Login** product
6. Configure Facebook Login:
   - Valid OAuth Redirect URIs: `http://localhost:3001/api/auth/callback/facebook`
7. Go to **Settings** → **Basic**
8. Copy App ID and App Secret

#### Copy Credentials:
```bash
FACEBOOK_CLIENT_ID="your_facebook_app_id_here"
FACEBOOK_CLIENT_SECRET="your_facebook_app_secret_here"
```

---

## 🛠️ Configure WezaPost

### Update .env.local File:
Replace the placeholder values in your `.env.local` file with the real credentials:

```bash
# OAuth Provider Configuration
GOOGLE_CLIENT_ID="your_actual_google_client_id"
GOOGLE_CLIENT_SECRET="your_actual_google_client_secret"
TWITTER_CLIENT_ID="your_actual_twitter_client_id" 
TWITTER_CLIENT_SECRET="your_actual_twitter_client_secret"
LINKEDIN_CLIENT_ID="your_actual_linkedin_client_id"
LINKEDIN_CLIENT_SECRET="your_actual_linkedin_client_secret"
FACEBOOK_CLIENT_ID="your_actual_facebook_client_id"
FACEBOOK_CLIENT_SECRET="your_actual_facebook_client_secret"

# NextAuth.js Configuration
NEXTAUTH_URL="http://localhost:3001"
NEXTAUTH_SECRET="wezapost-nextauth-secret-key-2024"

# Supabase Configuration (keep existing)
NEXT_PUBLIC_SUPABASE_URL="https://supabase.wezakare.com"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc0NjExNzk2MCwiZXhwIjo0OTAxNzkxNTYwLCJyb2xlIjoiYW5vbiJ9.Vl-tPNrJxnXhTz2efC2-8AL4e-LEBLTaz17B-L6YN0M"
SUPABASE_SERVICE_ROLE_KEY="your_supabase_service_role_key_here"

# Redis Configuration (keep existing)
REDIS_URL="redis://localhost:6379"
REDIS_PASSWORD=""
```

---

## 🚀 Test Real OAuth Connections

### After updating .env.local:

1. **Restart the development server**:
   ```bash
   # Stop current server (Ctrl+C)
   npm run dev
   ```

2. **Go to sign-in page**:
   ```
   http://localhost:3001/auth/signin
   ```

3. **Try OAuth providers**:
   - Click **"Continue with Google"** → Should redirect to Google auth
   - Click **"Continue with Twitter"** → Should redirect to Twitter auth
   - Click **"Continue with LinkedIn"** → Should redirect to LinkedIn auth
   - Click **"Continue with Facebook"** → Should redirect to Facebook auth

4. **After successful login**:
   - You'll be redirected to the dashboard
   - Your real profile info will be displayed
   - You can now connect your actual social media accounts

---

## 🔧 Troubleshooting

### Common Issues:

**1. "OAuth client was not found"**
- Check that Client ID and Secret are correct
- Verify redirect URIs match exactly
- Ensure the app is active/published

**2. "Redirect URI mismatch"**
- Verify callback URLs in each platform match: `http://localhost:3001/api/auth/callback/[provider]`
- Check for trailing slashes or http vs https

**3. "App not approved"**
- Some platforms require app review for production
- For development, ensure you're added as a test user

### Testing Environment Variables:
```bash
# Test if env vars are loaded
echo $GOOGLE_CLIENT_ID
echo $TWITTER_CLIENT_ID
echo $LINKEDIN_CLIENT_ID
echo $FACEBOOK_CLIENT_ID
```

---

## 🎯 Quick Start Checklist

- [ ] 1. Set up Google OAuth (easiest to start with)
- [ ] 2. Update GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env.local
- [ ] 3. Restart development server
- [ ] 4. Test Google login at http://localhost:3001/auth/signin
- [ ] 5. Repeat for other platforms as needed

### Priority Order (recommended):
1. **Google** (easiest setup)
2. **LinkedIn** (professional network)
3. **Twitter** (quick setup)
4. **Facebook** (may require app review)

---

## 🎉 After Setup

Once you have OAuth working:
1. **Sign in** with your real account
2. **Connect social media accounts** in the dashboard
3. **Create and publish** real posts to your accounts
4. **Schedule content** for automatic posting

Your WezaPost instance will be fully functional with your real social media accounts! 🚀