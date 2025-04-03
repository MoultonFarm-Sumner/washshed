import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
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
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { HistoryEntry, Product, ReportItem } from "@/types";
import { BarChart, FileDown, Filter, Loader, Calendar, PieChart, TrendingUp, Eye, ChevronDown } from "lucide-react";
import { generatePDF } from "@/lib/pdf-generator";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow 
} from "@/components/ui/table";

export default function EnhancedReportsPage() {
  const { toast } = useToast();
  const [reportType, setReportType] = useState("daily");
  const [reportView, setReportView] = useState("table");
  const [startDate, setStartDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [filterBy, setFilterBy] = useState("all");
  const [showReport, setShowReport] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([
    "fieldLocation", "name", "current", "unit", "changes", "fieldNotes", "retailNotes"
  ]);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [selectedFieldLocation, setSelectedFieldLocation] = useState<string | null>(null);
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);

  // Date presets
  const datePresets = {
    today: {
      label: "Today",
      start: format(new Date(), "yyyy-MM-dd"),
      end: format(new Date(), "yyyy-MM-dd"),
    },
    yesterday: {
      label: "Yesterday",
      start: format(subDays(new Date(), 1), "yyyy-MM-dd"),
      end: format(subDays(new Date(), 1), "yyyy-MM-dd"),
    },
    thisWeek: {
      label: "This Week",
      start: format(subDays(new Date(), 7), "yyyy-MM-dd"),
      end: format(new Date(), "yyyy-MM-dd"),
    },
    thisMonth: {
      label: "This Month",
      start: format(startOfMonth(new Date()), "yyyy-MM-dd"),
      end: format(endOfMonth(new Date()), "yyyy-MM-dd"),
    },
  };

  // Apply date preset
  const applyDatePreset = (preset: keyof typeof datePresets) => {
    setStartDate(datePresets[preset].start);
    setEndDate(datePresets[preset].end);
  };

  // Fetch products for filter dropdown - refetch every 5 seconds to get the latest updates
  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
    refetchInterval: 5000, // Refetch every 5 seconds to get latest changes
  });

  // Get unique field locations from products
  const fieldLocations = Array.from(
    new Set(products.map((product) => product.fieldLocation))
  )
  .filter(location => location !== "Wholesale" && location !== "Kitchen" && location !== "")
  .sort();

  // Fetch inventory history with date filtering
  const formattedStartDate = startDate ? new Date(startDate).toISOString() : undefined;
  const formattedEndDate = endDate ? new Date(endDate).toISOString() : undefined;

  // Build query params - explicitly do NOT include wholesale/kitchen
  const queryParams = new URLSearchParams();
  if (formattedStartDate && formattedEndDate) {
    queryParams.append('startDate', formattedStartDate);
    queryParams.append('endDate', formattedEndDate);
  }
  // Always exclude wholesale/kitchen entries
  queryParams.append('includeWholesaleKitchen', 'false');
  
  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
  
  const historyQueryKey = [
    "/api/inventory/history",
    showReport ? queryString : "",
  ];

  const { data: historyData = [], isLoading: historyLoading } = useQuery<HistoryEntry[]>({
    queryKey: historyQueryKey,
    enabled: showReport,
  });

  // Filter history data based on product selection
  const filteredHistory = historyData.filter((entry) => {
    if (filterBy === "all") return true;
    return entry.productId === parseInt(filterBy);
  });

  // Process data for report
  const processReportData = () => {
    if (!showReport || historyLoading) return null;

    // Group data by product for summary
    const productSummary = new Map();

    // Initialize with all products at 0
    products
      .filter(product => {
        // Filter out wholesale/kitchen products
        if (["Wholesale", "Kitchen"].includes(product.fieldLocation)) {
          return false;
        }
        
        // Apply field location filter if selected
        if (selectedFieldLocation && product.fieldLocation !== selectedFieldLocation) {
          return false;
        }
        
        return true;
      })
      .forEach((product: Product) => {
        productSummary.set(product.id, {
          id: product.id,
          name: product.name,
          fieldLocation: product.fieldLocation,
          unit: product.unit,
          starting: 0,
          added: 0,
          removed: 0,
          current: parseInt(product.washInventory || '0') || 0, // Use wash inventory for current stock
          isLowStock: (parseInt(product.washInventory || '0') || 0) < product.minStock,
          isCriticalStock: (parseInt(product.washInventory || '0') || 0) < Math.floor(product.minStock / 2),
          fieldNotes: product.fieldNotes || "",
          retailNotes: product.retailNotes || "",
          washInventory: product.washInventory || "",
          standInventory: product.standInventory || "",
          harvestBins: product.harvestBins || "",
          cropNeeds: product.cropNeeds || "",
          unitsHarvested: product.unitsHarvested || ""
        });
      });

    // Process history entries - Only count entries related to Wash Inventory
    filteredHistory.forEach((entry: HistoryEntry) => {
      const product = productSummary.get(entry.productId);
      // Only process entries that are related to Wash Inventory
      if (product && entry.fieldLocation && entry.fieldLocation.includes('Wash Inventory')) {
        if (entry.change > 0) {
          product.added += entry.change;
        } else {
          product.removed += Math.abs(entry.change);
        }
        // Calculate starting inventory based on current and changes
        product.starting = product.current - product.added + product.removed;
      }
    });

    let reportData = Array.from(productSummary.values());
    
    // Filter to show only low stock items if requested
    if (showLowStockOnly) {
      reportData = reportData.filter((item: ReportItem) => item.isLowStock);
    }
    
    return reportData;
  };

  const reportData = useMemo(() => processReportData(), [
    showReport, 
    historyLoading, 
    products, 
    filteredHistory, 
    selectedFieldLocation, 
    showLowStockOnly
  ]);

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
      const title = `${reportType === "daily" ? "Daily" : "Monthly"} Summary Report`;
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

  // Export to CSV
  const handleExportCSV = () => {
    if (!reportData || reportData.length === 0) {
      toast({
        title: "Error",
        description: "No report data available to export",
        variant: "destructive",
      });
      return;
    }

    try {
      // Build CSV header based on selected columns
      const headers = [
        "Field Location",
        "Crop",
        "Starting Stock (Wash)",
        "Added (Wash)",
        "Removed (Wash)",
        "Current Stock (Wash)",
        "Units",
        "Low Stock",
        "Field Notes",
        "Retail Notes",
        "Wash Inventory",
        "Stand Inventory",
        "Harvest Bins",
        "Crop Needs",
        "Units Harvested"
      ];

      // Create CSV content
      let csvContent = headers.join(",") + "\n";
      
      reportData.forEach((item: ReportItem) => {        
        // Format each field and handle commas by wrapping in quotes
        const row = [
          `"${item.fieldLocation}"`,
          `"${item.name}"`,
          item.starting,
          item.added,
          item.removed,
          item.current,
          item.unit,
          item.isLowStock ? "Yes" : "No",
          `"${item.fieldNotes || ""}"`,
          `"${item.retailNotes || ""}"`,
          `"${item.washInventory || ""}"`,
          `"${item.standInventory || ""}"`,
          `"${item.harvestBins || ""}"`,
          `"${item.cropNeeds || ""}"`,
          `"${item.unitsHarvested || ""}"`
        ].join(",");
        
        csvContent += row + "\n";
      });
      
      // Create a blob and download
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `inventory-report-${format(new Date(), "yyyy-MM-dd")}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Success",
        description: "Report exported to CSV",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export to CSV",
        variant: "destructive",
      });
    }
  };

  // Handle column selection
  const handleColumnToggle = (column: string) => {
    setSelectedColumns(prev =>
      prev.includes(column)
        ? prev.filter(col => col !== column)
        : [...prev, column]
    );
  };

  // Generate report
  const handleGenerateReport = () => {
    setShowReport(true);
  };

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    if (!reportData) return null;
    
    // Get unique field locations
    const uniqueLocations = Array.from(
      new Set(reportData.map(p => p.fieldLocation))
    );
    
    return {
      totalProducts: reportData.length,
      lowStockCount: reportData.filter(p => p.isLowStock).length,
      criticalStockCount: reportData.filter(p => p.isCriticalStock).length,
      totalAdded: reportData.reduce((sum, p) => sum + p.added, 0),
      totalRemoved: reportData.reduce((sum, p) => sum + p.removed, 0),
      fieldLocations: uniqueLocations.length
    };
  }, [reportData]);

  // Toggle view between table and cards
  const toggleView = (view: string) => {
    setReportView(view);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h2 className="text-2xl font-medium text-gray-800">Reports</h2>
        
        <div className="flex flex-wrap items-center gap-2">
          {showReport && reportData && reportData.length > 0 && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleView(reportView === 'table' ? 'cards' : 'table')}
              >
                <Eye className="mr-2 h-4 w-4" />
                {reportView === 'table' ? 'Card View' : 'Table View'}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
              >
                <FileDown className="mr-2 h-4 w-4" />
                CSV
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportPDF}
              >
                <FileDown className="mr-2 h-4 w-4" />
                PDF
              </Button>
            </>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFiltersVisible(!filtersVisible)}
          >
            <Filter className="mr-2 h-4 w-4" />
            Filters
            <ChevronDown className={`ml-2 h-4 w-4 transition-transform ${filtersVisible ? "rotate-180" : ""}`} />
          </Button>
        </div>
      </div>
      
      {/* Filters section */}
      {filtersVisible && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Report Configuration</CardTitle>
            <CardDescription>
              Configure your report parameters and filters
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Report Type</label>
                  <Select value={reportType} onValueChange={setReportType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select report type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily Summary</SelectItem>
                      <SelectItem value="weekly">Weekly Summary</SelectItem>
                      <SelectItem value="monthly">Monthly Summary</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-1 block">Filter by Product</label>
                  <Select value={filterBy} onValueChange={setFilterBy}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Products</SelectItem>
                      {products
                        .filter(p => !["Wholesale", "Kitchen"].includes(p.fieldLocation))
                        .map((product) => (
                          <SelectItem key={product.id} value={product.id.toString()}>
                            {product.name}
                          </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-1 block">Filter by Field Location</label>
                  <Select 
                    value={selectedFieldLocation || "all"} 
                    onValueChange={(value) => setSelectedFieldLocation(value === "all" ? null : value)}
                  >
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
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="lowStockOnly" 
                    checked={showLowStockOnly}
                    onCheckedChange={(checked) => setShowLowStockOnly(checked as boolean)}
                  />
                  <label
                    htmlFor="lowStockOnly"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Show low stock items only
                  </label>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Date Range</label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Start Date</p>
                      <Input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">End Date</p>
                      <Input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-1 block">Quick Date Presets</label>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(datePresets).map(([key, preset]) => (
                      <Button
                        key={key}
                        variant="outline"
                        size="sm"
                        onClick={() => applyDatePreset(key as keyof typeof datePresets)}
                        className="justify-start"
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {preset.label}
                      </Button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-1 block">Columns to Include</label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="col-fieldLocation" 
                        checked={selectedColumns.includes("fieldLocation")}
                        onCheckedChange={() => handleColumnToggle("fieldLocation")}
                      />
                      <label htmlFor="col-fieldLocation" className="text-sm">Field Location</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="col-name" 
                        checked={selectedColumns.includes("name")}
                        onCheckedChange={() => handleColumnToggle("name")}
                        disabled={true}  // Always show name
                      />
                      <label htmlFor="col-name" className="text-sm">Crop Name</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="col-current" 
                        checked={selectedColumns.includes("current")}
                        onCheckedChange={() => handleColumnToggle("current")}
                        disabled={true}  // Always show current
                      />
                      <label htmlFor="col-current" className="text-sm">Current Stock (Wash)</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="col-unit" 
                        checked={selectedColumns.includes("unit")}
                        onCheckedChange={() => handleColumnToggle("unit")}
                      />
                      <label htmlFor="col-unit" className="text-sm">Unit</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="col-changes" 
                        checked={selectedColumns.includes("changes")}
                        onCheckedChange={() => handleColumnToggle("changes")}
                      />
                      <label htmlFor="col-changes" className="text-sm">Added/Removed</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="col-fieldNotes" 
                        checked={selectedColumns.includes("fieldNotes")}
                        onCheckedChange={() => handleColumnToggle("fieldNotes")}
                      />
                      <label htmlFor="col-fieldNotes" className="text-sm">Field Notes</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="col-retailNotes" 
                        checked={selectedColumns.includes("retailNotes")}
                        onCheckedChange={() => handleColumnToggle("retailNotes")}
                      />
                      <label htmlFor="col-retailNotes" className="text-sm">Retail Notes</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="col-cropNeeds" 
                        checked={selectedColumns.includes("cropNeeds")}
                        onCheckedChange={() => handleColumnToggle("cropNeeds")}
                      />
                      <label htmlFor="col-cropNeeds" className="text-sm">Crop Needs</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="col-washInventory" 
                        checked={selectedColumns.includes("washInventory")}
                        onCheckedChange={() => handleColumnToggle("washInventory")}
                      />
                      <label htmlFor="col-washInventory" className="text-sm">Wash Inventory</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="col-standInventory" 
                        checked={selectedColumns.includes("standInventory")}
                        onCheckedChange={() => handleColumnToggle("standInventory")}
                      />
                      <label htmlFor="col-standInventory" className="text-sm">Stand Inventory</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="col-harvestBins" 
                        checked={selectedColumns.includes("harvestBins")}
                        onCheckedChange={() => handleColumnToggle("harvestBins")}
                      />
                      <label htmlFor="col-harvestBins" className="text-sm">Harvest Bins</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="col-unitsHarvested" 
                        checked={selectedColumns.includes("unitsHarvested")}
                        onCheckedChange={() => handleColumnToggle("unitsHarvested")}
                      />
                      <label htmlFor="col-unitsHarvested" className="text-sm">Units Harvested</label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between border-t pt-3">
            <Button variant="outline" onClick={() => setFiltersVisible(false)}>
              Cancel
            </Button>
            <Button onClick={handleGenerateReport}>
              <BarChart className="mr-2 h-4 w-4" />
              Generate Report
            </Button>
          </CardFooter>
        </Card>
      )}
      
      {/* Active filters indicators */}
      {showReport && (
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="bg-blue-50">
            {reportType === "daily" ? "Daily" : reportType === "weekly" ? "Weekly" : "Monthly"} Report
          </Badge>
          
          <Badge variant="outline" className="bg-blue-50">
            {format(new Date(startDate), "MMM dd, yyyy")} - {format(new Date(endDate), "MMM dd, yyyy")}
          </Badge>
          
          {filterBy !== "all" && (
            <Badge variant="outline" className="bg-blue-50">
              Product: {products.find(p => p.id.toString() === filterBy)?.name || "Unknown"}
            </Badge>
          )}
          
          {selectedFieldLocation && (
            <Badge variant="outline" className="bg-blue-50">
              Location: {selectedFieldLocation}
            </Badge>
          )}
          
          {showLowStockOnly && (
            <Badge variant="outline" className="bg-blue-50">
              Low Stock Only
            </Badge>
          )}
        </div>
      )}
      
      {/* Report View */}
      {historyLoading ? (
        <div className="flex flex-col items-center justify-center py-10 space-y-4">
          <Loader className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-gray-600">Generating report...</p>
        </div>
      ) : showReport ? (
        reportData && reportData.length > 0 ? (
          <div className="space-y-6">
            {/* Summary Cards */}
            {summaryStats && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Products
                    </CardTitle>
                    <div className="h-4 w-4 text-blue-600">
                      <PieChart size={16} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{summaryStats.totalProducts}</div>
                    <p className="text-xs text-gray-500">Products in this report</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Low Stock Items
                    </CardTitle>
                    <div className="h-4 w-4 text-amber-600">
                      <TrendingUp size={16} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{summaryStats.lowStockCount}</div>
                    <p className="text-xs text-gray-500">
                      {(summaryStats.lowStockCount / summaryStats.totalProducts * 100).toFixed(1)}% of products
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Added
                    </CardTitle>
                    <div className="h-4 w-4 text-green-600">
                      <TrendingUp size={16} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{summaryStats.totalAdded}</div>
                    <p className="text-xs text-gray-500">Units added in period</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Removed
                    </CardTitle>
                    <div className="h-4 w-4 text-red-600">
                      <TrendingUp size={16} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{summaryStats.totalRemoved}</div>
                    <p className="text-xs text-gray-500">Units removed in period</p>
                  </CardContent>
                </Card>
              </div>
            )}
            
            {/* Table/Card Toggle View */}
            <Tabs defaultValue={reportView} onValueChange={(v) => setReportView(v)}>
              <TabsList className="mb-4 hidden">
                <TabsTrigger value="table">Table View</TabsTrigger>
                <TabsTrigger value="cards">Card View</TabsTrigger>
              </TabsList>
              
              <TabsContent value="table" className={reportView === 'table' ? 'block' : 'hidden'}>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {selectedColumns.includes("fieldLocation") && (
                          <TableHead>Field Location</TableHead>
                        )}
                        <TableHead>Crop</TableHead>
                        <TableHead className="text-right">Current Stock (Wash)</TableHead>
                        {selectedColumns.includes("unit") && (
                          <TableHead>Unit</TableHead>
                        )}
                        {selectedColumns.includes("changes") && (
                          <TableHead>Changes (Wash)</TableHead>
                        )}
                        {selectedColumns.includes("cropNeeds") && (
                          <TableHead>Crop Needs</TableHead>
                        )}
                        {selectedColumns.includes("standInventory") && (
                          <TableHead>Stand Inventory</TableHead>
                        )}
                        {selectedColumns.includes("washInventory") && (
                          <TableHead>Wash Inventory</TableHead>
                        )}
                        {selectedColumns.includes("harvestBins") && (
                          <TableHead>Harvest Bins</TableHead>
                        )}
                        {selectedColumns.includes("unitsHarvested") && (
                          <TableHead>Units Harvested</TableHead>
                        )}
                        {selectedColumns.includes("fieldNotes") && (
                          <TableHead>Field Notes</TableHead>
                        )}
                        {selectedColumns.includes("retailNotes") && (
                          <TableHead>Retail Notes</TableHead>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.map((product: ReportItem) => (
                        <TableRow key={product.id} className={product.isLowStock ? "bg-red-50" : ""}>
                          {selectedColumns.includes("fieldLocation") && (
                            <TableCell>{product.fieldLocation}</TableCell>
                          )}
                          <TableCell className="font-medium">
                            {product.name}
                            {product.isLowStock && (
                              <Badge variant="outline" className="ml-2 bg-red-50 text-red-600 border-red-200">
                                Low Stock
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {product.current}
                          </TableCell>
                          {selectedColumns.includes("unit") && (
                            <TableCell>{product.unit}</TableCell>
                          )}
                          {selectedColumns.includes("changes") && (
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="text-green-600 font-medium">
                                  {product.added > 0 ? `+${product.added}` : ""}
                                </span>
                                <span className="text-red-600 font-medium">
                                  {product.removed > 0 ? `-${product.removed}` : ""}
                                </span>
                              </div>
                            </TableCell>
                          )}
                          {selectedColumns.includes("cropNeeds") && (
                            <TableCell>
                              <div className="max-w-[200px] truncate" title={product.cropNeeds || ""}>
                                {product.cropNeeds || "-"}
                              </div>
                            </TableCell>
                          )}
                          {selectedColumns.includes("standInventory") && (
                            <TableCell>{product.standInventory || "-"}</TableCell>
                          )}
                          {selectedColumns.includes("washInventory") && (
                            <TableCell>{product.washInventory || "-"}</TableCell>
                          )}
                          {selectedColumns.includes("harvestBins") && (
                            <TableCell>{product.harvestBins || "-"}</TableCell>
                          )}
                          {selectedColumns.includes("unitsHarvested") && (
                            <TableCell>{product.unitsHarvested || "-"}</TableCell>
                          )}
                          {selectedColumns.includes("fieldNotes") && (
                            <TableCell>
                              <div className="max-w-[200px] truncate" title={product.fieldNotes || ""}>
                                {product.fieldNotes || "-"}
                              </div>
                            </TableCell>
                          )}
                          {selectedColumns.includes("retailNotes") && (
                            <TableCell>
                              <div className="max-w-[200px] truncate" title={product.retailNotes || ""}>
                                {product.retailNotes || "-"}
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
              
              <TabsContent value="cards" className={reportView === 'cards' ? 'block' : 'hidden'}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {reportData.map((product: ReportItem) => (
                    <Card 
                      key={product.id} 
                      className={`overflow-hidden ${product.isLowStock ? "border-red-300" : ""}`}
                    >
                      <CardHeader className={`pb-2 ${product.isLowStock ? "bg-red-50" : "bg-gray-50"}`}>
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-base">{product.name}</CardTitle>
                          {product.isLowStock && (
                            <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">
                              Low Stock
                            </Badge>
                          )}
                        </div>
                        <CardDescription>
                          {selectedColumns.includes("fieldLocation") && product.fieldLocation}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <div className="grid grid-cols-3 gap-4 mb-4">
                          <div className="text-center">
                            <div className="text-sm text-gray-500">Current (Wash)</div>
                            <div className="text-xl font-bold">
                              {product.current} 
                              {selectedColumns.includes("unit") && <span className="text-xs font-normal ml-1">{product.unit}</span>}
                            </div>
                          </div>
                          
                          {selectedColumns.includes("changes") && (
                            <>
                              <div className="text-center">
                                <div className="text-sm text-gray-500">Added (Wash)</div>
                                <div className="text-xl font-bold text-green-600">
                                  {product.added > 0 ? `+${product.added}` : "0"}
                                </div>
                              </div>
                              
                              <div className="text-center">
                                <div className="text-sm text-gray-500">Removed (Wash)</div>
                                <div className="text-xl font-bold text-red-600">
                                  {product.removed > 0 ? `-${product.removed}` : "0"}
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                        
                        {(selectedColumns.includes("fieldNotes") || selectedColumns.includes("retailNotes")) && (
                          <Separator className="my-3" />
                        )}
                        
                        <div className="space-y-2">
                          {selectedColumns.includes("cropNeeds") && product.cropNeeds && (
                            <div>
                              <div className="text-sm font-medium text-gray-500">Crop Needs</div>
                              <div className="text-sm">{product.cropNeeds}</div>
                            </div>
                          )}
                          
                          {selectedColumns.includes("fieldNotes") && product.fieldNotes && (
                            <div>
                              <div className="text-sm font-medium text-gray-500">Field Notes</div>
                              <div className="text-sm">{product.fieldNotes}</div>
                            </div>
                          )}
                          
                          {selectedColumns.includes("retailNotes") && product.retailNotes && (
                            <div>
                              <div className="text-sm font-medium text-gray-500">Retail Notes</div>
                              <div className="text-sm">{product.retailNotes}</div>
                            </div>
                          )}
                          
                          {selectedColumns.includes("washInventory") && product.washInventory && (
                            <div>
                              <div className="text-sm font-medium text-gray-500">Wash Inventory</div>
                              <div className="text-sm">{product.washInventory}</div>
                            </div>
                          )}
                          
                          {selectedColumns.includes("standInventory") && product.standInventory && (
                            <div>
                              <div className="text-sm font-medium text-gray-500">Stand Inventory</div>
                              <div className="text-sm">{product.standInventory}</div>
                            </div>
                          )}
                          
                          {selectedColumns.includes("harvestBins") && product.harvestBins && (
                            <div>
                              <div className="text-sm font-medium text-gray-500">Harvest Bins</div>
                              <div className="text-sm">{product.harvestBins}</div>
                            </div>
                          )}
                          
                          {selectedColumns.includes("unitsHarvested") && product.unitsHarvested && (
                            <div>
                              <div className="text-sm font-medium text-gray-500">Units Harvested</div>
                              <div className="text-sm">{product.unitsHarvested}</div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-md border border-gray-200">
            <BarChart className="mx-auto h-10 w-10 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-600">No Report Data Available</h3>
            <p className="text-sm text-gray-500 mt-1">
              Try adjusting your filters or date range
            </p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => setFiltersVisible(true)}
            >
              <Filter className="mr-2 h-4 w-4" />
              Adjust Filters
            </Button>
          </div>
        )
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-md border border-gray-200">
          <BarChart className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-600">Generate a Report</h3>
          <p className="text-sm text-gray-500 mt-1">
            Configure your report parameters and click Generate
          </p>
          <Button 
            className="mt-4"
            onClick={() => setFiltersVisible(true)}
          >
            <BarChart className="mr-2 h-4 w-4" />
            Configure Report
          </Button>
        </div>
      )}
    </div>
  );
}