
import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const PatientProfilePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [updating, setUpdating] = useState(false);

  // Editable fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [address, setAddress] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      if (user?.id) {
        try {
          // First try to get the profile directly from the profiles table with the available columns
          const { data, error } = await supabase
            .from("profiles")
            .select("id, first_name, last_name, phone")
            .eq("id", user.id)
            .single();
            
          if (error) {
            toast({
              title: "Load Error",
              description: "Could not load your profile.",
              variant: "destructive",
            });
            setLoading(false);
            return;
          }
          
          // Get user email from auth metadata
          const { data: userData } = await supabase.auth.getUser();
          const userEmail = userData?.user?.email || "";
          
          // Set profile data
          const profileData = {
            ...data,
            email: userEmail,
            // Use phone as phone_number if available, otherwise empty string
            phone_number: data.phone || "",
            // Address isn't in the DB, so initialize as empty
            address: ""
          };
          
          setProfile(profileData);
          setFirstName(profileData.first_name || "");
          setLastName(profileData.last_name || "");
          setEmail(profileData.email || "");
          setPhoneNumber(profileData.phone_number || "");
          setAddress(profileData.address || "");
        } catch (e) {
          console.error("Error fetching profile:", e);
          toast({
            title: "Load Error",
            description: "Could not load your profile.",
            variant: "destructive",
          });
        }
      }
      setLoading(false);
    };
    fetchProfile();
  }, [user, toast]);

  const handleProfileUpdate = async () => {
    if (!firstName || !lastName) {
      toast({
        title: "Validation Error",
        description: "First and last name are required.",
        variant: "destructive"
      });
      return;
    }
    setUpdating(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        first_name: firstName,
        last_name: lastName,
        phone: phoneNumber, // Update phone field instead of phone_number
      })
      .eq("id", user.id);
    setUpdating(false);
    if (error) {
      toast({
        title: "Update Error",
        description: "Could not update your profile.",
        variant: "destructive",
      });
    } else {
      setProfile({ 
        ...profile, 
        first_name: firstName, 
        last_name: lastName,
        email: email,
        phone_number: phoneNumber,
        phone: phoneNumber,
        address: address
      });
      setEditMode(false);
      toast({ title: "Profile updated!" });
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <span>Loading profile...</span>
      </div>
    );
  }

  return (
    <div className="min-h-[90vh] pt-12 pb-8 flex flex-col items-center bg-background">
      <Card className="w-full max-w-lg shadow-lg">
        <CardHeader>
          <CardTitle>Patient Profile</CardTitle>
          <CardDescription>Your personal details are shown below. Only you can change them.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              value={firstName}
              disabled={!editMode}
              onChange={e => setFirstName(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              value={lastName}
              disabled={!editMode}
              onChange={e => setLastName(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              disabled={true} // Email cannot be edited as it's from auth
              className="mt-1 bg-gray-100" // Add gray background to indicate non-editable
            />
          </div>
          <div>
            <Label htmlFor="phoneNumber">Phone Number</Label>
            <Input
              id="phoneNumber"
              value={phoneNumber}
              disabled={!editMode}
              onChange={e => setPhoneNumber(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={address}
              disabled={!editMode}
              onChange={e => setAddress(e.target.value)}
              className="mt-1"
              placeholder="Address not stored yet"
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between gap-4">
          <Button variant="secondary" onClick={() => navigate(-1)}>
            Back
          </Button>
          {!editMode ? (
            <Button onClick={() => setEditMode(true)}>
              Edit
            </Button>
          ) : (
            <Button disabled={updating} onClick={handleProfileUpdate}>
              {updating ? "Saving..." : "Save"}
            </Button>
          )}
        </CardFooter>
      </Card>
      <div className="w-full max-w-lg mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Plans</CardTitle>
            <CardDescription>Explore and choose a health/wellness plan.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3 mt-2">
              {/* Plan options are stubs – expand as needed */}
              <Button variant="outline" className="flex-1 text-center" disabled>
                Basic Plan (Coming soon)
              </Button>
              <Button variant="outline" className="flex-1 text-center" disabled>
                Diet Plan (Coming soon)
              </Button>
              <Button variant="outline" className="flex-1 text-center" disabled>
                Fitness Plan (Coming soon)
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PatientProfilePage;
