# Database Design

## Schema Overview

**Database:** PostgreSQL 15+ (Supabase-hosted)

---

## Core Tables

### user_code_ownership
**Purpose:** Maps users to unique 6-character codes

**Columns:**
- `user_code` (TEXT, PK) - Format: "abc123" (lowercase alphanumeric + hyphens)
- `user_id` (UUID, UNIQUE, FK → auth.users)
- `created_at` (TIMESTAMPTZ)

---

### business_cards
**Purpose:** Stores user profile data

**Columns:**
- `id` (UUID, PK)
- `user_id` (UUID, UNIQUE, FK → auth.users)
- `user_code` (TEXT, UNIQUE) - Must match: `^[a-z0-9-]+$`
- `name` (TEXT, NOT NULL)
- `title` (TEXT)
- `company_name` (TEXT)
- `bio` (TEXT)
- `email` (TEXT)
- `phone` (TEXT)
- `website_url` (TEXT)
- `avatar_url` (TEXT)
- `background_image_url` (TEXT)
- `linkedin_url` (TEXT)
- `twitter_url` (TEXT)
- `instagram_url` (TEXT)
- `facebook_url` (TEXT)
- `portfolio_images` (TEXT[]) - Array of image URLs
- `custom_fields` (JSONB) - Default: `{}`
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

---

### share_settings
**Purpose:** Default visibility settings per user (legacy boolean toggles)

**Columns:**
- `id` (UUID, PK)
- `user_id` (UUID, FK → auth.users)
- `user_code` (TEXT, UNIQUE, FK → business_cards.user_code)
- `hide_email` (BOOLEAN) - Default: false
- `hide_phone` (BOOLEAN) - Default: false
- `hide_social` (BOOLEAN) - Default: false
- `hide_portfolio` (BOOLEAN) - Default: false
- `custom_settings` (JSONB) - Default: `{}`
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

**Note:** Legacy table. Granular control handled by user_share_settings.

---

### user_share_groups
**Purpose:** Share groups per user (e.g., Public, Business, Personal)

**Columns:**
- `id` (TEXT, PK) - Custom ID format
- `user_id` (UUID, NOT NULL, FK → auth.users)
- `user_code` (TEXT, NOT NULL)
- `label` (TEXT, NOT NULL) - Display name: "Public", "Business"
- `description` (TEXT)
- `share_code` (TEXT, NOT NULL) - MUST NOT be: STUDIO, AUTH, CONTACT, PROFILE, PORTFOLIO
- `icon` (TEXT, NOT NULL) - Default: "Users"
- `color` (TEXT, NOT NULL) - Default: "blue"
- `is_default` (BOOLEAN, NOT NULL) - Default: false
- `display_order` (INTEGER, NOT NULL) - Default: 0
- `created_at` (TIMESTAMPTZ, NOT NULL)
- `updated_at` (TIMESTAMPTZ, NOT NULL)

**Reserved share_code values:** Cannot use STUDIO, AUTH, CONTACT, PROFILE, PORTFOLIO

---

### user_share_settings
**Purpose:** Field visibility per share group

**Columns:**
- `id` (UUID, PK)
- `user_id` (UUID, NOT NULL, FK → auth.users)
- `user_code` (TEXT, NOT NULL)
- `group_id` (TEXT, NOT NULL, FK → user_share_groups.id)
- `share_code` (TEXT, NOT NULL)
- `visible_fields` (JSONB, NOT NULL) - Array of field paths, Default: `[]`
- `created_at` (TIMESTAMPTZ, NOT NULL)
- `updated_at` (TIMESTAMPTZ, NOT NULL)

**visible_fields format:** `["personal.name", "contact.email", "social.linkedin"]`

---

### share_contacts
**Purpose:** Track contacts who accessed user's shared profile

**Columns:**
- `id` (UUID, PK)
- `user_id` (UUID, NOT NULL, FK → auth.users)
- `user_code` (TEXT, NOT NULL)
- `contact_name` (TEXT, NOT NULL)
- `contact_email` (TEXT)
- `contact_phone` (TEXT)
- `contact_company` (TEXT)
- `notes` (TEXT)
- `share_code` (TEXT, NOT NULL) - Default: "public"
- `contact_code` (TEXT, NOT NULL, UNIQUE) - 8-char tracking code
- `created_at` (TIMESTAMPTZ, NOT NULL)
- `updated_at` (TIMESTAMPTZ, NOT NULL)

---

## Analytics Tables

### analytics_sessions
**Purpose:** Tracks visitor sessions

**Columns:**
- `session_id` (TEXT, PK) - Format: "session_{timestamp}_{random}"
- `user_code` (TEXT, NOT NULL)
- `share_code` (TEXT, NOT NULL)
- `contact_id` (TEXT) - Contact code (not UUID!)
- `visitor_id` (TEXT) - 90-day localStorage ID
- `first_seen` (TIMESTAMPTZ, NOT NULL)
- `last_seen` (TIMESTAMPTZ, NOT NULL)
- `page_views` (INTEGER) - Default: 0
- `clicks` (INTEGER) - Default: 0
- `ip_address` (TEXT)
- `user_agent` (TEXT)
- `referrer` (TEXT)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

---

### analytics_page_views
**Purpose:** Page view events

**Columns:**
- `id` (UUID, PK)
- `session_id` (TEXT, NOT NULL)
- `user_code` (TEXT, NOT NULL)
- `share_code` (TEXT, NOT NULL)
- `contact_id` (TEXT) - Contact code (not UUID!)
- `page_type` (TEXT, NOT NULL) - CHECK: "home", "contact", "profile", "portfolio"
- `viewed_at` (TIMESTAMPTZ, NOT NULL)
- `created_at` (TIMESTAMPTZ)

---

### analytics_clicks
**Purpose:** Click events

**Columns:**
- `id` (UUID, PK)
- `session_id` (TEXT, NOT NULL)
- `user_code` (TEXT, NOT NULL)
- `share_code` (TEXT, NOT NULL)
- `contact_id` (TEXT) - Contact code (not UUID!)
- `click_target` (TEXT, NOT NULL) - e.g., "contact.phone"
- `click_category` (TEXT, NOT NULL) - CHECK: "contact", "messaging", "social", "portfolio", "aiAgent", "other"
- `clicked_at` (TIMESTAMPTZ, NOT NULL)
- `created_at` (TIMESTAMPTZ)

---

### analytics_events
**Purpose:** Generic event tracking (flexible schema)

**Columns:**
- `id` (UUID, PK)
- `user_code` (TEXT, NOT NULL)
- `event_type` (TEXT, NOT NULL)
- `event_data` (JSONB) - Default: `{}`
- `ip_address` (TEXT)
- `user_agent` (TEXT)
- `referrer` (TEXT)
- `created_at` (TIMESTAMPTZ)

**Note:** No share_code column. Generic event storage.

---

## Plan & Quota System

### plans
**Purpose:** Master list of subscription plans

**Columns:**
- `id` (UUID, PK)
- `plan_name` (TEXT, NOT NULL, UNIQUE) - Must be lowercase: "free", "premium", "admin"
- `display_name` (TEXT, NOT NULL) - Human-readable: "Free Plan"
- `is_active` (BOOLEAN, NOT NULL) - Default: true
- `created_at` (TIMESTAMPTZ, NOT NULL)
- `updated_at` (TIMESTAMPTZ, NOT NULL)

**Note:** Lookup table. Defines available plans.

---

### user_plan
**Purpose:** Assign plan to each user

**Columns:**
- `user_id` (UUID, PK, FK → auth.users)
- `plan_name` (TEXT, NOT NULL, FK → plans.plan_name)
- `created_at` (TIMESTAMPTZ, NOT NULL)
- `updated_at` (TIMESTAMPTZ, NOT NULL)

**Default:** Users created with "free" plan via initialize_user_data RPC

---

### quota_limits
**Purpose:** Define quota limits per plan and feature

**Columns:**
- `id` (UUID, PK)
- `plan_name` (TEXT, NOT NULL, FK → plans.plan_name)
- `feature_name` (TEXT, NOT NULL)
- `period_type` (TEXT, NOT NULL) - CHECK: "hourly", "daily", "weekly", "monthly"
- `limit_value` (INTEGER, NOT NULL) - -1 = unlimited, ≥0 = actual limit
- `created_at` (TIMESTAMPTZ, NOT NULL)

**Examples:**
- `{plan: "free", feature: "portrait_generation", period: "hourly", limit: 2}`
- `{plan: "free", feature: "portrait_generation", period: "monthly", limit: 10}`
- `{plan: "admin", feature: "portrait_generation", period: "monthly", limit: -1}` (unlimited)

---

### usage_logs
**Purpose:** Track actual feature usage

**Columns:**
- `id` (UUID, PK)
- `user_id` (UUID, NOT NULL, FK → auth.users)
- `feature_name` (TEXT, NOT NULL) - CHECK: length > 0
- `created_at` (TIMESTAMPTZ, NOT NULL) - Timestamp of usage
- `metadata` (JSONB) - Default: `{}`

**Note:** Logged AFTER successful feature execution. Used by check_user_quota RPC.

---

## Portrait Generation

### portrait_generation_results
**Purpose:** Track AI portrait generation requests and results

**Columns:**
- `id` (UUID, PK)
- `user_id` (UUID, NOT NULL, FK → auth.users)
- `template_id` (TEXT, NOT NULL) - External API template ID
- `template_name` (TEXT, NOT NULL) - "Professional", "Casual", etc.
- `source_image_url` (TEXT) - User's uploaded photo
- `result_image_url` (TEXT) - Generated portrait URL
- `status` (TEXT, NOT NULL) - CHECK: "pending", "processing", "completed", "failed"
- `error_message` (TEXT)
- `processing_time_ms` (INTEGER) - Milliseconds taken
- `created_at` (TIMESTAMPTZ, NOT NULL)
- `completed_at` (TIMESTAMPTZ)

**Default status:** "pending"

---

## System Tables

### kv_store_47604332
**Purpose:** Generic key-value store for app configuration

**Columns:**
- `key` (TEXT, PK)
- `value` (JSONB, NOT NULL)

**Note:** Internal system table for flexible data storage.

---

## Database Views

### v_realtime_user_stats
**Purpose:** Real-time aggregation of analytics by user_code

**Groups by:** user_code

---

### v_realtime_group_stats
**Purpose:** Real-time aggregation of analytics by share_code

**Groups by:** share_code

---

### v_realtime_daily_stats
**Purpose:** Real-time daily statistics aggregation

**Groups by:** user_code, share_code, date

---

### v_engaged_contacts_summary
**Purpose:** Contact engagement summary (page views + clicks)

**Groups by:** contact_code

---

### v_contact_engagement_timeline
**Purpose:** Detailed contact engagement events timeline

**Returns:** Chronological list of contact interactions

---

## RPC Functions

### initialize_user_data(p_user_id UUID)
**Purpose:** Initialize new user data (user_code, business_card, share_groups, plan)

**Returns:** JSON with success status and user_code

**Called:** During user signup

**Creates:**
- Random 6-char user_code in user_code_ownership
- Business card with default values
- Default share groups (Public)
- User plan entry (free)

---

### check_user_quota(p_user_id UUID, p_feature_name TEXT)
**Purpose:** Check if user can use feature based on hourly/monthly limits

**Returns:** JSON array with:
- `can_use` (BOOLEAN)
- `plan_name` (TEXT)
- `hourly_used`, `hourly_limit`, `hourly_remaining` (INTEGER)
- `monthly_used`, `monthly_limit`, `monthly_remaining` (INTEGER)
- `hourly_reset_at`, `monthly_reset_at` (TIMESTAMPTZ)

**Called:** Before portrait generation (or other quota-limited features)

**Logic:**
- Reads user_plan to get current plan
- Reads quota_limits for plan + feature
- Counts usage_logs for hourly/monthly periods
- Returns remaining quota

---

### aggregate_analytics_daily_with_contacts(...)
**Purpose:** Aggregate analytics data with contact information

**Returns:** Aggregated analytics with contact details

**Called:** For analytics dashboard

---

## Storage Buckets

### user-assets
**Purpose:** Store user-uploaded files (profile photos, portfolio images)

**Settings:**
- Public access for file URLs
- File size limits enforced
- Organized by user_id

---

## Naming Conventions

**Tables:**
- Lowercase, underscores, plural/singular as appropriate
- Examples: `business_cards`, `user_plan`, `analytics_sessions`

**Columns:**
- Lowercase, underscores, descriptive
- Timestamps: `created_at`, `updated_at`, `viewed_at`, `clicked_at`
- Booleans: `is_default`, `is_active`, `hide_*`
- Foreign keys: `user_id`, `group_id`

**JSONB Fields:**
- Snake_case for table columns: `custom_fields`, `event_data`
- camelCase for keys inside JSONB (application-level)

---

## Security (RLS)

**Row Level Security:**
- Enabled on all tables
- Users can only access their own data (WHERE user_id = auth.uid())
- Public read access for shared business cards
- Analytics tables filtered by user_code ownership

---

_Last Updated: Dec 9, 2024_
