-- ============================================
-- FIX: Add missing columns to business_cards
-- ============================================
-- ERROR: column "personal" of relation "business_cards" does not exist
-- SOLUTION: Add all the JSONB columns that initialize_user_data needs

-- Add personal column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'business_cards' 
    AND column_name = 'personal'
  ) THEN
    ALTER TABLE public.business_cards 
    ADD COLUMN personal JSONB DEFAULT '{"name":"","title":"","businessName":"","bio":"","profileImage":null}'::jsonb;
    RAISE NOTICE '✅ Added column: personal';
  ELSE
    RAISE NOTICE 'ℹ️ Column personal already exists';
  END IF;
END $$;

-- Add contact column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'business_cards' 
    AND column_name = 'contact'
  ) THEN
    ALTER TABLE public.business_cards 
    ADD COLUMN contact JSONB DEFAULT '{"phone":"","email":"","address":""}'::jsonb;
    RAISE NOTICE '✅ Added column: contact';
  ELSE
    RAISE NOTICE 'ℹ️ Column contact already exists';
  END IF;
END $$;

-- Add profile column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'business_cards' 
    AND column_name = 'profile'
  ) THEN
    ALTER TABLE public.business_cards 
    ADD COLUMN profile JSONB DEFAULT '{"about":"","serviceAreas":"","specialties":"","experience":"","languages":"","certifications":""}'::jsonb;
    RAISE NOTICE '✅ Added column: profile';
  ELSE
    RAISE NOTICE 'ℹ️ Column profile already exists';
  END IF;
END $$;

-- Add socialMessaging column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'business_cards' 
    AND column_name = 'socialMessaging'
  ) THEN
    ALTER TABLE public.business_cards 
    ADD COLUMN "socialMessaging" JSONB DEFAULT '{"whatsapp":"","telegram":"","messenger":"","zalo":"","kakao":"","discord":"","wechat":""}'::jsonb;
    RAISE NOTICE '✅ Added column: socialMessaging';
  ELSE
    RAISE NOTICE 'ℹ️ Column socialMessaging already exists';
  END IF;
END $$;

-- Add socialChannels column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'business_cards' 
    AND column_name = 'socialChannels'
  ) THEN
    ALTER TABLE public.business_cards 
    ADD COLUMN "socialChannels" JSONB DEFAULT '{"facebook":"","linkedin":"","twitter":"","youtube":"","tiktok":""}'::jsonb;
    RAISE NOTICE '✅ Added column: socialChannels';
  ELSE
    RAISE NOTICE 'ℹ️ Column socialChannels already exists';
  END IF;
END $$;

-- Add portfolio column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'business_cards' 
    AND column_name = 'portfolio'
  ) THEN
    ALTER TABLE public.business_cards 
    ADD COLUMN portfolio JSONB DEFAULT '[]'::jsonb;
    RAISE NOTICE '✅ Added column: portfolio';
  ELSE
    RAISE NOTICE 'ℹ️ Column portfolio already exists';
  END IF;
END $$;

-- Add customLabels column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'business_cards' 
    AND column_name = 'customLabels'
  ) THEN
    ALTER TABLE public.business_cards 
    ADD COLUMN "customLabels" JSONB DEFAULT '{}'::jsonb;
    RAISE NOTICE '✅ Added column: customLabels';
  ELSE
    RAISE NOTICE 'ℹ️ Column customLabels already exists';
  END IF;
END $$;

-- Verify all columns exist
DO $$
DECLARE
  missing_count INTEGER := 0;
  required_columns TEXT[] := ARRAY['personal', 'contact', 'profile', 'socialMessaging', 'socialChannels', 'portfolio', 'customLabels'];
  col TEXT;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== VERIFICATION ===';
  
  FOREACH col IN ARRAY required_columns
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'business_cards' 
      AND column_name = col
    ) THEN
      RAISE WARNING '❌ Column % is MISSING', col;
      missing_count := missing_count + 1;
    ELSE
      RAISE NOTICE '✅ Column % exists', col;
    END IF;
  END LOOP;
  
  RAISE NOTICE '';
  IF missing_count = 0 THEN
    RAISE NOTICE '🎉 All columns exist! Signup should work now';
  ELSE
    RAISE WARNING '⚠️ % column(s) still missing!', missing_count;
  END IF;
END $$;
