import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { completeUserRegistration, supabase, ValidUserRole } from "@/integrations/supabase/client";
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
    
    // Enhanced phone validation
    if (phone.trim() === '') {
      toast({
        title: "Phone number required",
        description: "Phone number is mandatory for all user registrations",
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
      console.log("Starting user registration process with phone:", phone);
      
      // Use phone as primary identifier if no email provided
      const primaryIdentifier = email || `${phone.replace(/[^0-9]/g, '')}@temp.placeholder`;
      
      console.log("Creating auth user with identifier:", primaryIdentifier, "and phone:", phone);
      
      // Step 1: Create the user in Auth with phone number in metadata
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: primaryIdentifier,
        password,
        options: {
          data: {
            user_type_string: role,
            first_name: firstName,
            last_name: lastName,
            phone: phone, // Store phone in auth metadata
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

      console.log("Auth user created successfully:", authData.user.id, "proceeding with phone:", phone);

      // Step 2: Complete user registration using the unified RPC
      try {
        console.log("Completing user registration with phone number:", phone);
        
        const patientData = role === "patient" ? {
          age,
          gender,
          bloodGroup,
          allergies,
          emergencyContact
        } : undefined;
        
        // Ensure phone is passed to completeUserRegistration
        const registrationResult = await completeUserRegistration(
          authData.user.id,
          role,
          firstName,
          lastName,
          phone, // Pass the phone number explicitly
          patientData
        );
        
        console.log("User registration completed successfully:", registrationResult);
        
        // Show appropriate success message based on role
        if (role === "patient") {
          toast({
            title: "Registration Complete",
            description: `Patient account created successfully with phone ${phone}. Welcome notifications will be sent shortly.`,
          });
        } else {
          toast({
            title: "Registration Complete",
            description: `${role.charAt(0).toUpperCase() + role.slice(1)} account created successfully with phone ${phone}. Welcome notifications and profile completion reminders will be sent.`,
          });
        }
        
      } catch (registrationError: any) {
        console.error("Registration completion error:", registrationError);
        toast({
          title: "Partial Success",
          description: `User account created but registration completion failed: ${registrationError.message}`,
          variant: "default",
        });
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
      
      console.log("Registration process completed with phone:", phone);
      
    } catch (error: any) {
      console.error("Registration error:", error);
      
      let errorMessage = "An unexpected error occurred during registration";
      
      if (error.message?.includes("email address")) {
        errorMessage = "Invalid email address or email already in use";
      } else if (error.message?.includes("password")) {
        errorMessage = "Password requirements not met";
      } else if (error.message?.includes("phone")) {
        errorMessage = "Invalid phone number format or phone number required";
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
              <span className="text-sm text-gray-500 ml-2">(Required for all users - notifications will be sent here)</span>
            </Label>
            <Input 
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              required
              className={!phone ? "border-red-500" : ""}
            />
            {!phone && (
              <p className="text-sm text-red-500">Phone number is required for registration and notifications</p>
            )}
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
            disabled={loading || (password && confirmPassword && password !== confirmPassword) || !phone}
          >
            {loading ? "Registering..." : "Register User"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
