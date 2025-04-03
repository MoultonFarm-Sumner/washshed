import { useLocation, Link } from "wouter";
import { useState, useEffect } from "react";

export default function Header() {
  const [location, setLocation] = useLocation();
  const [currentDate, setCurrentDate] = useState<string>("");

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
    { name: "Enhanced History", path: "/enhanced-history" },
    { name: "Reports", path: "/reports" },
    { name: "Enhanced Reports", path: "/enhanced-reports" },
    { name: "Product Management", path: "/products" },
    { name: "Settings", path: "/settings" },
  ];

  // Handle the root path by redirecting to /inventory
  const activePath = location === "/" ? "/inventory" : location;

  return (
    <header className="bg-primary text-white shadow-md">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <h1 className="text-xl font-medium">Farm Management System</h1>
        <div>
          <span className="text-sm mr-2">{currentDate}</span>
          <span className="text-sm">Farm Admin</span>
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
