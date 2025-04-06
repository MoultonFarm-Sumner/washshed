import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export default function Header() {
  const [currentDate, setCurrentDate] = useState<string>("");
  const { isAuthenticated, logout } = useAuth();
  
  // Get current path to determine active tab
  const currentPath = window.location.pathname;
  const activePath = currentPath === "/" ? "/inventory" : currentPath;

  useEffect(() => {
    const date = new Date();
    setCurrentDate(
      date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    );
  }, []);

  // Define the tabs and their paths
  const tabs = [
    { name: "Wash Shed Inventory", path: "/inventory" },
    { name: "Retail Overview", path: "/retail" },
    { name: "Field Locations", path: "/fields" },
    { name: "Inventory History", path: "/history" },
    { name: "Reports", path: "/reports" },
    { name: "Product Management", path: "/products" },
    { name: "Settings", path: "/settings" },
  ];
  
  const handleNavigation = (path: string) => (e: React.MouseEvent) => {
    // Prevent default behavior
    e.preventDefault();
    
    // Only refresh if we're navigating to a different page
    if (activePath !== path) {
      console.log(`Navigating from ${activePath} to ${path}`);
      // Use window.location for server-side navigation
      window.location.href = path;
    }
  };
  
  const handleLogout = async () => {
    await logout();
    // Force full page reload after logout
    window.location.href = "/login";
  };

  return (
    <header className="bg-primary text-white shadow-md">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <h1 className="text-xl font-medium">Farm Management System</h1>
        <div className="flex items-center">
          <span className="text-sm mr-4">{currentDate}</span>
          <span className="text-sm mr-3">Farm Admin</span>
          {isAuthenticated && (
            <Button 
              variant="ghost" 
              className="text-white hover:bg-primary-foreground hover:text-primary p-2"
              onClick={handleLogout}
              size="sm"
            >
              <LogOut className="h-4 w-4 mr-1" />
              <span className="text-xs">Logout</span>
            </Button>
          )}
        </div>
      </div>
      <div className="container mx-auto px-4 text-sm font-medium">
        <nav className="flex overflow-x-auto hide-scrollbar">
          {tabs.map((tab) => (
            <a
              key={tab.path}
              href={tab.path}
              onClick={handleNavigation(tab.path)}
              className="no-underline text-white"
            >
              <div
                className={`px-4 py-3 focus:outline-none whitespace-nowrap cursor-pointer ${
                  activePath === tab.path
                    ? "border-b-2 border-white"
                    : "hover:bg-opacity-10 hover:bg-white"
                }`}
              >
                {tab.name}
              </div>
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}
