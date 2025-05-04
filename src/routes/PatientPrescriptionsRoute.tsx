
import { useState } from "react";
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useParams } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { PatientAppLayout } from '@/layouts/PatientAppLayout';
import { DoctorAppLayout } from '@/layouts/DoctorAppLayout';
import { AdminAppLayout } from '@/layouts/AdminAppLayout';
import { AppLayout } from '@/layouts/AppLayout';
import { PrescriptionTabsViewer } from '@/components/prescriptions/PrescriptionTabsViewer';
import { Button } from "@/components/ui/button";
import { PrescriptionWriter } from "@/components/dashboard/doctor/PrescriptionWriter";
import { FileText, Download, Pen } from "lucide-react";
import { generatePdfFromElement } from "@/utils/pdfUtils";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useIsMobileOrIPad } from "@/hooks/use-mobile";
import { ModernTabBar } from "@/components/navigation/ModernTabBar";

/**
 * This route component shows patient prescriptions
 * using the same layout as the videos page
 */
const PatientPrescriptionsRoute = () => {
  const { user, userRole } = useAuth();
  const { patientId } = useParams();
  const { toast } = useToast();
  const isMobileOrTablet = useIsMobileOrIPad();
  const [viewMode, setViewMode] = useState<"view" | "write">("view");
  
  if (!user) return <Navigate to="/auth" replace />;
  
  // Use the current user's ID if no patientId is provided in the URL
  const effectivePatientId = patientId || user.id;
  
  // Only doctors and administrators can write prescriptions
  const canWritePrescription = userRole === "doctor" || userRole === "administrator";

  const handleDownloadPdf = async () => {
    try {
      const filename = `prescription_${format(new Date(), 'yyyy-MM-dd')}`;
      await generatePdfFromElement('prescription-content', filename);
      toast({
        title: "Success",
        description: "Prescription PDF has been downloaded"
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

  const handlePrint = () => {
    window.print();
  };
  
  // Function to render the appropriate layout based on user role
  const getLayout = (children: React.ReactNode) => {
    switch (userRole) {
      case "patient":
        return <PatientAppLayout showHeader title="Prescriptions" description="View and manage your prescriptions" fullWidth={true}>{children}</PatientAppLayout>;
      case "doctor":
        return <DoctorAppLayout showHeader title="Prescriptions" description="Manage patient prescriptions" fullWidth={true}>{children}</DoctorAppLayout>;
      case "administrator":
        return <AdminAppLayout showHeader title="Prescriptions" description="Oversee prescription system" fullWidth={true}>{children}</AdminAppLayout>;
      default:
        return <AppLayout>{children}</AppLayout>;
    }
  };

  // Action buttons based on user role
  const renderActionButtons = () => {
    if (isMobileOrTablet) {
      // Modern action tabs for mobile using the new ModernTabBar
      const actionItems = [
        {
          label: "View",
          icon: FileText,
          onClick: () => setViewMode("view"),
          active: viewMode === "view",
          disabled: false
        },
        ...(canWritePrescription ? [
          {
            label: "Write",
            icon: Pen,
            onClick: () => setViewMode("write"),
            active: viewMode === "write",
            disabled: false
          }
        ] : []),
        {
          label: "Download",
          icon: Download,
          onClick: handleDownloadPdf,
          active: false,
          disabled: viewMode === "write"
        }
      ];

      return viewMode === "view" ? (
        <div className="fixed bottom-20 left-0 right-0 z-30 print:hidden">
          <ModernTabBar items={actionItems} className="pb-0 bottom-0 shadow-none" />
        </div>
      ) : null;
    }

    // Desktop version - elegant buttons with hover effect
    return viewMode === "view" ? (
      <div className="flex justify-end space-x-3 print:hidden">
        {canWritePrescription && (
          <Button 
            onClick={() => setViewMode("write")}
            className="bg-[#9b87f5] hover:bg-[#7E69AB] transition-colors shadow-md hover:shadow-lg"
          >
            <Pen className="h-4 w-4 mr-2" />
            Write Prescription
          </Button>
        )}
        <Button 
          variant="outline" 
          onClick={handleDownloadPdf}
          className="border-[#9b87f5] text-[#7E69AB] hover:bg-[#E5DEFF] transition-colors"
        >
          <Download className="h-4 w-4 mr-2" />
          Download PDF
        </Button>
      </div>
    ) : null;
  };
  
  return getLayout(
    <div className="w-full max-w-[1200px] mx-auto px-4">
      {/* Added action buttons at the top for desktop view */}
      {!isMobileOrTablet && viewMode === "view" && canWritePrescription && (
        <div className="flex justify-between items-center mb-4 print:hidden">
          <h2 className="text-xl font-semibold">Patient Prescriptions</h2>
          <div className="flex space-x-3">
            <Button 
              onClick={() => setViewMode("write")}
              className="bg-[#9b87f5] hover:bg-[#7E69AB] transition-colors shadow-md hover:shadow-lg"
            >
              <Pen className="h-4 w-4 mr-2" />
              Write Prescription
            </Button>
            <Button 
              variant="outline" 
              onClick={handleDownloadPdf}
              className="border-[#9b87f5] text-[#7E69AB] hover:bg-[#E5DEFF] transition-colors"
            >
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </div>
        </div>
      )}
      
      {viewMode === "view" ? (
        <>
          <div id="prescription-content" className="pb-20">
            <PrescriptionTabsViewer patientId={effectivePatientId} />
          </div>
          {/* Only show bottom action buttons on mobile */}
          {isMobileOrTablet && renderActionButtons()}
        </>
      ) : (
        <div className="mt-4">
          <div className="mb-6">
            <Button 
              variant="outline" 
              onClick={() => setViewMode("view")}
              className="border-[#9b87f5] text-[#7E69AB] hover:bg-[#E5DEFF] transition-colors"
            >
              ← Back to Prescriptions
            </Button>
          </div>
          <PrescriptionWriter 
            patientId={effectivePatientId} 
            onPrescriptionSaved={() => setViewMode("view")} 
          />
        </div>
      )}
    </div>
  );
};

export default PatientPrescriptionsRoute;
