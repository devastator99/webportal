
import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, Brain, MessageSquare, Activity, FileSpreadsheet } from "lucide-react";
import { PrescriptionWriter } from "./prescription/PrescriptionWriter";
import { PrescriptionHistory } from "./prescription/PrescriptionHistory";

interface PatientDetailsProps {
  patientId: string;
}

export const PatientDetails = ({ patientId }: PatientDetailsProps) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("chat");
  const [showPrescription, setShowPrescription] = useState(false);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate("/doctor-dashboard")}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
        <div className="flex gap-2">
          <Button 
            variant="secondary"
            onClick={() => {}}
            className="gap-2"
          >
            <Brain className="h-4 w-4" />
            Analyze Conversation
          </Button>
          <Button 
            variant="secondary"
            onClick={() => setShowPrescription(true)}
            className="gap-2"
          >
            <FileText className="h-4 w-4" />
            Write Prescription
          </Button>
        </div>
      </div>

      {showPrescription ? (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Prescriptions</h2>
            <Button variant="outline" onClick={() => setShowPrescription(false)}>
              Back to Chat
            </Button>
          </div>
          <Tabs defaultValue="write">
            <TabsList>
              <TabsTrigger value="write">Write Prescription</TabsTrigger>
              <TabsTrigger value="history">Prescription History</TabsTrigger>
            </TabsList>
            <TabsContent value="write">
              <PrescriptionWriter patientId={patientId} />
            </TabsContent>
            <TabsContent value="history">
              <PrescriptionHistory patientId={patientId} />
            </TabsContent>
          </Tabs>
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="chat">
              <MessageSquare className="h-4 w-4 mr-2" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="habits">
              <Activity className="h-4 w-4 mr-2" />
              Habits
            </TabsTrigger>
            <TabsTrigger value="timeline">
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Timeline
            </TabsTrigger>
            <TabsTrigger value="notes">
              <FileText className="h-4 w-4 mr-2" />
              Notes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="mt-4">
            <Card className="p-4">
              Chat content will go here
            </Card>
          </TabsContent>

          <TabsContent value="habits" className="mt-4">
            <Card className="p-4">
              Habits tracking will go here
            </Card>
          </TabsContent>

          <TabsContent value="timeline" className="mt-4">
            <Card className="p-4">
              Patient timeline will go here
            </Card>
          </TabsContent>

          <TabsContent value="notes" className="mt-4">
            <Card className="p-4">
              Doctor's notes will go here
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};
