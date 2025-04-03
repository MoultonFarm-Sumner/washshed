import { useState, useEffect } from "react";
import { Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Product } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface WholesaleKitchenTabProps {
  products: Product[];
  onViewDetails: (product: Product) => void;
}

export default function WholesaleKitchenTab({ products, onViewDetails }: WholesaleKitchenTabProps) {
  const { toast } = useToast();
  // State to store the counts for each product
  const [wholesaleCounts, setWholesaleCounts] = useState<Record<number, number>>({});
  const [kitchenCounts, setKitchenCounts] = useState<Record<number, number>>({});

  // Mutation for adjusting inventory and creating history
  const { mutate: adjustInventory, isPending } = useMutation({
    mutationFn: (params: { productId: number, change: number, location: 'Wholesale' | 'Kitchen' }) => {
      return apiRequest("POST", "/api/inventory/adjust", {
        productId: params.productId,
        change: params.change,
        updatedBy: `${params.location} Update`,
        fieldLocation: params.location // Include the location in history
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/history"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update inventory",
        variant: "destructive",
      });
    }
  });

  // Load counts from localStorage on mount
  useEffect(() => {
    // Load wholesale counts
    const savedWholesaleCounts: Record<number, number> = {};
    // Load kitchen counts
    const savedKitchenCounts: Record<number, number> = {};
    
    products.forEach(product => {
      const wholesaleValue = localStorage.getItem(`wholesale-${product.id}`);
      if (wholesaleValue) {
        savedWholesaleCounts[product.id] = parseInt(wholesaleValue);
      }
      
      const kitchenValue = localStorage.getItem(`kitchen-${product.id}`);
      if (kitchenValue) {
        savedKitchenCounts[product.id] = parseInt(kitchenValue);
      }
    });
    
    setWholesaleCounts(savedWholesaleCounts);
    setKitchenCounts(savedKitchenCounts);
  }, [products]);

  // Helper to update wholesale count
  const updateWholesaleCount = (productId: number, value: number) => {
    if (isPending) return;
    
    const currentValue = wholesaleCounts[productId] || 0;
    // Don't allow negative values
    const newValue = Math.max(0, value);
    const change = newValue - currentValue;
    
    if (change !== 0) {
      setWholesaleCounts(prev => ({ ...prev, [productId]: newValue }));
      localStorage.setItem(`wholesale-${productId}`, newValue.toString());
      
      // Record the change in inventory history
      adjustInventory({ 
        productId, 
        change,
        location: 'Wholesale'
      });
    }
  };

  // Helper to update kitchen count
  const updateKitchenCount = (productId: number, value: number) => {
    if (isPending) return;
    
    const currentValue = kitchenCounts[productId] || 0;
    // Don't allow negative values
    const newValue = Math.max(0, value);
    const change = newValue - currentValue;
    
    if (change !== 0) {
      setKitchenCounts(prev => ({ ...prev, [productId]: newValue }));
      localStorage.setItem(`kitchen-${productId}`, newValue.toString());
      
      // Record the change in inventory history
      adjustInventory({ 
        productId, 
        change,
        location: 'Kitchen'
      });
    }
  };

  return (
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Field Location
          </th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Crop
          </th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Wholesale Count
          </th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Kitchen Count
          </th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Retail Notes
          </th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Field Notes
          </th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Actions
          </th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {/* Get unique crop names */}
        {Array.from(new Set(products.map(p => p.name)))
          .map((cropName) => {
            // Get the main product for this crop
            const product = products.find(p => p.name === cropName)!;
            
            // Get the counts for this product
            const wholesaleCount = wholesaleCounts[product.id] || 0;
            const kitchenCount = kitchenCounts[product.id] || 0;
            
            return (
              <tr 
                key={product.id} 
                className="hover:bg-gray-100 cursor-pointer"
                onClick={() => onViewDetails(product)}
              >
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                  {product.fieldLocation}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                  {product.name}
                </td>
                
                {/* Wholesale Count with +/- buttons */}
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-6 w-6 rounded-full p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        updateWholesaleCount(product.id, wholesaleCount - 1);
                      }}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    
                    <Input
                      className="w-16 h-7 px-1 text-center"
                      value={wholesaleCount}
                      onChange={(e) => {
                        e.stopPropagation();
                        const value = e.target.value.replace(/[^0-9]/g, "");
                        updateWholesaleCount(product.id, value ? parseInt(value) : 0);
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                    
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-6 w-6 rounded-full p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        updateWholesaleCount(product.id, wholesaleCount + 1);
                      }}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </td>
                
                {/* Kitchen Count with +/- buttons */}
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-6 w-6 rounded-full p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        updateKitchenCount(product.id, kitchenCount - 1);
                      }}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    
                    <Input
                      className="w-16 h-7 px-1 text-center"
                      value={kitchenCount}
                      onChange={(e) => {
                        e.stopPropagation();
                        const value = e.target.value.replace(/[^0-9]/g, "");
                        updateKitchenCount(product.id, value ? parseInt(value) : 0);
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                    
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-6 w-6 rounded-full p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        updateKitchenCount(product.id, kitchenCount + 1);
                      }}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </td>
                
                <td className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate">
                  {product.retailNotes || "No retail notes"}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate">
                  {product.fieldNotes || "No field notes"}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewDetails(product);
                    }}
                    className="text-xs"
                  >
                    Details
                  </Button>
                </td>
              </tr>
            );
          })}
      </tbody>
    </table>
  );
}