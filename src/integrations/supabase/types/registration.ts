
export interface UserRegistrationStatus {
  user_id: string;
  registration_status: 'payment_pending' | 'payment_complete' | 'care_team_assigned' | 'fully_registered';
  tasks: RegistrationTask[];
  payment_status?: string;
  care_team_assigned?: boolean;
  chat_room_created?: boolean;
  welcome_notification_sent?: boolean;
}

export interface RegistrationTask {
  id: string;
  user_id: string;
  task_type: string;
  status: string;
  retry_count: number;
  priority: number;
  next_retry_at: string;
  error_details?: any;
  result_payload?: any;
}

export type RegistrationStatusValues = {
  PAYMENT_PENDING: 'payment_pending';
  PAYMENT_COMPLETE: 'payment_complete';
  CARE_TEAM_ASSIGNED: 'care_team_assigned';
  FULLY_REGISTERED: 'fully_registered';
};

export const RegistrationStatusValues: RegistrationStatusValues = {
  PAYMENT_PENDING: 'payment_pending',
  PAYMENT_COMPLETE: 'payment_complete',
  CARE_TEAM_ASSIGNED: 'care_team_assigned',
  FULLY_REGISTERED: 'fully_registered',
};
