# Daily Analytics Tables - Usage Audit 🔍

## Summary

**YES, we created daily ETL tables. NO, we're NOT using ANY of them!**

**UPDATE:** The table `analytics_daily_contact_stats` exists in migration 005 but might not exist in your database if you haven't run that migration yet!

---

## 📊 Tables Created (Migration 004 + 005)

### ❌ **ALL 5 TABLES ARE UNUSED:**

1. **`analytics_daily_user_stats`** ❌ NOT USED
   - **Purpose:** Daily aggregate stats per user
   - **Created in:** Migration 004
   - **Populated by:** `aggregate_analytics_daily()` function
   - **Queried by:** NOTHING
   - **Status:** ❌ **CREATED BUT NOT QUERIED**

2. **`analytics_daily_group_stats`** ❌ NOT USED
   - **Purpose:** Daily aggregate stats per share group
   - **Created in:** Migration 004
   - **Populated by:** `aggregate_analytics_daily()` function
   - **Queried by:** NOTHING
   - **Status:** ❌ **CREATED BUT NOT QUERIED**

3. **`analytics_daily_click_targets`** ❌ NOT USED
   - **Purpose:** Daily aggregate of what was clicked
   - **Created in:** Migration 004
   - **Populated by:** `aggregate_analytics_daily()` function
   - **Queried by:** NOTHING
   - **Status:** ❌ **CREATED BUT NOT QUERIED**

4. **`analytics_daily_page_stats`** ❌ NOT USED
   - **Purpose:** Daily aggregate of page views by type
   - **Created in:** Migration 004
   - **Populated by:** `aggregate_analytics_daily()` function
   - **Queried by:** NOTHING
   - **Status:** ❌ **CREATED BUT NOT QUERIED**

5. **`analytics_daily_contact_stats`** ❌ NOT USED
   - **Purpose:** Track individual contact engagement
   - **Created in:** Migration 005
   - **Populated by:** `aggregate_analytics_daily_with_contacts()` function
   - **Queried by:** `api.analytics.getEngagedContactsCount()` (line 947)
   - **BUT:** ❌ **getEngagedContactsCount() IS NEVER CALLED BY ANY COMPONENT!**
   - **Status:** ❌ **MIGRATION EXISTS BUT TABLE MAY NOT BE IN YOUR DATABASE**

---

## 🚨 Why You Don't Have `analytics_daily_contact_stats`

**Two possibilities:**

1. **Migration 005 was never run on your database**
   - Migration file exists: ✅ `/supabase/migrations/005_analytics_contact_stats.sql`
   - But you may have skipped it or it failed silently
   - Check: `SELECT * FROM supabase_migrations;` to see what ran

2. **You only ran migration 004, not 005**
   - Migration 004 creates the first 4 tables
   - Migration 005 creates `analytics_daily_contact_stats`
   - Since you don't have it, migration 005 likely didn't run

**Result:**
- ✅ You have 4 daily tables from migration 004
- ❌ You DON'T have `analytics_daily_contact_stats` from migration 005
- ✅ But the API code references it (line 947)
- ✅ **Good news:** The API function is NEVER CALLED, so it doesn't break anything!

---

## 🔄 ETL Functions

### Function: `aggregate_analytics_daily()`

**Status:** Created but NOT called by application

**Location:** `/supabase/migrations/004_analytics_scalable_schema.sql`

**Scheduled:** Daily at 2:00 AM via pg_cron
```sql
SELECT cron.schedule(
  'aggregate-analytics-daily',
  '0 2 * * *',
  'SELECT aggregate_analytics_daily()'
);
```

**Populates:**
- `analytics_daily_user_stats`
- `analytics_daily_group_stats`
- `analytics_daily_click_targets`
- `analytics_daily_page_stats`

**Problem:** ❌ These tables are being populated daily but NEVER queried!

---

### Function: `aggregate_analytics_daily_with_contacts()`

**Status:** Created and CALLED by application ✅

**Location:** `/supabase/migrations/005_analytics_contact_stats.sql`

**Called from:** `/lib/api.ts` line 982

**Populates:**
- All tables from `aggregate_analytics_daily()` PLUS
- `analytics_daily_contact_stats` ✅ (this one is used!)

---

## 🎯 What We're Actually Using

### Real-Time Views (Used in `/lib/api.ts`)

```typescript
// Line 751-766 - What we ACTUALLY query
const [userStats, groupStats, dailyStats, clickTargets, pageStats] = await Promise.all([
  // ✅ USING REAL-TIME VIEWS
  supabase.from('v_realtime_user_stats').select('*'),      // NOT analytics_daily_user_stats
  supabase.from('v_realtime_group_stats').select('*'),     // NOT analytics_daily_group_stats
  supabase.from('v_realtime_daily_stats').select('*'),     // NOT analytics_daily_*
  
  // ✅ USING RAW EVENT TABLES
  supabase.from('analytics_clicks').select('...'),         // NOT analytics_daily_click_targets
  supabase.from('analytics_page_views').select('...'),     // NOT analytics_daily_page_stats
]);
```

### Why We're Using Real-Time Views Instead

**Advantages of Real-Time Views:**
- ✅ **Instant data** - No waiting for daily aggregation
- ✅ **Flexible filtering** - Can filter by contact, date range, etc.
- ✅ **Accurate** - Queries source of truth (events)
- ✅ **No ETL lag** - Data appears immediately after events tracked

**Disadvantages of Daily Tables:**
- ❌ **Stale data** - Only updated once per day (2 AM)
- ❌ **Less flexible** - Pre-aggregated, can't filter dynamically
- ❌ **ETL dependency** - Requires cron job to run successfully
- ❌ **Storage waste** - Duplicate data (events + aggregates)

---

## 🏗️ Architecture Decision

**We built TWO parallel systems:**

### System 1: Daily ETL (Old Design) ❌
```
analytics_clicks/page_views (raw events)
           ↓
    [Cron runs daily at 2 AM]
           ↓
aggregate_analytics_daily() function
           ↓
analytics_daily_* tables
           ↓
    [Dashboard queries daily tables]
```

### System 2: Real-Time Views (Current Design) ✅
```
analytics_clicks/page_views (raw events)
           ↓
v_realtime_* views (query events directly)
           ↓
    [Dashboard queries real-time views]
```

**Result:** System 1 runs in background but is NEVER used!

---

## 📦 Storage Impact

**Wasted Storage:**
```sql
-- These tables are being populated daily but never queried:
analytics_daily_user_stats      -- Growing every day
analytics_daily_group_stats     -- Growing every day
analytics_daily_click_targets   -- Growing every day
analytics_daily_page_stats      -- Growing every day

-- Estimated size after 1 year:
-- ~365 rows per user per table = 1,460 rows/user across 4 tables
-- Multiply by number of users
```

**Currently Used:**
```sql
analytics_daily_contact_stats   -- ✅ Being queried for contact counts
```

---

## 🛠️ Recommendations

### Option 1: Keep Current Architecture (Real-Time) ✅

**Action:** Remove unused daily tables and ETL jobs

```sql
-- Migration: Remove unused daily tables
DROP TABLE analytics_daily_user_stats;
DROP TABLE analytics_daily_group_stats;
DROP TABLE analytics_daily_click_targets;
DROP TABLE analytics_daily_page_stats;

-- Keep this one (it's used!)
-- analytics_daily_contact_stats

-- Remove ETL function (not needed anymore)
DROP FUNCTION aggregate_analytics_daily();

-- Update the contact aggregation function
-- to only populate analytics_daily_contact_stats

-- Unschedule cron job
SELECT cron.unschedule('aggregate-analytics-daily');
```

**Benefits:**
- ✅ Cleaner architecture
- ✅ Reduced storage
- ✅ Less maintenance
- ✅ No ETL dependencies

---

### Option 2: Use Daily Tables for Performance

**When to consider:**
- If you have **millions of raw events**
- If real-time views become **too slow** (>5 seconds)
- If you need **historical aggregates** beyond 90 days

**Action:** Switch from real-time views to daily tables

```typescript
// Change /lib/api.ts to query daily tables instead
const dailyStats = await supabase
  .from('analytics_daily_user_stats')  // Use daily table
  .select('*')
  .eq('user_code', userCode)
  .gte('date', startDate)
  .order('date', { ascending: false });
```

**Benefits:**
- ✅ Faster queries (pre-aggregated)
- ✅ Can keep raw events for shorter period (30 days)
- ✅ Archive old aggregates indefinitely

**Drawbacks:**
- ❌ Data lag (up to 24 hours old)
- ❌ Less flexible filtering
- ❌ Dependency on ETL jobs

---

## 🎯 Current Status

| Table | Created | Populated | Queried | Verdict |
|-------|---------|-----------|---------|---------|
| `analytics_daily_user_stats` | ✅ | ✅ Daily | ❌ Never | **REMOVE** |
| `analytics_daily_group_stats` | ✅ | ✅ Daily | ❌ Never | **REMOVE** |
| `analytics_daily_click_targets` | ✅ | ✅ Daily | ❌ Never | **REMOVE** |
| `analytics_daily_page_stats` | ✅ | ✅ Daily | ❌ Never | **REMOVE** |
| `analytics_daily_contact_stats` | ✅ | ✅ Daily | ❌ Never | **REMOVE** |

---

## 📝 What To Do

### Immediate Action: Audit Your Database

```sql
-- Check if cron job is running
SELECT * FROM cron.job
WHERE jobname = 'aggregate-analytics-daily';

-- Check last run
SELECT * FROM cron.job_run_details
WHERE jobname = 'aggregate-analytics-daily'
ORDER BY start_time DESC
LIMIT 5;

-- Check if tables have data
SELECT 'analytics_daily_user_stats' as table_name, COUNT(*) as rows FROM analytics_daily_user_stats
UNION ALL
SELECT 'analytics_daily_group_stats', COUNT(*) FROM analytics_daily_group_stats
UNION ALL
SELECT 'analytics_daily_click_targets', COUNT(*) FROM analytics_daily_click_targets
UNION ALL
SELECT 'analytics_daily_page_stats', COUNT(*) FROM analytics_daily_page_stats
UNION ALL
SELECT 'analytics_daily_contact_stats', COUNT(*) FROM analytics_daily_contact_stats;
```

### Decision Time:

**If data shows 0 rows in daily tables:**
- ✅ ETL job never ran → Safe to remove tables

**If data shows rows in daily tables:**
- 🤔 ETL job is running → Wasting storage → Remove if not using

**If you want to keep real-time views:**
- ✅ Remove unused daily tables
- ✅ Keep `analytics_daily_contact_stats` (it's used!)
- ✅ Update `aggregate_analytics_daily_with_contacts()` to only populate contact stats

---

## 🔑 Key Insight

**You have two systems:**
1. **Daily ETL** - Built for scale, not currently used
2. **Real-time views** - Built for flexibility, currently in use

**Pick one!** Running both wastes storage and creates confusion.

**Recommendation:** Stick with real-time views until performance becomes an issue. Then migrate to daily tables.

---

## 📚 Files to Review

- `/supabase/migrations/004_analytics_scalable_schema.sql` - Daily tables creation
- `/supabase/migrations/005_analytics_contact_stats.sql` - Contact stats (USED!)
- `/supabase/migrations/028_create_realtime_views.sql` - Real-time views (USED!)
- `/lib/api.ts` - What we actually query
- `/supabase/migrations/004_OPERATIONS.sql` - ETL operations guide

---

**TL;DR:** You built daily ETL tables that run every night at 2 AM, but your app uses real-time views instead. Clean up the unused tables or start using them!