-- ============================================
-- TEST: initialize_user_data function
-- ============================================

-- Test with a fake UUID to see what error we get
DO $$
DECLARE
  test_user_id UUID := '00000000-0000-0000-0000-000000000001';
  result JSONB;
BEGIN
  RAISE NOTICE '=== Testing initialize_user_data() ===';
  RAISE NOTICE 'Test user_id: %', test_user_id;
  
  -- Call the function
  BEGIN
    result := initialize_user_data(test_user_id);
    RAISE NOTICE 'Result: %', result;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'ERROR: % - %', SQLSTATE, SQLERRM;
  END;
END $$;

-- Show the function definition to verify it's correct
SELECT 
  'initialize_user_data function definition' as info,
  pg_get_functiondef(oid) as definition
FROM pg_proc 
WHERE proname = 'initialize_user_data'
  AND pronamespace = 'public'::regnamespace;
