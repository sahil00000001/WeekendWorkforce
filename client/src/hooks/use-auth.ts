import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export interface AuthUser {
  name: string;
  color: string;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [accessKey, setAccessKey] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const storedAccessKey = localStorage.getItem("accessKey");
    const storedUser = localStorage.getItem("currentUser");
    
    if (storedAccessKey && storedUser) {
      validateAccessKey(storedAccessKey);
    } else {
      setIsLoading(false);
    }
  }, []);

  const validateAccessKey = async (key: string) => {
    try {
      const response = await fetch("/api/auth/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ accessKey: key }),
      });

      const data = await response.json();

      if (data.valid) {
        setUser(data.user);
        setAccessKey(key);
        localStorage.setItem("accessKey", key);
        localStorage.setItem("currentUser", data.user.name);
      } else {
        // Clear invalid stored data
        localStorage.removeItem("accessKey");
        localStorage.removeItem("currentUser");
        setUser(null);
        setAccessKey(null);
      }
    } catch (error) {
      console.error("Auth validation error:", error);
      toast({
        title: "Authentication Error",
        description: "Unable to validate access key",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Add this missing login function
  const login = (accessKey: string, userData: AuthUser) => {
    setUser(userData);
    setAccessKey(accessKey);
    localStorage.setItem("accessKey", accessKey);
    localStorage.setItem("currentUser", userData.name);
  };

  const logout = () => {
    localStorage.removeItem("accessKey");
    localStorage.removeItem("currentUser");
    setUser(null);
    setAccessKey(null);
    toast({
      title: "Logged Out",
      description: "You have been logged out successfully",
    });
  };

  return {
    user,
    accessKey,
    isLoading,
    isAuthenticated: !!user,
    login, // Add this to the return object
    logout,
  };
}