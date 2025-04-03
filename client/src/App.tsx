import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Layout from "@/components/Layout";
import InventoryPage from "@/pages/inventory/InventoryPage";
import HistoryPage from "@/pages/history/HistoryPage";
import EnhancedHistoryPage from "@/pages/history/EnhancedHistoryPage";
import ReportsPage from "@/pages/reports/ReportsPage";
import EnhancedReportsPage from "@/pages/reports/EnhancedReportsPage";
import ProductsPage from "@/pages/products/ProductsPage";
import RetailOverviewPage from "@/pages/retail/RetailOverviewPage";
import SettingsPage from "@/pages/settings/SettingsPage";
import FieldLocationsPage from "@/pages/fields/FieldLocationsPage";
import DataImportPage from "@/pages/fields/DataImportPage";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={InventoryPage} />
        <Route path="/inventory" component={InventoryPage} />
        <Route path="/history" component={HistoryPage} />
        <Route path="/enhanced-history" component={EnhancedHistoryPage} />
        <Route path="/reports" component={ReportsPage} />
        <Route path="/enhanced-reports" component={EnhancedReportsPage} />
        <Route path="/products" component={ProductsPage} />
        <Route path="/retail" component={RetailOverviewPage} />
        <Route path="/settings" component={SettingsPage} />
        <Route path="/fields" component={FieldLocationsPage} />
        <Route path="/fields/import" component={DataImportPage} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
