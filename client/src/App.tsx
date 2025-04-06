import { Switch, Route, Redirect, useLocation } from "wouter";
import { useEffect } from "react";
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

// Protected route component
function ProtectedRoute({ component: Component, ...rest }: { component: React.ComponentType<any>, path?: string }) {
  const { isAuthenticated, isProtected, isLoading } = useAuth();
  const [_, navigate] = useLocation();
  
  useEffect(() => {
    // Only redirect if not loading and authentication is required but not present
    if (!isLoading && isProtected && !isAuthenticated) {
      console.log("Not authenticated. Redirecting to login page...");
      // Use window.location for a full page redirect rather than client-side routing
      // This ensures cookies are properly recognized after login
      window.location.href = "/login";
    }
  }, [isAuthenticated, isProtected, isLoading]);
  
  if (isLoading) {
    console.log("Authentication check in progress...");
    // Show loading state while checking authentication
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>;
  }
  
  if (isProtected && !isAuthenticated) {
    console.log("Protected route accessed without authentication");
    // Show loading instead of an immediate redirect to prevent flickering
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>;
  }
  
  console.log("Authentication successful, rendering protected component");
  // Render the component if authenticated or the site is not protected
  return <Component {...rest} />;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      
      <Route path="/">
        {() => (
          <Layout>
            <Switch>
              <Route path="/" component={() => <ProtectedRoute component={InventoryPage} />} />
              <Route path="/inventory" component={() => <ProtectedRoute component={InventoryPage} />} />
              <Route path="/history" component={() => <ProtectedRoute component={BasicHistoryPage} />} />
              <Route path="/reports" component={() => <ProtectedRoute component={EnhancedReportsPage} />} />
              <Route path="/products" component={() => <ProtectedRoute component={ProductsPage} />} />
              <Route path="/retail" component={() => <ProtectedRoute component={RetailOverviewPage} />} />
              <Route path="/settings" component={() => <ProtectedRoute component={SettingsPage} />} />
              <Route path="/fields" component={() => <ProtectedRoute component={FieldLocationsPage} />} />
              <Route path="/fields/import" component={() => <ProtectedRoute component={DataImportPage} />} />
              <Route component={NotFound} />
            </Switch>
          </Layout>
        )}
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
