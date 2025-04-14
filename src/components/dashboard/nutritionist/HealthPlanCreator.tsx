
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, Utensils, Dumbbell, Pill } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HealthPlanItem } from "@/interfaces/HealthPlan";
import { TimePicker } from "@/components/ui/time-picker";

// Component for creating and managing a patient's health plan
export const HealthPlanCreator = ({ patientId }: { patientId: string }) => {
  const [items, setItems] = useState<HealthPlanItem[]>([]);
  const [patientDetails, setPatientDetails] = useState<{ firstName: string; lastName: string } | null>(null);
  const [currentItem, setCurrentItem] = useState<HealthPlanItem>({
    type: 'food',
    scheduled_time: '9:00 AM',
    description: '',
    frequency: 'Daily',
    duration: null
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("food");
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch patient details
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

    if (patientId) {
      fetchPatientDetails();
    }
  }, [patientId]);

  // Fetch existing health plan
  useEffect(() => {
    const fetchExistingHealthPlan = async () => {
      try {
        setIsLoading(true);
        // Use direct query instead of RPC to avoid TypeScript errors
        const { data, error } = await supabase
          .from('health_plan_items')
          .select('*')
          .eq('patient_id', patientId);

        if (error) {
          throw error;
        }

        if (data && Array.isArray(data) && data.length > 0) {
          // Map the data to match our HealthPlanItem interface
          const formattedItems = data.map(item => ({
            id: item.id,
            type: item.type as 'food' | 'exercise' | 'medication',
            scheduled_time: item.scheduled_time,
            description: item.description,
            frequency: item.frequency,
            duration: item.duration
          }));
          
          setItems(formattedItems);
        }
      } catch (error: any) {
        console.error('Error fetching health plan:', error);
        toast({
          title: "Error",
          description: `Failed to load health plan: ${error.message}`,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (patientId && user) {
      fetchExistingHealthPlan();
    }
  }, [patientId, user, toast]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentItem(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setCurrentItem(prev => ({ ...prev, [name]: value }));
  };

  const handleTimeChange = (time: string) => {
    setCurrentItem(prev => ({ ...prev, scheduled_time: time }));
  };

  const addItem = () => {
    // Validate inputs
    if (!currentItem.scheduled_time || !currentItem.description || !currentItem.frequency) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // Add new item to list
    setItems(prev => [...prev, { ...currentItem }]);

    // Reset form for next item but keep the type
    setCurrentItem({
      type: currentItem.type, // Keep the current type
      scheduled_time: '',
      description: '',
      frequency: 'Daily',
      duration: null
    });
  };

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const saveHealthPlan = async () => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "User ID not available",
        variant: "destructive",
      });
      return;
    }

    if (items.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one item to the health plan",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSaving(true);

      // Create items with patient and nutritionist IDs
      const itemsWithIds = items.map(item => ({
        ...item,
        time: item.scheduled_time, // Adjust property name for backend
        patient_id: patientId,
        nutritionist_id: user.id
      }));

      // Use direct database operations instead of RPC to avoid TypeScript errors
      // First delete existing items
      await supabase
        .from('health_plan_items')
        .delete()
        .eq('patient_id', patientId)
        .eq('nutritionist_id', user.id);
      
      // Then insert new items
      const { error } = await supabase
        .from('health_plan_items')
        .insert(itemsWithIds.map(item => ({
          patient_id: patientId,
          nutritionist_id: user.id,
          type: item.type,
          scheduled_time: item.scheduled_time,
          description: item.description,
          frequency: item.frequency,
          duration: item.duration
        })));

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: "Health plan saved successfully",
      });

      // Notify patient via edge function with the entire item list
      try {
        await supabase.functions.invoke('send-health-plan-notification', {
          body: { 
            patientId: patientId,
            nutritionistId: user.id,
            planItems: items
          }
        });
      } catch (notifyError) {
        console.error("Error sending notification:", notifyError);
        // Don't fail the whole operation if notification fails
      }

    } catch (error: any) {
      console.error('Error saving health plan:', error);
      toast({
        title: "Error",
        description: `Failed to save health plan: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Render the appropriate icon based on the type
  const renderTypeIcon = (type: string) => {
    switch (type) {
      case 'food':
        return <Utensils className="h-5 w-5 mr-2" />;
      case 'exercise':
        return <Dumbbell className="h-5 w-5 mr-2" />;
      case 'medication':
        return <Pill className="h-5 w-5 mr-2" />;
      default:
        return <Utensils className="h-5 w-5 mr-2" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card className="max-w-4xl">
      <CardHeader>
        <CardTitle>Create Health Plan</CardTitle>
        <CardDescription>
          Design a personalized health plan for {patientDetails?.firstName} {patientDetails?.lastName}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="food" onClick={() => handleSelectChange('type', 'food')}>
              <Utensils className="h-4 w-4 mr-2" />
              Food
            </TabsTrigger>
            <TabsTrigger value="exercise" onClick={() => handleSelectChange('type', 'exercise')}>
              <Dumbbell className="h-4 w-4 mr-2" />
              Exercise
            </TabsTrigger>
            <TabsTrigger value="medication" onClick={() => handleSelectChange('type', 'medication')}>
              <Pill className="h-4 w-4 mr-2" />
              Medication
            </TabsTrigger>
          </TabsList>

          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TimePicker
                id="scheduled_time"
                label="Time"
                value={currentItem.scheduled_time}
                onChange={handleTimeChange}
              />
              <div className="space-y-2">
                <Label htmlFor="frequency">Frequency <span className="text-red-500">*</span></Label>
                <Select 
                  value={currentItem.frequency} 
                  onValueChange={(value) => handleSelectChange('frequency', value)}
                >
                  <SelectTrigger id="frequency">
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Daily">Daily</SelectItem>
                    <SelectItem value="Weekly">Weekly</SelectItem>
                    <SelectItem value="Twice a week">Twice a week</SelectItem>
                    <SelectItem value="Every other day">Every other day</SelectItem>
                    <SelectItem value="As needed">As needed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description <span className="text-red-500">*</span></Label>
              <Textarea
                id="description"
                name="description"
                value={currentItem.description}
                onChange={handleInputChange}
                placeholder={
                  activeTab === 'food' ? "e.g. Vegetable soup with minimal salt" :
                  activeTab === 'exercise' ? "e.g. 30 minutes of brisk walking" :
                  "e.g. 500mg Metformin"
                }
                className="min-h-[60px]"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="duration">Duration</Label>
              <Input
                id="duration"
                name="duration"
                value={currentItem.duration || ''}
                onChange={handleInputChange}
                placeholder="e.g. 2 weeks, 30 days, Indefinitely"
              />
            </div>

            <Button 
              onClick={addItem} 
              className="w-full md:w-auto flex items-center gap-1"
            >
              <Plus className="h-4 w-4" />
              Add to Health Plan
            </Button>
          </div>
        </Tabs>

        {items.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-medium mb-4">Health Plan Items</h3>
            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="flex items-start justify-between p-3 border rounded-md">
                  <div className="flex items-start">
                    {renderTypeIcon(item.type)}
                    <div>
                      <p className="font-medium">{item.description}</p>
                      <div className="text-sm text-muted-foreground">
                        <span>{item.scheduled_time} • {item.frequency}</span>
                        {item.duration && <span> • {item.duration}</span>}
                      </div>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => removeItem(index)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter>
        <Button 
          onClick={saveHealthPlan} 
          disabled={isSaving || items.length === 0}
          className="w-full md:w-auto"
        >
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Health Plan
        </Button>
      </CardFooter>
    </Card>
  );
};
