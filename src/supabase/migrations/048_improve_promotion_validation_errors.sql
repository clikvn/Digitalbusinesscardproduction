-- ============================================
-- MIGRATION: Improve promotion code validation error messages
-- ============================================
-- Purpose: Provide more specific error messages when promotion code validation fails
-- ============================================

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
  -- First, check if the code exists (case-insensitive)
  SELECT * INTO v_promotion
  FROM public.promotions
  WHERE UPPER(code) = UPPER(p_code);
  
  -- Check if promotion exists
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'Promotion code not found. Please check the code and try again.'
    );
  END IF;
  
  -- Check if promotion is active
  IF v_promotion.is_active = false THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'This promotion code is currently inactive.'
    );
  END IF;
  
  -- Check if promotion has expired
  IF v_promotion.expires_at IS NOT NULL AND v_promotion.expires_at <= NOW() THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'This promotion code has expired.'
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
      'error', 'You have already used this promotion code.'
    );
  END IF;
  
  -- Check if max_uses limit has been reached
  IF v_promotion.max_uses IS NOT NULL AND v_promotion.used_count >= v_promotion.max_uses THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'This promotion code has reached its usage limit.'
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

-- Grant execute permissions (if not already granted)
GRANT EXECUTE ON FUNCTION public.validate_promotion_code(TEXT, UUID) TO authenticated;

-- Verification
DO $$
BEGIN
  RAISE NOTICE '✅ Promotion code validation function updated with improved error messages';
END $$;
