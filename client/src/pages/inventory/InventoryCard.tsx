import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Product } from "@shared/schema";
import { Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface InventoryCardProps {
  product: Product;
  onViewDetails: (product: Product) => void;
  onInventoryUpdated: () => void;
}

export default function InventoryCard({ 
  product, 
  onViewDetails,
  onInventoryUpdated
}: InventoryCardProps) {
  const { toast } = useToast();
  const [stockValue, setStockValue] = useState(product.currentStock);

  const isLowStock = product.currentStock < 10 && product.currentStock >= 5;
  const isCriticalStock = product.currentStock < 5;

  // Determine card border styling based on stock level
  const cardBorderClass = isCriticalStock
    ? "border-l-4 border-red-500"
    : isLowStock
    ? "border-l-4 border-yellow-400"
    : "";

  // Determine stock text color based on stock level
  const stockTextClass = isCriticalStock
    ? "text-red-500"
    : isLowStock
    ? "text-yellow-600"
    : "";

  // Mutation for adjusting inventory
  const { mutate: adjustInventory, isPending } = useMutation({
    mutationFn: (change: number) => {
      return apiRequest("POST", "/api/inventory/adjust", {
        productId: product.id,
        change,
        updatedBy: "Farm Admin" // In a real app, get the current user
      });
    },
    onSuccess: async () => {
      onInventoryUpdated();
      toast({
        title: "Success",
        description: "Inventory updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update inventory",
        variant: "destructive",
      });
      // Reset the stock value to the original
      setStockValue(product.currentStock);
    }
  });

  const handleDecrease = () => {
    if (stockValue > 0 && !isPending) {
      const newValue = stockValue - 1;
      setStockValue(newValue);
      adjustInventory(-1);
    }
  };

  const handleIncrease = () => {
    if (!isPending) {
      const newValue = stockValue + 1;
      setStockValue(newValue);
      adjustInventory(1);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value >= 0) {
      setStockValue(value);
    }
  };

  const handleInputBlur = () => {
    if (stockValue !== product.currentStock) {
      const change = stockValue - product.currentStock;
      adjustInventory(change);
    }
  };

  return (
    <div className={`card bg-white rounded-lg shadow-sm overflow-hidden ${cardBorderClass}`}>
      <div className="flex p-4 items-center border-b border-gray-100">
        <img 
          src={product.imageUrl || "https://via.placeholder.com/80"} 
          alt={product.name} 
          className="w-16 h-16 object-cover rounded-lg mr-3"
        />
        <div>
          <h3 className="font-medium text-gray-800">{product.name}</h3>
          <p className="text-sm text-gray-600">{product.fieldLocation}</p>
        </div>
      </div>
      <div className="p-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-500">Current Stock</span>
          <span className={`font-medium ${stockTextClass}`}>
            {product.currentStock} {product.unit}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="icon"
            className="bg-gray-200 hover:bg-gray-300 rounded-lg p-1 min-w-[48px] min-h-[48px]"
            onClick={handleDecrease}
            disabled={isPending || product.currentStock <= 0}
          >
            <span className="material-icons">remove</span>
          </Button>
          <Input
            type="number"
            className="w-16 py-2 px-2 mx-1 text-center"
            value={stockValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            min={0}
            disabled={isPending}
          />
          <Button
            variant="default"
            size="icon"
            className="bg-primary hover:bg-green-800 text-white rounded-lg p-1 min-w-[48px] min-h-[48px]"
            onClick={handleIncrease}
            disabled={isPending}
          >
            <span className="material-icons">add</span>
          </Button>
        </div>
      </div>
      <Button
        variant="ghost"
        className="w-full py-2 text-blue-600 hover:bg-gray-50 font-medium flex justify-center items-center border-t border-gray-100"
        onClick={() => onViewDetails(product)}
      >
        <Edit className="mr-1 h-4 w-4" />
        View Details
      </Button>
    </div>
  );
}
