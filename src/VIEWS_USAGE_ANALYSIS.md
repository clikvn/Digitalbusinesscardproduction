# Analytics Views Usage Analysis

## Summary

We created **5 views** for optimized analytics queries, but we're only using **3 of them**.

---

## Views Created (5 total)

### ✅ USING (3 views)

1. **`v_realtime_user_stats`** - ✅ USED in `/lib/api.ts` line 751
   - Purpose: Overall user statistics (total sessions, visitors, views, clicks)
   - Query: `supabase.from('v_realtime_user_stats').select('*').eq('user_code', userCode).single()`

2. **`v_realtime_group_stats`** - ✅ USED in `/lib/api.ts` line 757
   - Purpose: Statistics per share group (Public/Private/Business/Personal)
   - Query: `supabase.from('v_realtime_group_stats').select('*').eq('user_code', userCode)`

3. **`v_realtime_daily_stats`** - ✅ USED in `/lib/api.ts` line 762
   - Purpose: Daily breakdown of views, clicks, sessions
   - Query: `supabase.from('v_realtime_daily_stats').select('*').eq('user_code', userCode).order('date', desc).limit(90)`

---

### ❌ NOT USING (2 views)

4. **`v_realtime_click_targets`** - ❌ NOT USED
   - View exists but we query `analytics_clicks` table directly instead (line 771)
   - View definition:
     ```sql
     SELECT 
       s.user_code, s.share_code,
       c.click_category as target_type,
       c.click_target as target_label,
       COUNT(*) as total_clicks
     FROM analytics_clicks c
     JOIN analytics_sessions s ON c.session_id = s.session_id
     WHERE c.clicked_at >= CURRENT_DATE - INTERVAL '90 days'
     GROUP BY s.user_code, s.share_code, c.click_category, c.click_target
     ```
   - What we do instead: Query raw `analytics_clicks` + client-side aggregation in JS

5. **`v_realtime_page_stats`** - ❌ NOT USED
   - View exists but we query `analytics_page_views` table directly instead (line 787)
   - View definition:
     ```sql
     SELECT 
       s.user_code, s.share_code,
       pv.page_type,
       COUNT(*) as total_views
     FROM analytics_page_views pv
     JOIN analytics_sessions s ON pv.session_id = s.session_id
     WHERE pv.viewed_at >= CURRENT_DATE - INTERVAL '90 days'
     GROUP BY s.user_code, s.share_code, pv.page_type
     ```
   - What we do instead: Query raw `analytics_page_views` + client-side aggregation in JS

---

## Why We're Not Using Those 2 Views

### Current Implementation (Manual Aggregation)

```typescript
// Line 771-781: Query analytics_clicks DIRECTLY
let query = supabase
  .from('analytics_clicks')
  .select('user_code, share_code, click_target, click_category, clicked_at, contact_id, session_id')
  .eq('user_code', userCode)
  .gte('clicked_at', startDate.toISOString())  // ← Dynamic date filter
  .order('clicked_at', { ascending: false });

if (contactFilter) {
  query = query.eq('contact_id', contactFilter);  // ← Contact filter
}

// Line 808-826: Aggregate in JavaScript
const clickTargetMap = new Map();
(clickTargets.data || []).forEach((click) => {
  const key = `${click.share_code}_${click.click_target}`;
  // ... manual aggregation
});
```

### Reasons We Can't Use the Views

**Problem 1: Dynamic Date Filtering**
- Views are hardcoded: `WHERE clicked_at >= CURRENT_DATE - INTERVAL '90 days'`
- API needs dynamic filtering: `filters.days` can be 1h, 1d, 7d, 30d, 90d, or custom
- Can't pass parameters to views in PostgreSQL

**Problem 2: Contact Filtering**
- API needs to filter by `contact_id` when contact filter is active
- Views don't have `contact_id` in their output
- Views aggregate across ALL contacts

**Problem 3: Need Raw session_id**
- We need `session_id` from raw data to count unique sessions accurately
- Views already aggregate - we lose the individual `session_id` values
- Can't do `COUNT(DISTINCT session_id)` after view already counted

**Problem 4: Need Raw clicked_at/viewed_at**
- We return `rawClicks` and `rawPageViews` arrays for transformation
- Views already aggregated - timestamps lost
- Can't filter or transform aggregated data

---

## Current Data Flow

```
Analytics Dashboard Request
        ↓
  api.analytics.getRealtime()
        ↓
  ┌─────────────────────┐
  │ Query 3 VIEWS:      │
  │ ✅ v_realtime_user_stats     → Overall totals
  │ ✅ v_realtime_group_stats    → Per-group totals
  │ ✅ v_realtime_daily_stats    → Daily breakdown
  │                     │
  │ Query 2 RAW TABLES: │
  │ ❌ analytics_clicks          → Raw click events
  │ ❌ analytics_page_views      → Raw page view events
  └─────────────────────┘
        ↓
  Client-side aggregation:
  - clickTargetMap.set(...)
  - pageStatsMap.set(...)
        ↓
  Return aggregated data
```

---

## Should We Use Those Views?

### Option 1: Use Views (Requires View Parameters)
**Pros:**
- Database-side aggregation (faster)
- Less data transfer over network
- Cleaner code

**Cons:**
- PostgreSQL views can't accept parameters
- Would need to create functions instead: `get_click_targets(user_code, days, contact_id)`
- More complex migration
- Still need raw data for session counting

### Option 2: Keep Current Approach (Raw Tables + Client Aggregation)
**Pros:**
- ✅ Flexible filtering (date, contact, share_code)
- ✅ Access to raw `session_id` for accurate counting
- ✅ Can return raw data for client-side transformations
- ✅ Simpler database schema

**Cons:**
- More data transferred over network
- Client-side aggregation (JS Map operations)
- Slightly more complex API code

---

## Recommendation: **Keep Current Approach**

### Why?

1. **Flexibility is Critical**
   - Dynamic date ranges (1h to 5 years)
   - Contact filtering
   - Need raw session_id values

2. **Views Don't Add Much Value Here**
   - We need the raw data anyway for session counting
   - Can't parameterize views
   - Would need to query raw tables anyway for filters

3. **Network Transfer is Minimal**
   - Filtered by date (usually < 100 records)
   - Filtered by user_code
   - Optional contact filter reduces to < 50 records
   - Not a performance bottleneck

4. **Code is Clear and Maintainable**
   - Everything in one place
   - Easy to debug
   - Flexible for future features

---

## What We're Actually Using

### ✅ Views (3) - For Pre-Aggregated Stats
```typescript
v_realtime_user_stats    → user.total_sessions, user.unique_visitors
v_realtime_group_stats   → groups[].total_sessions, groups[].unique_visitors
v_realtime_daily_stats   → daily[].total_page_views, daily[].total_clicks
```

### ✅ Raw Tables (2) - For Flexible Filtering & Raw Data
```typescript
analytics_clicks         → rawClicks[], aggregated clickTargets[]
analytics_page_views     → rawPageViews[], aggregated pageStats[]
```

**This is the optimal approach!**

---

## Cleanup Recommendation

### Option 1: Keep Unused Views (Safe)
- They're not hurting anything
- Might be useful later
- Already created and granted permissions

### Option 2: Drop Unused Views (Clean)
```sql
-- Migration: 030_cleanup_unused_views.sql
DROP VIEW IF EXISTS v_realtime_click_targets;
DROP VIEW IF EXISTS v_realtime_page_stats;
```
- Removes unused database objects
- Cleaner schema
- Less confusion

**Recommendation: Keep them for now** - They might be useful for future features or direct database queries.

---

## Summary

**We're using 3 out of 5 views:**
- ✅ User stats, group stats, daily stats → Used for pre-aggregated totals
- ❌ Click targets, page stats → Not used because we need raw data for filtering

**This is the correct approach** because:
1. Views are great for pre-aggregated stats that don't need filtering
2. Raw tables are needed when we need flexible filtering and raw data
3. Best of both worlds: Fast aggregation + Flexible filtering

**Action Required: None** - Current implementation is optimal!
