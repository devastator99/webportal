
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
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.get_patient_care_team TO anon, authenticated, service_role;
