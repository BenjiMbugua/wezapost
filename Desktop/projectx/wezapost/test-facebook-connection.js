#!/usr/bin/env node

/**
 * Facebook App Connection Test Script
 * 
 * This script helps verify your Facebook app setup and test the connection.
 * Run with: node test-facebook-connection.js
 */

const https = require('https');
const http = require('http');

// Configuration - Update these with your actual values
const CONFIG = {
  FACEBOOK_CLIENT_ID: '1027224232372211', // From your Meta dashboard
  FACEBOOK_CLIENT_SECRET: process.env.FACEBOOK_CLIENT_SECRET || 'YOUR_APP_SECRET_HERE',
  REDIRECT_URI: 'http://localhost:3000/api/social/facebook/callback',
  NEXTAUTH_URL: 'http://localhost:3000'
};

console.log('🔧 Facebook App Connection Test');
console.log('================================\n');

// Test 1: Check environment variables
console.log('1. Environment Variables Check:');
console.log(`   Facebook Client ID: ${CONFIG.FACEBOOK_CLIENT_ID ? '✅ Set' : '❌ Missing'}`);
console.log(`   Facebook Client Secret: ${CONFIG.FACEBOOK_CLIENT_SECRET !== 'YOUR_APP_SECRET_HERE' ? '✅ Set' : '❌ Missing'}`);
console.log(`   Redirect URI: ${CONFIG.REDIRECT_URI}`);
console.log(`   NextAuth URL: ${CONFIG.NEXTAUTH_URL}\n`);

// Test 2: Validate Facebook App ID format
console.log('2. Facebook App ID Validation:');
const appIdRegex = /^\d{15,16}$/;
if (appIdRegex.test(CONFIG.FACEBOOK_CLIENT_ID)) {
  console.log(`   ✅ App ID format is valid: ${CONFIG.FACEBOOK_CLIENT_ID}`);
} else {
  console.log(`   ❌ Invalid App ID format: ${CONFIG.FACEBOOK_CLIENT_ID}`);
}
console.log('');

// Test 3: Generate OAuth URL
console.log('3. OAuth URL Generation:');
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

console.log(`   ✅ OAuth URL generated successfully`);
console.log(`   URL: ${oauthUrl.toString()}\n`);

// Test 4: Check if development server is running
console.log('4. Development Server Check:');
checkServer('http://localhost:3000', (isRunning) => {
  if (isRunning) {
    console.log('   ✅ Development server is running on localhost:3000');
  } else {
    console.log('   ❌ Development server is not running');
    console.log('   💡 Start it with: npm run dev');
  }
  console.log('');

  // Test 5: Check API endpoints
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

  // Test 6: Required permissions check
  console.log('6. Required Permissions Checklist:');
  console.log('   📋 You need to request these permissions in Meta App Dashboard:');
  console.log('      - pages_manage_posts (Post to pages)');
  console.log('      - pages_read_engagement (Read page data)');
  console.log('      - pages_show_list (Access page list)');
  console.log('      - business_management (Business Manager access)');
  console.log('      - instagram_basic (Basic Instagram access)');
  console.log('      - instagram_content_publish (Publish to Instagram)');
  console.log('');

  // Test 7: Prerequisites checklist
  console.log('7. Prerequisites Checklist:');
  console.log('   📋 Before posting will work, ensure you have:');
  console.log('      □ Facebook Business Manager Account');
  console.log('      □ At least one Facebook Page');
  console.log('      □ Instagram Business Account connected to Facebook Page');
  console.log('      □ App permissions approved (may require business verification)');
  console.log('');

  // Final instructions
  console.log('🎯 Next Steps:');
  console.log('   1. Set your Facebook App Secret in .env.local');
  console.log('   2. Add OAuth redirect URIs to your Facebook app settings');
  console.log('   3. Request required permissions in App Review');
  console.log('   4. Test the connection at: http://localhost:3000/test-facebook-instagram-setup.html');
  console.log('   5. Connect your Facebook Page and Instagram Business Account');
  console.log('');
  console.log('📚 For detailed setup instructions, see: FACEBOOK_APP_SETUP_GUIDE.md');
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
