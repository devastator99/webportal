
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { Users } from "lucide-react";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { formatDistance } from "date-fns";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  created_at: string;
}

interface EnhancedPatientListProps {
  patients: Patient[];
  isLoading: boolean;
}

export const EnhancedPatientList = ({ patients, isLoading }: EnhancedPatientListProps) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredPatients = patients.filter(patient => {
    const fullName = `${patient.first_name} ${patient.last_name}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase());
  });

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-[#E5DEFF] p-2 rounded-full">
              <Users className="h-5 w-5 text-[#9b87f5]" />
            </div>
            <CardTitle>Your Patients</CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Input
            placeholder="Search patients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />

          {isLoading ? (
            <div className="flex justify-center p-8">
              <LoadingSpinner />
            </div>
          ) : filteredPatients.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">
              {searchTerm ? "No matching patients found" : "No patients assigned"}
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredPatients.map((patient) => (
                <Card 
                  key={patient.id} 
                  className="bg-card hover:bg-accent/5 transition-colors cursor-pointer"
                  onClick={() => navigate(`/patient/${patient.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 bg-[#E5DEFF]">
                          <AvatarFallback className="text-[#9b87f5]">
                            {getInitials(patient.first_name, patient.last_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="space-y-1">
                          <h3 className="font-medium text-lg">
                            {patient.first_name} {patient.last_name}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>
                              Assigned {formatDistance(new Date(patient.created_at), new Date(), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
