/**
 * Node.js Server for Cloud Run
 * 
 * Handles:
 * - Social media bot detection and pre-rendered HTML with dynamic OG tags
 * - Static file serving for regular users (SPA)
 */

import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFile } from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

// Supabase configuration
const SUPABASE_PROJECT_ID = process.env.VITE_SUPABASE_PROJECT_ID || process.env.SUPABASE_PROJECT_ID;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_PROJECT_ID || !SUPABASE_ANON_KEY) {
  console.error('[Server] Missing Supabase credentials');
  console.error('[Server] VITE_SUPABASE_PROJECT_ID:', process.env.VITE_SUPABASE_PROJECT_ID ? 'SET' : 'MISSING');
  console.error('[Server] SUPABASE_PROJECT_ID:', process.env.SUPABASE_PROJECT_ID ? 'SET' : 'MISSING');
  console.error('[Server] VITE_SUPABASE_ANON_KEY:', process.env.VITE_SUPABASE_ANON_KEY ? 'SET' : 'MISSING');
  console.error('[Server] SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? 'SET' : 'MISSING');
  console.error('[Server] All env vars:', Object.keys(process.env).filter(k => k.includes('SUPABASE')));
  process.exit(1);
}

const supabaseUrl = `https://${SUPABASE_PROJECT_ID}.supabase.co`;
const supabase = createClient(supabaseUrl, SUPABASE_ANON_KEY);

// Social media bot user agents
// Note: 'Zalo' is excluded - only ZaloBot and ZaloPreviewBot are actual bots
// Zalo's in-app browser contains 'Zalo' in user agent but should receive the full SPA
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
  'ZaloBot',
  'ZaloPreviewBot',
  'Applebot',
  'Googlebot',
  'Bingbot',
];

function isSocialMediaBot(userAgent) {
  if (!userAgent) return false;
  const ua = userAgent.toLowerCase();
  return SOCIAL_BOT_USER_AGENTS.some(bot => ua.includes(bot.toLowerCase()));
}

/**
 * Parse URL to extract userCode and groupCode
 * Routes:
 * - /:userCode
 * - /:userCode/:groupCode
 * - /:userCode/:groupCode/:contactCode
 * - /:userCode/:groupCode/:contactCode/:screen (contact|profile|portfolio)
 * - /:userCode/:groupCode/:screen
 */
function parseProfileUrl(pathname) {
  // Remove leading/trailing slashes and split
  const parts = pathname.split('/').filter(p => p);
  
  if (parts.length === 0) return null;
  
  const userCode = parts[0];
  
  // Check if second part is a screen (contact, profile, portfolio) or groupCode
  const screens = ['contact', 'profile', 'portfolio', 'studio', 'auth'];
  const isScreen = parts[1] && screens.includes(parts[1]);
  
  if (isScreen) {
    // Format: /:userCode/:screen
    return { userCode, groupCode: null, screen: parts[1] };
  }
  
  if (parts.length >= 2) {
    const groupCode = parts[1];
    
    if (parts.length >= 3) {
      const thirdPart = parts[2];
      if (screens.includes(thirdPart)) {
        // Format: /:userCode/:groupCode/:screen
        return { userCode, groupCode, screen: thirdPart };
      } else {
        // Format: /:userCode/:groupCode/:contactCode or /:userCode/:groupCode/:contactCode/:screen
        const contactCode = thirdPart;
        const screen = parts[3] && screens.includes(parts[3]) ? parts[3] : null;
        return { userCode, groupCode, contactCode, screen };
      }
    }
    
    // Format: /:userCode/:groupCode
    return { userCode, groupCode, screen: null };
  }
  
  // Format: /:userCode
  return { userCode, groupCode: null, screen: null };
}

/**
 * Fetch business card data from Supabase
 */
async function fetchBusinessCardData(userCode) {
  try {
    // Fetch business card
    const { data: cardData, error: cardError } = await supabase
      .from('business_cards')
      .select('*')
      .eq('user_code', userCode)
      .maybeSingle();

    if (cardError) {
      console.error('[Server] Error fetching card:', cardError);
      return null;
    }

    if (!cardData) {
      return null;
    }

    // Check if user exists
    const { data: ownershipData } = await supabase
      .from('user_code_ownership')
      .select('user_id')
      .eq('user_code', userCode)
      .maybeSingle();

    if (!ownershipData) {
      return null;
    }

    // Check employee status (if applicable)
    const { data: employeeStatus } = await supabase
      .rpc('check_employee_status', { p_user_id: ownershipData.user_id });

    if (employeeStatus && employeeStatus.is_active === false) {
      return null; // Deactivated employee
    }

    return cardData;
  } catch (error) {
    console.error('[Server] Error in fetchBusinessCardData:', error);
    return null;
  }
}

/**
 * Generate OG meta tags HTML
 */
function generateMetaHTML(url, cardData, userCode, protocol, host) {
  // Use BASE_URL env var if set, otherwise construct from request
  const baseUrl = process.env.BASE_URL || `${protocol}://${host}`;
  
  // Default values
  let title = 'Contact AI - Digital Business Card';
  let description = 'Digital business card platform';
  let image = `${baseUrl}/og-image.png`; // Default OG image
  let siteName = 'Contact AI';

  // Use card data if available
  if (cardData) {
    const name = cardData.name || 'Business Card';
    const titleText = cardData.title || '';
    const bio = cardData.bio || '';
    const company = cardData.company_name || '';
    
    title = `${name}${titleText ? ` - ${titleText}` : ''}${company ? ` at ${company}` : ''}`;
    description = bio || `${name}'s digital business card${company ? ` at ${company}` : ''}`;
    
    // Use avatar or background image if available
    if (cardData.avatar_url) {
      image = cardData.avatar_url;
    } else if (cardData.background_image_url) {
      image = cardData.background_image_url;
    }
  }

  // Ensure image URL is absolute
  if (image && !image.startsWith('http')) {
    image = image.startsWith('/') ? `${baseUrl}${image}` : `${baseUrl}/${image}`;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  
  <!-- Primary Meta Tags -->
  <title>${escapeHtml(title)}</title>
  <meta name="title" content="${escapeHtml(title)}">
  <meta name="description" content="${escapeHtml(description)}">
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="${escapeHtml(url)}">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:image" content="${escapeHtml(image)}">
  <meta property="og:site_name" content="${escapeHtml(siteName)}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  
  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="${escapeHtml(url)}">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${escapeHtml(image)}">
  
  <!-- Redirect to actual page -->
  <meta http-equiv="refresh" content="0;url=${escapeHtml(url)}">
</head>
<body>
  <p>Redirecting...</p>
  <script>window.location.href = "${escapeHtml(url)}";</script>
</body>
</html>`;
}

function escapeHtml(text) {
  if (!text) return '';
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

/**
 * Inject meta tags into existing index.html
 */
function injectMetaTagsIntoHTML(html, metaTags) {
  // Find the head tag and inject meta tags before closing </head>
  return html.replace('</head>', `${metaTags}\n</head>`);
}

// Health check endpoint (must be before catch-all route)
app.get('/health', (req, res) => {
  res.status(200).send('healthy\n');
});

// Serve static files
const staticDir = join(__dirname, 'build');
app.use(express.static(staticDir, {
  maxAge: '1y',
  etag: true,
  lastModified: true,
}));

// Bot detection middleware
app.get('*', async (req, res) => {
  const userAgent = req.get('user-agent') || '';
  const isBot = isSocialMediaBot(userAgent);
  const fullUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;

  // If not a bot, serve the SPA normally
  if (!isBot) {
    // Serve index.html for SPA routing
    const indexPath = join(staticDir, 'index.html');
    try {
      const indexHtml = await readFile(indexPath, 'utf-8');
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.send(indexHtml);
    } catch (error) {
      console.error('[Server] Error reading index.html:', error);
      return res.status(500).send('Internal Server Error');
    }
  }

  // Bot detected - generate dynamic meta tags
  console.log(`[Server] Bot detected: ${userAgent}`);
  console.log(`[Server] URL: ${fullUrl}`);

  // Parse URL to extract userCode
  const urlInfo = parseProfileUrl(req.path);
  
  if (!urlInfo || !urlInfo.userCode) {
    // No userCode in URL, serve default index.html
    const indexPath = join(staticDir, 'index.html');
    try {
      const indexHtml = await readFile(indexPath, 'utf-8');
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.send(indexHtml);
    } catch (error) {
      console.error('[Server] Error reading index.html:', error);
      return res.status(500).send('Internal Server Error');
    }
  }

  // Fetch business card data
  const cardData = await fetchBusinessCardData(urlInfo.userCode);

  // Generate meta tags HTML
  const metaHTML = generateMetaHTML(fullUrl, cardData, urlInfo.userCode, req.protocol, req.get('host'));

  // Set cache headers (1 hour for bots)
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  
  return res.send(metaHTML);
});

// Start server
app.listen(PORT, () => {
  console.log(`[Server] Listening on port ${PORT}`);
  console.log(`[Server] Supabase URL: ${supabaseUrl}`);
  console.log(`[Server] Static files from: ${staticDir}`);
});
