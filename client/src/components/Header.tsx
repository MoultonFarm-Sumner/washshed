import { useLocation, Link } from "wouter";
import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export default function Header() {
  const [location, setLocation] = useLocation();
  const [currentDate, setCurrentDate] = useState<string>("");
  const { isAuthenticated, logout } = useAuth();

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

  // Handle the root path by redirecting to /inventory
  const activePath = location === "/" ? "/inventory" : location;
  
  const handleLogout = async () => {
    await logout();
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
            <Link
              key={tab.path}
              href={tab.path}
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
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
