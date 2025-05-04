
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
import { FileText, Download } from "lucide-react";
import { generatePdfFromElement } from "@/utils/pdfUtils";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { MobileMoreMenu } from "@/components/ui/mobile-more-menu";
import { useIsMobileOrIPad } from "@/hooks/use-mobile";

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
      // Mobile version using the MobileMoreMenu component
      const menuItems = [
        ...(canWritePrescription && viewMode === "view" ? [
          {
            icon: FileText,
            label: "Write Prescription",
            onClick: () => setViewMode("write"),
            active: false
          }
        ] : []),
        {
          icon: Download,
          label: "Download PDF",
          onClick: handleDownloadPdf,
          active: false
        }
      ];

      return menuItems.length > 0 ? (
        <div className="fixed bottom-20 right-4 z-30">
          <MobileMoreMenu
            items={menuItems}
            trigger={
              <Button size="icon" className="h-12 w-12 rounded-full shadow-lg">
                <FileText className="h-6 w-6" />
              </Button>
            }
            title="Prescription Options"
            className="pb-safe"
          />
        </div>
      ) : null;
    }

    // Desktop version
    return (
      <div className="flex justify-end space-x-2 mt-4 print:hidden">
        {canWritePrescription && viewMode === "view" && (
          <Button 
            onClick={() => setViewMode("write")}
            className="bg-primary"
          >
            <FileText className="h-4 w-4 mr-2" />
            Write Prescription
          </Button>
        )}
        <Button variant="outline" onClick={handleDownloadPdf}>
          <Download className="h-4 w-4 mr-2" />
          Download PDF
        </Button>
      </div>
    );
  };
  
  return getLayout(
    <div className="w-full max-w-[1200px] mx-auto px-4">
      {viewMode === "view" ? (
        <>
          <div id="prescription-content">
            <PrescriptionTabsViewer patientId={effectivePatientId} />
          </div>
          {renderActionButtons()}
        </>
      ) : (
        <div className="mt-4">
          <div className="mb-4">
            <Button variant="outline" onClick={() => setViewMode("view")}>
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
