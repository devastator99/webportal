
-- Create the missing get_user_registration_status_safe function
CREATE OR REPLACE FUNCTION public.get_user_registration_status_safe(p_user_id uuid)
RETURNS TABLE(
  registration_status text,
  tasks jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Return registration status and tasks for the user
  RETURN QUERY
  WITH user_status AS (
    SELECT 
      COALESCE(p.registration_status::text, 'payment_pending') as reg_status
    FROM profiles p
    WHERE p.id = p_user_id
  ),
  user_tasks AS (
    SELECT 
      jsonb_agg(
        jsonb_build_object(
          'id', rt.id,
          'task_type', rt.task_type,
          'status', rt.status::text,
          'created_at', rt.created_at,
          'updated_at', rt.updated_at
        )
      ) as tasks_json
    FROM registration_tasks rt
    WHERE rt.user_id = p_user_id
  )
  SELECT 
    us.reg_status as registration_status,
    COALESCE(ut.tasks_json, '[]'::jsonb) as tasks
  FROM user_status us
  CROSS JOIN user_tasks ut;
END;
$function$;

-- Fix the complete_patient_registration function by removing updated_at reference
CREATE OR REPLACE FUNCTION public.complete_patient_registration(
  p_user_id UUID,
  p_payment_id TEXT,
  p_razorpay_order_id TEXT,
  p_razorpay_payment_id TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_patient_role TEXT;
  v_default_doctor_id UUID;
  v_default_nutritionist_id UUID;
  v_invoice_id UUID;
  v_task_ids UUID[];
BEGIN
  -- Check if user exists and is a patient
  SELECT role INTO v_patient_role
  FROM user_roles
  WHERE user_id = p_user_id;
  
  IF v_patient_role IS NULL OR v_patient_role <> 'patient' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User is not a valid patient'
    );
  END IF;
  
  -- Get active default care team
  SELECT default_doctor_id, default_nutritionist_id
  INTO v_default_doctor_id, v_default_nutritionist_id
  FROM public.get_active_default_care_team();
  
  IF v_default_doctor_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'No default care team is configured'
    );
  END IF;
  
  -- Update invoice status to paid if exists
  UPDATE patient_invoices
  SET 
    status = 'paid',
    payment_id = p_payment_id,
    razorpay_payment_id = p_razorpay_payment_id,
    updated_at = now()
  WHERE 
    razorpay_order_id = p_razorpay_order_id
    AND patient_id = p_user_id
  RETURNING id INTO v_invoice_id;
  
  -- Update patient profile registration status (removed updated_at reference)
  UPDATE profiles
  SET registration_status = 'payment_complete'
  WHERE id = p_user_id;
  
  -- Create registration tasks
  SELECT array_agg(id) INTO v_task_ids FROM (
    SELECT public.create_registration_tasks(
      p_user_id,
      jsonb_build_array(
        jsonb_build_object(
          'task_type', 'assign_care_team',
          'priority', 3
        ),
        jsonb_build_object(
          'task_type', 'create_chat_room',
          'priority', 2
        ),
        jsonb_build_object(
          'task_type', 'send_welcome_notification',
          'priority', 1
        )
      )
    ) AS id
  ) AS tasks;
  
  RETURN jsonb_build_object(
    'success', true,
    'invoice_id', v_invoice_id,
    'tasks', v_task_ids,
    'message', 'Payment processed successfully. Registration tasks have been queued.'
  );
END;
$function$;

-- Also ensure the create_registration_tasks function exists
CREATE OR REPLACE FUNCTION public.create_registration_tasks(
  p_user_id UUID,
  p_tasks JSONB
) RETURNS UUID[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_task JSONB;
  v_task_ids UUID[] := '{}';
  v_task_id UUID;
BEGIN
  -- Loop through each task in the array
  FOR v_task IN SELECT * FROM jsonb_array_elements(p_tasks)
  LOOP
    INSERT INTO registration_tasks(
      user_id,
      task_type,
      priority,
      status
    ) VALUES (
      p_user_id,
      v_task->>'task_type',
      COALESCE((v_task->>'priority')::integer, 1),
      'pending'::task_status
    ) RETURNING id INTO v_task_id;
    
    v_task_ids := array_append(v_task_ids, v_task_id);
  END LOOP;
  
  RETURN v_task_ids;
END;
$function$;

-- Ensure get_active_default_care_team function exists
CREATE OR REPLACE FUNCTION public.get_active_default_care_team()
RETURNS TABLE(
  default_doctor_id UUID,
  default_nutritionist_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    dct.default_doctor_id,
    dct.default_nutritionist_id
  FROM default_care_teams dct
  WHERE dct.is_active = true
  LIMIT 1;
END;
$function$;
