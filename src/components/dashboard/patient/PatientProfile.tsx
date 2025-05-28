
import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ProfileData {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  date_of_birth?: string;
  gender?: string;
  blood_group?: string;
  height?: string;
  weight?: string;
  address?: string;
  emergency_contact?: string;
  allergies?: string;
  chronic_conditions?: string;
  medical_conditions?: string;
}

export const PatientProfile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<ProfileData>({
    first_name: "",
    last_name: "",
    email: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) return;

      try {
        setIsLoading(true);
        
        // Fetch profile data from profiles table
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("first_name, last_name, phone")
          .eq("id", user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          console.error("Error fetching profile:", profileError);
          throw profileError;
        }

        // Fetch patient details
        const { data: patientDetails, error: patientError } = await supabase
          .from("patient_details")
          .select("*")
          .eq("id", user.id)
          .single();

        if (patientError && patientError.code !== 'PGRST116') {
          console.error("Error fetching patient details:", patientError);
        }
        
        // Set profile data, combining both tables
        setProfile({
          first_name: profileData?.first_name || "",
          last_name: profileData?.last_name || "",
          email: user.email || "",
          phone: profileData?.phone || "",
          date_of_birth: patientDetails?.date_of_birth || "",
          gender: patientDetails?.gender || "",
          blood_group: patientDetails?.blood_group || "",
          height: patientDetails?.height?.toString() || "",
          weight: patientDetails?.weight?.toString() || "",
          address: "", // This field doesn't exist in current schema
          emergency_contact: patientDetails?.emergency_contact || "",
          allergies: patientDetails?.allergies || "",
          chronic_conditions: patientDetails?.chronic_conditions || "",
          medical_conditions: patientDetails?.chronic_conditions || "", // Using chronic_conditions as medical_conditions
        });
      } catch (error) {
        console.error("Error fetching profile:", error);
        toast({
          title: "Error loading profile",
          description: "Please try again later.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [user, toast]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfile((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setProfile((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id) return;
    
    // Basic validation
    if (!profile.first_name.trim() || !profile.last_name.trim()) {
      toast({
        title: "Validation Error",
        description: "First name and last name are required.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsSaving(true);
      
      // Update profiles table
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          first_name: profile.first_name.trim(),
          last_name: profile.last_name.trim(),
          phone: profile.phone?.trim() || null,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'id'
        });

      if (profileError) throw profileError;

      // Update patient_details table
      const { error: patientError } = await supabase
        .from("patient_details")
        .upsert({
          id: user.id,
          date_of_birth: profile.date_of_birth || null,
          gender: profile.gender || null,
          blood_group: profile.blood_group || null,
          height: profile.height ? parseFloat(profile.height) : null,
          weight: profile.weight ? parseFloat(profile.weight) : null,
          emergency_contact: profile.emergency_contact?.trim() || null,
          allergies: profile.allergies?.trim() || null,
          chronic_conditions: profile.chronic_conditions?.trim() || null,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'id'
        });

      if (patientError) throw patientError;
      
      toast({
        title: "Profile updated",
        description: "Your profile information has been updated successfully.",
      });
      
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Update failed",
        description: "There was an error updating your profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading profile...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Avatar className="h-20 w-20">
          <AvatarFallback className="text-lg bg-[#E5DEFF] text-[#7E69AB]">
            {profile.first_name?.[0]?.toUpperCase()}{profile.last_name?.[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <h2 className="text-xl font-bold">
            {profile.first_name} {profile.last_name}
          </h2>
          <p className="text-muted-foreground">{profile.email}</p>
        </div>
        <Button 
          variant="outline" 
          className="ml-auto"
          onClick={() => setIsEditing(!isEditing)}
          disabled={isSaving}
        >
          {isEditing ? "Cancel" : "Edit Profile"}
        </Button>
      </div>

      <Separator />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Personal Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name *</Label>
              <Input
                id="first_name"
                name="first_name"
                value={profile.first_name}
                onChange={handleChange}
                disabled={!isEditing}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name *</Label>
              <Input
                id="last_name"
                name="last_name"
                value={profile.last_name}
                onChange={handleChange}
                disabled={!isEditing}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={profile.email}
                disabled={true}
                className="bg-gray-50"
              />
              <p className="text-xs text-muted-foreground">
                Email cannot be changed here. Contact support if needed.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                name="phone"
                value={profile.phone || ""}
                onChange={handleChange}
                disabled={!isEditing}
                placeholder="Enter your phone number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date_of_birth">Date of Birth</Label>
              <Input
                id="date_of_birth"
                name="date_of_birth"
                type="date"
                value={profile.date_of_birth || ""}
                onChange={handleChange}
                disabled={!isEditing}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Select 
                value={profile.gender || ""} 
                onValueChange={(value) => handleSelectChange("gender", value)}
                disabled={!isEditing}
              >
                <SelectTrigger>
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
              <Label htmlFor="emergency_contact">Emergency Contact</Label>
              <Input
                id="emergency_contact"
                name="emergency_contact"
                value={profile.emergency_contact || ""}
                onChange={handleChange}
                disabled={!isEditing}
                placeholder="Emergency contact number"
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Medical Information Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Medical Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="blood_group">Blood Group</Label>
              <Select 
                value={profile.blood_group || ""} 
                onValueChange={(value) => handleSelectChange("blood_group", value)}
                disabled={!isEditing}
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
              <Label htmlFor="height">Height (cm)</Label>
              <Input
                id="height"
                name="height"
                type="number"
                value={profile.height || ""}
                onChange={handleChange}
                disabled={!isEditing}
                placeholder="Height in centimeters"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="weight">Weight (kg)</Label>
              <Input
                id="weight"
                name="weight"
                type="number"
                value={profile.weight || ""}
                onChange={handleChange}
                disabled={!isEditing}
                placeholder="Weight in kilograms"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="allergies">Allergies</Label>
              <Textarea
                id="allergies"
                name="allergies"
                value={profile.allergies || ""}
                onChange={handleChange}
                disabled={!isEditing}
                placeholder="List any allergies you have"
                rows={3}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="chronic_conditions">Medical Conditions</Label>
              <Textarea
                id="chronic_conditions"
                name="chronic_conditions"
                value={profile.chronic_conditions || ""}
                onChange={handleChange}
                disabled={!isEditing}
                placeholder="List any chronic conditions or medical history"
                rows={3}
              />
            </div>
          </div>
        </div>

        {isEditing && (
          <div className="flex justify-end gap-2">
            <Button 
              type="button" 
              variant="outline"
              onClick={() => setIsEditing(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        )}
      </form>
    </div>
  );
};
