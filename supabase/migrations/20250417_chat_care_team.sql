
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
  
  -- Get assigned nutritionist and combine with doctor results
  SELECT array_agg(COALESCE(v_result, '[]'::jsonb[]) || jsonb_build_object(
    'id', p.id,
    'first_name', p.first_name,
    'last_name', p.last_name,
    'role', 'nutritionist'
  ))
  INTO v_result
  FROM patient_nutritionist_assignments pna
  JOIN profiles p ON pna.nutritionist_id = p.id
  WHERE pna.patient_id = p_patient_id;
  
  -- If no care team members are found, return an empty array
  RETURN COALESCE(v_result, '[]'::jsonb[]);
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.get_patient_care_team TO anon, authenticated, service_role;
