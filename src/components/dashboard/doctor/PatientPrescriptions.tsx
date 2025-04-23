
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, Download, Eye } from "lucide-react";
import { usePrescriptions } from "@/hooks/usePrescriptions";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { format, formatDistance, parseISO } from "date-fns";
import { Spinner } from "@/components/ui/spinner";
import { PrescriptionWriter } from "./PrescriptionWriter";
import { supabase } from "@/integrations/supabase/client";

// Helper function to safely format dates
const safeFormatDate = (dateString: string, formatStr: string = 'PPP') => {
  try {
    return format(parseISO(dateString), formatStr);
  } catch (e) {
    console.error("Date formatting error:", e, "for date:", dateString);
    return "Invalid date";
  }
};

// Helper function to safely calculate relative time
const safeFormatRelativeTime = (dateString: string) => {
  try {
    return formatDistance(parseISO(dateString), new Date(), { addSuffix: true });
  } catch (e) {
    console.error("Relative time calculation error:", e, "for date:", dateString);
    return "";
  }
};

export const PatientPrescriptions = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [patientInfo, setPatientInfo] = useState<any>(null);
  const [selectedPrescription, setSelectedPrescription] = useState<any>(null);
  const [showPrescriptionDialog, setShowPrescriptionDialog] = useState(false);
  const { getPatientPrescriptions, getPrescription } = usePrescriptions();
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"list" | "write">("list");

  useEffect(() => {
    const fetchPatientInfo = async () => {
      try {
        const { data: profiles, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', patientId)
          .single();
        
        if (error) throw error;
        setPatientInfo(profiles);
      } catch (err) {
        console.error('Error fetching patient info:', err);
      }
    };
    
    const fetchPrescriptions = async () => {
      if (!patientId || !user?.id) return;
      setLoading(true);
      try {
        const data = await getPatientPrescriptions(patientId);
        setPrescriptions(data || []);
      } catch (err) {
        console.error('Error fetching prescriptions:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPatientInfo();
    fetchPrescriptions();
  }, [patientId, user?.id]);

  const handleViewPrescription = async (prescriptionId: string) => {
    try {
      const data = await getPrescription(prescriptionId);
      setSelectedPrescription(data);
      setShowPrescriptionDialog(true);
    } catch (err) {
      console.error('Error fetching prescription details:', err);
    }
  };

  if (!patientId) {
    return <div>Patient ID is required</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => navigate('/patients')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-xl font-bold">
            {patientInfo ? `${patientInfo.first_name} ${patientInfo.last_name}'s Prescriptions` : 'Patient Prescriptions'}
          </h2>
        </div>
        
        <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as "list" | "write")}>
          <TabsList>
            <TabsTrigger value="list">View Prescriptions</TabsTrigger>
            <TabsTrigger value="write">Write Prescription</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      {viewMode === "list" ? (
        <Card>
          <CardHeader>
            <CardTitle>Prescription History</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center p-8">
                <Spinner />
              </div>
            ) : prescriptions.length === 0 ? (
              <div className="text-center p-8 text-gray-500">
                No prescriptions found for this patient.
              </div>
            ) : (
              <div className="grid gap-4">
                {prescriptions.map((prescription) => (
                  <Card key={prescription.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-2">
                        <div>
                          <h3 className="font-medium">
                            {prescription.diagnosis}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {safeFormatDate(prescription.created_at)}
                          </p>
                        </div>
                        <Badge variant="outline" className="w-fit">
                          {safeFormatRelativeTime(prescription.created_at)}
                        </Badge>
                      </div>
                      
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleViewPrescription(prescription.id)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download PDF
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <PrescriptionWriter 
          patientId={patientId} 
          onPrescriptionSaved={() => {
            setViewMode("list");
          }} 
        />
      )}
      
      <Dialog open={showPrescriptionDialog} onOpenChange={setShowPrescriptionDialog}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Prescription Details</DialogTitle>
          </DialogHeader>
          {selectedPrescription && (
            <div className="space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <h3 className="font-semibold text-sm">Diagnosis</h3>
                <p>{selectedPrescription.diagnosis}</p>
              </div>
              
              {selectedPrescription.prescription && (
                <div>
                  <h3 className="font-semibold text-sm">Prescription</h3>
                  <p className="whitespace-pre-wrap">{selectedPrescription.prescription}</p>
                </div>
              )}
              
              {selectedPrescription.notes && (
                <div>
                  <h3 className="font-semibold text-sm">Notes</h3>
                  <p className="whitespace-pre-wrap">{selectedPrescription.notes}</p>
                </div>
              )}
              
              <div>
                <h3 className="font-semibold text-sm">Date</h3>
                <p>{safeFormatDate(selectedPrescription.created_at)}</p>
              </div>
              
              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setShowPrescriptionDialog(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
