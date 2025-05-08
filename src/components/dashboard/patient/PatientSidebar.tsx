
import { Home, MessageCircle, FileText, Activity, Video, UserRound, Menu } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { SignOutButton } from "@/components/auth/SignOutButton";
import '@/components/ui/sidebar-variables.css';

export function PatientSidebar() {
  const location = useLocation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { toggleSidebar } = useSidebar();
  
  if (!user) return null;

  // Define menu items with correct routes for patients - same as in MobileNavigation
  const menuItems = [
    {
      title: "Dashboard",
      icon: Home,
      path: "/dashboard"
    },
    {
      title: "Chat",
      icon: MessageCircle,
      path: "/chat"
    },
    {
      title: "Prescriptions",
      icon: FileText,
      path: "/prescriptions"
    },
    {
      title: "Habits",
      icon: Activity,
      path: "/patient-habits"
    },
    {
      title: "Videos",
      icon: Video,
      path: "/videos"
    },
    {
      title: "Profile",
      icon: UserRound,
      path: "/patient-profile"
    }
  ];

  // Function to check if a path is active, including handling nested routes
  const isPathActive = (path: string): boolean => {
    if (path === '/videos' && location.pathname === '/videos') {
      return true;
    }

    // For prescriptions path, match any route that includes /prescriptions/
    if (path.includes('/prescriptions') && location.pathname.includes('/prescriptions')) {
      return true;
    }
    
    // For user profile, match both /patient-profile and /notifications
    if (path === '/patient-profile' && 
        (location.pathname === '/patient-profile' || location.pathname === '/notifications')) {
      return true;
    }
    
    // Default exact matching for other routes
    return location.pathname === path;
  };

  // Sidebar content that will be used in both mobile and desktop
  const SidebarMenuContent = ({ showHeading = true }) => (
    <>
      {showHeading && (
        <div className="p-4 mb-4">
          <h1 className="text-2xl font-semibold text-[#7E69AB]">AnubhootiHealth</h1>
        </div>
      )}
      <SidebarMenu>
        {menuItems.map((item) => (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton
              asChild
              isActive={isPathActive(item.path)}
              tooltip={item.title}
            >
              <Link
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-4 py-2 rounded-lg transition-colors",
                  isPathActive(item.path)
                    ? "bg-[#9b87f5] text-white"
                    : "text-[#403E43] hover:bg-[#E5DEFF] hover:text-[#7E69AB]"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.title}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
        
        {/* Add SignOut button */}
        <SidebarMenuItem>
          <div className="px-4 py-2">
            <SignOutButton 
              variant="ghost" 
              className="w-full justify-start text-[#403E43] hover:bg-[#E5DEFF] hover:text-[#7E69AB]" 
            />
          </div>
        </SidebarMenuItem>
      </SidebarMenu>
    </>
  );

  // Mobile sidebar using Sheet component
  if (isMobile) {
    return (
      <>
        <div className="fixed top-0 left-0 right-0 z-50 p-4 bg-white/10 backdrop-blur-lg border-b border-white/20">
          <div className="flex justify-between items-center">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-[#7E69AB]">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Toggle Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent 
                side="left" 
                className="w-[var(--sidebar-width-mobile)] p-0 bg-[#F1F0FB] border-r border-[#9b87f5]/20"
              >
                <div className="h-full overflow-y-auto pt-4">
                  <SidebarGroupContent>
                    <SidebarMenuContent showHeading={true} />
                  </SidebarGroupContent>
                </div>
              </SheetContent>
            </Sheet>
            <h1 className="text-xl font-semibold text-[#7E69AB]">AnubhootiHealth</h1>
            <div className="w-10" /> {/* Empty div for centering */}
          </div>
        </div>
      </>
    );
  }

  // Desktop sidebar - use CSS variables for consistent sizing
  return (
    <Sidebar 
      className="min-h-screen bg-white/10 backdrop-blur-lg border-r border-white/20"
      style={{ 
        width: 'var(--sidebar-width)', 
        flexShrink: 0 
      }}
    >
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenuContent />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
