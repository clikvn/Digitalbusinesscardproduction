# Analytics Dual Tracking System

## Overview

This document explains how the analytics system tracks **BOTH** group-level and individual contact-level engagement simultaneously.

---

## Two URL Patterns

### 1. Group Share URL (Basic Tracking)

**URL Pattern:** `/usercode/groupcode`  
**Example:** `/myclik/work`

**What it tracks:**
- All visitors to this share group
- Total sessions, page views, clicks for the group
- NO individual identification

**Stored in:**
- `analytics_daily_group_stats`

**Use case:**
- "How is my 'work' group performing overall?"
- "How many people have visited my public profile?"

---

### 2. Individual Contact URL (Advanced Tracking)

**URL Pattern:** `/usercode/groupcode/contactcode`  
**Example:** `/myclik/work/abc123`

**What it tracks:**
- ✅ **Individual contact engagement** (John's specific behavior)
- ✅ **ALSO counts toward group stats** (work group totals)

**Stored in:**
- `analytics_daily_contact_stats` (individual engagement)
- `analytics_daily_group_stats` (ALSO added to group totals)

**Use case:**
- "How did John Doe specifically engage with my portfolio?"
- "Which contacts are most engaged?"
- "Did my tracked shares perform better than anonymous visits?"

---

## How It Works

### When John visits `/myclik/work/abc123`:

1. **Session is created:**
```sql
INSERT INTO analytics_sessions (
  session_id,
  user_code,
  share_code,
  contact_id  -- ← Set to 'abc123'
) VALUES (
  'session_12345',
  'myclik',
  'work',
  'abc123'
);
```

2. **Daily aggregation runs:**

**Step A: Group Stats (includes ALL visits)**
```sql
-- This counts John's visit toward "work" group totals
SELECT 
  user_code,
  share_code,
  COUNT(DISTINCT session_id) as total_sessions
FROM analytics_sessions
WHERE date = '2025-01-28'
GROUP BY user_code, share_code;

-- Result: myclik/work gets +1 session
```

**Step B: Contact Stats (only tracked visits)**
```sql
-- This ALSO tracks John's individual engagement
SELECT 
  user_code,
  share_code,
  contact_id,
  COUNT(DISTINCT session_id) as total_sessions
FROM analytics_sessions
WHERE date = '2025-01-28'
  AND contact_id IS NOT NULL  -- ← Only contacts
GROUP BY user_code, share_code, contact_id;

-- Result: myclik/work/abc123 gets +1 session
```

### Result:

| Table | user_code | share_code | contact_code | total_sessions |
|-------|-----------|------------|--------------|----------------|
| `analytics_daily_group_stats` | myclik | work | NULL | 10 (includes all visitors) |
| `analytics_daily_contact_stats` | myclik | work | abc123 | 3 (John only) |
| `analytics_daily_contact_stats` | myclik | work | xyz789 | 2 (Jane only) |

**Group total (10)** = Anonymous visitors (5) + John (3) + Jane (2)

---

## Database Schema

### Raw Event Tables (Migration 004)

**Already has `contact_id` field:**

```sql
-- analytics_sessions
CREATE TABLE analytics_sessions (
  session_id TEXT PRIMARY KEY,
  user_code TEXT NOT NULL,
  share_code TEXT NOT NULL,
  contact_id TEXT,  -- ← NULL for anonymous, set for tracked
  page_views INT,
  clicks INT
);

-- analytics_page_views
CREATE TABLE analytics_page_views (
  id UUID PRIMARY KEY,
  session_id TEXT,
  user_code TEXT,
  share_code TEXT,
  contact_id TEXT,  -- ← NULL or contact code
  page_type TEXT,
  viewed_at TIMESTAMPTZ
);

-- analytics_clicks
CREATE TABLE analytics_clicks (
  id UUID PRIMARY KEY,
  session_id TEXT,
  user_code TEXT,
  share_code TEXT,
  contact_id TEXT,  -- ← NULL or contact code
  click_target TEXT,
  clicked_at TIMESTAMPTZ
);
```

### Aggregated Tables

**Group Stats (Migration 004):**
```sql
CREATE TABLE analytics_daily_group_stats (
  user_code TEXT,
  share_code TEXT,
  date DATE,
  total_sessions INT,
  total_page_views INT,
  total_clicks INT
);

-- Counts ALL sessions (with or without contact_id)
```

**Contact Stats (Migration 005 - NEW):**
```sql
CREATE TABLE analytics_daily_contact_stats (
  user_code TEXT,
  share_code TEXT,
  contact_code TEXT,  -- ← From contact_id
  date DATE,
  total_sessions INT,
  total_page_views INT,
  total_clicks INT,
  first_visit TIMESTAMPTZ,
  last_visit TIMESTAMPTZ
);

-- Counts ONLY sessions WHERE contact_id IS NOT NULL
```

---

## API Usage

### Get Group Performance (All Visitors)

```typescript
const groupStats = await supabase
  .from('analytics_daily_group_stats')
  .select('*')
  .eq('user_code', 'myclik')
  .eq('share_code', 'work');

// Returns total sessions including anonymous + tracked contacts
```

### Get Individual Contact Engagement

```typescript
const contacts = await api.analytics.getEngagedContacts('myclik', {
  shareCode: 'work',
  minClicks: 1
});

// Returns:
// [
//   {
//     contact_code: 'abc123',
//     contact_name: 'John Doe',
//     total_sessions: 5,
//     total_page_views: 23,
//     total_clicks: 7
//   }
// ]
```

### Get Engaged Contacts Count

```typescript
const count = await api.analytics.getEngagedContactsCount('myclik', {
  shareCode: 'work',
  minClicks: 1
});

// Returns: 12 (unique contacts who clicked)
```

### Get Contact Timeline

```typescript
const timeline = await api.analytics.getContactTimeline('myclik', 'abc123');

// Returns day-by-day engagement for John:
// [
//   { date: '2025-01-28', total_sessions: 2, total_page_views: 8 },
//   { date: '2025-01-20', total_sessions: 1, total_page_views: 5 }
// ]
```

---

## Use Cases

### 1. "Engaged Contacts" Metric

Show how many unique people have interacted with your business card:

```sql
SELECT COUNT(DISTINCT contact_code)
FROM analytics_daily_contact_stats
WHERE user_code = 'myclik'
  AND total_clicks > 0;
```

### 2. Compare Tracked vs Anonymous

```sql
-- Total group visits
SELECT SUM(total_sessions) as total
FROM analytics_daily_group_stats
WHERE user_code = 'myclik' AND share_code = 'work';
-- Returns: 100

-- Tracked contact visits
SELECT SUM(total_sessions) as tracked
FROM analytics_daily_contact_stats
WHERE user_code = 'myclik' AND share_code = 'work';
-- Returns: 45

-- Anonymous visits = 100 - 45 = 55
```

### 3. Top Engaged Contacts

```sql
SELECT * FROM v_engaged_contacts_summary
WHERE user_code = 'myclik'
ORDER BY total_clicks DESC, total_page_views DESC
LIMIT 10;
```

### 4. Contact Performance by Group

```sql
SELECT 
  share_code,
  COUNT(DISTINCT contact_code) as unique_contacts,
  SUM(total_clicks) as total_clicks
FROM analytics_daily_contact_stats
WHERE user_code = 'myclik'
GROUP BY share_code;
```

---

## Migration Files

### Apply These Migrations

```bash
# Step 1: Base analytics (already has contact_id fields)
# File: 004_analytics_scalable_schema.sql
# Tables: analytics_sessions, analytics_page_views, analytics_clicks
# Tables: analytics_daily_group_stats

# Step 2: Contact-level aggregation (NEW)
# File: 005_analytics_contact_stats.sql
# Tables: analytics_daily_contact_stats
# Function: aggregate_analytics_daily_with_contacts()

supabase db push
```

### Migration Order:

```
000_base_schema.sql                    ← Core tables
000_1_add_share_code_column.sql        ← Fix share_code
000_2_add_share_code_to_settings.sql   ← Fix share_code
004_analytics_scalable_schema.sql      ← Base analytics ✅
005_analytics_contact_stats.sql        ← Contact tracking ⭐ NEW
```

---

## Helper Views

### v_engaged_contacts_summary

```sql
-- Lifetime engagement for all contacts
SELECT * FROM v_engaged_contacts_summary
WHERE user_code = 'myclik'
ORDER BY last_visit DESC;
```

**Returns:**
- `contact_code` - Unique tracking code
- `contact_name` - From share_contacts table
- `contact_email` - From share_contacts table
- `days_active` - How many days they visited
- `total_sessions` - Lifetime sessions
- `total_page_views` - Lifetime page views
- `total_clicks` - Lifetime clicks
- `first_visit` - First time they visited
- `last_visit` - Most recent visit

### v_contact_engagement_timeline

```sql
-- Day-by-day engagement for specific contact
SELECT * FROM v_contact_engagement_timeline
WHERE user_code = 'myclik'
  AND contact_code = 'abc123'
ORDER BY date DESC;
```

**Returns:**
- `date` - Calendar date
- `total_sessions` - Sessions on that date
- `total_page_views` - Page views on that date
- `total_clicks` - Clicks on that date

---

## Benefits

### ✅ No Duplication

Same raw event data, just different aggregation views:
- `analytics_sessions` - One row per session (with optional contact_id)
- `analytics_daily_group_stats` - Aggregates ALL sessions
- `analytics_daily_contact_stats` - Aggregates sessions WHERE contact_id IS NOT NULL

### ✅ Flexible Analysis

Answer multiple questions from the same data:
- "How is my work group performing?" → Group stats
- "Which specific contacts are most engaged?" → Contact stats
- "Did John view my portfolio?" → Contact timeline
- "How many people have I successfully tracked?" → Contact count

### ✅ Backwards Compatible

Existing analytics queries continue to work:
- Group-level analytics unchanged
- New contact-level queries are additive
- No breaking changes to existing code

### ✅ Scalable

Pre-aggregated daily summaries:
- Fast queries (no need to scan millions of events)
- Small storage footprint (365 rows/year per group)
- Same performance at 1,000 or 1,000,000 events

---

## Example: Interior Designer Use Case

### Scenario

Interior designer "Sarah" shares her portfolio with potential clients:

1. **Create tracked shares:**
```typescript
// Client 1: John from Modern Homes
const john = await api.shareContacts.create('sarah_design', {
  name: 'John Smith',
  email: 'john@modernhomes.com',
  company: 'Modern Homes LLC',
  shareCode: 'clients'
});
// Returns: { url: '/sarah_design/clients/a1b2c3d4' }

// Client 2: Jane from Urban Living
const jane = await api.shareContacts.create('sarah_design', {
  name: 'Jane Doe',
  email: 'jane@urbanliving.com',
  company: 'Urban Living Inc',
  shareCode: 'clients'
});
// Returns: { url: '/sarah_design/clients/x5y6z7w8' }
```

2. **Share URLs:**
- Send `/sarah_design/clients/a1b2c3d4` to John
- Send `/sarah_design/clients/x5y6z7w8` to Jane
- Public link `/sarah_design/public` for general visitors

3. **Track engagement:**

**Group Performance (All "clients" visits):**
```typescript
const clientsStats = await supabase
  .from('analytics_daily_group_stats')
  .select('*')
  .eq('user_code', 'sarah_design')
  .eq('share_code', 'clients');

// Returns: 25 total sessions (John + Jane + any anonymous with link)
```

**Individual Contact Engagement:**
```typescript
const engagedClients = await api.analytics.getEngagedContacts('sarah_design', {
  shareCode: 'clients'
});

// Returns:
// [
//   {
//     contact_name: 'John Smith',
//     total_sessions: 15,
//     total_clicks: 8,
//     last_visit: '2025-01-28'
//   },
//   {
//     contact_name: 'Jane Doe',
//     total_sessions: 10,
//     total_clicks: 5,
//     last_visit: '2025-01-27'
//   }
// ]
```

**Insights:**
- Total client group: 25 sessions
- John's engagement: 15 sessions, 8 clicks (very interested!)
- Jane's engagement: 10 sessions, 5 clicks (moderately interested)
- Anonymous visitors: 0 (no one found the generic clients link)

**Sarah's Actions:**
- Follow up with John (high engagement)
- Send more info to Jane (moderate engagement)
- Focus on tracked shares (better conversion)

---

## Summary

✅ **URLs without contact_code** → Track group-level analytics only  
✅ **URLs with contact_code** → Track BOTH individual AND group analytics  
✅ **No duplication** → Same raw data, different aggregation views  
✅ **Full visibility** → See both forest (group) and trees (contacts)  

**Migration Files:**
- `004_analytics_scalable_schema.sql` - Base analytics
- `005_analytics_contact_stats.sql` - Contact tracking ⭐

**API Functions:**
- `api.analytics.getEngagedContacts()` - List engaged contacts
- `api.analytics.getContactTimeline()` - Individual timeline
- `api.analytics.getEngagedContactsCount()` - Count metric
- `api.analytics.aggregateDaily()` - Run aggregation

**Apply Now:**
```bash
supabase db push
```

---

**Last Updated:** 2025-01-28  
**Related Docs:** `/CHANGELOG.md`, `/NOTE.md`, `/APPLY_MIGRATIONS.md`
