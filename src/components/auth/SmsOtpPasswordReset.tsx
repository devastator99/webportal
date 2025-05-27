
import { ScrollArea } from '../ui/scroll-area';
import { PhoneNumberStep } from './password-reset/PhoneNumberStep';
import { OtpVerificationStep } from './password-reset/OtpVerificationStep';
import { PasswordUpdateStep } from './password-reset/PasswordUpdateStep';
import { usePasswordReset } from './password-reset/usePasswordReset';

interface SmsOtpPasswordResetProps {
  open: boolean;
  onClose: () => void;
  onSwitchToEmail?: () => void;
}

const SmsOtpPasswordReset = ({ open, onClose, onSwitchToEmail }: SmsOtpPasswordResetProps) => {
  const {
    step,
    phoneNumber,
    setPhoneNumber,
    otp,
    setOtp,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    loading,
    error,
    handleSendOtp,
    handleVerifyOtp,
    handleUpdatePassword,
    resetFlow,
    handleResendOtp
  } = usePasswordReset(onClose);

  return (
    <ScrollArea className="max-h-[80vh]" invisibleScrollbar={true}>
      <div className="p-4">
        <h2 className="text-2xl font-bold text-center mb-6">Reset Password via SMS</h2>
        
        {step === 'phone' && (
          <PhoneNumberStep
            phoneNumber={phoneNumber}
            setPhoneNumber={setPhoneNumber}
            onSubmit={handleSendOtp}
            loading={loading}
            error={error}
            onClose={onClose}
          />
        )}

        {step === 'otp' && (
          <OtpVerificationStep
            otp={otp}
            setOtp={setOtp}
            phoneNumber={phoneNumber}
            onSubmit={handleVerifyOtp}
            onResendOtp={handleResendOtp}
            onChangePhone={resetFlow}
            onSwitchToEmail={onSwitchToEmail}
            loading={loading}
            error={error}
          />
        )}

        {step === 'password' && (
          <PasswordUpdateStep
            newPassword={newPassword}
            setNewPassword={setNewPassword}
            confirmPassword={confirmPassword}
            setConfirmPassword={setConfirmPassword}
            onSubmit={handleUpdatePassword}
            onClose={onClose}
            loading={loading}
            error={error}
          />
        )}
      </div>
    </ScrollArea>
  );
};

export default SmsOtpPasswordReset;
