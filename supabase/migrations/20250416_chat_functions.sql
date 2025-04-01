
-- Function to get a patient's care team (assigned doctor and nutritionist)
CREATE OR REPLACE FUNCTION public.get_patient_care_team(p_patient_id UUID)
RETURNS JSONB[]
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_result JSONB[];
BEGIN
  -- Get assigned doctor
  SELECT array_agg(jsonb_build_object(
    'id', p.id,
    'first_name', p.first_name,
    'last_name', p.last_name,
    'role', 'doctor'
  ))
  INTO v_result
  FROM patient_doctor_assignments pda
  JOIN profiles p ON pda.doctor_id = p.id
  WHERE pda.patient_id = p_patient_id;
  
  -- Get assigned nutritionist
  SELECT array_agg(v_result || jsonb_build_object(
    'id', p.id,
    'first_name', p.first_name,
    'last_name', p.last_name,
    'role', 'nutritionist'
  ))
  INTO v_result
  FROM patient_nutritionist_assignments pna
  JOIN profiles p ON pna.nutritionist_id = p.id
  WHERE pna.patient_id = p_patient_id;
  
  RETURN COALESCE(v_result, '[]'::jsonb[]);
END;
$$;

-- Function to get assigned patients for a provider (doctor or nutritionist)
CREATE OR REPLACE FUNCTION public.get_assigned_patients(
  p_provider_id UUID,
  p_provider_role TEXT
)
RETURNS JSONB[]
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_result JSONB[];
BEGIN
  IF p_provider_role = 'doctor' THEN
    -- Get patients assigned to this doctor
    SELECT array_agg(jsonb_build_object(
      'id', p.id,
      'first_name', p.first_name,
      'last_name', p.last_name,
      'role', 'patient'
    ))
    INTO v_result
    FROM patient_doctor_assignments pda
    JOIN profiles p ON pda.patient_id = p.id
    WHERE pda.doctor_id = p_provider_id;
  ELSIF p_provider_role = 'nutritionist' THEN
    -- Get patients assigned to this nutritionist
    SELECT array_agg(jsonb_build_object(
      'id', p.id,
      'first_name', p.first_name,
      'last_name', p.last_name,
      'role', 'patient'
    ))
    INTO v_result
    FROM patient_nutritionist_assignments pna
    JOIN profiles p ON pna.patient_id = p.id
    WHERE pna.nutritionist_id = p_provider_id;
  END IF;
  
  RETURN COALESCE(v_result, '[]'::jsonb[]);
END;
$$;

-- Function to assign a doctor to a patient
CREATE OR REPLACE FUNCTION public.assign_doctor_to_patient(
  p_doctor_id UUID,
  p_patient_id UUID
)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_doctor_role TEXT;
  v_patient_role TEXT;
BEGIN
  -- Verify the doctor has the doctor role
  SELECT role INTO v_doctor_role FROM user_roles WHERE user_id = p_doctor_id;
  IF v_doctor_role <> 'doctor' THEN
    RAISE EXCEPTION 'Provided ID is not a doctor';
  END IF;
  
  -- Verify the patient has the patient role
  SELECT role INTO v_patient_role FROM user_roles WHERE user_id = p_patient_id;
  IF v_patient_role <> 'patient' THEN
    RAISE EXCEPTION 'Provided ID is not a patient';
  END IF;
  
  -- Insert or update the assignment
  INSERT INTO patient_doctor_assignments (patient_id, doctor_id)
  VALUES (p_patient_id, p_doctor_id)
  ON CONFLICT (patient_id, doctor_id) DO NOTHING;
  
  RETURN TRUE;
END;
$$;

-- Function to assign a nutritionist to a patient
CREATE OR REPLACE FUNCTION public.assign_nutritionist_to_patient(
  p_nutritionist_id UUID,
  p_patient_id UUID
)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_nutritionist_role TEXT;
  v_patient_role TEXT;
BEGIN
  -- Verify the nutritionist has the nutritionist role
  SELECT role INTO v_nutritionist_role FROM user_roles WHERE user_id = p_nutritionist_id;
  IF v_nutritionist_role <> 'nutritionist' THEN
    RAISE EXCEPTION 'Provided ID is not a nutritionist';
  END IF;
  
  -- Verify the patient has the patient role
  SELECT role INTO v_patient_role FROM user_roles WHERE user_id = p_patient_id;
  IF v_patient_role <> 'patient' THEN
    RAISE EXCEPTION 'Provided ID is not a patient';
  END IF;
  
  -- Insert or update the assignment
  INSERT INTO patient_nutritionist_assignments (patient_id, nutritionist_id)
  VALUES (p_patient_id, p_nutritionist_id)
  ON CONFLICT (patient_id, nutritionist_id) DO NOTHING;
  
  RETURN TRUE;
END;
$$;

-- Create tables for patient-doctor and patient-nutritionist assignments if they don't exist
CREATE TABLE IF NOT EXISTS public.patient_doctor_assignments (
  patient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (patient_id, doctor_id)
);

CREATE TABLE IF NOT EXISTS public.patient_nutritionist_assignments (
  patient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  nutritionist_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (patient_id, nutritionist_id)
);

-- Grant execute permissions on the functions
GRANT EXECUTE ON FUNCTION public.get_patient_care_team TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_assigned_patients TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.assign_doctor_to_patient TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.assign_nutritionist_to_patient TO anon, authenticated, service_role;

-- Grant permissions on the tables
GRANT SELECT, INSERT, UPDATE, DELETE ON public.patient_doctor_assignments TO service_role;
GRANT SELECT ON public.patient_doctor_assignments TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.patient_nutritionist_assignments TO service_role;
GRANT SELECT ON public.patient_nutritionist_assignments TO authenticated;
