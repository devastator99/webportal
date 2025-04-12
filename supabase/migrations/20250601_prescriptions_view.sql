
-- Create the prescriptions table if it doesn't exist yet
CREATE TABLE IF NOT EXISTS prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL,
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES auth.users(id),
  diagnosis TEXT NOT NULL,
  prescription TEXT NOT NULL,
  notes TEXT
);

-- Add RLS policies to prescriptions table
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;

-- Patients can view their own prescriptions
CREATE POLICY "Patients can view their own prescriptions"
ON prescriptions FOR SELECT
USING (auth.uid() = patient_id);

-- Doctors can view and create prescriptions for their patients
CREATE POLICY "Doctors can view and create prescriptions for their patients"
ON prescriptions FOR ALL
USING (auth.uid() = doctor_id);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON prescriptions TO authenticated;
