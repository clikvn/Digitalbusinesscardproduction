# Analytics Migration - Implementation Status

## ✅ **What You Need to Do First**

### **STEP 1: Apply Database Migration** ⭐ (START HERE!)

You need to run the SQL migration to create all the new tables and functions.

```bash
# Option A: Using Supabase CLI (Recommended)
supabase db push

# Option B: Using Supabase Dashboard
# 1. Go to SQL Editor
# 2. Copy contents of /supabase/migrations/004_analytics_scalable_schema.sql
# 3. Paste and Run

# Option C: Using psql
psql "your-connection-string" -f supabase/migrations/004_analytics_scalable_schema.sql
```

**This creates:**
- 7 tables (sessions, page_views, clicks, 4 aggregated tables)
- 20+ indexes
- 5 PostgreSQL functions including `ingest_analytics_batch()`
- RLS policies
- Monitoring views

---

## ✅ **What's Already Done**

### **Phase 1: Database Schema** ✅
- [x] Migration SQL file created
- [x] All tables defined
- [x] Indexes configured
- [x] RLS policies defined
- [x] **Serverless ingestion function** (`ingest_analytics_batch()`)

### **Phase 2: Client Code** ✅
- [x] Created `/utils/analytics-batcher.ts`
  - Batches events (10s or 20 events)
  - Calls `supabase.rpc('ingest_analytics_batch')`
  - No external server needed!
- [x] Updated `/utils/analytics.ts`
  - `trackView()` now uses batcher
  - `trackPageView()` now uses batcher
  - `trackClick()` now uses batcher

---

## 🔄 **What Happens After You Apply Migration**

### **Immediate Effect:**
1. **New tables created** - Will be empty initially
2. **Old `analytics_events` table** - Remains unchanged, still works
3. **Your app continues working** - No breaking changes yet

### **Events Start Going to New Tables:**
As soon as you deploy the updated client code:
- Events batch in browser for 10 seconds
- Batch sent to `supabase.rpc('ingest_analytics_batch')`
- Data written to new normalized tables
- Both old and new systems run in parallel

### **Old System Still Works:**
- Dashboard still reads from old `analytics_events` table
- No disruption to existing functionality

---

## 📋 **Remaining Tasks**

### **Task 1: Verify Migration** (5 minutes)

After applying migration, run these SQL queries:

```sql
-- Check tables exist (should return 7 rows)
SELECT tablename FROM pg_tables 
WHERE tablename LIKE 'analytics_%'
ORDER BY tablename;

-- Check function exists
SELECT proname FROM pg_proc 
WHERE proname = 'ingest_analytics_batch';

-- Test the function
SELECT ingest_analytics_batch('[
  {
    "type": "session",
    "data": {
      "sessionId": "test_123",
      "userCode": "myclik",
      "shareCode": "public",
      "timestamp": 1706400000000,
      "userAgent": "Test",
      "referrer": ""
    }
  }
]'::jsonb);

-- Should return: {"success": true, ...}

-- Check data was inserted
SELECT * FROM analytics_sessions WHERE session_id = 'test_123';

-- Clean up test
DELETE FROM analytics_sessions WHERE session_id = 'test_123';
```

---

### **Task 2: Deploy Client Code** (2 minutes)

The client code is already created! Just deploy your app:

```bash
# Deploy your frontend (Vercel/Netlify/etc)
npm run build
npm run deploy  # or your deploy command
```

**What happens:**
- Events start batching in browser
- Every 10 seconds (or 20 events), batch is sent
- Calls `supabase.rpc('ingest_analytics_batch')`
- Data written to new tables

---

### **Task 3: Monitor New Data** (10 minutes)

Watch data flow into new tables:

```sql
-- Check summary (should show increasing counts)
SELECT * FROM analytics_summary;

-- Watch sessions being created
SELECT * FROM analytics_sessions 
ORDER BY first_seen DESC 
LIMIT 10;

-- Watch page views
SELECT * FROM analytics_page_views 
ORDER BY viewed_at DESC 
LIMIT 10;

-- Watch clicks
SELECT * FROM analytics_clicks 
ORDER BY clicked_at DESC 
LIMIT 10;
```

---

### **Task 4: Set Up Daily Aggregation** (15 minutes)

Choose one option:

#### **Option A: pg_cron (Automatic)** ✅
If pg_cron is enabled (check Supabase plan), it's already scheduled!

```sql
-- Check if it's scheduled
SELECT * FROM cron.job WHERE jobname = 'aggregate-analytics-daily';

-- If not, schedule it
SELECT cron.schedule(
  'aggregate-analytics-daily',
  '0 2 * * *',
  $$SELECT aggregate_analytics_daily()$$
);
```

#### **Option B: GitHub Actions** (Recommended if no pg_cron)

Create `.github/workflows/aggregate-analytics.yml`:

```yaml
name: Aggregate Analytics
on:
  schedule:
    - cron: '0 2 * * *'  # 2 AM UTC daily
  workflow_dispatch:     # Manual trigger

jobs:
  aggregate:
    runs-on: ubuntu-latest
    steps:
      - name: Run aggregation
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
        run: |
          # Install PostgreSQL client
          sudo apt-get update
          sudo apt-get install -y postgresql-client
          
          # Run aggregation
          psql "$DATABASE_URL" -c "SELECT aggregate_analytics_daily();"
```

Then add `DATABASE_URL` to GitHub Secrets.

#### **Option C: Manual (Testing)**

Run manually once per day:

```sql
-- Aggregate yesterday's data
SELECT aggregate_analytics_daily();

-- Check aggregated data
SELECT * FROM analytics_daily_user_stats 
ORDER BY date DESC;
```

---

### **Task 5: Test Both Systems in Parallel** (1-2 weeks)

Compare old vs new:

```sql
-- Compare counts
SELECT 
  'old_system' as system,
  COUNT(*) as total_events
FROM analytics_events
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
UNION ALL
SELECT 
  'new_system',
  (SELECT COUNT(*) FROM analytics_page_views WHERE viewed_at >= CURRENT_DATE - INTERVAL '7 days') +
  (SELECT COUNT(*) FROM analytics_clicks WHERE clicked_at >= CURRENT_DATE - INTERVAL '7 days');
```

If numbers match, you're good! ✅

---

### **Task 6: Update Dashboard** (Later - Not Urgent)

Eventually you'll want to update the dashboard to query the new fast tables.

This can wait until you're confident the new system is working.

**Files to update later:**
- `/lib/api-analytics.ts` - Create new API layer
- `/hooks/useAnalyticsDashboard.ts` - Query aggregated tables
- `/components/cms/AnalyticsDashboard.tsx` - Minimal changes

---

### **Task 7: Deprecate Old System** (After 2+ weeks of testing)

Once you're 100% confident:

```sql
-- Archive old data
CREATE TABLE analytics_events_archive AS 
SELECT * FROM analytics_events;

-- Drop old table
DROP TABLE analytics_events;

-- Remove old API code
```

---

## 🎯 **Your Action Plan (Right Now)**

### **Today (30 minutes):**

1. **Apply migration:**
   ```bash
   supabase db push
   ```

2. **Verify it worked:**
   ```sql
   SELECT * FROM analytics_summary;
   ```

3. **Test RPC function:**
   ```sql
   SELECT ingest_analytics_batch('[...]'::jsonb);
   ```

4. **Deploy your app** (client code is already updated)

### **Tomorrow (10 minutes):**

5. **Check data is flowing:**
   ```sql
   SELECT * FROM analytics_summary;
   ```

6. **Set up aggregation** (GitHub Actions or pg_cron)

### **Next 2 Weeks:**

7. **Monitor both systems** - Compare metrics
8. **Run aggregation daily** - Watch aggregated tables fill up

### **After 2 Weeks:**

9. **Update dashboard** to use new tables (optional - can wait)
10. **Deprecate old system** when confident

---

## 📊 **Expected Results**

### **After Migration Applied:**
- 7 new tables exist (empty)
- `ingest_analytics_batch()` function exists
- Old system still works

### **After Client Code Deployed:**
- Events flow to new tables
- You'll see data in `analytics_sessions`, `analytics_page_views`, `analytics_clicks`
- Old table also still gets data (parallel)

### **After Daily Aggregation Runs:**
- Data appears in `analytics_daily_*` tables
- These tables will be tiny (365 rows/year)
- Ready for fast dashboard queries

---

## ❓ **FAQ**

### **Q: Will my current analytics dashboard break?**
A: No! The old `analytics_events` table remains unchanged. Dashboard keeps working.

### **Q: When does the new system start working?**
A: As soon as you deploy the client code. Events will batch and call the RPC function.

### **Q: Do I need to deploy a server?**
A: NO! That's the beauty of this approach. Everything uses Supabase RPC.

### **Q: What if something goes wrong?**
A: Just revert the client code. The migration doesn't break anything existing.

### **Q: How do I test without affecting production?**
A: The new system writes to different tables. Both run in parallel safely.

---

## 🚀 **Ready to Start?**

Run this command:

```bash
supabase db push
```

Then check the next steps in this file! 📋
