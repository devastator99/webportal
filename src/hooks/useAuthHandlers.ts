
import { usePasswordAuth } from './usePasswordAuth';
import { useSignUp, PatientData } from './useSignUp';
import { useLogin } from './useLogin';

export type { PatientData };

export const useAuthHandlers = () => {
  const { loading: passwordLoading, error: passwordError, handleUpdatePassword, handleResetPassword, setError: setPasswordError } = usePasswordAuth();
  const { loading: signUpLoading, error: signUpError, handleSignUp, setError: setSignUpError } = useSignUp();
  const { loading: loginLoading, error: loginError, handleLogin, handleTestLogin, setError: setLoginError } = useLogin();

  return {
    loading: passwordLoading || signUpLoading || loginLoading,
    error: passwordError || signUpError || loginError,
    handleLogin,
    handleSignUp,
    handleResetPassword,
    handleUpdatePassword,
    handleTestLogin,
    setError: (error: string | null) => {
      setPasswordError(error);
      setSignUpError(error);
      setLoginError(error);
    },
  };
};
