
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
  phone_number?: string;
  address?: string;
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

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) return;

      try {
        setIsLoading(true);
        
        // Fetch profile data from profiles table
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (error) throw error;
        
        setProfile({
          ...data,
          email: user.email || "",
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
    
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          first_name: profile.first_name,
          last_name: profile.last_name,
          phone_number: profile.phone_number,
          address: profile.address,
          date_of_birth: profile.date_of_birth,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

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
            {profile.first_name?.[0]}{profile.last_name?.[0]}
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
        >
          {isEditing ? "Cancel" : "Edit Profile"}
        </Button>
      </div>

      <Separator />

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="first_name">First Name</Label>
            <Input
              id="first_name"
              name="first_name"
              value={profile.first_name}
              onChange={handleChange}
              disabled={!isEditing}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="last_name">Last Name</Label>
            <Input
              id="last_name"
              name="last_name"
              value={profile.last_name}
              onChange={handleChange}
              disabled={!isEditing}
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
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone_number">Phone Number</Label>
            <Input
              id="phone_number"
              name="phone_number"
              value={profile.phone_number || ""}
              onChange={handleChange}
              disabled={!isEditing}
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
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              name="address"
              value={profile.address || ""}
              onChange={handleChange}
              disabled={!isEditing}
            />
          </div>
        </div>

        {isEditing && (
          <div className="flex justify-end">
            <Button type="submit">
              Save Changes
            </Button>
          </div>
        )}
      </form>
    </div>
  );
};
