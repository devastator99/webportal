
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createUserRole, supabase } from "@/integrations/supabase/client";
import { UserPlus, Eye, EyeOff } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

export const UserRegistration = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState<"patient" | "doctor" | "nutritionist" | "administrator">("patient");
  
  // Additional patient data fields
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("male");
  const [bloodGroup, setBloodGroup] = useState("");
  const [allergies, setAllergies] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");

  const validateForm = () => {
    if (!phone || !password || !firstName || !lastName) {
      toast({
        title: "Missing fields",
        description: "Please fill all required fields including phone number",
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
      // Step 1: Create the user in Auth
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: email || phone, // Use phone as email if no email provided
        password,
        options: {
          data: {
            user_type: role,
            first_name: firstName,
            last_name: lastName,
            phone: phone
          }
        }
      });

      if (signUpError) {
        throw signUpError;
      }
      
      if (!authData.user) {
        throw new Error("User creation failed - no user returned");
      }

      // Step 2: Create user role
      const roleResult = await createUserRole(authData.user.id, role);
      
      // Step 3: If patient, create patient details
      if (role === "patient") {
        const { data: patientResult, error: patientError } = await (supabase.rpc as any)(
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
        }
      }

      // Reset form
      setEmail("");
      setPhone("");
      setPassword("");
      setFirstName("");
      setLastName("");
      setRole("patient");
      setAge("");
      setGender("male");
      setBloodGroup("");
      setAllergies("");
      setEmergencyContact("");
      
      toast({
        title: "User registered successfully",
        description: `${role.charAt(0).toUpperCase() + role.slice(1)} account created for ${firstName} ${lastName}`,
      });
    } catch (error: any) {
      console.error("Registration error:", error);
      toast({
        title: "Registration failed",
        description: error.message,
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
            <Label htmlFor="phone">Phone Number *</Label>
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
            </div>
            <div className="flex items-center space-x-2 mt-1">
              <Checkbox 
                id="showPassword" 
                checked={showPassword} 
                onCheckedChange={(checked) => setShowPassword(checked === true)}
              />
              <Label 
                htmlFor="showPassword" 
                className="text-sm cursor-pointer font-normal"
              >
                Show password
              </Label>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="role">User Role *</Label>
            <Select 
              value={role} 
              onValueChange={(value) => setRole(value as any)}
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
                  <Label htmlFor="emergencyContact">Emergency Contact (Optional)</Label>
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
            disabled={loading}
          >
            {loading ? "Registering..." : "Register User"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
