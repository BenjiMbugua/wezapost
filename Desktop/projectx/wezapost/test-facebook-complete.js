#!/usr/bin/env node

/**
 * Complete Facebook App Connection Test
 * This script tests the entire Facebook setup including environment variables
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const https = require('https');
const http = require('http');

// Configuration from environment
const CONFIG = {
  FACEBOOK_CLIENT_ID: process.env.FACEBOOK_CLIENT_ID,
  FACEBOOK_CLIENT_SECRET: process.env.FACEBOOK_CLIENT_SECRET,
  REDIRECT_URI: 'http://localhost:3000/api/social/facebook/callback',
  NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000'
};

console.log('🔧 Complete Facebook App Connection Test');
console.log('========================================\n');

// Test 1: Environment Variables
console.log('1. Environment Variables Check:');
console.log(`   Facebook Client ID: ${CONFIG.FACEBOOK_CLIENT_ID ? '✅ Set' : '❌ Missing'}`);
console.log(`   Facebook Client Secret: ${CONFIG.FACEBOOK_CLIENT_SECRET ? '✅ Set' : '❌ Missing'}`);
console.log(`   NextAuth URL: ${CONFIG.NEXTAUTH_URL}`);
console.log(`   Redirect URI: ${CONFIG.REDIRECT_URI}\n`);

// Test 2: App ID Validation
console.log('2. App ID Validation:');
if (CONFIG.FACEBOOK_CLIENT_ID === '1027224232372211') {
  console.log('   ✅ Correct Facebook App ID: 1027224232372211');
} else {
  console.log(`   ❌ Wrong App ID: ${CONFIG.FACEBOOK_CLIENT_ID}`);
}
console.log('');

// Test 3: Generate OAuth URL
console.log('3. OAuth URL Generation:');
if (CONFIG.FACEBOOK_CLIENT_ID) {
  const oauthUrl = new URL('https://www.facebook.com/v18.0/dialog/oauth');
  oauthUrl.searchParams.set('client_id', CONFIG.FACEBOOK_CLIENT_ID);
  oauthUrl.searchParams.set('redirect_uri', CONFIG.REDIRECT_URI);
  oauthUrl.searchParams.set('scope', [
    'pages_manage_posts',
    'pages_read_engagement', 
    'pages_show_list',
    'business_management',
    'instagram_basic',
    'instagram_content_publish'
  ].join(','));
  oauthUrl.searchParams.set('response_type', 'code');
  oauthUrl.searchParams.set('state', 'test-state');

  console.log('   ✅ OAuth URL generated successfully');
  console.log(`   URL: ${oauthUrl.toString()}\n`);
} else {
  console.log('   ❌ Cannot generate OAuth URL - missing App ID\n');
}

// Test 4: Development Server
console.log('4. Development Server Check:');
checkServer('http://localhost:3000', (isRunning) => {
  if (isRunning) {
    console.log('   ✅ Development server is running on localhost:3000');
  } else {
    console.log('   ❌ Development server is not running');
  }
  console.log('');

  // Test 5: API Endpoints
  console.log('5. API Endpoints Check:');
  checkEndpoint('http://localhost:3000/api/social/facebook/connect', (isAvailable) => {
    if (isAvailable) {
      console.log('   ✅ Facebook connect endpoint is available');
    } else {
      console.log('   ❌ Facebook connect endpoint is not available');
    }
  });

  checkEndpoint('http://localhost:3000/test-facebook-instagram-setup.html', (isAvailable) => {
    if (isAvailable) {
      console.log('   ✅ Facebook test page is available');
    } else {
      console.log('   ❌ Facebook test page is not available');
    }
  });
  console.log('');

  // Test 6: Callback URL Configuration
  console.log('6. Callback URL Configuration:');
  console.log('   📋 You need to add this URL to your Facebook app settings:');
  console.log(`   ${CONFIG.REDIRECT_URI}\n`);
  
  console.log('   📋 In your Meta App Dashboard:');
  console.log('   1. Go to Facebook Login > Settings');
  console.log('   2. Add Valid OAuth Redirect URIs:');
  console.log(`      ${CONFIG.REDIRECT_URI}`);
  console.log('   3. Save the changes\n');

  // Test 7: Required Permissions
  console.log('7. Required Permissions Checklist:');
  console.log('   📋 Request these permissions in App Review:');
  console.log('      - pages_manage_posts (Post to pages)');
  console.log('      - pages_read_engagement (Read page data)');
  console.log('      - pages_show_list (Access page list)');
  console.log('      - business_management (Business Manager access)');
  console.log('      - instagram_basic (Basic Instagram access)');
  console.log('      - instagram_content_publish (Publish to Instagram)');
  console.log('');

  // Final Status
  console.log('🎯 Current Status:');
  if (CONFIG.FACEBOOK_CLIENT_ID && CONFIG.FACEBOOK_CLIENT_SECRET) {
    console.log('   ✅ Environment variables are configured');
    console.log('   ⚠️  Callback URL needs to be added to Facebook app settings');
    console.log('   ⚠️  Permissions need to be requested in App Review');
  } else {
    console.log('   ❌ Environment variables are missing');
  }
  console.log('');

  console.log('🚀 Next Steps:');
  console.log('   1. Add callback URL to Facebook app settings (see step 6)');
  console.log('   2. Request required permissions in App Review');
  console.log('   3. Test the connection at: http://localhost:3000/test-facebook-instagram-setup.html');
  console.log('   4. Try Facebook signup at: http://localhost:3000/auth/signin');
});

// Helper functions
function checkServer(url, callback) {
  const client = url.startsWith('https') ? https : http;
  const req = client.get(url, (res) => {
    callback(res.statusCode < 400);
  });
  req.on('error', () => {
    callback(false);
  });
  req.setTimeout(3000, () => {
    req.destroy();
    callback(false);
  });
}

function checkEndpoint(url, callback) {
  const client = url.startsWith('https') ? https : http;
  const req = client.get(url, (res) => {
    callback(res.statusCode < 400);
  });
  req.on('error', () => {
    callback(false);
  });
  req.setTimeout(3000, () => {
    req.destroy();
    callback(false);
  });
}
