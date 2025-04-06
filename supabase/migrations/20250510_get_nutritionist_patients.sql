
-- Function to get patients assigned to a nutritionist
CREATE OR REPLACE FUNCTION public.get_nutritionist_patients(p_nutritionist_id UUID)
RETURNS TABLE (
  id UUID,
  patient_id UUID,
  created_at TIMESTAMP WITH TIME ZONE,
  patient_first_name TEXT,
  patient_last_name TEXT
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pa.id,
    pa.patient_id,
    pa.created_at,
    p.first_name as patient_first_name,
    p.last_name as patient_last_name
  FROM patient_assignments pa
  JOIN profiles p ON pa.patient_id = p.id
  WHERE pa.nutritionist_id = p_nutritionist_id
  ORDER BY p.first_name, p.last_name;
END;
$$;

-- Grant execute permission to the function
GRANT EXECUTE ON FUNCTION public.get_nutritionist_patients(UUID) TO authenticated;
