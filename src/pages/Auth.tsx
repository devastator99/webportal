import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AuthError } from "@supabase/supabase-js";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userType, setUserType] = useState<"patient" | "doctor" | "nutritionist">("patient");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleAuthError = (error: AuthError) => {
    console.error("Auth error details:", {
      message: error.message,
      status: error.status,
      name: error.name
    });
    
    let errorMessage = "An error occurred during authentication.";
    
    if (error.message?.includes("Email not confirmed")) {
      errorMessage = "Please check your email to confirm your account.";
    } else if (error.message?.includes("Invalid login credentials")) {
      errorMessage = "Invalid email or password. Please try again.";
    } else if (error.message?.includes("User already registered")) {
      errorMessage = "This email is already registered. Please sign in instead.";
    } else if (error.message?.includes("Password should be at least 6 characters")) {
      errorMessage = "Password should be at least 6 characters long.";
    }

    setError(errorMessage);
    toast({
      variant: "destructive",
      title: "Authentication Error",
      description: errorMessage,
    });
  };

  const clearError = () => setError(null);

  const handleTestLogin = async (testEmail: string, testPassword: string) => {
    setLoading(true);
    clearError();
    
    try {
      console.log("Starting test login process for:", testEmail);
      
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword,
      });

      if (signInError) throw signInError;

      if (data?.user) {
        console.log("Test login successful:", {
          user: data.user,
          session: data.session
        });
        
        // Get user role
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', data.user.id)
          .single();

        console.log("User role:", roleData?.role);
        
        toast({
          title: "Login successful!",
          description: `Logged in as ${testEmail} (${roleData?.role || 'unknown role'})`,
        });
        
        // Navigate after a short delay to ensure state updates
        setTimeout(() => {
          navigate("/dashboard");
        }, 500);
      }
    } catch (error: any) {
      console.error("Test login error:", error);
      handleAuthError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    
    if (!email.trim() || !password) {
      setError("Please enter both email and password.");
      return;
    }

    setLoading(true);

    try {
      console.log("Starting login process for:", email);
      
      const { data: { session }, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) throw error;

      if (session?.user) {
        console.log("Login successful:", {
          user: session.user,
          session: session
        });
        
        toast({
          title: "Welcome back!",
          description: "You have successfully signed in.",
        });
        
        // Ensure we're properly redirecting after successful login
        setTimeout(() => {
          navigate("/dashboard");
        }, 100);
      }
    } catch (error: any) {
      handleAuthError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    
    if (!email.trim() || !password) {
      setError("Please enter both email and password.");
      return;
    }

    if (password.length < 6) {
      setError("Password should be at least 6 characters long.");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            user_type: userType,
            full_name: email.split('@')[0],
          }
        },
      });

      if (error) throw error;

      if (data?.user) {
        toast({
          title: "Success",
          description: "Please check your email for verification.",
        });
      }
    } catch (error: any) {
      handleAuthError(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-[#7E69AB]">Welcome to Anubhuti</CardTitle>
          <CardDescription className="text-[#6E59A5]">Sign in to your account or create a new one</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <Tabs defaultValue="login" onValueChange={clearError}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    className="text-[#6E59A5]"
                  />
                </div>
                <div>
                  <Input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    className="text-[#6E59A5]"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-[#9b87f5] hover:bg-[#7E69AB]" 
                  disabled={loading}
                >
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="register">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div>
                  <Input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    className="text-[#6E59A5]"
                  />
                </div>
                <div>
                  <Input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    className="text-[#6E59A5]"
                    minLength={6}
                  />
                </div>
                <div>
                  <Select
                    value={userType}
                    onValueChange={(value: "patient" | "doctor" | "nutritionist") => setUserType(value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select user type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="patient">Patient</SelectItem>
                      <SelectItem value="doctor">Doctor</SelectItem>
                      <SelectItem value="nutritionist">Nutritionist</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-[#9b87f5] hover:bg-[#7E69AB]" 
                  disabled={loading}
                >
                  {loading ? "Signing up..." : "Sign Up"}
                </Button>
              </form>
            </TabsContent>
            
            <div className="mt-6">
              <Separator className="my-4" />
              <h3 className="text-sm font-medium text-[#7E69AB] mb-4">Quick Test Logins</h3>
              <div className="space-y-2">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-[#9b87f5] text-[#7E69AB] hover:bg-[#E5DEFF]"
                  onClick={() => handleTestLogin("doctor@test.com", "test123")}
                  disabled={loading}
                >
                  Login as Test Doctor
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-[#9b87f5] text-[#7E69AB] hover:bg-[#E5DEFF]"
                  onClick={() => handleTestLogin("patient@test.com", "test123")}
                  disabled={loading}
                >
                  Login as Test Patient
                </Button>
              </div>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
