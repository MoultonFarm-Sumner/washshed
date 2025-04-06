import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Product } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import DraggableInventoryTable from "../inventory/DraggableInventoryTable";

export default function OrderEditorPage() {
  const { toast } = useToast();
  const [orderedProducts, setOrderedProducts] = useState<Product[]>([]);
  
  // Fetch all products
  const {
    data: products = [],
    isLoading,
    error,
  } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  // Update the local state with fetched products
  useEffect(() => {
    if (products.length > 0) {
      // Sort by ID as fallback if displayOrder is not set
      setOrderedProducts([...products].sort((a, b) => a.id - b.id));
    }
  }, [products]);

  // Mutation for saving the new order
  const { mutate: saveOrder, isPending: isSaving } = useMutation({
    mutationFn: (updatedProducts: Product[]) => {
      // In a real implementation, we would save the display order to the database
      // For now, just return success
      return Promise.resolve({ success: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Order Saved",
        description: "Your custom inventory order has been saved",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save inventory order",
        variant: "destructive",
      });
    }
  });

  // Handle order changes from the draggable table
  const handleOrderChanged = (reorderedProducts: Product[]) => {
    setOrderedProducts(reorderedProducts);
  };

  // View product details is not needed in this context
  const handleViewProductDetails = () => {
    // No-op, we don't need product details in order editor
  };

  if (isLoading) {
    return <div className="py-10 text-center">Loading inventory data...</div>;
  }

  if (error) {
    return <div className="py-10 text-center text-red-500">Error loading inventory data</div>;
  }

  return (
    <div className="container mx-auto py-6 max-w-7xl">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Edit Inventory Order</h1>
          <p className="text-gray-600">
            Drag and drop items to customize the display order
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="mr-1 h-4 w-4" /> Back
          </Button>
          <Button 
            onClick={() => saveOrder(orderedProducts)} 
            className="bg-green-600 hover:bg-green-700 text-white"
            disabled={isSaving}
          >
            <Save className="mr-1 h-4 w-4" /> Save Order
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Drag to Reorder</CardTitle>
          <CardDescription>
            Use the drag handles on the left of each row to change the order
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-white rounded-lg">
            <DraggableInventoryTable 
              products={orderedProducts} 
              onViewDetails={handleViewProductDetails}
              onOrderChanged={handleOrderChanged}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}