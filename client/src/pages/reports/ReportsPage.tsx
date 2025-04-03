import { useState } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { BarChart, FileDown } from "lucide-react";
import { generatePDF } from "@/lib/pdf-generator";
import { HistoryEntry, Product, ReportItem } from "@/types";

export default function ReportsPage() {
  const { toast } = useToast();
  const [reportType, setReportType] = useState("daily");
  const [startDate, setStartDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [filterBy, setFilterBy] = useState("all");
  const [showReport, setShowReport] = useState(false);

  // Fetch products for filter dropdown
  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

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
    products.forEach((product: Product) => {
      // Filter out wholesale/kitchen products
      if(["Wholesale", "Kitchen"].includes(product.fieldLocation)) {
        return; // Skip wholesale/kitchen products
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
        isLowStock: product.currentStock < 10,
        isCriticalStock: product.currentStock < 5,
        fieldNotes: product.fieldNotes,
        retailNotes: product.retailNotes,
        washInventory: product.washInventory || "Not specified"
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

  const reportData = processReportData();

  // Generate and export PDF report
  const handleExportPDF = async () => {
    if (!reportData) {
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

  // Generate report
  const handleGenerateReport = () => {
    setShowReport(true);
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap justify-between items-center gap-4">
        <h2 className="text-2xl font-medium text-gray-800">Reports</h2>
        <Button
          className="bg-blue-600 hover:bg-blue-700"
          onClick={handleExportPDF}
          disabled={!showReport || historyLoading}
        >
          <FileDown className="mr-1 h-4 w-4" />
          Export as PDF
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-medium text-lg text-gray-800 mb-4">Report Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <div className="flex items-center">
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-r-none"
                />
                <span className="px-2 text-gray-500 border-y border-gray-300">
                  to
                </span>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded-l-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filter By
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
          </div>
          <div className="mt-4 flex justify-end">
            <Button 
              className="bg-primary hover:bg-green-800" 
              onClick={handleGenerateReport}
            >
              <BarChart className="mr-1 h-4 w-4" />
              Generate Report
            </Button>
          </div>
        </div>

        {showReport && (
          <div className="p-4">
            <h3 className="font-medium text-lg text-gray-800 mb-4">
              Current Report: {reportType === "daily" ? "Daily" : "Monthly"} Summary - {format(new Date(startDate), "MMM dd, yyyy")}
              {startDate !== endDate ? ` to ${format(new Date(endDate), "MMM dd, yyyy")}` : ""}
            </h3>

            {historyLoading ? (
              <div className="text-center p-4">
                <div className="animate-spin inline-block w-8 h-8 border-4 border-current border-t-transparent text-blue-600 rounded-full"></div>
                <p className="mt-2 text-gray-600">Generating report...</p>
              </div>
            ) : reportData && reportData.length > 0 ? (
              <>
                <div className="mb-6">
                  <h4 className="font-medium text-gray-700 mb-2">Inventory Changes</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Field Location
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Crop
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Current
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Units
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Changes
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Wash Inventory
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Field Notes
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Retail Notes
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {reportData.map((product: ReportItem) => (
                          <tr key={product.id}>
                            <td className="px-3 py-4 text-sm text-gray-800">
                              {product.fieldLocation}
                            </td>
                            <td className="px-3 py-4 text-sm text-gray-800">
                              {product.name}
                            </td>
                            <td className="px-3 py-4 text-sm text-gray-800 font-medium">
                              {product.current}
                            </td>
                            <td className="px-3 py-4 text-sm text-gray-800">
                              {product.unit}
                            </td>
                            <td className="px-3 py-4 text-sm">
                              <div className="flex flex-col">
                                <span className="text-green-600 font-medium">
                                  {product.added > 0 ? `+${product.added}` : ""}
                                </span>
                                <span className="text-red-600 font-medium">
                                  {product.removed > 0 ? `-${product.removed}` : ""}
                                </span>
                              </div>
                            </td>
                            <td className="px-3 py-4 text-sm text-gray-800 max-w-[200px]">
                              <div className="truncate" title={product.washInventory || "-"}>
                                {product.washInventory || "-"}
                              </div>
                            </td>
                            <td className="px-3 py-4 text-sm text-gray-800 max-w-[200px]">
                              <div className="truncate" title={product.fieldNotes || "-"}>
                                {product.fieldNotes || "-"}
                              </div>
                            </td>
                            <td className="px-3 py-4 text-sm text-gray-800 max-w-[200px]">
                              <div className="truncate" title={product.retailNotes || "-"}>
                                {product.retailNotes || "-"}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Low Stock Alert</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Field Location
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Crop
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Current
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Units
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Wash Inventory
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Field Notes
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Retail Notes
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {reportData
                          .filter((product: ReportItem) => product.isLowStock)
                          .map((product: ReportItem) => (
                            <tr key={product.id}>
                              <td className="px-3 py-4 text-sm text-gray-800">
                                {product.fieldLocation}
                              </td>
                              <td className="px-3 py-4 text-sm text-gray-800">
                                {product.name}
                              </td>
                              <td className="px-3 py-4 text-sm text-gray-800 font-medium">
                                {product.current}
                              </td>
                              <td className="px-3 py-4 text-sm text-gray-800">
                                {product.unit}
                              </td>
                              <td className="px-3 py-4">
                                <span
                                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                    product.isCriticalStock
                                      ? "bg-red-100 text-red-800"
                                      : "bg-yellow-100 text-yellow-800"
                                  }`}
                                >
                                  {product.isCriticalStock
                                    ? "Critical Stock"
                                    : "Low Stock"}
                                </span>
                              </td>
                              <td className="px-3 py-4 text-sm text-gray-800 max-w-[200px]">
                                <div className="truncate" title={product.washInventory || "-"}>
                                  {product.washInventory || "-"}
                                </div>
                              </td>
                              <td className="px-3 py-4 text-sm text-gray-800 max-w-[200px]">
                                <div className="truncate" title={product.fieldNotes || "-"}>
                                  {product.fieldNotes || "-"}
                                </div>
                              </td>
                              <td className="px-3 py-4 text-sm text-gray-800 max-w-[200px]">
                                <div className="truncate" title={product.retailNotes || "-"}>
                                  {product.retailNotes || "-"}
                                </div>
                              </td>
                            </tr>
                          ))}
                        {reportData.filter((product: ReportItem) => product.isLowStock).length === 0 && (
                          <tr>
                            <td
                              colSpan={8}
                              className="px-3 py-4 text-sm text-gray-500 text-center"
                            >
                              No low stock items found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center p-4">
                <p className="text-gray-500">No data available for the selected period.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
