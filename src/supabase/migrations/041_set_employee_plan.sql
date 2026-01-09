-- ============================================
-- RPC Function to set employee plan
-- ============================================
-- This function allows business owners to set an employee's plan to 'employee'
-- Uses SECURITY DEFINER to bypass RLS

CREATE OR REPLACE FUNCTION set_employee_plan(
  p_employee_user_id UUID,
  p_business_owner_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_is_business_owner BOOLEAN;
BEGIN
  -- Validate that the caller is a business owner
  SELECT EXISTS (
    SELECT 1 FROM user_plan 
    WHERE user_id = p_business_owner_user_id 
    AND plan_name = 'business'
  ) INTO v_is_business_owner;
  
  IF NOT v_is_business_owner THEN
    RAISE EXCEPTION 'Only business owners can set employee plans';
  END IF;
  
  -- Validate that the employee belongs to this business owner
  IF NOT EXISTS (
    SELECT 1 FROM business_management
    WHERE employee_user_id = p_employee_user_id
    AND business_owner_user_id = p_business_owner_user_id
  ) THEN
    RAISE EXCEPTION 'Employee does not belong to this business owner';
  END IF;
  
  -- Insert or update the plan to 'employee'
  INSERT INTO user_plan (user_id, plan_name)
  VALUES (p_employee_user_id, 'employee')
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    plan_name = 'employee',
    updated_at = NOW();
  
  RETURN TRUE;
  
EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'Failed to set employee plan: %', SQLERRM;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION set_employee_plan(UUID, UUID) TO authenticated;

-- ============================================
-- VERIFICATION
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ Created set_employee_plan RPC function';
  RAISE NOTICE '✅ Function allows business owners to set employee plan';
  RAISE NOTICE '✅ Validates business owner status and employee relationship';
END $$;
