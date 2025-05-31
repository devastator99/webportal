
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { NutritionistAppLayout } from "@/layouts/NutritionistAppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { UserRound, Mail, Phone, MapPin, Award, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const NutritionistProfilePage = () => {
  const { user, userRole, isLoading } = useAuth();
  const { toast } = useToast();
  const [nutritionistDetails, setNutritionistDetails] = useState<any>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    specialization: '',
    qualifications: '',
    license_number: '',
    clinic_address: '',
    clinic_phone: ''
  });

  useEffect(() => {
    if (user) {
      fetchNutritionistDetails();
    }
  }, [user]);

  const fetchNutritionistDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('nutritionist_details')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching nutritionist details:', error);
        return;
      }

      setNutritionistDetails(data);
      if (data) {
        setFormData({
          specialization: data.specialization || '',
          qualifications: data.qualifications || '',
          license_number: data.license_number || '',
          clinic_address: data.clinic_address || '',
          clinic_phone: data.clinic_phone || ''
        });
      }
    } catch (error) {
      console.error('Error fetching nutritionist details:', error);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from('nutritionist_details')
        .upsert({
          id: user?.id,
          ...formData,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error saving nutritionist details:', error);
        toast({
          title: "Error",
          description: "Failed to save profile details",
          variant: "destructive"
        });
        return;
      }

      setIsEditing(false);
      fetchNutritionistDetails();
      toast({
        title: "Success",
        description: "Profile updated successfully"
      });
    } catch (error) {
      console.error('Error saving nutritionist details:', error);
      toast({
        title: "Error",
        description: "Failed to save profile details",
        variant: "destructive"
      });
    }
  };

  if (isLoading || isLoadingDetails) {
    return <DashboardSkeleton />;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (userRole !== "nutritionist") {
    return <Navigate to="/dashboard" replace />;
  }

  const nutritionistFirstName = user?.user_metadata?.first_name || "";
  const nutritionistLastName = user?.user_metadata?.last_name || "";
  const nutritionistName = `${nutritionistFirstName} ${nutritionistLastName}`.trim();

  return (
    <NutritionistAppLayout>
      <div className="container mx-auto pt-6 pb-6 px-6 space-y-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[#7E69AB] flex items-center gap-2">
            <UserRound className="h-8 w-8" />
            Nutritionist Profile
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage your professional profile and practice information
          </p>
        </div>

        {/* Basic Information Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserRound className="h-5 w-5" />
              Basic Information
            </CardTitle>
            <CardDescription>
              Your basic profile information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>First Name</Label>
                <Input value={nutritionistFirstName} disabled className="bg-gray-50" />
              </div>
              <div>
                <Label>Last Name</Label>
                <Input value={nutritionistLastName} disabled className="bg-gray-50" />
              </div>
              <div>
                <Label className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
                <Input value={user?.email || ''} disabled className="bg-gray-50" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Professional Information Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Professional Information
                </CardTitle>
                <CardDescription>
                  Your nutrition qualifications and specialization
                </CardDescription>
              </div>
              <Button 
                variant={isEditing ? "default" : "outline"} 
                onClick={() => isEditing ? handleSave() : setIsEditing(true)}
              >
                {isEditing ? "Save Changes" : "Edit Profile"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Specialization</Label>
                <Input 
                  value={formData.specialization}
                  onChange={(e) => setFormData({...formData, specialization: e.target.value})}
                  disabled={!isEditing}
                  placeholder="e.g., Clinical Nutrition, Sports Nutrition"
                />
              </div>
              <div>
                <Label>License Number</Label>
                <Input 
                  value={formData.license_number}
                  onChange={(e) => setFormData({...formData, license_number: e.target.value})}
                  disabled={!isEditing}
                  placeholder="Nutrition license number"
                />
              </div>
            </div>
            <div>
              <Label>Qualifications</Label>
              <Textarea 
                value={formData.qualifications}
                onChange={(e) => setFormData({...formData, qualifications: e.target.value})}
                disabled={!isEditing}
                placeholder="e.g., MSc in Clinical Nutrition, RD (Registered Dietitian)"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Practice Information Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Practice Information
            </CardTitle>
            <CardDescription>
              Your practice contact details and address
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Practice Address
              </Label>
              <Textarea 
                value={formData.clinic_address}
                onChange={(e) => setFormData({...formData, clinic_address: e.target.value})}
                disabled={!isEditing}
                placeholder="Complete practice address"
                rows={3}
              />
            </div>
            <div>
              <Label className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Practice Phone
              </Label>
              <Input 
                value={formData.clinic_phone}
                onChange={(e) => setFormData({...formData, clinic_phone: e.target.value})}
                disabled={!isEditing}
                placeholder="Practice phone number"
              />
            </div>
          </CardContent>
        </Card>

        {isEditing && (
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => {
              setIsEditing(false);
              fetchNutritionistDetails();
            }}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Changes
            </Button>
          </div>
        )}
      </div>
    </NutritionistAppLayout>
  );
};

export default NutritionistProfilePage;
