import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useToast } from "@/hooks/use-toast";
import { HistoryEntry, Product } from "@/types";
import { Search, Calendar, ChevronDown, Filter, Loader, FileDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow 
} from "@/components/ui/table";

export default function EnhancedHistoryPage() {
  const { toast } = useToast();
  const [startDate, setStartDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [includeWholesaleKitchen, setIncludeWholesaleKitchen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);
  const [selectedColumn, setSelectedColumn] = useState<string | null>(null);
  const [selectedFieldLocation, setSelectedFieldLocation] = useState<string | null>(null);
  const [filtersVisible, setFiltersVisible] = useState(false);

  // Create URL query parameters
  const queryParams = new URLSearchParams();
  if (startDate && endDate) {
    queryParams.append("startDate", new Date(startDate).toISOString());
    queryParams.append("endDate", new Date(endDate).toISOString());
  }
  queryParams.append("includeWholesaleKitchen", includeWholesaleKitchen.toString());
  
  if (selectedProduct) {
    queryParams.append("productId", selectedProduct.toString());
  }

  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : "";
  const queryKey = ["/api/inventory/history", queryString];

  // Fetch inventory history data
  const {
    data: historyData = [] as HistoryEntry[],
    isLoading,
    error,
    refetch,
  } = useQuery<HistoryEntry[]>({
    queryKey,
  });

  // Fetch products for filtering
  const { 
    data: products = [] as Product[],
    isLoading: productsLoading 
  } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  // Get unique field locations from products
  const fieldLocations = Array.from(
    new Set(products.map((product) => product.fieldLocation))
  ).sort();

  // Apply filters to history data
  const filteredHistory = historyData.filter((entry) => {
    // Search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = 
        entry.productName.toLowerCase().includes(searchLower) ||
        entry.fieldLocation.toLowerCase().includes(searchLower) ||
        entry.updatedBy.toLowerCase().includes(searchLower);
      
      if (!matchesSearch) return false;
    }
    
    // Field location filter
    if (selectedFieldLocation && entry.fieldLocation !== selectedFieldLocation) {
      return false;
    }

    return true;
  });

  // Sort the filtered history based on selected column
  const sortedHistory = [...filteredHistory].sort((a, b) => {
    if (!selectedColumn) return 0;
    
    switch (selectedColumn) {
      case "timestamp":
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      case "product":
        return a.productName.localeCompare(b.productName);
      case "fieldLocation":
        return a.fieldLocation.localeCompare(b.fieldLocation);
      case "change":
        return b.change - a.change;
      default:
        return 0;
    }
  });

  // Calculate pagination
  const totalItems = sortedHistory.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const paginatedHistory = sortedHistory.slice((page - 1) * pageSize, page * pageSize);

  // Handle apply filter button click
  const handleApplyFilter = () => {
    setPage(1); // Reset to first page
    refetch();
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedProduct(null);
    setSelectedFieldLocation(null);
    setSelectedColumn(null);
    setIncludeWholesaleKitchen(false);
    setPage(1);
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

  // Handle column header click for sorting
  const handleColumnHeaderClick = (column: string) => {
    setSelectedColumn(column === selectedColumn ? null : column);
  };

  // Export to CSV
  const handleExportCSV = () => {
    try {
      // Create CSV content
      let csvContent = "Date,Time,Product,Field Location,Previous Stock,Change,New Stock,Unit,Updated By\n";
      
      sortedHistory.forEach((entry) => {
        const date = formatDateDisplay(entry.timestamp);
        const time = formatTimeDisplay(entry.timestamp);
        
        // Format each field and handle commas by wrapping in quotes
        const row = [
          date,
          time,
          `"${entry.productName}"`,
          `"${entry.fieldLocation}"`,
          entry.previousStock,
          entry.change > 0 ? `+${entry.change}` : entry.change,
          entry.newStock,
          entry.unit,
          `"${entry.updatedBy}"`
        ].join(",");
        
        csvContent += row + "\n";
      });
      
      // Create a blob and download
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `inventory-history-${format(new Date(), "yyyy-MM-dd")}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Success",
        description: "History exported to CSV",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export history",
        variant: "destructive",
      });
    }
  };

  if (error) {
    toast({
      title: "Error",
      description: "Failed to load inventory history",
      variant: "destructive",
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h2 className="text-2xl font-medium text-gray-800">Inventory History</h2>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFiltersVisible(!filtersVisible)}
          >
            <Filter className="mr-2 h-4 w-4" />
            Filters
            <ChevronDown className={`ml-2 h-4 w-4 transition-transform ${filtersVisible ? "rotate-180" : ""}`} />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            disabled={sortedHistory.length === 0}
          >
            <FileDown className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>
      
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
        <Input
          className="pl-10 pr-4"
          placeholder="Search by product, field location, or user..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      
      {/* Advanced filters */}
      {filtersVisible && (
        <div className="bg-gray-50 p-4 rounded-md border border-gray-200 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Date Range</label>
              <div className="flex items-center gap-2">
                <div className="w-full">
                  <label className="text-xs text-gray-500 mb-1 block">From</label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="w-full">
                  <label className="text-xs text-gray-500 mb-1 block">To</label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Filter By</label>
              <div className="space-y-2">
                <Select
                  value={selectedProduct?.toString() || ""}
                  onValueChange={(value) => setSelectedProduct(value ? parseInt(value) : null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Products</SelectItem>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id.toString()}>
                        {product.name} ({product.fieldLocation})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select
                  value={selectedFieldLocation || ""}
                  onValueChange={(value) => setSelectedFieldLocation(value || null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select field location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Locations</SelectItem>
                    {fieldLocations.map((location) => (
                      <SelectItem key={location} value={location}>
                        {location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Options</label>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeWK"
                    checked={includeWholesaleKitchen}
                    onCheckedChange={(checked) => {
                      setIncludeWholesaleKitchen(checked as boolean);
                      setPage(1); // Reset to page 1 when filter changes
                    }}
                  />
                  <label
                    htmlFor="includeWK"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Include Wholesale/Kitchen
                  </label>
                </div>
                
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleApplyFilter}>
                    Apply Filters
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleClearFilters}>
                    Clear Filters
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Active filters */}
      {(searchQuery || selectedProduct || selectedFieldLocation || selectedColumn || includeWholesaleKitchen) && (
        <div className="flex flex-wrap gap-2">
          {searchQuery && (
            <Badge variant="outline" className="flex items-center gap-1 bg-blue-50">
              Search: {searchQuery}
              <button
                onClick={() => setSearchQuery("")}
                className="text-gray-500 hover:text-gray-700 ml-1"
              >
                &times;
              </button>
            </Badge>
          )}
          
          {selectedProduct && (
            <Badge variant="outline" className="flex items-center gap-1 bg-blue-50">
              Product: {products.find(p => p.id === selectedProduct)?.name || "Unknown"}
              <button
                onClick={() => setSelectedProduct(null)}
                className="text-gray-500 hover:text-gray-700 ml-1"
              >
                &times;
              </button>
            </Badge>
          )}
          
          {selectedFieldLocation && (
            <Badge variant="outline" className="flex items-center gap-1 bg-blue-50">
              Location: {selectedFieldLocation}
              <button
                onClick={() => setSelectedFieldLocation(null)}
                className="text-gray-500 hover:text-gray-700 ml-1"
              >
                &times;
              </button>
            </Badge>
          )}
          
          {selectedColumn && (
            <Badge variant="outline" className="flex items-center gap-1 bg-blue-50">
              Sorted by: {selectedColumn}
              <button
                onClick={() => setSelectedColumn(null)}
                className="text-gray-500 hover:text-gray-700 ml-1"
              >
                &times;
              </button>
            </Badge>
          )}
          
          {includeWholesaleKitchen && (
            <Badge variant="outline" className="flex items-center gap-1 bg-blue-50">
              Including Wholesale/Kitchen
              <button
                onClick={() => setIncludeWholesaleKitchen(false)}
                className="text-gray-500 hover:text-gray-700 ml-1"
              >
                &times;
              </button>
            </Badge>
          )}
        </div>
      )}
      
      {/* History table */}
      {isLoading || productsLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader className="h-8 w-8 animate-spin text-gray-500" />
          <span className="ml-2 text-gray-600">Loading history data...</span>
        </div>
      ) : paginatedHistory.length > 0 ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead 
                  className={`cursor-pointer ${selectedColumn === "timestamp" ? "bg-gray-100" : ""}`}
                  onClick={() => handleColumnHeaderClick("timestamp")}
                >
                  <div className="flex items-center">
                    Date/Time
                    {selectedColumn === "timestamp" && <ChevronDown className="ml-1 h-4 w-4" />}
                  </div>
                </TableHead>
                <TableHead 
                  className={`cursor-pointer ${selectedColumn === "product" ? "bg-gray-100" : ""}`}
                  onClick={() => handleColumnHeaderClick("product")}
                >
                  <div className="flex items-center">
                    Product
                    {selectedColumn === "product" && <ChevronDown className="ml-1 h-4 w-4" />}
                  </div>
                </TableHead>
                <TableHead 
                  className={`cursor-pointer ${selectedColumn === "fieldLocation" ? "bg-gray-100" : ""}`}
                  onClick={() => handleColumnHeaderClick("fieldLocation")}
                >
                  <div className="flex items-center">
                    Field Location
                    {selectedColumn === "fieldLocation" && <ChevronDown className="ml-1 h-4 w-4" />}
                  </div>
                </TableHead>
                <TableHead>Previous Stock</TableHead>
                <TableHead 
                  className={`cursor-pointer ${selectedColumn === "change" ? "bg-gray-100" : ""}`}
                  onClick={() => handleColumnHeaderClick("change")}
                >
                  <div className="flex items-center">
                    Change
                    {selectedColumn === "change" && <ChevronDown className="ml-1 h-4 w-4" />}
                  </div>
                </TableHead>
                <TableHead>New Stock</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Updated By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedHistory.map((entry) => (
                <TableRow key={entry.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium">
                    <div>{formatDateDisplay(entry.timestamp)}</div>
                    <div className="text-xs text-gray-500">{formatTimeDisplay(entry.timestamp)}</div>
                  </TableCell>
                  <TableCell>{entry.productName}</TableCell>
                  <TableCell>{entry.fieldLocation}</TableCell>
                  <TableCell>{entry.previousStock}</TableCell>
                  <TableCell>
                    <span
                      className={
                        entry.change > 0
                          ? "text-green-600 font-medium"
                          : "text-red-600 font-medium"
                      }
                    >
                      {entry.change > 0 ? `+${entry.change}` : entry.change}
                    </span>
                  </TableCell>
                  <TableCell>{entry.newStock}</TableCell>
                  <TableCell>{entry.unit}</TableCell>
                  <TableCell>{entry.updatedBy}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-md border border-gray-200">
          <p className="text-gray-500">No history entries found.</p>
          <p className="text-sm text-gray-400 mt-1">Try adjusting your filters or date range.</p>
        </div>
      )}
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Showing {Math.min((page - 1) * pageSize + 1, totalItems)} to {Math.min(page * pageSize, totalItems)} of {totalItems} entries
          </div>
          
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setPage(Math.max(1, page - 1))}
                  className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                // Calculate page numbers to show (always show current page in the middle if possible)
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }
                
                return (
                  <PaginationItem key={i}>
                    <PaginationLink
                      isActive={pageNum === page}
                      onClick={() => setPage(pageNum)}
                      className="cursor-pointer"
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
              
              <PaginationItem>
                <PaginationNext
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  className={page === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Rows per page:</span>
            <Select
              value={pageSize.toString()}
              onValueChange={(value) => {
                setPageSize(parseInt(value));
                setPage(1); // Reset to first page
              }}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue placeholder="10" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  );
}