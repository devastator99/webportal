
-- Create the missing complete_doctor_registration function
CREATE OR REPLACE FUNCTION public.complete_doctor_registration(
  p_user_id UUID,
  p_first_name TEXT,
  p_last_name TEXT,
  p_phone TEXT,
  p_specialty TEXT DEFAULT NULL,
  p_visiting_hours TEXT DEFAULT NULL,
  p_clinic_location TEXT DEFAULT NULL,
  p_consultation_fee NUMERIC DEFAULT 500
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_role TEXT;
BEGIN
  -- Check if user exists and is a doctor
  SELECT role INTO v_user_role
  FROM user_roles
  WHERE user_id = p_user_id;
  
  IF v_user_role IS NULL OR v_user_role <> 'doctor' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User is not a valid doctor'
    );
  END IF;
  
  -- Update the profile with doctor details
  UPDATE profiles
  SET 
    first_name = p_first_name,
    last_name = p_last_name,
    phone = p_phone,
    specialty = p_specialty,
    visiting_hours = p_visiting_hours,
    clinic_location = p_clinic_location,
    consultation_fee = p_consultation_fee,
    registration_status = 'payment_complete',
    updated_at = now()
  WHERE id = p_user_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Doctor registration completed successfully',
    'user_id', p_user_id,
    'role', 'doctor',
    'phone', p_phone,
    'registration_status', 'payment_complete'
  );
END;
$function$;
