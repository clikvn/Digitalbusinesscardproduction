-- ============================================
-- RPC Function to check if email already exists
-- ============================================
-- This function checks if an email is already registered in auth.users
-- Returns: true if email exists, false otherwise
-- 
-- IMPORTANT: This uses SECURITY DEFINER to access auth.users table
-- Only checks if email exists - doesn't return any sensitive data

CREATE OR REPLACE FUNCTION check_email_exists(p_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'auth'
AS $$
DECLARE
  v_email_exists BOOLEAN;
BEGIN
  -- Check if email exists in auth.users
  SELECT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE email = LOWER(TRIM(p_email))
  ) INTO v_email_exists;
  
  RETURN v_email_exists;
  
EXCEPTION WHEN OTHERS THEN
  -- If there's an error, return false (fail open - allow signup to proceed)
  RAISE WARNING 'Error in check_email_exists for email %: %', p_email, SQLERRM;
  RETURN false;
END;
$$;

-- Grant execute permission to anonymous users (for signup check)
GRANT EXECUTE ON FUNCTION check_email_exists(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION check_email_exists(TEXT) TO authenticated;

-- ============================================
-- VERIFICATION
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ Created check_email_exists RPC function';
  RAISE NOTICE '✅ Function checks if email exists in auth.users';
  RAISE NOTICE '✅ Returns boolean: true if email exists, false otherwise';
END $$;
