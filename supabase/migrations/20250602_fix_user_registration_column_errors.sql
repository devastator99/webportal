
-- Fix column reference errors in user registration functions
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
  v_target_status registration_status;
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
    v_target_status := 'payment_complete'::registration_status;
  ELSE
    v_target_status := 'payment_pending'::registration_status;
  END IF;

  -- Log the start of registration
  INSERT INTO system_logs (user_id, action, details, level, message, metadata)
  VALUES (
    p_user_id, 
    'user_registration_start', 
    jsonb_build_object('role', p_role, 'phone', p_phone, 'registration_status', v_target_status::text),
    'info',
    'Starting complete user registration process',
    jsonb_build_object('role', p_role, 'phone', p_phone, 'registration_status', v_target_status::text, 'step', 'start')
  );

  -- Check if profile already exists
  SELECT EXISTS(SELECT 1 FROM profiles WHERE id = p_user_id) INTO v_profile_exists;
  
  -- CRITICAL FIX: Create/update profile FIRST to satisfy foreign key dependency
  IF v_profile_exists THEN
    UPDATE profiles SET
      first_name = COALESCE(p_first_name, first_name),
      last_name = COALESCE(p_last_name, last_name),
      phone = COALESCE(p_phone, phone),
      registration_status = v_target_status,
      registration_completed_at = CASE 
        WHEN v_target_status = 'payment_complete'::registration_status THEN NOW()
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
      p_user_id, p_first_name, p_last_name, p_phone, v_target_status,
      CASE WHEN v_target_status = 'payment_complete'::registration_status THEN NOW() ELSE NULL END
    );
  END IF;

  -- NOW that profile exists, check if user role exists and create/update it
  SELECT EXISTS(SELECT 1 FROM user_roles WHERE user_id = p_user_id) INTO v_role_exists;

  IF v_role_exists THEN
    -- FIXED: Remove invalid updated_at column reference
    UPDATE user_roles SET 
      role = p_role::user_type
    WHERE user_id = p_user_id;
  ELSE
    INSERT INTO user_roles (user_id, role)
    VALUES (p_user_id, p_role::user_type);
  END IF;

  -- Update patient_details if it's a patient
  IF p_role = 'patient' THEN
    INSERT INTO patient_details (
      id, gender, blood_group, allergies, emergency_contact, 
      height, date_of_birth, chronic_conditions
    )
    VALUES (
      p_user_id, p_gender, p_blood_group, p_allergies, p_emergency_contact,
      p_height, p_birth_date, p_current_medical_conditions
    )
    ON CONFLICT (id) DO UPDATE SET
      gender = COALESCE(EXCLUDED.gender, patient_details.gender),
      blood_group = COALESCE(EXCLUDED.blood_group, patient_details.blood_group),
      allergies = COALESCE(EXCLUDED.allergies, patient_details.allergies),
      emergency_contact = COALESCE(EXCLUDED.emergency_contact, patient_details.emergency_contact),
      height = COALESCE(EXCLUDED.height, patient_details.height),
      date_of_birth = COALESCE(EXCLUDED.date_of_birth, patient_details.date_of_birth),
      chronic_conditions = COALESCE(EXCLUDED.chronic_conditions, patient_details.chronic_conditions),
      updated_at = NOW();
  END IF;

  -- Create registration tasks based on user type
  IF p_role IN ('doctor', 'nutritionist', 'administrator', 'reception') THEN
    -- Create professional registration tasks
    INSERT INTO registration_tasks (user_id, task_type, status, priority)
    VALUES 
      (p_user_id, 'complete_professional_registration', 'pending'::task_status, 1),
      (p_user_id, 'send_welcome_notification', 'pending'::task_status, 2);
       
    -- Log professional registration task creation
    INSERT INTO system_logs (user_id, action, details, level, message, metadata)
    VALUES (
      p_user_id, 
      'professional_tasks_created', 
      jsonb_build_object('role', p_role, 'phone', p_phone, 'registration_status', v_target_status::text, 'tasks_created', 2),
      'info',
      'Professional registration tasks created successfully with payment_complete status',
      jsonb_build_object('role', p_role, 'phone', p_phone, 'registration_status', v_target_status::text, 'step', 'tasks_created')
    );
  ELSE
    -- For patients, create welcome notification task
    INSERT INTO registration_tasks (user_id, task_type, status, priority)
    VALUES 
      (p_user_id, 'send_welcome_notification', 'pending'::task_status, 1);
  END IF;

  -- Log successful completion
  INSERT INTO system_logs (user_id, action, details, level, message, metadata)
  VALUES (
    p_user_id, 
    'user_registration_complete', 
    jsonb_build_object('role', p_role, 'phone', p_phone, 'registration_status', v_target_status::text, 'profile_exists', v_profile_exists, 'role_exists', v_role_exists),
    'info',
    'User registration completed successfully with correct foreign key order',
    jsonb_build_object('role', p_role, 'phone', p_phone, 'registration_status', v_target_status::text, 'step', 'complete')
  );

  RETURN jsonb_build_object(
    'success', true,
    'message', 'User registration completed successfully',
    'user_id', p_user_id,
    'role', p_role,
    'phone', p_phone,
    'registration_status', v_target_status::text,
    'tasks_created', true
  );

EXCEPTION WHEN OTHERS THEN
  -- Log the error
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
