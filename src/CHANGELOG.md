# Changelog

## [Latest] - CRITICAL FIX: react-helmet-async Conflict Removed

### ✅ FIXED: App Crashing on ALL Browsers!

**The DOM manipulation error was caused by react-helmet-async conflicting with Figma Make's runtime!**

**Error (all browsers - desktop and mobile):**
```
NotFoundError: Failed to execute 'removeChild' on 'Node': 
The node to be removed is not a child of this node.
```

**Root Cause:**
- **Figma Make's runtime** controls the `<head>` tag
- **react-helmet-async** also tries to manipulate the `<head>` tag
- Both libraries fighting over the same DOM nodes = CRASH!

**Solution:**
✅ Removed `react-helmet-async` library completely  
✅ Removed `<HelmetProvider>` and `<Helmet>` from App.tsx  
✅ Let Figma Make's runtime fully control the HTML  

**Expected Result:**
✅ Desktop browsers: App loads normally  
✅ Mobile browsers (all): App loads normally  
✅ iOS 16.0-16.3: May still need platform fix  
✅ No more "removeChild" errors!

**Trade-off:**
- ❌ Can't set meta tags dynamically from React
- ❌ Social sharing meta tags won't work (bots don't run JS anyway)
- ✅ App actually works!

---

## [Previous] - iOS 16 CSSStyleSheet Polyfill (Platform Issue)

### ⚠️ iOS 16.0-16.3 Still Blocked

**Issue:** CSSStyleSheet constructor not supported in iOS 16.0-16.3

**Status:** Polyfill created but loads **too late** (after Figma Make's `sites-runtime.js` crashes)

**Solutions:**
1. Contact Figma Make support to add polyfill to their runtime, OR
2. Migrate to platform with full HTML control (Vercel, Netlify)

**Market Impact:** Only ~5-10% of iOS users still on 16.0-16.3

---

## [Previous] - Fixed iOS 16 Compatibility - OKLCH Colors + Viewport Units

### Fixed - CRITICAL iOS 16 BUG ✅ (PARTIAL FIX)

**User Report:** Two users on iOS 16 cannot load the app - blank white screen

**Root Causes Identified:**
1. ✅ OKLCH color space not supported in iOS 16.0-16.3 (Safari < 16.4)
2. ✅ Modern CSS viewport units (dvh, svh) buggy in iOS 16

**What Was Fixed:**

#### 1. OKLCH Colors → HSL Format
- Converted **66 color values** from OKLCH to HSL in `/styles/globals.css`
- Light mode: 33 colors (background, foreground, primary, secondary, etc.)
- Dark mode: 33 colors (same set for dark theme)
- HSL supported in ALL iOS versions (iOS 2.0+)

#### 2. Viewport Units → Standard VH
- `/components/portfolio/PortfolioItemDisplay.tsx`: `100dvh` → `100vh`
- `/components/ui/sidebar.tsx`: `svh` → `screen` (Tailwind)
- Standard `vh` supported in ALL iOS versions (iOS 3.2+)

**Browser Support Timeline:**
- OKLCH: Safari 16.4+ (March 2023) ✅
- OKLCH: Safari 16.0-16.3 ❌ **NOT SUPPORTED** → App broke
- DVH/SVH: iOS 15.4+ ⚠️ **BUGGY** → Layout issues

**Testing:**
- Ask iOS 16 users to clear Safari cache and try again
- Test on iOS 16.0, 16.1, 16.2, 16.3 devices
- Verify app loads and displays correctly

---

## Markdown Support for Profile Fields

### Added
- Full Markdown rendering for all profile text fields (About, Experience, Service Areas, Specialties, Languages, Certifications)
- Created `/components/common/MarkdownText.tsx` component with custom styling
- Supports headings, bold, italic, lists, links, code blocks, and line breaks
- Preserves formatting and line breaks that were lost with plain text display

### Why Standard `<p>` Tags Don't Work
- Plain `<p>` tags collapse newlines and ignore Markdown syntax
- Need `react-markdown` library to parse and render Markdown properly
- Allows users to format profile content with rich text

---

## Video Portfolio Support - YouTube/Vimeo + Direct Files

### Fixed
- **Error:** `NotSupportedError: The element has no supported sources`
- **Cause:** HTML5 `<video>` element can't play YouTube/Vimeo URLs (they're web pages, not video files)

### Solution
- Created `/lib/videoUtils.ts` with smart URL detection
- YouTube/Vimeo URLs → Embedded via `<iframe>`
- Direct video files (.mp4, .mov, .webm) → Played via `<video>`
- Automatic URL conversion (watch?v= → embed/, vimeo.com/ID → player.vimeo.com/video/ID)

### Technical Reason
- HTML5 `<video>` only supports direct video file URLs with video/* MIME types
- YouTube/Vimeo URLs are text/html web pages that require iframe embedding
- Their videos use DRM, ads, analytics that require their own players

---

## Home Screen Analytics Tracking

### Added
- Analytics tracking for Save and Share buttons on home screen
- `home.saveContact` event fires before vCard download
- `home.shareProfile` event fires before Web Share API or URL copy
- Events tracked to `analytics_clicks` table with `session_id` and `visitor_id`

### Dashboard Integration
- `getPageForTarget()` function maps `home.*` click targets to home screen
- Page breakdown section shows all home screen interactions grouped together
- Analytics Dashboard recognizes and displays proper icons for home navigation

---

## Analytics Dashboard - Updated Labels

### Changed
- Simplified navigation labels from "Navigate to X" to "View X" (UI only)
- "Navigate to Profile" → "View Profile"
- "Navigate to Portfolio" → "View Portfolio"  
- "Navigate to Contact" → "View Contact"
- Save Contact and Share Profile labels unchanged

### Important
- This is **UI-only change** in `getAllScreenElements` useMemo
- Database `click_target` values remain unchanged (`home.navigateToProfile`, etc.)
- All data filtering and tracking functionality preserved exactly as is

---

## Contact Share System with Individual Tracking

### Added
- Each contact gets unique 8-character `contactCode` for share tracking
- URL pattern: `/{userCode}/{groupShareCode}/{contactCode}`
- Example: `myclik.com/myclik/xyz789/a3f7c9d2`
  - `xyz789` = group share code (Public/Private/Business/Personal)
  - `a3f7c9d2` = unique contact code

### How It Works
- Contact sees the **group's configured content** (not custom per contact)
- Analytics tracks **individual contact** via `contactCode`
- Measures which contacts engage with shared content
- "New Shares" counts unique people (`visitor_id`)
- "Engaged Contacts" counts unique sessions (`session_id`)

### Database Schema
- `share_contacts.share_code` stores group share code (NOT group ID)
- TypeScript `Contact.group` contains group ID for UI
- `api.shareContacts.save()` maps group ID → share_code before database INSERT
- `api.shareContacts.get()` reverse maps share_code → group ID for UI compatibility

---

## Share Manager Mobile UX

### Fixed
- Add/Edit Contact dialogs now mobile-responsive
- Max height `max-h-[90vh]` with proper scroll behavior
- Header/footer fixed with `flex-shrink-0`
- Middle content scrollable with `overflow-y-auto` and `flex-1`
- Responsive padding `p-4 sm:p-6`

### Contact List Click Areas
- Click contact name/avatar → Opens Edit dialog
- Click share icon (right side) → Goes to ShareStep2 with unique URL
- Separate click areas prevent accidental edits when trying to share

---

## Viewport Meta Tags for Mobile

### Added (via react-helmet-async - REMOVED in latest)
- `width=device-width, initial-scale=1, maximum-scale=1`
- `mobile-web-app-capable=yes`
- `apple-mobile-web-app-capable=yes`
- `format-detection=telephone=no` (prevents auto-zoom on input focus)

### Fixed
- Mobile rendering issues on Android/Samsung/Xiaomi browsers
- App now scales correctly on all mobile devices
- Prevents unwanted zoom and improves touch targets

---

## Analytics Architecture Cleanup

### Removed
- Dropped 5 unused daily ETL tables (`analytics_daily_*`)
- Dropped unused aggregate functions (`aggregate_analytics_daily*`)
- Unscheduled 2AM cron job
- Dual tracking system cleaned up (removed deprecated `analytics_events` table)

### Why
- Application only uses real-time views (`v_realtime_*`)
- Daily tables were being populated but never queried
- Wasted storage and compute resources
- Migration `030_drop_unused_daily_tables.sql` removes all unused components

### Current System
- Real-time analytics views query directly from `analytics_page_views` and `analytics_clicks`
- No FK constraints (soft references with automatic session creation)
- Handles orphaned events gracefully
- Fast and efficient queries

---

## Analytics Contact Filter

### Added
- Filter dashboard by individual contact email
- Maps email → `contactCode` → filters all metrics
- Shows only that contact's page views, clicks, and sessions
- Displays contact's group (disabled) to show which content they saw

### Implementation
- `getAnalyticsDashboard()` passes `contactCode` to `api.analytics.getRealtime()`
- Filters both `analytics_page_views` and `analytics_clicks` at database level
- Recalculates overall metrics from filtered arrays
- Accurate session counting using Set() of unique `session_id`s

---

## OpenAI Kit Removed

### Removed
- All OpenAI Kit (chatkit) functionality removed
- Deleted 4 utility files (`openai-chatkit-config.ts`, etc.)
- Removed `VITE_OPENAI_API_KEY` environment variable
- AIAssistant component stubbed out with placeholder

### Preserved for Flowise
- AI Agent navigation props (`onOpenAIAssistant`)
- `window.__openAIAssistant` global function
- AIAssistant component structure and props interface
- Thread management props

### Next Step
- Integrate Flowise by implementing fetch call to Flowise URL endpoint

---

## Social Media Meta Tags

### Added (REMOVED in latest due to conflict)
- Open Graph tags (Facebook, WhatsApp, LinkedIn, Discord, Slack)
- Twitter Card tags
- Updated title: "CLIK DIGITAL BUSINESS CARD"
- Updated author: "CLIK JSC"

### Why react-helmet-async Doesn't Work for Social Bots
- Social bots don't execute JavaScript
- They only read static HTML `<meta>` tags
- Helmet updates meta tags AFTER React renders (too late)
- Need server-side rendering or Supabase Edge Function for bot detection

### Documentation
- See `/OG_META_TAGS_ISSUE.md` for complete technical details
- See `/supabase/functions/og-meta-handler/` for bot detection solution

---

## Profile Styling Fixes

### Fixed
- Experience label color: `text-[#83827d]` → `text-[#535146]` (matches other labels)
- Profile section spacing: Standardized all content text to `leading-[20px]`
- Service Areas, Specialties, Languages, Certifications now have consistent spacing
- Matches ABOUT and EXPERIENCE sections

---

## React Hooks Violation Fixed

### Fixed
- **Error:** "Rendered more hooks than during the previous render"
- **Cause:** `useEffect` called AFTER early return in PortfolioListing
- **Solution:** Moved `useEffect` before early return statement

### Rules of Hooks
- All hooks must be at top level
- Cannot be inside conditionals or after early returns
- Must be called in same order every render

---

## Auto-Save Race Condition Fixed

### Fixed
- **Bug:** Fast typing + immediate navigation = partial text saved
- **Example:** Type "VU PHAM" quickly → only "VU P" saved
- **Cause:** React state updates are async/batched → unmount captures stale state

### Solution
- Added `latestDataRef` ref to track most current data
- Sync all state changes to ref via useEffect
- On unmount, save from `latestDataRef.current` (guaranteed latest)
- Increased debounce from 800ms to 1500ms

---

## Real Database Entry for "myclik" Demo

### Added
- Migration `008_insert_myclik_demo_data.sql` creates real database records
- User authentication entry
- Business card data (personal, profile, contact, home)
- Share groups (Public, Private, Business, Personal)
- Share settings and visibility configurations

### Why
- Replaced hardcoded TypeScript demo data with real database records
- Enables proper testing of database queries and RLS policies
- Matches production data structure

---

## AI Assistant Mobile Responsiveness

### Fixed
- Chat interface was too wide on mobile (horizontal overflow)
- Added `max-w-full` and `overflow-hidden` to containers
- Reduced padding on mobile: `px-3 sm:px-4`
- User messages: `max-w-[80%] sm:max-w-[85%]`
- Assistant messages: `max-w-full` with `break-words`
- Aggressive word breaking: `overflow-wrap-anywhere`

### Result
- Chat now fits properly on all mobile screen sizes
- No horizontal scrolling
- Long words and URLs break to fit container
