# OG Handler Server

This Node.js service handles social media bot requests and serves pre-rendered HTML with dynamic Open Graph meta tags.

## How It Works

1. **Nginx detects social media bots** (Facebook, Twitter, LinkedIn, etc.) via User-Agent
2. **Nginx proxies bot requests** to this Node.js service (port 3000)
3. **Node.js service**:
   - Extracts `userCode` from the URL
   - Fetches business card data from Supabase (or any backend)
   - Generates HTML with dynamic meta tags
   - Returns pre-rendered HTML to the bot

## Backend Agnostic

The `fetchBusinessCardMeta()` function can be easily modified to use:
- REST API endpoints
- Direct database connections
- GraphQL APIs
- Any other data source

Just replace the Supabase client code with your preferred backend.

## Environment Variables

The service uses these environment variables (passed from Cloud Run):
- `VITE_SUPABASE_PROJECT_ID` - Supabase project ID
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_URL` - Direct Supabase URL (optional, will be constructed from project ID if not provided)
- `SUPABASE_ANON_KEY` - Alternative env var name for Supabase key

## Deployment

The service runs automatically via `supervisord` in the Docker container alongside nginx.
