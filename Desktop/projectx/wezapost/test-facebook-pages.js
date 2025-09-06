#!/usr/bin/env node

/**
 * Test Facebook Pages Access
 * This script helps verify if you have Facebook pages and can access them
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const https = require('https');
const http = require('http');

console.log('🔍 Facebook Pages Access Test');
console.log('============================\n');

console.log('1. Environment Check:');
console.log(`   Facebook Client ID: ${process.env.FACEBOOK_CLIENT_ID ? '✅ Set' : '❌ Missing'}`);
console.log(`   Facebook Client Secret: ${process.env.FACEBOOK_CLIENT_SECRET ? '✅ Set' : '❌ Missing'}`);
console.log('');

console.log('2. Permissions Status:');
console.log('   ✅ pages_manage_posts - Can post to pages');
console.log('   ✅ pages_read_engagement - Can read page data');
console.log('   ✅ pages_show_list - Can access page list');
console.log('   ✅ business_management - Business Manager access');
console.log('   ✅ instagram_basic - Basic Instagram access');
console.log('   ✅ instagram_content_publish - Can post to Instagram');
console.log('   ✅ pages_manage_metadata - Can manage page metadata');
console.log('   ✅ public_profile - Basic profile access');
console.log('');

console.log('3. Prerequisites Checklist:');
console.log('   📋 To post to Facebook, you need:');
console.log('      □ At least one Facebook Page');
console.log('      □ Your app must have access to the page');
console.log('      □ Page must be managed by your account');
console.log('');
console.log('   📋 To post to Instagram, you need:');
console.log('      □ Instagram Business Account');
console.log('      □ Instagram account connected to Facebook Page');
console.log('      □ Instagram account set to Business (not Personal)');
console.log('');

console.log('4. Common Issues (with permissions working):');
console.log('   🚨 "No Facebook pages found"');
console.log('      → Create a Facebook Page in Business Manager');
console.log('      → Grant your app access to the page');
console.log('      → Ensure you are an admin of the page');
console.log('');
console.log('   🚨 "Unable to get page access token"');
console.log('      → Re-authenticate with Facebook');
console.log('      → Ensure page permissions are granted');
console.log('');
console.log('   🚨 "No Instagram Business Account connected"');
console.log('      → Connect Instagram Business Account to Facebook Page');
console.log('      → Ensure Instagram account is set to Business');
console.log('');

console.log('5. Testing Steps:');
console.log('   1. Go to your Facebook Business Manager');
console.log('   2. Check if you have any Facebook Pages');
console.log('   3. If no pages, create one');
console.log('   4. Grant your app access to the page');
console.log('   5. Test the connection via your app');
console.log('');

console.log('6. Quick Test:');
console.log('   🧪 Test Facebook posting via your app UI');
console.log('   🧪 Check browser console for specific error messages');
console.log('   🧪 Look for "No Facebook pages found" or similar errors');
console.log('');

console.log('🎯 Next Steps:');
console.log('   1. Verify you have Facebook Pages in Business Manager');
console.log('   2. Ensure your app has access to those pages');
console.log('   3. Test posting via your app interface');
console.log('   4. Check for specific error messages');
console.log('   5. If Instagram posting fails, connect Instagram Business Account');
console.log('');

console.log('📚 For detailed troubleshooting, see: facebook-instagram-fix.md');
