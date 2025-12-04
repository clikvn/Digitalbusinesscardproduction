# Analytics Dashboard Metrics Explanation

## Overview
The Analytics Dashboard tracks engagement with your Digital Business Card across different metrics and dimensions.

---

## Key Metrics (Top Row)

### 1. Total Views
**What it measures:** Total number of page views across all pages  
**Calculation:** Sum of all page views (Home + Contact + Profile + Portfolio)  
**Data source:** `overallMetrics.totalViews`  
**Example:** If someone views Home (1), then Contact (1), then Portfolio (1) = 3 Total Views

### 2. Total Clicks
**What it measures:** Total number of clicks on interactive elements  
**Calculation:** Sum of all clicks (phone, email, WhatsApp, social channels, portfolio items, etc.)  
**Data source:** `overallMetrics.totalClicks`  
**Example:** Clicked Phone (1) + Clicked WhatsApp (1) = 2 Total Clicks

### 3. Engaged Contacts
**What it measures:** Total number of times anyone opened your DBC (including repeat opens)  
**Calculation:** Count of home page views (entry point of DBC)  
**Data source:** `overallMetrics.homePageViews`  
**Key difference from "New Shares":** Counts EVERY open, not just unique visitors  
**Example:** 
- John opens your DBC → Home page viewed → Engaged Contacts: 1
- John navigates to Contact page → Engaged Contacts: still 1 (same visit)
- John closes tab and opens DBC again (within 30 min) → Home page viewed again → Engaged Contacts: 2
- John opens DBC in new tab → Home page viewed again → Engaged Contacts: 3

### 4. New Shares
**What it measures:** Total number of unique viewers who accessed your DBC via share links  
**Calculation:** Count of unique visitor sessions (30-minute timeout)  
**Data source:** `overallMetrics.uniqueVisitors`  
**Key difference from "Engaged Contacts":** Counts unique sessions only  
**Example:** 
- John opens your DBC → New session created → New Shares: 1
- John closes and reopens (within 30 min, same tab) → Same session reused → New Shares: still 1
- John opens in new browser tab → NEW session created → New Shares: 2
- John comes back after 1 hour → NEW session (timeout expired) → New Shares: 3

---

## Session Behavior (IMPORTANT!)

### What is a Session?
A session represents one unique visitor opening your DBC. It uses `sessionStorage` to track visitors.

### Session Timeout Rules:
1. **30-minute inactivity timeout** - Session expires if no activity for 30 minutes
2. **Per-tab tracking** - Each browser tab has its own session (uses `sessionStorage`)
3. **Same tab reopen** - Closing and reopening the same tab within 30 min = SAME session
4. **New tab** - Opening DBC in a new tab = NEW session immediately
5. **New browser** - Opening DBC in a different browser = NEW session

### Session Storage Behavior:
```
sessionStorage (NOT localStorage):
├─ Per browser tab (not shared across tabs)
├─ Cleared when tab is closed
└─ NOT cleared on page refresh (persists during session)
```

### Example Scenarios:

**Scenario 1: Same Tab, Within 30 Minutes**
```
1. User opens DBC at 2:00 PM
   ├─ Session created: session_123
   ├─ Home page viewed
   ├─ Engaged Contacts: +1
   └─ New Shares: +1

2. User closes tab at 2:05 PM

3. User reopens DBC at 2:10 PM (same tab, 5 min later)
   ├─ Session reused: session_123 (within 30 min timeout)
   ├─ Home page viewed again
   ├─ Engaged Contacts: +2 (second home page view)
   └─ New Shares: 1 (same session, no change)
```

**Scenario 2: New Browser Tab**
```
1. User opens DBC in Tab A
   ├─ Session A: session_123
   ├─ Engaged Contacts: +1
   └─ New Shares: +1

2. User opens DBC in Tab B (new tab)
   ├─ Session B: session_456 (NEW sessionStorage)
   ├─ Engaged Contacts: +2
   └─ New Shares: +2
```

**Scenario 3: After 30 Minutes**
```
1. User opens DBC at 2:00 PM
   ├─ Session: session_123
   ├─ Last activity: 2:05 PM
   ├─ Engaged Contacts: +1
   └─ New Shares: +1

2. User returns at 3:00 PM (55 min later, > 30 min timeout)
   ├─ Session expired, new session created: session_789
   ├─ Home page viewed
   ├─ Engaged Contacts: +2
   └─ New Shares: +2
```

---

## Page-Level Metrics (Middle Section)

Each page card shows:
- **Page Views:** How many times that specific page was viewed
- **Interactive Elements:** Clickable items on that page with click counts

### Home Screen
- Quick contact actions (Phone, Email, WhatsApp, Location)
- Save Contact button
- Page view count

### Contact Screen
- All contact methods (Phone, Email, Address)
- Messaging apps (WhatsApp, Telegram, Messenger, Zalo, KakaoTalk, Discord, WeChat)
- Social channels (Facebook, LinkedIn, Twitter, YouTube, TikTok)
- Page view count

### Profile Screen
- About section
- Service Areas
- Specialties
- Experience
- Languages
- Certifications
- Page view count

### Portfolio Screen
- Individual portfolio items
- Next/Previous navigation
- Page view count

---

## Data Flow

### Session Tracking
```
User opens DBC → Session created (session_id)
├─ Tracks first_seen timestamp
├─ Tracks share_code (which group link was used)
├─ Tracks contact_id (if shared with specific contact)
└─ Updates last_seen on each interaction
    └─ Expires after 30 minutes of inactivity
```

### Page View Tracking
```
User navigates to a page → Page view recorded
├─ Session ID
├─ Page type (home/contact/profile/portfolio)
├─ Timestamp
└─ Aggregated into daily stats
```

### Click Tracking
```
User clicks an element → Click recorded
├─ Session ID
├─ Click target (e.g., contact.phone, socialMessaging.whatsapp)
├─ Click category (contact/messaging/social/portfolio/aiAgent)
├─ Timestamp
└─ Aggregated into daily stats
```

---

## Database Tables

### Raw Event Tables (High frequency)
- `analytics_sessions` - Unique visitor sessions
- `analytics_page_views` - Individual page view events
- `analytics_clicks` - Individual click events

### Pre-Aggregated Tables (Fast queries)
- `analytics_daily_user_stats` - Daily stats per user
- `analytics_daily_group_stats` - Daily stats per user + share group
- `analytics_daily_click_targets` - Daily click counts per target
- `analytics_daily_page_stats` - Daily page view counts per page type
- `analytics_daily_contact_stats` - Daily engagement per contact

---

## Filters

### Time Period
- Last 7 days
- Last 30 days
- Last 90 days
- All time

### Group Filter
Filter by which share link was used (Public, Private, custom groups)

### Contact Filter
Filter by specific contact (if DBC was shared with them)

---

## Example Scenario

**User: Sarah (Interior Designer)**

**Monday 10:00 AM** - Client John clicks Sarah's "Public" share link
- ✅ New session created (Engaged Contacts: 1, New Shares: 1)
- Views Home page (Total Views: 1)
- Clicks Phone (Total Clicks: 1)
- Views Contact page (Total Views: 2)
- Clicks WhatsApp (Total Clicks: 2)

**Monday 10:15 AM** - John still browsing (same session)
- Views Portfolio page (Total Views: 3)
- Clicks Portfolio Item 1 (Total Clicks: 3)

**Monday 11:00 AM** - John comes back after 1 hour
- ✅ NEW session (30-min timeout expired) (Engaged Contacts: 2, New Shares: 2)
- Views Home page (Total Views: 4)

**Monday 2:00 PM** - New client Mary clicks Sarah's "Private" share link
- ✅ New session (Engaged Contacts: 3, New Shares: 3)
- Views Home page (Total Views: 5)
- Clicks Email (Total Clicks: 4)

**Final Dashboard:**
- Total Views: 5
- Total Clicks: 4
- Engaged Contacts: 3 (3 unique sessions)
- New Shares: 3 (3 unique sessions)

**Group Breakdown:**
- Public group: 2 sessions, 3 views, 3 clicks
- Private group: 1 session, 2 views, 1 click

---

## Notes

- **Session timeout:** 30 minutes of inactivity
- **Unique Visitors:** Based on session_id (not IP address or device)
- **Page Views:** Counted every time a page is opened
- **Clicks:** Only interactive elements are tracked (buttons, links, contact methods)
- **Real-time updates:** Dashboard refreshes when you change filters
- **Privacy:** Anonymous tracking (no personal data unless contact_id is provided)