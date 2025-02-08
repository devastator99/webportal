
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { forceSignOut } from "@/utils/authUtils";
import { AlertTriangle } from "lucide-react";

export const DashboardSkeleton = () => {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Button 
          onClick={forceSignOut}
          variant="destructive" 
          className="gap-2"
        >
          <AlertTriangle className="h-4 w-4" />
          Clear Session
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Skeleton className="h-[400px]" />
          <Skeleton className="h-[400px]" />
        </div>
        <Skeleton className="h-[820px]" />
      </div>
    </div>
  );
};
