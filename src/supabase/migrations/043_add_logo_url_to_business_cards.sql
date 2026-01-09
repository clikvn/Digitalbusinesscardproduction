-- ============================================
-- Migration: Add logo_url column to business_cards
-- ============================================
-- This migration adds a logo_url column to store brand logo images
-- Similar to avatar_url and background_image_url

-- Add logo_url column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'business_cards' AND column_name = 'logo_url'
  ) THEN
    ALTER TABLE business_cards ADD COLUMN logo_url TEXT;
    RAISE NOTICE 'Added logo_url column to business_cards';
  ELSE
    RAISE NOTICE 'logo_url column already exists in business_cards';
  END IF;
END $$;
