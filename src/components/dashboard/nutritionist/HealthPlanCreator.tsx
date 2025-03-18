
import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Calendar, 
  Clock, 
  Dumbbell, 
  FilePlus, 
  FileText, 
  List, 
  Pill, 
  Plus, 
  SaveAll, 
  Utensils,
  Send
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  prescription?: {
    id: string;
    diagnosis: string;
    prescription: string;
    notes: string;
  };
}

interface HealthPlanItem {
  id?: string;
  type: 'food' | 'exercise' | 'medication';
  time: string;
  description: string;
  frequency: string;
  duration?: string;
}

export const HealthPlanCreator = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<string>("");
  const [selectedPatientData, setSelectedPatientData] = useState<Patient | null>(null);
  const [activeTab, setActiveTab] = useState("create");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [healthPlanItems, setHealthPlanItems] = useState<HealthPlanItem[]>([]);
  const [showItemDialog, setShowItemDialog] = useState(false);
  const [currentItem, setCurrentItem] = useState<HealthPlanItem>({
    type: 'food',
    time: '',
    description: '',
    frequency: 'daily'
  });
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  
  // Fetch patients assigned to this nutritionist
  useEffect(() => {
    const fetchPatients = async () => {
      if (!user?.id) return;
      
      try {
        setIsLoading(true);
        
        // Get patients assigned to this nutritionist
        const { data: assignedPatients, error: assignmentError } = await supabase
          .from('patient_assignments')
          .select('patient_id')
          .eq('nutritionist_id', user.id);
          
        if (assignmentError) {
          throw assignmentError;
        }
        
        if (!assignedPatients || assignedPatients.length === 0) {
          setPatients([]);
          setIsLoading(false);
          return;
        }
        
        // Get patient details
        const patientIds = assignedPatients.map(p => p.patient_id);
        const { data: patientData, error: patientError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .in('id', patientIds);
          
        if (patientError) {
          throw patientError;
        }
        
        setPatients(patientData || []);
      } catch (error: any) {
        console.error("Error fetching patients:", error);
        toast({
          title: "Error",
          description: `Failed to load patients: ${error.message}`,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPatients();
  }, [user?.id, toast]);
  
  // When a patient is selected, fetch their latest prescription
  useEffect(() => {
    const fetchPatientDetails = async () => {
      if (!selectedPatient) {
        setSelectedPatientData(null);
        return;
      }
      
      try {
        setIsLoading(true);
        
        // Get patient details
        const { data: patientData, error: patientError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .eq('id', selectedPatient)
          .single();
          
        if (patientError) {
          throw patientError;
        }
        
        // Get the latest prescription for this patient
        const { data: prescriptionData, error: prescriptionError } = await supabase
          .from('medical_records')
          .select('id, diagnosis, prescription, notes')
          .eq('patient_id', selectedPatient)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
          
        if (prescriptionError && prescriptionError.code !== 'PGRST116') {
          throw prescriptionError;
        }
        
        setSelectedPatientData({
          ...patientData,
          prescription: prescriptionData || undefined
        });
        
        // Fetch existing health plan items for this patient
        const { data: healthPlanData, error: healthPlanError } = await supabase
          .from('health_plan_items')
          .select('*')
          .eq('patient_id', selectedPatient)
          .order('time');
          
        if (healthPlanError) {
          throw healthPlanError;
        }
        
        if (healthPlanData && healthPlanData.length > 0) {
          setHealthPlanItems(healthPlanData);
        } else {
          setHealthPlanItems([]);
        }
        
      } catch (error: any) {
        console.error("Error fetching patient details:", error);
        toast({
          title: "Error",
          description: `Failed to load patient details: ${error.message}`,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPatientDetails();
  }, [selectedPatient, toast]);
  
  const handleAddItem = () => {
    setCurrentItem({
      type: 'food',
      time: '',
      description: '',
      frequency: 'daily'
    });
    setEditingItemIndex(null);
    setShowItemDialog(true);
  };
  
  const handleEditItem = (index: number) => {
    setCurrentItem(healthPlanItems[index]);
    setEditingItemIndex(index);
    setShowItemDialog(true);
  };
  
  const handleDeleteItem = (index: number) => {
    const newItems = [...healthPlanItems];
    newItems.splice(index, 1);
    setHealthPlanItems(newItems);
  };
  
  const handleSaveItem = () => {
    if (!currentItem.time || !currentItem.description) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    
    const newItems = [...healthPlanItems];
    
    if (editingItemIndex !== null) {
      newItems[editingItemIndex] = currentItem;
    } else {
      newItems.push(currentItem);
    }
    
    // Sort items by time
    newItems.sort((a, b) => {
      return a.time.localeCompare(b.time);
    });
    
    setHealthPlanItems(newItems);
    setShowItemDialog(false);
  };
  
  const handleSaveHealthPlan = async () => {
    if (!selectedPatient) {
      toast({
        title: "Error",
        description: "Please select a patient",
        variant: "destructive",
      });
      return;
    }
    
    if (healthPlanItems.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one health plan item",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsSaving(true);
      
      // First, delete any existing health plan items for this patient
      const { error: deleteError } = await supabase
        .from('health_plan_items')
        .delete()
        .eq('patient_id', selectedPatient);
        
      if (deleteError) {
        throw deleteError;
      }
      
      // Then, insert the new health plan items
      const itemsToInsert = healthPlanItems.map(item => ({
        patient_id: selectedPatient,
        nutritionist_id: user?.id,
        type: item.type,
        time: item.time,
        description: item.description,
        frequency: item.frequency,
        duration: item.duration || null
      }));
      
      const { error: insertError } = await supabase
        .from('health_plan_items')
        .insert(itemsToInsert);
        
      if (insertError) {
        throw insertError;
      }
      
      // Send notification to patient
      try {
        await supabase.functions.invoke('send-health-plan-notification', {
          body: { 
            patientId: selectedPatient,
            nutritionistId: user?.id,
            planItems: healthPlanItems.length
          }
        });
      } catch (notifyError) {
        console.error("Error sending notification:", notifyError);
        // Don't fail the whole operation if notification fails
      }
      
      toast({
        title: "Success",
        description: "Health plan saved successfully",
      });
      
    } catch (error: any) {
      console.error("Error saving health plan:", error);
      toast({
        title: "Error",
        description: `Failed to save health plan: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleSendReminders = async () => {
    if (!selectedPatient) {
      toast({
        title: "Error",
        description: "Please select a patient",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsSaving(true);
      
      const response = await supabase.functions.invoke('send-health-plan-reminders', {
        body: { 
          patientId: selectedPatient,
          nutritionistId: user?.id
        }
      });
      
      toast({
        title: "Success",
        description: "Health plan reminders sent successfully",
      });
      
    } catch (error: any) {
      console.error("Error sending reminders:", error);
      toast({
        title: "Error",
        description: `Failed to send reminders: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const getItemTypeIcon = (type: string) => {
    switch (type) {
      case 'food':
        return <Utensils className="h-4 w-4" />;
      case 'exercise':
        return <Dumbbell className="h-4 w-4" />;
      case 'medication':
        return <Pill className="h-4 w-4" />;
      default:
        return <List className="h-4 w-4" />;
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FilePlus className="h-5 w-5" />
          Health Plan Creator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="patient-select">Select Patient</Label>
          <Select 
            value={selectedPatient} 
            onValueChange={setSelectedPatient}
            disabled={isLoading}
          >
            <SelectTrigger id="patient-select">
              <SelectValue placeholder="Select a patient" />
            </SelectTrigger>
            <SelectContent>
              {patients.length === 0 ? (
                <SelectItem value="none" disabled>No patients assigned</SelectItem>
              ) : (
                patients.map((patient) => (
                  <SelectItem key={patient.id} value={patient.id}>
                    {patient.first_name} {patient.last_name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        {selectedPatientData && (
          <>
            {selectedPatientData.prescription && (
              <Card className="bg-muted/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Latest Prescription
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium mb-1">Diagnosis</h4>
                      <p className="text-muted-foreground">{selectedPatientData.prescription.diagnosis}</p>
                    </div>
                    <Separator />
                    <div>
                      <h4 className="font-medium mb-1">Prescription</h4>
                      <p className="text-muted-foreground whitespace-pre-line">{selectedPatientData.prescription.prescription}</p>
                    </div>
                    {selectedPatientData.prescription.notes && (
                      <>
                        <Separator />
                        <div>
                          <h4 className="font-medium mb-1">Additional Notes</h4>
                          <p className="text-muted-foreground whitespace-pre-line">{selectedPatientData.prescription.notes}</p>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="create" className="flex items-center gap-2">
                  <Plus className="h-4 w-4" /> Create Health Plan
                </TabsTrigger>
                <TabsTrigger value="send" className="flex items-center gap-2">
                  <Send className="h-4 w-4" /> Send Reminders
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="create" className="space-y-4 pt-4">
                <div className="flex flex-col space-y-2">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Health Plan Items</h3>
                    <Button onClick={handleAddItem} size="sm" variant="outline" className="gap-1">
                      <Plus className="h-4 w-4" /> Add Item
                    </Button>
                  </div>
                  
                  {healthPlanItems.length === 0 ? (
                    <div className="text-center p-4 border rounded-md bg-muted/30">
                      <p className="text-muted-foreground">No health plan items. Click 'Add Item' to create one.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {healthPlanItems.map((item, index) => (
                        <div 
                          key={index} 
                          className="p-3 border rounded-md flex justify-between items-start hover:bg-accent/10"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="flex items-center gap-1">
                                {getItemTypeIcon(item.type)}
                                <span className="capitalize">{item.type}</span>
                              </Badge>
                              <Badge variant="outline" className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {item.time}
                              </Badge>
                              <Badge variant="outline" className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span className="capitalize">{item.frequency}</span>
                              </Badge>
                            </div>
                            <p className="text-sm">{item.description}</p>
                            {item.duration && (
                              <p className="text-xs text-muted-foreground">Duration: {item.duration}</p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-8 w-8 p-0"
                              onClick={() => handleEditItem(index)}
                            >
                              <span className="sr-only">Edit</span>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="h-4 w-4"
                              >
                                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                                <path d="m15 5 4 4" />
                              </svg>
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive/90"
                              onClick={() => handleDeleteItem(index)}
                            >
                              <span className="sr-only">Delete</span>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="h-4 w-4"
                              >
                                <path d="M3 6h18" />
                                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                <line x1="10" x2="10" y1="11" y2="17" />
                                <line x1="14" x2="14" y1="11" y2="17" />
                              </svg>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="flex justify-end pt-4">
                  <Button
                    onClick={handleSaveHealthPlan}
                    disabled={isSaving || healthPlanItems.length === 0}
                    className="gap-2"
                  >
                    <SaveAll className="h-4 w-4" />
                    {isSaving ? "Saving..." : "Save Health Plan"}
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="send" className="space-y-4 pt-4">
                <div className="p-4 border rounded-md bg-muted/30">
                  <h3 className="text-lg font-medium mb-2">Send Health Plan Reminders</h3>
                  <p className="text-muted-foreground mb-4">
                    Send WhatsApp and SMS reminders to the patient for their scheduled health plan items.
                  </p>
                  
                  <div className="flex justify-end">
                    <Button
                      onClick={handleSendReminders}
                      disabled={isSaving || healthPlanItems.length === 0}
                      className="gap-2"
                    >
                      <Send className="h-4 w-4" />
                      {isSaving ? "Sending..." : "Send Reminders"}
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
        
        <Dialog open={showItemDialog} onOpenChange={setShowItemDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingItemIndex !== null ? "Edit Health Plan Item" : "Add Health Plan Item"}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="item-type">Type</Label>
                <Select 
                  value={currentItem.type} 
                  onValueChange={(value) => setCurrentItem({...currentItem, type: value as 'food' | 'exercise' | 'medication'})}
                >
                  <SelectTrigger id="item-type">
                    <SelectValue placeholder="Select item type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="food">Food</SelectItem>
                    <SelectItem value="exercise">Exercise</SelectItem>
                    <SelectItem value="medication">Medication</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="item-time">Time</Label>
                <Input
                  id="item-time"
                  type="time"
                  value={currentItem.time}
                  onChange={(e) => setCurrentItem({...currentItem, time: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="item-frequency">Frequency</Label>
                <Select 
                  value={currentItem.frequency} 
                  onValueChange={(value) => setCurrentItem({...currentItem, frequency: value})}
                >
                  <SelectTrigger id="item-frequency">
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="item-description">Description</Label>
                <Textarea
                  id="item-description"
                  value={currentItem.description}
                  onChange={(e) => setCurrentItem({...currentItem, description: e.target.value})}
                  placeholder={
                    currentItem.type === 'food' 
                      ? "E.g., Protein-rich breakfast with eggs and vegetables" 
                      : currentItem.type === 'exercise' 
                        ? "E.g., 30 minutes of brisk walking" 
                        : "E.g., Take 1 tablet of medication X with water"
                  }
                  className="min-h-[100px]"
                />
              </div>
              
              {currentItem.type === 'exercise' && (
                <div className="space-y-2">
                  <Label htmlFor="item-duration">Duration (optional)</Label>
                  <Input
                    id="item-duration"
                    value={currentItem.duration || ""}
                    onChange={(e) => setCurrentItem({...currentItem, duration: e.target.value})}
                    placeholder="E.g., 30 minutes"
                  />
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowItemDialog(false)}>
                Cancel
              </Button>
              <Button type="button" onClick={handleSaveItem}>
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};
