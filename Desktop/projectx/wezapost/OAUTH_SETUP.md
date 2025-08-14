# OAuth Provider Setup Guide

This document provides instructions for setting up OAuth providers for WezaPost.

## Prerequisites

- Your WezaPost application running on `http://localhost:3001` (or your domain)
- Access to developer consoles for each social media platform

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Set authorized redirect URIs:
   - `http://localhost:3001/api/auth/callback/google` (development)
   - `https://yourdomain.com/api/auth/callback/google` (production)

Add to your `.env.local`:
```
GOOGLE_CLIENT_ID="your_google_client_id_here"
GOOGLE_CLIENT_SECRET="your_google_client_secret_here"
```

## Twitter/X OAuth Setup

1. Go to [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. Create a new app or select existing one
3. Enable OAuth 2.0 with PKCE
4. Set callback URLs:
   - `http://localhost:3001/api/auth/callback/twitter` (development)
   - `https://yourdomain.com/api/auth/callback/twitter` (production)

Add to your `.env.local`:
```
TWITTER_CLIENT_ID="your_twitter_client_id_here"
TWITTER_CLIENT_SECRET="your_twitter_client_secret_here"
```

## LinkedIn OAuth Setup

1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/)
2. Create a new app
3. Request access to "Sign In with LinkedIn" product
4. Set authorized redirect URLs:
   - `http://localhost:3001/api/auth/callback/linkedin` (development)
   - `https://yourdomain.com/api/auth/callback/linkedin` (production)

Add to your `.env.local`:
```
LINKEDIN_CLIENT_ID="your_linkedin_client_id_here"
LINKEDIN_CLIENT_SECRET="your_linkedin_client_secret_here"
```

## Facebook OAuth Setup

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app
3. Add "Facebook Login" product
4. Set valid OAuth redirect URIs:
   - `http://localhost:3001/api/auth/callback/facebook` (development)
   - `https://yourdomain.com/api/auth/callback/facebook` (production)

Add to your `.env.local`:
```
FACEBOOK_CLIENT_ID="your_facebook_client_id_here"
FACEBOOK_CLIENT_SECRET="your_facebook_client_secret_here"
```

## Supabase Service Role Key

To complete the setup, you also need your Supabase service role key:

1. Go to your Supabase project settings
2. Navigate to API section
3. Copy the "service_role" key (not the anon key)

Add to your `.env.local`:
```
SUPABASE_SERVICE_ROLE_KEY="your_supabase_service_role_key_here"
```

## Security Notes

- Never commit actual API keys to version control
- Use different OAuth apps for development and production
- Regularly rotate your API keys
- Set up proper CORS policies for production

## Testing

After setting up the OAuth providers:

1. Restart your development server: `npm run dev`
2. Visit `http://localhost:3001/auth/signin`
3. Test each OAuth provider
4. Check that user profiles are created in Supabase
5. Verify social accounts can be connected in the dashboard

## Database Schema

The application will automatically create user profiles when users sign in. Make sure to run the SQL schema in `supabase/schema.sql` in your Supabase SQL editor first.

## Troubleshooting

- **OAuth errors**: Check redirect URLs match exactly
- **Database errors**: Ensure Supabase service role key is set
- **NextAuth errors**: Verify `NEXTAUTH_SECRET` is set
- **CORS errors**: Check your OAuth app domains