import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  BarChart, 
  FileDown, 
  Calendar, 
  Filter, 
  Printer, 
  RefreshCw, 
  ListFilter,
  Tractor
} from "lucide-react";
import { generatePDF } from "@/lib/pdf-generator";
import { HistoryEntry, Product, ReportItem } from "@/types";
import { Badge } from "@/components/ui/badge";

export default function EnhancedReportsPage() {
  const { toast } = useToast();
  const [reportType, setReportType] = useState("daily");
  const [startDate, setStartDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [filterBy, setFilterBy] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [showReport, setShowReport] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch products for filter dropdown
  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  // Get unique field locations from products manually
  const fieldLocationsSet = new Set<string>();
  products.forEach((product: Product) => {
    if (product.fieldLocation) {
      fieldLocationsSet.add(product.fieldLocation);
    }
  });
  const fieldLocations = Array.from(fieldLocationsSet);

  // Fetch inventory history with date filtering
  const formattedStartDate = startDate ? new Date(startDate).toISOString() : undefined;
  const formattedEndDate = endDate ? new Date(endDate).toISOString() : undefined;

  // Build query params - explicitly do NOT include wholesale/kitchen by default
  const queryParams = new URLSearchParams();
  if (formattedStartDate && formattedEndDate) {
    queryParams.append('startDate', formattedStartDate);
    queryParams.append('endDate', formattedEndDate);
  }
  
  // Keep original field data for reference, even if product field location changes later
  queryParams.append('includeWholesaleKitchen', 
    locationFilter === "all" || locationFilter === "Wholesale" || locationFilter === "Kitchen" 
    ? 'true' : 'false'
  );
  
  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
  
  const historyQueryKey = [
    "/api/inventory/history",
    showReport ? queryString : "",
  ];

  const { 
    data: historyData = [], 
    isLoading: historyLoading,
    refetch: refetchHistory
  } = useQuery<HistoryEntry[]>({
    queryKey: historyQueryKey,
    enabled: showReport,
  });

  // Filter history data based on product and location selection
  const filteredHistory = historyData.filter((entry) => {
    const matchesProduct = filterBy === "all" || entry.productId === parseInt(filterBy);
    const matchesLocation = locationFilter === "all" || entry.fieldLocation === locationFilter;
    return matchesProduct && matchesLocation;
  });

  // Process data for report
  const processReportData = () => {
    if (!showReport || historyLoading) return null;

    // Group data by product for summary
    const productSummary = new Map();

    // Initialize with all products at 0
    products.forEach((product: Product) => {
      // Skip products not matching the location filter
      if (locationFilter !== "all" && product.fieldLocation !== locationFilter) {
        return;
      }
      
      // Skip products not matching the product filter
      if (filterBy !== "all" && product.id.toString() !== filterBy) {
        return;
      }
      
      productSummary.set(product.id, {
        id: product.id,
        name: product.name,
        fieldLocation: product.fieldLocation,
        unit: product.unit,
        starting: 0,
        added: 0,
        removed: 0,
        current: product.currentStock,
        isLowStock: product.currentStock < product.minStock,
        isCriticalStock: product.currentStock < (product.minStock / 2),
        fieldNotes: product.fieldNotes || "",
        retailNotes: product.retailNotes || "",
        washInventory: product.washInventory || "",
        standInventory: product.standInventory || "",
        harvestBins: product.harvestBins || "",
        cropNeeds: product.cropNeeds || "",
        unitsHarvested: product.unitsHarvested || ""
      });
    });

    // Process history entries
    filteredHistory.forEach((entry: HistoryEntry) => {
      const product = productSummary.get(entry.productId);
      if (product) {
        if (entry.change > 0) {
          product.added += entry.change;
        } else {
          product.removed += Math.abs(entry.change);
        }
        // Calculate starting inventory based on current and changes
        product.starting = product.current - product.added + product.removed;
      }
    });

    return Array.from(productSummary.values());
  };

  const reportData = processReportData() || [];

  // Calculate report statistics
  const reportStats = {
    totalProducts: reportData.length,
    totalAdded: reportData.reduce((sum, item) => sum + item.added, 0),
    totalRemoved: reportData.reduce((sum, item) => sum + item.removed, 0),
    lowStockCount: reportData.filter(item => item.isLowStock).length,
    criticalStockCount: reportData.filter(item => item.isCriticalStock).length
  };

  // Generate and export PDF report
  const handleExportPDF = async () => {
    if (!reportData || reportData.length === 0) {
      toast({
        title: "Error",
        description: "No report data available to export",
        variant: "destructive",
      });
      return;
    }

    try {
      let title = "Farm Inventory Report";
      
      switch(reportType) {
        case "daily":
          title = "Daily Inventory Report";
          break;
        case "monthly":
          title = "Monthly Inventory Report";
          break;
        case "product":
          const productName = filterBy !== "all" 
            ? products.find(p => p.id.toString() === filterBy)?.name 
            : "All Products";
          title = `Product Report: ${productName}`;
          break;
        case "field":
          title = `Field Location Report: ${locationFilter === "all" ? "All Locations" : locationFilter}`;
          break;
      }
      
      const dateRange = `${format(new Date(startDate), "MMM dd, yyyy")} to ${format(
        new Date(endDate),
        "MMM dd, yyyy"
      )}`;

      await generatePDF(title, dateRange, reportData);
      
      toast({
        title: "Success",
        description: "Report exported successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export report",
        variant: "destructive",
      });
    }
  };

  // Generate report
  const handleGenerateReport = () => {
    setShowReport(true);
    refetchHistory();
  };

  // Handle quick date range selections
  const handleQuickDateRange = (range: string) => {
    const today = new Date();
    const endDateStr = format(today, "yyyy-MM-dd");
    let startDateStr = "";

    switch (range) {
      case "today":
        startDateStr = endDateStr;
        break;
      case "yesterday":
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        startDateStr = format(yesterday, "yyyy-MM-dd");
        break;
      case "last7days":
        const last7 = new Date(today);
        last7.setDate(last7.getDate() - 7);
        startDateStr = format(last7, "yyyy-MM-dd");
        break;
      case "last30days":
        const last30 = new Date(today);
        last30.setDate(last30.getDate() - 30);
        startDateStr = format(last30, "yyyy-MM-dd");
        break;
      case "thisMonth":
        const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        startDateStr = format(thisMonth, "yyyy-MM-dd");
        break;
      case "lastMonth":
        const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastDayLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
        startDateStr = format(lastMonth, "yyyy-MM-dd");
        setEndDate(format(lastDayLastMonth, "yyyy-MM-dd"));
        return;
      default:
        break;
    }

    setStartDate(startDateStr);
    setEndDate(endDateStr);
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap justify-between items-center gap-4">
        <h2 className="text-2xl font-medium text-gray-800">Enhanced Inventory Reports</h2>
        <div className="flex gap-3">
          <Button
            className="bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100"
            variant="outline"
            onClick={() => setShowReport(false)}
            disabled={!showReport}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            New Report
          </Button>
          
          <Button
            className="bg-green-600 hover:bg-green-700 text-white"
            onClick={handleExportPDF}
            disabled={!showReport || historyLoading || reportData.length === 0}
          >
            <FileDown className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>

      {!showReport ? (
        <Card>
          <CardHeader>
            <CardTitle>Report Generator</CardTitle>
            <CardDescription>Configure and generate inventory reports</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Report Type
                  </label>
                  <Select value={reportType} onValueChange={setReportType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select report type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily Summary</SelectItem>
                      <SelectItem value="monthly">Monthly Summary</SelectItem>
                      <SelectItem value="product">Product Specific</SelectItem>
                      <SelectItem value="field">Field Location</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date Range
                  </label>
                  <div className="flex items-center gap-2 mb-2">
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full"
                    />
                    <span className="text-gray-500">to</span>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleQuickDateRange("today")}
                      className="text-xs"
                    >
                      Today
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleQuickDateRange("yesterday")}
                      className="text-xs"
                    >
                      Yesterday
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleQuickDateRange("last7days")}
                      className="text-xs"
                    >
                      Last 7 Days
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleQuickDateRange("thisMonth")}
                      className="text-xs"
                    >
                      This Month
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleQuickDateRange("lastMonth")}
                      className="text-xs"
                    >
                      Last Month
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Filter By Product
                  </label>
                  <Select value={filterBy} onValueChange={setFilterBy}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select filter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Products</SelectItem>
                      {products.map((product: Product) => (
                        <SelectItem key={product.id} value={product.id.toString()}>
                          {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Filter By Location
                  </label>
                  <Select value={locationFilter} onValueChange={setLocationFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Locations</SelectItem>
                      {fieldLocations.map((location) => (
                        <SelectItem key={location} value={location}>
                          {location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="pt-6">
                  <Button 
                    className="w-full bg-primary hover:bg-green-800" 
                    onClick={handleGenerateReport}
                  >
                    <BarChart className="mr-2 h-4 w-4" />
                    Generate Report
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>
                    {reportType === "daily" ? "Daily" : 
                     reportType === "monthly" ? "Monthly" : 
                     reportType === "product" ? "Product" : "Field"} Summary Report
                  </CardTitle>
                  <CardDescription>
                    {format(new Date(startDate), "MMM dd, yyyy")} to {format(new Date(endDate), "MMM dd, yyyy")}
                    {filterBy !== "all" && ` • Product: ${products.find(p => p.id.toString() === filterBy)?.name}`}
                    {locationFilter !== "all" && ` • Location: ${locationFilter}`}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-100">
                    {reportStats.totalProducts} Products
                  </Badge>
                  {reportStats.lowStockCount > 0 && (
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 hover:bg-yellow-100">
                      {reportStats.lowStockCount} Low Stock
                    </Badge>
                  )}
                  {reportStats.criticalStockCount > 0 && (
                    <Badge variant="outline" className="bg-red-50 text-red-700 hover:bg-red-100">
                      {reportStats.criticalStockCount} Critical
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="w-full justify-start px-6 pt-2">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="inventory">Inventory Changes</TabsTrigger>
                  <TabsTrigger value="lowstock">Low Stock</TabsTrigger>
                  <TabsTrigger value="fieldnotes">Field Notes</TabsTrigger>
                </TabsList>
                
                {historyLoading ? (
                  <div className="text-center p-8">
                    <div className="animate-spin inline-block w-8 h-8 border-4 border-current border-t-transparent text-blue-600 rounded-full"></div>
                    <p className="mt-2 text-gray-600">Generating report...</p>
                  </div>
                ) : reportData.length === 0 ? (
                  <div className="text-center p-8">
                    <p className="text-gray-500">No data available for the selected filters.</p>
                    <p className="text-gray-500 text-sm mt-1">Try adjusting your date range or filters.</p>
                  </div>
                ) : (
                  <>
                    <TabsContent value="overview" className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-lg">Inventory Summary</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <dl className="space-y-2">
                              <div className="flex justify-between">
                                <dt className="text-sm text-gray-600">Total Products:</dt>
                                <dd className="text-sm font-medium">{reportStats.totalProducts}</dd>
                              </div>
                              <div className="flex justify-between">
                                <dt className="text-sm text-gray-600">Total Added:</dt>
                                <dd className="text-sm font-medium text-green-600">+{reportStats.totalAdded}</dd>
                              </div>
                              <div className="flex justify-between">
                                <dt className="text-sm text-gray-600">Total Removed:</dt>
                                <dd className="text-sm font-medium text-red-600">-{reportStats.totalRemoved}</dd>
                              </div>
                              <div className="flex justify-between">
                                <dt className="text-sm text-gray-600">Low Stock Items:</dt>
                                <dd className="text-sm font-medium">{reportStats.lowStockCount}</dd>
                              </div>
                              <div className="flex justify-between">
                                <dt className="text-sm text-gray-600">Critical Stock:</dt>
                                <dd className="text-sm font-medium">{reportStats.criticalStockCount}</dd>
                              </div>
                            </dl>
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-lg">Top Additions</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ul className="space-y-2">
                              {reportData
                                .sort((a, b) => b.added - a.added)
                                .slice(0, 5)
                                .map(item => (
                                  <li key={item.id} className="flex justify-between items-center">
                                    <span className="text-sm">{item.name}</span>
                                    <span className="text-sm font-medium text-green-600">
                                      +{item.added} {item.unit}
                                    </span>
                                  </li>
                                ))}
                            </ul>
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-lg">Top Reductions</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ul className="space-y-2">
                              {reportData
                                .sort((a, b) => b.removed - a.removed)
                                .slice(0, 5)
                                .map(item => (
                                  <li key={item.id} className="flex justify-between items-center">
                                    <span className="text-sm">{item.name}</span>
                                    <span className="text-sm font-medium text-red-600">
                                      -{item.removed} {item.unit}
                                    </span>
                                  </li>
                                ))}
                            </ul>
                          </CardContent>
                        </Card>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="inventory">
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Field Location
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Crop
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Starting
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Added
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Removed
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Current
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Units
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {reportData.map((product: ReportItem) => (
                              <tr key={product.id}>
                                <td className="px-4 py-3 text-sm text-gray-800">
                                  {product.fieldLocation}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-800 font-medium">
                                  {product.name}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-800">
                                  {product.starting}
                                </td>
                                <td className="px-4 py-3 text-sm">
                                  <span className="text-green-600 font-medium">
                                    {product.added > 0 ? `+${product.added}` : "-"}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-sm">
                                  <span className="text-red-600 font-medium">
                                    {product.removed > 0 ? `-${product.removed}` : "-"}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-800 font-medium">
                                  {product.current}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-800">
                                  {product.unit}
                                </td>
                                <td className="px-4 py-3 text-sm">
                                  {product.isCriticalStock ? (
                                    <Badge variant="destructive">Critical</Badge>
                                  ) : product.isLowStock ? (
                                    <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-200">
                                      Low Stock
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="bg-green-50 text-green-800 border-green-200">
                                      OK
                                    </Badge>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="lowstock">
                      {reportData.filter(item => item.isLowStock).length === 0 ? (
                        <div className="text-center p-8">
                          <p className="text-green-600 font-medium">No low stock items found.</p>
                          <p className="text-gray-500 text-sm mt-1">All inventory items are at acceptable levels.</p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Field Location
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Crop
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Current
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Units
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Status
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-blue-600 uppercase tracking-wider bg-blue-50 font-semibold">
                                  Wash Inventory (Stock)
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Field Notes
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {reportData
                                .filter(product => product.isLowStock)
                                .map((product: ReportItem) => (
                                  <tr key={product.id}>
                                    <td className="px-4 py-3 text-sm text-gray-800">
                                      {product.fieldLocation}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-800 font-medium">
                                      {product.name}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-800 font-medium">
                                      {product.current}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-800">
                                      {product.unit}
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                      {product.isCriticalStock ? (
                                        <Badge variant="destructive">Critical</Badge>
                                      ) : (
                                        <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-200">
                                          Low Stock
                                        </Badge>
                                      )}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-800 max-w-[200px] bg-blue-50 font-semibold">
                                      <div className="truncate" title={product.washInventory || "-"}>
                                        {product.washInventory || "-"}
                                      </div>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-800 max-w-[200px]">
                                      <div className="truncate" title={product.fieldNotes || "-"}>
                                        {product.fieldNotes || "-"}
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="fieldnotes">
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Field Location
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Crop
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Field Notes
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Retail Notes
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Crop Needs
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Stand Inventory
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-blue-600 uppercase tracking-wider bg-blue-50 font-semibold">
                                Wash Inventory (Stock)
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {reportData.map((product: ReportItem) => (
                              <tr key={product.id}>
                                <td className="px-4 py-3 text-sm text-gray-800">
                                  {product.fieldLocation}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-800 font-medium">
                                  {product.name}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-800 max-w-[200px]">
                                  <div className="truncate" title={product.fieldNotes || "-"}>
                                    {product.fieldNotes || "-"}
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-800 max-w-[200px]">
                                  <div className="truncate" title={product.retailNotes || "-"}>
                                    {product.retailNotes || "-"}
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-800 max-w-[200px]">
                                  <div className="truncate" title={product.cropNeeds || "-"}>
                                    {product.cropNeeds || "-"}
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-800 max-w-[200px]">
                                  <div className="truncate" title={product.standInventory || "-"}>
                                    {product.standInventory || "-"}
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-800 max-w-[200px] bg-blue-50 font-semibold">
                                  <div className="truncate" title={product.washInventory || "-"}>
                                    {product.washInventory || "-"}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </TabsContent>
                  </>
                )}
              </Tabs>
            </CardContent>
            <CardFooter className="bg-gray-50 border-t border-gray-200 p-4">
              <div className="text-sm text-gray-600">
                Generated on {format(new Date(), "MMM dd, yyyy 'at' h:mm a")}
              </div>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}