
import React, { useEffect, useState } from "react";
import { usePrescriptions as usePrescriptionsHook } from "@/hooks/usePrescriptions"; // Import the correct hook
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, Download, UserPlus } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { format, formatDistance, parseISO } from "date-fns";
import { Badge } from "@/components/ui/badge";

interface PrescriptionHistoryProps {
  patientId: string;
  onAssignNutritionist?: (prescriptionId: string) => void;
}

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

export const PrescriptionHistory: React.FC<PrescriptionHistoryProps> = ({ patientId, onAssignNutritionist }) => {
  const { getPatientPrescriptions, getPrescription } = usePrescriptionsHook(); // Use the imported hook
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [selectedPrescription, setSelectedPrescription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const { toast } = useToast();
  
  useEffect(() => {
    fetchPrescriptions();
  }, [patientId]);
  
  const fetchPrescriptions = async () => {
    setLoading(true);
    try {
      const data = await getPatientPrescriptions(patientId);
      
      // Log fetched data to help debug
      console.log("Prescriptions fetched:", data);
      if (data && data.length > 0) {
        console.log("Sample prescription date:", data[0].created_at);
      }
      
      setPrescriptions(data || []);
    } catch (err) {
      console.error('Error fetching prescriptions:', err);
      toast({
        title: "Error",
        description: "Failed to load prescription history",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleViewDetails = async (prescriptionId: string) => {
    try {
      const data = await getPrescription(prescriptionId);
      setSelectedPrescription(data);
      setShowDetailsDialog(true);
    } catch (err) {
      console.error('Error fetching prescription details:', err);
      toast({
        title: "Error",
        description: "Failed to load prescription details",
        variant: "destructive"
      });
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Spinner size="lg" />
      </div>
    );
  }
  
  if (!prescriptions.length) {
    return (
      <div className="text-center p-8 text-gray-500">
        No prescription history available for this patient.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {prescriptions.map((prescription) => (
        <Card key={prescription.id} className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-2">
              <div>
                <h3 className="font-medium">
                  {prescription.diagnosis || "No diagnosis provided"}
                </h3>
                <p className="text-sm text-gray-500">
                  {safeFormatDate(prescription.created_at)} - {safeFormatRelativeTime(prescription.created_at)}
                </p>
              </div>
              <Badge variant="outline" className="w-fit">
                {prescription.format_type || 'standard'}
              </Badge>
            </div>
            
            <div className="mt-4 flex flex-wrap gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleViewDetails(prescription.id)}
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
              {onAssignNutritionist && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onAssignNutritionist(prescription.id)}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Assign Nutritionist
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
      
      {/* Prescription Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Prescription Details</DialogTitle>
          </DialogHeader>
          
          {selectedPrescription && (
            <div className="max-h-[60vh] overflow-y-auto space-y-4">
              <div>
                <h3 className="text-sm font-semibold">Diagnosis</h3>
                <p>{selectedPrescription.diagnosis || "No diagnosis provided"}</p>
              </div>
              
              {selectedPrescription.prescription && (
                <div>
                  <h3 className="text-sm font-semibold">Prescription</h3>
                  <p className="whitespace-pre-wrap">{selectedPrescription.prescription}</p>
                </div>
              )}
              
              {selectedPrescription.notes && (
                <div>
                  <h3 className="text-sm font-semibold">Notes</h3>
                  <p className="whitespace-pre-wrap">{selectedPrescription.notes}</p>
                </div>
              )}

              <div>
                <h3 className="text-sm font-semibold">Date</h3>
                <p>{safeFormatDate(selectedPrescription.created_at)}</p>
              </div>
              
              {/* Add medication and test details here once API returns structured data */}
              
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
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
