
-- Create function to get the number of care team messages
CREATE OR REPLACE FUNCTION public.get_care_team_messages_count(
  p_user_id UUID,
  p_patient_id UUID
)
RETURNS INTEGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Get care team members for the patient
  WITH care_team AS (
    SELECT pct.id
    FROM get_patient_care_team(p_patient_id) pct
    UNION
    SELECT p_patient_id
    UNION
    SELECT p_user_id
  )
  SELECT COUNT(*)
  INTO v_count
  FROM chat_messages cm
  WHERE (cm.sender_id IN (SELECT id FROM care_team) 
        AND cm.receiver_id IN (SELECT id FROM care_team));
  
  RETURN v_count;
END;
$$;

-- Fix the get_care_team_messages function to avoid ambiguous columns
CREATE OR REPLACE FUNCTION public.get_care_team_messages(
  p_user_id UUID,
  p_patient_id UUID,
  p_offset INTEGER DEFAULT 0,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  message TEXT,
  message_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  read BOOLEAN,
  sender JSON,
  receiver JSON
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Get care team members for the patient
  RETURN QUERY
  WITH care_team AS (
    SELECT pct.id
    FROM get_patient_care_team(p_patient_id) pct
    UNION
    SELECT p_patient_id
    UNION
    SELECT p_user_id
  )
  SELECT 
    cm.id,
    cm.message,
    cm.message_type::TEXT,
    cm.created_at,
    COALESCE(cm.read, FALSE) as read,
    json_build_object(
      'id', sender.id,
      'first_name', sender.first_name,
      'last_name', sender.last_name,
      'role', COALESCE(sender_role.role, 'patient')
    ) as sender,
    json_build_object(
      'id', receiver.id,
      'first_name', receiver.first_name,
      'last_name', receiver.last_name,
      'role', COALESCE(receiver_role.role, 'patient')
    ) as receiver
  FROM chat_messages cm
  JOIN profiles sender ON cm.sender_id = sender.id
  JOIN profiles receiver ON cm.receiver_id = receiver.id
  LEFT JOIN user_roles sender_role ON sender.id = sender_role.user_id
  LEFT JOIN user_roles receiver_role ON receiver.id = receiver_role.user_id
  WHERE (cm.sender_id IN (SELECT id FROM care_team) 
        AND cm.receiver_id IN (SELECT id FROM care_team))
  ORDER BY cm.created_at DESC
  OFFSET p_offset
  LIMIT p_limit;
END;
$$;

-- Grant execute permissions on the functions
GRANT EXECUTE ON FUNCTION public.get_care_team_messages TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_care_team_messages_count TO authenticated;
