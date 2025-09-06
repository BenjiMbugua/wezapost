#!/usr/bin/env node

/**
 * Quick OAuth Setup Helper
 * Helps validate and test OAuth credentials
 */

const fs = require('fs');
const path = require('path');

console.log('🔐 WezaPost OAuth Setup Helper\n');

// Read current .env.local
const envPath = path.join(__dirname, '.env.local');

function readEnvFile() {
    try {
        const content = fs.readFileSync(envPath, 'utf8');
        const env = {};
        
        content.split('\n').forEach(line => {
            const [key, ...valueParts] = line.split('=');
            if (key && valueParts.length > 0) {
                env[key] = valueParts.join('=').replace(/"/g, '');
            }
        });
        
        return env;
    } catch (error) {
        console.log('❌ Error reading .env.local file');
        return {};
    }
}

function validateOAuthConfig() {
    const env = readEnvFile();
    
    console.log('📋 Current OAuth Configuration Status:\n');
    
    const providers = [
        { name: 'Google', clientId: 'GOOGLE_CLIENT_ID', clientSecret: 'GOOGLE_CLIENT_SECRET' },
        { name: 'Twitter', clientId: 'TWITTER_CLIENT_ID', clientSecret: 'TWITTER_CLIENT_SECRET' },
        { name: 'LinkedIn', clientId: 'LINKEDIN_CLIENT_ID', clientSecret: 'LINKEDIN_CLIENT_SECRET' },
        { name: 'Facebook', clientId: 'FACEBOOK_CLIENT_ID', clientSecret: 'FACEBOOK_CLIENT_SECRET' }
    ];
    
    let configuredCount = 0;
    
    providers.forEach(provider => {
        const hasClientId = env[provider.clientId] && !env[provider.clientId].includes('your_');
        const hasClientSecret = env[provider.clientSecret] && !env[provider.clientSecret].includes('your_');
        const isConfigured = hasClientId && hasClientSecret;
        
        if (isConfigured) configuredCount++;
        
        console.log(`${provider.name}:`);
        console.log(`  Client ID: ${hasClientId ? '✅ Configured' : '❌ Using placeholder'}`);
        console.log(`  Client Secret: ${hasClientSecret ? '✅ Configured' : '❌ Using placeholder'}`);
        console.log(`  Status: ${isConfigured ? '🟢 Ready for OAuth' : '🟡 Needs configuration'}\n`);
    });
    
    console.log(`📊 Summary: ${configuredCount}/${providers.length} providers configured\n`);
    
    if (configuredCount === 0) {
        console.log('🚀 Next Steps:');
        console.log('1. Start with Google OAuth (easiest):');
        console.log('   → Go to https://console.cloud.google.com/');
        console.log('   → Create OAuth 2.0 credentials');
        console.log('   → Set redirect URI: http://localhost:3001/api/auth/callback/google');
        console.log('   → Update GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env.local\n');
        
        console.log('2. Test the setup:');
        console.log('   → Restart your dev server: npm run dev');
        console.log('   → Go to: http://localhost:3001/auth/signin');
        console.log('   → Try "Continue with Google"');
    } else if (configuredCount < providers.length) {
        console.log('🎯 You have some providers configured!');
        console.log('Configure remaining providers using the OAuth Setup Guide.');
    } else {
        console.log('🎉 All providers configured! You can now:');
        console.log('→ Sign in with any provider at http://localhost:3001/auth/signin');
        console.log('→ Connect your real social media accounts');
        console.log('→ Create and publish posts to your accounts');
    }
    
    return configuredCount > 0;
}

function generateCallbackUrls() {
    console.log('\n🔗 OAuth Callback URLs (copy these exactly):');
    console.log('Google: http://localhost:3001/api/auth/callback/google');
    console.log('Twitter: http://localhost:3001/api/auth/callback/twitter');
    console.log('LinkedIn: http://localhost:3001/api/auth/callback/linkedin');
    console.log('Facebook: http://localhost:3001/api/auth/callback/facebook\n');
}

function showQuickGoogleSetup() {
    console.log('⚡ Quick Google OAuth Setup:');
    console.log('1. Go to: https://console.cloud.google.com/apis/credentials');
    console.log('2. Click "Create Credentials" → "OAuth 2.0 Client IDs"');
    console.log('3. Application type: Web application');
    console.log('4. Authorized redirect URIs: http://localhost:3001/api/auth/callback/google');
    console.log('5. Copy Client ID and Client Secret to .env.local');
    console.log('6. Restart server and test!\n');
}

// Main execution
validateOAuthConfig();
generateCallbackUrls();
showQuickGoogleSetup();

console.log('📖 For detailed setup instructions, see: OAUTH_SETUP_GUIDE.md');
console.log('🔧 Need help? The setup guide has troubleshooting steps for common issues.');