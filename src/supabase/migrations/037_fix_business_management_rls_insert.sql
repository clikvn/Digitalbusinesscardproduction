-- ============================================
-- FIX: Business Management RLS Policy for INSERT
-- ============================================
-- Issue: INSERT operations fail with RLS policy violation
-- Cause: Policy uses USING clause which doesn't apply to INSERT
-- Solution: Use FOR ALL with both USING and WITH CHECK clauses

-- Drop the existing policy
DROP POLICY IF EXISTS "Business owners can manage their employees" ON business_management;
DROP POLICY IF EXISTS "Business owners can insert employees" ON business_management;

-- Create a single policy for ALL operations
-- USING applies to SELECT, UPDATE, DELETE
-- WITH CHECK applies to INSERT and UPDATE (new row check)
CREATE POLICY "Business owners can manage their employees"
  ON business_management
  FOR ALL
  USING (
    business_owner_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM user_plan 
      WHERE user_id = auth.uid() 
      AND plan_name = 'business'
    )
  )
  WITH CHECK (
    business_owner_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM user_plan 
      WHERE user_id = auth.uid() 
      AND plan_name = 'business'
    )
  );

-- ============================================
-- VERIFICATION
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ Fixed business_management RLS policy';
  RAISE NOTICE '✅ Policy now uses FOR ALL with both USING and WITH CHECK';
END $$;
