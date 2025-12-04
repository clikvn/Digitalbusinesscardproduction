# Analytics Feature - Complete Summary

## 📊 Overview

The Analytics feature provides comprehensive tracking and visualization of how users interact with shared digital business cards. It distinguishes between unique people and unique visits, tracks page views and button clicks, and presents data through an interactive dashboard with date range filtering.

---

## ✨ Features Implemented

### 1. **Dual Tracking System**

**Unique People Tracking (`visitor_id`):**
- Persistent 90-day localStorage identifier
- Tracks distinct individuals across multiple visits
- Used for "New Shares" metric (unique people who viewed)
- Survives browser sessions and page refreshes

**Unique Visits Tracking (`session_id`):**
- Session-based 30-minute sessionStorage identifier
- Tracks individual browsing sessions
- Used for "Engaged Contacts" metric (unique sessions)
- Resets after 30 minutes of inactivity or browser close

### 2. **Analytics Dashboard**

**Metrics Cards:**
- **Total Views** - Total page views across all screens
- **Total Clicks** - Total button/link clicks
- **Engaged Contacts** - Unique sessions (visitor sessions)
- **New Shares** - Unique people (distinct visitors)

**Interactive Charts:**
- **Line Chart** - Daily trends for views/clicks over time
- **Bar Chart** - Page breakdown (Home, Contact, Portfolio screens)
- **Bar Chart** - Click targets breakdown (specific buttons/links)

**Date Range Filtering:**
- Last 7 days (default)
- Last 30 days
- Last 90 days
- All time
- Custom date range picker

**Share Group Filtering:**
- Filter analytics by specific share groups (Public, Private, Business, Personal)
- View metrics per audience segment
- Compare performance across different share links

### 3. **Automatic Session Management**

**Auto-creation:**
- Sessions automatically created if missing when events tracked
- Prevents data loss from orphaned events
- Uses share code resolution system

**Share Code Resolution:**
- Falls back to Public group if no share code provided
- Queries `user_share_groups` table with `is_default = true`
- Never uses hardcoded "public" string
- Works with UUID-based group IDs

### 4. **Real-time Tracking**

**Page View Events:**
- Tracks screen navigation (Home, Contact, Portfolio)
- Records timestamp, session, visitor
- Captured automatically on route change

**Click Events:**
- Tracks button clicks (phone, email, WhatsApp, etc.)
- Records click target and context
- Maps to specific screens for breakdown

**Data Flow:**
```
User Action
   ↓
Analytics Hook (useAnalyticsTracking)
   ↓
Supabase API (/lib/api.ts)
   ↓
Database Insert (analytics_page_views / analytics_clicks)
   ↓
Aggregate Views (v_realtime_page_stats / v_realtime_click_targets)
   ↓
Dashboard Display (AnalyticsDashboard.tsx)
```

### 5. **Data Privacy**

**No PII Collection:**
- No names, emails, or phone numbers tracked
- Anonymous visitor IDs (random UUIDs)
- Share codes instead of user identifiers
- Complies with privacy best practices

**Soft References:**
- No foreign key constraints on analytics tables
- Sessions can exist without active users
- Data preserved even if user deletes account
- Prevents cascading deletes

---

## 🛠️ Tech Stack

### **Frontend**

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18.x | UI framework |
| **TypeScript** | 5.x | Type safety |
| **Recharts** | 2.x | Charts and graphs visualization |
| **TanStack Query (React Query)** | 5.x | Server state management & caching |
| **React Hook Form** | 7.55.0 | Form state management |
| **date-fns** | Latest | Date formatting and manipulation |
| **Lucide React** | Latest | Icon library |
| **Tailwind CSS** | 4.0 | Styling framework |

### **Backend**

| Technology | Purpose |
|------------|---------|
| **Supabase** | Backend-as-a-Service platform |
| **PostgreSQL** | Database (via Supabase) |
| **Row Level Security (RLS)** | Database-level authorization |
| **Database Views** | Real-time aggregation |
| **Database Functions** | Business logic & utilities |

### **State Management**

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Server State** | TanStack Query | API data fetching, caching, invalidation |
| **Local State** | React Hooks (useState) | Component UI state |
| **Browser Storage** | localStorage | visitor_id (90-day persistence) |
| **Session Storage** | sessionStorage | session_id (30-min sessions) |

---

## 📁 Database Schema

### **Tables**

**`analytics_sessions`**
```sql
- id (uuid, PK)
- visitor_id (uuid) -- Unique person
- session_id (uuid) -- Unique visit
- user_code (text) -- Owner's code
- share_code (text) -- Which link was used
- user_agent (text)
- created_at (timestamp)
```

**`analytics_page_views`**
```sql
- id (uuid, PK)
- session_id (uuid) -- Soft reference
- page_name (text) -- 'home', 'contact', 'portfolio'
- viewed_at (timestamp)
```

**`analytics_clicks`**
```sql
- id (uuid, PK)
- session_id (uuid) -- Soft reference
- click_target (text) -- 'contact.phone', 'socialMessaging.whatsapp'
- clicked_at (timestamp)
```

**`analytics_daily_stats`**
```sql
- id (uuid, PK)
- user_code (text)
- share_code (text)
- stat_date (date)
- total_views (integer)
- total_clicks (integer)
- unique_visitors (integer) -- Unique sessions
- unique_people (integer) -- Unique visitor_ids
- created_at (timestamp)
```

### **Views** (Real-time Aggregation)

**`v_realtime_page_stats`**
- Aggregates page views by share_code and page_name
- Joins with sessions to get share_code
- Returns total view counts per screen

**`v_realtime_click_targets`**
- Aggregates clicks by share_code and click_target
- Returns total click counts per button/link

### **Functions**

**`generate_share_code()`**
- Generates unique 6-character codes
- Returns: TEXT (e.g., '4F2A8E')

**`get_default_visible_fields()`**
- Returns default field visibility for groups
- Returns: JSONB array

**`initialize_user_data()`**
- RPC function for user registration
- Creates user_code, business_cards, groups, settings
- Returns: JSONB with success/error

---

## 🔄 Data Flow Architecture

### **Tracking Flow**

```
1. User visits shared card
   ↓
2. useAnalyticsTracking hook initializes
   ↓
3. Check localStorage for visitor_id (90-day)
   - If exists: Use it
   - If not: Generate new UUID, store it
   ↓
4. Check sessionStorage for session_id (30-min)
   - If exists: Use it
   - If not: Generate new UUID, store it
   ↓
5. Create session record in DB (if new)
   - POST /api/analytics/session
   - Resolves share_code if missing
   ↓
6. Track events as they occur:
   - Page views: POST /api/analytics/page-view
   - Clicks: POST /api/analytics/click
   ↓
7. Events auto-create session if missing
   - Prevents orphaned events
   - Ensures data integrity
```

### **Dashboard Flow**

```
1. AnalyticsDashboard.tsx mounts
   ↓
2. TanStack Query fetches data:
   - useQuery('analytics', fetchAnalytics)
   - Passes date range filters
   - Caches results
   ↓
3. API fetches from multiple sources:
   - analytics_daily_stats (daily aggregates)
   - analytics_page_views (screen breakdown)
   - analytics_clicks (click breakdown)
   - analytics_sessions (unique counts)
   ↓
4. Client-side aggregation:
   - Filter by date range
   - Group by share_code
   - Sum totals
   - Calculate unique counts
   ↓
5. Render charts with Recharts:
   - Line chart (time series)
   - Bar charts (breakdowns)
   ↓
6. Auto-refresh on invalidation:
   - When new data tracked
   - When date range changes
   - When share group changes
```

### **Aggregation Strategy**

**Why client-side aggregation?**

Database views (`v_realtime_page_stats`, `v_realtime_click_targets`) aggregate **ALL** data without date filters. This is intentional because:

1. **Performance** - Pre-aggregated views are faster
2. **Flexibility** - Can filter by any date range client-side
3. **Real-time** - No need to regenerate views for date changes

**Implementation:**
- Fetch raw event data from tables
- Apply `WHERE viewed_at >= startDate AND viewed_at <= endDate`
- Aggregate client-side by share_code + target
- Match totals from daily_stats for validation

---

## 🎨 UI Components

### **AnalyticsDashboard.tsx**
Main dashboard container with:
- Date range selector
- Share group filter dropdown
- Metrics cards grid
- Charts section

### **Custom Hooks**

**`useAnalyticsTracking(shareCode?)`**
- Initializes visitor/session tracking
- Auto-creates session records
- Resolves share_code from database if not provided
- Returns: `{ trackPageView, trackClick }`

**React Query Hooks:**
- `useQuery('analytics', ...)` - Fetch analytics data
- `useQuery('shareGroups', ...)` - Fetch user's share groups
- Auto-caching with staleTime/cacheTime
- Background refetching on window focus

---

## 📊 Analytics API Endpoints

### **POST /api/analytics/session**
```typescript
Body: {
  visitor_id: string,
  session_id: string,
  user_code: string,
  share_code?: string, // Optional, resolved from DB
  user_agent: string
}
Response: { success: boolean }
```

### **POST /api/analytics/page-view**
```typescript
Body: {
  session_id: string,
  page_name: 'home' | 'contact' | 'portfolio'
}
Response: { success: boolean }
```

### **POST /api/analytics/click**
```typescript
Body: {
  session_id: string,
  click_target: string // e.g., 'contact.phone', 'socialMessaging.whatsapp'
}
Response: { success: boolean }
```

### **GET /api/analytics**
```typescript
Query: {
  userCode: string,
  shareCode?: string,
  startDate: string, // ISO format
  endDate: string
}
Response: {
  dailyStats: Array<{ date, views, clicks, visitors, people }>,
  pageStats: Array<{ page, count }>,
  clickTargets: Array<{ target, count }>,
  totalViews: number,
  totalClicks: number,
  uniqueVisitors: number,
  uniquePeople: number
}
```

---

## 🔒 Security & Permissions

### **Row Level Security (RLS) Policies**

**Analytics Tables:**
- **INSERT**: Authenticated users can insert their own data
- **SELECT**: Users can only view their own analytics (filtered by user_code)
- **UPDATE/DELETE**: No direct updates allowed (immutable logs)

**Implementation:**
```sql
-- Example RLS policy
CREATE POLICY "Users can view own analytics"
  ON analytics_sessions
  FOR SELECT
  USING (user_code = (SELECT user_code FROM user_code_ownership WHERE user_id = auth.uid()));
```

### **Public Access**
- Visitor tracking: No authentication required
- Event logging: Uses share_code/user_code, not user_id
- Dashboard viewing: Requires authentication (owner only)

---

## 🐛 Key Technical Decisions & Fixes

### **1. Visitor vs Session Tracking**
**Problem:** Double-counting on page refresh
**Solution:** 
- visitor_id = unique people (90-day localStorage)
- session_id = unique visits (30-min sessionStorage)
- Engaged Contacts counts sessions, not visitors

### **2. Share Code Resolution**
**Problem:** Hardcoded "public" breaking analytics
**Solution:**
- Query user_share_groups with is_default=true
- Resolve at session creation time
- Cleanup migration 007 for old data

### **3. Foreign Key Constraints**
**Problem:** Batch insert failures when session missing
**Solution:**
- Removed FK constraints from analytics tables
- Soft references using share_code/session_id
- Auto-create session on orphaned events

### **4. Date Range Filtering**
**Problem:** Database views have no date filter
**Solution:**
- Views aggregate ALL data (performance)
- Client-side filters by date range
- Query raw tables directly for date-specific data

### **5. Page Breakdown Mapping**
**Problem:** Click targets not mapped to screens
**Solution:**
- `getPageForTarget()` function
- Maps click_target patterns to screens
- contact.*/socialMessaging.* → Contact
- socialChannels.* → Home
- portfolio.* → Portfolio

### **6. Null Safety**
**Problem:** TypeError when el.label is undefined
**Solution:**
- Added null-safety checks in AnalyticsDashboard.tsx
- Filter out undefined labels before rendering
- Graceful degradation

---

## 📈 Performance Optimizations

### **Caching Strategy**
```typescript
// TanStack Query configuration
useQuery({
  queryKey: ['analytics', userCode, shareCode, startDate, endDate],
  queryFn: fetchAnalytics,
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 10 * 60 * 1000, // 10 minutes
  refetchOnWindowFocus: true,
})
```

### **Database Indexing**
```sql
-- Indexes for fast queries
CREATE INDEX idx_sessions_user_code ON analytics_sessions(user_code);
CREATE INDEX idx_sessions_share_code ON analytics_sessions(share_code);
CREATE INDEX idx_page_views_session ON analytics_page_views(session_id);
CREATE INDEX idx_page_views_date ON analytics_page_views(viewed_at);
CREATE INDEX idx_clicks_session ON analytics_clicks(session_id);
CREATE INDEX idx_clicks_date ON analytics_clicks(clicked_at);
CREATE INDEX idx_daily_stats_date ON analytics_daily_stats(stat_date);
```

### **Aggregate Views**
- Pre-calculated totals via database views
- Avoids expensive JOINs and GROUP BY on every request
- Real-time updates as new data inserted

---

## 🧪 Testing Considerations

### **Manual Testing Checklist**
- ✅ New visitor creates new visitor_id
- ✅ Same visitor in new session creates new session_id
- ✅ Page views tracked correctly
- ✅ Click events tracked correctly
- ✅ Dashboard shows accurate totals
- ✅ Date range filtering works
- ✅ Share group filtering works
- ✅ Charts render without errors
- ✅ No console errors on null data

### **Edge Cases Handled**
- Missing share_code → Resolves to public group
- Missing session → Auto-creates on event
- Invalid date range → Falls back to last 7 days
- No data → Shows empty state
- Browser localStorage disabled → Generates new visitor_id each visit

---

## 🚀 Future Enhancements (Not Implemented)

Potential features for future development:

1. **Export Analytics**
   - CSV/Excel export
   - PDF reports

2. **Advanced Metrics**
   - Bounce rate
   - Average session duration
   - Geographic location (country/city)
   - Device type breakdown

3. **Real-time Dashboard**
   - WebSocket updates
   - Live visitor count
   - Real-time activity feed

4. **Conversion Tracking**
   - Track specific goals (call, email, form submit)
   - Conversion funnel visualization

5. **A/B Testing**
   - Compare different card designs
   - Track performance by version

6. **Email Reports**
   - Weekly/monthly summary emails
   - Automated insights

---

## 📚 Related Files

### **Frontend**
- `/components/AnalyticsDashboard.tsx` - Main dashboard UI
- `/hooks/useAnalyticsTracking.ts` - Tracking hook
- `/lib/api.ts` - Analytics API functions (lines 629-793)

### **Database Migrations**
- `/supabase/migrations/004_analytics_schema.sql` - Analytics tables
- `/supabase/migrations/006_fix_default_groups.sql` - Fix is_default flags
- `/supabase/migrations/007_cleanup_analytics_public_code.sql` - Clean invalid data

### **Documentation**
- `/ANALYTICS_FEATURE_SUMMARY.md` - This file
- `/NOTE.md` - Technical notes
- `/CHANGELOG.md` - Change history

---

## 💡 Key Learnings

1. **Dual tracking system** - Separating unique people from unique visits prevents double-counting
2. **Soft references** - Avoiding FK constraints in analytics tables prevents batch failures
3. **Client-side aggregation** - Better for date range flexibility than database views
4. **Share code resolution** - Never hardcode "public", always query database
5. **Null safety** - Always check for undefined/null before rendering
6. **Auto-session creation** - Prevents data loss from orphaned events

---

## 🎯 Success Metrics

The Analytics feature successfully:
- ✅ Tracks unique people vs unique visits accurately
- ✅ Records page views and clicks without errors
- ✅ Displays interactive dashboard with real-time data
- ✅ Filters by date range (7/30/90 days, all time, custom)
- ✅ Filters by share group (Public/Private/Business/Personal)
- ✅ Shows detailed breakdowns (screens, click targets)
- ✅ Handles missing data gracefully
- ✅ Respects user privacy (no PII)
- ✅ Performs well with caching and indexing

---

## 📞 Summary

The Analytics feature provides comprehensive, privacy-respecting tracking of digital business card engagement. It uses a modern tech stack (React + TanStack Query + Supabase) to deliver real-time insights through an interactive dashboard, while distinguishing between unique people and unique visits for accurate metrics. The system is robust, handling edge cases like missing sessions and invalid share codes, and optimized for performance with caching, indexing, and aggregate views.

**Brand:** Built for **Cliks** by CLIK COMPANY 🎯
