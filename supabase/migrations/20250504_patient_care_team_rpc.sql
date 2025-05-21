
-- Create a secure RPC function to get a patient's care team members
CREATE OR REPLACE FUNCTION public.get_patient_care_team_members(p_patient_id UUID)
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
  -- Get the doctor and nutritionist assigned to this patient
  RETURN QUERY
  SELECT 
    d.id,
    d.first_name,
    d.last_name,
    'doctor'::TEXT as role
  FROM 
    patient_assignments pa
    JOIN profiles d ON pa.doctor_id = d.id
  WHERE 
    pa.patient_id = p_patient_id
    AND pa.doctor_id IS NOT NULL
  
  UNION ALL
  
  SELECT 
    n.id,
    n.first_name,
    n.last_name,
    'nutritionist'::TEXT as role
  FROM 
    patient_assignments pa
    JOIN profiles n ON pa.nutritionist_id = n.id
  WHERE 
    pa.patient_id = p_patient_id
    AND pa.nutritionist_id IS NOT NULL
    
  UNION ALL
  
  -- Include the patient themselves
  SELECT
    p.id,
    p.first_name,
    p.last_name,
    'patient'::TEXT as role
  FROM
    profiles p
  WHERE
    p.id = p_patient_id
    
  UNION ALL
  
  -- Always include AI Bot as part of care team
  SELECT 
    '00000000-0000-0000-0000-000000000000'::UUID as id,
    'AI'::TEXT as first_name,
    'Assistant'::TEXT as last_name,
    'aibot'::TEXT as role;
END;
$$;

-- Grant execute permission to the function
GRANT EXECUTE ON FUNCTION public.get_patient_care_team_members(UUID) TO authenticated;
