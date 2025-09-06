#!/usr/bin/env node

/**
 * Test Facebook OAuth URL Generation
 * This script verifies that the correct Facebook App ID is being used
 */

// Simulate the OAuth URL generation from your code
const FACEBOOK_CLIENT_ID = process.env.FACEBOOK_CLIENT_ID || '1027224232372211';
const REDIRECT_URI = 'http://localhost:3000/api/social/facebook/callback';

console.log('🔧 Testing Facebook OAuth URL Generation');
console.log('========================================\n');

console.log('1. Environment Check:');
console.log(`   Facebook Client ID: ${FACEBOOK_CLIENT_ID}`);
console.log(`   Redirect URI: ${REDIRECT_URI}\n`);

// Generate OAuth URL (same logic as in your connect route)
const facebookAuthUrl = new URL('https://www.facebook.com/v18.0/dialog/oauth');
const params = {
  client_id: FACEBOOK_CLIENT_ID,
  redirect_uri: REDIRECT_URI,
  scope: [
    'pages_manage_posts',        // Post to pages
    'pages_read_engagement',     // Read page data
    'pages_show_list',          // Access page list
    'business_management',       // Business Manager access
    'instagram_basic',          // Basic Instagram access
    'instagram_content_publish' // Publish to Instagram
  ].join(','),
  response_type: 'code',
  state: 'test-user-id', // Pass user ID as state for security
};

// Add parameters to URL
Object.entries(params).forEach(([key, value]) => {
  facebookAuthUrl.searchParams.set(key, value);
});

console.log('2. Generated OAuth URL:');
console.log(`   ${facebookAuthUrl.toString()}\n`);

console.log('3. URL Analysis:');
console.log(`   Client ID in URL: ${facebookAuthUrl.searchParams.get('client_id')}`);
console.log(`   Redirect URI: ${facebookAuthUrl.searchParams.get('redirect_uri')}`);
console.log(`   Scopes: ${facebookAuthUrl.searchParams.get('scope')}\n`);

console.log('4. Validation:');
if (facebookAuthUrl.searchParams.get('client_id') === '1027224232372211') {
  console.log('   ✅ Correct Facebook App ID is being used');
} else {
  console.log('   ❌ Wrong App ID detected');
}

if (facebookAuthUrl.searchParams.get('redirect_uri') === REDIRECT_URI) {
  console.log('   ✅ Correct redirect URI is set');
} else {
  console.log('   ❌ Wrong redirect URI detected');
}

console.log('\n🎯 Next Steps:');
console.log('   1. Copy the OAuth URL above');
console.log('   2. Open it in your browser');
console.log('   3. Test the Facebook signup flow');
console.log('   4. Check if the "Invalid App ID" error is resolved');
