/**
 * Open Graph Meta Tags Handler
 * 
 * This Edge Function detects social media bots (Facebook, Twitter, LinkedIn, etc.)
 * and serves pre-rendered HTML with correct Open Graph meta tags.
 * 
 * For regular users, it proxies to the main app.
 */

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

function generateMetaHTML(url: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  
  <!-- Primary Meta Tags -->
  <title>CLIK DIGITAL BUSINESS CARD</title>
  <meta name="title" content="CLIK DIGITAL BUSINESS CARD">
  <meta name="description" content="Digital business card platform by CLIK JSC">
  <meta name="author" content="CLIK JSC">
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="${url}">
  <meta property="og:title" content="CLIK DIGITAL BUSINESS CARD">
  <meta property="og:description" content="Digital business card platform by CLIK JSC">
  <meta property="og:site_name" content="CLIK">
  
  <!-- Twitter -->
  <meta property="twitter:card" content="summary_large_image">
  <meta property="twitter:url" content="${url}">
  <meta property="twitter:title" content="CLIK DIGITAL BUSINESS CARD">
  <meta property="twitter:description" content="Digital business card platform by CLIK JSC">
  
  <!-- LinkedIn -->
  <meta property="og:image" content="https://clik.id/og-image.png">
  <meta property="twitter:image" content="https://clik.id/og-image.png">
  
  <meta http-equiv="refresh" content="0;url=${url}">
</head>
<body>
  <p>Redirecting to CLIK Digital Business Card...</p>
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
    
    // Serve pre-rendered HTML with OG meta tags
    return new Response(generateMetaHTML(url.toString()), {
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
