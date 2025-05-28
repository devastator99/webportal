
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { verifyRegistrationData, findUserByPhone } from "@/utils/registrationVerification";
import { sendSmsOtp } from "@/components/auth/password-reset/services/passwordResetService";

export const RegistrationDataVerifier: React.FC = () => {
  const [email, setEmail] = useState("mihir.chandra@gmail.com");
  const [phoneNumber, setPhoneNumber] = useState("9958745213");
  const [results, setResults] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handleVerifyRegistration = async () => {
    setLoading(true);
    setResults("Verifying registration data...\n");
    
    try {
      const result = await verifyRegistrationData(email);
      setResults(prev => prev + "\n" + JSON.stringify(result, null, 2));
    } catch (error: any) {
      setResults(prev => prev + "\nError: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTestPhoneLookup = async () => {
    setLoading(true);
    setResults("Testing phone number lookup...\n");
    
    try {
      const result = await findUserByPhone(phoneNumber);
      setResults(prev => prev + "\n" + JSON.stringify(result, null, 2));
    } catch (error: any) {
      setResults(prev => prev + "\nError: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTestSmsOtp = async () => {
    setLoading(true);
    setResults("Testing SMS OTP send...\n");
    
    try {
      const result = await sendSmsOtp(phoneNumber);
      setResults(prev => prev + "\n" + JSON.stringify(result, null, 2));
    } catch (error: any) {
      setResults(prev => prev + "\nError: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const clearResults = () => {
    setResults("");
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Registration Data Verification Tool</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="email">Email to verify</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
              />
            </div>
            
            <div>
              <Label htmlFor="phone">Phone number to test</Label>
              <Input
                id="phone"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="9958745213"
              />
            </div>
            
            <div className="space-y-2">
              <Button 
                onClick={handleVerifyRegistration} 
                disabled={loading || !email}
                className="w-full"
              >
                Verify Registration Data
              </Button>
              
              <Button 
                onClick={handleTestPhoneLookup} 
                disabled={loading || !phoneNumber}
                variant="outline"
                className="w-full"
              >
                Test Phone Lookup
              </Button>
              
              <Button 
                onClick={handleTestSmsOtp} 
                disabled={loading || !phoneNumber}
                variant="secondary"
                className="w-full"
              >
                Test SMS OTP Send
              </Button>
              
              <Button 
                onClick={clearResults} 
                variant="ghost"
                className="w-full"
              >
                Clear Results
              </Button>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="results">Test Results</Label>
            <Textarea
              id="results"
              value={results}
              readOnly
              className="min-h-[400px] font-mono text-sm"
              placeholder="Test results will appear here..."
            />
          </div>
        </div>
        
        <div className="text-sm text-muted-foreground space-y-2">
          <p><strong>Instructions:</strong></p>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>Verify Registration Data:</strong> Checks if user data from registration is properly stored in profiles, user_roles, patient_details, and registration_tasks tables.</li>
            <li><strong>Test Phone Lookup:</strong> Verifies if the phone number can be found in the profiles table (required for SMS password reset).</li>
            <li><strong>Test SMS OTP Send:</strong> Tests the complete SMS password reset flow including user lookup and OTP sending.</li>
          </ul>
          <p className="text-yellow-600"><strong>Note:</strong> SMS OTP sending will only work if Twilio credentials are configured in the edge function secrets.</p>
        </div>
      </CardContent>
    </Card>
  );
};
