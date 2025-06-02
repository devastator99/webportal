
-- Fix system_logs table schema to match what the RPC functions expect
-- The complete_user_registration function is trying to use columns that don't exist

-- First, let's see what columns actually exist and add the missing ones
ALTER TABLE system_logs 
ADD COLUMN IF NOT EXISTS level TEXT DEFAULT 'info',
ADD COLUMN IF NOT EXISTS message TEXT,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Update the existing action column to be used as level if needed
-- Keep both for compatibility
UPDATE system_logs SET level = 'info' WHERE level IS NULL;
UPDATE system_logs SET message = details WHERE message IS NULL AND details IS NOT NULL;

-- Create an index for better performance
CREATE INDEX IF NOT EXISTS idx_system_logs_level ON system_logs(level);
CREATE INDEX IF NOT EXISTS idx_system_logs_user_id ON system_logs(user_id);

-- Also ensure the complete_user_registration function works with phone numbers
-- Let's create a fixed version that handles the schema properly
CREATE OR REPLACE FUNCTION public.complete_user_registration(
  p_user_id UUID,
  p_role TEXT,
  p_first_name TEXT,
  p_last_name TEXT,
  p_phone TEXT,
  p_email TEXT DEFAULT NULL,
  p_age INTEGER DEFAULT NULL,
  p_gender TEXT DEFAULT NULL,
  p_blood_group TEXT DEFAULT NULL,
  p_allergies TEXT DEFAULT NULL,
  p_emergency_contact TEXT DEFAULT NULL,
  p_height NUMERIC DEFAULT NULL,
  p_birth_date DATE DEFAULT NULL,
  p_food_habit TEXT DEFAULT NULL,
  p_current_medical_conditions TEXT DEFAULT NULL
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_profile_exists BOOLEAN;
  v_role_exists BOOLEAN;
BEGIN
  -- Log the start of registration
  INSERT INTO system_logs (user_id, action, details, level, message, metadata)
  VALUES (
    p_user_id, 
    'user_registration_start', 
    'Starting complete user registration process',
    'info',
    'Starting complete user registration process',
    jsonb_build_object('role', p_role, 'phone', p_phone)
  );

  -- Check if profile already exists
  SELECT EXISTS(SELECT 1 FROM profiles WHERE id = p_user_id) INTO v_profile_exists;
  
  -- Check if user role already exists
  SELECT EXISTS(SELECT 1 FROM user_roles WHERE user_id = p_user_id) INTO v_role_exists;

  -- Update or insert profile with phone number
  IF v_profile_exists THEN
    UPDATE profiles SET
      first_name = COALESCE(p_first_name, first_name),
      last_name = COALESCE(p_last_name, last_name),
      phone = COALESCE(p_phone, phone), -- Ensure phone is stored
      age = COALESCE(p_age, age),
      gender = COALESCE(p_gender, gender),
      blood_group = COALESCE(p_blood_group, blood_group),
      allergies = COALESCE(p_allergies, allergies),
      emergency_contact = COALESCE(p_emergency_contact, emergency_contact),
      height = COALESCE(p_height, height),
      date_of_birth = COALESCE(p_birth_date, date_of_birth),
      food_habit = COALESCE(p_food_habit, food_habit),
      chronic_conditions = COALESCE(p_current_medical_conditions, chronic_conditions),
      updated_at = NOW()
    WHERE id = p_user_id;
  ELSE
    INSERT INTO profiles (
      id, first_name, last_name, phone, age, gender, blood_group, 
      allergies, emergency_contact, height, date_of_birth, food_habit, chronic_conditions
    )
    VALUES (
      p_user_id, p_first_name, p_last_name, p_phone, p_age, p_gender, p_blood_group,
      p_allergies, p_emergency_contact, p_height, p_birth_date, p_food_habit, p_current_medical_conditions
    );
  END IF;

  -- Insert or update user role
  IF v_role_exists THEN
    UPDATE user_roles SET 
      role = p_role::user_type,
      updated_at = NOW()
    WHERE user_id = p_user_id;
  ELSE
    INSERT INTO user_roles (user_id, role)
    VALUES (p_user_id, p_role::user_type);
  END IF;

  -- Update registration status to payment_complete for non-patient users
  IF p_role IN ('doctor', 'nutritionist', 'administrator', 'reception') THEN
    UPDATE profiles SET 
      registration_status = 'payment_complete'
    WHERE id = p_user_id;
    
    -- Create registration tasks for professionals
    INSERT INTO registration_tasks (user_id, task_type, status, metadata)
    VALUES 
      (p_user_id, 'send_welcome_notification', 'pending', jsonb_build_object('phone', p_phone, 'role', p_role)),
      (p_user_id, 'complete_professional_registration', 'pending', jsonb_build_object('phone', p_phone, 'role', p_role));
  ELSE
    -- For patients, set appropriate status
    UPDATE profiles SET 
      registration_status = 'payment_complete'
    WHERE id = p_user_id;
    
    -- Create welcome notification task for patients
    INSERT INTO registration_tasks (user_id, task_type, status, metadata)
    VALUES 
      (p_user_id, 'send_welcome_notification', 'pending', jsonb_build_object('phone', p_phone, 'role', p_role));
  END IF;

  -- Log successful completion
  INSERT INTO system_logs (user_id, action, details, level, message, metadata)
  VALUES (
    p_user_id, 
    'user_registration_complete', 
    'User registration completed successfully',
    'info',
    'User registration completed successfully',
    jsonb_build_object('role', p_role, 'phone', p_phone, 'profile_exists', v_profile_exists, 'role_exists', v_role_exists)
  );

  RETURN jsonb_build_object(
    'success', true,
    'message', 'User registration completed successfully',
    'user_id', p_user_id,
    'role', p_role,
    'phone', p_phone
  );

EXCEPTION WHEN OTHERS THEN
  -- Log the error with proper schema
  INSERT INTO system_logs (user_id, action, details, level, message, metadata)
  VALUES (
    p_user_id, 
    'user_registration_error', 
    'Error during user registration: ' || SQLERRM,
    'error',
    'Error during user registration: ' || SQLERRM,
    jsonb_build_object('error_code', SQLSTATE, 'role', p_role, 'phone', p_phone)
  );

  RETURN jsonb_build_object(
    'success', false,
    'error', 'Registration failed: ' || SQLERRM,
    'detail', SQLSTATE
  );
END;
$$;

-- Grant proper permissions
GRANT EXECUTE ON FUNCTION public.complete_user_registration TO authenticated;
