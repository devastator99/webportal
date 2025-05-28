
import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

interface ProfileData {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  date_of_birth?: string;
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
        const { data, error } = await supabase
          .from("profiles")
          .select("first_name, last_name, phone")
          .eq("id", user.id)
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
          console.error("Error fetching profile:", error);
          throw error;
        }
        
        // Set profile data, using auth user email and profile data
        setProfile({
          first_name: data?.first_name || "",
          last_name: data?.last_name || "",
          email: user.email || "",
          phone: data?.phone || "",
          date_of_birth: "", // We'll add this field later if needed
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
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
      
      const { error } = await supabase
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

      if (error) throw error;
      
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

      <form onSubmit={handleSubmit} className="space-y-4">
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
