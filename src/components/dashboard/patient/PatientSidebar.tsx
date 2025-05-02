
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
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

export function PatientSidebar() {
  const location = useLocation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { toggleSidebar } = useSidebar();
  
  if (!user) return null;

  // Define menu items with correct routes for patients
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
      path: user?.id ? `/prescriptions/${user.id}` : "/prescriptions"
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

  // Sidebar content that will be used in both mobile and desktop
  // Modified to accept a showHeading prop
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
              isActive={location.pathname === item.path || location.pathname.startsWith(`${item.path}/`)}
              tooltip={item.title}
            >
              <Link
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-4 py-2 rounded-lg transition-colors",
                  (location.pathname === item.path || location.pathname.startsWith(`${item.path}/`))
                    ? "bg-[#9b87f5] text-white"
                    : "text-[#7E69AB] hover:bg-[#E5DEFF]"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.title}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </>
  );

  // Mobile sidebar using Sheet component - improved for better visibility
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
                className="w-64 p-0 bg-white/10 backdrop-blur-lg border-r border-white/20"
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

  // Desktop sidebar
  return (
    <Sidebar className="bg-white/10 backdrop-blur-lg border-r border-white/20">
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
