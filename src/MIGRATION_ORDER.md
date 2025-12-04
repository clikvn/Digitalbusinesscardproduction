# Migration Order Guide

Run these migrations in Supabase SQL Editor in this exact order:

---

## ⚠️ IMPORTANT: Which Migration to Run?

**TLDR:** Just run **Migration 016** - it's the only one that actually fixes registration!

---

## Migration 1: Fix Default Groups (OPTIONAL - if already have users)

**File:** `/supabase/migrations/006_fix_default_groups.sql`

**What it does:**
- Sets `is_default = true` ONLY for Public group
- Sets `is_default = false` for Private/Business/Personal groups
- Matches by `label` column (works with UUID-based IDs)

**Who needs this:**
- ✅ Existing users with groups already created
- ❌ New installations (no users yet)

**Run this if:**
- You have existing users in the database
- Groups were created before this fix

---

## Migration 2: Cleanup Invalid Analytics Data (OPTIONAL - if have analytics)

**File:** `/supabase/migrations/007_cleanup_analytics_public_code.sql`

**What it does:**
- Fixes `share_code = "public"` entries in:
  - `analytics_sessions` (CRITICAL - used by views)
  - `analytics_page_views`
  - `analytics_clicks`
- Replaces "public" with actual share codes (e.g., "123AAA")

**Who needs this:**
- ✅ Existing users with analytics data
- ✅ Anyone seeing view count discrepancies
- ❌ New installations (no analytics yet)

**Run this if:**
- You have existing analytics data
- `v_realtime_page_stats` shows entries with `share_code = "public"`
- Total views don't match screen breakdown

---

## Migration 3: Fix Auto-Initialize Trigger (SKIP - Trigger Disabled!)

**File:** `/supabase/migrations/008_fix_auto_initialize_trigger.sql`

**⚠️ SKIP THIS!** Fixes a trigger that's not used.

**Why:**
- Migration 015 disabled all triggers
- App uses RPC function instead
- This doesn't help at all

---

## Migration 4: Fix Handle New User Trigger (SKIP - Trigger Disabled!)

**File:** `/supabase/migrations/014_fix_handle_new_user_share_code.sql`

**⚠️ SKIP THIS!** Also fixes a trigger that's not used.

**Why:**
- Migration 015 disabled this trigger too
- App uses RPC function instead
- This doesn't help either

---

## Migration 5: Fix Registration Error (REQUIRED - RUN THIS!)

**File:** `/supabase/migrations/016_fix_initialize_user_data_rpc.sql`

**What it does:**
- Fixes `initialize_user_data()` RPC function (what the app ACTUALLY calls!)
- Adds `share_code` to INSERT statements for `user_share_settings` table
- Fixes BOTH the main INSERT and the retry INSERT
- Prevents NOT NULL constraint violation during registration

**Who needs this:**
- ✅ **EVERYONE** - This is THE fix!
- ✅ New installations
- ✅ Existing installations
- ✅ Anyone with registration failures

**Run this if:**
- New user registration fails
- You see "null value in column share_code" error
- You want registration to work

⚠️ **THIS IS THE ONLY ONE THAT MATTERS!** Without this, registration is broken!

---

## Quick Reference Table

| Migration | File | Status | Reason |
|-----------|------|--------|--------|
| 006 | `fix_default_groups.sql` | Optional | For existing users |
| 007 | `cleanup_analytics_public_code.sql` | Optional | For analytics cleanup |
| 008 | `fix_auto_initialize_trigger.sql` | **SKIP** | Trigger disabled |
| 014 | `fix_handle_new_user_share_code.sql` | **SKIP** | Trigger disabled |
| **016** | **`fix_initialize_user_data_rpc.sql`** | **REQUIRED** | **THE FIX!** |

---

## Recommended Order

### For New Installations:

```sql
-- Just run this one:
-- Migration 016: Fix initialize_user_data() RPC function
```

**That's it!** One migration. Done. ✅

---

### For Existing Installations with Users and Analytics:

```sql
-- Run these in order:

-- 1. Fix default groups for existing users (optional)
-- Migration 006

-- 2. Cleanup invalid analytics data (optional)
-- Migration 007

-- 3. Fix registration for new users (REQUIRED!)
-- Migration 016
```

---

## Why Skip 008 and 014?

**The Registration Flow Changed!**

**Old way (migrations 008 & 014 tried to fix):**
```
User registers
   ↓
Database trigger fires automatically
   ↓
Creates user data
```

**New way (migration 015 implemented):**
```
User registers
   ↓
App calls: supabase.rpc('initialize_user_data')  ← No trigger!
   ↓
RPC function creates user data
```

**Migration 015 line 11:**
```sql
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
```

So triggers 008 and 014 fixed are **not even running**! 

Migration 016 fixes the RPC function that **actually runs**!

---

## How to Run

1. **Open Supabase Dashboard**
2. **Click SQL Editor** (left sidebar)
3. **Copy migration content** from file
4. **Paste into editor**
5. **Click Run**
6. **Check for success message**
7. **Repeat for next migration** (if needed)

---

## Verification After Migration 016

### Check Function is Updated:
```sql
SELECT prosrc 
FROM pg_proc 
WHERE proname = 'initialize_user_data';

-- Search result for "share_code" - should appear in both INSERT statements ✅
```

### Test Registration:
1. Try registering a new user
2. Should succeed without errors ✅

### Check Database:
```sql
-- Check the new user's data
SELECT 
  usg.user_code,
  usg.label as group_name,
  usg.share_code as group_code,
  uss.share_code as settings_code,
  CASE 
    WHEN usg.share_code = uss.share_code THEN '✅ Match'
    ELSE '❌ Mismatch'
  END as status
FROM user_share_groups usg
JOIN user_share_settings uss 
  ON uss.user_id = usg.user_id 
  AND uss.group_id = usg.id
ORDER BY usg.created_at DESC, usg.display_order
LIMIT 4;

-- All share codes should match ✅
```

---

## Troubleshooting

### Error: "relation does not exist"
- Migration file might be targeting wrong database
- Make sure you're in the correct Supabase project

### Error: "column already exists"
- Migration was already run
- Safe to skip

### Registration still fails after running 016
- Did the migration complete successfully?
- Check for error messages in SQL Editor
- Verify function was updated (see verification above)
- Clear any partial user data from failed attempts

### How to clean up failed registration:
```sql
-- Get user ID from failed attempt
SELECT id, email FROM auth.users ORDER BY created_at DESC LIMIT 1;

-- Clean up (replace USER_ID with actual ID)
DELETE FROM user_share_settings WHERE user_id = 'USER_ID';
DELETE FROM user_share_groups WHERE user_id = 'USER_ID';
DELETE FROM business_cards WHERE user_id = 'USER_ID';
DELETE FROM user_code_ownership WHERE user_id = 'USER_ID';

-- Try registering again
```

---

## Summary

**Minimum Required:** Migration 016 only (fix registration RPC function)

**Recommended for Existing Installations:** 
- Migration 006 (optional - fix existing groups)
- Migration 007 (optional - cleanup analytics)
- Migration 016 (required - fix registration)

**Safe to run multiple times:** Yes - uses `CREATE OR REPLACE`

**Skip:** Migrations 008 and 014 (they fix triggers that are disabled)

🎯 **After running migration 016, new users can register successfully!**
