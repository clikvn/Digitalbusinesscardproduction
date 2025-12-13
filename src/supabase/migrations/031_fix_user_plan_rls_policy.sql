-- Migration: 031_fix_user_plan_rls_policy.sql
-- Description: Fix infinite recursion in user_plan RLS policy

-- Drop all existing RLS policies on user_plan
DROP POLICY IF EXISTS "user_plan_read_own" ON user_plan;
DROP POLICY IF EXISTS "Users can view their own plan" ON user_plan;
DROP POLICY IF EXISTS "Enable read access for users" ON user_plan;

-- Create a simple policy that uses auth.uid() directly (no joins, no recursion)
CREATE POLICY "user_plan_select_own" ON user_plan
  FOR SELECT
  USING (auth.uid() = user_id);

-- Ensure RLS is enabled
ALTER TABLE user_plan ENABLE ROW LEVEL SECURITY;

COMMENT ON POLICY "user_plan_select_own" ON user_plan IS 'Users can only read their own plan using auth.uid()';
