# Dynamic Open Graph Meta Tags Setup

## Overview

This solution provides dynamic Open Graph meta tags for social media sharing without depending on Supabase Edge Functions. It's **backend-agnostic** and can work with any data source.

## Architecture

```
Facebook Bot Request
    ↓
Nginx (port 8080)
    ↓ (detects bot via User-Agent)
    ↓ (proxies to Node.js)
Node.js OG Handler (port 3000)
    ↓ (fetches data from Supabase/any backend)
    ↓ (generates HTML with meta tags)
Returns pre-rendered HTML to bot
```

## Components

### 1. Node.js OG Handler (`server/og-handler.js`)
- Detects social media bots
- Fetches business card data from backend
- Generates HTML with dynamic meta tags
- Runs on port 3000

### 2. Nginx Configuration (`nginx.conf`)
- Detects social media bots via User-Agent
- Proxies bot requests to Node.js service
- Serves static files for regular users

### 3. Dockerfile
- Runs both nginx and Node.js via `supervisord`
- Both services run in the same container

## How It Works

1. **Social media bot** (Facebook, LinkedIn, etc.) requests a URL
2. **Nginx** detects the bot via User-Agent header
3. **Nginx proxies** the request to Node.js OG handler
4. **Node.js service**:
   - Extracts `userCode` from URL path
   - Fetches business card data from Supabase
   - Generates HTML with personalized meta tags
   - Returns pre-rendered HTML

## Environment Variables

The Node.js service needs these environment variables (passed from Cloud Run):

- `VITE_SUPABASE_PROJECT_ID` - Supabase project ID
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key

Or alternatively:
- `SUPABASE_URL` - Direct Supabase URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key

## Making It Backend-Agnostic

To switch from Supabase to another backend, modify the `fetchBusinessCardMeta()` function in `server/og-handler.js`:

```javascript
async function fetchBusinessCardMeta(userCode) {
  // Replace Supabase code with:
  // - REST API call
  // - Direct database connection
  // - GraphQL query
  // - Any other data source
}
```

## Testing

1. **Test locally:**
   ```bash
   # Start Node.js service
   node server/og-handler.js
   
   # Test with curl (simulating Facebook bot)
   curl -H "User-Agent: facebookexternalhit/1.1" http://localhost:3000/UHAN98
   ```

2. **Test on Facebook:**
   - Go to https://developers.facebook.com/tools/debug/
   - Enter your URL: `https://www.clik.id/UHAN98`
   - Click "Scrape Again"
   - Should see dynamic meta tags

## Deployment

The solution is already integrated into the Dockerfile. Just deploy as normal:

```bash
docker build --build-arg VITE_SUPABASE_PROJECT_ID=... --build-arg VITE_SUPABASE_ANON_KEY=... -t your-image .
```

Both nginx and Node.js will start automatically via supervisor.

## Benefits

✅ **No Supabase dependency** - Can switch backends anytime  
✅ **Works with Cloud Run** - No need for Supabase Edge Functions  
✅ **Backend-agnostic** - Easy to migrate to different data sources  
✅ **Automatic bot detection** - Nginx handles routing  
✅ **Same container** - Both services run together efficiently  
