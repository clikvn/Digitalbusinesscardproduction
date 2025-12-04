# Edge Functions (DISABLED)

⚠️ **These Edge Functions are disabled and not deployed.**

## Background

During development, we encountered persistent 403 deployment errors with Supabase Edge Functions. After investigation, we refactored the entire backend architecture to use:

- **Direct Supabase client calls** from the frontend
- **Row Level Security (RLS) policies** for authorization
- **Database functions (RPC)** for complex operations

This approach provides:
- ✅ Better performance (no cold starts)
- ✅ Simpler deployment (no Edge Functions needed)
- ✅ More reliable (no 403 errors)
- ✅ Easier to maintain (all logic in `/lib/api.ts`)

## Configuration

Edge Functions are disabled in `/supabase/config.toml`:

```toml
[functions]
enabled = false
```

## Files in This Directory

The files in this directory are kept for reference only and are NOT deployed:
- `server/index.tsx` - Legacy Edge Function (unused)
- `server/kv_store.tsx` - Legacy KV store (unused)

## Migration Guide

All functionality previously in Edge Functions has been moved to:
- `/lib/api.ts` - API client with direct Supabase calls
- `/lib/supabase-client.ts` - Supabase client configuration
- `/supabase/migrations/` - Database schema and RLS policies
