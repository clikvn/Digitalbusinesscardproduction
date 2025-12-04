-- ============================================
-- ALIGN EXISTING SCHEMA WITH CURRENT NEEDS
-- ============================================
-- This migration updates existing tables to match current requirements
-- Safe to run - only adds missing columns/constraints/indexes

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLE: user_code_ownership
-- ============================================
-- This table should already exist with: user_code, user_id, created_at
-- Just add missing constraints and indexes

-- Enable RLS if not already enabled
ALTER TABLE user_code_ownership ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies
DROP POLICY IF EXISTS "Users can read their own user code" ON user_code_ownership;
CREATE POLICY "Users can read their own user code"
  ON user_code_ownership FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own user code" ON user_code_ownership;
CREATE POLICY "Users can insert their own user code"
  ON user_code_ownership FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Ensure index exists
CREATE INDEX IF NOT EXISTS idx_user_code_ownership_user_id ON user_code_ownership(user_id);

-- ============================================
-- TABLE: business_cards
-- ============================================
-- Add missing columns to existing business_cards table

DO $$ 
BEGIN
  -- Add job_title column (maps to 'title' in DB)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'business_cards' AND column_name = 'title'
  ) THEN
    ALTER TABLE business_cards ADD COLUMN title TEXT;
    RAISE NOTICE 'Added title column to business_cards';
  END IF;

  -- Add company_name column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'business_cards' AND column_name = 'company_name'
  ) THEN
    ALTER TABLE business_cards ADD COLUMN company_name TEXT;
    RAISE NOTICE 'Added company_name column to business_cards';
  END IF;

  -- Add bio column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'business_cards' AND column_name = 'bio'
  ) THEN
    ALTER TABLE business_cards ADD COLUMN bio TEXT;
    RAISE NOTICE 'Added bio column to business_cards';
  END IF;

  -- Add website_url column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'business_cards' AND column_name = 'website_url'
  ) THEN
    ALTER TABLE business_cards ADD COLUMN website_url TEXT;
    RAISE NOTICE 'Added website_url column to business_cards';
  END IF;

  -- Add background_image_url column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'business_cards' AND column_name = 'background_image_url'
  ) THEN
    ALTER TABLE business_cards ADD COLUMN background_image_url TEXT;
    RAISE NOTICE 'Added background_image_url column to business_cards';
  END IF;

  -- Add social media columns
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'business_cards' AND column_name = 'linkedin_url'
  ) THEN
    ALTER TABLE business_cards ADD COLUMN linkedin_url TEXT;
    RAISE NOTICE 'Added linkedin_url column to business_cards';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'business_cards' AND column_name = 'twitter_url'
  ) THEN
    ALTER TABLE business_cards ADD COLUMN twitter_url TEXT;
    RAISE NOTICE 'Added twitter_url column to business_cards';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'business_cards' AND column_name = 'instagram_url'
  ) THEN
    ALTER TABLE business_cards ADD COLUMN instagram_url TEXT;
    RAISE NOTICE 'Added instagram_url column to business_cards';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'business_cards' AND column_name = 'facebook_url'
  ) THEN
    ALTER TABLE business_cards ADD COLUMN facebook_url TEXT;
    RAISE NOTICE 'Added facebook_url column to business_cards';
  END IF;

  -- Add portfolio_images column (JSONB array)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'business_cards' AND column_name = 'portfolio_images'
  ) THEN
    ALTER TABLE business_cards ADD COLUMN portfolio_images JSONB DEFAULT '[]'::jsonb;
    RAISE NOTICE 'Added portfolio_images column to business_cards';
  END IF;

  -- Add custom_fields column (JSONB for flexibility)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'business_cards' AND column_name = 'custom_fields'
  ) THEN
    ALTER TABLE business_cards ADD COLUMN custom_fields JSONB DEFAULT '{}'::jsonb;
    RAISE NOTICE 'Added custom_fields column to business_cards';
  END IF;
END $$;

-- Enable RLS
ALTER TABLE business_cards ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies
DROP POLICY IF EXISTS "Anyone can view business cards" ON business_cards;
CREATE POLICY "Anyone can view business cards"
  ON business_cards FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can insert their own card" ON business_cards;
CREATE POLICY "Users can insert their own card"
  ON business_cards FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    user_code IN (
      SELECT user_code FROM user_code_ownership WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update their own card" ON business_cards;
CREATE POLICY "Users can update their own card"
  ON business_cards FOR UPDATE
  USING (
    auth.uid() = user_id AND
    user_code IN (
      SELECT user_code FROM user_code_ownership WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete their own card" ON business_cards;
CREATE POLICY "Users can delete their own card"
  ON business_cards FOR DELETE
  USING (auth.uid() = user_id);

-- Ensure indexes exist
CREATE INDEX IF NOT EXISTS idx_business_cards_user_id ON business_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_business_cards_user_code ON business_cards(user_code);

-- ============================================
-- TABLE: share_settings
-- ============================================
-- Add missing columns to existing share_settings table

DO $$ 
BEGIN
  -- Add hide_social column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'share_settings' AND column_name = 'hide_social'
  ) THEN
    ALTER TABLE share_settings ADD COLUMN hide_social BOOLEAN DEFAULT false;
    RAISE NOTICE 'Added hide_social column to share_settings';
  END IF;

  -- Add hide_portfolio column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'share_settings' AND column_name = 'hide_portfolio'
  ) THEN
    ALTER TABLE share_settings ADD COLUMN hide_portfolio BOOLEAN DEFAULT false;
    RAISE NOTICE 'Added hide_portfolio column to share_settings';
  END IF;

  -- Add custom_settings column (JSONB)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'share_settings' AND column_name = 'custom_settings'
  ) THEN
    ALTER TABLE share_settings ADD COLUMN custom_settings JSONB DEFAULT '{}'::jsonb;
    RAISE NOTICE 'Added custom_settings column to share_settings';
  END IF;
END $$;

-- Enable RLS
ALTER TABLE share_settings ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies
DROP POLICY IF EXISTS "Anyone can view share settings" ON share_settings;
CREATE POLICY "Anyone can view share settings"
  ON share_settings FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can manage their own settings" ON share_settings;
CREATE POLICY "Users can manage their own settings"
  ON share_settings FOR ALL
  USING (auth.uid() = user_id);

-- Ensure index exists
CREATE INDEX IF NOT EXISTS idx_share_settings_user_code ON share_settings(user_code);

-- ============================================
-- TABLE: custom_groups
-- ============================================
-- Add missing columns to existing custom_groups table

DO $$ 
BEGIN
  -- Add group_name column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'custom_groups' AND column_name = 'group_name'
  ) THEN
    ALTER TABLE custom_groups ADD COLUMN group_name TEXT NOT NULL DEFAULT 'Unnamed';
    RAISE NOTICE 'Added group_name column to custom_groups';
  END IF;

  -- Add description column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'custom_groups' AND column_name = 'description'
  ) THEN
    ALTER TABLE custom_groups ADD COLUMN description TEXT;
    RAISE NOTICE 'Added description column to custom_groups';
  END IF;

  -- Add visible_fields column (JSONB array)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'custom_groups' AND column_name = 'visible_fields'
  ) THEN
    ALTER TABLE custom_groups ADD COLUMN visible_fields JSONB DEFAULT '[]'::jsonb;
    RAISE NOTICE 'Added visible_fields column to custom_groups';
  END IF;
END $$;

-- Enable RLS
ALTER TABLE custom_groups ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies
DROP POLICY IF EXISTS "Anyone can view custom groups" ON custom_groups;
CREATE POLICY "Anyone can view custom groups"
  ON custom_groups FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can manage their own groups" ON custom_groups;
CREATE POLICY "Users can manage their own groups"
  ON custom_groups FOR ALL
  USING (auth.uid() = user_id);

-- Ensure indexes exist
CREATE INDEX IF NOT EXISTS idx_custom_groups_user_code ON custom_groups(user_code);

-- ============================================
-- TABLE: contacts
-- ============================================
-- Update contacts table to match expected schema

DO $$ 
BEGIN
  -- Add contact_name column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'contacts' AND column_name = 'contact_name'
  ) THEN
    ALTER TABLE contacts ADD COLUMN contact_name TEXT;
    RAISE NOTICE 'Added contact_name column to contacts';
  END IF;

  -- Add contact_email column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'contacts' AND column_name = 'contact_email'
  ) THEN
    ALTER TABLE contacts ADD COLUMN contact_email TEXT;
    RAISE NOTICE 'Added contact_email column to contacts';
  END IF;

  -- Add contact_phone column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'contacts' AND column_name = 'contact_phone'
  ) THEN
    ALTER TABLE contacts ADD COLUMN contact_phone TEXT;
    RAISE NOTICE 'Added contact_phone column to contacts';
  END IF;

  -- Add notes column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'contacts' AND column_name = 'notes'
  ) THEN
    ALTER TABLE contacts ADD COLUMN notes TEXT;
    RAISE NOTICE 'Added notes column to contacts';
  END IF;

  -- Add saved_at column (replaces created_at for contacts)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'contacts' AND column_name = 'saved_at'
  ) THEN
    ALTER TABLE contacts ADD COLUMN saved_at TIMESTAMPTZ DEFAULT NOW();
    RAISE NOTICE 'Added saved_at column to contacts';
  END IF;
END $$;

-- Enable RLS
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies
DROP POLICY IF EXISTS "Anyone can insert contacts" ON contacts;
CREATE POLICY "Anyone can insert contacts"
  ON contacts FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view their own contacts" ON contacts;
CREATE POLICY "Users can view their own contacts"
  ON contacts FOR SELECT
  USING (
    user_code IN (
      SELECT user_code FROM user_code_ownership WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete their own contacts" ON contacts;
CREATE POLICY "Users can delete their own contacts"
  ON contacts FOR DELETE
  USING (
    user_code IN (
      SELECT user_code FROM user_code_ownership WHERE user_id = auth.uid()
    )
  );

-- Ensure index exists
CREATE INDEX IF NOT EXISTS idx_contacts_user_code ON contacts(user_code);

-- ============================================
-- TABLE: analytics_events
-- ============================================
-- Update analytics_events table

DO $$ 
BEGIN
  -- Add event_data column (JSONB)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'analytics_events' AND column_name = 'event_data'
  ) THEN
    ALTER TABLE analytics_events ADD COLUMN event_data JSONB DEFAULT '{}'::jsonb;
    RAISE NOTICE 'Added event_data column to analytics_events';
  END IF;

  -- Add ip_address column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'analytics_events' AND column_name = 'ip_address'
  ) THEN
    ALTER TABLE analytics_events ADD COLUMN ip_address TEXT;
    RAISE NOTICE 'Added ip_address column to analytics_events';
  END IF;

  -- Add user_agent column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'analytics_events' AND column_name = 'user_agent'
  ) THEN
    ALTER TABLE analytics_events ADD COLUMN user_agent TEXT;
    RAISE NOTICE 'Added user_agent column to analytics_events';
  END IF;

  -- Add referrer column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'analytics_events' AND column_name = 'referrer'
  ) THEN
    ALTER TABLE analytics_events ADD COLUMN referrer TEXT;
    RAISE NOTICE 'Added referrer column to analytics_events';
  END IF;
END $$;

-- Enable RLS
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies
DROP POLICY IF EXISTS "Anyone can insert analytics events" ON analytics_events;
CREATE POLICY "Anyone can insert analytics events"
  ON analytics_events FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view their own analytics" ON analytics_events;
CREATE POLICY "Users can view their own analytics"
  ON analytics_events FOR SELECT
  USING (
    user_code IN (
      SELECT user_code FROM user_code_ownership WHERE user_id = auth.uid()
    )
  );

-- Ensure indexes exist
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_code ON analytics_events(user_code);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type ON analytics_events(event_type);

-- ============================================
-- STORAGE BUCKET: user-assets
-- ============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-assets', 'user-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
DROP POLICY IF EXISTS "Anyone can view user assets" ON storage.objects;
CREATE POLICY "Anyone can view user assets"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'user-assets');

DROP POLICY IF EXISTS "Authenticated users can upload assets" ON storage.objects;
CREATE POLICY "Authenticated users can upload assets"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'user-assets' AND
    auth.role() = 'authenticated'
  );

DROP POLICY IF EXISTS "Users can update their own assets" ON storage.objects;
CREATE POLICY "Users can update their own assets"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'user-assets' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can delete their own assets" ON storage.objects;
CREATE POLICY "Users can delete their own assets"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'user-assets' AND auth.role() = 'authenticated');

-- ============================================
-- FUNCTIONS: Auto-update timestamps
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers for updated_at
DROP TRIGGER IF EXISTS update_business_cards_updated_at ON business_cards;
CREATE TRIGGER update_business_cards_updated_at
  BEFORE UPDATE ON business_cards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_share_settings_updated_at ON share_settings;
CREATE TRIGGER update_share_settings_updated_at
  BEFORE UPDATE ON share_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_custom_groups_updated_at ON custom_groups;
CREATE TRIGGER update_custom_groups_updated_at
  BEFORE UPDATE ON custom_groups
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
