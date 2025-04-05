
-- Create a view for patient assignments that uses our function
CREATE OR REPLACE VIEW patient_assignments_report AS
SELECT * FROM get_patient_assignments_report();

-- Grant access to the view
GRANT SELECT ON patient_assignments_report TO authenticated;
