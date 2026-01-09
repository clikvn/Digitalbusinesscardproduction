-- ============================================
-- UPDATE: Migrate existing users' Public share config
-- ============================================
-- Purpose: Update all existing users' Public group to have all fields
-- selected by default EXCEPT contact information (phone, email, address) for privacy
--
-- This migration:
-- 1. Finds all existing users with Public share groups
-- 2. Updates their Public group visible_fields to include all fields except contact info
-- 3. Leaves other groups (Private, Business, Personal) unchanged
-- 4. Safe to run multiple times (idempotent)

-- Public group: All fields EXCEPT contact information
DO $$
DECLARE
  v_public_fields JSONB;
  v_updated_count INTEGER := 0;
  v_user_record RECORD;
BEGIN
  -- Build Public group fields: ALL fields EXCEPT contact information
  v_public_fields := '[
    "personal.name",
    "personal.title",
    "personal.businessName",
    "personal.bio",
    "personal.profileImage",
    "socialMessaging.zalo",
    "socialMessaging.messenger",
    "socialMessaging.telegram",
    "socialMessaging.whatsapp",
    "socialMessaging.kakao",
    "socialMessaging.discord",
    "socialMessaging.wechat",
    "socialChannels.facebook",
    "socialChannels.linkedin",
    "socialChannels.twitter",
    "socialChannels.youtube",
    "socialChannels.tiktok",
    "profile.about",
    "profile.serviceAreas",
    "profile.specialties",
    "profile.experience",
    "profile.languages",
    "profile.certifications",
    "portfolio"
  ]'::jsonb;

  -- Update all existing Public group settings
  -- Find Public groups by checking if group_id ends with '_public' or label is 'Public'
  FOR v_user_record IN
    SELECT DISTINCT
      s.user_code,
      s.group_id,
      g.label
    FROM user_share_settings s
    JOIN user_share_groups g ON s.group_id = g.id AND s.user_code = g.user_code
    WHERE 
      (g.label = 'Public' OR s.group_id LIKE '%_public')
      AND g.is_default = true
  LOOP
    -- Update the Public group settings
    UPDATE user_share_settings
    SET 
      visible_fields = v_public_fields,
      updated_at = NOW()
    WHERE 
      user_code = v_user_record.user_code
      AND group_id = v_user_record.group_id;
    
    v_updated_count := v_updated_count + 1;
  END LOOP;

  RAISE NOTICE '✅ Updated Public share config for % existing users', v_updated_count;
  RAISE NOTICE '✅ Public group now includes: personal.*, socialMessaging.*, socialChannels.*, profile.*, portfolio';
  RAISE NOTICE '✅ Public group excludes: contact.phone, contact.email, contact.address (for privacy)';
END $$;

-- ============================================
-- VERIFICATION QUERY (optional - can be run manually)
-- ============================================
-- To verify the update worked, you can run:
-- 
-- SELECT 
--   g.user_code,
--   g.label,
--   s.visible_fields,
--   jsonb_array_length(s.visible_fields) as field_count
-- FROM user_share_settings s
-- JOIN user_share_groups g ON s.group_id = g.id AND s.user_code = g.user_code
-- WHERE g.label = 'Public' AND g.is_default = true
-- ORDER BY s.updated_at DESC
-- LIMIT 10;
