import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { AuthForm } from "@/components/auth/AuthForm";
import { TestLoginButtons } from "@/components/auth/TestLoginButtons";
import { useAuthHandlers } from "@/hooks/useAuthHandlers";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Auth = () => {
  const {
    loading,
    error,
    handleLogin,
    handleSignUp,
    handleTestLogin,
    setError,
  } = useAuthHandlers();

  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("login");

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSignUpSuccess = () => {
    setActiveTab("login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-[#7E69AB]">Welcome to Anubhuti</CardTitle>
          <CardDescription className="text-[#6E59A5]">
            Sign in to your account or create a new one
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <AuthForm
                type="login"
                onSubmit={handleLogin}
                error={error}
                loading={loading}
              />
            </TabsContent>
            
            <TabsContent value="register">
              <AuthForm
                type="register"
                onSubmit={async (email, password, userType) => {
                  await handleSignUp(email, password, userType);
                  handleSignUpSuccess();
                }}
                error={error}
                loading={loading}
              />
            </TabsContent>
            
            <div className="mt-6">
              <Separator className="my-4" />
              <h3 className="text-sm font-medium text-[#7E69AB] mb-4">
                Quick Test Logins
              </h3>
              <TestLoginButtons
                onTestLogin={handleTestLogin}
                loading={loading}
              />
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;