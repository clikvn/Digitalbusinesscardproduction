-- ============================================
-- RPC Function to check if employee account is active
-- ============================================
-- This function checks if a user is an employee and if their account is active
-- Returns: { is_active: boolean, message: string } or null if not an employee
-- 
-- IMPORTANT: Check business_management table first (source of truth)
-- Then optionally verify plan_name matches 'employee'

CREATE OR REPLACE FUNCTION check_employee_status(p_user_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_plan_name TEXT;
  v_is_active BOOLEAN;
  v_employee_exists BOOLEAN;
BEGIN
  -- First check if user exists in business_management table (more reliable)
  -- This is the source of truth for employee status
  SELECT EXISTS (
    SELECT 1 FROM business_management 
    WHERE employee_user_id = p_user_id
  ) INTO v_employee_exists;
  
  -- If user is not in business_management, they're not an employee
  IF NOT v_employee_exists THEN
    RETURN NULL;
  END IF;
  
  -- User is an employee, get their active status
  SELECT is_active INTO v_is_active
  FROM business_management
  WHERE employee_user_id = p_user_id;
  
  -- If is_active is NULL (shouldn't happen, but handle edge case)
  IF v_is_active IS NULL THEN
    -- Default to inactive for safety
    RETURN jsonb_build_object(
      'is_active', false,
      'message', 'Your account status could not be verified. Please contact your business owner.'
    );
  END IF;
  
  -- Return the status
  IF v_is_active THEN
    RETURN jsonb_build_object(
      'is_active', true,
      'message', 'Employee account is active'
    );
  ELSE
    RETURN jsonb_build_object(
      'is_active', false,
      'message', 'Your account has been deactivated by your business owner. Please contact them for more information.'
    );
  END IF;
  
EXCEPTION WHEN OTHERS THEN
  -- On any error, log it but deny access for safety (fail closed)
  RAISE WARNING 'Error in check_employee_status for user %: %', p_user_id, SQLERRM;
  RETURN jsonb_build_object(
    'is_active', false,
    'message', 'Account status verification failed. Please contact support.'
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION check_employee_status(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION check_employee_status(UUID) TO anon;

-- ============================================
-- VERIFICATION
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ Created check_employee_status RPC function';
  RAISE NOTICE '✅ Function checks if user is employee and if account is active';
  RAISE NOTICE '✅ Returns status and message for login validation';
END $$;
