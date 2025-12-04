# How to Apply Database Migrations

This guide explains how to apply Supabase migrations to your database.

---

## **Prerequisites**

- Supabase project connected
- Database is empty or needs schema updates
- Supabase CLI installed (optional for `supabase db push`)

---

## **Apply All Migrations (Recommended)**

### **Option 1: Using Supabase CLI**

```bash
supabase db push
```

This applies all migrations in `/supabase/migrations/` in order.

### **Option 2: Manual SQL Execution**

Go to Supabase Dashboard → **SQL Editor** → **New Query**

Execute migrations in this **exact order**:

#### **Step 1: Base Schema (REQUIRED FIRST)**
Run these three files to create and fix core tables:

1. **`000_base_schema.sql`** - Creates core tables
2. **`000_1_add_share_code_column.sql`** - Adds share_code to user_share_groups (fixes missing column error)
3. **`000_2_add_share_code_to_settings.sql`** - Adds share_code to user_share_settings

**This creates:**
- ✅ `user_code_ownership` - User code mappings
- ✅ `business_cards` - User profiles
- ✅ `share_contacts` - Individual tracked shares
- ✅ `user_share_groups` - Custom share groups
- ✅ `user_share_settings` - Visibility settings
- ✅ `analytics_events` - Old analytics (backwards compatibility)
- ❌ `contacts` - **NOT CREATED** (contact data is in business_cards.custom_fields)

#### **Step 2: Share Configuration (Optional)**
If you need to update share configuration:

4. **`002_share_config_schema_v2.sql`** OR `002_share_config_schema.sql`
   - Only run ONE of these (v2 is newer)
   - Adds share groups and visibility management

#### **Step 3: Other Migrations**
Continue with other numbered migrations as needed.

---

## **Apply Analytics Migration**

After base schema is working:

```bash
# In SQL Editor, run:
/supabase/migrations/004_analytics_scalable_schema.sql
```

**What it does:**
- Creates `analytics_page_views` table with pre-aggregated daily summaries
- Creates `aggregate_analytics_daily()` RPC function
- 95% reduction in database writes
- 100x faster dashboard queries

---

## **Common Errors**

### **Error: column "share_code" does not exist**

**Solution:** Run migration files in order:
1. `000_base_schema.sql`
2. `000_1_add_share_code_column.sql` ⭐
3. `000_2_add_share_code_to_settings.sql` ⭐

The `000_1` and `000_2` migrations fix existing tables that don't have the share_code column.

### **Error: table already exists**

If table exists but is missing columns, the `000_1` and `000_2` migrations will ADD the missing columns instead of trying to create the table.

### **Error: Could not find the table 'public.contacts'**

This is expected - the `contacts` table is not created. The share contacts feature uses the `share_contacts` table instead.

---

## **Verify Migration Success**

```sql
-- Check all tables exist
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename IN (
    'user_code_ownership',
    'business_cards',
    'share_contacts',
    'user_share_groups',
    'user_share_settings',
    'analytics_events'
  )
ORDER BY tablename;

-- Check user_share_groups has share_code column
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_name = 'user_share_groups'
  AND column_name = 'share_code';

-- Should return: share_code | text
```

---

## **Migration Order Summary**

```
000_base_schema.sql                    ← Creates tables
000_1_add_share_code_column.sql        ← Fixes user_share_groups
000_2_add_share_code_to_settings.sql   ← Fixes user_share_settings
002_share_config_schema_v2.sql         ← Share config (optional)
004_analytics_scalable_schema.sql      ← Analytics (optional)
...other migrations...
```

---

**Last Updated:** 2025-01-28