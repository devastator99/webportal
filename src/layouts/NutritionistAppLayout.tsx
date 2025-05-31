
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { NutritionistSidebar } from "@/components/dashboard/nutritionist/NutritionistSidebar";

interface NutritionistAppLayoutProps {
  children: React.ReactNode;
}

export function NutritionistAppLayout({ children }: NutritionistAppLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <NutritionistSidebar />
        <SidebarInset className="flex-1">
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
