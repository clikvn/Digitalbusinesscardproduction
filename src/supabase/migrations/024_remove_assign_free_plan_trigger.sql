-- ============================================
-- REMOVE: assign_free_plan_on_signup trigger
-- ============================================
-- PROBLEM: This trigger on auth.users conflicts with manual initialization
-- SOLUTION: Drop it since we use initialize_user_data() RPC instead

-- Drop the trigger from auth.users
DROP TRIGGER IF EXISTS assign_free_plan_trigger ON auth.users;
DROP TRIGGER IF EXISTS assign_free_plan_on_signup_trigger ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop the trigger function
DROP FUNCTION IF EXISTS public.assign_free_plan_on_signup() CASCADE;

-- Verify it's gone
DO $$
DECLARE
  trigger_count INTEGER;
  function_exists BOOLEAN;
BEGIN
  -- Check for triggers on auth.users
  SELECT COUNT(*) INTO trigger_count
  FROM pg_trigger 
  WHERE tgrelid = 'auth.users'::regclass
    AND tgname NOT LIKE 'pg_%'
    AND tgname NOT LIKE 'RI_%';
  
  -- Check if function still exists
  SELECT EXISTS (
    SELECT 1 
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' 
      AND p.proname = 'assign_free_plan_on_signup'
  ) INTO function_exists;
  
  RAISE NOTICE '=== CLEANUP RESULTS ===';
  
  IF trigger_count = 0 THEN
    RAISE NOTICE '✅ No custom triggers on auth.users';
  ELSE
    RAISE WARNING '⚠️ Still found % triggers on auth.users', trigger_count;
  END IF;
  
  IF NOT function_exists THEN
    RAISE NOTICE '✅ assign_free_plan_on_signup function removed';
  ELSE
    RAISE WARNING '⚠️ assign_free_plan_on_signup function still exists';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '=== SIGNUP FLOW ===';
  RAISE NOTICE '1. User signs up via auth.signUp()';
  RAISE NOTICE '2. No triggers fire on auth.users';
  RAISE NOTICE '3. App calls initialize_user_data(user_id)';
  RAISE NOTICE '4. User data created via RPC function';
END $$;
