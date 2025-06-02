
-- Diagnostic function to analyze registration state and identify issues
CREATE OR REPLACE FUNCTION public.diagnose_registration_state(p_user_id UUID)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  diagnostic_result JSONB;
  profile_data RECORD;
  task_data RECORD[];
  assignment_data RECORD;
  chat_room_data RECORD;
  payment_data RECORD[];
  system_log_data RECORD[];
BEGIN
  -- Get user profile and registration status
  SELECT 
    id,
    first_name,
    last_name,
    phone,
    registration_status,
    registration_completed_at,
    created_at,
    updated_at
  INTO profile_data
  FROM profiles 
  WHERE id = p_user_id;
  
  -- Get all registration tasks for this user
  SELECT array_agg(
    ROW(
      id,
      task_type,
      status,
      priority,
      retry_count,
      created_at,
      updated_at,
      next_retry_at,
      error_details,
      result_payload
    )::TEXT
  ) INTO task_data
  FROM registration_tasks
  WHERE user_id = p_user_id
  ORDER BY created_at;
  
  -- Get patient assignments (care team)
  SELECT 
    id,
    patient_id,
    doctor_id,
    nutritionist_id,
    created_at,
    updated_at
  INTO assignment_data
  FROM patient_assignments
  WHERE patient_id = p_user_id;
  
  -- Get chat room assignments
  SELECT 
    cr.id as room_id,
    cr.name,
    cr.room_type,
    cr.patient_id,
    cr.is_active,
    cr.created_at,
    COUNT(rm.user_id) as member_count
  INTO chat_room_data
  FROM chat_rooms cr
  LEFT JOIN room_members rm ON cr.id = rm.room_id
  WHERE cr.patient_id = p_user_id
  GROUP BY cr.id, cr.name, cr.room_type, cr.patient_id, cr.is_active, cr.created_at;
  
  -- Get payment/invoice data
  SELECT array_agg(
    ROW(
      id,
      amount,
      status,
      razorpay_order_id,
      razorpay_payment_id,
      created_at,
      description
    )::TEXT
  ) INTO payment_data
  FROM patient_invoices
  WHERE patient_id = p_user_id
  ORDER BY created_at DESC;
  
  -- Get relevant system logs
  SELECT array_agg(
    ROW(
      id,
      action,
      level,
      message,
      details,
      metadata,
      created_at
    )::TEXT
  ) INTO system_log_data
  FROM system_logs
  WHERE user_id = p_user_id
    AND action LIKE '%registration%'
  ORDER BY created_at DESC
  LIMIT 20;
  
  -- Build comprehensive diagnostic result
  diagnostic_result := jsonb_build_object(
    'user_id', p_user_id,
    'timestamp', NOW(),
    'profile', jsonb_build_object(
      'exists', profile_data.id IS NOT NULL,
      'registration_status', profile_data.registration_status,
      'registration_completed_at', profile_data.registration_completed_at,
      'profile_created_at', profile_data.created_at,
      'profile_updated_at', profile_data.updated_at,
      'name', COALESCE(profile_data.first_name, '') || ' ' || COALESCE(profile_data.last_name, ''),
      'phone', profile_data.phone
    ),
    'tasks', jsonb_build_object(
      'total_count', COALESCE(array_length(task_data, 1), 0),
      'tasks', COALESCE(to_jsonb(task_data), '[]'::jsonb)
    ),
    'care_team_assignment', jsonb_build_object(
      'exists', assignment_data.id IS NOT NULL,
      'doctor_assigned', assignment_data.doctor_id IS NOT NULL,
      'nutritionist_assigned', assignment_data.nutritionist_id IS NOT NULL,
      'assignment_created_at', assignment_data.created_at,
      'assignment_id', assignment_data.id
    ),
    'chat_room', jsonb_build_object(
      'exists', chat_room_data.room_id IS NOT NULL,
      'room_id', chat_room_data.room_id,
      'room_name', chat_room_data.name,
      'room_type', chat_room_data.room_type,
      'is_active', chat_room_data.is_active,
      'member_count', COALESCE(chat_room_data.member_count, 0),
      'room_created_at', chat_room_data.created_at
    ),
    'payments', jsonb_build_object(
      'total_invoices', COALESCE(array_length(payment_data, 1), 0),
      'payment_history', COALESCE(to_jsonb(payment_data), '[]'::jsonb)
    ),
    'system_logs', jsonb_build_object(
      'recent_log_count', COALESCE(array_length(system_log_data, 1), 0),
      'logs', COALESCE(to_jsonb(system_log_data), '[]'::jsonb)
    ),
    'analysis', jsonb_build_object(
      'registration_flow_complete', (
        profile_data.registration_status = 'fully_registered' AND
        assignment_data.doctor_id IS NOT NULL AND
        chat_room_data.room_id IS NOT NULL
      ),
      'stuck_in_payment_pending', profile_data.registration_status = 'payment_pending',
      'has_failed_tasks', EXISTS(
        SELECT 1 FROM registration_tasks 
        WHERE user_id = p_user_id AND status = 'failed'
      ),
      'has_pending_tasks', EXISTS(
        SELECT 1 FROM registration_tasks 
        WHERE user_id = p_user_id AND status = 'pending'
      ),
      'task_processing_issues', EXISTS(
        SELECT 1 FROM registration_tasks 
        WHERE user_id = p_user_id AND retry_count > 3
      )
    )
  );
  
  RETURN diagnostic_result;
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'error', true,
    'error_message', SQLERRM,
    'error_code', SQLSTATE,
    'user_id', p_user_id,
    'timestamp', NOW()
  );
END;
$$;

-- Grant execution to authenticated users
GRANT EXECUTE ON FUNCTION public.diagnose_registration_state TO authenticated;

-- Also create a function to get task processing status across all users
CREATE OR REPLACE FUNCTION public.get_registration_task_summary()
RETURNS TABLE(
  status TEXT,
  task_type TEXT,
  count BIGINT,
  avg_retry_count NUMERIC,
  oldest_pending TIMESTAMP WITH TIME ZONE
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    rt.status::TEXT,
    rt.task_type,
    COUNT(*) as count,
    AVG(rt.retry_count) as avg_retry_count,
    MIN(rt.created_at) as oldest_pending
  FROM registration_tasks rt
  GROUP BY rt.status, rt.task_type
  ORDER BY rt.status, rt.task_type;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_registration_task_summary TO authenticated;
