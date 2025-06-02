
-- Apply the system_logs schema fix and update the complete_user_registration function
-- Fix system_logs table schema to match what the RPC functions expect

-- Add missing columns to system_logs table
ALTER TABLE system_logs 
ADD COLUMN IF NOT EXISTS level TEXT DEFAULT 'info',
ADD COLUMN IF NOT EXISTS message TEXT,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Update existing records to have proper values
UPDATE system_logs SET level = 'info' WHERE level IS NULL;
UPDATE system_logs SET message = details::text WHERE message IS NULL AND details IS NOT NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_system_logs_level ON system_logs(level);
CREATE INDEX IF NOT EXISTS idx_system_logs_user_id ON system_logs(user_id);

-- Create or replace the complete_user_registration function with proper error handling
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
  v_registration_status TEXT;
BEGIN
  -- Validate inputs
  IF p_user_id IS NULL OR p_role IS NULL OR p_first_name IS NULL OR p_last_name IS NULL THEN
    RAISE EXCEPTION 'Required parameters cannot be null';
  END IF;

  IF p_phone IS NULL OR p_phone = '' THEN
    RAISE EXCEPTION 'Phone number is required for all user registrations';
  END IF;

  -- Determine correct registration status based on role
  IF p_role IN ('doctor', 'nutritionist', 'administrator', 'reception') THEN
    v_registration_status := 'payment_complete';
  ELSE
    v_registration_status := 'payment_pending';
  END IF;

  -- Log the start of registration
  INSERT INTO system_logs (user_id, action, details, level, message, metadata)
  VALUES (
    p_user_id, 
    'user_registration_start', 
    jsonb_build_object('role', p_role, 'phone', p_phone, 'registration_status', v_registration_status),
    'info',
    'Starting complete user registration process',
    jsonb_build_object('role', p_role, 'phone', p_phone, 'registration_status', v_registration_status, 'step', 'start')
  );

  -- Check if profile already exists
  SELECT EXISTS(SELECT 1 FROM profiles WHERE id = p_user_id) INTO v_profile_exists;
  
  -- Check if user role already exists
  SELECT EXISTS(SELECT 1 FROM user_roles WHERE user_id = p_user_id) INTO v_role_exists;

  -- Update or insert profile with phone number and correct registration status
  IF v_profile_exists THEN
    UPDATE profiles SET
      first_name = COALESCE(p_first_name, first_name),
      last_name = COALESCE(p_last_name, last_name),
      phone = COALESCE(p_phone, phone),
      registration_status = v_registration_status,
      registration_completed_at = CASE 
        WHEN v_registration_status = 'payment_complete' THEN NOW()
        ELSE registration_completed_at
      END,
      updated_at = NOW()
    WHERE id = p_user_id;
  ELSE
    INSERT INTO profiles (
      id, first_name, last_name, phone, registration_status,
      registration_completed_at
    )
    VALUES (
      p_user_id, p_first_name, p_last_name, p_phone, v_registration_status,
      CASE WHEN v_registration_status = 'payment_complete' THEN NOW() ELSE NULL END
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

  -- Create registration tasks based on user type
  IF p_role IN ('doctor', 'nutritionist', 'administrator', 'reception') THEN
    -- Create professional registration tasks with phone number
    INSERT INTO registration_tasks (user_id, task_type, status, metadata, priority)
    VALUES 
      (p_user_id, 'complete_professional_registration', 'pending', 
       jsonb_build_object('phone', p_phone, 'role', p_role, 'first_name', p_first_name, 'last_name', p_last_name), 1),
      (p_user_id, 'send_welcome_notification', 'pending', 
       jsonb_build_object('phone', p_phone, 'role', p_role, 'first_name', p_first_name, 'last_name', p_last_name), 2);
       
    -- Log professional registration task creation
    INSERT INTO system_logs (user_id, action, details, level, message, metadata)
    VALUES (
      p_user_id, 
      'professional_tasks_created', 
      jsonb_build_object('role', p_role, 'phone', p_phone, 'registration_status', v_registration_status, 'tasks_created', 2),
      'info',
      'Professional registration tasks created successfully with payment_complete status',
      jsonb_build_object('role', p_role, 'phone', p_phone, 'registration_status', v_registration_status, 'step', 'tasks_created')
    );
  ELSE
    -- For patients, create welcome notification task (they need to complete payment first)
    INSERT INTO registration_tasks (user_id, task_type, status, metadata, priority)
    VALUES 
      (p_user_id, 'send_welcome_notification', 'pending', 
       jsonb_build_object('phone', p_phone, 'role', p_role, 'first_name', p_first_name, 'last_name', p_last_name), 1);
  END IF;

  -- Log successful completion
  INSERT INTO system_logs (user_id, action, details, level, message, metadata)
  VALUES (
    p_user_id, 
    'user_registration_complete', 
    jsonb_build_object('role', p_role, 'phone', p_phone, 'registration_status', v_registration_status, 'profile_exists', v_profile_exists, 'role_exists', v_role_exists),
    'info',
    'User registration completed successfully with correct status',
    jsonb_build_object('role', p_role, 'phone', p_phone, 'registration_status', v_registration_status, 'step', 'complete')
  );

  RETURN jsonb_build_object(
    'success', true,
    'message', 'User registration completed successfully',
    'user_id', p_user_id,
    'role', p_role,
    'phone', p_phone,
    'registration_status', v_registration_status,
    'tasks_created', true
  );

EXCEPTION WHEN OTHERS THEN
  -- Log the error with proper schema
  INSERT INTO system_logs (user_id, action, details, level, message, metadata)
  VALUES (
    p_user_id, 
    'user_registration_error', 
    jsonb_build_object('error_code', SQLSTATE, 'error_message', SQLERRM, 'role', p_role, 'phone', p_phone),
    'error',
    'Error during user registration: ' || SQLERRM,
    jsonb_build_object('error_code', SQLSTATE, 'role', p_role, 'phone', p_phone, 'step', 'error')
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

-- Create a function to fix existing users who are stuck
CREATE OR REPLACE FUNCTION public.fix_existing_professional_users()
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_user RECORD;
  v_tasks_created INTEGER := 0;
  v_users_fixed INTEGER := 0;
BEGIN
  -- Find professional users who have wrong registration status or missing tasks
  FOR v_user IN 
    SELECT p.id, p.first_name, p.last_name, p.phone, ur.role, p.registration_status
    FROM profiles p
    JOIN user_roles ur ON p.id = ur.user_id
    WHERE ur.role IN ('doctor', 'nutritionist', 'administrator', 'reception')
    AND (
      p.registration_status != 'payment_complete' 
      OR NOT EXISTS (
        SELECT 1 FROM registration_tasks rt 
        WHERE rt.user_id = p.id 
        AND rt.task_type IN ('complete_professional_registration', 'send_welcome_notification')
      )
    )
  LOOP
    -- Fix registration status for professionals
    UPDATE profiles 
    SET registration_status = 'payment_complete',
        registration_completed_at = COALESCE(registration_completed_at, NOW()),
        updated_at = NOW()
    WHERE id = v_user.id;
    
    -- Create missing registration tasks for this user if they have a phone number
    IF v_user.phone IS NOT NULL AND v_user.phone != '' THEN
      -- Clear any existing tasks to avoid duplicates
      DELETE FROM registration_tasks 
      WHERE user_id = v_user.id 
      AND task_type IN ('complete_professional_registration', 'send_welcome_notification');
      
      INSERT INTO registration_tasks (user_id, task_type, status, metadata, priority)
      VALUES 
        (v_user.id, 'complete_professional_registration', 'pending', 
         jsonb_build_object('phone', v_user.phone, 'role', v_user.role, 'first_name', v_user.first_name, 'last_name', v_user.last_name), 1),
        (v_user.id, 'send_welcome_notification', 'pending', 
         jsonb_build_object('phone', v_user.phone, 'role', v_user.role, 'first_name', v_user.first_name, 'last_name', v_user.last_name), 2);
      
      v_tasks_created := v_tasks_created + 2;
      v_users_fixed := v_users_fixed + 1;
      
      -- Log the fix
      INSERT INTO system_logs (user_id, action, details, level, message, metadata)
      VALUES (
        v_user.id, 
        'fix_existing_professional_user', 
        jsonb_build_object('role', v_user.role, 'phone', v_user.phone, 'old_status', v_user.registration_status, 'new_status', 'payment_complete', 'tasks_created', 2),
        'info',
        'Fixed existing professional user - corrected status and created missing registration tasks',
        jsonb_build_object('role', v_user.role, 'phone', v_user.phone, 'step', 'fix_existing')
      );
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Fixed existing professional users',
    'users_fixed', v_users_fixed,
    'tasks_created', v_tasks_created
  );
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.fix_existing_professional_users TO authenticated;

-- Apply the fix immediately to existing users
SELECT public.fix_existing_professional_users();
