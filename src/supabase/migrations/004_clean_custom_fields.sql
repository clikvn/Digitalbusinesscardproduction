-- ============================================
-- CLEAN CUSTOM_FIELDS STRUCTURE
-- ============================================
-- Purpose: Remove old "groups" arrays and simplify nested structure
-- Why: New visibility system uses user_share_settings table
-- Impact: Cleaner data, easier to maintain, no duplication

-- ============================================
-- BACKUP FIRST (IMPORTANT!)
-- ============================================
-- Run this to create a backup before migration:
-- CREATE TABLE business_cards_backup AS SELECT * FROM business_cards;

-- ============================================
-- STEP 1: Clean Up Structure
-- ============================================

-- Create helper function to extract value without "groups" array
CREATE OR REPLACE FUNCTION extract_value(field JSONB) 
RETURNS TEXT AS $$
BEGIN
  -- If field has "value" key, return it
  IF field ? 'value' THEN
    RETURN field->>'value';
  END IF;
  -- If field has "username" key (social fields), return it
  IF field ? 'username' THEN
    RETURN field->>'username';
  END IF;
  -- Otherwise return the field as text
  RETURN field::text;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- STEP 2: Restructure custom_fields
-- ============================================

UPDATE business_cards
SET custom_fields = jsonb_build_object(
  -- Contact info (no more "groups" arrays!)
  'contact', jsonb_build_object(
    'address', NULLIF(extract_value(custom_fields->'contact'->'address'), ''),
    'secondaryPhone', NULLIF(extract_value(custom_fields->'contact'->'secondaryPhone'), ''),
    'secondaryEmail', NULLIF(extract_value(custom_fields->'contact'->'secondaryEmail'), '')
  ),
  
  -- Social channels (simplified)
  'social', jsonb_build_object(
    'linkedin', NULLIF(extract_value(custom_fields->'socialChannels'->'linkedin'), ''),
    'twitter', NULLIF(extract_value(custom_fields->'socialChannels'->'twitter'), ''),
    'facebook', NULLIF(extract_value(custom_fields->'socialChannels'->'facebook'), ''),
    'instagram', NULLIF(extract_value(custom_fields->'socialChannels'->'instagram'), ''),
    'youtube', NULLIF(extract_value(custom_fields->'socialChannels'->'youtube'), ''),
    'tiktok', NULLIF(extract_value(custom_fields->'socialChannels'->'tiktok'), '')
  ),
  
  -- Messaging apps
  'messaging', jsonb_build_object(
    'whatsapp', NULLIF(extract_value(custom_fields->'socialMessaging'->'whatsapp'), ''),
    'telegram', NULLIF(extract_value(custom_fields->'socialMessaging'->'telegram'), ''),
    'wechat', NULLIF(extract_value(custom_fields->'socialMessaging'->'wechat'), ''),
    'messenger', NULLIF(extract_value(custom_fields->'socialMessaging'->'messenger'), ''),
    'zalo', NULLIF(extract_value(custom_fields->'socialMessaging'->'zalo'), ''),
    'discord', NULLIF(extract_value(custom_fields->'socialMessaging'->'discord'), ''),
    'kakao', NULLIF(extract_value(custom_fields->'socialMessaging'->'kakao'), '')
  ),
  
  -- Profile information
  'profile', jsonb_build_object(
    'about', NULLIF(extract_value(custom_fields->'profile'->'about'), ''),
    'languages', NULLIF(extract_value(custom_fields->'profile'->'languages'), ''),
    'experience', NULLIF(extract_value(custom_fields->'profile'->'experience'), ''),
    'specialties', NULLIF(extract_value(custom_fields->'profile'->'specialties'), ''),
    'serviceAreas', NULLIF(extract_value(custom_fields->'profile'->'serviceAreas'), ''),
    'certifications', NULLIF(extract_value(custom_fields->'profile'->'certifications'), '')
  ),
  
  -- Portfolio (keep as-is, just copy)
  'portfolio', COALESCE(custom_fields->'portfolio', '[]'::jsonb),
  
  -- Portfolio categories
  'portfolioCategories', COALESCE(custom_fields->'portfolioCategories', '[]'::jsonb),
  
  -- Profile image (parse if string, keep if object)
  'profileImage', CASE 
    WHEN jsonb_typeof(custom_fields->'profileImage') = 'string' 
    THEN (custom_fields->>'profileImage')::jsonb
    ELSE custom_fields->'profileImage'
  END,
  
  -- AI agent visibility (if exists)
  'aiAgentVisible', COALESCE(custom_fields->'aiAgentVisible', 'true'::jsonb)
)
WHERE custom_fields IS NOT NULL;

-- ============================================
-- STEP 3: Update Top-Level Fields
-- ============================================
-- Fill in top-level columns from custom_fields where empty

UPDATE business_cards
SET 
  phone = COALESCE(
    phone, 
    extract_value(custom_fields->'contact'->'phone')
  )
WHERE phone IS NULL 
  AND custom_fields->'contact'->'phone' IS NOT NULL;

UPDATE business_cards
SET 
  email = COALESCE(
    email, 
    extract_value(custom_fields->'contact'->'email')
  )
WHERE email IS NULL 
  AND custom_fields->'contact'->'email' IS NOT NULL;

-- Update social URLs (legacy top-level fields)
UPDATE business_cards
SET 
  linkedin_url = COALESCE(
    linkedin_url,
    'https://linkedin.com/in/' || (custom_fields->'social'->>'linkedin')
  )
WHERE linkedin_url IS NULL 
  AND custom_fields->'social'->>'linkedin' IS NOT NULL
  AND custom_fields->'social'->>'linkedin' != '';

UPDATE business_cards
SET 
  twitter_url = COALESCE(
    twitter_url,
    'https://twitter.com/' || (custom_fields->'social'->>'twitter')
  )
WHERE twitter_url IS NULL 
  AND custom_fields->'social'->>'twitter' IS NOT NULL
  AND custom_fields->'social'->>'twitter' != '';

UPDATE business_cards
SET 
  facebook_url = COALESCE(
    facebook_url,
    'https://facebook.com/' || (custom_fields->'social'->>'facebook')
  )
WHERE facebook_url IS NULL 
  AND custom_fields->'social'->>'facebook' IS NOT NULL
  AND custom_fields->'social'->>'facebook' != '';

UPDATE business_cards
SET 
  instagram_url = COALESCE(
    instagram_url,
    'https://instagram.com/' || (custom_fields->'social'->>'instagram')
  )
WHERE instagram_url IS NULL 
  AND custom_fields->'social'->>'instagram' IS NOT NULL
  AND custom_fields->'social'->>'instagram' != '';

-- ============================================
-- STEP 4: Clean Up Helper Function
-- ============================================

DROP FUNCTION IF EXISTS extract_value(JSONB);

-- ============================================
-- STEP 5: Verify
-- ============================================

DO $$
DECLARE
  card_count INT;
  old_format_count INT;
BEGIN
  -- Count total cards
  SELECT COUNT(*) INTO card_count FROM business_cards;
  
  -- Count cards with old format (should be 0)
  SELECT COUNT(*) INTO old_format_count 
  FROM business_cards 
  WHERE custom_fields @> '{"contact":{"phone":{"groups":[]}}}'::jsonb
     OR custom_fields @> '{"socialChannels":{}}'::jsonb
     OR custom_fields @> '{"socialMessaging":{}}'::jsonb;
  
  RAISE NOTICE '✅ Migration complete!';
  RAISE NOTICE '   Total cards: %', card_count;
  RAISE NOTICE '   Old format cards: %', old_format_count;
  
  IF old_format_count > 0 THEN
    RAISE WARNING 'Some cards still have old format. Check custom_fields structure.';
  END IF;
END $$;

-- ============================================
-- ROLLBACK (if needed)
-- ============================================
-- If something goes wrong, restore from backup:
-- DROP TABLE business_cards;
-- ALTER TABLE business_cards_backup RENAME TO business_cards;

-- ============================================
-- SAMPLE OUTPUT
-- ============================================
-- Show a sample of the new structure
SELECT 
  user_code,
  name,
  phone,
  custom_fields->'contact' as contact,
  custom_fields->'social' as social,
  custom_fields->'messaging' as messaging
FROM business_cards
LIMIT 3;
