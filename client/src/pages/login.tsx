import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, Shield, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

export default function Login() {
  const [accessKey, setAccessKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showAccessKeys, setShowAccessKeys] = useState(false);
  const [accessKeys, setAccessKeys] = useState<Array<{name: string, accessKey: string}>>([]);
  const { toast } = useToast();
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Add a small delay to show loading state
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      const response = await fetch("/api/auth/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ accessKey }),
      });

      const data = await response.json();

      if (data.valid) {
        // Use the auth hook to handle login - router will automatically redirect
        login(accessKey, {
          name: data.user.name,
          color: data.user.color || "purple",
        });
        // Show success toast
        toast({
          title: "Login successful",
          description: `Welcome back, ${data.user.name}!`,
        });
        // Don't reload here since login() handles it
      } else {
        setError("Invalid access key. Please check your key and try again.");
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("Unable to connect to the server. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAccessKeys = async () => {
    try {
      const response = await fetch("/api/access-keys");
      const keys = await response.json();
      setAccessKeys(keys);
      setShowAccessKeys(true);
    } catch (error) {
      console.error("Error fetching access keys:", error);
      toast({
        title: "Error",
        description: "Failed to fetch access keys",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <Shield className="h-12 w-12 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Team Calendar</h1>
          <p className="text-gray-600">Enter your access key to continue</p>
        </div>

        {/* Login Form */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-center text-xl">Secure Access</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="accessKey" className="text-sm font-medium">
                  Access Key
                </label>
                <div className="relative">
                  <Input
                    id="accessKey"
                    type={showKey ? "text" : "password"}
                    value={accessKey}
                    onChange={(e) => setAccessKey(e.target.value)}
                    placeholder="Enter your access key"
                    className="pr-10"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowKey(!showKey)}
                  >
                    {showKey ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || !accessKey.trim()}
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Access Keys Helper */}
        <Card className="border-0 shadow-sm bg-blue-50/50">
          <CardContent className="pt-6">
            <div className="text-center space-y-3">
              <Users className="h-8 w-8 text-blue-600 mx-auto" />
              <div>
                <h3 className="font-semibold text-gray-900">Need your access key?</h3>
                <p className="text-sm text-gray-600">
                  Each team member has a unique access key for privacy
                </p>
              </div>
              <Button
                variant="outline"
                onClick={fetchAccessKeys}
                className="w-full"
                disabled={isLoading}
              >
                Show Access Keys
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Access Keys Display */}
        {showAccessKeys && (
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Team Access Keys</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {accessKeys.map((member) => (
                  <div
                    key={member.name}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                    onClick={async () => {
                      setAccessKey(member.accessKey);
                      setShowAccessKeys(false);
                      // Auto-login when clicking on a team member
                      setIsLoading(true);
                      setError("");
                      
                      // Add a small delay to show loading state
                      await new Promise(resolve => setTimeout(resolve, 100));
                      
                      try {
                        const response = await fetch("/api/auth/validate", {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json",
                          },
                          body: JSON.stringify({ accessKey: member.accessKey }),
                        });

                        const data = await response.json();

                        if (data.valid) {
                          login(member.accessKey, {
                            name: data.user.name,
                            color: data.user.color || "purple",
                          });
                          toast({
                            title: "Login successful",
                            description: `Welcome back, ${data.user.name}!`,
                          });
                        } else {
                          setError("Invalid access key. Please check your key and try again.");
                        }
                      } catch (error) {
                        console.error("Login error:", error);
                        setError("Unable to connect to the server. Please try again.");
                      } finally {
                        setIsLoading(false);
                      }
                    }}
                  >
                    <div className="font-medium text-gray-900">{member.name}</div>
                    <div className="text-sm text-gray-600 font-mono">
                      {member.accessKey}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-xs text-gray-500 text-center">
                Click on any team member to use their access key
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}