-- Full diagnostic for user_plan recursion issue

-- 1. Show ALL policies on user_plan
SELECT '=== POLICIES ON user_plan ===' as info;
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'user_plan';

-- 2. Show ALL triggers on user_plan
SELECT '=== TRIGGERS ON user_plan ===' as info;
SELECT 
  trigger_name,
  event_manipulation,
  action_statement,
  action_timing
FROM information_schema.triggers
WHERE event_object_table = 'user_plan';

-- 3. Show the update_updated_at_column function definition
SELECT '=== FUNCTION DEFINITION ===' as info;
SELECT pg_get_functiondef(oid)
FROM pg_proc
WHERE proname = 'update_updated_at_column';

-- 4. Check if RLS is enabled
SELECT '=== RLS STATUS ===' as info;
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'user_plan';
