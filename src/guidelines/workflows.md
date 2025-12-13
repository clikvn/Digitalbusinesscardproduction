# System Workflows

## 1. User Registration Flow

```
User submits signup form
    ↓
Supabase creates auth.users record
    ↓
App calls: supabase.rpc('initialize_user_data')
    ↓
Database function creates:
  - user_code_ownership (user_code: "ABC123")
  - business_cards (empty template)
  - user_share_groups (4 default: Public, Private, Business, Personal)
  - user_share_settings (default visibility per group)
    ↓
Returns user_code
    ↓
Redirect to CMS dashboard (/cms)
```

**Files involved:**
- `/components/screens/AuthScreen.tsx`
- `/lib/api.ts` (initialize_user_data RPC)
- `/supabase/migrations/016_fix_initialize_user_data_rpc.sql`

---

## 2. Share Business Card Flow

```
User navigates to Share Manager
    ↓
Selects share group (e.g., "Business")
    ↓
Get share_code for group (e.g., "4F2A8E")
    ↓
Generate share URL: /card/ABC123?share=4F2A8E
    ↓
User shares link (QR, copy, etc.)
    ↓
Visitor opens link
    ↓
App loads business card
    ↓
Filter fields by share group visibility (user_share_settings)
    ↓
Display filtered business card
    ↓
Track analytics (visitor_id, session_id)
```

**Files involved:**
- `/components/cms/ShareManager.tsx`
- `/components/cms/ShareConfiguration.tsx`
- `/components/routes/PublicLayout.tsx`
- `/utils/analytics.ts`

---

## 3. Analytics Tracking Flow

```
Visitor opens shared card
    ↓
AnalyticsWrapper initializes
    ↓
Check localStorage for visitor_id (90-day TTL)
  - If missing: Generate new visitor_id
  - If expired: Generate new visitor_id
  - If valid: Reuse visitor_id
    ↓
Check sessionStorage for session_id (30-min TTL)
  - If missing: Generate new session_id
  - If expired: Generate new session_id
  - If valid: Reuse session_id
    ↓
Create session record in analytics_sessions
    ↓
Track page views → analytics_page_views
Track clicks → analytics_clicks
    ↓
Batch events (5-second buffer)
    ↓
Insert to Supabase
    ↓
Daily cron aggregates to analytics_daily_stats
    ↓
Owner views dashboard
    ↓
Fetch aggregated data (TanStack Query)
    ↓
Render charts (Recharts)
```

**Files involved:**
- `/components/AnalyticsWrapper.tsx`
- `/utils/analytics.ts`
- `/utils/analytics-batcher.ts`
- `/hooks/useAnalytics.ts`
- `/components/cms/AnalyticsDashboard.tsx`

---

## 4. Edit Business Card Flow

```
User logs into CMS
    ↓
Navigate to "Edit" tab
    ↓
BusinessCardStudio loads current data
  - useBusinessCard hook fetches from Supabase
  - TanStack Query caches data
    ↓
User edits field (name, title, etc.)
    ↓
React Hook Form tracks changes
    ↓
Auto-save triggers (debounced)
    ↓
Update sent to Supabase
    ↓
TanStack Query invalidates cache
    ↓
Preview updates in real-time (PreviewTab)
```

**Files involved:**
- `/components/cms/BusinessCardStudio.tsx`
- `/components/cms/forms/PersonalInfoForm.tsx`
- `/components/cms/forms/ProfileForm.tsx`
- `/components/cms/PreviewTab.tsx`
- `/hooks/useBusinessCard.ts`

---

## 5. Visitor Session Management

**New Visitor:**
```
visitor_id: GENERATED (stored in localStorage, 90-day TTL)
session_id: GENERATED (stored in sessionStorage, 30-min TTL)
    ↓
Insert analytics_sessions record
    ↓
Track events with session_id
```

**Returning Visitor (within 90 days):**
```
visitor_id: REUSED (from localStorage)
session_id: GENERATED (new session after 30-min timeout)
    ↓
Insert new analytics_sessions record
    ↓
Track events with new session_id
```

**Returning Visitor (same session):**
```
visitor_id: REUSED
session_id: REUSED (within 30-min window)
    ↓
Update existing analytics_sessions record (last_seen)
    ↓
Track events with existing session_id
```

---

## 6. Data Aggregation Flow

**Real-time (Dashboard Load):**
```
User opens Analytics Dashboard
    ↓
Fetch raw events from:
  - analytics_sessions
  - analytics_page_views
  - analytics_clicks
    ↓
Client-side aggregation by date range
    ↓
Calculate metrics:
  - Total views (count page_views)
  - Total clicks (count clicks)
  - Engaged contacts (count unique session_id)
  - New shares (count unique visitor_id)
    ↓
Render charts
```

**Batch Processing (Planned - Daily Cron):**
```
Cron job runs daily
    ↓
Aggregate events into analytics_daily_stats
    ↓
Dashboard queries pre-aggregated data
    ↓
Faster load times
```

---

## 7. Share Group Management

**Create New Group:**
```
User clicks "Add Group"
    ↓
Enter group name (e.g., "VIP Clients")
    ↓
Generate unique share_code
    ↓
Insert into user_share_groups
    ↓
Create default visibility settings in user_share_settings
    ↓
Refresh groups list
```

**Update Visibility:**
```
User selects group
    ↓
Toggle field visibility (checkboxes)
    ↓
Update user_share_settings.visible_fields (JSONB array)
    ↓
Save to Supabase
    ↓
Visitors see updated fields
```

**Files involved:**
- `/components/cms/GroupConfiguration.tsx`
- `/components/cms/FieldVisibilitySettings.tsx`

---

## 8. Portfolio Item Management

**Add Portfolio Item:**
```
User clicks "Add Item"
    ↓
Upload image (Supabase Storage)
    ↓
Enter title, description, media type
    ↓
Save to business_cards.portfolio (JSONB array)
    ↓
Drag to reorder (update portfolio array order)
    ↓
Preview updates
```

**Track Portfolio Interactions:**
```
Visitor clicks portfolio item
    ↓
Determine interaction type:
  - Video play → 'portfolio.videoPlay'
  - Image open → 'portfolio.imageOpen'
  - Virtual tour → 'portfolio.virtualTourOpen'
    ↓
Track via trackClickEvent()
    ↓
Insert into analytics_clicks
    ↓
Dashboard aggregates and displays
```

**Files involved:**
- `/components/cms/PortfolioForm.tsx`
- `/components/portfolio/PortfolioItemDisplay.tsx`
- `/utils/analytics.ts`

---

## 9. AI Portrait Generation Flow

```
User uploads portrait photo in HomeForm
    ↓
Click "AI Restyle" button on background image preview
    ↓
System checks if image is uploaded
  - If missing: Show error toast
  - If present: Open template selection dialog
    ↓
Load 4 portrait style templates:
  - Professional (Simple: color bg | Place: environment bg)
  - Casual (Simple: color bg | Place: environment bg)
  - Fashion (Simple: color bg | Place: environment bg)
  - Fun (Anime style selection)
    ↓
User selects template + configures options
  - Professional/Casual/Fashion: Choose Simple OR Place (mutually exclusive)
  - Fun: Select anime style
    ↓
Submit portrait generation request
    ↓
AI service generates styled portrait
    ↓
Preview and save generated portrait
```

**Template Selection UI:**
- Full-screen mobile-friendly dialog
- Grid layout with template previews
- Selection indicated by: blue border, blue text, checkmark icon
- Centered text using flexbox (`items-center` on flex container)

**Files involved:**
- `/components/cms/forms/HomeForm.tsx`

---

_Last Updated: Dec 8, 2024_