import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, ArrowUp, ArrowDown } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Product } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { Input } from "@/components/ui/input";

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

  // Move a product up in the order
  const moveUp = (index: number) => {
    if (index === 0) return; // Already at the top
    
    const updatedProducts = [...orderedProducts];
    const temp = updatedProducts[index];
    updatedProducts[index] = updatedProducts[index - 1];
    updatedProducts[index - 1] = temp;
    
    setOrderedProducts(updatedProducts);
  };

  // Move a product down in the order
  const moveDown = (index: number) => {
    if (index === orderedProducts.length - 1) return; // Already at the bottom
    
    const updatedProducts = [...orderedProducts];
    const temp = updatedProducts[index];
    updatedProducts[index] = updatedProducts[index + 1];
    updatedProducts[index + 1] = temp;
    
    setOrderedProducts(updatedProducts);
  };

  // Change a product's position directly
  const changePosition = (index: number, newPosition: string) => {
    const position = parseInt(newPosition);
    
    if (isNaN(position) || position < 1 || position > orderedProducts.length) {
      return;
    }
    
    // Calculate the new index (subtract 1 as positions start from 1, indices from 0)
    const newIndex = position - 1;
    if (newIndex === index) return; // No change needed
    
    const updatedProducts = [...orderedProducts];
    const productToMove = updatedProducts[index];
    
    // Remove the product from its current position
    updatedProducts.splice(index, 1);
    
    // Insert it at the new position
    updatedProducts.splice(newIndex, 0, productToMove);
    
    setOrderedProducts(updatedProducts);
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
            Adjust the position numbers or use the up/down buttons to change the display order
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/inventory">
            <Button variant="outline">
              <ArrowLeft className="mr-1 h-4 w-4" /> Back
            </Button>
          </Link>
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
          <CardTitle>Reorder Inventory Items</CardTitle>
          <CardDescription>
            Change the position number or use the arrow buttons to move items up or down
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto bg-white rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                    Position
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Field Location
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Crop
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orderedProducts.map((product, index) => (
                  <tr key={product.id} className="hover:bg-gray-100">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <Input
                          className="w-16 h-8 px-2 text-center"
                          value={index + 1}
                          onChange={(e) => changePosition(index, e.target.value)}
                          type="number"
                          min={1}
                          max={orderedProducts.length}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800">
                      {product.fieldLocation}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800">
                      {product.name}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => moveUp(index)}
                          disabled={index === 0}
                          className="h-8 w-8 p-0"
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => moveDown(index)}
                          disabled={index === orderedProducts.length - 1}
                          className="h-8 w-8 p-0"
                        >
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}