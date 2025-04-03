import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Filter, Download, RefreshCw, Calendar } from "lucide-react";
import type { HistoryEntry, Product } from "@/types";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { generatePDF } from "@/lib/pdf-generator";

export default function EnhancedHistoryPage() {
  const { toast } = useToast();
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [page, setPage] = useState(1);
  const [includeWholesaleKitchen, setIncludeWholesaleKitchen] = useState(false);
  const [productFilter, setProductFilter] = useState<string>("all");
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [exportFormat, setExportFormat] = useState<string>("pdf");
  const pageSize = 15;

  // Format dates for API request
  const formattedStartDate = startDate ? new Date(startDate).toISOString() : undefined;
  const formattedEndDate = endDate ? new Date(endDate).toISOString() : undefined;

  // Get the current date in ISO format for default end date if none is provided
  useEffect(() => {
    if (!endDate) {
      setEndDate(format(new Date(), "yyyy-MM-dd"));
    }
  }, [endDate]);

  // Construct the query parameters
  const queryParams = new URLSearchParams();
  
  if (formattedStartDate && formattedEndDate) {
    queryParams.append('startDate', formattedStartDate);
    queryParams.append('endDate', formattedEndDate);
  }
  
  if (includeWholesaleKitchen) {
    queryParams.append('includeWholesaleKitchen', 'true');
  }

  if (productFilter !== "all") {
    queryParams.append('productId', productFilter);
  }
  
  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';

  // Construct the query key with parameters
  const queryKey = ["/api/inventory/history", queryString];

  // Fetch all products for filtering
  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products", "all"],
  });

  // Get unique field locations from products manually
  const fieldLocationsSet = new Set<string>();
  products.forEach((product: Product) => {
    if (product.fieldLocation) {
      fieldLocationsSet.add(product.fieldLocation);
    }
  });
  const fieldLocations = Array.from(fieldLocationsSet);

  // Fetch inventory history data
  const {
    data: historyData = [] as HistoryEntry[],
    isLoading,
    error,
    refetch,
  } = useQuery<HistoryEntry[]>({
    queryKey,
  });

  // Apply field location filter
  const filteredByLocation = locationFilter === "all" 
    ? historyData 
    : historyData.filter(item => item.fieldLocation === locationFilter);

  // Handle apply filter button click
  const handleApplyFilter = () => {
    setPage(1); // Reset to first page
    refetch();
  };

  // Format date for display
  const formatDateDisplay = (dateString: string | Date) => {
    try {
      const date = dateString instanceof Date ? dateString : new Date(dateString);
      return format(date, "MMM dd, yyyy");
    } catch (error) {
      return "Invalid date";
    }
  };

  // Format time for display
  const formatTimeDisplay = (dateString: string | Date) => {
    try {
      const date = dateString instanceof Date ? dateString : new Date(dateString);
      return format(date, "hh:mm a");
    } catch (error) {
      return "Invalid time";
    }
  };

  // Calculate pagination
  const totalItems = filteredByLocation.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const paginatedHistory = filteredByLocation.slice((page - 1) * pageSize, page * pageSize);

  // Export history data
  const handleExport = async () => {
    if (filteredByLocation.length === 0) {
      toast({
        title: "No data to export",
        description: "There is no history data matching your current filters.",
        variant: "destructive",
      });
      return;
    }

    try {
      const title = "Inventory History Report";
      const dateRange = startDate && endDate 
        ? `${formatDateDisplay(startDate)} to ${formatDateDisplay(endDate)}`
        : "All time";

      // Create report items from history data
      const reportItems = filteredByLocation.map(entry => {
        // Find the corresponding product to get extended fields
        const product = products.find(p => p.id === entry.productId);
        
        return {
          id: entry.id,
          name: entry.productName,
          fieldLocation: entry.fieldLocation,
          unit: entry.unit,
          starting: entry.previousStock,
          added: entry.change > 0 ? entry.change : 0,
          removed: entry.change < 0 ? Math.abs(entry.change) : 0,
          current: entry.newStock,
          isLowStock: false,
          isCriticalStock: false,
          updatedBy: entry.updatedBy,
          timestamp: formatDateDisplay(entry.timestamp) + " " + formatTimeDisplay(entry.timestamp),
          // Include extended fields from the product
          washInventory: product?.washInventory || '',
          standInventory: product?.standInventory || '',
          harvestBins: product?.harvestBins || '',
          cropNeeds: product?.cropNeeds || '',
          unitsHarvested: product?.unitsHarvested || '',
          fieldNotes: product?.fieldNotes || '',
          retailNotes: product?.retailNotes || ''
        };
      });

      await generatePDF(title, dateRange, reportItems);
      
      toast({
        title: "Export Successful",
        description: "Your history report has been exported.",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export history data.",
        variant: "destructive",
      });
    }
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
      default:
        break;
    }

    setStartDate(startDateStr);
    setEndDate(endDateStr);
  };

  if (error) {
    toast({
      title: "Error",
      description: "Failed to load inventory history",
      variant: "destructive",
    });
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap justify-between items-center gap-4">
        <h2 className="text-2xl font-medium text-gray-800">Enhanced Inventory History</h2>
        <Button
          variant="outline"
          onClick={handleExport}
          disabled={isLoading || filteredByLocation.length === 0}
          className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
        >
          <Download className="mr-2 h-4 w-4" />
          Export Report
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle>Filter Options</CardTitle>
          <CardDescription>Refine history records by date, product, and location</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-700">Date Range</div>
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full"
                  placeholder="From"
                />
                <span className="text-gray-400">to</span>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full"
                  placeholder="To"
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
                  onClick={() => handleQuickDateRange("last30days")}
                  className="text-xs"
                >
                  Last 30 Days
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-700">Product & Location</div>
              <div className="space-y-2">
                <Select value={productFilter} onValueChange={setProductFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by product" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Products</SelectItem>
                    {products.map(product => (
                      <SelectItem key={product.id} value={product.id.toString()}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={locationFilter} onValueChange={setLocationFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    {fieldLocations.map(location => (
                      <SelectItem key={location} value={location}>
                        {location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-700">Additional Options</div>
              <div className="flex items-center space-x-2 mb-2">
                <Checkbox 
                  id="includeWK" 
                  checked={includeWholesaleKitchen}
                  onCheckedChange={(checked) => {
                    setIncludeWholesaleKitchen(checked as boolean);
                    setPage(1); // Reset to page 1
                  }}
                />
                <label
                  htmlFor="includeWK"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Include Wholesale/Kitchen
                </label>
              </div>
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700"
                onClick={handleApplyFilter}
                disabled={isLoading}
              >
                <Filter className="mr-2 h-4 w-4" />
                Apply Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>History Records</CardTitle>
          <CardDescription>
            {totalItems} records found
            {(startDate || endDate) && ` from ${startDate ? formatDateDisplay(startDate) : ''} to ${endDate ? formatDateDisplay(endDate) : 'present'}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="p-6 text-center">
              <div className="animate-spin inline-block w-8 h-8 border-4 border-current border-t-transparent text-blue-600 rounded-full"></div>
              <p className="mt-2 text-gray-600">Loading history...</p>
            </div>
          ) : paginatedHistory.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-gray-500">No history records found.</p>
              {(startDate || endDate || productFilter !== "all" || locationFilter !== "all") && (
                <p className="text-gray-500 text-sm mt-1">
                  Try adjusting your filters.
                </p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Field Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Change
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Previous Stock
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      New Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-blue-50">
                      Wash Inventory (Stock)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Updated By
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedHistory.map((entry: HistoryEntry) => (
                    <tr key={entry.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                        {formatDateDisplay(entry.timestamp)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                        {formatTimeDisplay(entry.timestamp)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                        {entry.productName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                        {entry.fieldLocation}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <span className={entry.change > 0 ? "text-green-600" : "text-red-600"}>
                          {entry.change > 0 ? `+${entry.change}` : entry.change}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                        {entry.previousStock} {entry.unit}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                        {entry.newStock} {entry.unit}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold bg-blue-50">
                        {(() => {
                          const product = products.find(p => p.id === entry.productId);
                          return product?.washInventory || '-';
                        })()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                        {entry.updatedBy}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {totalItems > 0 && (
            <div className="bg-gray-50 px-6 py-3 flex items-center justify-between border-t border-gray-200 mt-4">
              <div className="text-sm text-gray-700">
                Showing <span className="font-medium">{(page - 1) * pageSize + 1}</span> to{" "}
                <span className="font-medium">
                  {Math.min(page * pageSize, totalItems)}
                </span>{" "}
                of <span className="font-medium">{totalItems}</span> entries
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="px-3 py-1 text-sm"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                  className="px-3 py-1 text-sm text-blue-600"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}