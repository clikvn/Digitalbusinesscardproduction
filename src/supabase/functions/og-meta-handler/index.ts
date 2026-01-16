/**
 * Open Graph Meta Tags Handler
 * 
 * This Edge Function detects social media bots (Facebook, Twitter, LinkedIn, etc.)
 * and serves pre-rendered HTML with correct Open Graph meta tags.
 * 
 * For regular users, it proxies to the main app.
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';

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

function isSocialMediaBot(userAgent: string): boolean {
  const ua = userAgent.toLowerCase();
  return SOCIAL_BOT_USER_AGENTS.some(bot => ua.includes(bot.toLowerCase()));
}

interface BusinessCardMeta {
  name: string;
  title: string;
  companyName: string;
  avatarUrl: string;
}

/**
 * Extract userCode from URL path
 * Examples:
 * - /abc123 -> abc123
 * - /abc123/contact -> abc123
 * - /abc123/group123 -> abc123
 * - /abc123/group123/contact -> abc123
 */
function extractUserCode(pathname: string): string | null {
  // Remove leading slash and split
  const parts = pathname.split('/').filter(p => p);
  // First part is always userCode (if exists)
  return parts.length > 0 ? parts[0] : null;
}

/**
 * Parse profile image JSON to get image URL
 */
function parseProfileImage(profileImageJson: string | null): string {
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
 * Fetch business card data from Supabase
 */
async function fetchBusinessCardMeta(userCode: string): Promise<BusinessCardMeta | null> {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn('[OG Handler] Missing Supabase credentials');
      return null;
    }
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Fetch business card
    const { data: cardData, error } = await supabase
      .from('business_cards')
      .select('name, title, company_name, custom_fields')
      .eq('user_code', userCode)
      .maybeSingle();
    
    if (error || !cardData) {
      console.warn('[OG Handler] Failed to fetch business card:', error?.message);
      return null;
    }
    
    // Extract profile image from custom_fields
    const customFields = cardData.custom_fields || {};
    const profileImageJson = customFields.profileImage || '';
    const avatarUrl = parseProfileImage(profileImageJson);
    
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
function generateMetaHTML(url: string, meta?: BusinessCardMeta | null): string {
  // Use dynamic data if available, otherwise use defaults
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
  
  // Build image tag only if avatarUrl exists (no fallback - matches DynamicMetaTags behavior)
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

Deno.serve(async (req: Request) => {
  const userAgent = req.headers.get('user-agent') || '';
  const url = new URL(req.url);
  
  // Check if request is from social media bot
  if (isSocialMediaBot(userAgent)) {
    console.log(`Social bot detected: ${userAgent}`);
    
    // Try to extract userCode and fetch dynamic data
    const userCode = extractUserCode(url.pathname);
    let meta: BusinessCardMeta | null = null;
    
    if (userCode && userCode !== 'myclik') {
      // Fetch business card data for dynamic meta tags
      meta = await fetchBusinessCardMeta(userCode);
      console.log(`[OG Handler] Fetched meta for ${userCode}:`, {
        hasName: !!meta?.name,
        hasAvatar: !!meta?.avatarUrl,
      });
    }
    
    // Serve pre-rendered HTML with OG meta tags (dynamic or fallback)
    return new Response(generateMetaHTML(url.toString(), meta), {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });
  }
  
  // For regular users, proxy to main app
  // This assumes your main app is deployed at the root
  return new Response(null, {
    status: 302,
    headers: {
      'Location': url.pathname + url.search,
    },
  });
});
