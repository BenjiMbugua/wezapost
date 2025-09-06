// ========================================================
// n8n Function Node - FIXED VERSION (Returns Single Object)
// For HTTP Request Node compatibility
// ========================================================

function sanitize(obj) {
  // Ensure required top-level keys exist with sane defaults
  obj.hashtags = Array.isArray(obj.hashtags) ? obj.hashtags : [];
  obj.images = Array.isArray(obj.images) ? obj.images : [];
  obj.platforms = Array.isArray(obj.platforms) ? obj.platforms : ['twitter'];
  obj.metadata = typeof obj.metadata === 'object' && obj.metadata !== null ? obj.metadata : {};
  obj.scheduling = typeof obj.scheduling === 'object' && obj.scheduling !== null ? obj.scheduling : { suggested_time: new Date().toISOString(), optimal_platforms: ['twitter'] };

  // Fix metadata.source_url placeholder like "=" → ""
  if (typeof obj.metadata.source_url !== 'string') obj.metadata.source_url = '';
  if (obj.metadata.source_url.trim() === '=') obj.metadata.source_url = '';

  // Ensure workflow identification
  if (!obj.workflow_id) obj.workflow_id = 'wezalabs_twitter_curator_v1';
  if (!obj.source_type) obj.source_type = 'n8n';

  // Ensure one image object exists
  if (obj.images.length === 0) {
    obj.images = [{
      url: 'https://cdn.wezalabs.com/social/fallback-1200x675.png',
      alt_text: 'WezaLabs social media post',
      caption: 'WezaLabs'
    }];
  } else {
    const img = obj.images[0];
    obj.images[0] = {
      url: String(img.url || ''),
      alt_text: String(img.alt_text || 'Social card image'),
      caption: img.caption != null ? String(img.caption) : undefined
    };
  }

  // Content and hashtag processing
  if (typeof obj.content !== 'string') obj.content = '';
  const hashtagTail = (obj.hashtags || []).filter(h => typeof h === 'string' && h.startsWith('#')).join(' ').trim();

  // Smart content management
  const contentHasTags = hashtagTail && obj.content.endsWith(hashtagTail);
  let content = contentHasTags ? obj.content : (hashtagTail ? `${obj.content} ${hashtagTail}`.trim() : obj.content);

  // Twitter character limit (280 chars)
  const MAX = 280;
  if (content.length > MAX) {
    let main = content;
    let tail = '';
    if (hashtagTail) {
      const idx = content.lastIndexOf(` ${hashtagTail}`);
      if (idx > -1) {
        main = content.slice(0, idx);
        tail = ` ${hashtagTail}`;
      }
    }
    const reserve = tail.length;
    const allowedMain = Math.max(0, MAX - reserve);
    let trimmedMain = main.slice(0, allowedMain);
    const lastSpace = trimmedMain.lastIndexOf(' ');
    if (allowedMain > 20 && lastSpace > 0) trimmedMain = trimmedMain.slice(0, lastSpace);
    content = `${trimmedMain}${reserve ? tail : ''}`.trim();
  }
  obj.content = content;

  // Add links support
  obj.links = Array.isArray(obj.links) ? obj.links : [];

  return obj;
}

// MAIN PROCESSING - RETURN SINGLE ITEM FOR HTTP REQUEST NODE
try {
  console.log(`🚀 Processing ${items.length} items for WezaPost webhook`);
  
  if (items.length === 0) {
    throw new Error('No items to process');
  }

  // Process first item only (HTTP Request node expects single object)
  const item = items[0];
  const src = item.json || {};
  
  let raw;
  
  // Handle LLM API response structure: response.generations[0][0].text
  if (src.response && src.response.generations && Array.isArray(src.response.generations)) {
    const generations = src.response.generations;
    if (generations.length > 0 && Array.isArray(generations[0]) && generations[0].length > 0) {
      const firstGeneration = generations[0][0];
      if (firstGeneration && typeof firstGeneration.text === 'string') {
        raw = firstGeneration.text;
      }
    }
  }
  // Fallback to other structures
  else if (src.output) {
    raw = src.output;
  }
  else if (src.content) {
    raw = src;
  }
  
  if (!raw) {
    throw new Error('No parsable content found in item');
  }

  // Parse JSON if string
  let parsed;
  if (typeof raw === 'string') {
    parsed = JSON.parse(raw);
  } else {
    parsed = raw;
  }

  if (!parsed.content || typeof parsed.content !== 'string') {
    throw new Error('Missing or invalid content field');
  }

  const formatted = sanitize(parsed);
  
  console.log(`✅ Processed: "${formatted.content.substring(0, 50)}..."`);
  console.log(`📊 Length: ${formatted.content.length} chars, ${formatted.hashtags.length} hashtags`);
  
  // CRITICAL: Return array with single item for n8n compatibility
  // But the HTTP Request node will send just the object inside
  return [{ json: formatted }];

} catch (error) {
  console.error(`❌ Error: ${error.message}`);
  throw error;
}