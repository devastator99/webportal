
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit3, User, Phone, Mail, Heart, Users } from 'lucide-react';

interface RegistrationData {
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  userType: string;
  age?: string;
  gender?: string;
  bloodGroup?: string;
  allergies?: string;
  emergencyContact?: string;
  height?: string;
  foodHabit?: string;
  knownAllergies?: string;
  currentMedicalConditions?: string;
}

interface RegistrationReviewProps {
  data: RegistrationData;
  onEdit: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export const RegistrationReview: React.FC<RegistrationReviewProps> = ({
  data,
  onEdit,
  onConfirm,
  isLoading = false
}) => {
  return (
    <Card className="bg-white shadow-lg border border-gray-100">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Review Your Information
        </CardTitle>
        <p className="text-sm text-gray-600">
          Please review your information before proceeding to email verification
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Personal Information */}
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <User className="h-4 w-4" />
            Personal Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
            <div>
              <span className="text-sm text-gray-600">Name:</span>
              <p className="font-medium">{data.firstName} {data.lastName}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Account Type:</span>
              <Badge className="ml-2 bg-purple-100 text-purple-800">
                {data.userType.charAt(0).toUpperCase() + data.userType.slice(1)}
              </Badge>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <Phone className="h-4 w-4" />
            Contact Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
            <div>
              <span className="text-sm text-gray-600">Phone:</span>
              <p className="font-medium">{data.phone}</p>
            </div>
            {data.email && (
              <div>
                <span className="text-sm text-gray-600">Email:</span>
                <p className="font-medium">{data.email}</p>
              </div>
            )}
            {data.emergencyContact && (
              <div>
                <span className="text-sm text-gray-600">Emergency Contact:</span>
                <p className="font-medium">{data.emergencyContact}</p>
              </div>
            )}
          </div>
        </div>

        {/* Medical Information (for patients) */}
        {data.userType === 'patient' && (
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <Heart className="h-4 w-4" />
              Medical Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
              {data.age && (
                <div>
                  <span className="text-sm text-gray-600">Age:</span>
                  <p className="font-medium">{data.age} years</p>
                </div>
              )}
              {data.gender && (
                <div>
                  <span className="text-sm text-gray-600">Gender:</span>
                  <p className="font-medium">{data.gender.charAt(0).toUpperCase() + data.gender.slice(1)}</p>
                </div>
              )}
              {data.bloodGroup && (
                <div>
                  <span className="text-sm text-gray-600">Blood Group:</span>
                  <p className="font-medium">{data.bloodGroup}</p>
                </div>
              )}
              {data.height && (
                <div>
                  <span className="text-sm text-gray-600">Height:</span>
                  <p className="font-medium">{data.height}</p>
                </div>
              )}
              {data.foodHabit && (
                <div className="md:col-span-2">
                  <span className="text-sm text-gray-600">Food Habits:</span>
                  <p className="font-medium">{data.foodHabit}</p>
                </div>
              )}
              {(data.allergies || data.knownAllergies) && (
                <div className="md:col-span-2">
                  <span className="text-sm text-gray-600">Known Allergies:</span>
                  <p className="font-medium">{data.allergies || data.knownAllergies || 'None specified'}</p>
                </div>
              )}
              {data.currentMedicalConditions && (
                <div className="md:col-span-2">
                  <span className="text-sm text-gray-600">Current Medical Conditions:</span>
                  <p className="font-medium">{data.currentMedicalConditions}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={onEdit}
            className="flex items-center gap-2"
            disabled={isLoading}
          >
            <Edit3 className="h-4 w-4" />
            Edit Information
          </Button>
          <Button
            onClick={onConfirm}
            className="flex-1 bg-purple-600 hover:bg-purple-700"
            disabled={isLoading}
          >
            {isLoading ? "Processing..." : "Confirm & Continue"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
