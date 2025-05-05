
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Pill, Utensils, Dumbbell, Brain, FileDown } from 'lucide-react';
import { MedicationsTab } from './tabs/MedicationsTab';
import { DietPlanTab } from './tabs/DietPlanTab';
import { ExerciseTab } from './tabs/ExerciseTab';
import { MentalHealthTab } from './tabs/MentalHealthTab';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { generatePdfFromElement } from '@/utils/pdfUtils';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { ResponsiveText } from '@/components/ui/responsive-typography';

interface PrescriptionTabsViewerProps {
  patientId: string;
  className?: string;
}

export const PrescriptionTabsViewer = ({ patientId, className }: PrescriptionTabsViewerProps) => {
  const { toast } = useToast();
  const { userRole } = useAuth();
  const [activeTab, setActiveTab] = useState('medications');
  
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
  
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };
  
  return (
    <div className={cn("w-full", className)}>
      <div className="flex justify-between items-center mb-4 sm:mb-6">
        <ResponsiveText 
          as="h1" 
          mobileSize="lg" 
          tabletSize="xl" 
          desktopSize="2xl" 
          weight="semibold" 
          className="text-amber-700"
        >
          {userRole === 'patient' ? 'Your Prescriptions' : 'Patient Prescriptions'}
        </ResponsiveText>
        <Button 
          variant="outline" 
          onClick={handleDownloadPdf}
          className="hidden md:flex items-center"
          size="sm"
        >
          <FileDown className="h-4 w-4 mr-2" />
          Download PDF
        </Button>
      </div>
      
      <div id="prescription-content">
        <Tabs defaultValue="medications" value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid grid-cols-4 w-full mb-4 sm:mb-6 bg-gray-50/80 shadow-sm border-0 rounded-lg overflow-hidden glass-card-soft">
            <TabsTrigger 
              value="medications" 
              className="flex items-center gap-1.5 py-2 rounded-none border-b-2 border-transparent data-[state=active]:border-amber-600 data-[state=active]:bg-white/80 text-xs sm:text-sm"
            >
              <Pill className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-600" />
              <span className="hidden sm:inline text-sm font-medium">Medications</span>
              <span className="sm:hidden text-xs font-medium">Meds</span>
            </TabsTrigger>
            <TabsTrigger 
              value="diet" 
              className="flex items-center gap-1.5 py-2 rounded-none border-b-2 border-transparent data-[state=active]:border-amber-600 data-[state=active]:bg-white/80 text-xs sm:text-sm"
            >
              <Utensils className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-600" />
              <span className="hidden sm:inline text-sm font-medium">Diet Plan</span>
              <span className="sm:hidden text-xs font-medium">Diet</span>
            </TabsTrigger>
            <TabsTrigger 
              value="exercise" 
              className="flex items-center gap-1.5 py-2 rounded-none border-b-2 border-transparent data-[state=active]:border-amber-600 data-[state=active]:bg-white/80 text-xs sm:text-sm"
            >
              <Dumbbell className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-600" />
              <span className="hidden sm:inline text-sm font-medium">Exercise</span>
              <span className="sm:hidden text-xs font-medium">Exer</span>
            </TabsTrigger>
            <TabsTrigger 
              value="mental" 
              className="flex items-center gap-1.5 py-2 rounded-none border-b-2 border-transparent data-[state=active]:border-amber-600 data-[state=active]:bg-white/80 text-xs sm:text-sm"
            >
              <Brain className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-600" />
              <span className="hidden sm:inline text-sm font-medium">Mental Health</span>
              <span className="sm:hidden text-xs font-medium">Mental</span>
            </TabsTrigger>
          </TabsList>

          <div className="w-full bg-white/80 rounded-xl p-4 sm:p-6 shadow-sm glass-card-soft">
            <TabsContent value="medications" className="mt-0 w-full">
              <MedicationsTab patientId={patientId} />
            </TabsContent>
            
            <TabsContent value="diet" className="mt-0 w-full">
              <DietPlanTab patientId={patientId} />
            </TabsContent>
            
            <TabsContent value="exercise" className="mt-0 w-full">
              <ExerciseTab patientId={patientId} />
            </TabsContent>
            
            <TabsContent value="mental" className="mt-0 w-full">
              <MentalHealthTab patientId={patientId} />
            </TabsContent>
          </div>
        </Tabs>
      </div>
      
      <div className="mt-4 flex justify-center md:hidden">
        <Button 
          variant="outline" 
          onClick={handleDownloadPdf}
          className="w-full sm:w-auto text-sm h-9"
          size="sm"
        >
          <FileDown className="h-3.5 w-3.5 mr-1.5" />
          Download PDF
        </Button>
      </div>
    </div>
  );
}
