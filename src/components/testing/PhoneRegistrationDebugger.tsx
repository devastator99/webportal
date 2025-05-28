
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { findUserByPhone, checkRegistrationByEmail } from '@/utils/registrationVerification';

export const PhoneRegistrationDebugger: React.FC = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [results, setResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handlePhoneCheck = async () => {
    if (!phoneNumber.trim()) return;
    
    setIsLoading(true);
    setResults(null);
    
    try {
      const result = await findUserByPhone(phoneNumber);
      console.log("Phone check result:", result);
      setResults({ type: 'phone', data: result });
    } catch (error) {
      console.error("Error checking phone:", error);
      setResults({ type: 'phone', data: { success: false, error: 'Check failed' } });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailCheck = async () => {
    if (!email.trim()) return;
    
    setIsLoading(true);
    setResults(null);
    
    try {
      const result = await checkRegistrationByEmail(email);
      console.log("Email check result:", result);
      setResults({ type: 'email', data: result });
    } catch (error) {
      console.error("Error checking email:", error);
      setResults({ type: 'email', data: { success: false, error: 'Check failed' } });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Registration Status Debugger</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label>Check by Phone Number:</label>
          <div className="flex gap-2">
            <Input
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="Enter phone number (e.g., 9686999433 or +919686999433)"
            />
            <Button onClick={handlePhoneCheck} disabled={isLoading}>
              Check Phone
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <label>Check by Email:</label>
          <div className="flex gap-2">
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email (e.g., mihir.chandra@gmail.com)"
            />
            <Button onClick={handleEmailCheck} disabled={isLoading}>
              Check Email
            </Button>
          </div>
        </div>

        {results && (
          <Alert>
            <AlertDescription>
              <div className="space-y-2">
                <div><strong>Check Type:</strong> {results.type}</div>
                <div><strong>Success:</strong> {results.data.success ? 'Yes' : 'No'}</div>
                
                {results.data.success ? (
                  <div className="space-y-1">
                    {results.data.user && (
                      <div><strong>User Found:</strong> {results.data.user.first_name} {results.data.user.last_name}</div>
                    )}
                    {results.data.profile && (
                      <div><strong>Profile:</strong> {results.data.profile.first_name} {results.data.profile.last_name}</div>
                    )}
                    {results.data.phone_number && (
                      <div><strong>Phone:</strong> {results.data.phone_number}</div>
                    )}
                    {results.data.role && (
                      <div><strong>Role:</strong> {results.data.role}</div>
                    )}
                    {results.data.registration_status && (
                      <div><strong>Registration Status:</strong> {results.data.registration_status.registration_status}</div>
                    )}
                    {results.data.phone_variants_checked && (
                      <div><strong>Phone Variants Checked:</strong> {results.data.phone_variants_checked.join(', ')}</div>
                    )}
                  </div>
                ) : (
                  <div>
                    <div><strong>Error:</strong> {results.data.error}</div>
                    {results.data.phone_variants_checked && (
                      <div><strong>Phone Variants Checked:</strong> {results.data.phone_variants_checked.join(', ')}</div>
                    )}
                  </div>
                )}
                
                {/* Show all phone numbers in database for debugging */}
                {results.data.all_database_phones && results.data.all_database_phones.length > 0 && (
                  <div className="mt-4 p-3 bg-gray-50 rounded">
                    <div><strong>All Phone Numbers in Database:</strong></div>
                    <div className="text-sm space-y-1 mt-2">
                      {results.data.all_database_phones.map((item: any, index: number) => (
                        <div key={index}>
                          {item.name}: <code className="bg-gray-200 px-1 rounded">{item.phone}</code>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};
