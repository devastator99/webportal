
import { Home, MessageCircle, FileText, Activity, Video, UserRound } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

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
    path: "/habits"
  },
  {
    title: "Videos",
    icon: Video,
    path: "/videos"
  },
  {
    title: "Profile",
    icon: UserRound,
    path: "/profile"
  }
];

export function PatientSidebar() {
  const location = useLocation();
  const { user } = useAuth();
  
  if (!user) return null;

  return (
    <Sidebar className="bg-white/10 backdrop-blur-lg border-r border-white/20">
      <SidebarContent>
        <SidebarGroup>
          <div className="p-4 mb-4">
            <h1 className="text-2xl font-semibold text-[#7E69AB]">AnubhootiHealth</h1>
          </div>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === item.path}
                    tooltip={item.title}
                  >
                    <Link
                      to={item.path}
                      className={cn(
                        "flex items-center gap-3 px-4 py-2 rounded-lg transition-colors",
                        location.pathname === item.path
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
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
