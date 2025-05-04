
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Save, CalendarPlus, Activity, X, FileText } from "lucide-react";
import { usePrescriptions } from "@/hooks/usePrescriptions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { PrescriptionData } from "@/hooks/usePrescriptions";
import { MedicationsList } from "./MedicationsList";
import { PrescribedTests } from "./PrescribedTests";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { PrescriptionLetterhead } from "./PrescriptionLetterhead";
import { PrescriptionFooter } from "./PrescriptionFooter";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

export interface PrescriptionFormProps {
  patientId: string;
  onSaved?: (prescriptionId: string) => void;
  patientInfo?: {
    name?: string;
    age?: number;
    gender?: string;
    contactNumber?: string;
  };
}

export const PrescriptionForm: React.FC<PrescriptionFormProps> = ({
  patientId,
  onSaved,
  patientInfo
}) => {
  const { savePrescription, isLoading } = usePrescriptions();
  const { toast } = useToast();
  const [diagnosis, setDiagnosis] = useState("");
  const [notes, setNotes] = useState("");
  const [medications, setMedications] = useState<PrescriptionData["medications"]>([]);
  const [tests, setTests] = useState<PrescriptionData["tests"]>([]);
  const [showMedicationDialog, setShowMedicationDialog] = useState(false);
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [showVitalsDialog, setShowVitalsDialog] = useState(false);
  const [vitals, setVitals] = useState<PrescriptionData["vitals"]>({
    blood_pressure: '',
    temperature: undefined,
    heart_rate: undefined,
    respiratory_rate: undefined,
    oxygen_saturation: undefined
  });
  const [followUpDate, setFollowUpDate] = useState("");
  const [validityPeriod, setValidityPeriod] = useState(30); // Default 30 days
  const [headerInfo, setHeaderInfo] = useState({
    clinicName: "DIABETES THYROID AND HORMONE CENTRE",
    clinicAddress: "NC-9, P.C. Colony",
    clinicLocation: "Near Gayatri Mandir (100 m North)",
    clinicCity: "Lohiya Nagar, Kankarbagh, Patna, Bihar (800020)",
    timings: "10:00 AM to 4:00 PM",
    days: "Monday to Saturday",
    appointmentNote: "Consultation Only by Prior Appointment",
    closedDays: "(Sunday closed)"
  });

  const [newMedication, setNewMedication] = useState({
    medication_name: "",
    dosage: "",
    frequency: "",
    duration: "",
    timing: "",
    instructions: ""
  });

  const [newTest, setNewTest] = useState({
    test_name: "",
    instructions: ""
  });

  // Handle removing a test
  const handleRemoveTest = (index: number) => {
    setTests(tests.filter((_, i) => i !== index));
  };

  // Handle removing a medication
  const handleRemoveMedication = (index: number) => {
    setMedications(medications.filter((_, i) => i !== index));
  };

  const handleSavePrescription = async () => {
    if (!diagnosis) {
      toast({
        title: "Error",
        description: "Diagnosis is required",
        variant: "destructive"
      });
      return;
    }

    const prescriptionData: PrescriptionData = {
      diagnosis,
      notes,
      medications,
      tests,
      vitals,
      follow_up_date: followUpDate || undefined,
      validity_period: validityPeriod,
      format_type: 'standard'
    };

    try {
      const prescriptionId = await savePrescription(patientId, prescriptionData);
      if (prescriptionId) {
        toast({
          title: "Success",
          description: "Prescription saved successfully"
        });
        
        if (onSaved) {
          onSaved(prescriptionId);
        }
        
        // Reset form
        setDiagnosis("");
        setNotes("");
        setMedications([]);
        setTests([]);
        setVitals({
          blood_pressure: '',
          temperature: undefined,
          heart_rate: undefined,
          respiratory_rate: undefined,
          oxygen_saturation: undefined
        });
        setFollowUpDate("");
      }
    } catch (error) {
      console.error("Error saving prescription:", error);
      toast({
        title: "Error",
        description: "Failed to save prescription",
        variant: "destructive"
      });
    }
  };

  const handleAddMedication = () => {
    if (!newMedication.medication_name || !newMedication.dosage || !newMedication.frequency) {
      toast({
        title: "Error",
        description: "Medication name, dosage and frequency are required",
        variant: "destructive"
      });
      return;
    }
    setMedications([...medications, newMedication]);
    setNewMedication({
      medication_name: "",
      dosage: "",
      frequency: "",
      duration: "",
      timing: "",
      instructions: ""
    });
    setShowMedicationDialog(false);
  };

  const handleAddTest = () => {
    if (!newTest.test_name) {
      toast({
        title: "Error",
        description: "Test name is required",
        variant: "destructive"
      });
      return;
    }
    setTests([...tests, newTest]);
    setNewTest({ test_name: "", instructions: "" });
    setShowTestDialog(false);
  };

  return (
    <div className="space-y-6">
      {/* Prescription Letterhead */}
      <PrescriptionLetterhead headerInfo={headerInfo} />
      
      <div className="space-y-4">
        <div>
          <Label htmlFor="diagnosis">Diagnosis <span className="text-red-500">*</span></Label>
          <Input
            id="diagnosis"
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
            placeholder="Enter diagnosis"
          />
        </div>

        <div>
          <Label htmlFor="notes">Additional Notes</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any additional notes"
          />
        </div>

        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">Medications</h3>
              <Dialog open={showMedicationDialog} onOpenChange={setShowMedicationDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-1" /> Add Medication
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Medication</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    {/* Medication Form */}
                    <div className="space-y-4">
                      <div>
                        <Label>Medication Name*</Label>
                        <Input
                          value={newMedication.medication_name}
                          onChange={(e) => setNewMedication({
                            ...newMedication,
                            medication_name: e.target.value
                          })}
                        />
                      </div>
                      <div>
                        <Label>Dosage*</Label>
                        <Input
                          value={newMedication.dosage}
                          onChange={(e) => setNewMedication({
                            ...newMedication,
                            dosage: e.target.value
                          })}
                        />
                      </div>
                      <div>
                        <Label>Frequency*</Label>
                        <Input
                          value={newMedication.frequency}
                          onChange={(e) => setNewMedication({
                            ...newMedication,
                            frequency: e.target.value
                          })}
                        />
                      </div>
                      <div>
                        <Label>Duration</Label>
                        <Input
                          value={newMedication.duration}
                          onChange={(e) => setNewMedication({
                            ...newMedication,
                            duration: e.target.value
                          })}
                        />
                      </div>
                      <div>
                        <Label>Timing</Label>
                        <Input
                          value={newMedication.timing}
                          onChange={(e) => setNewMedication({
                            ...newMedication,
                            timing: e.target.value
                          })}
                        />
                      </div>
                      <div>
                        <Label>Instructions</Label>
                        <Textarea
                          value={newMedication.instructions}
                          onChange={(e) => setNewMedication({
                            ...newMedication,
                            instructions: e.target.value
                          })}
                        />
                      </div>
                      <Button onClick={handleAddMedication} className="w-full">
                        Add Medication
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <MedicationsList medications={medications} onRemove={handleRemoveMedication} />
            
            <Separator className="my-4" />
            
            {/* Tests Section */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold">Prescribed Tests</h3>
                <Dialog open={showTestDialog} onOpenChange={setShowTestDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-1" /> Add Test
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Test</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      {/* Test Form */}
                      <div className="space-y-4">
                        <div>
                          <Label>Test Name*</Label>
                          <Input
                            value={newTest.test_name}
                            onChange={(e) => setNewTest({
                              ...newTest,
                              test_name: e.target.value
                            })}
                          />
                        </div>
                        <div>
                          <Label>Instructions</Label>
                          <Textarea
                            value={newTest.instructions}
                            onChange={(e) => setNewTest({
                              ...newTest,
                              instructions: e.target.value
                            })}
                          />
                        </div>
                        <Button onClick={handleAddTest} className="w-full">
                          Add Test
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              
              <PrescribedTests tests={tests} onRemove={handleRemoveTest} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Additional Details</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowVitalsDialog(true)}
              >
                <Activity className="h-4 w-4 mr-1" /> Add Vitals
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="followUp">Follow-up Date</Label>
                <Input
                  id="followUp"
                  type="date"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="validity">Validity (days)</Label>
                <Input
                  id="validity"
                  type="number"
                  value={validityPeriod}
                  onChange={(e) => setValidityPeriod(parseInt(e.target.value))}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showVitalsDialog} onOpenChange={setShowVitalsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Vitals</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="grid gap-4">
              <div>
                <Label>Blood Pressure</Label>
                <Input
                  placeholder="e.g. 120/80"
                  value={vitals?.blood_pressure || ""}
                  onChange={(e) => setVitals({
                    ...vitals,
                    blood_pressure: e.target.value
                  })}
                />
              </div>
              <div>
                <Label>Temperature (°C)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={vitals?.temperature || ""}
                  onChange={(e) => setVitals({
                    ...vitals,
                    temperature: parseFloat(e.target.value)
                  })}
                />
              </div>
              <div>
                <Label>Heart Rate (bpm)</Label>
                <Input
                  type="number"
                  value={vitals?.heart_rate || ""}
                  onChange={(e) => setVitals({
                    ...vitals,
                    heart_rate: parseInt(e.target.value)
                  })}
                />
              </div>
              <div>
                <Label>Respiratory Rate</Label>
                <Input
                  type="number"
                  value={vitals?.respiratory_rate || ""}
                  onChange={(e) => setVitals({
                    ...vitals,
                    respiratory_rate: parseInt(e.target.value)
                  })}
                />
              </div>
              <div>
                <Label>Oxygen Saturation (%)</Label>
                <Input
                  type="number"
                  max="100"
                  value={vitals?.oxygen_saturation || ""}
                  onChange={(e) => setVitals({
                    ...vitals,
                    oxygen_saturation: parseInt(e.target.value)
                  })}
                />
              </div>
            </div>
            <Button
              className="w-full"
              onClick={() => setShowVitalsDialog(false)}
            >
              Save Vitals
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Prescription Footer */}
      <PrescriptionFooter validity={validityPeriod} />

      <div className="flex justify-end space-x-2">
        <Button
          variant="outline"
          onClick={() => {
            // Preview logic would go here
            toast({
              title: "Preview",
              description: "Prescription preview is being generated"
            });
          }}
        >
          <FileText className="h-4 w-4 mr-2" />
          Preview
        </Button>
        <Button
          className="gap-2"
          onClick={handleSavePrescription}
          disabled={isLoading}
        >
          <Save className="h-4 w-4" />
          {isLoading ? "Saving..." : "Save Prescription"}
        </Button>
      </div>
    </div>
  );
};
