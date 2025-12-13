-- ============================================
-- ENSURE generate_unique_user_code() EXISTS
-- ============================================

CREATE OR REPLACE FUNCTION public.generate_unique_user_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
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
    
    IF NOT EXISTS (SELECT 1 FROM user_code_ownership WHERE user_code = result) THEN
      RETURN result;
    END IF;
    
    attempt := attempt + 1;
    EXIT WHEN attempt >= max_attempts;
  END LOOP;
  
  RAISE EXCEPTION 'Could not generate unique user code after % attempts', max_attempts;
END;
$$;

-- Verify it works
DO $$
DECLARE
  test_code TEXT;
BEGIN
  test_code := generate_unique_user_code();
  RAISE NOTICE '✅ Successfully generated test user code: %', test_code;
END $$;
