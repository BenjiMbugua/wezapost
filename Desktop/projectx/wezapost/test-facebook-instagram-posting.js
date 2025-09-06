#!/usr/bin/env node

/**
 * Facebook & Instagram Posting Diagnostic Script
 * This script helps identify why posting to real accounts is failing
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const https = require('https');
const http = require('http');

// Configuration
const CONFIG = {
  FACEBOOK_CLIENT_ID: process.env.FACEBOOK_CLIENT_ID,
  FACEBOOK_CLIENT_SECRET: process.env.FACEBOOK_CLIENT_SECRET,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000'
};

console.log('🔧 Facebook & Instagram Posting Diagnostic');
console.log('==========================================\n');

// Test 1: Environment Variables
console.log('1. Environment Variables Check:');
console.log(`   Facebook Client ID: ${CONFIG.FACEBOOK_CLIENT_ID ? '✅ Set' : '❌ Missing'}`);
console.log(`   Facebook Client Secret: ${CONFIG.FACEBOOK_CLIENT_SECRET ? '✅ Set' : '❌ Missing'}`);
console.log(`   NextAuth URL: ${CONFIG.NEXTAUTH_URL}\n`);

// Test 2: Development Server
console.log('2. Development Server Check:');
checkServer('http://localhost:3000', (isRunning) => {
  if (isRunning) {
    console.log('   ✅ Development server is running');
  } else {
    console.log('   ❌ Development server is not running');
  }
  console.log('');

  // Test 3: API Endpoints
  console.log('3. API Endpoints Check:');
  checkEndpoint('http://localhost:3000/api/posts', (isAvailable) => {
    if (isAvailable) {
      console.log('   ✅ Posts API endpoint is available');
    } else {
      console.log('   ❌ Posts API endpoint is not available');
    }
  });

  checkEndpoint('http://localhost:3000/api/social/facebook/connect', (isAvailable) => {
    if (isAvailable) {
      console.log('   ✅ Facebook connect endpoint is available');
    } else {
      console.log('   ❌ Facebook connect endpoint is not available');
    }
  });

  checkEndpoint('http://localhost:3000/api/social/instagram/connect', (isAvailable) => {
    if (isAvailable) {
      console.log('   ✅ Instagram connect endpoint is available');
    } else {
      console.log('   ❌ Instagram connect endpoint is not available');
    }
  });
  console.log('');

  // Test 4: Facebook App Configuration
  console.log('4. Facebook App Configuration:');
  console.log(`   App ID: ${CONFIG.FACEBOOK_CLIENT_ID}`);
  console.log(`   App Mode: Development (needs to be Live for production)`);
  console.log('   Required Permissions:');
  console.log('      - pages_manage_posts (CRITICAL for posting)');
  console.log('      - pages_read_engagement');
  console.log('      - pages_show_list');
  console.log('      - business_management');
  console.log('      - instagram_basic');
  console.log('      - instagram_content_publish (CRITICAL for Instagram)');
  console.log('');

  // Test 5: Prerequisites Checklist
  console.log('5. Prerequisites Checklist:');
  console.log('   📋 Before posting will work, ensure you have:');
  console.log('      □ Facebook Business Manager Account');
  console.log('      □ At least one Facebook Page');
  console.log('      □ Instagram Business Account connected to Facebook Page');
  console.log('      □ App permissions approved in App Review');
  console.log('      □ Business verification completed (if required)');
  console.log('');

  // Test 6: Common Issues
  console.log('6. Common Issues & Solutions:');
  console.log('   🚨 "No Facebook pages found"');
  console.log('      → Create a Facebook Page in Business Manager');
  console.log('      → Grant your app access to the page');
  console.log('');
  console.log('   🚨 "Missing required Facebook page permissions"');
  console.log('      → Request pages_manage_posts permission in App Review');
  console.log('      → Ensure business verification is complete');
  console.log('');
  console.log('   🚨 "No Instagram Business Account connected"');
  console.log('      → Connect Instagram Business Account to Facebook Page');
  console.log('      → Ensure Instagram account is set to Business (not Personal)');
  console.log('');
  console.log('   🚨 "Instagram requires at least one media item"');
  console.log('      → Always include media URLs for Instagram posts');
  console.log('      → Ensure media URLs are publicly accessible');
  console.log('');

  // Test 7: Quick Tests
  console.log('7. Quick Tests:');
  console.log('   🧪 Test Facebook posting:');
  console.log('      curl -X POST http://localhost:3000/api/posts \\');
  console.log('        -H "Content-Type: application/json" \\');
  console.log('        -d \'{"content": "Test post", "platforms": ["facebook"]}\'');
  console.log('');
  console.log('   🧪 Test Instagram posting:');
  console.log('      curl -X POST http://localhost:3000/api/posts \\');
  console.log('        -H "Content-Type: application/json" \\');
  console.log('        -d \'{"content": "Test post", "platforms": ["instagram"], "media_urls": ["https://example.com/image.jpg"]}\'');
  console.log('');

  // Final Status
  console.log('🎯 Current Status:');
  if (CONFIG.FACEBOOK_CLIENT_ID && CONFIG.FACEBOOK_CLIENT_SECRET) {
    console.log('   ✅ Environment variables are configured');
    console.log('   ⚠️  App permissions need to be requested and approved');
    console.log('   ⚠️  Instagram Business Account needs to be connected');
  } else {
    console.log('   ❌ Environment variables are missing');
  }
  console.log('');

  console.log('🚀 Next Steps:');
  console.log('   1. Request Facebook app permissions in App Review');
  console.log('   2. Connect Instagram Business Account to Facebook Page');
  console.log('   3. Test posting with simple content first');
  console.log('   4. Check error messages and fix specific issues');
  console.log('');
  console.log('📚 For detailed fixes, see: facebook-instagram-fix.md');
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
