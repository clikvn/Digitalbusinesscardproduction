-- Temporarily disable RLS on user_plan to test
-- WARNING: This allows all users to see all plans temporarily

-- Drop ALL policies
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'user_plan') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON user_plan';
    END LOOP;
END $$;

-- Disable RLS
ALTER TABLE user_plan DISABLE ROW LEVEL SECURITY;

-- Show status
SELECT 
    tablename, 
    rowsecurity 
FROM pg_tables 
WHERE tablename = 'user_plan';
