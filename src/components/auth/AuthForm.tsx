
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';
import { PatientData, useRegistrationAuth } from '@/hooks/useRegistrationAuth';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface AuthFormProps {
  type: 'login' | 'register';
  onSubmit: (
    email: string,
    password: string,
    userType?: string,
    firstName?: string,
    lastName?: string,
    patientData?: PatientData
  ) => Promise<void>;
  error: string | null;
  loading: boolean;
}

export const AuthForm: React.FC<AuthFormProps> = ({ type, onSubmit, error, loading }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [userType, setUserType] = useState('patient');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [patientData, setPatientData] = useState<PatientData>({});
  
  const { handleRegistration, registrationStep } = useRegistrationAuth();

  const validateEmail = (email: string) => {
    return email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  };

  const validatePassword = (password: string) => {
    return password.length >= 6;
  };

  const validateName = (name: string) => {
    return name.length >= 2;
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (type === 'login') {
      // Handle login
      try {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) {
          throw error;
        }
      } catch (err: any) {
        console.error('Login error:', err);
        await onSubmit(email, password);
      }
    } else {
      // Handle registration
      if (password !== confirmPassword) {
        alert('Passwords do not match');
        return;
      }

      if (userType === 'patient') {
        setIsDialogOpen(true);
      } else {
        await onSubmit(email, password, userType, firstName, lastName);
      }
    }
  };

  const handlePatientRegistration = async () => {
    setIsDialogOpen(false);
    await onSubmit(email, password, userType, firstName, lastName, patientData);
  };

  // Show registration progress if loading and we have a registration step
  if (loading && registrationStep) {
    return (
      <div className="w-full max-w-md mx-auto">
        <Card className="shadow-lg shadow-purple-200/20">
          <CardContent className="flex flex-col items-center justify-center p-8 space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Creating Your Account</h3>
              <p className="text-sm text-gray-600">{registrationStep}</p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
                <div className="bg-purple-600 h-2 rounded-full animate-pulse" style={{ width: '75%' }}></div>
              </div>
              <p className="text-xs text-gray-500 mt-2">Please wait while we set up your account...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <Card className="shadow-lg shadow-purple-200/20">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center text-gray-900">
            {type === 'login' ? 'Sign In' : 'Create Account'}
          </CardTitle>
          <CardDescription className="text-center text-gray-600">
            {type === 'login' 
              ? 'Sign in to your account to continue' 
              : 'Join our platform and start your health journey'
            }
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleFormSubmit} className="space-y-4">
            {type === 'register' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="userType">Account Type</Label>
                  <Select value={userType} onValueChange={setUserType}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select account type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="patient">Patient</SelectItem>
                      <SelectItem value="doctor">Doctor</SelectItem>
                      <SelectItem value="nutritionist">Nutritionist</SelectItem>
                      <SelectItem value="administrator">Administrator</SelectItem>
                      <SelectItem value="reception">Reception</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full"
              />
            </div>

            {type === 'register' && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full"
                />
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-purple-600 hover:bg-purple-700"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {type === 'login' ? 'Signing In...' : 'Creating Account...'}
                </>
              ) : (
                type === 'login' ? 'Sign In' : 'Create Account'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Patient Information Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Patient Information</DialogTitle>
            <DialogDescription>
              Please provide some additional information to help us serve you better.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select 
                  value={patientData.gender || ''} 
                  onValueChange={(value) => setPatientData({...patientData, gender: value})}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                    <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  min="1"
                  max="120"
                  value={patientData.age || ''}
                  onChange={(e) => setPatientData({...patientData, age: e.target.value})}
                  className="w-full"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bloodGroup">Blood Group</Label>
                <Select 
                  value={patientData.bloodGroup || ''} 
                  onValueChange={(value) => setPatientData({...patientData, bloodGroup: value})}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select blood group" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A+">A+</SelectItem>
                    <SelectItem value="A-">A-</SelectItem>
                    <SelectItem value="B+">B+</SelectItem>
                    <SelectItem value="B-">B-</SelectItem>
                    <SelectItem value="AB+">AB+</SelectItem>
                    <SelectItem value="AB-">AB-</SelectItem>
                    <SelectItem value="O+">O+</SelectItem>
                    <SelectItem value="O-">O-</SelectItem>
                    <SelectItem value="unknown">Unknown</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="height">Height (cm)</Label>
                <Input
                  id="height"
                  type="number"
                  min="50"
                  max="250"
                  value={patientData.height || ''}
                  onChange={(e) => setPatientData({...patientData, height: e.target.value})}
                  className="w-full"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="emergencyContact">Emergency Contact</Label>
                <Input
                  id="emergencyContact"
                  type="tel"
                  value={patientData.emergencyContact || ''}
                  onChange={(e) => setPatientData({...patientData, emergencyContact: e.target.value})}
                  className="w-full"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="foodHabit">Food Habit</Label>
                <Select 
                  value={patientData.foodHabit || ''} 
                  onValueChange={(value) => setPatientData({...patientData, foodHabit: value})}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select food habit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vegetarian">Vegetarian</SelectItem>
                    <SelectItem value="non_vegetarian">Non-Vegetarian</SelectItem>
                    <SelectItem value="vegan">Vegan</SelectItem>
                    <SelectItem value="pescatarian">Pescatarian</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="knownAllergies">Known Allergies</Label>
              <Input
                id="knownAllergies"
                type="text"
                value={patientData.knownAllergies || ''}
                onChange={(e) => setPatientData({...patientData, knownAllergies: e.target.value})}
                className="w-full"
                placeholder="e.g., Peanuts, Penicillin, etc."
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="currentMedicalConditions">Current Medical Conditions</Label>
              <Input
                id="currentMedicalConditions"
                type="text"
                value={patientData.currentMedicalConditions || ''}
                onChange={(e) => setPatientData({...patientData, currentMedicalConditions: e.target.value})}
                className="w-full"
                placeholder="e.g., Diabetes, Hypertension, etc."
              />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handlePatientRegistration}
                className="flex-1 bg-purple-600 hover:bg-purple-700"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  'Complete Registration'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
