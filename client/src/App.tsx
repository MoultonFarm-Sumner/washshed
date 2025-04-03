import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Layout from "@/components/Layout";
import InventoryPage from "@/pages/inventory/InventoryPage";
import HistoryPage from "@/pages/history/HistoryPage";
import ReportsPage from "@/pages/reports/ReportsPage";
import ProductsPage from "@/pages/products/ProductsPage";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={InventoryPage} />
        <Route path="/inventory" component={InventoryPage} />
        <Route path="/history" component={HistoryPage} />
        <Route path="/reports" component={ReportsPage} />
        <Route path="/products" component={ProductsPage} />
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
