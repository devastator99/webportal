
import { Card } from "@/components/ui/card";
import { useResponsive } from "@/contexts/ResponsiveContext";
import { Activity, Heart, Brain } from "lucide-react";

export const PatientStats = () => {
  const { isMobile, isTablet } = useResponsive();
  
  const stats = [
    {
      label: "Physical Activity",
      value: "Good",
      icon: <Activity className="h-4 w-4 text-[#9b87f5]" />,
      description: "Based on your recent activities"
    },
    {
      label: "Mental Health",
      value: "Stable",
      icon: <Brain className="h-4 w-4 text-[#9b87f5]" />,
      description: "From your latest check-in"
    },
    {
      label: "Heart Rate",
      value: "72 bpm",
      icon: <Heart className="h-4 w-4 text-[#9b87f5]" />,
      description: "Average over last 24h"
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {stats.map((stat, index) => (
        <Card key={index} className="p-4 transition-all duration-200 hover:shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
              <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
              <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
            </div>
            <div className="bg-[#E5DEFF] p-2 rounded-full">
              {stat.icon}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};
