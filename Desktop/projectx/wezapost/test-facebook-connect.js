// Test Facebook connection debugging
const { SocialProviderManager } = require('./src/lib/social-providers.ts')

async function testFacebookConnect() {
  const manager = new SocialProviderManager()
  
  const testAccountData = {
    platform: 'facebook',
    platform_user_id: '123456789',
    username: 'testuser',
    display_name: 'Test User',
    access_token: 'test_token_123',
    expires_at: new Date(Date.now() + 60 * 24 * 3600 * 1000).toISOString()
  }
  
  console.log('Testing connectAccount method...')
  console.log('Input data:', testAccountData)
  
  try {
    const result = await manager.connectAccount('test-user-id', testAccountData)
    console.log('Result:', result)
  } catch (error) {
    console.error('Error:', error)
  }
}

testFacebookConnect()