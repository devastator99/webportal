
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle, 
  ArrowRight, 
  LogOut, 
  Loader2,
  Mail,
  MessageSquare
} from 'lucide-react';

interface RegistrationSuccessProps {
  userType?: string | null;
  onComplete?: () => void;
}

export const RegistrationSuccess: React.FC<RegistrationSuccessProps> = ({
  userType,
  onComplete
}) => {
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleComplete = async () => {
    if (isSigningOut) return;
    
    try {
      setIsSigningOut(true);
      if (onComplete) {
        await onComplete();
      }
    } catch (error) {
      console.error("Error completing registration:", error);
    } finally {
      setIsSigningOut(false);
    }
  };

  const getSuccessMessage = () => {
    if (userType === 'patient') {
      return {
        title: '🎉 Registration Complete!',
        description: 'Your payment has been processed successfully.',
        details: [
          'Your care team is being assigned',
          'You will receive login instructions via email/SMS',
          'Your personalized dashboard will be ready shortly'
        ],
        instruction: 'Please check your email/SMS for login instructions and use your registered credentials to access your dashboard.'
      };
    } else {
      return {
        title: '✅ Account Created Successfully!',
        description: 'Your account has been set up and is ready to use.',
        details: [
          'Your account permissions have been configured',
          'You can now access the dashboard',
          'All features are available based on your role'
        ],
        instruction: 'Please log in with your registered credentials to access your dashboard.'
      };
    }
  };

  const successInfo = getSuccessMessage();

  return (
    <Card className="bg-white shadow-lg border border-gray-100">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <CheckCircle className="h-16 w-16 text-green-600" />
        </div>
        
        <CardTitle className="text-2xl text-green-600">
          {successInfo.title}
        </CardTitle>
        <p className="text-gray-600 mt-2">
          {successInfo.description}
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Success Details */}
        <div className="space-y-3">
          {successInfo.details.map((detail, index) => (
            <div key={index} className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
              <span className="text-green-800 text-sm">{detail}</span>
            </div>
          ))}
        </div>

        {/* Contact Information */}
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
          <div className="flex items-start gap-3">
            {userType === 'patient' ? (
              <MessageSquare className="h-5 w-5 text-blue-600 mt-0.5" />
            ) : (
              <Mail className="h-5 w-5 text-blue-600 mt-0.5" />
            )}
            <div className="flex-1">
              <h3 className="font-semibold text-blue-800 mb-2">Next Steps</h3>
              <p className="text-blue-700 text-sm">
                {successInfo.instruction}
              </p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-4 border-t">
          <Button 
            onClick={handleComplete}
            disabled={isSigningOut}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
          >
            {isSigningOut ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Redirecting...
              </>
            ) : (
              <>
                Continue to Login <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>

        {/* Additional Information */}
        <div className="text-center text-sm text-gray-600">
          <p>
            You will be redirected to the login page to access your account.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
