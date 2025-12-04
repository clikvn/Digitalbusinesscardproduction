-- ============================================
-- AUTO-INITIALIZE USER DATA ON REGISTRATION
-- ============================================
-- Purpose: Create all necessary default rows when a user signs up
-- This ensures the app is ready to use immediately without lazy initialization

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Generate random user code (6 characters: A-Z, 0-9)
CREATE OR REPLACE FUNCTION generate_user_code()
RETURNS TEXT AS $$
DECLARE
  characters TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := '';
  i INTEGER;
  max_attempts INTEGER := 10;
  attempt INTEGER := 0;
BEGIN
  LOOP
    result := '';
    FOR i IN 1..6 LOOP
      result := result || substr(characters, floor(random() * length(characters) + 1)::int, 1);
    END LOOP;
    
    -- Check if code already exists
    IF NOT EXISTS (SELECT 1 FROM user_code_ownership WHERE user_code = result) THEN
      RETURN result;
    END IF;
    
    attempt := attempt + 1;
    IF attempt >= max_attempts THEN
      RAISE EXCEPTION 'Could not generate unique user code after % attempts', max_attempts;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Generate random share code (6 characters)
CREATE OR REPLACE FUNCTION generate_share_code()
RETURNS TEXT AS $$
DECLARE
  characters TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(characters, floor(random() * length(characters) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Get default visible fields for groups
CREATE OR REPLACE FUNCTION get_default_visible_fields(group_id TEXT)
RETURNS JSONB AS $$
BEGIN
  CASE group_id
    WHEN 'public' THEN
      RETURN '["personal.name", "personal.title", "personal.profileImage", "contact.phone", "contact.email"]'::jsonb;
    WHEN 'private' THEN
      RETURN '["personal.name", "personal.title", "personal.bio", "personal.businessName", "personal.profileImage", "contact.phone", "contact.email", "contact.address", "profile.about"]'::jsonb;
    WHEN 'business' THEN
      RETURN '["personal.name", "personal.title", "personal.businessName", "personal.profileImage", "contact.phone", "contact.email", "profile.about", "profile.experience"]'::jsonb;
    WHEN 'personal' THEN
      -- Personal group: all fields visible by default (empty array means all visible in your logic)
      RETURN '[]'::jsonb;
    ELSE
      RETURN '[]'::jsonb;
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- Get default business card structure
CREATE OR REPLACE FUNCTION get_default_business_card()
RETURNS JSONB AS $$
BEGIN
  RETURN jsonb_build_object(
    'personal', jsonb_build_object(
      'name', '',
      'title', '',
      'businessName', '',
      'bio', '',
      'profileImage', null
    ),
    'contact', jsonb_build_object(
      'phone', '',
      'email', '',
      'address', ''
    ),
    'profile', jsonb_build_object(
      'about', '',
      'serviceAreas', '',
      'specialties', '',
      'experience', '',
      'languages', '',
      'certifications', ''
    ),
    'socialMessaging', jsonb_build_object(
      'whatsapp', '',
      'telegram', '',
      'messenger', '',
      'zalo', '',
      'kakao', '',
      'discord', '',
      'wechat', ''
    ),
    'socialChannels', jsonb_build_object(
      'facebook', '',
      'linkedin', '',
      'twitter', '',
      'youtube', '',
      'tiktok', ''
    ),
    'portfolio', '[]'::jsonb,
    'customLabels', '{}'::jsonb
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- MAIN INITIALIZATION FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION initialize_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_user_code TEXT;
  v_default_card JSONB;
BEGIN
  -- Generate unique user code
  v_user_code := generate_user_code();
  
  -- Get default business card structure
  v_default_card := get_default_business_card();
  
  -- 1. Create user_code_ownership
  INSERT INTO user_code_ownership (user_id, user_code)
  VALUES (NEW.id, v_user_code)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- 2. Create business_cards with default structure
  INSERT INTO business_cards (
    user_id,
    user_code,
    personal,
    contact,
    profile,
    "socialMessaging",
    "socialChannels",
    portfolio,
    "customLabels"
  )
  VALUES (
    NEW.id,
    v_user_code,
    v_default_card->'personal',
    v_default_card->'contact',
    v_default_card->'profile',
    v_default_card->'socialMessaging',
    v_default_card->'socialChannels',
    v_default_card->'portfolio',
    v_default_card->'customLabels'
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  -- 3. Create default share groups (Public, Private, Business, Personal)
  INSERT INTO user_share_groups (id, user_id, user_code, label, description, share_code, icon, color, is_default, display_order)
  VALUES
    (
      NEW.id || '_public',
      NEW.id,
      v_user_code,
      'Public',
      'Anyone with your public link can see this information',
      generate_share_code(),
      'Users',
      'blue',
      true,
      1
    ),
    (
      NEW.id || '_private',
      NEW.id,
      v_user_code,
      'Private',
      'Only trusted contacts with your private link can access',
      generate_share_code(),
      'Shield',
      'purple',
      true,
      2
    ),
    (
      NEW.id || '_business',
      NEW.id,
      v_user_code,
      'Business',
      'Professional contacts with your business link',
      generate_share_code(),
      'Briefcase',
      'green',
      true,
      3
    ),
    (
      NEW.id || '_personal',
      NEW.id,
      v_user_code,
      'Personal',
      'Close personal contacts with your personal link',
      generate_share_code(),
      'Heart',
      'pink',
      true,
      4
    )
  ON CONFLICT (id) DO NOTHING;
  
  -- 4. Create share settings for each group
  INSERT INTO user_share_settings (user_id, user_code, group_id, visible_fields)
  VALUES
    (NEW.id, v_user_code, NEW.id || '_public', get_default_visible_fields('public')),
    (NEW.id, v_user_code, NEW.id || '_private', get_default_visible_fields('private')),
    (NEW.id, v_user_code, NEW.id || '_business', get_default_visible_fields('business')),
    (NEW.id, v_user_code, NEW.id || '_personal', get_default_visible_fields('personal'))
  ON CONFLICT (user_code, group_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- CREATE TRIGGER
-- ============================================

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger to run after user is created
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION initialize_new_user();

-- ============================================
-- BACKFILL EXISTING USERS (Optional)
-- ============================================

-- Uncomment and run this section if you want to initialize existing users who don't have data
/*
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN 
    SELECT id FROM auth.users 
    WHERE id NOT IN (SELECT user_id FROM user_code_ownership)
  LOOP
    -- This will trigger the initialization function
    PERFORM initialize_new_user_manual(user_record.id);
  END LOOP;
END $$;
*/

-- Manual initialization function (for backfilling)
CREATE OR REPLACE FUNCTION initialize_new_user_manual(p_user_id UUID)
RETURNS void AS $$
DECLARE
  v_user_code TEXT;
  v_default_card JSONB;
BEGIN
  -- Check if user already initialized
  IF EXISTS (SELECT 1 FROM user_code_ownership WHERE user_id = p_user_id) THEN
    RETURN;
  END IF;
  
  -- Generate unique user code
  v_user_code := generate_user_code();
  
  -- Get default business card structure
  v_default_card := get_default_business_card();
  
  -- 1. Create user_code_ownership
  INSERT INTO user_code_ownership (user_id, user_code)
  VALUES (p_user_id, v_user_code);
  
  -- 2. Create business_cards
  INSERT INTO business_cards (
    user_id,
    user_code,
    personal,
    contact,
    profile,
    "socialMessaging",
    "socialChannels",
    portfolio,
    "customLabels"
  )
  VALUES (
    p_user_id,
    v_user_code,
    v_default_card->'personal',
    v_default_card->'contact',
    v_default_card->'profile',
    v_default_card->'socialMessaging',
    v_default_card->'socialChannels',
    v_default_card->'portfolio',
    v_default_card->'customLabels'
  );
  
  -- 3. Create default share groups
  INSERT INTO user_share_groups (id, user_id, user_code, label, description, share_code, icon, color, is_default, display_order)
  VALUES
    (p_user_id || '_public', p_user_id, v_user_code, 'Public', 'Anyone with your public link can see this information', generate_share_code(), 'Users', 'blue', true, 1),
    (p_user_id || '_private', p_user_id, v_user_code, 'Private', 'Only trusted contacts with your private link can access', generate_share_code(), 'Shield', 'purple', true, 2),
    (p_user_id || '_business', p_user_id, v_user_code, 'Business', 'Professional contacts with your business link', generate_share_code(), 'Briefcase', 'green', true, 3),
    (p_user_id || '_personal', p_user_id, v_user_code, 'Personal', 'Close personal contacts with your personal link', generate_share_code(), 'Heart', 'pink', true, 4);
  
  -- 4. Create share settings
  INSERT INTO user_share_settings (user_id, user_code, group_id, visible_fields)
  VALUES
    (p_user_id, v_user_code, p_user_id || '_public', get_default_visible_fields('public')),
    (p_user_id, v_user_code, p_user_id || '_private', get_default_visible_fields('private')),
    (p_user_id, v_user_code, p_user_id || '_business', get_default_visible_fields('business')),
    (p_user_id, v_user_code, p_user_id || '_personal', get_default_visible_fields('personal'));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- VERIFICATION QUERY
-- ============================================

-- Run this to verify the trigger is set up:
-- SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';

-- Test by creating a new user and checking:
-- SELECT * FROM user_code_ownership WHERE user_id = 'new_user_id';
-- SELECT * FROM business_cards WHERE user_id = 'new_user_id';
-- SELECT * FROM user_share_groups WHERE user_id = 'new_user_id';
-- SELECT * FROM user_share_settings WHERE user_id = 'new_user_id';
