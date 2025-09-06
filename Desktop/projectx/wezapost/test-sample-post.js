/**
 * Sample Twitter Post Creator for WezaPost
 * 
 * This script demonstrates how to create sample posts for testing
 * the WezaPost social media management system.
 */

// Sample Twitter posts to use for testing
const samplePosts = [
  {
    content: "🚀 Just launched my new social media management setup with WezaPost! \n\nThe OAuth credential wizard makes connecting accounts super easy - no more .env file editing! \n\n#SocialMedia #Automation #WebDev",
    platforms: ['twitter'],
    category: 'product-launch'
  },
  {
    content: "🎯 Testing the new scheduling features! \n\nLove how WezaPost handles multiple platforms seamlessly. The demo mode is perfect for development testing.\n\n#ProductivityHack #SaaS #TechTools",
    platforms: ['twitter'],
    category: 'feature-highlight'
  },
  {
    content: "💡 Pro tip: Always test your social media integrations in demo mode first! \n\nWezaPost makes it easy to validate your posting flow before going live.\n\n#DevTips #SocialMediaStrategy",
    platforms: ['twitter'],
    category: 'pro-tip'
  },
  {
    content: "🔥 The future of social media management is here! \n\n✅ User-friendly OAuth setup\n✅ Multi-platform posting  \n✅ Smart scheduling\n✅ Demo mode for testing\n\nTry WezaPost today! 🚀",
    platforms: ['twitter'],
    category: 'feature-list'
  },
  {
    content: "Building something cool? 🛠️\n\nOur new social media automation tools can help you:\n• Schedule posts across platforms\n• Manage multiple accounts\n• Track engagement\n\nBootstrap your social presence! 💪",
    platforms: ['twitter'],
    category: 'value-prop'
  }
];

// Utility functions for post creation
const utils = {
  // Get character count for different platforms
  getCharacterCount: (content, platform) => {
    const limits = {
      twitter: 280,
      linkedin: 3000,
      facebook: 63206,
      instagram: 2200
    };
    return {
      current: content.length,
      limit: limits[platform] || 280,
      remaining: (limits[platform] || 280) - content.length
    };
  },

  // Validate post content for platform
  validatePost: (content, platform) => {
    const charInfo = utils.getCharacterCount(content, platform);
    
    return {
      isValid: charInfo.remaining >= 0,
      characterInfo: charInfo,
      warnings: charInfo.remaining < 0 ? [`Content exceeds ${platform} character limit`] : []
    };
  },

  // Format post for display
  formatPost: (post, index) => {
    const validation = utils.validatePost(post.content, 'twitter');
    
    return `
📝 Sample Post #${index + 1} (${post.category})
${'-'.repeat(50)}
${post.content}
${'-'.repeat(50)}
Platforms: ${post.platforms.join(', ')}
Characters: ${validation.characterInfo.current}/${validation.characterInfo.limit}
Status: ${validation.isValid ? '✅ Valid' : '❌ Too long'}
${validation.warnings.length > 0 ? `Warnings: ${validation.warnings.join(', ')}` : ''}
`;
  },

  // Generate timestamp for scheduling
  getFutureTimestamp: (minutesFromNow = 5) => {
    const future = new Date();
    future.setMinutes(future.getMinutes() + minutesFromNow);
    return future.toISOString();
  }
};

// Instructions for using the sample posts
const instructions = `
🐦 WEZAPOST SAMPLE POST CREATOR
${'='.repeat(50)}

To create a sample Twitter post:

1. 🌐 Open WezaPost Dashboard:
   http://localhost:3001/dashboard

2. 🔗 Connect Social Media Account:
   - Go to "Social Media" section
   - Click "Connect" for Twitter
   - Use demo mode (instant) or configure real OAuth

3. ✍️  Create Post:
   - Navigate to "Create Post" section
   - Copy any sample content below
   - Select Twitter as platform
   - Choose immediate or scheduled posting

4. 🚀 Publish:
   - Click "Publish Now" for immediate posting
   - Or set date/time and click "Schedule Post"

SAMPLE POSTS:
${samplePosts.map(utils.formatPost).join('\n')}

💡 TESTING SCENARIOS:

A) Demo Mode Test:
   - Use demo Twitter account
   - Post immediately
   - Check localStorage for saved posts
   - Verify simulated publishing results

B) Scheduled Post Test:
   - Schedule post for 5 minutes from now
   - Watch Redis queue processing
   - Check post status updates

C) Multi-Platform Test:
   - Connect multiple demo accounts (Twitter + LinkedIn)
   - Post to multiple platforms simultaneously
   - Compare platform-specific handling

🔧 ADVANCED TESTING:

1. Character Limit Testing:
   - Try posts near 280 character limit
   - Test character counting accuracy
   - Verify validation warnings

2. OAuth Integration Testing:
   - Set up real Twitter app credentials
   - Test actual OAuth flow
   - Post real tweets (be careful!)

3. Error Handling Testing:
   - Test with no internet connection
   - Try posting without selected platforms
   - Test empty content submission

🎯 EXPECTED RESULTS:

Demo Mode:
✅ Instant account connection
✅ Simulated posting (no real tweets)
✅ localStorage persistence
✅ Full UI functionality testing

Real OAuth Mode:
✅ Real Twitter authorization
✅ Actual tweet posting
✅ Database persistence
✅ Production-ready functionality

Happy testing! 🎉
`;

// Export for use in browser console or Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { samplePosts, utils, instructions };
} else if (typeof window !== 'undefined') {
  window.WezaPostSamples = { samplePosts, utils, instructions };
}

// Display instructions when run directly
console.log(instructions);