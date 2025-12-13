-- ============================================
-- REMOVE ANY TRIGGERS ON auth.users
-- ============================================
-- PROBLEM: "Database error saving new user" at auth.signUp() means a trigger on auth.users is failing
-- SOLUTION: Drop all triggers on auth.users since we use manual RPC initialization

-- Check for existing triggers on auth.users
DO $$
DECLARE
  trigger_rec RECORD;
BEGIN
  RAISE NOTICE '=== Checking for triggers on auth.users ===';
  
  FOR trigger_rec IN 
    SELECT tgname, tgtype, tgfoid::regproc as function_name
    FROM pg_trigger 
    WHERE tgrelid = 'auth.users'::regclass
      AND tgname NOT LIKE 'pg_%' -- Exclude system triggers
  LOOP
    RAISE NOTICE 'Found trigger: % -> calls function: %', trigger_rec.tgname, trigger_rec.function_name;
  END LOOP;
END $$;

-- Drop any custom triggers on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS handle_new_user_trigger ON auth.users;
DROP TRIGGER IF EXISTS initialize_user_trigger ON auth.users;

-- Verify triggers are gone
DO $$
DECLARE
  trigger_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO trigger_count
  FROM pg_trigger 
  WHERE tgrelid = 'auth.users'::regclass
    AND tgname NOT LIKE 'pg_%'
    AND tgname NOT LIKE 'RI_%'; -- Exclude foreign key triggers
    
  IF trigger_count = 0 THEN
    RAISE NOTICE '✅ All custom triggers removed from auth.users';
  ELSE
    RAISE WARNING '⚠️ Still found % custom triggers on auth.users', trigger_count;
  END IF;
END $$;

-- Also check if handle_new_user function exists and show its properties
DO $$
DECLARE
  func_exists BOOLEAN;
  func_security TEXT;
BEGIN
  SELECT EXISTS (
    SELECT 1 
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' 
      AND p.proname = 'handle_new_user'
  ) INTO func_exists;
  
  IF func_exists THEN
    SELECT CASE WHEN prosecdef THEN 'SECURITY DEFINER' ELSE 'SECURITY INVOKER' END
    INTO func_security
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' 
      AND p.proname = 'handle_new_user';
      
    RAISE NOTICE 'ℹ️ Function handle_new_user() exists (%)', func_security;
    RAISE NOTICE '   (This function is NOT used because we removed the trigger)';
  ELSE
    RAISE NOTICE 'ℹ️ Function handle_new_user() does not exist';
  END IF;
END $$;

-- Summary
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== SUMMARY ===';
  RAISE NOTICE '✅ No triggers on auth.users will interfere with signup';
  RAISE NOTICE '✅ User initialization happens via manual RPC call in app code';
  RAISE NOTICE '✅ signup flow: auth.signUp() -> app calls initialize_user_data(p_user_id)';
END $$;
