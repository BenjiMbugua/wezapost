// n8n Function node - Updated for LLM API response structure
// INPUT: items like [{ json: { response: { generations: [[{ text: "{...stringified JSON...}" }]] } } }]
// OUTPUT: items where each item.json is a valid object ready to POST via HTTP Request (Send Body As: JSON)

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

  // Ensure one image object exists to satisfy downstream schema (if receiver expects it)
  if (obj.images.length === 0) {
    obj.images = [{
      url: 'https://cdn.wezalabs.com/social/fallback-1200x675.png',
      alt_text: 'Minimal social card for WezaLabs post',
      caption: 'WezaLabs'
    }];
  } else {
    // Normalize required fields of the first image
    const img = obj.images[0];
    obj.images[0] = {
      url: String(img.url || ''),
      alt_text: String(img.alt_text || 'Social card image'),
      caption: img.caption != null ? String(img.caption) : undefined
    };
  }

  // Ensure hashtags appear at end of content; and content ≤ 280 chars
  if (typeof obj.content !== 'string') obj.content = '';
  const hashtagTail = (obj.hashtags || []).filter(h => typeof h === 'string' && h.startsWith('#')).join(' ').trim();

  // If hashtags are not already at the end, append them once
  const contentHasTags = hashtagTail && obj.content.endsWith(hashtagTail);
  let content = contentHasTags ? obj.content : (hashtagTail ? `${obj.content} ${hashtagTail}`.trim() : obj.content);

  // Enforce 280 chars (Twitter limit). Preserve ending hashtags if possible.
  const MAX = 280;
  if (content.length > MAX) {
    // Try to keep hashtags intact: trim the main text portion before hashtags.
    let main = content;
    let tail = '';
    if (hashtagTail) {
      const idx = content.lastIndexOf(` ${hashtagTail}`);
      if (idx > -1) {
        main = content.slice(0, idx);
        tail = ` ${hashtagTail}`;
      }
    }
    // Reserve space for tail
    const reserve = tail.length;
    const allowedMain = Math.max(0, MAX - reserve);
    // Soft trim main to nearest boundary
    let trimmedMain = main.slice(0, allowedMain);
    // avoid cutting in middle of a word if possible
    const lastSpace = trimmedMain.lastIndexOf(' ');
    if (allowedMain > 20 && lastSpace > 0) trimmedMain = trimmedMain.slice(0, lastSpace);
    content = `${trimmedMain}${reserve ? tail : ''}`.trim();
  }
  obj.content = content;

  // Add links support back (since WezaPost can handle them)
  obj.links = Array.isArray(obj.links) ? obj.links.map(link => ({
    url: String(link.url || ''),
    title: String(link.title || ''),
    description: String(link.description || ''),
    domain: link.url ? new URL(link.url).hostname : ''
  })) : [];

  return obj;
}

return items.map((item, i) => {
  const src = item.json || {};
  
  // Handle LLM API response structure
  let raw;
  
  // Check for LLM API response structure: response.generations[0][0].text
  if (src.response && src.response.generations && Array.isArray(src.response.generations)) {
    const generations = src.response.generations;
    if (generations.length > 0 && Array.isArray(generations[0]) && generations[0].length > 0) {
      const firstGeneration = generations[0][0];
      if (firstGeneration && typeof firstGeneration.text === 'string') {
        raw = firstGeneration.text;
      }
    }
  }
  // Fallback to original logic
  else if (src.output) {
    raw = src.output;
  }
  // Direct object
  else if (typeof src === 'object' && src.content) {
    raw = src;
  }
  
  if (!raw) {
    throw new Error(`Item ${i}: No parsable content found. Expected response.generations[0][0].text or output field.`);
  }

  // Parse JSON if it's a string
  let parsed;
  if (typeof raw === 'string') {
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      throw new Error(`Item ${i}: Failed to parse content as JSON. ${e.message}`);
    }
  } else if (typeof raw === 'object') {
    parsed = raw;
  } else {
    throw new Error(`Item ${i}: Invalid content type: ${typeof raw}`);
  }

  const formatted = sanitize(parsed);

  return { json: formatted };
});