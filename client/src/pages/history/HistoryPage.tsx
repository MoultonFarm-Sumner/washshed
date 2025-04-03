import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Filter } from "lucide-react";

export default function HistoryPage() {
  const { toast } = useToast();
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Format dates for API request
  const formattedStartDate = startDate ? new Date(startDate).toISOString() : undefined;
  const formattedEndDate = endDate ? new Date(endDate).toISOString() : undefined;

  // Construct the query key with date parameters if available
  const queryKey = [
    "/api/inventory/history",
    ...(formattedStartDate && formattedEndDate
      ? [`?startDate=${formattedStartDate}&endDate=${formattedEndDate}`]
      : [""]),
  ];

  // Fetch inventory history data
  const {
    data: historyData = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey,
  });

  // Handle apply filter button click
  const handleApplyFilter = () => {
    refetch();
  };

  // Format date for display
  const formatDateDisplay = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM dd, yyyy");
    } catch (error) {
      return "Invalid date";
    }
  };

  // Format time for display
  const formatTimeDisplay = (dateString: string) => {
    try {
      return format(new Date(dateString), "hh:mm a");
    } catch (error) {
      return "Invalid time";
    }
  };

  // Calculate pagination
  const totalItems = historyData.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const paginatedHistory = historyData.slice((page - 1) * pageSize, page * pageSize);

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
        <h2 className="text-2xl font-medium text-gray-800">Inventory History</h2>
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center">
            <label className="text-sm mr-2 whitespace-nowrap">From:</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-auto"
            />
          </div>
          <div className="flex items-center">
            <label className="text-sm mr-2 whitespace-nowrap">To:</label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-auto"
            />
          </div>
          <Button
            className="bg-blue-600 hover:bg-blue-700"
            onClick={handleApplyFilter}
            disabled={isLoading}
          >
            <Filter className="mr-1 h-4 w-4" />
            Apply Filter
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
        {isLoading ? (
          <div className="p-6 text-center">
            <div className="animate-spin inline-block w-8 h-8 border-4 border-current border-t-transparent text-blue-600 rounded-full"></div>
            <p className="mt-2 text-gray-600">Loading history...</p>
          </div>
        ) : paginatedHistory.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-gray-500">No history records found.</p>
            {(startDate || endDate) && (
              <p className="text-gray-500 text-sm mt-1">
                Try adjusting your date filters.
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
                    Field
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Change
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    New Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Updated By
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedHistory.map((entry: any) => (
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
                      {entry.newStock} {entry.unit}
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
          <div className="bg-gray-50 px-6 py-3 flex items-center justify-between border-t border-gray-200">
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
      </div>
    </div>
  );
}
