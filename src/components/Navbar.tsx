import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { LogOut, LogIn, LayoutDashboard, Calendar, Users, Mic } from "lucide-react";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { AuthForm } from "@/components/auth/AuthForm";
import { useAuthHandlers } from "@/hooks/useAuthHandlers";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { ScheduleAppointment } from "@/components/appointments/ScheduleAppointment";
import { VoiceScheduler } from "@/components/voice/VoiceScheduler";

export const Navbar = () => {
  const { user, isLoading, signOut, userRole, resetInactivityTimer, forceSignOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoginMode, setIsLoginMode] = useState(true);
  const { loading, error, handleLogin, handleSignUp } = useAuthHandlers();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [showVoiceScheduler, setShowVoiceScheduler] = useState(false);
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  const isDashboardPage = location.pathname === '/dashboard';
  const isAdminPage = location.pathname === '/admin';
  const isAlternativeDashboard = location.pathname === '/dashboard-alt';
  const isPatientsPage = location.pathname === '/patients';

  const navbarClass = (isDashboardPage || isAlternativeDashboard)
    ? "fixed top-0 w-full bg-white/90 dark:bg-black/90 backdrop-blur-md z-50 border-b border-[#D6BCFA] shadow-sm mb-16" 
    : "fixed top-0 w-full bg-white/90 dark:bg-black/90 backdrop-blur-md z-50 border-b border-[#D6BCFA] shadow-sm";

  useEffect(() => {
    if (user && !isLoading && isDialogOpen) {
      setIsDialogOpen(false);
      resetInactivityTimer();
      if (location.pathname === '/') {
        navigate('/dashboard');
      }
    }
  }, [user, isLoading, navigate, location.pathname, isDialogOpen, resetInactivityTimer]);

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      await signOut();
      toast({
        title: "Successfully signed out",
        description: "You have been signed out of your account",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error signing out",
        description: "There was a problem signing you out. Please try again.",
      });
    } finally {
      setIsSigningOut(false);
    }
  };

  const handleForceLogout = async () => {
    try {
      setIsSigningOut(true);
      toast({
        title: "Logging out...",
        description: "Forcefully signing you out of your account",
      });
      
      await forceSignOut();
      
      toast({
        title: "Logged out",
        description: "You have been successfully signed out",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error signing out",
        description: "There was a problem signing you out. Please try again.",
      });
    } finally {
      setIsSigningOut(false);
    }
  };

  const handleNavigation = (path: string) => {
    resetInactivityTimer();
    navigate(path);
  };

  if (isLoading && !isSigningOut && location.pathname !== '/') {
    return (
      <nav className={navbarClass}>
        <div className="container mx-auto px-4 py-2.5 flex justify-between items-center">
          <div 
            className="text-xl sm:text-2xl font-bold text-[#9b87f5] cursor-pointer" 
            onClick={() => {
              resetInactivityTimer();
              navigate("/");
            }}
          >
            Anoobhooti
          </div>
        </div>
      </nav>
    );
  }

  const renderDoctorActions = () => {
    if (userRole !== 'doctor') return null;
    
    return (
      <>
        {!isPatientsPage && (
          <Button 
            className="text-[#9b87f5] hover:text-[#7E69AB] bg-transparent hover:bg-[#E5DEFF] flex items-center gap-2 text-sm border-0 shadow-none"
            size="sm"
            variant="ghost"
            onClick={() => {
              navigate("/patients");
            }}
          >
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Patients</span>
          </Button>
        )}
        
        <ScheduleAppointment callerRole="doctor">
          <Button 
            className="text-[#9b87f5] hover:text-[#7E69AB] bg-transparent hover:bg-[#E5DEFF] flex items-center gap-2 text-sm border-0 shadow-none"
            size="sm"
            variant="ghost"
          >
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Schedule</span>
          </Button>
        </ScheduleAppointment>

        <Button 
          className="text-[#9b87f5] hover:text-[#7E69AB] bg-transparent hover:bg-[#E5DEFF] flex items-center gap-2 text-sm border-0 shadow-none"
          size="sm"
          variant="ghost"
          onClick={() => setShowVoiceScheduler(true)}
        >
          <Mic className="h-4 w-4" />
          <span className="hidden sm:inline">Voice</span>
        </Button>
      </>
    );
  };

  return (
    <nav className={navbarClass}>
      <div className="container mx-auto px-4 py-2.5 flex justify-between items-center">
        <div 
          className="text-xl sm:text-2xl font-bold text-[#9b87f5] cursor-pointer" 
          onClick={() => {
            resetInactivityTimer();
            navigate("/");
          }}
        >
          Anoobhooti
        </div>
        
        <div className="flex items-center gap-3">
          {user && renderDoctorActions()}
          
          {user && isAdminPage && (
            <Button
              onClick={handleForceLogout}
              variant="destructive"
              className="gap-2 shadow-sm"
              size="sm"
              disabled={isSigningOut}
            >
              <LogOut className="h-4 w-4" />
              <span>{isSigningOut ? "Logging Out..." : "Force Logout"}</span>
            </Button>
          )}
          
          {!user && (
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (open) resetInactivityTimer();
            }}>
              <DialogTrigger asChild>
                <Button 
                  className="bg-[#9b87f5] hover:bg-[#7E69AB] text-white flex items-center gap-2 shadow-md"
                  size="sm"
                  onClick={() => resetInactivityTimer()}
                >
                  <LogIn className="h-4 w-4" />
                  <span className="hidden sm:inline">Sign In</span>
                  <span className="sm:hidden">Login</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] bg-white dark:bg-gray-800">
                <div className="grid gap-4 py-4">
                  <AuthForm
                    type={isLoginMode ? "login" : "register"}
                    onSubmit={isLoginMode ? handleLogin : handleSignUp}
                    error={error}
                    loading={loading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setIsLoginMode(!isLoginMode);
                      resetInactivityTimer();
                    }}
                    disabled={loading}
                  >
                    {isLoginMode ? "Need an account? Sign up" : "Already have an account? Sign in"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
          
          {user && (
            <Button 
              onClick={() => {
                resetInactivityTimer();
                handleSignOut();
              }}
              variant="outline" 
              className="border-[#9b87f5] text-[#7E69AB] hover:bg-[#E5DEFF] gap-2 font-medium shadow-sm"
              size="sm"
              disabled={isSigningOut}
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">{isSigningOut ? "Signing Out..." : "Sign Out"}</span>
              <span className="sm:hidden">{isSigningOut ? "..." : "Logout"}</span>
            </Button>
          )}
        </div>
      </div>
      
      {showVoiceScheduler && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50">
          <div className="w-full max-w-md">
            <VoiceScheduler onClose={() => setShowVoiceScheduler(false)} />
          </div>
        </div>
      )}
    </nav>
  );
};
