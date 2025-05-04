
import { useEffect } from "react";
import { PatientAppLayout } from "@/layouts/PatientAppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePatientHabits } from "@/hooks/usePatientHabits";
import { Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";

const PatientHabitsPage = () => {
  const { isLoading, refetchHealthPlanItems, healthPlanItems, groupedItems, percentages } = usePatientHabits();
  
  useEffect(() => {
    refetchHealthPlanItems();
  }, [refetchHealthPlanItems]);
  
  return (
    <PatientAppLayout showHeader title="Health Habits" description="Track your daily health activities and see your progress">
      <div className="w-full">
        {isLoading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Daily Habits */}
            <Card className="mb-6 w-full">
              <CardHeader>
                <CardTitle>Daily Habits</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!healthPlanItems || healthPlanItems.length === 0 ? (
                  <p className="text-center text-muted-foreground">No habits found. Add some habits to track your progress.</p>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(groupedItems).map(([type, items]) => (
                      items.length > 0 && (
                        <div key={type} className="space-y-3">
                          <h3 className="font-semibold capitalize">{type} Habits</h3>
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
                  </div>
                )}
              </CardContent>
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 w-full">
              <Card className="w-full">
                <CardHeader>
                  <CardTitle>Monthly Tracking</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    Calendar view will be implemented soon
                  </div>
                </CardContent>
              </Card>
              
              <Card className="w-full">
                <CardHeader>
                  <CardTitle>Habits Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <div className="space-y-6 pt-4">
                    {Object.entries(percentages).map(([type, percentage]) => (
                      <div key={type} className="space-y-2">
                        <div className="flex justify-between">
                          <span className="capitalize">{type}</span>
                          <span>{percentage}%</span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card className="w-full">
              <CardHeader>
                <CardTitle>Progress Overview</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Progress chart will be implemented soon
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </PatientAppLayout>
  );
};

export default PatientHabitsPage;
