import { useEffect, useState } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Layout from "@/components/Layout";
import InventoryPage from "@/pages/inventory/InventoryPage";
import BasicHistoryPage from "@/pages/history/BasicHistoryPage";
import EnhancedReportsPage from "@/pages/reports/EnhancedReportsPage";
import ProductsPage from "@/pages/products/ProductsPage";
import RetailOverviewPage from "@/pages/retail/RetailOverviewPage";
import SettingsPage from "@/pages/settings/SettingsPage";
import FieldLocationsPage from "@/pages/fields/FieldLocationsPage";
import DataImportPage from "@/pages/fields/DataImportPage";
import LoginPage from "@/pages/auth/LoginPage";
import { AuthProvider, useAuth } from "@/components/AuthProvider";

// Simple path-based router with no client-side routing
function SimpleRouter() {
  const { isAuthenticated, isProtected, isLoading } = useAuth();
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  
  // Log initial path
  console.log("Current path:", currentPath);
  
  // Handle authentication redirects
  useEffect(() => {
    if (isLoading) return;
    
    console.log("Auth check complete:", { isAuthenticated, isProtected });
    
    // Redirect to login if not authenticated and not on login page
    if (!isAuthenticated && isProtected && currentPath !== '/login') {
      console.log("Redirecting to login page");
      window.location.href = '/login';
      return;
    }
    
    // Redirect to inventory if on root and authenticated
    if (currentPath === '/' && isAuthenticated) {
      console.log("Redirecting to inventory from root");
      window.location.href = '/inventory';
    }
  }, [isAuthenticated, isProtected, isLoading, currentPath]);
  
  // Update current path when it changes
  useEffect(() => {
    const handleLocationChange = () => {
      const newPath = window.location.pathname;
      console.log("Path changed to:", newPath);
      setCurrentPath(newPath);
    };
    
    // Listen for back/forward navigation
    window.addEventListener('popstate', handleLocationChange);
    
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, []);
  
  // Show loader during authentication check
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <div className="ml-3">Checking authentication...</div>
      </div>
    );
  }
  
  // Show login page
  if (currentPath === '/login') {
    return <LoginPage />;
  }
  
  // Render content based on current path
  let content;
  switch (currentPath) {
    case '/':
    case '/inventory':
      content = <InventoryPage />;
      break;
    case '/history':
      content = <BasicHistoryPage />;
      break;
    case '/reports':
      content = <EnhancedReportsPage />;
      break;
    case '/products':
      content = <ProductsPage />;
      break;
    case '/retail':
      content = <RetailOverviewPage />;
      break;
    case '/settings':
      content = <SettingsPage />;
      break;
    case '/fields':
      content = <FieldLocationsPage />;
      break;
    case '/fields/import':
      content = <DataImportPage />;
      break;
    default:
      content = <NotFound />;
  }
  
  return (
    <>
      {(!isAuthenticated && isProtected) ? (
        // Show loading if we're about to redirect to login
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          <div className="ml-3">Redirecting to login...</div>
        </div>
      ) : (
        // Show the main layout with content
        <Layout>
          {content}
        </Layout>
      )}
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SimpleRouter />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
