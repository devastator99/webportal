
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { SupabaseAuthUI } from '@/components/auth/SupabaseAuthUI';

export const UpdatePasswordForm = () => {
  const [useCustomForm, setUseCustomForm] = useState(false);
  const navigate = useNavigate();
  
  if (!useCustomForm) {
    return (
      <div className="space-y-4">
        <SupabaseAuthUI 
          view="update_password" 
          onSuccess={() => navigate('/auth')}
        />
        
        <div className="text-center mt-4">
          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={() => navigate("/auth")}
          >
            Back to Login
          </Button>
        </div>
      </div>
    );
  }
  
  // Fallback to original implementation if needed
  return (
    <div className="space-y-4">
      <p className="text-center text-red-500">
        The custom password update form is currently unavailable. 
        Please use the Supabase Auth UI.
      </p>
      
      <Button
        className="w-full"
        onClick={() => setUseCustomForm(false)}
      >
        Return to Password Reset
      </Button>
      
      <Button
        type="button"
        variant="ghost"
        className="w-full"
        onClick={() => navigate("/auth")}
      >
        Back to Login
      </Button>
    </div>
  );
};
