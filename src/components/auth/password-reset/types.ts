
export interface OtpVerificationResult {
  needsEmailConfirmation: boolean;
  sessionToken?: string;
  phoneNotRegistered?: boolean;
  phoneNumber?: string;
  email?: string;
}

export interface SupabaseQueryResult<T> {
  data: T | null;
  error: any;
}

export interface ProfileData {
  id: string;
}

export interface FunctionInvokeResult {
  data: any;
  error: any;
}

export type StepType = 'method_selection' | 'phone' | 'email' | 'otp' | 'email_confirmation' | 'password';

export type ResetMethod = 'sms' | 'email';

export interface PasswordResetState {
  step: StepType;
  resetMethod: ResetMethod | null;
  phoneNumber: string;
  email: string;
  otp: string;
  newPassword: string;
  confirmPassword: string;
  loading: boolean;
  error: string | null;
  sessionToken: string | null;
  showEmailConfirmation: boolean;
}

export interface PasswordResetActions {
  handleSendOtp: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
  handleVerifyOtp: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
  handleEmailConfirmation: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
  handleUpdatePassword: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
  handleResendOtp: () => Promise<void>;
  handleMethodSelection: (method: ResetMethod) => void;
}
