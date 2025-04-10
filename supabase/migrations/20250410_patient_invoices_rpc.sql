
-- Function to get patient invoices without RLS policy recursion issues
CREATE OR REPLACE FUNCTION get_patient_invoices(p_patient_id UUID)
RETURNS TABLE (
  id UUID,
  invoice_number TEXT,
  amount NUMERIC,
  created_at TIMESTAMPTZ,
  description TEXT,
  status TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pi.id,
    pi.invoice_number,
    pi.amount,
    pi.created_at,
    pi.description,
    pi.status
  FROM patient_invoices pi
  WHERE pi.patient_id = p_patient_id
  ORDER BY pi.created_at DESC;
END;
$$;

-- Grant execution permission to authenticated users
GRANT EXECUTE ON FUNCTION get_patient_invoices(UUID) TO authenticated;
