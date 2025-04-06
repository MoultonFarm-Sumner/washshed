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
  
  // Helper function to check for client-side cookie
  const checkClientCookies = (): boolean => {
    const cookieStr = document.cookie;
    return cookieStr.includes('isLoggedIn=true');
  };
  
  // Initial authentication check on component mount
  useEffect(() => {
    // Only run this on first load
    checkAuthStatus();
    
    // Set up a periodic auth check every 15 seconds to keep session active
    const intervalId = setInterval(() => {
      checkAuthStatus(false);
    }, 15000);
    
    return () => clearInterval(intervalId);
  }, []);
  
  // Handle path changes for authentication
  useEffect(() => {
    // Add event listener for pathname changes
    const handlePathChange = () => {
      const currentPath = window.location.pathname;
      // Check if we need to redirect
      if (
        currentPath !== '/login' && 
        !isAuthenticated && 
        !isLoading && 
        isProtected
      ) {
        console.log('Redirecting to login from path:', currentPath);
        window.location.href = '/login';
      }
    };
    
    // Listen for popstate to catch browser back/forward navigation
    window.addEventListener('popstate', handlePathChange);
    
    // Initial check
    handlePathChange();
    
    return () => {
      window.removeEventListener('popstate', handlePathChange);
    };
  }, [isAuthenticated, isLoading, isProtected]);
  
  const checkAuthStatus = async (showLoading = true) => {
    try {
      if (showLoading) setIsLoading(true);
      
      const currentPath = window.location.pathname;
      console.log('Checking auth status, current path:', currentPath);
      const response = await fetch('/api/auth/check');
      const data = await response.json();
      
      console.log('Auth status response:', data);
      
      if (response.ok) {
        // Trust the server's decision about authentication status
        setIsAuthenticated(data.isAuthenticated);
        setIsProtected(data.isProtected);
        
        // Redirect to login if needed
        if (currentPath !== '/login' && data.isProtected && !data.isAuthenticated) {
          console.log('Auth check requires redirect to login');
          window.location.href = '/login';
        }
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
      if (showLoading) setIsLoading(false);
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