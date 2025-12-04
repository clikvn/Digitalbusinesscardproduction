# Analytics Storage Issue - Events Sent But Not Saved

## ✅ What's Working
- Client-side tracking ✅
- Event batching ✅
- Network requests to RPC function ✅

## ❌ What's Not Working
- Events not appearing in database ❌

---

## 🔍 Step 1: Check the RPC Response

In the **Network tab**, click on the `ingest_analytics_batch` request and check the **Response** tab.

### Expected Response:
```json
{
  "success": true,
  "processed": 10,
  "sessions_inserted": 7,
  "page_views_inserted": 2,
  "clicks_inserted": 1
}
```

### If you see an error:
```json
{
  "success": false,
  "error": "..."
}
```

**The error message will tell us exactly what's wrong.**

---

## 🐛 Common Issues & Solutions

### Issue 1: Permission Denied

**Error Message:**
```json
{
  "message": "permission denied for function ingest_analytics_batch"
}
```

**Solution:**
Run this in your Supabase SQL Editor:

```sql
-- Grant execute permission to anonymous users
GRANT EXECUTE ON FUNCTION ingest_analytics_batch TO anon, authenticated;

-- Verify the grant
SELECT 
  grantee, 
  privilege_type 
FROM information_schema.routine_privileges 
WHERE routine_name = 'ingest_analytics_batch';

-- Should return 2 rows:
-- anon | EXECUTE
-- authenticated | EXECUTE
```

---

### Issue 2: Function Not Found

**Error Message:**
```json
{
  "message": "function ingest_analytics_batch(jsonb) does not exist"
}
```

**Solution:**
The function exists but might not have the correct signature. Check if it accepts `jsonb`:

```sql
-- Check function signature
SELECT 
  proname as function_name,
  proargtypes::regtype[] as argument_types,
  pronargs as num_arguments
FROM pg_proc 
WHERE proname = 'ingest_analytics_batch';

-- Should return:
-- function_name: ingest_analytics_batch
-- argument_types: {jsonb}
-- num_arguments: 1
```

If the signature is wrong, redeploy migration 020:

```bash
supabase db push
```

---

### Issue 3: RLS Blocking Inserts

**Error Message:**
```json
{
  "success": false,
  "error": "new row violates row-level security policy"
}
```

**Solution:**
The RPC function should have `SECURITY DEFINER` which bypasses RLS. Verify:

```sql
-- Check if function has SECURITY DEFINER
SELECT 
  proname,
  prosecdef as is_security_definer
FROM pg_proc 
WHERE proname = 'ingest_analytics_batch';

-- prosecdef should be: true
```

If it's `false`, recreate the function with `SECURITY DEFINER`:

```sql
DROP FUNCTION IF EXISTS ingest_analytics_batch(jsonb);

-- Then run migration 020 again
```

---

### Issue 4: Tables Don't Exist

**Error Message:**
```json
{
  "success": false,
  "error": "relation \"analytics_sessions\" does not exist"
}
```

**Solution:**
Analytics tables haven't been created. Check if they exist:

```sql
-- Check if analytics tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE 'analytics_%'
ORDER BY table_name;

-- Should return:
-- analytics_clicks
-- analytics_daily_click_targets
-- analytics_daily_contact_stats
-- analytics_daily_group_stats
-- analytics_daily_page_stats
-- analytics_daily_user_stats
-- analytics_events
-- analytics_page_views
-- analytics_sessions
```

If tables are missing, run migration 004:

```bash
supabase db push
```

Or manually run `/supabase/migrations/004_analytics_scalable_schema.sql`

---

### Issue 5: Foreign Key Constraint Violation

**Error Message:**
```json
{
  "success": false,
  "error": "violates foreign key constraint \"fk_page_views_session\""
}
```

**Solution:**
This means you have the OLD version of the RPC function (before migration 020).

Migration 020 fixes this by processing events in order (sessions → page_views → clicks).

**Apply the fix:**

```bash
supabase db push
```

Or manually run `/supabase/migrations/020_fix_analytics_batch_ordering.sql`

---

### Issue 6: Invalid Page Type

**Error Message:**
```json
{
  "success": false,
  "error": "invalid page type"
}
```

**Cause:**
The RPC function validates `pageType` must be one of: `home`, `contact`, `profile`, `portfolio`.

But your client is sending something else (e.g., `page.home` instead of `home`).

**Check the network payload:**
```json
{
  "type": "page_view",
  "data": {
    "pageType": "page.home"  // ❌ Should be "home"
  }
}
```

**This is the issue!** The client is sending `page.home` but the RPC expects `home`.

**Solution - Fix in `/utils/analytics.ts`:**

Find line 77 and check if it's removing the `page.` prefix:

```typescript
export function trackPageView(
  userCode: string,
  shareCode: string,
  page: 'page.home' | 'page.contact' | 'page.profile' | 'page.portfolio',
  contactId?: string
): void {
  const sessionId = getOrCreateSessionId(userCode, shareCode);
  const pageType = page.replace('page.', ''); // ✅ This should exist
  analyticsBatcher.trackPageView(sessionId, userCode, shareCode, pageType, contactId);
}
```

If that line is missing, the RPC function will reject the page views because `page.home` is not a valid page type.

---

## 🔧 Quick Debug Script

Run this in your **Supabase SQL Editor** to diagnose everything:

```sql
-- ================================================
-- ANALYTICS DIAGNOSTIC SCRIPT
-- ================================================

-- 1. Check if function exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'ingest_analytics_batch') THEN
    RAISE NOTICE '✅ Function ingest_analytics_batch exists';
  ELSE
    RAISE NOTICE '❌ Function ingest_analytics_batch NOT FOUND';
  END IF;
END $$;

-- 2. Check function signature
SELECT 
  proname as function_name,
  pg_get_functiondef(oid) as definition
FROM pg_proc 
WHERE proname = 'ingest_analytics_batch'
LIMIT 1;

-- 3. Check if SECURITY DEFINER is set
SELECT 
  proname,
  CASE WHEN prosecdef THEN '✅ SECURITY DEFINER' ELSE '❌ NOT SECURITY DEFINER' END as security
FROM pg_proc 
WHERE proname = 'ingest_analytics_batch';

-- 4. Check permissions
SELECT 
  grantee, 
  privilege_type 
FROM information_schema.routine_privileges 
WHERE routine_name = 'ingest_analytics_batch'
ORDER BY grantee;

-- 5. Check if analytics tables exist
SELECT 
  table_name,
  '✅ EXISTS' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'analytics_sessions',
    'analytics_page_views', 
    'analytics_clicks'
  )
ORDER BY table_name;

-- 6. Test the function with valid data
SELECT ingest_analytics_batch('[
  {
    "type": "session",
    "data": {
      "sessionId": "test_session_001",
      "userCode": "UHAN98",
      "shareCode": "123AAA",
      "contactId": null,
      "timestamp": 1764740621184,
      "userAgent": "Test",
      "referrer": ""
    },
    "timestamp": 1764740621184
  },
  {
    "type": "page_view",
    "data": {
      "sessionId": "test_session_001",
      "userCode": "UHAN98",
      "shareCode": "123AAA",
      "contactId": null,
      "pageType": "home",
      "timestamp": 1764740621185
    },
    "timestamp": 1764740621185
  }
]'::jsonb);

-- 7. Check if test data was inserted
SELECT 
  'analytics_sessions' as table_name,
  COUNT(*) as row_count
FROM analytics_sessions
WHERE session_id = 'test_session_001'

UNION ALL

SELECT 
  'analytics_page_views' as table_name,
  COUNT(*) as row_count
FROM analytics_page_views
WHERE session_id = 'test_session_001';

-- 8. Check if ANY data exists in analytics tables
SELECT 
  'analytics_sessions' as table_name,
  COUNT(*) as total_rows,
  MAX(created_at) as last_insert
FROM analytics_sessions

UNION ALL

SELECT 
  'analytics_page_views' as table_name,
  COUNT(*) as total_rows,
  MAX(created_at) as last_insert
FROM analytics_page_views

UNION ALL

SELECT 
  'analytics_clicks' as table_name,
  COUNT(*) as total_rows,
  MAX(created_at) as last_insert
FROM analytics_clicks;
```

---

## 🎯 Most Likely Issue

Based on your network payload showing `"type": "page_view"` coming BEFORE `"type": "session"`, and the RPC function validating `pageType`, I suspect **one of two issues**:

### Option A: Invalid pageType Format

The client is sending:
```json
{
  "type": "page_view",
  "data": {
    "pageType": "page.home"  // ❌ Invalid
  }
}
```

But RPC expects:
```json
{
  "type": "page_view", 
  "data": {
    "pageType": "home"  // ✅ Valid
  }
}
```

**Fix:** Check `/utils/analytics.ts` line 77 has the `.replace('page.', '')` code.

### Option B: Permission Issue

The RPC function doesn't have permission for anonymous users to execute it.

**Fix:** Run the GRANT command from Issue 1 above.

---

## 📋 Action Items

**Run these in order:**

1. ✅ **Check Network Response** - Look at the response in Network tab
2. ✅ **Run Diagnostic Script** - Copy/paste the SQL script above
3. ✅ **Check pageType** - Look at the payload in Network tab, is it `"home"` or `"page.home"`?
4. ✅ **Grant Permissions** - Run the GRANT EXECUTE command
5. ✅ **Test Manually** - Use the test SQL query with your userCode

---

## 📞 Report Back With:

1. **RPC Response** - What does the Network tab response say?
2. **Diagnostic Results** - What does the diagnostic script output?
3. **PageType Value** - Is it sending `"home"` or `"page.home"`?

This will tell me exactly what's wrong!
