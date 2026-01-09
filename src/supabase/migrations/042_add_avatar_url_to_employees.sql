-- ============================================
-- Add avatar_url to get_business_employees function
-- ============================================
-- This migration updates the get_business_employees RPC function to include
-- avatar_url from the business_cards table so employee avatars can be displayed

-- Drop the existing function first (required when changing return type)
DROP FUNCTION IF EXISTS get_business_employees(UUID);

-- Recreate the function with avatar_url included
CREATE FUNCTION get_business_employees(p_business_owner_user_id UUID DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  employee_user_id UUID,
  employee_code TEXT,
  role TEXT,
  department TEXT,
  is_active BOOLEAN,
  user_email TEXT,
  user_code TEXT,
  employee_name TEXT,
  avatar_url TEXT,
  field_permissions JSONB,
  created_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    bm.id,
    bm.employee_user_id,
    bm.employee_code,
    bm.role,
    bm.department,
    bm.is_active,
    au.email as user_email,
    uco.user_code,
    bc.name as employee_name,
    bc.avatar_url,
    bm.field_permissions,
    bm.created_at
  FROM business_management bm
  INNER JOIN auth.users au ON au.id = bm.employee_user_id
  LEFT JOIN user_code_ownership uco ON uco.user_id = bm.employee_user_id
  LEFT JOIN business_cards bc ON bc.user_id = bm.employee_user_id
  WHERE bm.business_owner_user_id = COALESCE(p_business_owner_user_id, auth.uid());
$$;

-- ============================================
-- VERIFICATION
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ Updated get_business_employees function to include avatar_url';
END $$;
