
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search } from "lucide-react";
import { EmailMessageSearch } from "@/components/chat/EmailMessageSearch";
import { MobileNavigation } from "@/components/mobile/MobileNavigation";
import { useIsMobile } from "@/hooks/use-mobile";

const MessageSearchPage = () => {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  // Redirect if not admin or doctor
  useEffect(() => {
    if (!user) {
      navigate("/auth");
    } else if (userRole !== "administrator" && userRole !== "doctor") {
      navigate("/dashboard");
    }
  }, [user, userRole, navigate]);

  if (!user || (userRole !== "administrator" && userRole !== "doctor")) {
    return null;
  }

  return (
    <div className="flex flex-col min-h-screen pt-16 md:pt-20">
      <div className="container mx-auto py-4 px-4 max-w-7xl flex-1 flex flex-col h-[calc(100vh-70px)] overflow-hidden">
        <Card className="h-full flex flex-col overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Message Search
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 h-full flex-1 overflow-hidden">
            <EmailMessageSearch />
          </CardContent>
        </Card>
      </div>
      {isMobile && <MobileNavigation />}
    </div>
  );
};

export default MessageSearchPage;
