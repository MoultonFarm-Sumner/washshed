import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Product } from "@shared/schema";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";

export default function RetailOverviewPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [editingNotes, setEditingNotes] = useState<{ [key: number]: string }>({});

  // Fetch products
  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  // Mutation for updating retail notes
  const { mutate: updateRetailNotes } = useMutation({
    mutationFn: ({ id, notes }: { id: number, notes: string }) => {
      return apiRequest("PUT", `/api/products/${id}`, {
        retailNotes: notes,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Notes Updated",
        description: "Retail notes have been saved successfully.",
      });
      // Clear editing state after successful update
      setEditingNotes({});
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update notes",
        variant: "destructive",
      });
    },
  });

  // Filter products based on search query and sort alphabetically by name
  const filteredProducts = products
    .filter((product) => product.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));

  // Start editing notes for a product
  const startEditing = (productId: number, currentNotes: string = "") => {
    setEditingNotes({
      ...editingNotes,
      [productId]: currentNotes,
    });
  };

  // Save edited notes
  const saveNotes = (productId: number) => {
    const notes = editingNotes[productId] || "";
    updateRetailNotes({ id: productId, notes });
  };

  // Cancel editing
  const cancelEditing = (productId: number) => {
    const updatedEditingNotes = { ...editingNotes };
    delete updatedEditingNotes[productId];
    setEditingNotes(updatedEditingNotes);
  };

  // Handle notes change
  const handleNotesChange = (productId: number, value: string) => {
    setEditingNotes({
      ...editingNotes,
      [productId]: value,
    });
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-medium text-gray-800">Retail Overview</h2>
      </div>

      <div className="mb-6 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <Input
            placeholder="Search products..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="p-6 text-center">
          <div className="animate-spin inline-block w-8 h-8 border-4 border-current border-t-transparent text-blue-600 rounded-full"></div>
          <p className="mt-2 text-gray-600">Loading products...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="p-6 text-center">
          <p className="text-gray-500">No products found.</p>
          {searchQuery && (
            <p className="text-gray-500 text-sm mt-1">
              Try adjusting your search query.
            </p>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Crop
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Field Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Wash Inventory
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Harvest Bins
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Field Notes
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Retail Notes
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {product.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.fieldLocation}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="font-medium">{product.washInventory || "0"}</span> {product.unit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.harvestBins || "None"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      <div className="truncate" title={product.fieldNotes || "No field notes"}>
                        {product.fieldNotes || "No field notes"}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs">
                      {editingNotes.hasOwnProperty(product.id) ? (
                        <div className="space-y-2">
                          <Textarea
                            value={editingNotes[product.id] || ""}
                            onChange={(e) => handleNotesChange(product.id, e.target.value)}
                            placeholder="Enter retail notes..."
                            rows={3}
                            className="w-full"
                          />
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => cancelEditing(product.id)}
                              className="h-7 px-2 text-xs"
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => saveNotes(product.id)}
                              className="h-7 px-2 text-xs"
                            >
                              Save
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="truncate" title={product.retailNotes || "No retail notes"}>
                          {product.retailNotes || "No retail notes"}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {!editingNotes.hasOwnProperty(product.id) && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => startEditing(product.id, product.retailNotes || "")}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Edit Notes
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}