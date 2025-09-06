// ========================================================
// n8n Function/Code Node - Complete Implementation
// WezaPost Curated Content Pipeline
// ========================================================
// 
// Purpose: Transform LLM-generated content into WezaPost-ready format
// Input: LLM API responses with JSON content in text field
// Output: Sanitized, Twitter-optimized posts ready for webhook
//
// Usage in n8n:
// 1. Add this code to a Function node or Code node
// 2. Connect after your LLM/AI content generation node
// 3. Connect output to HTTP Request node pointing to WezaPost webhook
// ========================================================

/**
 * Sanitizes and normalizes curated post data for WezaPost
 * Ensures Twitter compliance and data integrity
 */
function sanitize(obj) {
  // Initialize required arrays with safe defaults
  obj.hashtags = Array.isArray(obj.hashtags) ? obj.hashtags : [];
  obj.images = Array.isArray(obj.images) ? obj.images : [];
  obj.platforms = Array.isArray(obj.platforms) ? obj.platforms : ['twitter'];
  
  // Initialize required objects with safe defaults
  obj.metadata = typeof obj.metadata === 'object' && obj.metadata !== null ? obj.metadata : {};
  obj.scheduling = typeof obj.scheduling === 'object' && obj.scheduling !== null ? obj.scheduling : { 
    suggested_time: new Date().toISOString(), 
    optimal_platforms: ['twitter'] 
  };

  // Clean up metadata fields
  if (typeof obj.metadata.source_url !== 'string') obj.metadata.source_url = '';
  if (obj.metadata.source_url.trim() === '=' || obj.metadata.source_url.trim() === '') {
    obj.metadata.source_url = '';
  }
  
  // Ensure metadata has required fields
  if (!obj.metadata.content_type) obj.metadata.content_type = 'tip';
  if (!obj.metadata.priority) obj.metadata.priority = 'normal';
  if (!Array.isArray(obj.metadata.topics)) obj.metadata.topics = [];

  // Ensure workflow identification
  if (!obj.workflow_id) obj.workflow_id = 'wezalabs_twitter_curator_v1';
  if (!obj.source_type) obj.source_type = 'n8n';

  // Image handling - ensure at least one image exists
  if (obj.images.length === 0) {
    obj.images = [{
      url: 'https://cdn.wezalabs.com/social/fallback-1200x675.png',
      alt_text: 'WezaLabs social media post',
      caption: 'WezaLabs Content'
    }];
  } else {
    // Normalize existing image data
    const img = obj.images[0];
    obj.images[0] = {
      url: String(img.url || 'https://cdn.wezalabs.com/social/fallback-1200x675.png'),
      alt_text: String(img.alt_text || 'WezaLabs social media post'),
      caption: img.caption ? String(img.caption) : undefined
    };
  }

  // Links handling - process if present
  obj.links = Array.isArray(obj.links) ? obj.links.map(link => ({
    url: String(link.url || ''),
    title: String(link.title || ''),
    description: String(link.description || ''),
    domain: link.url ? extractDomain(link.url) : ''
  })).filter(link => link.url) : [];

  // Content and hashtag processing
  if (typeof obj.content !== 'string') obj.content = '';
  
  // Extract hashtags from content if hashtags array is empty
  if (obj.hashtags.length === 0) {
    const hashtagMatches = obj.content.match(/#\w+/g);
    if (hashtagMatches) {
      obj.hashtags = hashtagMatches;
    }
  }
  
  // Process hashtags
  const hashtagTail = obj.hashtags
    .filter(h => typeof h === 'string' && h.startsWith('#'))
    .join(' ')
    .trim();

  // Smart content and hashtag management
  let content = obj.content.trim();
  
  // Check if hashtags are already at the end of content
  const contentHasTags = hashtagTail && content.endsWith(hashtagTail);
  
  // If hashtags aren't at the end, append them (but avoid duplication)
  if (!contentHasTags && hashtagTail) {
    // Remove hashtags from middle of content to avoid duplication
    const contentWithoutHashtags = content.replace(/#\w+/g, '').replace(/\s+/g, ' ').trim();
    content = `${contentWithoutHashtags} ${hashtagTail}`.trim();
  }

  // Twitter character limit enforcement (280 chars)
  const MAX_CHARS = 280;
  if (content.length > MAX_CHARS) {
    console.log(`⚠️ Content too long (${content.length} chars), trimming to ${MAX_CHARS}`);
    
    let main = content;
    let tail = '';
    
    // Try to preserve hashtags at the end
    if (hashtagTail) {
      const hashtagIndex = content.lastIndexOf(` ${hashtagTail}`);
      if (hashtagIndex > -1) {
        main = content.slice(0, hashtagIndex);
        tail = ` ${hashtagTail}`;
      }
    }
    
    // Calculate available space for main content
    const reserveSpace = tail.length;
    const allowedMainLength = Math.max(0, MAX_CHARS - reserveSpace);
    
    // Trim main content, preferring word boundaries
    let trimmedMain = main.slice(0, allowedMainLength);
    const lastSpaceIndex = trimmedMain.lastIndexOf(' ');
    
    // If we can trim at a word boundary and still have reasonable length, do it
    if (allowedMainLength > 30 && lastSpaceIndex > allowedMainLength * 0.7) {
      trimmedMain = trimmedMain.slice(0, lastSpaceIndex);
    }
    
    content = `${trimmedMain}${tail}`.trim();
  }
  
  obj.content = content;

  console.log(`✅ Sanitized post: ${content.length} chars, ${obj.hashtags.length} hashtags, ${obj.images.length} images`);
  return obj;
}

/**
 * Extract domain from URL safely
 */
function extractDomain(url) {
  try {
    return new URL(url).hostname;
  } catch (e) {
    return '';
  }
}

/**
 * Main processing function
 * Handles multiple input formats and structures
 */
function processItems(items) {
  return items.map((item, i) => {
    const src = item.json || {};
    let rawContent;
    
    console.log(`🔄 Processing item ${i + 1}/${items.length}`);
    
    // Handle different input structures
    
    // 1. LLM API response structure: response.generations[0][0].text
    if (src.response && src.response.generations && Array.isArray(src.response.generations)) {
      const generations = src.response.generations;
      if (generations.length > 0 && Array.isArray(generations[0]) && generations[0].length > 0) {
        const firstGeneration = generations[0][0];
        if (firstGeneration && typeof firstGeneration.text === 'string') {
          rawContent = firstGeneration.text;
          console.log(`📥 Found LLM response structure`);
        }
      }
    }
    
    // 2. Direct output field (legacy support)
    else if (src.output) {
      rawContent = src.output;
      console.log(`📥 Found output field`);
    }
    
    // 3. Direct object with content (already parsed)
    else if (typeof src === 'object' && src.content) {
      rawContent = src;
      console.log(`📥 Found direct object`);
    }
    
    // 4. Alternative LLM structures
    else if (src.text && typeof src.text === 'string') {
      rawContent = src.text;
      console.log(`📥 Found text field`);
    }
    
    // Error if no valid structure found
    if (!rawContent) {
      const availableKeys = Object.keys(src);
      throw new Error(`Item ${i + 1}: No parsable content found. Available keys: ${availableKeys.join(', ')}. Expected: response.generations[0][0].text, output, or direct object with content.`);
    }

    // Parse JSON if content is a string
    let parsed;
    if (typeof rawContent === 'string') {
      try {
        parsed = JSON.parse(rawContent);
        console.log(`✅ Successfully parsed JSON string`);
      } catch (e) {
        console.log(`❌ JSON parse error: ${e.message}`);
        console.log(`Raw content preview: ${rawContent.substring(0, 200)}...`);
        throw new Error(`Item ${i + 1}: Failed to parse content as JSON. ${e.message}`);
      }
    } else if (typeof rawContent === 'object') {
      parsed = rawContent;
      console.log(`✅ Using direct object`);
    } else {
      throw new Error(`Item ${i + 1}: Invalid content type: ${typeof rawContent}`);
    }

    // Validate essential fields
    if (!parsed.content || typeof parsed.content !== 'string') {
      throw new Error(`Item ${i + 1}: Missing or invalid 'content' field`);
    }

    // Sanitize and format
    const formatted = sanitize(parsed);
    
    console.log(`🎯 Formatted item ${i + 1}: "${formatted.content.substring(0, 50)}..."`);
    
    return { json: formatted };
  });
}

// ========================================================
// MAIN EXECUTION
// ========================================================

try {
  console.log(`🚀 Starting WezaPost content processing...`);
  console.log(`📊 Input items: ${items.length}`);
  
  if (items.length === 0) {
    console.log(`⚠️ No items to process`);
    return [];
  }
  
  const processedItems = processItems(items);
  
  console.log(`✅ Successfully processed ${processedItems.length} items`);
  console.log(`🎉 Ready for WezaPost webhook!`);
  
  return processedItems;
  
} catch (error) {
  console.error(`❌ Processing failed: ${error.message}`);
  throw error;
}

// ========================================================
// USAGE NOTES:
// ========================================================
// 
// 1. Place this code in an n8n Function node or Code node
// 2. Ensure it runs after your LLM/content generation node
// 3. Connect the output to an HTTP Request node with:
//    - URL: https://api-dev.benjimbugua.com/api/webhooks/n8n/curated-posts
//    - Method: POST
//    - Headers: 
//      * Content-Type: application/json
//      * x-api-key: wezapost_n8n_secure_key_2024
//    - Body: Send Body As JSON (n8n will use the json field)
//
// 4. The processed items will appear in WezaPost dashboard
//    under "Curated Posts" tab for review and scheduling
// 
// ========================================================