
-- Comprehensive fix for all database schema mismatches and function errors

-- First, let's fix the user creation trigger that's causing ambiguous column references
CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_type_from_metadata TEXT;
  default_care_team RECORD;
BEGIN
  -- Get user type from metadata
  user_type_from_metadata := NEW.raw_user_meta_data ->> 'user_type_string';
  
  -- Create profile entry
  INSERT INTO public.profiles (
    id, 
    first_name, 
    last_name, 
    phone,
    registration_status
  ) VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name',
    COALESCE(NEW.raw_user_meta_data ->> 'phone', NEW.raw_user_meta_data ->> 'primary_contact'),
    CASE 
      WHEN user_type_from_metadata IN ('doctor', 'nutritionist', 'administrator', 'reception') 
      THEN 'payment_complete'::registration_status
      ELSE 'payment_pending'::registration_status
    END
  );
  
  -- Create user role entry
  INSERT INTO public.user_roles (user_id, role) 
  VALUES (NEW.id, COALESCE(user_type_from_metadata, 'patient')::user_type);
  
  -- Create patient details if user is a patient
  IF COALESCE(user_type_from_metadata, 'patient') = 'patient' THEN
    INSERT INTO public.patient_details (id) VALUES (NEW.id);
    
    -- Try to get default care team without ambiguous column references
    SELECT dct.default_doctor_id, dct.default_nutritionist_id 
    INTO default_care_team
    FROM public.default_care_teams dct
    WHERE dct.is_active = true
    LIMIT 1;
    
    -- Create patient assignment if default care team exists
    IF default_care_team.default_doctor_id IS NOT NULL THEN
      INSERT INTO public.patient_assignments (patient_id, doctor_id, nutritionist_id)
      VALUES (NEW.id, default_care_team.default_doctor_id, default_care_team.default_nutritionist_id)
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log the error but don't block user creation
  INSERT INTO public.system_logs (
    user_id, action, details, level, message, metadata
  ) VALUES (
    NEW.id, 
    'user_signup_error', 
    jsonb_build_object('error_code', SQLSTATE, 'error_message', SQLERRM),
    'error',
    'Error during user signup trigger: ' || SQLERRM,
    jsonb_build_object('user_type', user_type_from_metadata, 'step', 'trigger_error')
  );
  
  RETURN NEW;
END;
$$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_signup();

-- Fix the complete_user_registration function to match actual schema
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
  
  -- Check if user role already exists
  SELECT EXISTS(SELECT 1 FROM user_roles WHERE user_id = p_user_id) INTO v_role_exists;

  -- Update or insert profile
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

  -- Insert or update user role (only update role, not updated_at since it doesn't exist)
  IF v_role_exists THEN
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

  -- Create registration tasks based on user type (matching actual schema)
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
    'User registration completed successfully with correct status',
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

-- Fix the existing user repair function
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
      p.registration_status != 'payment_complete'::registration_status 
      OR NOT EXISTS (
        SELECT 1 FROM registration_tasks rt 
        WHERE rt.user_id = p.id 
        AND rt.task_type IN ('complete_professional_registration', 'send_welcome_notification')
      )
    )
  LOOP
    -- Fix registration status for professionals
    UPDATE profiles 
    SET registration_status = 'payment_complete'::registration_status,
        registration_completed_at = COALESCE(registration_completed_at, NOW()),
        updated_at = NOW()
    WHERE id = v_user.id;
    
    -- Create missing registration tasks for this user if they have a phone number
    IF v_user.phone IS NOT NULL AND v_user.phone != '' THEN
      -- Clear any existing tasks to avoid duplicates
      DELETE FROM registration_tasks 
      WHERE user_id = v_user.id 
      AND task_type IN ('complete_professional_registration', 'send_welcome_notification');
      
      -- Insert new tasks (matching actual schema - no metadata column)
      INSERT INTO registration_tasks (user_id, task_type, status, priority)
      VALUES 
        (v_user.id, 'complete_professional_registration', 'pending'::task_status, 1),
        (v_user.id, 'send_welcome_notification', 'pending'::task_status, 2);
      
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

-- Update the registration task functions to match actual schema
CREATE OR REPLACE FUNCTION public.get_next_pending_registration_task()
 RETURNS TABLE(
   task_id uuid,
   user_id uuid,
   task_type text,
   retry_count integer,
   created_at timestamp with time zone
 )
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    rt.id as task_id,
    rt.user_id,
    rt.task_type,
    rt.retry_count,
    rt.created_at
  FROM registration_tasks rt
  WHERE rt.status = 'pending'::task_status
    AND rt.next_retry_at <= NOW()
  ORDER BY rt.priority DESC, rt.created_at ASC
  LIMIT 1;
END;
$function$;

-- Update task status function to match actual schema
CREATE OR REPLACE FUNCTION public.update_registration_task_status(
  p_task_id uuid,
  p_status task_status,
  p_result_payload jsonb DEFAULT NULL,
  p_error_details jsonb DEFAULT NULL
)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE registration_tasks
  SET 
    status = p_status,
    result_payload = COALESCE(p_result_payload, result_payload),
    error_details = COALESCE(p_error_details, error_details),
    updated_at = NOW(),
    retry_count = CASE 
      WHEN p_status = 'failed'::task_status THEN retry_count + 1
      ELSE retry_count
    END,
    next_retry_at = CASE 
      WHEN p_status = 'failed'::task_status THEN NOW() + INTERVAL '5 minutes' * (retry_count + 1)
      ELSE next_retry_at
    END
  WHERE id = p_task_id;
  
  RETURN FOUND;
END;
$function$;

-- Grant proper permissions
GRANT EXECUTE ON FUNCTION public.complete_user_registration TO authenticated;
GRANT EXECUTE ON FUNCTION public.fix_existing_professional_users TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_next_pending_registration_task TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_registration_task_status TO authenticated;

-- Apply the fix immediately to existing users
SELECT public.fix_existing_professional_users();
