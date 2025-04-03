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
  const [fieldNotes, setFieldNotes] = useState(product.fieldNotes || "");
  const [retailNotes, setRetailNotes] = useState(product.retailNotes || "");
  const [cropNeeds, setCropNeeds] = useState(product.cropNeeds || "");
  const [standInventory, setStandInventory] = useState(product.standInventory || "");
  const [washInventory, setWashInventory] = useState(product.washInventory || "");
  const [harvestBins, setHarvestBins] = useState(product.harvestBins || "");
  const [unitsHarvested, setUnitsHarvested] = useState(product.unitsHarvested || "");
  // currentStock removed as requested, using washInventory instead
  const [fieldLocation, setFieldLocation] = useState(product.fieldLocation);
  
  // Fetch field locations for dropdown
  const { data: fieldLocations = [] } = useQuery<FieldLocation[]>({
    queryKey: ['/api/field-locations'],
  });

  const { mutate: updateProduct, isPending } = useMutation({
    mutationFn: (updatedProduct: Partial<Product>) => {
      return apiRequest("PUT", `/api/products/${product.id}`, updatedProduct);
    },
    onSuccess: async (response) => {
      // No longer tracking current stock changes for inventory history
      // Using washInventory instead
      
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
      fieldLocation
      // currentStock removed as requested, using washInventory instead
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

        {/* Current Stock field has been removed as requested, using Wash Inventory instead */}

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
