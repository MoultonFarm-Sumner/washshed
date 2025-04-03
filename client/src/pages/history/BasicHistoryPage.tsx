import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Loader, FileDown } from "lucide-react";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow 
} from "@/components/ui/table";

// Define the history entry type locally
interface HistoryEntry {
  id: number;
  productId: number;
  productName: string;
  fieldLocation: string;
  previousStock: number;
  change: number;
  newStock: number;
  unit: string;
  updatedBy: string;
  timestamp: string;
}

export default function BasicHistoryPage() {
  const { toast } = useToast();
  const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [includeWholesaleKitchen, setIncludeWholesaleKitchen] = useState(false);
  const [historyData, setHistoryData] = useState<HistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Function to fetch history data
  const fetchHistoryData = async () => {
    setIsLoading(true);
    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (startDate && endDate) {
        params.append('startDate', new Date(startDate).toISOString());
        params.append('endDate', new Date(endDate).toISOString());
      }
      params.append('includeWholesaleKitchen', includeWholesaleKitchen.toString());
      params.append('_t', Date.now().toString()); // Prevent caching
      
      const response = await fetch(`/api/inventory/history?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      setHistoryData(data);
    } catch (error) {
      console.error("Failed to load history data:", error);
      toast({
        title: "Error",
        description: "Failed to load inventory history",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Initial data load and refresh timer
  useEffect(() => {
    fetchHistoryData();
    
    const timer = setInterval(() => {
      fetchHistoryData();
    }, 10000); // Refresh every 10 seconds
    
    return () => clearInterval(timer);
  }, [startDate, endDate, includeWholesaleKitchen]);

  // Format date for display
  const formatDateDisplay = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "MMM dd, yyyy");
    } catch (error) {
      return "Invalid date";
    }
  };

  // Format time for display
  const formatTimeDisplay = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "hh:mm a");
    } catch (error) {
      return "Invalid time";
    }
  };

  // Export data to CSV
  const handleExportCSV = () => {
    try {
      if (historyData.length === 0) {
        toast({
          title: "Warning",
          description: "No data to export",
          variant: "destructive",
        });
        return;
      }
      
      // Create CSV content
      let csvContent = "Date,Time,Product,Field Location,Previous Stock,Change,New Stock,Unit,Updated By\n";
      
      historyData.forEach((entry) => {
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
      console.error("Export error:", error);
      toast({
        title: "Error",
        description: "Failed to export history",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h2 className="text-2xl font-medium text-gray-800">Inventory History</h2>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportCSV}
          disabled={historyData.length === 0}
        >
          <FileDown className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>
      
      {/* Filter controls */}
      <div className="bg-gray-50 p-4 rounded-md border border-gray-200 shadow-sm">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="text-sm mb-1 block">From:</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-auto"
            />
          </div>
          
          <div>
            <label className="text-sm mb-1 block">To:</label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-auto"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="includeWK" 
              checked={includeWholesaleKitchen}
              onCheckedChange={(checked) => {
                setIncludeWholesaleKitchen(checked as boolean);
              }}
            />
            <label
              htmlFor="includeWK"
              className="text-sm font-medium leading-none"
            >
              Include Wholesale/Kitchen
            </label>
          </div>
          
          <Button onClick={fetchHistoryData}>
            Apply Filters
          </Button>
        </div>
      </div>
      
      {/* History data table */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader className="h-8 w-8 animate-spin text-gray-500" />
          <span className="ml-2 text-gray-600">Loading history data...</span>
        </div>
      ) : historyData.length > 0 ? (
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date/Time</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Field Location</TableHead>
                <TableHead>Previous Stock</TableHead>
                <TableHead>Change</TableHead>
                <TableHead>New Stock</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Updated By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {historyData.map((entry) => (
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
    </div>
  );
}