/**
 * Open Graph Meta Tags Handler (Node.js)
 * 
 * This service detects social media bots and serves pre-rendered HTML
 * with dynamic Open Graph meta tags. It's backend-agnostic and can work
 * with any data source (Supabase, REST API, database, etc.)
 * 
 * Runs on port 3000, nginx proxies bot requests to this service
 */

const http = require('http');
const { createClient } = require('@supabase/supabase-js');

const SOCIAL_BOT_USER_AGENTS = [
  'facebookexternalhit',
  'Facebot',
  'Twitterbot',
  'LinkedInBot',
  'WhatsApp',
  'TelegramBot',
  'Slackbot',
  'Pinterest',
  'Discordbot',
  'SkypeUriPreview',
];

function isSocialMediaBot(userAgent) {
  if (!userAgent) return false;
  const ua = userAgent.toLowerCase();
  return SOCIAL_BOT_USER_AGENTS.some(bot => ua.includes(bot.toLowerCase()));
}

/**
 * Extract userCode from URL path
 * Examples:
 * - /abc123 -> abc123
 * - /abc123/contact -> abc123
 * - /abc123/group123 -> abc123
 */
function extractUserCode(pathname) {
  const parts = pathname.split('/').filter(p => p);
  return parts.length > 0 ? parts[0] : null;
}

/**
 * Parse profile image JSON to get image URL
 */
function parseProfileImage(profileImageJson) {
  if (!profileImageJson) return '';
  
  try {
    const parsed = JSON.parse(profileImageJson);
    return parsed.imageUrl || '';
  } catch {
    // Backward compatibility - if it's just a URL string
    if (profileImageJson && (profileImageJson.startsWith('data:image') || profileImageJson.startsWith('http'))) {
      return profileImageJson;
    }
  }
  return '';
}

/**
 * Fetch business card data from backend
 * This function can be modified to use any backend (Supabase, REST API, etc.)
 */
async function fetchBusinessCardMeta(userCode) {
  try {
    // Construct Supabase URL from project ID or use direct URL
    let supabaseUrl = process.env.SUPABASE_URL;
    if (!supabaseUrl && process.env.VITE_SUPABASE_PROJECT_ID) {
      supabaseUrl = `https://${process.env.VITE_SUPABASE_PROJECT_ID}.supabase.co`;
    }
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn('[OG Handler] Missing Supabase credentials');
      return null;
    }
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Fetch business card
    const { data: cardData, error } = await supabase
      .from('business_cards')
      .select('name, title, company_name, avatar_url, custom_fields')
      .eq('user_code', userCode)
      .maybeSingle();
    
    if (error || !cardData) {
      console.warn('[OG Handler] Failed to fetch business card:', error?.message);
      return null;
    }
    
    // Extract profile image - prefer avatar_url, fallback to custom_fields
    let avatarUrl = cardData.avatar_url || '';
    
    if (!avatarUrl) {
      const customFields = cardData.custom_fields || {};
      const profileImageJson = customFields.profileImage || '';
      avatarUrl = parseProfileImage(profileImageJson);
    }
    
    return {
      name: cardData.name || '',
      title: cardData.title || '',
      companyName: cardData.company_name || '',
      avatarUrl: avatarUrl,
    };
  } catch (error) {
    console.error('[OG Handler] Error fetching business card:', error);
    return null;
  }
}

/**
 * Generate meta HTML with dynamic or fallback data
 */
function generateMetaHTML(url, meta) {
  const ownerName = meta?.name || '';
  const title = meta?.title || '';
  const companyName = meta?.companyName || '';
  const avatarUrl = meta?.avatarUrl || '';
  
  // Build description: "Company - Title" format
  let description = 'Contact AI';
  if (companyName && title) {
    description = `${companyName} - ${title}`;
  } else if (companyName) {
    description = companyName;
  } else if (title) {
    description = title;
  }
  
  // Build page title: "Owner Name | Contact AI"
  const pageTitle = ownerName ? `${ownerName} | Contact AI` : 'Contact AI';
  
  // Build image tag only if avatarUrl exists
  const imageTags = avatarUrl 
    ? `<meta property="og:image" content="${avatarUrl}">
  <meta property="twitter:image" content="${avatarUrl}">`
    : '';
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  
  <!-- Primary Meta Tags -->
  <title>${pageTitle}</title>
  <meta name="title" content="${pageTitle}">
  <meta name="description" content="${description}">
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="${url}">
  <meta property="og:title" content="${pageTitle}">
  <meta property="og:description" content="${description}">
  <meta property="og:site_name" content="Contact AI">
  ${imageTags}
  
  <!-- Twitter -->
  <meta property="twitter:card" content="summary_large_image">
  <meta property="twitter:url" content="${url}">
  <meta property="twitter:title" content="${pageTitle}">
  <meta property="twitter:description" content="${description}">
  
  <meta http-equiv="refresh" content="0;url=${url}">
</head>
<body>
  <p>Redirecting to Contact AI...</p>
  <script>window.location.href = "${url}";</script>
</body>
</html>`;
}

// Create HTTP server
const server = http.createServer(async (req, res) => {
  const userAgent = req.headers['user-agent'] || '';
  
  // Reconstruct full URL from headers (nginx passes these)
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost';
  const fullUrl = `${protocol}://${host}${req.url}`;
  
  // Check if request is from social media bot
  if (isSocialMediaBot(userAgent)) {
    console.log(`[OG Handler] Social bot detected: ${userAgent}`);
    
    // Try to extract userCode and fetch dynamic data
    const userCode = extractUserCode(new URL(fullUrl).pathname);
    let meta = null;
    
    if (userCode && userCode !== 'myclik') {
      // Fetch business card data for dynamic meta tags
      meta = await fetchBusinessCardMeta(userCode);
      console.log(`[OG Handler] Fetched meta for ${userCode}:`, {
        hasName: !!meta?.name,
        hasAvatar: !!meta?.avatarUrl,
      });
    }
    
    // Serve pre-rendered HTML with OG meta tags
    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
    });
    res.end(generateMetaHTML(fullUrl, meta));
    return;
  }
  
  // For regular users, return 404 (nginx will handle the request)
  res.writeHead(404);
  res.end('Not found');
});

const PORT = process.env.OG_HANDLER_PORT || 3000;
server.listen(PORT, () => {
  console.log(`[OG Handler] Server running on port ${PORT}`);
});
