# Digital Business Card Platform - Project Summary

## 📋 Overview

A modern, mobile-first web application for creating, managing, and sharing digital business cards with comprehensive analytics tracking. Built for **Cliks** by CLIK COMPANY.

---

## 🎯 Core Features

### 1. **Digital Business Card**
- Customizable profile with photo, name, title, company
- Contact information (phone, email, address)
- Social media links (LinkedIn, Facebook, Twitter, Instagram, etc.)
- Messaging apps (WhatsApp, Telegram, Messenger, etc.)
- Portfolio showcase with image galleries
- Professional credentials and bio

### 2. **Share Management System**
- Multiple share groups (Public, Private, Business, Personal)
- Each group has unique share code (e.g., "4F2A8E")
- Field visibility control per group
- Custom group creation
- QR code generation per group
- Password protection (planned)

### 3. **Analytics Dashboard**
- **Dual tracking system:**
  - Unique people (visitor_id) - 90-day persistence
  - Unique visits (session_id) - 30-minute sessions
- **Metrics tracked:**
  - Total views & clicks
  - Engaged contacts (unique sessions)
  - New shares (unique people)
- **Interactive visualizations:**
  - Daily trends (line chart)
  - Page breakdown (bar chart)
  - Click targets (bar chart)
- **Filtering:**
  - Date range (7/30/90 days, all time, custom)
  - Share group filter

### 4. **Content Management System (CMS)**
- User-friendly dashboard for editing business card
- Real-time preview
- Image upload with face detection
- Drag-and-drop portfolio items
- Auto-save functionality
- Field visibility settings

---

## 🛠️ Tech Stack

### **Frontend**
```
React 18.x + TypeScript 5.x
├── UI Framework: React
├── Styling: Tailwind CSS 4.0
├── Charts: Recharts 2.x
├── State Management: TanStack Query (React Query) 5.x
├── Forms: React Hook Form 7.55.0
├── Icons: Lucide React
├── Date Utils: date-fns
└── Routing: React Router (implied)
```

### **Backend**
```
Supabase (Backend-as-a-Service)
├── Database: PostgreSQL
├── Authentication: Supabase Auth
├── Storage: Supabase Storage (images)
├── Realtime: Database views
├── Security: Row Level Security (RLS)
└── Functions: Database functions (no Edge Functions)
```

### **Key Libraries**
- **TanStack Query** - Server state management, caching, invalidation
- **React Hook Form** - Form state and validation
- **Recharts** - Data visualization
- **Lucide React** - Icon library
- **date-fns** - Date formatting

---

## 📁 Project Structure

```
/
├── components/
│   ├── cms/                    # CMS dashboard components
│   │   ├── AnalyticsDashboard.tsx
│   │   ├── BusinessCardStudio.tsx
│   │   ├── ShareConfiguration.tsx
│   │   └── ...
│   ├── screens/                # Public view screens
│   │   ├── ContactScreen.tsx
│   │   ├── PortfolioScreen.tsx
│   │   └── ProfileScreen.tsx
│   ├── ui/                     # Reusable UI components
│   └── ...
├── lib/
│   ├── api.ts                  # API functions (Supabase calls)
│   ├── supabase-client.ts      # Supabase client setup
│   └── query-client.ts         # TanStack Query setup
├── hooks/
│   ├── useAnalytics.ts         # Analytics data fetching
│   ├── useBusinessCard.ts      # Business card CRUD
│   └── ...
├── utils/
│   ├── analytics.ts            # Analytics tracking logic
│   ├── analytics-batcher.ts    # Batch processing
│   └── ...
├── supabase/
│   └── migrations/             # Database migrations
├── styles/
│   └── globals.css             # Global styles + Tailwind
└── types/
    ├── analytics.ts
    ├── business-card.ts
    └── database.ts
```

---

## 📊 Database Schema

### **Core Tables**

**`user_code_ownership`**
- Maps users to their unique 6-character code (e.g., "ABC123")
- One code per user, permanent identifier

**`business_cards`**
- Stores all user profile data
- Flat columns + JSONB for flexibility
- Fields: name, title, company, email, phone, social links, etc.

**`user_share_groups`**
- Share groups per user (Public, Private, Business, Personal, custom)
- Each has unique share_code
- Field: is_default (only Public is true)

**`user_share_settings`**
- Field visibility configuration per group
- Links group → visible_fields (JSONB array)
- Determines what visitors see per share link

### **Analytics Tables**

**`analytics_sessions`**
- Visitor sessions
- Fields: visitor_id, session_id, user_code, share_code

**`analytics_page_views`**
- Page view events
- Fields: session_id, page_name, viewed_at

**`analytics_clicks`**
- Click events
- Fields: session_id, click_target, clicked_at

**`analytics_daily_stats`**
- Pre-aggregated daily statistics
- Fields: user_code, share_code, stat_date, total_views, total_clicks, unique_visitors, unique_people

### **Database Views**

**`v_realtime_page_stats`**
- Real-time page view aggregation
- Groups by share_code + page_name

**`v_realtime_click_targets`**
- Real-time click aggregation
- Groups by share_code + click_target

---

## 🔐 Security Model

### **Row Level Security (RLS)**
- All tables protected by RLS policies
- Users can only access their own data
- Policies filter by user_id or user_code

### **Authentication Flow**
```
1. User signs up/logs in via Supabase Auth
2. RPC function: initialize_user_data() creates:
   - user_code_ownership
   - business_cards (empty template)
   - user_share_groups (4 default groups)
   - user_share_settings (default visibility)
3. User is redirected to CMS dashboard
```

### **Data Access**
- **Public access:** View shared business cards (no auth)
- **Authenticated access:** Edit own card, view analytics
- **No PII in analytics:** Only anonymous visitor IDs

---

## 🚀 Key Workflows

### **1. User Registration**
```
POST /auth/signup
   ↓
Supabase creates auth.users record
   ↓
App calls: supabase.rpc('initialize_user_data')
   ↓
Creates user_code, business_cards, groups, settings
   ↓
Returns user_code (e.g., "ABC123")
   ↓
Redirect to CMS dashboard
```

### **2. Sharing a Business Card**
```
User selects share group (e.g., "Business")
   ↓
Get share_code for that group (e.g., "4F2A8E")
   ↓
Generate share URL: /card/ABC123?share=4F2A8E
   ↓
Visitor opens link
   ↓
Load business card filtered by share group visibility
   ↓
Track analytics with visitor_id + session_id
```

### **3. Analytics Tracking**
```
Visitor opens shared card
   ↓
useAnalyticsTracking hook initializes
   ↓
Check localStorage for visitor_id (90-day)
Check sessionStorage for session_id (30-min)
   ↓
Create session record in DB
   ↓
Track page views & clicks
   ↓
Owner views analytics dashboard
   ↓
Fetch aggregated data via TanStack Query
   ↓
Render charts with Recharts
```

### **4. Editing Business Card**
```
User logs into CMS
   ↓
BusinessCardStudio loads current data
   ↓
User edits fields (auto-save enabled)
   ↓
Changes saved to Supabase
   ↓
TanStack Query invalidates cache
   ↓
Preview updates in real-time
```

---

## 📝 Important Migrations

### **Must Run (In Order)**

1. **`006_fix_default_groups.sql`** (Optional - for existing users)
   - Sets is_default=true only for Public group
   - Fixes share code resolution

2. **`007_cleanup_analytics_public_code.sql`** (Optional - for existing analytics)
   - Replaces hardcoded "public" with actual share codes
   - Critical for accurate analytics

3. **`016_fix_initialize_user_data_rpc.sql`** (REQUIRED!)
   - Fixes registration RPC function
   - Adds share_code to user_share_settings INSERT
   - Without this, new user registration fails!

### **Skip These (Don't Work)**
- ❌ `008_fix_auto_initialize_trigger.sql` - Fixes disabled trigger
- ❌ `014_fix_handle_new_user_share_code.sql` - Fixes disabled trigger

**Why?** Migration 015 disabled all triggers in favor of RPC function approach.

---

## 🎨 Design System

### **Color Scheme**
- Primary: Blue (Public group)
- Secondary: Purple (Private), Green (Business), Pink (Personal)
- Neutral: Grays for UI

### **Typography**
- Default font sizes and weights via globals.css
- Custom tokens for consistency
- Responsive scaling

### **Mobile-First**
- Optimized for mobile viewing
- Touch-friendly buttons
- Responsive layouts with Tailwind

---

## 🔧 Configuration

### **Environment Variables**
```env
VITE_SUPABASE_URL=https://[project].supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

### **Supabase Project Setup**
1. Create Supabase project
2. Run migrations in order (see above)
3. Enable RLS on all tables
4. Configure storage bucket for images
5. Set up authentication (email/password)

---

## 📚 Documentation Files

### **Essential**
- ✅ `ANALYTICS_FEATURE_SUMMARY.md` - Complete analytics guide
- ✅ `FIX_REGISTRATION_FINAL.md` - Registration troubleshooting
- ✅ `MIGRATION_ORDER.md` - Migration instructions
- ✅ `PROJECT_SUMMARY.md` - This file
- ✅ `CHANGELOG.md` - Change history
- ✅ `NOTE.md` - Technical notes

### **Analytics Deep Dives**
- `ANALYTICS_DUAL_TRACKING.md` - Visitor vs session tracking
- `ANALYTICS_METRICS.md` - Metrics explanation
- `ANALYTICS_REALTIME_SOLUTION.md` - Real-time views
- `ANALYTICS_TESTING_GUIDE.md` - Testing procedures
- `ANALYTICS_TIME_PERIODS_EXPLAINED.md` - Time period logic

---

## 🐛 Known Issues & Solutions

### **Registration Error**
**Problem:** "null value in column share_code"
**Solution:** Run migration 016 (see FIX_REGISTRATION_FINAL.md)

### **Analytics Double-Counting**
**Problem:** Page refresh counts as new visitor
**Solution:** Implemented dual tracking (visitor_id + session_id)

### **Share Code "public" in Analytics**
**Problem:** Hardcoded "public" instead of actual codes
**Solution:** Run migration 007, use database query for share code

### **Foreign Key Constraint Failures**
**Problem:** Batch inserts fail when session missing
**Solution:** Removed FK constraints, use soft references + auto-create

---

## 🎯 Success Metrics

### **User Features**
- ✅ Create and customize digital business card
- ✅ Share via multiple groups with different visibility
- ✅ View detailed analytics per share group
- ✅ Mobile-responsive design
- ✅ Fast load times (<2s)

### **Technical Goals**
- ✅ No Edge Functions (100% direct Supabase calls)
- ✅ Type-safe with TypeScript
- ✅ Proper separation of concerns
- ✅ Efficient caching with TanStack Query
- ✅ Secure with RLS policies
- ✅ Scalable database schema

### **Analytics Accuracy**
- ✅ Unique people vs unique visits tracked separately
- ✅ Page views and clicks recorded accurately
- ✅ Real-time dashboard updates
- ✅ Date range filtering works correctly
- ✅ Share group filtering works correctly

---

## 🚀 Deployment

### **Frontend**
- Host on Vercel, Netlify, or similar
- Build command: `npm run build`
- Environment variables: Supabase credentials

### **Database**
- Hosted on Supabase (managed PostgreSQL)
- Automatic backups
- Point-in-time recovery

### **Storage**
- Images stored in Supabase Storage
- CDN-backed for fast delivery
- Automatic image optimization

---

## 📈 Future Roadmap

### **Phase 1: Core (Completed)**
- ✅ Digital business card creation
- ✅ Share group management
- ✅ Analytics tracking
- ✅ CMS dashboard

### **Phase 2: Enhancements (Planned)**
- Password protection for private groups
- QR code generation
- Export analytics (CSV/PDF)
- Custom domains

### **Phase 3: Advanced (Future)**
- A/B testing for cards
- Conversion tracking
- Email reports
- Team collaboration
- White-label options

---

## 👥 Team

**Built for:** Cliks by CLIK COMPANY  
**Platform:** Web Application  
**Status:** Production Ready  

---

## 📞 Support

For technical issues:
1. Check `FIX_REGISTRATION_FINAL.md` for registration problems
2. Check `ANALYTICS_FEATURE_SUMMARY.md` for analytics questions
3. Check `MIGRATION_ORDER.md` for database issues
4. Review `CHANGELOG.md` for recent changes

---

## 🎉 Highlights

**Why This Project Stands Out:**

1. **Sophisticated Analytics** - Dual tracking system (people vs visits) is rare in similar products
2. **Flexible Sharing** - Multiple groups with different visibility per field
3. **Modern Stack** - Latest React, TypeScript, TanStack Query, Tailwind 4.0
4. **No Backend Code** - 100% Supabase RLS + database functions (no Edge Functions)
5. **Type-Safe** - Full TypeScript coverage
6. **Privacy-First** - No PII in analytics, anonymous tracking
7. **Production Ready** - RLS policies, error handling, optimizations

**Technical Achievements:**

- ✅ Client-side aggregation for flexible date filtering
- ✅ Soft references in analytics (no FK constraints)
- ✅ Auto-session creation for orphaned events
- ✅ Share code resolution via database query
- ✅ Real-time views for performance
- ✅ Batch processing for analytics events
- ✅ Comprehensive error handling

---

**Built with ❤️ for Cliks by CLIK COMPANY**
