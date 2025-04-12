
-- Create a view to simplify getting patient prescriptions
CREATE OR REPLACE FUNCTION public.get_patient_prescriptions(p_patient_id UUID)
RETURNS TABLE (
  id UUID,
  created_at TIMESTAMP WITH TIME ZONE,
  diagnosis TEXT,
  prescription TEXT,
  notes TEXT,
  doctor_id UUID,
  patient_id UUID,
  doctor_first_name TEXT,
  doctor_last_name TEXT
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mr.id,
    mr.created_at,
    mr.diagnosis,
    mr.prescription,
    mr.notes,
    mr.doctor_id,
    mr.patient_id,
    d.first_name as doctor_first_name,
    d.last_name as doctor_last_name
  FROM medical_records mr
  LEFT JOIN profiles d ON mr.doctor_id = d.id
  WHERE mr.patient_id = p_patient_id
  ORDER BY mr.created_at DESC;
END;
$$;

-- Grant execute permission to the function
GRANT EXECUTE ON FUNCTION public.get_patient_prescriptions(UUID) TO authenticated;
