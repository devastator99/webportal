
import React from 'react';
import { useAuth } from "@/contexts/AuthContext";
import { PatientAppLayout } from "@/layouts/PatientAppLayout";
import { PrescriptionTabsViewer } from '@/components/prescriptions/PrescriptionTabsViewer';
import { Button } from "@/components/ui/button";
import { FileText, Download, Printer, Share2, FilePlus } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { format } from 'date-fns';
import { generatePdfFromElement } from '@/utils/pdfUtils';
import { Link } from 'react-router-dom';

const PatientPrescriptionsView = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // We'll use the user's ID to fetch their prescriptions
  const patientId = user?.id;
  
  const handlePrint = () => {
    window.print();
  };
  
  const handleDownloadPdf = async () => {
    try {
      const filename = `prescriptions_${format(new Date(), 'yyyy-MM-dd')}`;
      await generatePdfFromElement('prescription-content', filename);
      toast({
        title: "Success",
        description: "Prescriptions PDF has been downloaded"
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Error",
        description: "Failed to generate PDF",
        variant: "destructive"
      });
    }
  };
  
  const handleShare = () => {
    toast({
      description: "Share functionality would be implemented here"
    });
  };
  
  if (!patientId) {
    return (
      <PatientAppLayout
        title="My Prescriptions"
        description="View and manage your prescriptions"
        showHeader={false}
        fullWidth
      >
        <div className="text-center w-full">
          <h2 className="text-xl font-semibold mb-2">Not Authorized</h2>
          <p>Please log in to view your prescriptions.</p>
        </div>
      </PatientAppLayout>
    );
  }

  return (
    <PatientAppLayout
      showHeader={false}
      fullWidth
    >
      <div className="w-full max-w-6xl mx-auto px-4 py-6">
        {/* Main Content - ensuring full width without any borders */}
        <div id="prescription-content" className="w-full">
          {patientId && <PrescriptionTabsViewer patientId={patientId} />}
        </div>
        
        {/* Action Buttons */}
        <div className="w-full flex flex-wrap justify-end gap-2 print:hidden mt-6">
          <Link to="/new-prescription">
            <Button className="bg-primary" size="sm">
              <FilePlus className="h-4 w-4 mr-2" />
              New Prescription
            </Button>
          </Link>
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadPdf}>
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
          <Button variant="outline" size="sm" onClick={handleShare}>
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>
      </div>
    </PatientAppLayout>
  );
};

export default PatientPrescriptionsView;
