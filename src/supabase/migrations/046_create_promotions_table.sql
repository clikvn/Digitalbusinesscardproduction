-- ============================================
-- MIGRATION: Create promotions table
-- ============================================
-- Purpose: Store promotion codes for plan upgrades
-- Fields:
--   - code: Unique promotion code (e.g., "SUMMER2024")
--   - plan_name: Target plan to upgrade to (e.g., "business")
--   - expires_at: Expiration date/time
--   - is_active: Whether the code is currently active
--   - max_uses: Maximum number of times the code can be used (NULL = unlimited)
--   - used_count: Number of times the code has been used
--   - created_at, updated_at: Timestamps
--
-- Usage tracking:
--   - promotion_usage table tracks which users have used which codes
--   - Prevents duplicate usage by the same user
-- ============================================

-- Create promotions table
CREATE TABLE IF NOT EXISTS public.promotions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  plan_name TEXT NOT NULL CHECK (plan_name IN ('free', 'premium', 'admin', 'business', 'employee')),
  expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  max_uses INTEGER, -- NULL means unlimited uses
  used_count INTEGER DEFAULT 0 NOT NULL,
  description TEXT, -- Optional description of the promotion
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  CONSTRAINT promotions_code_unique UNIQUE (code)
  -- Note: We don't enforce expires_at > created_at because:
  -- 1. created_at is set at insert time, which can cause timing issues
  -- 2. We validate expires_at > NOW() in the application logic instead
  -- 3. This allows more flexibility for creating promotions
);

-- Create promotion_usage table to track which users have used which codes
CREATE TABLE IF NOT EXISTS public.promotion_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  promotion_id UUID NOT NULL REFERENCES public.promotions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  used_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  CONSTRAINT promotion_usage_user_promotion_unique UNIQUE (promotion_id, user_id)
);

-- Enable RLS
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotion_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies for promotions table
-- Anyone can read active promotions (to validate codes)
DROP POLICY IF EXISTS "Anyone can read active promotions" ON public.promotions;
CREATE POLICY "Anyone can read active promotions"
  ON public.promotions FOR SELECT
  USING (is_active = true AND expires_at > NOW());

-- Only service role can insert/update/delete promotions (admin operations)
-- Regular users cannot modify promotions

-- RLS Policies for promotion_usage table
-- Users can read their own usage records
DROP POLICY IF EXISTS "Users can read their own promotion usage" ON public.promotion_usage;
CREATE POLICY "Users can read their own promotion usage"
  ON public.promotion_usage FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own usage records (when applying a code)
DROP POLICY IF EXISTS "Users can insert their own promotion usage" ON public.promotion_usage;
CREATE POLICY "Users can insert their own promotion usage"
  ON public.promotion_usage FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_promotions_code ON public.promotions(code);
CREATE INDEX IF NOT EXISTS idx_promotions_active_expires ON public.promotions(is_active, expires_at);
CREATE INDEX IF NOT EXISTS idx_promotion_usage_user_id ON public.promotion_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_promotion_usage_promotion_id ON public.promotion_usage(promotion_id);

-- Comments
COMMENT ON TABLE public.promotions IS 'Stores promotion codes for plan upgrades';
COMMENT ON COLUMN public.promotions.code IS 'Unique promotion code (case-insensitive recommended)';
COMMENT ON COLUMN public.promotions.plan_name IS 'Target plan to upgrade to when code is applied';
COMMENT ON COLUMN public.promotions.expires_at IS 'Expiration date/time for the promotion code';
COMMENT ON COLUMN public.promotions.max_uses IS 'Maximum number of times the code can be used (NULL = unlimited)';
COMMENT ON COLUMN public.promotions.used_count IS 'Number of times the code has been used';
COMMENT ON TABLE public.promotion_usage IS 'Tracks which users have used which promotion codes';

-- Function to validate and apply promotion code
CREATE OR REPLACE FUNCTION public.validate_promotion_code(
  p_code TEXT,
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_promotion RECORD;
  v_already_used BOOLEAN;
  v_result JSONB;
BEGIN
  -- Find the promotion code (case-insensitive)
  SELECT * INTO v_promotion
  FROM public.promotions
  WHERE UPPER(code) = UPPER(p_code)
    AND is_active = true
    AND expires_at > NOW();
  
  -- Check if promotion exists
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'Invalid or expired promotion code'
    );
  END IF;
  
  -- Check if user has already used this code
  SELECT EXISTS (
    SELECT 1 FROM public.promotion_usage
    WHERE promotion_id = v_promotion.id
      AND user_id = p_user_id
  ) INTO v_already_used;
  
  IF v_already_used THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'You have already used this promotion code'
    );
  END IF;
  
  -- Check if max_uses limit has been reached
  IF v_promotion.max_uses IS NOT NULL AND v_promotion.used_count >= v_promotion.max_uses THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'This promotion code has reached its usage limit'
    );
  END IF;
  
  -- Code is valid
  RETURN jsonb_build_object(
    'valid', true,
    'promotion_id', v_promotion.id,
    'plan_name', v_promotion.plan_name,
    'description', v_promotion.description
  );
END;
$$;

-- Function to apply promotion code (upgrade user's plan)
CREATE OR REPLACE FUNCTION public.apply_promotion_code(
  p_code TEXT,
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_validation JSONB;
  v_promotion_id UUID;
  v_plan_name TEXT;
BEGIN
  -- Validate the code first
  v_validation := public.validate_promotion_code(p_code, p_user_id);
  
  IF (v_validation->>'valid')::boolean = false THEN
    RETURN v_validation;
  END IF;
  
  -- Extract promotion details
  v_promotion_id := (v_validation->>'promotion_id')::uuid;
  v_plan_name := v_validation->>'plan_name';
  
  -- Record the usage
  INSERT INTO public.promotion_usage (promotion_id, user_id)
  VALUES (v_promotion_id, p_user_id)
  ON CONFLICT (promotion_id, user_id) DO NOTHING;
  
  -- Increment used_count
  UPDATE public.promotions
  SET used_count = used_count + 1,
      updated_at = NOW()
  WHERE id = v_promotion_id;
  
  -- Update user's plan
  -- Use UPSERT to update or insert user plan
  INSERT INTO public.user_plan (user_id, plan_name, updated_at)
  VALUES (p_user_id, v_plan_name, NOW())
  ON CONFLICT (user_id) DO UPDATE
  SET plan_name = EXCLUDED.plan_name,
      updated_at = NOW();
  
  RETURN jsonb_build_object(
    'success', true,
    'plan_name', v_plan_name,
    'message', 'Promotion code applied successfully! Your plan has been upgraded.'
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.validate_promotion_code(TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.apply_promotion_code(TEXT, UUID) TO authenticated;

-- Example: Insert a test promotion code (optional - remove in production)
-- INSERT INTO public.promotions (code, plan_name, expires_at, description)
-- VALUES (
--   'BUSINESS2024',
--   'business',
--   NOW() + INTERVAL '1 year',
--   'Upgrade to Business Plan - Limited Time Offer'
-- )
-- ON CONFLICT (code) DO NOTHING;

COMMENT ON FUNCTION public.validate_promotion_code IS 'Validates a promotion code for a user without applying it';
COMMENT ON FUNCTION public.apply_promotion_code IS 'Applies a promotion code and upgrades the user''s plan';
