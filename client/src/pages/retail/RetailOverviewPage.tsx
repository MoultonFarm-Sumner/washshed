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

  // Filter products based on search query
  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="overflow-hidden">
              <CardHeader className="bg-gray-50 pb-3">
                <CardTitle className="text-lg">{product.name}</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Wash Inventory</h3>
                  <p className="text-lg font-semibold">{product.washInventory || "0"} {product.unit}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Harvest Bins</h3>
                  <p>{product.harvestBins || "None"}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Field Notes</h3>
                  <p className="text-sm">{product.fieldNotes || "No field notes"}</p>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="text-sm font-medium text-gray-500">Retail Notes</h3>
                    {!editingNotes.hasOwnProperty(product.id) && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => startEditing(product.id, product.retailNotes || "")}
                        className="h-7 px-2 text-xs"
                      >
                        Edit
                      </Button>
                    )}
                  </div>
                  
                  {editingNotes.hasOwnProperty(product.id) ? (
                    <div className="space-y-2">
                      <Textarea
                        value={editingNotes[product.id] || ""}
                        onChange={(e) => handleNotesChange(product.id, e.target.value)}
                        placeholder="Enter retail notes..."
                        rows={3}
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
                    <p className="text-sm">{product.retailNotes || "No retail notes"}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}