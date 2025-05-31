
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { NutritionistAppLayout } from "@/layouts/NutritionistAppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Users, Plus } from "lucide-react";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { useState } from "react";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const NutritionistCalendarPage = () => {
  const { user, userRole, isLoading } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [startTime, setStartTime] = useState("09:00 AM");
  const [endTime, setEndTime] = useState("05:00 PM");

  const timeOptions = [
    "08:00 AM", "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
    "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM",
    "06:00 PM", "07:00 PM", "08:00 PM"
  ];

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (userRole !== "nutritionist") {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <NutritionistAppLayout>
      <div className="container mx-auto pt-6 pb-6 px-6 space-y-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[#7E69AB] flex items-center gap-2">
            <Calendar className="h-8 w-8" />
            Calendar & Availability
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage your schedule and availability for patient consultations
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Calendar</CardTitle>
              <CardDescription>Select a date to manage your availability</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <CalendarComponent
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border shadow-sm"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Manage Schedule</CardTitle>
              <CardDescription>
                {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'Select a date'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="availability" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="availability">Set Availability</TabsTrigger>
                  <TabsTrigger value="appointments">View Appointments</TabsTrigger>
                </TabsList>
                
                <TabsContent value="availability" className="space-y-4">
                  {selectedDate && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="startTime">Start Time</Label>
                        <Select value={startTime} onValueChange={setStartTime}>
                          <SelectTrigger id="startTime">
                            <SelectValue placeholder="Select start time" />
                          </SelectTrigger>
                          <SelectContent>
                            {timeOptions.map((time) => (
                              <SelectItem key={time} value={time}>
                                {time}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="endTime">End Time</Label>
                        <Select value={endTime} onValueChange={setEndTime}>
                          <SelectTrigger id="endTime">
                            <SelectValue placeholder="Select end time" />
                          </SelectTrigger>
                          <SelectContent>
                            {timeOptions.map((time) => (
                              <SelectItem key={time} value={time}>
                                {time}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <Button className="w-full mt-4">
                        <Plus className="h-4 w-4 mr-2" />
                        Save Availability
                      </Button>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="appointments">
                  {selectedDate && (
                    <div className="space-y-4">
                      <div className="text-center text-muted-foreground py-8">
                        <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>No appointments scheduled for this day</p>
                        <p className="text-sm">Your availability will show here once set</p>
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Appointments Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Upcoming Appointments
            </CardTitle>
            <CardDescription>
              Your scheduled patient consultations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center text-muted-foreground py-8">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No upcoming appointments</p>
              <p className="text-sm">Appointments will appear here once scheduled</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </NutritionistAppLayout>
  );
};

export default NutritionistCalendarPage;
