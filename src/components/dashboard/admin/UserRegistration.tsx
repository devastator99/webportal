import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createUserRole, supabase, ValidUserRole } from "@/integrations/supabase/client";
import { UserPlus, Eye, EyeOff } from "lucide-react";

export const UserRegistration = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState<ValidUserRole>("patient");
  
  // Additional patient data fields
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("male");
  const [bloodGroup, setBloodGroup] = useState("");
  const [allergies, setAllergies] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");

  const validateForm = () => {
    if (!phone || !password || !confirmPassword || !firstName || !lastName) {
      toast({
        title: "Missing fields",
        description: "Please fill all required fields including phone number and password confirmation",
        variant: "destructive",
      });
      return false;
    }
    
    if (password !== confirmPassword) {
      toast({
        title: "Password mismatch",
        description: "Password and confirm password do not match",
        variant: "destructive",
      });
      return false;
    }
    
    if (password.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      });
      return false;
    }
    
    if (role === "patient" && (!age || !gender || !bloodGroup)) {
      toast({
        title: "Missing patient information",
        description: "Please fill all required patient fields (age, gender, blood group)",
        variant: "destructive",
      });
      return false;
    }
    
    return true;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      console.log("Starting user registration process...");
      
      // Use phone as primary identifier
      const primaryIdentifier = email || phone;
      
      console.log("Creating auth user with identifier:", primaryIdentifier);
      
      // Step 1: Create the user in Auth (simplified without enum in metadata)
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: primaryIdentifier,
        password,
        options: {
          data: {
            user_type_string: role, // Use string instead of enum
            first_name: firstName,
            last_name: lastName,
            phone: phone,
            primary_contact: phone
          }
        }
      });

      if (signUpError) {
        console.error("Auth signup error:", signUpError);
        throw new Error(`Registration failed: ${signUpError.message}`);
      }
      
      if (!authData.user) {
        throw new Error("User creation failed - no user returned from authentication");
      }

      console.log("Auth user created successfully:", authData.user.id);

      // Step 2: Create user role using the RPC function with proper type
      try {
        console.log("Creating user role...");
        const roleResult = await createUserRole(authData.user.id, role);
        console.log("User role created successfully:", roleResult);
      } catch (roleError: any) {
        console.error("Error creating user role:", roleError);
        throw new Error(`Failed to assign user role: ${roleError.message}`);
      }
      
      // Step 3: If patient, create patient details
      if (role === "patient") {
        try {
          console.log("Creating patient details...");
          const { data: patientResult, error: patientError } = await supabase.rpc(
            'upsert_patient_details',
            {
              p_user_id: authData.user.id,
              p_age: parseInt(age, 10),
              p_gender: gender,
              p_blood_group: bloodGroup,
              p_allergies: allergies,
              p_emergency_contact: emergencyContact || null,
              p_height: null,
              p_birth_date: null,
              p_food_habit: null,
              p_current_medical_conditions: null
            }
          );
          
          if (patientError) {
            console.error("Error creating patient details:", patientError);
            toast({
              title: "Partial success",
              description: "User created but some patient details could not be saved",
              variant: "default",
            });
          } else if (patientResult && typeof patientResult === 'object' && patientResult.success === false) {
            console.error("Patient details creation failed:", patientResult);
            toast({
              title: "Partial success",
              description: "User created but some patient details could not be saved",
              variant: "default",
            });
          } else {
            console.log("Patient details created successfully");
          }
        } catch (patientError: any) {
          console.error("Exception creating patient details:", patientError);
        }
      }

      // Step 4: Handle registration completion based on role
      if (role === "patient") {
        // For patients, send welcome notification directly (existing flow)
        try {
          console.log(`Sending welcome notification for patient:`, authData.user.id);
          
          const fullName = `${firstName} ${lastName}`.trim();
          const userEmail = email || primaryIdentifier;
          
          const { data: notificationResult, error: notificationError } = await supabase.functions.invoke('send-comprehensive-welcome-notification', {
            body: {
              patient_id: authData.user.id,
              patient_email: userEmail,
              patient_phone: phone,
              patient_name: fullName,
              patient_details: {
                role: role,
                registration_type: 'patient'
              }
            }
          });

          if (notificationError) {
            console.error("Welcome notification error:", notificationError);
            toast({
              title: "Registration Complete",
              description: `Patient account created successfully, but welcome email may not have been sent.`,
              variant: "default",
            });
          } else {
            console.log("Welcome notification sent successfully:", notificationResult);
            toast({
              title: "Registration Complete",
              description: `Patient account created and welcome email sent to ${userEmail}`,
            });
          }
        } catch (notificationError: any) {
          console.error("Exception sending welcome notification:", notificationError);
          toast({
            title: "Registration Complete",
            description: `Patient account created successfully, but welcome email may not have been sent.`,
            variant: "default",
          });
        }
      } else {
        // For doctors and nutritionists, use the new professional registration flow
        try {
          console.log(`Completing professional registration for ${role}:`, authData.user.id);
          
          const { data: professionalResult, error: professionalError } = await supabase.functions.invoke('complete-professional-registration', {
            body: {
              user_id: authData.user.id,
              phone: phone
            }
          });

          if (professionalError) {
            console.error("Professional registration error:", professionalError);
            toast({
              title: "Registration Complete",
              description: `${role.charAt(0).toUpperCase() + role.slice(1)} account created successfully, but notifications may not have been sent.`,
              variant: "default",
            });
          } else if (professionalResult && professionalResult.success) {
            console.log("Professional registration completed successfully:", professionalResult);
            toast({
              title: "Registration Complete",
              description: `${role.charAt(0).toUpperCase() + role.slice(1)} account created and welcome notifications sent.`,
            });
          } else {
            console.error("Professional registration failed:", professionalResult);
            toast({
              title: "Registration Complete",
              description: `${role.charAt(0).toUpperCase() + role.slice(1)} account created, but registration completion failed.`,
              variant: "default",
            });
          }
        } catch (professionalError: any) {
          console.error("Exception during professional registration:", professionalError);
          toast({
            title: "Registration Complete",
            description: `${role.charAt(0).toUpperCase() + role.slice(1)} account created, but notifications may not have been sent.`,
            variant: "default",
          });
        }
      }

      // Reset form
      setEmail("");
      setPhone("");
      setPassword("");
      setConfirmPassword("");
      setFirstName("");
      setLastName("");
      setRole("patient");
      setAge("");
      setGender("male");
      setBloodGroup("");
      setAllergies("");
      setEmergencyContact("");
      
      console.log("Registration completed successfully");
      
    } catch (error: any) {
      console.error("Registration error:", error);
      
      let errorMessage = "An unexpected error occurred during registration";
      
      if (error.message?.includes("email address")) {
        errorMessage = "Invalid email address or email already in use";
      } else if (error.message?.includes("password")) {
        errorMessage = "Password requirements not met";
      } else if (error.message?.includes("phone")) {
        errorMessage = "Invalid phone number format";
      } else if (error.message?.includes("role")) {
        errorMessage = "Failed to assign user role - please contact administrator";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Registration failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Register New User
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input 
                id="firstName" 
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input 
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="phone">
              Phone Number * 
              <span className="text-sm text-gray-500 ml-2">(Used for notifications)</span>
            </Label>
            <Input 
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 234 567 890"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email Address (Optional)</Label>
            <Input 
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@example.com"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Password *</Label>
            <div className="relative">
              <Input 
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password *</Label>
            <div className="relative">
              <Input 
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={confirmPassword && password !== confirmPassword ? "border-red-500" : ""}
                required
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </button>
            </div>
            {confirmPassword && password !== confirmPassword && (
              <p className="text-sm text-red-500">Passwords do not match</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="role">User Role *</Label>
            <Select 
              value={role} 
              onValueChange={(value) => setRole(value as ValidUserRole)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="patient">Patient</SelectItem>
                <SelectItem value="doctor">Doctor</SelectItem>
                <SelectItem value="nutritionist">Nutritionist</SelectItem>
                <SelectItem value="administrator">Administrator</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {role === "patient" && (
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="health">Health Info</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="age">Age *</Label>
                    <Input 
                      id="age"
                      type="number"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender *</Label>
                    <Select 
                      value={gender} 
                      onValueChange={setGender}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="emergencyContact">
                    Emergency Contact (Optional)
                    <span className="text-sm text-gray-500 block">Different from main phone number</span>
                  </Label>
                  <Input 
                    id="emergencyContact"
                    value={emergencyContact}
                    onChange={(e) => setEmergencyContact(e.target.value)}
                    placeholder="+1 234 567 890"
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="health" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="bloodGroup">Blood Group *</Label>
                  <Select 
                    value={bloodGroup} 
                    onValueChange={setBloodGroup}
                  >
                    <SelectTrigger>
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
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="allergies">Known Allergies (Optional)</Label>
                  <Input 
                    id="allergies"
                    value={allergies}
                    onChange={(e) => setAllergies(e.target.value)}
                    placeholder="e.g., Peanuts, Shellfish"
                  />
                </div>
              </TabsContent>
            </Tabs>
          )}
          
          <Button 
            type="submit" 
            className="w-full" 
            disabled={loading || (password && confirmPassword && password !== confirmPassword)}
          >
            {loading ? "Registering..." : "Register User"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
