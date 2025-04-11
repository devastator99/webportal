
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Heart, Dumbbell, Utensils, Moon, Brain } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export const PatientStats = () => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col items-center text-center space-y-2">
            <Heart className="h-8 w-8 text-red-500 mb-1" />
            <h3 className="font-medium text-sm">Health Status</h3>
            <Progress value={85} className="h-2 w-full" />
            <p className="text-xs text-muted-foreground text-green-500 font-medium">Good</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col items-center text-center space-y-2">
            <Dumbbell className="h-8 w-8 text-blue-500 mb-1" />
            <h3 className="font-medium text-sm">Physical Activity</h3>
            <Progress value={75} className="h-2 w-full" />
            <p className="text-xs text-muted-foreground">75% of goal</p>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col items-center text-center space-y-2">
            <Utensils className="h-8 w-8 text-green-500 mb-1" />
            <h3 className="font-medium text-sm">Nutrition</h3>
            <Progress value={60} className="h-2 w-full" />
            <p className="text-xs text-muted-foreground">60% of goal</p>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col items-center text-center space-y-2">
            <Moon className="h-8 w-8 text-indigo-500 mb-1" />
            <h3 className="font-medium text-sm">Sleep</h3>
            <Progress value={85} className="h-2 w-full" />
            <p className="text-xs text-muted-foreground">85% of goal</p>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col items-center text-center space-y-2">
            <Brain className="h-8 w-8 text-purple-500 mb-1" />
            <h3 className="font-medium text-sm">Mindfulness</h3>
            <Progress value={70} className="h-2 w-full" />
            <p className="text-xs text-muted-foreground">70% of goal</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
