
import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList 
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Search } from "lucide-react";

interface PatientProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
}

interface PatientSelectorProps {
  selectedPatient: string;
  setSelectedPatient: (id: string) => void;
  onPatientSelect: () => void;
}

export const PatientSelector = ({ 
  selectedPatient, 
  setSelectedPatient,
  onPatientSelect
}: PatientSelectorProps) => {
  const [patientSearchOpen, setPatientSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch patients with role 'patient'
  const { data: patients, isLoading: isLoadingPatients } = useQuery({
    queryKey: ["all_patients"],
    queryFn: async () => {
      console.log("Fetching all patients for prescription writer");
      
      try {
        const { data, error } = await supabase.rpc('get_patients');
        
        if (error) {
          console.error("Error fetching patients:", error);
          throw error;
        }
        
        console.log("Patient profiles found:", data.length);
        return data as PatientProfile[];
      } catch (error) {
        console.error("Error fetching patients:", error);
        return [] as PatientProfile[];
      }
    },
  });

  const filteredPatients = useMemo(() => {
    if (!patients || !Array.isArray(patients)) return [];
    
    if (!searchTerm) return patients;
    
    return patients.filter((patient) => {
      const fullName = `${patient.first_name || ''} ${patient.last_name || ''}`.toLowerCase();
      return fullName.includes(searchTerm.toLowerCase());
    });
  }, [patients, searchTerm]);

  const selectedPatientName = useMemo(() => {
    if (!selectedPatient || !patients || !Array.isArray(patients)) return "Select patient";
    
    const patient = patients.find(p => p.id === selectedPatient);
    if (!patient) return "Select patient";
    
    return `${patient.first_name || ""} ${patient.last_name || ""}`;
  }, [selectedPatient, patients]);

  return (
    <div className="space-y-2">
      <Label htmlFor="patient">Select Patient <span className="text-red-500">*</span></Label>
      
      <Popover open={patientSearchOpen} onOpenChange={setPatientSearchOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={patientSearchOpen}
            className="w-full justify-between"
          >
            {selectedPatientName}
            <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0" align="start">
          <Command>
            <CommandInput 
              placeholder="Search patients..." 
              onValueChange={setSearchTerm}
              className="h-9"
            />
            <CommandList>
              <CommandEmpty>No patient found.</CommandEmpty>
              <CommandGroup className="max-h-[200px] overflow-y-auto">
                {isLoadingPatients ? (
                  <CommandItem disabled>Loading patients...</CommandItem>
                ) : filteredPatients && filteredPatients.length > 0 ? (
                  filteredPatients.map((patient) => (
                    <CommandItem
                      key={patient.id}
                      onSelect={() => {
                        setSelectedPatient(patient.id);
                        setPatientSearchOpen(false);
                        onPatientSelect();
                      }}
                    >
                      {patient.first_name || "Unknown"} {patient.last_name || ""}
                    </CommandItem>
                  ))
                ) : (
                  <CommandItem disabled>No patients found</CommandItem>
                )}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};
