import { useState, useEffect, useMemo } from "react";
import { Product } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, Minus } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Props {
  products: Product[];
  onViewDetails: (product: Product) => void;
}

export default function InventoryTable({ products, onViewDetails }: Props) {
  const { toast } = useToast();
  const [editableValues, setEditableValues] = useState<{ [key: string]: any }>({});
  const [selectedRowNumber, setSelectedRowNumber] = useState<string>("");
  
  // Maintain a stable sort by ID to prevent rows from jumping around
  const stableProducts = useMemo(() => {
    return [...products].sort((a, b) => a.id - b.id);
  }, [products]);
  
  // Handle row number selection
  const handleRowSelect = () => {
    const rowNum = parseInt(selectedRowNumber);
    if (isNaN(rowNum) || rowNum < 1 || rowNum > stableProducts.length) {
      toast({
        title: "Invalid Row Number",
        description: `Please enter a number between 1 and ${stableProducts.length}`,
        variant: "destructive",
      });
      return;
    }
    
    const product = stableProducts[rowNum - 1];
    if (product) {
      onViewDetails(product);
    }
  };
  
  // Fetch field locations for dropdown
  const { data: fieldLocations = [] } = useQuery<string[]>({
    queryKey: ["/api/field-locations"],
    select: (data) => data.map((location: any) => location.name),
  });
  
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
    setEditableValues(prev => ({
      ...prev,
      [productId]: {
        ...(prev[productId] || {}),
        [field]: value
      }
    }));
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

    updateProduct({
      id: product.id,
      field,
      value
    });
  };

  // Function to handle inventory increment/decrement
  const handleInventoryChange = (product: Product, field: string, change: number) => {
    const fieldValue = product[field as keyof Product] as string || "0";
    const currentValue = parseInt(fieldValue) || 0;
    const newValue = Math.max(0, currentValue + change).toString();
    
    handleFieldChange(product.id, field, newValue);
    updateProduct({
      id: product.id,
      field,
      value: newValue
    });
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
    
    return (
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="icon"
          className="h-6 w-6 rounded-full p-0"
          onClick={(e) => {
            e.stopPropagation();
            handleInventoryChange(product, field, -1);
          }}
        >
          <Minus className="h-3 w-3" />
        </Button>
        <Input
          className="w-16 h-7 px-1 text-center"
          value={value}
          onChange={(e) => handleFieldChange(product.id, field, e.target.value)}
          onBlur={() => handleFieldBlur(product, field)}
          onClick={(e) => e.stopPropagation()}
        />
        <Button
          variant="outline"
          size="icon"
          className="h-6 w-6 rounded-full p-0"
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

  // Render the field location dropdown
  const renderFieldLocationDropdown = (product: Product) => {
    const value = getDisplayValue(product, "fieldLocation");
    
    return (
      <div onClick={(e: React.MouseEvent) => e.stopPropagation()}>
        <Select
          defaultValue={value}
          onValueChange={(newValue) => {
            handleFieldChange(product.id, "fieldLocation", newValue);
            updateProduct({
              id: product.id,
              field: "fieldLocation",
              value: newValue
            });
          }}
        >
          <SelectTrigger className="h-7 w-full">
            <SelectValue placeholder="Select location" />
          </SelectTrigger>
          <SelectContent>
            {fieldLocations.map((location) => (
              <SelectItem key={location} value={location}>
                {location}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
    <>
      <div className="mb-4 flex items-center space-x-2">
        <div className="flex items-center space-x-2">
          <Input
            type="number"
            placeholder="Go to row #"
            className="w-32"
            value={selectedRowNumber}
            onChange={(e) => setSelectedRowNumber(e.target.value)}
            min={1}
            max={stableProducts.length}
          />
          <Button 
            variant="outline" 
            onClick={handleRowSelect}
            size="sm"
          >
            Go
          </Button>
        </div>
        <div className="text-sm text-gray-500">
          Total rows: {stableProducts.length}
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                Row #
              </th>
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
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Wash Inventory
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
            {stableProducts.map((product, index) => (
              <tr
                key={product.id}
                className="hover:bg-gray-100 cursor-pointer"
                onClick={() => onViewDetails(product)}
              >
                <td className="px-4 py-3 whitespace-nowrap text-sm text-center font-semibold">
                  {index + 1}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm">
                  {renderFieldLocationDropdown(product)}
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
                <td className="px-4 py-3 whitespace-nowrap text-sm">
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
    </>
  );
}