
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle2, RefreshCw, LogOut, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface PaymentSuccessMessageProps {
  onRefresh?: () => void;
}

export const PaymentSuccessMessage: React.FC<PaymentSuccessMessageProps> = ({ onRefresh }) => {
  const { signOut } = useAuth();
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Wait a bit to show loading state
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (onRefresh) {
        onRefresh();
      } else {
        window.location.reload();
      }
    } catch (error) {
      console.error('Error refreshing:', error);
      toast({
        title: "Refresh Error",
        description: "Please try again in a moment",
        variant: "destructive"
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Signed Out",
        description: "You can sign back in later when your account is ready",
      });
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>
        <CardTitle className="text-xl text-green-600">Payment Successful!</CardTitle>
        <CardDescription>
          Thank you for completing your registration payment
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Account Setup in Progress</p>
              <p>
                Your care team is being assigned and your account is being set up automatically. 
                This usually takes just a few minutes.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="text-sm text-gray-600 text-center">
            <p>You can either:</p>
          </div>
          
          <Button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Checking Status...' : 'Refresh & Check Status'}
          </Button>
          
          <Button
            onClick={handleSignOut}
            variant="outline"
            className="w-full"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out & Return Later
          </Button>
        </div>

        <div className="text-xs text-gray-500 text-center mt-4">
          <p>
            If you choose to sign out, you can log back in anytime. 
            Your account will be ready shortly.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
