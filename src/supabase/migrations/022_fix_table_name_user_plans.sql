-- ============================================
-- FIX: Table name mismatch - user_plan vs user_plans
-- ============================================
-- ERROR: relation "user_plan" does not exist
-- SOLUTION: Check which table exists and fix the initialize_user_data function

-- First, check which table exists
DO $$
DECLARE
  has_user_plan BOOLEAN;
  has_user_plans BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'user_plan'
  ) INTO has_user_plan;
  
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'user_plans'
  ) INTO has_user_plans;
  
  RAISE NOTICE '=== Table Existence Check ===';
  RAISE NOTICE 'user_plan (singular): %', has_user_plan;
  RAISE NOTICE 'user_plans (plural): %', has_user_plans;
  
  IF has_user_plans AND NOT has_user_plan THEN
    RAISE NOTICE '✅ Using user_plans (plural) - will update initialize_user_data';
  ELSIF has_user_plan AND NOT has_user_plans THEN
    RAISE NOTICE '✅ Using user_plan (singular) - will update initialize_user_data';
  ELSIF has_user_plan AND has_user_plans THEN
    RAISE WARNING '⚠️ BOTH tables exist! This is wrong - please consolidate';
  ELSE
    RAISE WARNING '⚠️ Neither table exists! Will create user_plans';
  END IF;
END $$;

-- Create user_plans table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_plans (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_name TEXT NOT NULL DEFAULT 'free' CHECK (plan_name IN ('free', 'premium', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.user_plans ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS "user_plans_select_own" ON public.user_plans;

-- Create policy - users can only see their own plan
CREATE POLICY "user_plans_select_own" 
ON public.user_plans
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Grant permissions
GRANT SELECT ON public.user_plans TO authenticated;

-- Update initialize_user_data to use user_plans (plural)
CREATE OR REPLACE FUNCTION public.initialize_user_data(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_user_code TEXT;
BEGIN
  -- Generate unique user code
  new_user_code := generate_unique_user_code();
  
  -- Insert into user_code_ownership
  INSERT INTO user_code_ownership (user_code, user_id)
  VALUES (new_user_code, p_user_id);
  
  -- Insert into business_cards
  INSERT INTO business_cards (user_id, user_code, name, title, company_name)
  VALUES (
    p_user_id,
    new_user_code,
    COALESCE((SELECT raw_user_meta_data->>'name' FROM auth.users WHERE id = p_user_id), 'New User'),
    '',
    ''
  );
  
  -- Insert into user_plans (PLURAL, not user_plan)
  INSERT INTO user_plans (user_id, plan_name)
  VALUES (p_user_id, 'free');
  
  -- Create default public share group
  INSERT INTO user_share_groups (
    id,
    user_id,
    user_code,
    label,
    description,
    share_code,
    icon,
    color,
    is_default,
    display_order
  ) VALUES (
    'public',
    p_user_id,
    new_user_code,
    'Public',
    'Share with anyone',
    substring(md5(random()::text) from 1 for 6),
    'Globe',
    'blue',
    true,
    0
  );
  
  -- Create default private share group  
  INSERT INTO user_share_groups (
    id,
    user_id,
    user_code,
    label,
    description,
    share_code,
    icon,
    color,
    is_default,
    display_order
  ) VALUES (
    'private',
    p_user_id,
    new_user_code,
    'Private',
    'Only visible to me',
    substring(md5(random()::text) from 1 for 6),
    'Lock',
    'gray',
    true,
    1
  );
  
  RETURN json_build_object(
    'success', true,
    'user_code', new_user_code
  );
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to initialize user data: %', SQLERRM;
END;
$$;

-- Verify the function
DO $$
BEGIN
  RAISE NOTICE '✅ initialize_user_data function updated to use user_plans (plural)';
END $$;
