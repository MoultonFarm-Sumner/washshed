import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, subDays } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { 
  CalendarIcon, 
  Filter, 
  Download, 
  FileBarChart, 
  RefreshCw, 
  ArrowUpDown, 
  ArrowDownUp,
  Search
} from "lucide-react";
import type { HistoryEntry, FilterOptions } from "@/types";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useIsMobile } from "@/hooks/use-mobile";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { generatePDF } from "@/lib/pdf-generator";

export default function HistoryPage() {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [page, setPage] = useState(1);
  const [includeWholesaleKitchen, setIncludeWholesaleKitchen] = useState(false);
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: subDays(new Date(), 30),
    to: new Date()
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<string>("timestamp");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [selectedFieldLocation, setSelectedFieldLocation] = useState<string>("all");
  const [calendarOpen, setCalendarOpen] = useState(false);
  const pageSize = 15;

  // Format dates for API request
  const formattedStartDate = dateRange.from ? dateRange.from.toISOString() : undefined;
  const formattedEndDate = dateRange.to ? dateRange.to.toISOString() : undefined;

  // Get field locations from history data
  const [fieldLocations, setFieldLocations] = useState<string[]>([]);

  // Construct the query parameters
  const queryParams = new URLSearchParams();
  
  if (formattedStartDate && formattedEndDate) {
    queryParams.append('startDate', formattedStartDate);
    queryParams.append('endDate', formattedEndDate);
  }
  
  if (includeWholesaleKitchen) {
    queryParams.append('includeWholesaleKitchen', 'true');
  }
  
  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';

  // Construct the query key with parameters
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

  // Extract all field locations from the history data
  useEffect(() => {
    if (historyData && historyData.length > 0) {
      const locations = Array.from(new Set(historyData.map(entry => entry.fieldLocation)));
      setFieldLocations(locations);
    }
  }, [historyData]);

  // Handle apply filter button click
  const handleApplyFilter = () => {
    setPage(1);
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

  // Handle sorting changes
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Filter and sort the data
  const filteredAndSortedData = historyData
    .filter(entry => {
      // Filter by search term (product name or updatedBy)
      const matchesSearch = searchTerm === "" || 
        entry.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.updatedBy.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Filter by field location
      const matchesLocation = selectedFieldLocation === "all" || 
        entry.fieldLocation === selectedFieldLocation;
      
      return matchesSearch && matchesLocation;
    })
    .sort((a, b) => {
      // Sort by the selected field
      let comparison = 0;
      
      switch(sortField) {
        case "timestamp":
          comparison = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
          break;
        case "productName":
          comparison = a.productName.localeCompare(b.productName);
          break;
        case "fieldLocation":
          comparison = a.fieldLocation.localeCompare(b.fieldLocation);
          break;
        case "change":
          comparison = a.change - b.change;
          break;
        case "newStock":
          comparison = a.newStock - b.newStock;
          break;
        default:
          comparison = 0;
      }
      
      // Apply sort direction
      return sortDirection === "asc" ? comparison : -comparison;
    });

  // Calculate pagination
  const totalItems = filteredAndSortedData.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const paginatedHistory = filteredAndSortedData.slice((page - 1) * pageSize, page * pageSize);
  
  // Generate inventory history PDF report
  const handleGenerateHistoryPDF = () => {
    if (filteredAndSortedData.length === 0) {
      toast({
        title: "No data to export",
        description: "There is no data available to generate a PDF report.",
        variant: "destructive",
      });
      return;
    }
    
    const dateRangeStr = `${formatDateDisplay(dateRange.from)} to ${formatDateDisplay(dateRange.to)}`;
    
    // Convert history data to format expected by PDF generator
    const reportData = filteredAndSortedData.map(entry => ({
      id: entry.id,
      name: entry.productName,
      fieldLocation: entry.fieldLocation,
      unit: entry.unit,
      current: entry.newStock,
      starting: entry.previousStock,
      added: entry.change > 0 ? entry.change : 0,
      removed: entry.change < 0 ? Math.abs(entry.change) : 0,
      isLowStock: false,
      isCriticalStock: false,
      // Add any other fields needed for the PDF
      updatedBy: entry.updatedBy,
      changeDate: formatDateDisplay(entry.timestamp)
    }));
    
    try {
      generatePDF("Inventory History Report", dateRangeStr, reportData);
      toast({
        title: "Success",
        description: "PDF report generated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate PDF report",
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-medium text-gray-800">Inventory History</h2>
        
        <div className="flex flex-wrap items-center gap-2">
          <Button 
            variant="outline" 
            onClick={handleGenerateHistoryPDF}
            disabled={isLoading || filteredAndSortedData.length === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
          <Button 
            variant="outline" 
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-medium">Filter Options</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Date Range Picker */}
            <div className="space-y-1">
              <label className="text-sm font-medium">Date Range</label>
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal text-muted-foreground"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.from ? (
                      dateRange.to ? (
                        <>
                          {formatDateDisplay(dateRange.from)} - {formatDateDisplay(dateRange.to)}
                        </>
                      ) : (
                        formatDateDisplay(dateRange.from)
                      )
                    ) : (
                      "Select dates"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange.from}
                    selected={{
                      from: dateRange.from,
                      to: dateRange.to,
                    }}
                    onSelect={(range) => {
                      if (range?.from && range?.to) {
                        setDateRange({ from: range.from, to: range.to });
                      }
                    }}
                    numberOfMonths={isMobile ? 1 : 2}
                  />
                  <div className="p-3 border-t border-gray-200 flex justify-end">
                    <Button 
                      size="sm" 
                      onClick={() => setCalendarOpen(false)}
                    >
                      Apply
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            
            {/* Field Location Filter */}
            <div className="space-y-1">
              <label className="text-sm font-medium">Field Location</label>
              <Select
                value={selectedFieldLocation}
                onValueChange={setSelectedFieldLocation}
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
            
            {/* Search Term */}
            <div className="space-y-1">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search by crop or user"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            
            {/* Include Wholesale/Kitchen + Filter Button */}
            <div className="flex flex-col justify-end space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="includeWK" 
                  checked={includeWholesaleKitchen}
                  onCheckedChange={(checked) => {
                    setIncludeWholesaleKitchen(checked as boolean);
                    setPage(1);
                  }}
                />
                <label
                  htmlFor="includeWK"
                  className="text-sm font-medium leading-none"
                >
                  Include Wholesale/Kitchen
                </label>
              </div>
              
              <Button
                className="w-full"
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
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin inline-block w-8 h-8 border-4 border-current border-t-transparent text-primary rounded-full"></div>
              <p className="mt-2 text-gray-600">Loading history...</p>
            </div>
          ) : filteredAndSortedData.length === 0 ? (
            <div className="p-8 text-center">
              <FileBarChart className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-2 text-gray-500 font-medium">No history records found</p>
              <p className="text-gray-400 text-sm">
                Try adjusting your filters or date range to see more results
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th 
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort("timestamp")}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Date & Time</span>
                          {sortField === "timestamp" && (
                            sortDirection === "asc" ? 
                              <ArrowUpDown className="h-4 w-4" /> : 
                              <ArrowDownUp className="h-4 w-4" />
                          )}
                        </div>
                      </th>
                      <th 
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort("productName")}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Product</span>
                          {sortField === "productName" && (
                            sortDirection === "asc" ? 
                              <ArrowUpDown className="h-4 w-4" /> : 
                              <ArrowDownUp className="h-4 w-4" />
                          )}
                        </div>
                      </th>
                      <th 
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort("fieldLocation")}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Field Location</span>
                          {sortField === "fieldLocation" && (
                            sortDirection === "asc" ? 
                              <ArrowUpDown className="h-4 w-4" /> : 
                              <ArrowDownUp className="h-4 w-4" />
                          )}
                        </div>
                      </th>
                      <th 
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort("change")}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Change</span>
                          {sortField === "change" && (
                            sortDirection === "asc" ? 
                              <ArrowUpDown className="h-4 w-4" /> : 
                              <ArrowDownUp className="h-4 w-4" />
                          )}
                        </div>
                      </th>
                      <th 
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort("newStock")}
                      >
                        <div className="flex items-center space-x-1">
                          <span>New Total</span>
                          {sortField === "newStock" && (
                            sortDirection === "asc" ? 
                              <ArrowUpDown className="h-4 w-4" /> : 
                              <ArrowDownUp className="h-4 w-4" />
                          )}
                        </div>
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Updated By
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedHistory.map((entry: HistoryEntry) => (
                      <tr key={entry.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-800">
                          <div className="font-medium">{formatDateDisplay(entry.timestamp)}</div>
                          <div className="text-gray-500">{formatTimeDisplay(entry.timestamp)}</div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-800 font-medium">
                          {entry.productName}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-800">
                          {["Wholesale", "Kitchen"].includes(entry.fieldLocation) ? (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                              {entry.fieldLocation}
                            </Badge>
                          ) : (
                            entry.fieldLocation
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium">
                          <span 
                            className={`px-2 py-1 rounded-full ${
                              entry.change > 0 
                                ? "bg-green-50 text-green-700" 
                                : "bg-red-50 text-red-700"
                            }`}
                          >
                            {entry.change > 0 ? `+${entry.change}` : entry.change}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-800 font-medium">
                          {entry.newStock} {entry.unit}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {entry.updatedBy}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalItems > 0 && (
                <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200">
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
                    >
                      Previous
                    </Button>
                    {/* Page numbers */}
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
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
                          <Button
                            key={pageNum}
                            variant={pageNum === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => setPage(pageNum)}
                            className="w-8 h-8 p-0"
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
