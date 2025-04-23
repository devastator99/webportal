
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Users, FileText, Clock } from "lucide-react";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { formatDistance } from "date-fns";
import { Badge } from "@/components/ui/badge";

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  created_at: string; // Keep as required since we're adding it in DoctorDashboard
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
                <Card key={patient.id} className="bg-card hover:bg-accent/5 transition-colors cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <h3 className="font-medium text-lg">
                          {patient.first_name} {patient.last_name}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>
                            Assigned {formatDistance(new Date(patient.created_at), new Date(), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/patient/${patient.id}/prescriptions`)}
                          className="gap-2"
                        >
                          <FileText className="h-4 w-4" />
                          View Prescriptions
                        </Button>
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
