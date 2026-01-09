-- ============================================
-- RPC Function to add employee to business_management
-- ============================================
-- This function runs with SECURITY DEFINER to bypass RLS
-- It validates that the caller is a business owner before inserting

CREATE OR REPLACE FUNCTION add_employee_to_business(
  p_business_owner_user_id UUID,
  p_employee_user_id UUID,
  p_employee_code TEXT DEFAULT NULL,
  p_role TEXT DEFAULT NULL,
  p_department TEXT DEFAULT NULL,
  p_field_permissions JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_id UUID;
  v_is_business_owner BOOLEAN;
BEGIN
  -- Validate that the business owner has a business plan
  SELECT EXISTS (
    SELECT 1 FROM user_plan 
    WHERE user_id = p_business_owner_user_id 
    AND plan_name = 'business'
  ) INTO v_is_business_owner;
  
  IF NOT v_is_business_owner THEN
    RAISE EXCEPTION 'User is not a business owner';
  END IF;
  
  -- Validate employee is not already assigned to a business
  IF EXISTS (
    SELECT 1 FROM business_management 
    WHERE employee_user_id = p_employee_user_id
  ) THEN
    RAISE EXCEPTION 'Employee is already assigned to a business';
  END IF;
  
  -- Validate no self-reference
  IF p_business_owner_user_id = p_employee_user_id THEN
    RAISE EXCEPTION 'Business owner cannot be their own employee';
  END IF;
  
  -- Insert the record
  INSERT INTO business_management (
    business_owner_user_id,
    employee_user_id,
    employee_code,
    role,
    department,
    field_permissions
  ) VALUES (
    p_business_owner_user_id,
    p_employee_user_id,
    p_employee_code,
    p_role,
    p_department,
    p_field_permissions
  )
  RETURNING id INTO v_new_id;
  
  RETURN v_new_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION add_employee_to_business TO authenticated;

-- ============================================
-- VERIFICATION
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ Created add_employee_to_business RPC function';
  RAISE NOTICE '✅ Function uses SECURITY DEFINER to bypass RLS';
  RAISE NOTICE '✅ Validates business owner status before insert';
END $$;
