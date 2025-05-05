
import { Card, CardContent } from "@/components/ui/card";
import { useResponsive } from "@/contexts/ResponsiveContext";
import { Activity, Heart, Brain, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface StatItemProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  description: string;
  status: 'good' | 'warning' | 'poor' | 'neutral';
}

const StatusIndicator = ({ status }: { status: 'good' | 'warning' | 'poor' | 'neutral' }) => {
  // Define status colors and icons
  const statusConfig = {
    good: { icon: <TrendingUp className="h-3 w-3" />, color: "bg-green-100 text-green-600" },
    warning: { icon: <Minus className="h-3 w-3" />, color: "bg-amber-100 text-amber-600" },
    poor: { icon: <TrendingDown className="h-3 w-3" />, color: "bg-red-100 text-red-600" },
    neutral: { icon: <Minus className="h-3 w-3" />, color: "bg-gray-100 text-gray-600" }
  };

  return (
    <div className={cn("flex items-center justify-center rounded-full p-1", statusConfig[status].color)}>
      {statusConfig[status].icon}
    </div>
  );
};

const StatItem = ({ label, value, icon, description, status }: StatItemProps) => {
  const { isMobile } = useResponsive();
  
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn(
            "flex items-center gap-2 px-3 py-1 hover:bg-slate-50 transition-colors rounded-md",
            isMobile ? "min-w-[110px]" : ""
          )}>
            <div className="bg-[#E5DEFF] p-1 rounded-full">
              {icon}
            </div>
            
            <div>
              <div className="flex items-center gap-1.5">
                <p className="font-semibold text-base">{value}</p>
                <StatusIndicator status={status} />
              </div>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent className="max-w-[200px] text-xs">
          {description}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export const PatientStats = () => {
  const { isMobile, isTablet } = useResponsive();
  
  const stats = [
    {
      label: "Activity",
      value: "Good",
      icon: <Activity className="h-3 w-3 text-[#9b87f5]" />,
      description: "Based on your recent activities and exercise patterns",
      status: 'good' as const
    },
    {
      label: "Mental",
      value: "Stable",
      icon: <Brain className="h-3 w-3 text-[#9b87f5]" />,
      description: "From your latest mental health check-in assessment",
      status: 'warning' as const
    },
    {
      label: "Heart",
      value: "72 bpm",
      icon: <Heart className="h-3 w-3 text-[#9b87f5]" />,
      description: "Average heart rate over the last 24 hours",
      status: 'good' as const
    }
  ];

  return (
    <Card className="shadow-sm hover:shadow-md transition-all duration-200 mb-4">
      <CardContent className={cn("p-0", isMobile ? "py-2" : "py-3")}>
        <div className="flex items-center justify-between mb-0.5 px-3">
          <h3 className="text-xs font-medium text-muted-foreground">Health Stats</h3>
          <Badge variant="outline" className="text-[10px] bg-[#E5DEFF]/50 text-[#9b87f5] font-medium">Daily</Badge>
        </div>
        
        {isMobile ? (
          <ScrollArea orientation="horizontal" className="w-full pb-1">
            <div className="flex items-center gap-1 px-1 py-1 w-fit">
              {stats.map((stat, index) => (
                <StatItem 
                  key={index}
                  label={stat.label}
                  value={stat.value}
                  icon={stat.icon}
                  description={stat.description}
                  status={stat.status}
                />
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="flex items-center justify-between px-1 py-1 divide-x divide-slate-100">
            {stats.map((stat, index) => (
              <div key={index} className={cn("flex-1", index === 0 ? "pl-2" : "pl-3")}>
                <StatItem 
                  label={stat.label}
                  value={stat.value}
                  icon={stat.icon}
                  description={stat.description}
                  status={stat.status}
                />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
