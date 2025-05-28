
-- Drop existing functions that might conflict
DROP FUNCTION IF EXISTS public.update_registration_task_status(uuid,task_status,jsonb,jsonb);
DROP FUNCTION IF EXISTS public.get_next_pending_registration_task();
DROP FUNCTION IF EXISTS public.complete_patient_registration(uuid,text,text,text);
DROP FUNCTION IF EXISTS public.get_user_registration_status_safe(uuid);

-- Create function to get the next pending registration task
CREATE OR REPLACE FUNCTION public.get_next_pending_registration_task()
 RETURNS TABLE(
   task_id uuid,
   user_id uuid,
   task_type text,
   retry_count integer,
   created_at timestamp with time zone
 )
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    rt.id as task_id,
    rt.user_id,
    rt.task_type,
    rt.retry_count,
    rt.created_at
  FROM registration_tasks rt
  WHERE rt.status = 'pending'
    AND rt.next_retry_at <= NOW()
  ORDER BY rt.priority DESC, rt.created_at ASC
  LIMIT 1;
END;
$function$;

-- Create function to update registration task status
CREATE OR REPLACE FUNCTION public.update_registration_task_status(
  p_task_id uuid,
  p_status task_status,
  p_result_payload jsonb DEFAULT NULL,
  p_error_details jsonb DEFAULT NULL
)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE registration_tasks
  SET 
    status = p_status,
    result_payload = COALESCE(p_result_payload, result_payload),
    error_details = COALESCE(p_error_details, error_details),
    updated_at = NOW(),
    retry_count = CASE 
      WHEN p_status = 'failed' THEN retry_count + 1
      ELSE retry_count
    END,
    next_retry_at = CASE 
      WHEN p_status = 'failed' THEN NOW() + INTERVAL '5 minutes' * (retry_count + 1)
      ELSE next_retry_at
    END
  WHERE id = p_task_id;
  
  RETURN FOUND;
END;
$function$;

-- Create function to complete patient registration and queue tasks
CREATE OR REPLACE FUNCTION public.complete_patient_registration(
  p_user_id uuid,
  p_payment_id text,
  p_razorpay_order_id text,
  p_razorpay_payment_id text
)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_tasks_created integer := 0;
  v_task_ids uuid[] := ARRAY[]::uuid[];
  v_task_id uuid;
BEGIN
  -- Update user registration status
  UPDATE profiles
  SET 
    registration_status = 'payment_complete',
    registration_completed_at = NOW(),
    updated_at = NOW()
  WHERE id = p_user_id;
  
  -- Clear any existing pending tasks for this user
  DELETE FROM registration_tasks 
  WHERE user_id = p_user_id AND status = 'pending';
  
  -- Create assign care team task
  INSERT INTO registration_tasks (user_id, task_type, priority, status)
  VALUES (p_user_id, 'assign_care_team', 1, 'pending')
  RETURNING id INTO v_task_id;
  
  v_task_ids := array_append(v_task_ids, v_task_id);
  v_tasks_created := v_tasks_created + 1;
  
  -- Create chat room task
  INSERT INTO registration_tasks (user_id, task_type, priority, status)
  VALUES (p_user_id, 'create_chat_room', 2, 'pending')
  RETURNING id INTO v_task_id;
  
  v_task_ids := array_append(v_task_ids, v_task_id);
  v_tasks_created := v_tasks_created + 1;
  
  -- Create welcome notification task
  INSERT INTO registration_tasks (user_id, task_type, priority, status)
  VALUES (p_user_id, 'send_welcome_notification', 3, 'pending')
  RETURNING id INTO v_task_id;
  
  v_task_ids := array_append(v_task_ids, v_task_id);
  v_tasks_created := v_tasks_created + 1;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Registration completed and tasks queued',
    'tasks_created', v_tasks_created,
    'task_ids', v_task_ids,
    'payment_id', p_payment_id
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'detail', SQLSTATE
  );
END;
$function$;

-- Create function to safely get user registration status
CREATE OR REPLACE FUNCTION public.get_user_registration_status_safe(p_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_profile profiles%ROWTYPE;
  v_tasks jsonb;
BEGIN
  -- Get profile information
  SELECT * INTO v_profile
  FROM profiles
  WHERE id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'error', 'User not found'
    );
  END IF;
  
  -- Get tasks information
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', id,
      'task_type', task_type,
      'status', status,
      'retry_count', retry_count,
      'created_at', created_at,
      'updated_at', updated_at
    )
  ) INTO v_tasks
  FROM registration_tasks
  WHERE user_id = p_user_id;
  
  RETURN jsonb_build_object(
    'registration_status', v_profile.registration_status,
    'registration_completed_at', v_profile.registration_completed_at,
    'tasks', COALESCE(v_tasks, '[]'::jsonb)
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'error', SQLERRM,
    'detail', SQLSTATE
  );
END;
$function$;
