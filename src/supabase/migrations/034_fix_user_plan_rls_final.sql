-- Migration: 034_fix_user_plan_rls_final.sql
-- Description: Completely rebuild user_plan RLS to fix infinite recursion

-- Step 1: Drop ALL existing policies (no matter what they're called)
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

-- Step 2: Disable RLS temporarily
ALTER TABLE user_plan DISABLE ROW LEVEL SECURITY;

-- Step 3: Re-enable RLS
ALTER TABLE user_plan ENABLE ROW LEVEL SECURITY;

-- Step 4: Create ONE simple policy using ONLY auth.uid()
-- This policy does NOT query any tables, preventing recursion
CREATE POLICY "user_plan_select_own" 
ON user_plan
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Step 5: Verify the policy was created
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'user_plan';
