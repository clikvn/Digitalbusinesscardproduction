-- ============================================
-- CLEAN JSONB - REMOVE GROUPS ARRAYS
-- ============================================
-- Purpose: Remove duplicate visibility system
-- Strategy: Convert { value, groups } to plain values
-- Impact: Cleaner data structure, visibility via user_share_settings only
-- 
-- What this does:
-- 1. Backs up current data
-- 2. Converts nested objects to plain values
-- 3. Removes "groups" arrays from all fields
-- 4. Verifies conversion
--
-- CRITICAL: BACKUP YOUR DATABASE FIRST!
-- ============================================

-- ============================================
-- STEP 0: CREATE BACKUP TABLE
-- ============================================
-- Always backup before modifying data!

DO $$
BEGIN
  -- Drop backup if exists (for re-running)
  DROP TABLE IF EXISTS business_cards_backup_007;
  
  -- Create fresh backup
  CREATE TABLE business_cards_backup_007 AS 
  SELECT * FROM business_cards;
  
  RAISE NOTICE '✅ Backup created: business_cards_backup_007';
  RAISE NOTICE '   Rows backed up: %', (SELECT COUNT(*) FROM business_cards_backup_007);
END $$;

-- ============================================
-- STEP 1: ANALYZE CURRENT STRUCTURE
-- ============================================

DO $$
DECLARE
  total_cards INT;
  cards_with_custom_fields INT;
  sample_contact JSONB;
BEGIN
  SELECT COUNT(*) INTO total_cards FROM business_cards;
  
  SELECT COUNT(*) INTO cards_with_custom_fields
  FROM business_cards 
  WHERE custom_fields IS NOT NULL;
  
  -- Get a sample to show current structure
  SELECT custom_fields->'contact' INTO sample_contact
  FROM business_cards
  WHERE custom_fields->'contact' IS NOT NULL
  LIMIT 1;
  
  RAISE NOTICE '📊 Current state:';
  RAISE NOTICE '   Total cards: %', total_cards;
  RAISE NOTICE '   Cards with custom_fields: %', cards_with_custom_fields;
  RAISE NOTICE '   Sample contact structure: %', sample_contact;
END $$;

-- ============================================
-- STEP 2: CONVERT CONTACT FIELDS
-- ============================================
-- Convert contact.phone, contact.email, contact.address
-- From: { value: "...", groups: [...] }
-- To: "..." (plain string)

DO $$
DECLARE
  affected_rows INT := 0;
BEGIN
  RAISE NOTICE '🔄 Converting contact fields...';
  
  -- Convert contact.phone
  UPDATE business_cards
  SET custom_fields = jsonb_set(
    custom_fields,
    '{contact,phone}',
    CASE 
      WHEN jsonb_typeof(custom_fields->'contact'->'phone') = 'object' 
      THEN to_jsonb(COALESCE(custom_fields->'contact'->'phone'->>'value', ''))
      ELSE custom_fields->'contact'->'phone'
    END
  )
  WHERE custom_fields->'contact'->'phone' IS NOT NULL;
  
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  RAISE NOTICE '   ✅ Converted contact.phone: % rows', affected_rows;
  
  -- Convert contact.email
  UPDATE business_cards
  SET custom_fields = jsonb_set(
    custom_fields,
    '{contact,email}',
    CASE 
      WHEN jsonb_typeof(custom_fields->'contact'->'email') = 'object' 
      THEN to_jsonb(COALESCE(custom_fields->'contact'->'email'->>'value', ''))
      ELSE custom_fields->'contact'->'email'
    END
  )
  WHERE custom_fields->'contact'->'email' IS NOT NULL;
  
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  RAISE NOTICE '   ✅ Converted contact.email: % rows', affected_rows;
  
  -- Convert contact.address
  UPDATE business_cards
  SET custom_fields = jsonb_set(
    custom_fields,
    '{contact,address}',
    CASE 
      WHEN jsonb_typeof(custom_fields->'contact'->'address') = 'object' 
      THEN to_jsonb(COALESCE(custom_fields->'contact'->'address'->>'value', ''))
      ELSE custom_fields->'contact'->'address'
    END
  )
  WHERE custom_fields->'contact'->'address' IS NOT NULL;
  
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  RAISE NOTICE '   ✅ Converted contact.address: % rows', affected_rows;
  
END $$;

-- ============================================
-- STEP 3: CONVERT SOCIAL MESSAGING FIELDS
-- ============================================
-- Convert all 7 messaging apps
-- From: { username: "...", groups: [...] }
-- To: "..." (plain string)

DO $$
DECLARE
  affected_rows INT := 0;
  apps TEXT[] := ARRAY['zalo', 'messenger', 'telegram', 'whatsapp', 'kakao', 'discord', 'wechat'];
  app TEXT;
BEGIN
  RAISE NOTICE '🔄 Converting social messaging fields...';
  
  FOREACH app IN ARRAY apps
  LOOP
    EXECUTE format('
      UPDATE business_cards
      SET custom_fields = jsonb_set(
        custom_fields,
        ''{socialMessaging,%s}'',
        CASE 
          WHEN jsonb_typeof(custom_fields->''socialMessaging''->''%s'') = ''object'' 
          THEN to_jsonb(COALESCE(custom_fields->''socialMessaging''->''%s''->>''username'', ''''))
          ELSE custom_fields->''socialMessaging''->''%s''
        END
      )
      WHERE custom_fields->''socialMessaging''->''%s'' IS NOT NULL
    ', app, app, app, app, app);
    
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    RAISE NOTICE '   ✅ Converted socialMessaging.%: % rows', app, affected_rows;
  END LOOP;
  
END $$;

-- ============================================
-- STEP 4: CONVERT SOCIAL CHANNELS FIELDS
-- ============================================
-- Convert all 5 social channels
-- From: { username: "...", groups: [...] }
-- To: "..." (plain string)

DO $$
DECLARE
  affected_rows INT := 0;
  channels TEXT[] := ARRAY['facebook', 'linkedin', 'twitter', 'youtube', 'tiktok'];
  channel TEXT;
BEGIN
  RAISE NOTICE '🔄 Converting social channels fields...';
  
  FOREACH channel IN ARRAY channels
  LOOP
    EXECUTE format('
      UPDATE business_cards
      SET custom_fields = jsonb_set(
        custom_fields,
        ''{socialChannels,%s}'',
        CASE 
          WHEN jsonb_typeof(custom_fields->''socialChannels''->''%s'') = ''object'' 
          THEN to_jsonb(COALESCE(custom_fields->''socialChannels''->''%s''->>''username'', ''''))
          ELSE custom_fields->''socialChannels''->''%s''
        END
      )
      WHERE custom_fields->''socialChannels''->''%s'' IS NOT NULL
    ', channel, channel, channel, channel, channel);
    
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    RAISE NOTICE '   ✅ Converted socialChannels.%: % rows', channel, affected_rows;
  END LOOP;
  
END $$;

-- ============================================
-- STEP 5: CONVERT PROFILE FIELDS
-- ============================================
-- Convert all 6 profile fields
-- From: { value: "...", groups: [...] }
-- To: "..." (plain string)

DO $$
DECLARE
  affected_rows INT := 0;
  fields TEXT[] := ARRAY['about', 'serviceAreas', 'specialties', 'experience', 'languages', 'certifications'];
  field TEXT;
BEGIN
  RAISE NOTICE '🔄 Converting profile fields...';
  
  FOREACH field IN ARRAY fields
  LOOP
    EXECUTE format('
      UPDATE business_cards
      SET custom_fields = jsonb_set(
        custom_fields,
        ''{profile,%s}'',
        CASE 
          WHEN jsonb_typeof(custom_fields->''profile''->''%s'') = ''object'' 
          THEN to_jsonb(COALESCE(custom_fields->''profile''->''%s''->>''value'', ''''))
          ELSE custom_fields->''profile''->''%s''
        END
      )
      WHERE custom_fields->''profile''->''%s'' IS NOT NULL
    ', field, field, field, field, field);
    
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    RAISE NOTICE '   ✅ Converted profile.%: % rows', field, affected_rows;
  END LOOP;
  
END $$;

-- ============================================
-- STEP 6: HANDLE aiAgentVisible FIELD
-- ============================================
-- This might be stored as { value: true, groups: [...] } or just true/false

DO $$
DECLARE
  affected_rows INT := 0;
BEGIN
  RAISE NOTICE '🔄 Converting aiAgentVisible field...';
  
  UPDATE business_cards
  SET custom_fields = jsonb_set(
    custom_fields,
    '{aiAgentVisible}',
    CASE 
      WHEN jsonb_typeof(custom_fields->'aiAgentVisible') = 'object' 
      THEN to_jsonb(COALESCE((custom_fields->'aiAgentVisible'->>'value')::boolean, false))
      ELSE COALESCE(custom_fields->'aiAgentVisible', 'false'::jsonb)
    END
  )
  WHERE custom_fields->'aiAgentVisible' IS NOT NULL;
  
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  RAISE NOTICE '   ✅ Converted aiAgentVisible: % rows', affected_rows;
  
END $$;

-- ============================================
-- STEP 7: VERIFY CONVERSION
-- ============================================

DO $$
DECLARE
  total_cards INT;
  sample_card JSONB;
  sample_contact JSONB;
  sample_social JSONB;
  sample_profile JSONB;
BEGIN
  SELECT COUNT(*) INTO total_cards FROM business_cards;
  
  -- Get a sample card to verify structure
  SELECT custom_fields INTO sample_card
  FROM business_cards
  WHERE custom_fields IS NOT NULL
  LIMIT 1;
  
  sample_contact := sample_card->'contact';
  sample_social := sample_card->'socialMessaging';
  sample_profile := sample_card->'profile';
  
  RAISE NOTICE '';
  RAISE NOTICE '✅ CONVERSION COMPLETE!';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Verification:';
  RAISE NOTICE '   Total cards processed: %', total_cards;
  RAISE NOTICE '';
  RAISE NOTICE '🔍 Sample data structure (after conversion):';
  RAISE NOTICE '';
  RAISE NOTICE '   contact.phone type: %', jsonb_typeof(sample_contact->'phone');
  RAISE NOTICE '   contact.phone value: %', sample_contact->>'phone';
  RAISE NOTICE '';
  RAISE NOTICE '   socialMessaging.whatsapp type: %', jsonb_typeof(sample_social->'whatsapp');
  RAISE NOTICE '   socialMessaging.whatsapp value: %', sample_social->>'whatsapp';
  RAISE NOTICE '';
  RAISE NOTICE '   profile.about type: %', jsonb_typeof(sample_profile->'about');
  RAISE NOTICE '   profile.about value: %', LEFT(sample_profile->>'about', 50) || '...';
  RAISE NOTICE '';
  
  -- Check if any objects remain (would indicate unconverted data)
  IF EXISTS (
    SELECT 1 FROM business_cards
    WHERE jsonb_typeof(custom_fields->'contact'->'phone') = 'object'
       OR jsonb_typeof(custom_fields->'contact'->'email') = 'object'
       OR jsonb_typeof(custom_fields->'socialMessaging'->'whatsapp') = 'object'
  ) THEN
    RAISE WARNING '⚠️  Some fields may still have object structure - check manually';
  ELSE
    RAISE NOTICE '✅ All fields successfully converted to plain values!';
  END IF;
  
END $$;

-- ============================================
-- STEP 8: SAMPLE QUERIES TO VERIFY
-- ============================================

-- Show before/after comparison
SELECT 
  'BEFORE (from backup)' as status,
  user_code,
  jsonb_typeof(custom_fields->'contact'->'phone') as phone_type,
  custom_fields->'contact'->'phone' as phone_data
FROM business_cards_backup_007
WHERE custom_fields->'contact'->'phone' IS NOT NULL
LIMIT 3;

SELECT 
  'AFTER (current)' as status,
  user_code,
  jsonb_typeof(custom_fields->'contact'->'phone') as phone_type,
  custom_fields->'contact'->'phone' as phone_data
FROM business_cards
WHERE custom_fields->'contact'->'phone' IS NOT NULL
LIMIT 3;

-- ============================================
-- STEP 9: UPDATE updated_at TIMESTAMP
-- ============================================

UPDATE business_cards
SET updated_at = NOW();

RAISE NOTICE '';
RAISE NOTICE '✅ All timestamps updated';

-- ============================================
-- NOTES
-- ============================================
-- 
-- What changed:
-- ✅ contact.phone: { value, groups } → "value"
-- ✅ contact.email: { value, groups } → "value"
-- ✅ contact.address: { value, groups } → "value"
-- ✅ socialMessaging.*: { username, groups } → "username"
-- ✅ socialChannels.*: { username, groups } → "username"
-- ✅ profile.*: { value, groups } → "value"
-- ✅ aiAgentVisible: { value, groups } → boolean
--
-- What stayed the same:
-- ✅ personal.profileImage (JSON string with positioning data)
-- ✅ personal.avatarImage (JSON string with positioning data)
-- ✅ portfolio (categories and items arrays)
-- ✅ customLabels
--
-- Visibility now controlled by:
-- ✅ user_share_settings table ONLY
-- ✅ No more "groups" arrays in custom_fields
--
-- ============================================
-- ROLLBACK (if needed)
-- ============================================
--
-- If something goes wrong, restore from backup:
--
-- UPDATE business_cards bc
-- SET custom_fields = bcb.custom_fields
-- FROM business_cards_backup_007 bcb
-- WHERE bc.id = bcb.id;
--
-- Verify rollback:
-- SELECT COUNT(*) FROM business_cards 
-- WHERE custom_fields = (SELECT custom_fields FROM business_cards_backup_007 WHERE business_cards.id = business_cards_backup_007.id);
--
-- ============================================
-- CLEANUP (after verifying everything works)
-- ============================================
--
-- After 1-2 weeks of successful operation, you can drop the backup:
--
-- DROP TABLE business_cards_backup_007;
--
-- ============================================

RAISE NOTICE '';
RAISE NOTICE '🎉 Migration 007 complete!';
RAISE NOTICE '';
RAISE NOTICE '📝 Next steps:';
RAISE NOTICE '   1. Verify the sample queries above look correct';
RAISE NOTICE '   2. Test your application thoroughly';
RAISE NOTICE '   3. Update your TypeScript types (see /types/business-card.ts)';
RAISE NOTICE '   4. Update transformers (see /lib/transformers.ts)';
RAISE NOTICE '   5. Update UI components to work with plain values';
RAISE NOTICE '';
RAISE NOTICE '⚠️  Backup table created: business_cards_backup_007';
RAISE NOTICE '   Keep this for at least 1-2 weeks before dropping';
RAISE NOTICE '';
