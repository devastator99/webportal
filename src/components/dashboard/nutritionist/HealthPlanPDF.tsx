
import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, FileText, Download, Utensils, Dumbbell, Pill } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

interface HealthPlanItem {
  id: string;
  type: 'food' | 'exercise' | 'medication';
  scheduled_time: string;
  description: string;
  frequency: string;
  duration: string | null;
}

interface PatientDetails {
  firstName: string;
  lastName: string;
}

export const HealthPlanPDF = ({ patientId, onClose }: { patientId: string; onClose: () => void }) => {
  const [healthPlanItems, setHealthPlanItems] = useState<HealthPlanItem[]>([]);
  const [patientDetails, setPatientDetails] = useState<PatientDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchPatientDetails = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', patientId)
          .single();

        if (error) {
          throw error;
        }

        setPatientDetails({
          firstName: data.first_name || '',
          lastName: data.last_name || ''
        });
      } catch (error: any) {
        console.error('Error fetching patient details:', error);
      }
    };

    const fetchHealthPlan = async () => {
      try {
        setIsLoading(true);
        
        const { data, error } = await supabase
          .from('health_plan_items')
          .select('*')
          .eq('patient_id', patientId);

        if (error) {
          throw error;
        }
        
        setHealthPlanItems(data as HealthPlanItem[]);
      } catch (error: any) {
        console.error("Error fetching health plan:", error);
        toast({
          title: "Error",
          description: "Failed to load health plan data",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (patientId && user) {
      fetchPatientDetails();
      fetchHealthPlan();
    }
  }, [patientId, user, toast]);

  const groupItemsByType = (items: HealthPlanItem[]) => {
    const grouped: Record<string, HealthPlanItem[]> = {
      food: [],
      exercise: [],
      medication: []
    };

    items.forEach(item => {
      if (grouped[item.type]) {
        grouped[item.type].push(item);
      }
    });

    return grouped;
  };

  const renderTypeIcon = (type: string) => {
    switch (type) {
      case 'food':
        return <Utensils className="h-5 w-5 text-green-500" />;
      case 'exercise':
        return <Dumbbell className="h-5 w-5 text-blue-500" />;
      case 'medication':
        return <Pill className="h-5 w-5 text-red-500" />;
      default:
        return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };

  const generatePDF = async () => {
    if (!patientDetails) return;
    
    try {
      setIsGenerating(true);
      
      // Create new PDF document
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(18);
      doc.text(`Health Plan for ${patientDetails.firstName} ${patientDetails.lastName}`, 14, 20);
      
      // Add date
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);
      
      // Group items by type
      const groupedItems = groupItemsByType(healthPlanItems);
      
      let yPosition = 40;
      const sectionTitles = {
        food: "Meal Plan",
        exercise: "Exercise Plan",
        medication: "Medication Schedule"
      };
      
      // Add each section to PDF
      for (const [type, items] of Object.entries(groupedItems)) {
        if (items.length > 0) {
          // Add section title
          doc.setFontSize(14);
          doc.setTextColor(0, 0, 0);
          doc.text(sectionTitles[type as keyof typeof sectionTitles], 14, yPosition);
          yPosition += 10;
          
          // Create table data
          const tableData = items.map(item => [
            item.scheduled_time,
            item.description,
            item.frequency,
            item.duration || ''
          ]);
          
          // Add table
          autoTable(doc, {
            startY: yPosition,
            head: [['Time', 'Description', 'Frequency', 'Duration']],
            body: tableData,
            headStyles: { 
              fillColor: type === 'food' ? [76, 175, 80] : 
                        type === 'exercise' ? [33, 150, 243] : [244, 67, 54]
            },
            margin: { left: 14 }
          });
          
          // Update y position for next section
          yPosition = (doc as any).lastAutoTable.finalY + 15;
        }
      }
      
      // Add footer
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      
      if (yPosition > 280) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.text("Please follow this health plan as prescribed by your nutritionist.", 14, yPosition);
      doc.text("Contact your healthcare provider if you have any questions or concerns.", 14, yPosition + 5);
      
      // Generate PDF filename
      const fileName = `health_plan_${patientDetails.lastName.toLowerCase()}_${patientDetails.firstName.toLowerCase()}.pdf`;
      
      // Save the PDF
      doc.save(fileName);
      
      toast({
        title: "Success",
        description: "Health plan PDF has been generated and downloaded",
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Error",
        description: "Failed to generate PDF",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (healthPlanItems.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Health Plan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No health plan items found for this patient.</p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button variant="outline" onClick={onClose}>Back</Button>
        </CardFooter>
      </Card>
    );
  }

  // Group health plan items by type
  const groupedItems = groupItemsByType(healthPlanItems);

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Health Plan for {patientDetails?.firstName} {patientDetails?.lastName}</CardTitle>
        <Button 
          onClick={generatePDF} 
          className="flex items-center gap-2"
          disabled={isGenerating}
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              Download PDF
            </>
          )}
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {Object.entries(groupedItems).map(([type, items]) => (
          items.length > 0 && (
            <div key={type} className="space-y-3">
              <div className="flex items-center gap-2">
                {renderTypeIcon(type)}
                <h3 className="font-semibold capitalize">{type} Plan</h3>
              </div>
              <Separator />
              <div className="space-y-4">
                {items.map(item => (
                  <div key={item.id} className="space-y-1">
                    <div className="flex justify-between">
                      <p className="font-medium">{item.description}</p>
                      <p className="text-sm text-muted-foreground">{item.scheduled_time}</p>
                    </div>
                    <div className="flex gap-2 text-sm text-muted-foreground">
                      <span>{item.frequency}</span>
                      {item.duration && <span>• Duration: {item.duration}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        ))}
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button variant="outline" onClick={onClose}>Back</Button>
      </CardFooter>
    </Card>
  );
};
