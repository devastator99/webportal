
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Phone } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export const UserPhoneChecker = () => {
  const [result, setResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkPhone = async () => {
      try {
        console.log("Checking phone number for mihir.chandra@gmail.com");
        
        // Get user ID by email
        const { data: userId, error: userIdError } = await supabase.rpc('get_user_id_by_email', {
          user_email: 'mihir.chandra@gmail.com'
        });

        if (userIdError || !userId) {
          setResult(`User not found: ${userIdError?.message || 'No user with this email'}`);
          return;
        }

        // Get profile data including phone
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('phone, first_name, last_name')
          .eq('id', userId)
          .single();

        if (profileError || !profile) {
          setResult(`Profile not found: ${profileError?.message || 'No profile data'}`);
          return;
        }

        setResult(`Phone number used for WhatsApp: ${profile.phone || 'No phone number stored'}`);
        
      } catch (error: any) {
        setResult(`Error: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    checkPhone();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Phone className="h-5 w-5" />
          WhatsApp Phone Number Check
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Alert>
          <Phone className="h-4 w-4" />
          <AlertDescription>
            <strong>Email:</strong> mihir.chandra@gmail.com<br/>
            <strong>Result:</strong> {isLoading ? 'Checking...' : result}
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};
