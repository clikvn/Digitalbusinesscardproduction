-- Migration: 035_reenable_user_plan_rls_correct.sql
-- Description: Re-enable RLS with a simple non-recursive policy

-- Step 1: Make sure all old policies are gone
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'user_plan'
    ) LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON user_plan';
        RAISE NOTICE 'Dropped policy: %', r.policyname;
    END LOOP;
END $$;

-- Step 2: Enable RLS
ALTER TABLE user_plan ENABLE ROW LEVEL SECURITY;

-- Step 3: Create simple policy - users can only see their own plan
-- Uses ONLY auth.uid() - no subqueries, no joins, no recursion possible
CREATE POLICY "user_plan_select_own" 
ON user_plan
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Step 4: Grant permission
GRANT SELECT ON user_plan TO authenticated;

-- Step 5: Verify
SELECT 
  'Policy created successfully' as status,
  policyname,
  cmd,
  roles,
  qual
FROM pg_policies 
WHERE tablename = 'user_plan';
