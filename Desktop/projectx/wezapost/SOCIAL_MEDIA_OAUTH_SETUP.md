# 📱 Social Media OAuth Setup Guide

## 🚀 Connect Your Real Social Media Accounts

Now that your Google authentication is working, let's set up OAuth for your actual social media accounts so you can publish real posts!

---

## 🐦 Twitter Setup (Recommended - Start Here)

### Step 1: Get Twitter Developer Access
1. Go to [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. Apply for a developer account (usually approved quickly)
3. Create a new App

### Step 2: Configure Twitter App
1. **App name**: WezaPost
2. **Description**: Personal social media management tool
3. **Website**: `http://localhost:3001` 
4. **App permissions**: Read and Write
5. **Callback URL**: `http://localhost:3001/api/social/twitter/callback`

### Step 3: Get OAuth 2.0 Credentials
1. In your app dashboard, go to **Keys and tokens**
2. Under **OAuth 2.0 Client ID and Client Secret**:
   - Copy the **Client ID**
   - Copy the **Client Secret**

### Step 4: Update Your .env.local
Replace these lines in your `.env.local` file:
```bash
TWITTER_CLIENT_ID="your_actual_twitter_client_id_here"
TWITTER_CLIENT_SECRET="your_actual_twitter_client_secret_here"
```

---

## 🔗 LinkedIn Setup

### Step 1: Create LinkedIn App
1. Go to [LinkedIn Developer Portal](https://www.linkedin.com/developers/apps)
2. Click **Create App**
3. Fill in details:
   - **App name**: WezaPost
   - **LinkedIn Page**: Your personal LinkedIn page
   - **Privacy policy URL**: `http://localhost:3001/privacy` (can be placeholder)
   - **App logo**: Upload any image

### Step 2: Configure OAuth Settings
1. Go to **Auth** tab
2. Add **Authorized redirect URLs**: `http://localhost:3001/api/social/linkedin/callback`
3. Request these **OAuth scopes**:
   - `openid`
   - `profile`
   - `w_member_social`

### Step 3: Get Credentials
1. In the **Auth** tab, copy:
   - **Client ID**
   - **Client Secret**

### Step 4: Update Your .env.local
```bash
LINKEDIN_CLIENT_ID="your_actual_linkedin_client_id_here"
LINKEDIN_CLIENT_SECRET="your_actual_linkedin_client_secret_here"
```

---

## 🧪 Test Your Setup

### Check Configuration Status
Run this command to verify your setup:
```bash
node quick-oauth-setup.js
```

### Test Real Connections
1. **Restart your server**: `npm run dev`
2. **Go to dashboard**: http://localhost:3001/dashboard
3. **Connect Twitter**: Click "Connect" on Twitter - should redirect to real Twitter OAuth
4. **Connect LinkedIn**: Click "Connect" on LinkedIn - should redirect to real LinkedIn OAuth

---

## 🎯 What Happens When You Connect

### Twitter Connection Flow:
1. Click "Connect" → Redirects to Twitter
2. Authorize WezaPost → Twitter redirects back
3. Your real Twitter account appears in dashboard
4. You can now publish tweets directly!

### LinkedIn Connection Flow:
1. Click "Connect" → Redirects to LinkedIn
2. Authorize WezaPost → LinkedIn redirects back
3. Your real LinkedIn profile appears in dashboard
4. You can now post to LinkedIn directly!

---

## 📝 Current Integration Status

| Platform | Status | OAuth Ready | Publishing Ready |
|----------|--------|-------------|------------------|
| **Twitter** | ✅ Implemented | ✅ Yes | ✅ Yes |
| **LinkedIn** | ✅ Implemented | ✅ Yes | ✅ Yes |
| **Facebook** | 🚧 Coming Next | ❌ Needs setup | ❌ Needs setup |
| **Instagram** | 🚧 Coming Next | ❌ Needs setup | ❌ Needs setup |
| **TikTok** | 🚧 Future | ❌ Not started | ❌ Not started |

---

## 🔧 Troubleshooting

### "OAuth not configured" message
- Check that your Client ID and Secret are correctly set in `.env.local`
- Make sure there are no quotes or extra spaces
- Restart the development server after updating `.env.local`

### "Authorization denied" error
- Check redirect URLs match exactly: `http://localhost:3001/api/social/[platform]/callback`
- Verify your app has the correct permissions/scopes
- Make sure your app is active/published

### "Token exchange failed"
- Verify Client Secret is correct
- Check that redirect URI in platform matches exactly
- Ensure your app has necessary permissions

---

## 🎉 Success Checklist

- [ ] ✅ Twitter Developer account approved
- [ ] ✅ Twitter app created with correct callback URL
- [ ] ✅ Twitter Client ID and Secret added to .env.local
- [ ] ✅ LinkedIn app created with correct permissions
- [ ] ✅ LinkedIn Client ID and Secret added to .env.local
- [ ] ✅ Development server restarted
- [ ] ✅ Twitter connection test successful
- [ ] ✅ LinkedIn connection test successful
- [ ] ✅ Ready to publish real posts!

---

## 🚀 Next Steps

Once your accounts are connected:

1. **Create Real Posts**: Write content and select your connected accounts
2. **Publish Immediately**: Posts will go live on your real social media
3. **Schedule Content**: Set up posts to publish automatically
4. **Add More Platforms**: Set up Facebook and Instagram next

### Test Post Suggestion:
"Just set up WezaPost to manage my social media! 🚀 Excited to streamline my content publishing workflow. #WezaPost #SocialMediaManagement"

---

## 📞 Need Help?

If you run into issues:
1. Check the browser developer console for error messages
2. Verify all environment variables are set correctly
3. Test with a simple post first
4. Check platform-specific documentation for any policy changes

Your real social media accounts are just a few OAuth setups away! 🎯