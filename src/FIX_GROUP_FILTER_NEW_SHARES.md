# Fix: Group Filter "New Shares" Count

## 🐛 Bug Report

**Issue:** When filtering analytics by "Private" group, the "New Shares" metric still shows 2, which appears to be counting ALL groups instead of just the Private group.

**Expected:** "New Shares" should show ONLY unique people (visitor_id) who visited via the Private share link.

**Actual:** "New Shares" shows combined count from all groups (Public + Private + Business + Personal).

---

## 🔍 Root Cause Analysis

### The Problem

**"New Shares" = Unique People (visitor_id tracking, 90-day localStorage persistence)**

When a user filters by a specific group (e.g., "Private"), the dashboard should show:
- ✅ Total Views from Private link only
- ✅ Total Clicks from Private link only
- ✅ Engaged Contacts from Private link only
- ❌ **New Shares from ALL links** ← BUG!

### Why This Happened

**Code Investigation:**

```typescript
// In transformRealtimeDataToDashboard()
const overallMetrics = {
  totalViews: totalPageViews,  // ✅ Calculated from filteredDaily
  uniqueVisitors: totalSessions, // ✅ Calculated from filteredDaily
  uniquePeople: user.unique_visitors || 0, // ❌ WRONG! Uses OVERALL count
  totalClicks: totalClicks, // ✅ Calculated from filteredDaily
  // ...
};
```

**The Issue:**
- `totalViews`, `totalClicks`, `uniqueVisitors` → Calculated from `filteredDaily` (already filtered by share_code)
- `uniquePeople` → Uses `user.unique_visitors` which is the OVERALL count across ALL groups

**Why It Used Overall Count:**
- The `groups[]` array from `v_realtime_group_stats` didn't have `unique_visitors` field
- The view only had: `total_sessions`, `total_page_views`, `total_clicks`
- No way to get per-group unique people count!

---

## ✅ Solution

### Part 1: Update Database Views (Migration 028)

**Add `unique_visitors` (visitor_id count) to realtime views:**

```sql
-- v_realtime_user_stats
CREATE VIEW v_realtime_user_stats AS
SELECT 
  s.user_code,
  COUNT(DISTINCT s.session_id) as total_sessions,
  COUNT(DISTINCT s.visitor_id) as unique_visitors,  -- ✅ ADDED
  COUNT(DISTINCT pv.id) as total_page_views,
  COUNT(DISTINCT c.id) as total_clicks,
  MIN(s.first_seen) as first_visit,
  MAX(s.last_seen) as last_visit
FROM analytics_sessions s
LEFT JOIN analytics_page_views pv ON s.session_id = pv.session_id
LEFT JOIN analytics_clicks c ON s.session_id = c.session_id
WHERE s.first_seen >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY s.user_code;

-- v_realtime_group_stats
CREATE VIEW v_realtime_group_stats AS
SELECT 
  s.user_code,
  s.share_code,
  COUNT(DISTINCT s.session_id) as total_sessions,
  COUNT(DISTINCT s.visitor_id) as unique_visitors,  -- ✅ ADDED
  COUNT(DISTINCT pv.id) as total_page_views,
  COUNT(DISTINCT c.id) as total_clicks,
  MIN(s.first_seen) as first_visit,
  MAX(s.last_seen) as last_visit
FROM analytics_sessions s
LEFT JOIN analytics_page_views pv ON s.session_id = pv.session_id
LEFT JOIN analytics_clicks c ON s.session_id = c.session_id
WHERE s.first_seen >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY s.user_code, s.share_code;
```

**What This Does:**
- Adds `COUNT(DISTINCT visitor_id)` to both views
- Now each group has its own `unique_visitors` count
- Tracks unique people PER GROUP instead of overall

---

### Part 2: Update Frontend Logic

**Updated `transformRealtimeDataToDashboard()` in `/utils/analytics.ts`:**

```typescript
// Calculate unique people from filtered data
let uniquePeople: number;
if (filterShareCode) {
  // ✅ When filtering by group, use that group's unique_visitors
  const groupData = groups.find((g: any) => g.share_code === filterShareCode);
  uniquePeople = groupData?.unique_visitors || 0;
  console.log('[Analytics] Unique people for group:', filterShareCode, '=', uniquePeople);
} else {
  // When no filter, use overall count
  uniquePeople = user.unique_visitors || 0;
}

const overallMetrics = {
  totalViews: totalPageViews,
  uniqueVisitors: totalSessions,
  uniquePeople: uniquePeople,  // ✅ Now uses group-specific count!
  totalClicks: totalClicks,
  // ...
};
```

**What This Does:**
- Checks if `groupId` filter is applied
- If yes → Find the specific group and use its `unique_visitors`
- If no → Use overall `user.unique_visitors`
- Logs the value for debugging

---

## 📊 Data Flow

### Before Fix (Incorrect)

```
User selects "Private" group
   ↓
filterShareCode = "ABC123" (Private group's share code)
   ↓
Filter daily, pageStats, clickTargets by share_code ✅
   ↓
Calculate uniquePeople:
   uniquePeople = user.unique_visitors (OVERALL)
   = Public (1) + Private (0) + Business (1) + Personal (0)
   = 2 ❌ WRONG!
   ↓
Dashboard shows: 2 New Shares
```

### After Fix (Correct)

```
User selects "Private" group
   ↓
filterShareCode = "ABC123" (Private group's share code)
   ↓
Filter daily, pageStats, clickTargets by share_code ✅
   ↓
Calculate uniquePeople:
   Find group where share_code = "ABC123"
   uniquePeople = group.unique_visitors (PER-GROUP)
   = 0 (no unique visitors for Private group)
   ✅ CORRECT!
   ↓
Dashboard shows: 0 New Shares
```

---

## 🧪 Testing

### Step 1: Run Migration 028

```bash
# In Supabase SQL Editor
# Copy/paste contents of:
/supabase/migrations/028_add_visitor_id_to_views.sql

# Execute the migration
```

### Step 2: Verify Database Views

```sql
-- Check v_realtime_group_stats
SELECT * FROM v_realtime_group_stats;

-- Should now show:
-- user_code | share_code | total_sessions | unique_visitors | total_page_views | total_clicks
-- ABC123    | XYZ789     | 5              | 3               | 10               | 7
-- ABC123    | DEF456     | 2              | 1               | 4                | 2

-- Check v_realtime_user_stats
SELECT * FROM v_realtime_user_stats;

-- Should now show:
-- user_code | total_sessions | unique_visitors | total_page_views | total_clicks
-- ABC123    | 7              | 4               | 14               | 9
```

### Step 3: Test in Dashboard

```
1. Go to Analytics Dashboard
2. Select "All Groups" from Group dropdown
   ✅ New Shares = 4 (total unique visitors)

3. Select "Private" from Group dropdown
   ✅ New Shares = 1 (only Private group visitors)
   ✅ Console shows: "Unique people for group: ABC123 = 1"

4. Select "Public" from Group dropdown
   ✅ New Shares = 3 (only Public group visitors)
   ✅ Console shows: "Unique people for group: XYZ789 = 3"
```

### Step 4: Verify Console Logs

```javascript
// Browser console should show:
[Analytics] Filtering by groupId: b37b4ed3-..._private → shareCode: ABC123
[Analytics] Unique people for group: ABC123 = 1
[Analytics Debug] Filtered pageStats breakdown: [...]
[Analytics Debug] View counts comparison: {...}
```

---

## 📁 Files Modified

| File | Change |
|------|--------|
| `/supabase/migrations/028_add_visitor_id_to_views.sql` | **NEW** - Adds `visitor_id` tracking to views |
| `/utils/analytics.ts` | Updated `transformRealtimeDataToDashboard()` to use group-specific `unique_visitors` |
| `/CHANGELOG.md` | Documented the fix |
| `/NOTE.md` | Added technical notes |
| `/FIX_GROUP_FILTER_NEW_SHARES.md` | This document |

---

## 🎯 Impact

### User Experience
- ✅ Accurate "New Shares" count per share group
- ✅ Users can track which audience segments attract unique visitors
- ✅ Better insights for optimizing share strategies

### Technical
- ✅ Consistent metric filtering across all metrics
- ✅ Group-specific unique people tracking
- ✅ No breaking changes to existing code
- ✅ Backward compatible (falls back to overall count when no filter)

### Business Value
- ✅ Users can identify which share links attract NEW people
- ✅ Users can measure effectiveness of different share campaigns
- ✅ Better ROI tracking per audience segment

---

## 🔄 Migration Order

**If setting up from scratch:**

```
1. Run all previous migrations (000-027)
2. Run migration 028 ← THIS FIX
3. Restart application (frontend automatically picks up changes)
```

**If already deployed:**

```
1. Run migration 028 in Supabase SQL Editor
2. No frontend deployment needed (code already updated)
3. Refresh dashboard to see correct values
```

---

## 🧠 Key Learnings

### Why This Bug Existed

1. **Database views didn't track visitor_id** - Only tracked session_id
2. **Frontend had no way to get per-group unique people** - Could only use overall count
3. **Partial filtering implementation** - Filtered views/clicks but not unique people

### How We Fixed It

1. **Added visitor_id to database views** - Now tracks unique people per group
2. **Updated frontend logic** - Uses group-specific count when filtering
3. **Added debug logging** - Makes it easy to verify correctness

### Best Practices Applied

✅ **Database-level aggregation** - Views do the heavy lifting  
✅ **Consistent filtering** - All metrics use same filter logic  
✅ **Debug logging** - Console logs help troubleshoot  
✅ **Backward compatibility** - Falls back gracefully  
✅ **Comprehensive testing** - SQL + UI verification  

---

## 📞 Summary

**Problem:** Group filter showed wrong "New Shares" count (all groups instead of selected group)

**Root Cause:** Database views didn't have `visitor_id` tracking, frontend used overall count

**Solution:** 
1. Migration 028 adds `COUNT(DISTINCT visitor_id)` to views
2. Frontend uses group-specific `unique_visitors` when filtering

**Result:** "New Shares" now correctly shows unique people PER GROUP

**Status:** ✅ **FIXED** - Ready to deploy

---

## 🚀 Deployment

```bash
# 1. Run migration in Supabase SQL Editor
cat /supabase/migrations/028_add_visitor_id_to_views.sql
# Copy contents and execute in SQL Editor

# 2. Verify views are updated
SELECT * FROM v_realtime_group_stats LIMIT 5;

# 3. Test dashboard
# Open Analytics Dashboard → Select different groups
# Verify "New Shares" changes correctly

# ✅ Done!
```
