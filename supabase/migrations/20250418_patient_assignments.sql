
-- Create a function to get the patient's care team
CREATE OR REPLACE FUNCTION public.get_patient_care_team(p_patient_id UUID)
RETURNS TABLE (
  role TEXT,
  first_name TEXT,
  last_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Get the doctor from patient_assignments table
  RETURN QUERY
  SELECT 
    'doctor' as role,
    p.first_name,
    p.last_name
  FROM patient_assignments pa
  JOIN profiles p ON p.id = pa.doctor_id
  WHERE pa.patient_id = p_patient_id
  
  UNION ALL
  
  -- Get the nutritionist from patient_assignments table if assigned
  SELECT 
    'nutritionist' as role,
    p.first_name,
    p.last_name
  FROM patient_assignments pa
  JOIN profiles p ON p.id = pa.nutritionist_id
  WHERE pa.patient_id = p_patient_id AND pa.nutritionist_id IS NOT NULL;
  
END;
$$;
