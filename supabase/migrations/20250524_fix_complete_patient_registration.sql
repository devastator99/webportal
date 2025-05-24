
-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS public.complete_patient_registration;

-- Recreate the function with the correct column references
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
