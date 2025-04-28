import { useNavigate } from 'react-router-dom';
import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm';

// Add this wrapper component
export const ForgotPasswordRouteWrapper = () => {
  const navigate = useNavigate();
  return <ForgotPasswordForm open={true} onClose={() => navigate(-1)} />;
};