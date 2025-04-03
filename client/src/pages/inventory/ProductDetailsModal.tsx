import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Product, FieldLocation } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MapPin, Save, Store, Warehouse, Utensils } from "lucide-react";
import { Separator } from "@/components/ui/separator";

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
  const [fieldNotes, setFieldNotes] = useState(product.fieldNotes || "");
  const [retailNotes, setRetailNotes] = useState(product.retailNotes || "");
  const [cropNeeds, setCropNeeds] = useState(product.cropNeeds || "");
  const [standInventory, setStandInventory] = useState(product.standInventory || "");
  const [washInventory, setWashInventory] = useState(product.washInventory || "");
  const [harvestBins, setHarvestBins] = useState(product.harvestBins || "");
  const [unitsHarvested, setUnitsHarvested] = useState(product.unitsHarvested || "");
  const [currentStock, setCurrentStock] = useState(product.currentStock);
  const [fieldLocation, setFieldLocation] = useState(product.fieldLocation);
  const [showInRetail, setShowInRetail] = useState(product.showInRetail !== undefined ? product.showInRetail : true);
  const [showInWholesale, setShowInWholesale] = useState(product.showInWholesale !== undefined ? product.showInWholesale : false);
  const [showInKitchen, setShowInKitchen] = useState(product.showInKitchen !== undefined ? product.showInKitchen : false);
  
  // Fetch field locations for dropdown
  const { data: fieldLocations = [] } = useQuery<FieldLocation[]>({
    queryKey: ['/api/field-locations'],
  });

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
      fieldNotes,
      retailNotes,
      cropNeeds,
      standInventory,
      washInventory,
      harvestBins,
      unitsHarvested,
      currentStock,
      fieldLocation,
      showInRetail,
      showInWholesale,
      showInKitchen
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
            src={"https://via.placeholder.com/120"}
            alt={product.name}
            className="w-24 h-24 object-cover rounded-lg mr-4"
          />
          <div className="flex-1">
            <p className="text-sm text-gray-600 mb-1">Field Location</p>
            <Select value={fieldLocation} onValueChange={setFieldLocation}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select field location" />
              </SelectTrigger>
              <SelectContent>
                {fieldLocations.map((location: FieldLocation) => (
                  <SelectItem key={location.id} value={location.name}>
                    {location.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Crop Needs
          </label>
          <Input
            value={cropNeeds}
            onChange={(e) => setCropNeeds(e.target.value)}
            placeholder="Enter crop needs"
          />
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Stand Inventory
            </label>
            <Input
              value={standInventory}
              onChange={(e) => setStandInventory(e.target.value)}
              placeholder="Stand inventory"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Wash Inventory
            </label>
            <Input
              value={washInventory}
              onChange={(e) => setWashInventory(e.target.value)}
              placeholder="Wash inventory"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Harvest Bins
            </label>
            <Input
              value={harvestBins}
              onChange={(e) => setHarvestBins(e.target.value)}
              placeholder="Harvest bins"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Units Harvested
            </label>
            <Input
              value={unitsHarvested}
              onChange={(e) => setUnitsHarvested(e.target.value)}
              placeholder="Units harvested"
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Field Notes
          </label>
          <Textarea
            value={fieldNotes}
            onChange={(e) => setFieldNotes(e.target.value)}
            rows={3}
            placeholder="Enter field notes"
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

        <div className="mb-4">
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

        <Separator className="my-4" />
        
        <div className="mb-4">
          <h3 className="text-md font-medium mb-2">Display In:</h3>
          <div className="space-y-3">
            <div className="flex flex-row items-center justify-between rounded-lg border p-3">
              <div className="flex items-center space-x-2">
                <Store className="h-4 w-4 text-green-600" />
                <Label htmlFor="retail-toggle" className="m-0">Retail</Label>
              </div>
              <Switch 
                id="retail-toggle" 
                checked={showInRetail} 
                onCheckedChange={setShowInRetail}
              />
            </div>
            
            <div className="flex flex-row items-center justify-between rounded-lg border p-3">
              <div className="flex items-center space-x-2">
                <Warehouse className="h-4 w-4 text-blue-600" />
                <Label htmlFor="wholesale-toggle" className="m-0">Wholesale</Label>
              </div>
              <Switch 
                id="wholesale-toggle" 
                checked={showInWholesale} 
                onCheckedChange={setShowInWholesale}
              />
            </div>
            
            <div className="flex flex-row items-center justify-between rounded-lg border p-3">
              <div className="flex items-center space-x-2">
                <Utensils className="h-4 w-4 text-amber-600" />
                <Label htmlFor="kitchen-toggle" className="m-0">Kitchen</Label>
              </div>
              <Switch 
                id="kitchen-toggle" 
                checked={showInKitchen} 
                onCheckedChange={setShowInKitchen}
              />
            </div>
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
