// Script to restore Twitter/X connection to database
const crypto = require('crypto');

// Your Google user ID
const googleUserId = '112219501326656947225';

// Generate deterministic UUID from Google user ID (same logic as in social-providers.ts)
function generateDeterministicUUID(userId) {
    const hash = crypto.createHash('sha256').update(userId).digest('hex');
    
    const uuid = [
        hash.slice(0, 8),
        hash.slice(8, 12),
        '4' + hash.slice(13, 16),
        ((parseInt(hash.slice(16, 17), 16) & 0x3) | 0x8).toString(16) + hash.slice(17, 20),
        hash.slice(20, 32)
    ].join('-');
    
    return uuid;
}

const userUuid = generateDeterministicUUID(googleUserId);
console.log('Google User ID:', googleUserId);
console.log('Generated UUID:', userUuid);

// SQL to insert Twitter account
const insertSQL = `
-- Insert profile (if not exists)
INSERT INTO public.profiles (id, email, full_name, avatar_url, created_at, updated_at)
VALUES (
    '${userUuid}',
    'benji@wezalabs.com',
    'Benji mbugua',
    'https://ui-avatars.com/api/?name=Benji+mbugua',
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert Twitter account
INSERT INTO public.social_accounts (
    user_id,
    platform,
    platform_user_id,
    username,
    display_name,
    avatar_url,
    access_token,
    refresh_token,
    is_active,
    settings,
    created_at,
    updated_at
) VALUES (
    '${userUuid}',
    'twitter',
    '1765613846763536384',
    'Wezalabstech',
    'wezalabs tech',
    'https://ui-avatars.com/api/?name=Wezalabstech&background=1da1f2',
    '1765613846763536384-PcyxtKi8L5N4nQXQPfcNrhsWD2e0Pt',
    'SrXhBBU8Oh0tq5dUnvRGlruiZv8VPyHVUAnK8qxdM1WML',
    true,
    '{"auto_post": true, "default_visibility": "public", "custom_hashtags": ["#twitter"]}'::jsonb,
    NOW(),
    NOW()
) ON CONFLICT (user_id, platform, platform_user_id) DO UPDATE SET
    access_token = EXCLUDED.access_token,
    refresh_token = EXCLUDED.refresh_token,
    is_active = true,
    updated_at = NOW();
`;

console.log('\n--- SQL to run in Supabase dashboard ---');
console.log(insertSQL);
console.log('--- End SQL ---\n');