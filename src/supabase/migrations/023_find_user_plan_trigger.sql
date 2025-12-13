-- ============================================
-- DIAGNOSTIC: Find which trigger is referencing user_plan
-- ============================================

-- Check for triggers on auth.users
SELECT 
  'TRIGGERS ON auth.users' as info,
  tgname as trigger_name,
  tgfoid::regproc as function_name
FROM pg_trigger 
WHERE tgrelid = 'auth.users'::regclass
  AND tgname NOT LIKE 'pg_%'
  AND tgname NOT LIKE 'RI_%';

-- Check for triggers on user_code_ownership
SELECT 
  'TRIGGERS ON user_code_ownership' as info,
  tgname as trigger_name,
  tgfoid::regproc as function_name
FROM pg_trigger 
WHERE tgrelid = 'public.user_code_ownership'::regclass
  AND tgname NOT LIKE 'pg_%'
  AND tgname NOT LIKE 'RI_%';

-- Check for triggers on business_cards
SELECT 
  'TRIGGERS ON business_cards' as info,
  tgname as trigger_name,
  tgfoid::regproc as function_name
FROM pg_trigger 
WHERE tgrelid = 'public.business_cards'::regclass
  AND tgname NOT LIKE 'pg_%'
  AND tgname NOT LIKE 'RI_%';

-- Check for triggers on user_share_groups
SELECT 
  'TRIGGERS ON user_share_groups' as info,
  tgname as trigger_name,
  tgfoid::regproc as function_name
FROM pg_trigger 
WHERE tgrelid = 'public.user_share_groups'::regclass
  AND tgname NOT LIKE 'pg_%'
  AND tgname NOT LIKE 'RI_%';

-- Check for triggers on user_share_settings
SELECT 
  'TRIGGERS ON user_share_settings' as info,
  tgname as trigger_name,
  tgfoid::regproc as function_name
FROM pg_trigger 
WHERE tgrelid = 'public.user_share_settings'::regclass
  AND tgname NOT LIKE 'pg_%'
  AND tgname NOT LIKE 'RI_%';

-- Search for any function that references "user_plan" table
SELECT 
  'FUNCTIONS THAT REFERENCE user_plan' as info,
  n.nspname as schema,
  p.proname as function_name,
  pg_get_functiondef(p.oid) as definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE pg_get_functiondef(p.oid) ILIKE '%user_plan%'
  AND n.nspname IN ('public', 'auth')
ORDER BY n.nspname, p.proname;

-- Check if user_plan table exists
SELECT 
  'TABLE EXISTENCE CHECK' as info,
  EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'user_plan'
  ) as user_plan_exists,
  EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'user_plans'
  ) as user_plans_exists;
