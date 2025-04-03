import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Product } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MapPin, Save } from "lucide-react";

interface ProductDetailsModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  onProductUpdated: () => void;
}

export default function ProductDetailsModal({
  product,
  isOpen,
  onClose,
  onProductUpdated,
}: ProductDetailsModalProps) {
  const { toast } = useToast();
  const [productionNotes, setProductionNotes] = useState(product.productionNotes || "");
  const [retailNotes, setRetailNotes] = useState(product.retailNotes || "");
  const [currentStock, setCurrentStock] = useState(product.currentStock);
  const [unit, setUnit] = useState(product.unit);

  const { mutate: updateProduct, isPending } = useMutation({
    mutationFn: (updatedProduct: Partial<Product>) => {
      return apiRequest("PUT", `/api/products/${product.id}`, updatedProduct);
    },
    onSuccess: async (response) => {
      // If stock was changed, create inventory history entry
      if (currentStock !== product.currentStock) {
        await apiRequest("POST", "/api/inventory/adjust", {
          productId: product.id,
          change: currentStock - product.currentStock,
          updatedBy: "Farm Admin" // In a real app, get the current user
        });
      }
      
      onProductUpdated();
      onClose();
      toast({
        title: "Success",
        description: "Product details updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update product details",
        variant: "destructive",
      });
    }
  });

  const handleSave = () => {
    updateProduct({
      productionNotes,
      retailNotes,
      currentStock,
      unit
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{product.name} - Details</DialogTitle>
        </DialogHeader>
        <div className="flex items-center mb-4">
          <img
            src={product.imageUrl || "https://via.placeholder.com/120"}
            alt={product.name}
            className="w-24 h-24 object-cover rounded-lg mr-4"
          />
          <div>
            <p className="text-sm text-gray-600 mb-1">Field Location</p>
            <div className="flex items-center">
              <MapPin className="h-4 w-4 text-gray-500 mr-1" />
              <span>{product.fieldLocation}</span>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Production Notes
          </label>
          <Textarea
            value={productionNotes}
            onChange={(e) => setProductionNotes(e.target.value)}
            rows={3}
            placeholder="Enter production notes"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Retail Notes
          </label>
          <Textarea
            value={retailNotes}
            onChange={(e) => setRetailNotes(e.target.value)}
            rows={3}
            placeholder="Enter retail notes"
          />
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current Stock
            </label>
            <Input
              type="number"
              value={currentStock}
              onChange={(e) => setCurrentStock(parseInt(e.target.value) || 0)}
              min={0}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Unit
            </label>
            <Select value={unit} onValueChange={setUnit}>
              <SelectTrigger>
                <SelectValue placeholder="Select unit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bunches">bunches</SelectItem>
                <SelectItem value="lbs">lbs</SelectItem>
                <SelectItem value="boxes">boxes</SelectItem>
                <SelectItem value="each">each</SelectItem>
                <SelectItem value="heads">heads</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button 
          className="w-full bg-primary hover:bg-green-800"
          onClick={handleSave}
          disabled={isPending}
        >
          <Save className="mr-1 h-4 w-4" />
          Save Changes
        </Button>
      </DialogContent>
    </Dialog>
  );
}
