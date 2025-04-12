
-- Create a view for patient prescriptions that avoids the recursion issue
CREATE OR REPLACE VIEW patient_prescriptions AS
SELECT 
  p.id,
  p.created_at,
  p.patient_id,
  p.doctor_id,
  p.diagnosis,
  p.prescription,
  p.notes,
  d.first_name as doctor_first_name,
  d.last_name as doctor_last_name
FROM 
  prescriptions p
JOIN 
  profiles d ON p.doctor_id = d.id;

-- Add secure policy for the view
CREATE POLICY "Patients can view their own prescriptions" 
ON patient_prescriptions
FOR SELECT
USING (auth.uid() = patient_id);

-- Grant permission to use the view
GRANT SELECT ON patient_prescriptions TO authenticated;
