
export interface RegistrationProgress {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  payment_status: string;
  care_team_assigned: boolean;
  chat_room_created: boolean;
  welcome_notification_sent: boolean;
  chatroom_notification_sent: boolean;
  registration_completed: boolean;
  created_at: string;
  updated_at: string;
  registration_status?: RegistrationStatus;
}

export type RegistrationStatus = 'payment_pending' | 'payment_complete' | 'care_team_assigned' | 'fully_registered';

// Adding an enum for type-safe comparisons
export enum RegistrationStatus {
  PAYMENT_PENDING = 'payment_pending',
  PAYMENT_COMPLETE = 'payment_complete',
  CARE_TEAM_ASSIGNED = 'care_team_assigned',
  FULLY_REGISTERED = 'fully_registered'
}

export interface DefaultCareTeam {
  id: string;
  default_doctor_id: string;
  default_nutritionist_id: string | null;
  is_active: boolean;
  created_at: string;
}

export interface RegistrationTask {
  id: string;
  user_id: string;
  task_type: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  priority: number;
  retry_count: number;
  created_at: string;
  updated_at: string;
  next_retry_at: string;
  result_payload?: any;
  error_details?: any;
}

export interface UserRegistrationStatus {
  registration_status: RegistrationStatus;
  registration_completed_at: string | null;
  tasks: RegistrationTask[];
}
