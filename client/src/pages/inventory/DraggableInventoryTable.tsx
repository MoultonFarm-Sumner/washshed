import { useState } from "react";
import { Product, FieldLocation } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, Minus } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableTableRow } from "@/pages/inventory/SortableTableRow";

interface Props {
  products: Product[];
  onViewDetails: (product: Product) => void;
  onOrderChanged: (products: Product[]) => void;
}

export default function DraggableInventoryTable({ products, onViewDetails, onOrderChanged }: Props) {
  const { toast } = useToast();
  const [editableValues, setEditableValues] = useState<{ [key: string]: any }>({});
  
  // Setup sensors for drag detection
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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

  // Handle drag end event for reordering
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = products.findIndex(p => p.id.toString() === active.id);
      const newIndex = products.findIndex(p => p.id.toString() === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(products, oldIndex, newIndex);
        onOrderChanged(newOrder);
      }
    }
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
    <div className="overflow-x-auto bg-white rounded-lg shadow">
      <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <table className="min-w-full divide-y divide-gray-200 border-collapse">
          <thead className="bg-gray-100 sticky top-0">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-[160px]">
                Field Location
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-[180px]">
                Crop
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-[100px]">
                Crop Needs
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-[120px]">
                Stand Inventory
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-[120px]">
                Wash Inventory
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-[100px]">
                Harvest Bins
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-[110px]">
                Units Harvested
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Field Notes
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-[100px]">
                Actions
              </th>
            </tr>
          </thead>
          <SortableContext 
            items={products.map(p => p.id.toString())}
            strategy={verticalListSortingStrategy}
          >
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map((product) => (
                <SortableTableRow
                  key={product.id}
                  id={product.id.toString()}
                  onClick={() => onViewDetails(product)}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-2 text-sm">
                    <div className="font-medium text-gray-700">
                      {renderEditableTextField(product, "fieldLocation")}
                    </div>
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-800 font-medium">
                    {product.name}
                  </td>
                  <td className="px-4 py-2 text-sm">
                    {renderEditableTextField(product, "cropNeeds")}
                  </td>
                  <td className="px-4 py-2 text-sm">
                    {renderNumericField(product, "standInventory")}
                  </td>
                  <td className="px-4 py-2 text-sm">
                    {renderNumericField(product, "washInventory")}
                  </td>
                  <td className="px-4 py-2 text-sm">
                    {renderEditableTextField(product, "harvestBins")}
                  </td>
                  <td className="px-4 py-2 text-sm">
                    {renderEditableTextField(product, "unitsHarvested")}
                  </td>
                  <td className="px-4 py-2 text-sm">
                    {renderEditableTextField(product, "fieldNotes")}
                  </td>
                  <td className="px-4 py-2 text-sm font-medium">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewDetails(product);
                      }}
                      className="w-full text-xs bg-white hover:bg-gray-100"
                    >
                      Details
                    </Button>
                  </td>
                </SortableTableRow>
              ))}
            </tbody>
          </SortableContext>
        </table>
      </DndContext>
    </div>
  );
}