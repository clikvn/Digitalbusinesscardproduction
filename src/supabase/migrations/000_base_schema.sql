-- ============================================
-- BASE SCHEMA - Core Application Tables
-- ============================================
-- This migration creates all core tables from scratch
-- Safe to run: Uses IF NOT EXISTS checks
-- Run this BEFORE other migrations

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- TABLE: user_code_ownership
-- Purpose: Maps user_id to their unique user code (like "myclik")
-- ============================================

CREATE TABLE IF NOT EXISTS public.user_code_ownership (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  CONSTRAINT user_code_ownership_user_id_unique UNIQUE (user_id)
);

-- Enable RLS
ALTER TABLE user_code_ownership ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can read their own user code" ON user_code_ownership;
CREATE POLICY "Users can read their own user code"
  ON user_code_ownership FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own user code" ON user_code_ownership;
CREATE POLICY "Users can insert their own user code"
  ON user_code_ownership FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own user code" ON user_code_ownership;
CREATE POLICY "Users can update their own user code"
  ON user_code_ownership FOR UPDATE
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_code_ownership_user_id ON user_code_ownership(user_id);
CREATE INDEX IF NOT EXISTS idx_user_code_ownership_user_code ON user_code_ownership(user_code);

-- ============================================
-- TABLE: business_cards
-- Purpose: Stores user profile/business card data
-- ============================================

CREATE TABLE IF NOT EXISTS public.business_cards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_code TEXT NOT NULL,
  
  -- Basic Info
  name TEXT,
  title TEXT,
  company_name TEXT,
  bio TEXT,
  
  -- Contact Info
  email TEXT,
  phone TEXT,
  website_url TEXT,
  
  -- Media
  avatar_url TEXT,
  background_image_url TEXT,
  
  -- Social Media
  linkedin_url TEXT,
  twitter_url TEXT,
  instagram_url TEXT,
  facebook_url TEXT,
  
  -- Contact Methods (JSONB for flexibility)
  contact JSONB DEFAULT '{}'::jsonb,
  
  -- Social Messaging (JSONB)
  social_messaging JSONB DEFAULT '{}'::jsonb,
  
  -- Social Channels (JSONB)
  social_channels JSONB DEFAULT '{}'::jsonb,
  
  -- Custom Fields (JSONB)
  custom_fields JSONB DEFAULT '[]'::jsonb,
  
  -- Portfolio Items (JSONB)
  portfolio JSONB DEFAULT '[]'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  CONSTRAINT business_cards_user_id_unique UNIQUE (user_id)
);

-- Enable RLS
ALTER TABLE business_cards ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can read their own business card" ON business_cards;
CREATE POLICY "Users can read their own business card"
  ON business_cards FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can read business cards by user_code" ON business_cards;
CREATE POLICY "Anyone can read business cards by user_code"
  ON business_cards FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can insert their own business card" ON business_cards;
CREATE POLICY "Users can insert their own business card"
  ON business_cards FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own business card" ON business_cards;
CREATE POLICY "Users can update their own business card"
  ON business_cards FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own business card" ON business_cards;
CREATE POLICY "Users can delete their own business card"
  ON business_cards FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_business_cards_user_id ON business_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_business_cards_user_code ON business_cards(user_code);

-- ============================================
-- TABLE: share_contacts
-- Purpose: Individual tracked shares for analytics
-- ============================================
-- When you share your card with a specific person, create a share_contact
-- This generates a unique URL: /user_code/group_code/contact_code
-- Example: /myclik/work/abc123
-- This allows tracking individual engagement per person

CREATE TABLE IF NOT EXISTS public.share_contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_code TEXT NOT NULL,
  
  -- Contact Info
  contact_name TEXT NOT NULL,
  contact_email TEXT,
  contact_phone TEXT,
  contact_company TEXT,
  notes TEXT,
  
  -- Share Group Assignment
  share_code TEXT NOT NULL DEFAULT 'public',
  
  -- Unique Contact Code for URL tracking
  contact_code TEXT NOT NULL UNIQUE,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  CONSTRAINT share_contacts_user_id_unique UNIQUE (user_id, contact_code)
);

-- Enable RLS
ALTER TABLE share_contacts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can read their own share contacts" ON share_contacts;
CREATE POLICY "Users can read their own share contacts"
  ON share_contacts FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own share contacts" ON share_contacts;
CREATE POLICY "Users can insert their own share contacts"
  ON share_contacts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own share contacts" ON share_contacts;
CREATE POLICY "Users can update their own share contacts"
  ON share_contacts FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own share contacts" ON share_contacts;
CREATE POLICY "Users can delete their own share contacts"
  ON share_contacts FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_share_contacts_user_id ON share_contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_share_contacts_user_code ON share_contacts(user_code);
CREATE INDEX IF NOT EXISTS idx_share_contacts_contact_code ON share_contacts(contact_code);
CREATE INDEX IF NOT EXISTS idx_share_contacts_share_code ON share_contacts(user_id, share_code);

-- ============================================
-- TABLE: user_share_groups
-- Purpose: Custom share groups (like "work", "friends", etc.)
-- ============================================

CREATE TABLE IF NOT EXISTS public.user_share_groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Group Identity
  share_code TEXT NOT NULL,
  label TEXT NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  
  -- Order for UI
  display_order INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  CONSTRAINT user_share_groups_user_share_code_unique UNIQUE (user_id, share_code)
);

-- Enable RLS
ALTER TABLE user_share_groups ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can read their own share groups" ON user_share_groups;
CREATE POLICY "Users can read their own share groups"
  ON user_share_groups FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own share groups" ON user_share_groups;
CREATE POLICY "Users can insert their own share groups"
  ON user_share_groups FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own share groups" ON user_share_groups;
CREATE POLICY "Users can update their own share groups"
  ON user_share_groups FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own share groups" ON user_share_groups;
CREATE POLICY "Users can delete their own share groups"
  ON user_share_groups FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_share_groups_user_id ON user_share_groups(user_id);
CREATE INDEX IF NOT EXISTS idx_user_share_groups_share_code ON user_share_groups(user_id, share_code);

-- ============================================
-- TABLE: user_share_settings
-- Purpose: Visibility settings for each share group
-- ============================================

CREATE TABLE IF NOT EXISTS public.user_share_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Share Group
  share_code TEXT NOT NULL,
  
  -- Field Visibility Settings (JSONB)
  visible_fields JSONB DEFAULT '{
    "name": true,
    "title": true,
    "company": true,
    "bio": true,
    "avatar": true,
    "background": true,
    "contact": {},
    "socialMessaging": {},
    "socialChannels": {},
    "customFields": [],
    "portfolio": []
  }'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  CONSTRAINT user_share_settings_user_share_code_unique UNIQUE (user_id, share_code)
);

-- Enable RLS
ALTER TABLE user_share_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can read their own share settings" ON user_share_settings;
CREATE POLICY "Users can read their own share settings"
  ON user_share_settings FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can read share settings by share code" ON user_share_settings;
CREATE POLICY "Anyone can read share settings by share code"
  ON user_share_settings FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can insert their own share settings" ON user_share_settings;
CREATE POLICY "Users can insert their own share settings"
  ON user_share_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own share settings" ON user_share_settings;
CREATE POLICY "Users can update their own share settings"
  ON user_share_settings FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own share settings" ON user_share_settings;
CREATE POLICY "Users can delete their own share settings"
  ON user_share_settings FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_share_settings_user_id ON user_share_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_share_settings_share_code ON user_share_settings(user_id, share_code);

-- ============================================
-- TABLE: analytics_events (Old System - For Backwards Compatibility)
-- ============================================

CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_code TEXT NOT NULL,
  
  -- Event Data (JSONB)
  event_data JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can read their own analytics" ON analytics_events;
CREATE POLICY "Users can read their own analytics"
  ON analytics_events FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Anyone can insert analytics" ON analytics_events;
CREATE POLICY "Anyone can insert analytics"
  ON analytics_events FOR INSERT
  WITH CHECK (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_code ON analytics_events(user_code);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at DESC);

-- ============================================
-- TRIGGERS: Updated At
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to all tables with updated_at
DROP TRIGGER IF EXISTS update_user_code_ownership_updated_at ON user_code_ownership;
CREATE TRIGGER update_user_code_ownership_updated_at
  BEFORE UPDATE ON user_code_ownership
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_business_cards_updated_at ON business_cards;
CREATE TRIGGER update_business_cards_updated_at
  BEFORE UPDATE ON business_cards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_share_contacts_updated_at ON share_contacts;
CREATE TRIGGER update_share_contacts_updated_at
  BEFORE UPDATE ON share_contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_share_groups_updated_at ON user_share_groups;
CREATE TRIGGER update_user_share_groups_updated_at
  BEFORE UPDATE ON user_share_groups
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_share_settings_updated_at ON user_share_settings;
CREATE TRIGGER update_user_share_settings_updated_at
  BEFORE UPDATE ON user_share_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE user_code_ownership IS 'Maps authenticated users to their unique user code (like "myclik")';
COMMENT ON TABLE business_cards IS 'Stores user business card/profile data';
COMMENT ON TABLE share_contacts IS 'Individual tracked shares - generates unique URLs like /user_code/group_code/contact_code for engagement tracking';
COMMENT ON TABLE user_share_groups IS 'Custom share groups created by users';
COMMENT ON TABLE user_share_settings IS 'Visibility settings for each share group';
COMMENT ON TABLE analytics_events IS 'Legacy analytics events (being replaced by new analytics system)';

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ Base schema created successfully!';
  RAISE NOTICE '   Tables: user_code_ownership, business_cards, user_share_groups, user_share_settings, analytics_events';
  RAISE NOTICE '   All RLS policies enabled';
  RAISE NOTICE '   All indexes created';
  RAISE NOTICE '   Ready to run migration 001 and beyond';
END $$;