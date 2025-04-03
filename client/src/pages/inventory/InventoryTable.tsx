import { useState } from "react";
import { Product } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, Minus } from "lucide-react";

interface Props {
  products: Product[];
  onViewDetails: (product: Product) => void;
}

export default function InventoryTable({ products, onViewDetails }: Props) {
  const { toast } = useToast();
  const [editableValues, setEditableValues] = useState<{ [key: string]: any }>({});
  
  // Mutation for updating a product field
  const { mutate: updateProduct } = useMutation({
    mutationFn: ({id, field, value}: {id: number, field: string, value: any}) => {
      const updateData = { [field]: value };
      return apiRequest("PUT", `/api/products/${id}`, updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Updated",
        description: "Product field updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update product field",
        variant: "destructive",
      });
    }
  });

  // Update local state before sending to server
  const handleFieldChange = (productId: number, field: string, value: any) => {
    setEditableValues(prev => {
      // If washInventory is changing, also update currentStock
      if (field === "washInventory") {
        return {
          ...prev,
          [productId]: {
            ...(prev[productId] || {}),
            [field]: value,
            currentStock: value
          }
        };
      }
      
      return {
        ...prev,
        [productId]: {
          ...(prev[productId] || {}),
          [field]: value
        }
      };
    });
  };

  // When losing focus, update the server
  const handleFieldBlur = (product: Product, field: string) => {
    if (!editableValues[product.id] || editableValues[product.id][field] === undefined) {
      return;
    }
    
    const value = editableValues[product.id][field];
    if (value === product[field as keyof Product]) {
      return;
    }

    // If washInventory is being updated, also update currentStock
    if (field === "washInventory") {
      updateProduct({
        id: product.id,
        field,
        value
      });
      
      // Also update the currentStock field
      updateProduct({
        id: product.id,
        field: "currentStock",
        value
      });
    } else {
      updateProduct({
        id: product.id,
        field,
        value
      });
    }
  };

  // Function to handle inventory increment/decrement
  const handleInventoryChange = (product: Product, field: string, change: number) => {
    const fieldValue = product[field as keyof Product] as string || "0";
    const currentValue = parseInt(fieldValue) || 0;
    const newValue = Math.max(0, currentValue + change).toString();
    
    handleFieldChange(product.id, field, newValue);
    
    // If washInventory is being updated, also update currentStock to match
    if (field === "washInventory") {
      handleFieldChange(product.id, "currentStock", newValue);
      updateProduct({
        id: product.id,
        field,
        value: newValue
      });
      // Also update the currentStock field
      updateProduct({
        id: product.id,
        field: "currentStock",
        value: newValue
      });
    } else {
      updateProduct({
        id: product.id,
        field,
        value: newValue
      });
    }
  };

  // Get the display value for a field, either from editableValues or the original product
  const getDisplayValue = (product: Product, field: string): string => {
    if (editableValues[product.id] && editableValues[product.id][field] !== undefined) {
      return editableValues[product.id][field];
    }
    
    const value = product[field as keyof Product];
    if (value === null || value === undefined) {
      return "";
    }
    
    return value.toString();
  };

  // Render a numeric field with +/- buttons
  const renderNumericField = (product: Product, field: string) => {
    const value = getDisplayValue(product, field);
    
    // Special styling for wash inventory field
    const isWashInventory = field === "washInventory";
    
    return (
      <div className="flex items-center space-x-2">
        <Button
          variant={isWashInventory ? "default" : "outline"}
          size="icon"
          className={`h-6 w-6 rounded-full p-0 ${isWashInventory ? "bg-blue-500 hover:bg-blue-600" : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            handleInventoryChange(product, field, -1);
          }}
        >
          <Minus className="h-3 w-3" />
        </Button>
        <Input
          className={`w-16 h-7 px-1 text-center ${isWashInventory ? "border-blue-400 font-medium" : ""}`}
          value={value}
          onChange={(e) => handleFieldChange(product.id, field, e.target.value)}
          onBlur={() => handleFieldBlur(product, field)}
          onClick={(e) => e.stopPropagation()}
        />
        <Button
          variant={isWashInventory ? "default" : "outline"}
          size="icon"
          className={`h-6 w-6 rounded-full p-0 ${isWashInventory ? "bg-blue-500 hover:bg-blue-600" : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            handleInventoryChange(product, field, 1);
          }}
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>
    );
  };

  // Render an editable text field
  const renderEditableTextField = (product: Product, field: string) => {
    const value = getDisplayValue(product, field);
    
    return (
      <Input
        className="h-7 px-2"
        value={value}
        onChange={(e) => handleFieldChange(product.id, field, e.target.value)}
        onBlur={() => handleFieldBlur(product, field)}
        onClick={(e) => e.stopPropagation()}
      />
    );
  };

  return (
    <div className="overflow-x-auto">
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
              Crop Needs
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Stand Inventory
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-blue-600 uppercase tracking-wider font-bold">
              Wash Inventory (Stock)
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Harvest Bins
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Units Harvested
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Field Notes
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Retail Notes
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {products.map((product) => (
            <tr
              key={product.id}
              className="hover:bg-gray-100 cursor-pointer"
              onClick={() => onViewDetails(product)}
            >
              <td className="px-4 py-3 whitespace-nowrap text-sm">
                {renderEditableTextField(product, "fieldLocation")}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800">
                {product.name}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm">
                {renderEditableTextField(product, "cropNeeds")}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm">
                {renderNumericField(product, "standInventory")}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm bg-blue-50 border-l-2 border-r-2 border-blue-400">
                {renderNumericField(product, "washInventory")}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm">
                {renderEditableTextField(product, "harvestBins")}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm">
                {renderEditableTextField(product, "unitsHarvested")}
              </td>
              <td className="px-4 py-3 text-sm max-w-[200px]">
                {renderEditableTextField(product, "fieldNotes")}
              </td>
              <td className="px-4 py-3 text-sm max-w-[200px]">
                {renderEditableTextField(product, "retailNotes")}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewDetails(product);
                  }}
                  className="px-2 py-1 text-xs"
                >
                  Details
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}