import { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useToast } from "@/hooks/use-toast";

interface AuthContextType {
  isAuthenticated: boolean;
  isProtected: boolean;
  isLoading: boolean;
  login: (password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
}

// Create context with default values
const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isProtected: false,
  isLoading: true,
  login: async () => false,
  logout: async () => {},
  changePassword: async () => false,
});

// Hook to use the auth context
export function useAuth() {
  return useContext(AuthContext);
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isProtected, setIsProtected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { toast } = useToast();
  
  // Check authentication status on initial load
  useEffect(() => {
    checkAuthStatus();
  }, []);
  
  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/auth/check');
      const data = await response.json();
      
      if (response.ok) {
        setIsAuthenticated(data.isAuthenticated);
        setIsProtected(data.isProtected);
      } else {
        // If the API call fails, assume not authenticated as a fallback
        setIsAuthenticated(false);
        setIsProtected(true);
      }
    } catch (error) {
      console.error('Authentication check failed', error);
      // On error, assume not authenticated as a fallback
      setIsAuthenticated(false);
      setIsProtected(true);
    } finally {
      setIsLoading(false);
    }
  };
  
  const login = async (password: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setIsAuthenticated(true);
        toast({
          title: "Logged in successfully",
          description: "Welcome to Farm Inventory Management",
        });
        return true;
      } else {
        toast({
          title: "Login failed",
          description: data.message || "Invalid password",
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      console.error('Login error', error);
      toast({
        title: "Login error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
      return false;
    }
  };
  
  const logout = async (): Promise<void> => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
      setIsAuthenticated(false);
      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
      });
    } catch (error) {
      console.error('Logout error', error);
      toast({
        title: "Logout error",
        description: "An error occurred during logout",
        variant: "destructive"
      });
    }
  };
  
  const changePassword = async (currentPassword: string, newPassword: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        toast({
          title: "Password changed",
          description: "Your password has been changed successfully",
        });
        return true;
      } else {
        toast({
          title: "Password change failed",
          description: data.message || "Failed to change password",
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      console.error('Password change error', error);
      toast({
        title: "Password change error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
      return false;
    }
  };
  
  const value = {
    isAuthenticated,
    isProtected,
    isLoading,
    login,
    logout,
    changePassword
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}