-- ============================================
-- MIGRATION: Add Business Account Management
-- ============================================
-- Purpose: Enable business owners to manage employee accounts
-- Changes:
--   1. Add 'business' and 'employee' plans
--   2. Update user_plan CHECK constraint
--   3. Create business_management table
--   4. Add RLS policies
--   5. Update business_cards RLS for business owner access
--   6. Create helper RPC functions

-- ============================================
-- STEP 1: Add new plans to plans table
-- ============================================
INSERT INTO plans (plan_name, display_name, is_active)
VALUES 
  ('business', 'Business Plan', true),
  ('employee', 'Employee Plan', true)
ON CONFLICT (plan_name) DO NOTHING;

-- ============================================
-- STEP 2: Update user_plan CHECK constraint
-- ============================================
ALTER TABLE user_plan 
DROP CONSTRAINT IF EXISTS user_plan_plan_name_check;

ALTER TABLE user_plan
ADD CONSTRAINT user_plan_plan_name_check 
CHECK (plan_name IN ('free', 'premium', 'admin', 'business', 'employee'));

-- ============================================
-- STEP 3: Create business_management table
-- ============================================
CREATE TABLE IF NOT EXISTS public.business_management (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Business owner (user with 'business' plan)
  business_owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Employee (user with 'employee' plan)
  employee_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Employee details (optional)
  employee_code TEXT,
  role TEXT,
  department TEXT,
  
  -- Employee status
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Field-level permissions (JSONB)
  -- Structure: { "field_path": "permission_level" }
  -- permission_level: 'editable' | 'readonly' | 'hidden'
  field_permissions JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- One record per employee
  CONSTRAINT business_management_employee_unique UNIQUE (employee_user_id),
  
  -- Prevent self-reference
  CONSTRAINT business_management_no_self_reference 
    CHECK (business_owner_user_id != employee_user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_business_management_owner 
  ON business_management(business_owner_user_id);
CREATE INDEX IF NOT EXISTS idx_business_management_employee 
  ON business_management(employee_user_id);
CREATE INDEX IF NOT EXISTS idx_business_management_is_active 
  ON business_management(is_active);

-- ============================================
-- STEP 4: RLS Policies for business_management
-- ============================================
ALTER TABLE business_management ENABLE ROW LEVEL SECURITY;

-- Business owners can manage their employees
-- Separate policies for different operations to handle RLS correctly

-- SELECT, UPDATE, DELETE policy
DROP POLICY IF EXISTS "Business owners can manage their employees" ON business_management;
CREATE POLICY "Business owners can manage their employees"
  ON business_management
  FOR SELECT, UPDATE, DELETE
  USING (
    business_owner_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM user_plan 
      WHERE user_id = auth.uid() 
      AND plan_name = 'business'
    )
  );

-- INSERT policy (needs WITH CHECK instead of USING)
DROP POLICY IF EXISTS "Business owners can insert employees" ON business_management;
CREATE POLICY "Business owners can insert employees"
  ON business_management
  FOR INSERT
  WITH CHECK (
    business_owner_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM user_plan 
      WHERE user_id = auth.uid() 
      AND plan_name = 'business'
    )
  );

-- Employees can read their own record
DROP POLICY IF EXISTS "Employees can read their own record" ON business_management;
CREATE POLICY "Employees can read their own record"
  ON business_management
  FOR SELECT
  USING (employee_user_id = auth.uid());

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON business_management TO authenticated;

-- ============================================
-- STEP 5: Update business_cards RLS for business owners
-- ============================================

-- Allow business owners to read employee business cards
DROP POLICY IF EXISTS "Business owners can read employee business cards" ON business_cards;
CREATE POLICY "Business owners can read employee business cards"
  ON business_cards
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM business_management bm
      WHERE bm.employee_user_id = business_cards.user_id
      AND bm.business_owner_user_id = auth.uid()
    )
  );

-- Allow business owners to update employee business cards
DROP POLICY IF EXISTS "Business owners can update employee business cards" ON business_cards;
CREATE POLICY "Business owners can update employee business cards"
  ON business_cards
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM business_management bm
      WHERE bm.employee_user_id = business_cards.user_id
      AND bm.business_owner_user_id = auth.uid()
      AND bm.is_active = true
    )
  );

-- ============================================
-- STEP 6: Helper RPC Functions
-- ============================================

-- Check if user is a business owner
CREATE OR REPLACE FUNCTION is_business_owner(p_user_id UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_plan 
    WHERE user_id = COALESCE(p_user_id, auth.uid())
    AND plan_name = 'business'
  );
$$;

-- Check if user is an employee
CREATE OR REPLACE FUNCTION is_employee(p_user_id UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_plan 
    WHERE user_id = COALESCE(p_user_id, auth.uid())
    AND plan_name = 'employee'
  );
$$;

-- Get all employees for a business owner
CREATE OR REPLACE FUNCTION get_business_employees(p_business_owner_user_id UUID DEFAULT NULL)
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
    bm.field_permissions,
    bm.created_at
  FROM business_management bm
  INNER JOIN auth.users au ON au.id = bm.employee_user_id
  LEFT JOIN user_code_ownership uco ON uco.user_id = bm.employee_user_id
  LEFT JOIN business_cards bc ON bc.user_id = bm.employee_user_id
  WHERE bm.business_owner_user_id = COALESCE(p_business_owner_user_id, auth.uid());
$$;

-- Get business owner for an employee
CREATE OR REPLACE FUNCTION get_employee_business_owner(p_employee_user_id UUID DEFAULT NULL)
RETURNS TABLE (
  business_owner_user_id UUID,
  business_owner_email TEXT,
  business_owner_user_code TEXT,
  business_owner_name TEXT,
  is_active BOOLEAN,
  field_permissions JSONB
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    bm.business_owner_user_id,
    au.email as business_owner_email,
    uco.user_code as business_owner_user_code,
    bc.name as business_owner_name,
    bm.is_active,
    bm.field_permissions
  FROM business_management bm
  INNER JOIN auth.users au ON au.id = bm.business_owner_user_id
  LEFT JOIN user_code_ownership uco ON uco.user_id = bm.business_owner_user_id
  LEFT JOIN business_cards bc ON bc.user_id = bm.business_owner_user_id
  WHERE bm.employee_user_id = COALESCE(p_employee_user_id, auth.uid());
$$;

-- Get employee field permissions
CREATE OR REPLACE FUNCTION get_employee_field_permissions(p_employee_user_id UUID DEFAULT NULL)
RETURNS JSONB
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT field_permissions
      FROM business_management
      WHERE employee_user_id = COALESCE(p_employee_user_id, auth.uid())
      AND is_active = true
    ),
    '{}'::jsonb
  );
$$;

-- Check if employee can edit a specific field
CREATE OR REPLACE FUNCTION can_employee_edit_field(
  p_field_path TEXT,
  p_employee_user_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT 
        CASE 
          WHEN field_permissions->>p_field_path IS NULL THEN true
          WHEN field_permissions->>p_field_path = 'editable' THEN true
          ELSE false
        END
      FROM business_management
      WHERE employee_user_id = COALESCE(p_employee_user_id, auth.uid())
      AND is_active = true
    ),
    true
  );
$$;

-- ============================================
-- VERIFICATION
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ Plans table updated with business and employee plans';
  RAISE NOTICE '✅ user_plan constraint updated';
  RAISE NOTICE '✅ business_management table created';
  RAISE NOTICE '✅ RLS policies created';
  RAISE NOTICE '✅ business_cards RLS updated for business owner access';
  RAISE NOTICE '✅ Helper functions created';
END $$;
