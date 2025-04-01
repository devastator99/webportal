
-- Function to get a patient's care team (assigned doctor and nutritionist)
CREATE OR REPLACE FUNCTION public.get_patient_care_team(p_patient_id UUID)
RETURNS TABLE (
  id UUID,
  first_name TEXT,
  last_name TEXT,
  role TEXT
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Get assigned doctor
  RETURN QUERY
  SELECT p.id, p.first_name, p.last_name, 'doctor'::TEXT as role
  FROM profiles p
  JOIN patient_doctor_assignments pda ON p.id = pda.doctor_id
  WHERE pda.patient_id = p_patient_id;
  
  -- Get assigned nutritionist
  RETURN QUERY
  SELECT p.id, p.first_name, p.last_name, 'nutritionist'::TEXT as role
  FROM profiles p
  JOIN patient_nutritionist_assignments pna ON p.id = pna.nutritionist_id  
  WHERE pna.patient_id = p_patient_id;
  
  -- Add AI Bot as part of care team
  RETURN QUERY
  SELECT 
    '00000000-0000-0000-0000-000000000000'::uuid as id, 
    'AI'::TEXT as first_name, 
    'Assistant'::TEXT as last_name, 
    'aibot'::TEXT as role;
END;
$$;

-- Function to get doctor for a specific patient
CREATE OR REPLACE FUNCTION public.get_doctor_for_patient(p_patient_id UUID)
RETURNS TABLE (
  id UUID,
  first_name TEXT,
  last_name TEXT
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.first_name, p.last_name
  FROM profiles p
  JOIN patient_doctor_assignments pda ON p.id = pda.doctor_id
  WHERE pda.patient_id = p_patient_id;
END;
$$;

-- Function to get nutritionist for a specific patient
CREATE OR REPLACE FUNCTION public.get_nutritionist_for_patient(p_patient_id UUID)
RETURNS TABLE (
  id UUID,
  first_name TEXT,
  last_name TEXT
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.first_name, p.last_name
  FROM profiles p
  JOIN patient_nutritionist_assignments pna ON p.id = pna.nutritionist_id
  WHERE pna.patient_id = p_patient_id;
END;
$$;

-- Function to get patients assigned to a provider (doctor or nutritionist)
CREATE OR REPLACE FUNCTION public.get_assigned_patients(p_provider_id UUID, p_provider_role TEXT)
RETURNS TABLE (
  id UUID,
  first_name TEXT,
  last_name TEXT
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  IF p_provider_role = 'doctor' THEN
    RETURN QUERY
    SELECT p.id, p.first_name, p.last_name
    FROM profiles p
    JOIN patient_doctor_assignments pda ON p.id = pda.patient_id
    WHERE pda.doctor_id = p_provider_id;
  ELSIF p_provider_role = 'nutritionist' THEN
    RETURN QUERY
    SELECT p.id, p.first_name, p.last_name
    FROM profiles p
    JOIN patient_nutritionist_assignments pna ON p.id = pna.patient_id
    WHERE pna.nutritionist_id = p_provider_id;
  END IF;
END;
$$;

-- Grant execute permission on the functions
GRANT EXECUTE ON FUNCTION public.get_patient_care_team TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_doctor_for_patient TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_nutritionist_for_patient TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_assigned_patients TO anon, authenticated, service_role;
