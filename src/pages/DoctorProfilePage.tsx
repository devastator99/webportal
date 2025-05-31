
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { DoctorAppLayout } from "@/layouts/DoctorAppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { UserRound, Mail, Phone, MapPin, FileText, Award, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const DoctorProfilePage = () => {
  const { user, userRole, isLoading } = useAuth();
  const { toast } = useToast();
  const [doctorDetails, setDoctorDetails] = useState<any>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    specialization: '',
    qualifications: '',
    registration_number: '',
    clinic_address: '',
    clinic_phone: ''
  });

  useEffect(() => {
    if (user) {
      fetchDoctorDetails();
    }
  }, [user]);

  const fetchDoctorDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('doctor_details')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching doctor details:', error);
        return;
      }

      setDoctorDetails(data);
      if (data) {
        setFormData({
          specialization: data.specialization || '',
          qualifications: data.qualifications || '',
          registration_number: data.registration_number || '',
          clinic_address: data.clinic_address || '',
          clinic_phone: data.clinic_phone || ''
        });
      }
    } catch (error) {
      console.error('Error fetching doctor details:', error);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from('doctor_details')
        .upsert({
          id: user?.id,
          ...formData,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error saving doctor details:', error);
        toast({
          title: "Error",
          description: "Failed to save profile details",
          variant: "destructive"
        });
        return;
      }

      setIsEditing(false);
      fetchDoctorDetails();
      toast({
        title: "Success",
        description: "Profile updated successfully"
      });
    } catch (error) {
      console.error('Error saving doctor details:', error);
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

  if (userRole !== "doctor") {
    return <Navigate to="/dashboard" replace />;
  }

  const doctorFirstName = user?.user_metadata?.first_name || "";
  const doctorLastName = user?.user_metadata?.last_name || "";
  const doctorName = `${doctorFirstName} ${doctorLastName}`.trim();

  return (
    <DoctorAppLayout 
      showHeader={true} 
      title="Doctor Profile"
      description="Manage your professional profile and clinic information"
    >
      <div className="space-y-6">
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
                <Input value={doctorFirstName} disabled className="bg-gray-50" />
              </div>
              <div>
                <Label>Last Name</Label>
                <Input value={doctorLastName} disabled className="bg-gray-50" />
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
                  Your medical qualifications and specialization
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
                  placeholder="e.g., Cardiology, Dermatology"
                />
              </div>
              <div>
                <Label>Registration Number</Label>
                <Input 
                  value={formData.registration_number}
                  onChange={(e) => setFormData({...formData, registration_number: e.target.value})}
                  disabled={!isEditing}
                  placeholder="Medical registration number"
                />
              </div>
            </div>
            <div>
              <Label>Qualifications</Label>
              <Textarea 
                value={formData.qualifications}
                onChange={(e) => setFormData({...formData, qualifications: e.target.value})}
                disabled={!isEditing}
                placeholder="e.g., MBBS, MD (Medicine), Fellowship in Cardiology"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Clinic Information Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Clinic Information
            </CardTitle>
            <CardDescription>
              Your clinic contact details and address
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Clinic Address
              </Label>
              <Textarea 
                value={formData.clinic_address}
                onChange={(e) => setFormData({...formData, clinic_address: e.target.value})}
                disabled={!isEditing}
                placeholder="Complete clinic address"
                rows={3}
              />
            </div>
            <div>
              <Label className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Clinic Phone
              </Label>
              <Input 
                value={formData.clinic_phone}
                onChange={(e) => setFormData({...formData, clinic_phone: e.target.value})}
                disabled={!isEditing}
                placeholder="Clinic phone number"
              />
            </div>
          </CardContent>
        </Card>

        {isEditing && (
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => {
              setIsEditing(false);
              fetchDoctorDetails();
            }}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Changes
            </Button>
          </div>
        )}
      </div>
    </DoctorAppLayout>
  );
};

export default DoctorProfilePage;
