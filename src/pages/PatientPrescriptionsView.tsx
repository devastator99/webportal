
import React from 'react';
import { useAuth } from "@/contexts/AuthContext";
import { PatientAppLayout } from "@/layouts/PatientAppLayout";
import { PrescriptionTabsViewer } from '@/components/prescriptions/PrescriptionTabsViewer';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { FileText, Download, Printer, Share2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { generatePdfFromElement } from '@/utils/pdfUtils';
import { format } from 'date-fns';

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
        showHeader
      >
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Not Authorized</CardTitle>
            <CardDescription>Please log in to view your prescriptions.</CardDescription>
          </CardHeader>
        </Card>
      </PatientAppLayout>
    );
  }

  return (
    <PatientAppLayout
      title="My Prescriptions"
      description="View and manage your prescriptions"
      showHeader
    >
      <div className="w-full max-w-full space-y-6">
        {/* Card showing patient info */}
        <Card className="w-full bg-white/60 backdrop-blur-sm border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-xl font-semibold mb-1">
                  Your Prescriptions
                </h2>
                <p className="text-sm text-muted-foreground">
                  Manage and view all your medical prescriptions
                </p>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="px-3 py-1">
                  Personal Records
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Main Content */}
        <div id="prescription-content" className="w-full">
          {patientId && <PrescriptionTabsViewer patientId={patientId} />}
        </div>
        
        {/* Action Buttons */}
        <div className="w-full flex flex-wrap justify-end gap-2 print:hidden">
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
