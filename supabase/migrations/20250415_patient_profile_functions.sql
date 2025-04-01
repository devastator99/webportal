
-- Create a function to insert or update patient details
CREATE OR REPLACE FUNCTION public.upsert_patient_details(
  p_user_id UUID,
  p_age INTEGER,
  p_gender TEXT,
  p_blood_group TEXT,
  p_allergies TEXT,
  p_emergency_contact TEXT,
  p_height FLOAT,
  p_birth_date DATE,
  p_food_habit TEXT,
  p_current_medical_conditions TEXT
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_patient_record JSONB;
BEGIN
  -- Check if the patient record already exists
  IF EXISTS (SELECT 1 FROM public.patient_details WHERE user_id = p_user_id) THEN
    -- Update existing record
    UPDATE public.patient_details
    SET
      age = p_age,
      gender = p_gender,
      blood_group = p_blood_group,
      allergies = p_allergies,
      emergency_contact = p_emergency_contact,
      height = p_height,
      birth_date = p_birth_date,
      food_habit = p_food_habit,
      current_medical_conditions = p_current_medical_conditions,
      updated_at = NOW()
    WHERE user_id = p_user_id
    RETURNING to_jsonb(patient_details.*) INTO v_patient_record;
  ELSE
    -- Insert new record
    INSERT INTO public.patient_details (
      user_id,
      age,
      gender,
      blood_group,
      allergies,
      emergency_contact,
      height,
      birth_date,
      food_habit,
      current_medical_conditions
    )
    VALUES (
      p_user_id,
      p_age,
      p_gender,
      p_blood_group,
      p_allergies,
      p_emergency_contact,
      p_height,
      p_birth_date,
      p_food_habit,
      p_current_medical_conditions
    )
    RETURNING to_jsonb(patient_details.*) INTO v_patient_record;
  END IF;
  
  RETURN v_patient_record;
END;
$$;

-- Create a function to insert user role
CREATE OR REPLACE FUNCTION public.insert_user_role(
  p_user_id UUID,
  p_role TEXT
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_role_record JSONB;
  v_valid_role BOOLEAN;
BEGIN
  -- Validate that the role is one of the allowed values
  v_valid_role := p_role IN ('patient', 'doctor', 'nutritionist', 'administrator', 'reception');
  
  IF NOT v_valid_role THEN
    RAISE EXCEPTION 'Invalid role: %. Must be one of: patient, doctor, nutritionist, administrator, reception', p_role;
  END IF;

  -- Insert the user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (p_user_id, p_role)
  RETURNING to_jsonb(user_roles.*) INTO v_role_record;
  
  RETURN v_role_record;
END;
$$;

-- Grant execute permissions on the functions
GRANT EXECUTE ON FUNCTION public.upsert_patient_details TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.insert_user_role TO anon, authenticated, service_role;
