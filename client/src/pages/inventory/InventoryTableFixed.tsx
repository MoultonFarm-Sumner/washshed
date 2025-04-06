import { useState, useMemo, useEffect } from "react";
import { Product } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, Minus, ArrowUp, ArrowDown, MoveDown, MoveUp } from "lucide-react";
import { saveRowOrder, loadRowOrder } from "@/lib/rowOrderingService";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Props {
  products: Product[];
  onViewDetails: (product: Product) => void;
}

// Extended Product type with display order
interface ProductWithOrder extends Product {
  displayOrder: number;
}

export default function InventoryTable({ products, onViewDetails }: Props) {
  const { toast } = useToast();
  const [editableValues, setEditableValues] = useState<{ [key: string]: any }>({});
  const [selectedRowNumber, setSelectedRowNumber] = useState<string>("");
  const [customOrder, setCustomOrder] = useState<{[key: number]: number}>({});
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [selectedProductIdForReorder, setSelectedProductIdForReorder] = useState<number | null>(null);
  const [newRowNumber, setNewRowNumber] = useState<string>(""); 
  
  // Function to save order to the server via API
  const saveOrderToServer = async (order: {[key: number]: number}) => {
    try {
      // Convert object format to array format for server storage
      const productIds = Object.keys(order)
        .sort((a, b) => order[parseInt(a)] - order[parseInt(b)])
        .map(key => parseInt(key));
      
      // Save to server via API
      await saveRowOrder(productIds);
      
      // Also keep in localStorage as backup
      const orderStr = JSON.stringify(order);
      localStorage.setItem('inventoryRowOrder', orderStr);
      
      console.log("Row order saved to server and localStorage");
    } catch (e) {
      console.error("Failed to save order:", e);
      
      // Fallback to just localStorage if server fails
      try {
        const orderStr = JSON.stringify(order);
        localStorage.setItem('inventoryRowOrder', orderStr);
      } catch (error) {
        console.error("Failed to save order to localStorage:", error);
      }
    }
  };
  
  // Function to load order from server or localStorage
  const loadOrderFromStorage = async (): Promise<{[key: number]: number} | null> => {
    try {
      // First try to get from server
      const serverOrder = await loadRowOrder();
      
      if (serverOrder && serverOrder.length > 0) {
        // Convert array format to object format
        const orderObject: {[key: number]: number} = {};
        serverOrder.forEach((id, index) => {
          orderObject[id] = index + 1;
        });
        return orderObject;
      }
      
      // If not on server, try localStorage as fallback
      const savedOrder = localStorage.getItem('inventoryRowOrder');
      if (savedOrder) {
        const parsedOrder = JSON.parse(savedOrder);
        // Convert string keys back to numbers
        const fixedOrder: {[key: number]: number} = {};
        Object.keys(parsedOrder).forEach(key => {
          fixedOrder[parseInt(key)] = parsedOrder[key];
        });
        return fixedOrder;
      }
    } catch (e) {
      console.error("Failed to load order:", e);
      
      // Try localStorage as final fallback
      try {
        const savedOrder = localStorage.getItem('inventoryRowOrder');
        if (savedOrder) {
          const parsedOrder = JSON.parse(savedOrder);
          const fixedOrder: {[key: number]: number} = {};
          Object.keys(parsedOrder).forEach(key => {
            fixedOrder[parseInt(key)] = parsedOrder[key];
          });
          return fixedOrder;
        }
      } catch (error) {
        console.error("Failed to load order from localStorage:", error);
      }
    }
    return null;
  };
  
  // Load custom order from storage or initialize if empty
  useEffect(() => {
    // Use an async function inside useEffect
    const fetchOrderFromStorage = async () => {
      try {
        const loadedOrder = await loadOrderFromStorage();
        
        if (loadedOrder && Object.keys(loadedOrder).length > 0) {
          setCustomOrder(loadedOrder);
        } else if (Object.keys(customOrder).length === 0 && products.length > 0) {
          // No saved order and no current order, initialize with default
          initializeDefaultOrder();
        }
      } catch (error) {
        console.error("Error loading row order:", error);
        // Fallback to default order
        if (Object.keys(customOrder).length === 0 && products.length > 0) {
          initializeDefaultOrder();
        }
      }
    };
    
    fetchOrderFromStorage();
  }, [products]);
  
  // Save order to storage whenever it changes
  useEffect(() => {
    if (Object.keys(customOrder).length > 0) {
      // Don't need to await here since we're just triggering the save
      saveOrderToServer(customOrder).catch(err => {
        console.error("Failed to save row order to server:", err);
      });
    }
  }, [customOrder]);
  
  // Initialize with default ordering by ID
  const initializeDefaultOrder = () => {
    const initialOrder: {[key: number]: number} = {};
    products.forEach((product, index) => {
      initialOrder[product.id] = index + 1;
    });
    setCustomOrder(initialOrder);
  };
  
  // Ensure all products have a position and remove positions for products that don't exist
  useEffect(() => {
    if (Object.keys(customOrder).length > 0 && products.length > 0) {
      let needsUpdate = false;
      const updatedOrder = { ...customOrder };
      
      // Add missing products
      products.forEach(product => {
        if (!updatedOrder[product.id]) {
          // Find the highest existing position number
          const maxPosition = Math.max(...Object.values(updatedOrder), 0);
          updatedOrder[product.id] = maxPosition + 1;
          needsUpdate = true;
        }
      });
      
      // Remove products that no longer exist
      const productIds = new Set(products.map(p => p.id));
      Object.keys(updatedOrder).forEach(key => {
        const id = parseInt(key);
        if (!productIds.has(id)) {
          delete updatedOrder[id];
          needsUpdate = true;
        }
      });
      
      if (needsUpdate) {
        setCustomOrder(updatedOrder);
      }
    }
  }, [products, customOrder]);

  // Maintain a stable sort with custom ordering
  const stableProducts = useMemo(() => {
    const productsWithOrder: ProductWithOrder[] = products.map(product => ({
      ...product,
      displayOrder: customOrder[product.id] || product.id // fallback to id if no custom order
    }));
    
    return [...productsWithOrder].sort((a, b) => a.displayOrder - b.displayOrder);
  }, [products, customOrder]);
  
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

  // Move a row to a new position
  const handleRowReorder = () => {
    if (!selectedProductIdForReorder || !newRowNumber) return;
    
    const productId = parseInt(selectedProductIdForReorder.toString());
    const targetPosition = parseInt(newRowNumber);
    
    if (isNaN(targetPosition) || targetPosition < 1 || targetPosition > stableProducts.length) {
      toast({
        title: "Invalid Row Number",
        description: `Please enter a number between 1 and ${stableProducts.length}`,
        variant: "destructive",
      });
      return;
    }
    
    // Get current product index
    const currentIndex = stableProducts.findIndex(p => p.id === productId);
    if (currentIndex === -1) return;
    
    // Get the product name for better notifications
    const productName = stableProducts[currentIndex].name;
    
    // Calculate new order
    const newCustomOrder: {[key: number]: number} = {};
    
    // The current position is 1-indexed in the UI but 0-indexed in the array
    const currentPosition = currentIndex + 1;
    
    // If moving to the same position, do nothing
    if (currentPosition === targetPosition) {
      setIsOrderModalOpen(false);
      return;
    }
    
    // First copy all existing orders
    Object.keys(customOrder).forEach(key => {
      newCustomOrder[parseInt(key)] = customOrder[parseInt(key)];
    });
    
    // Moving up (lower number)
    if (targetPosition < currentPosition) {
      // Increment positions for products that will be pushed down
      stableProducts.forEach(product => {
        const productPos = newCustomOrder[product.id] || 0;
        if (productPos >= targetPosition && productPos < currentPosition) {
          newCustomOrder[product.id] = productPos + 1;
        }
      });
    } 
    // Moving down (higher number)
    else {
      // Decrement positions for products that will be pushed up
      stableProducts.forEach(product => {
        const productPos = newCustomOrder[product.id] || 0;
        if (productPos > currentPosition && productPos <= targetPosition) {
          newCustomOrder[product.id] = productPos - 1;
        }
      });
    }
    
    // Set the new position for the moved product
    newCustomOrder[productId] = targetPosition;
    
    // Save to server and localStorage
    try {
      // Convert object format to array format for server storage
      const productIds = Object.keys(newCustomOrder)
        .sort((a, b) => newCustomOrder[parseInt(a)] - newCustomOrder[parseInt(b)])
        .map(key => parseInt(key));
      
      // Save to server via API
      saveRowOrder(productIds).catch(err => {
        console.error("Failed to save row order to server during reordering:", err);
      });
      
      // Also keep in localStorage as backup
      const orderStr = JSON.stringify(newCustomOrder);
      localStorage.setItem('inventoryRowOrder', orderStr);
      
      console.log("Row order saved during reordering");
    } catch (e) {
      console.error("Failed to save updated order:", e);
    }
    
    // Update state
    setCustomOrder(newCustomOrder);
    setIsOrderModalOpen(false);
    setSelectedProductIdForReorder(null);
    setNewRowNumber("");
    
    toast({
      title: "Row Order Updated",
      description: `"${productName}" moved to row position ${targetPosition}`,
    });
  };

  return (
    <div>
      <div className="mb-4 flex items-center space-x-2 justify-between">
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
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // Reset to default ordering by ID
              localStorage.removeItem('inventoryRowOrder');
              // Clear the cookie too
              document.cookie = "inventoryRowOrder=; path=/; max-age=0";
              // Clear from server - save empty array
              saveRowOrder([]).catch(err => {
                console.error("Failed to reset row order on server:", err);
              });
              // Initialize default order
              initializeDefaultOrder();
              toast({
                title: "Order Reset",
                description: "Row order has been reset to default",
              });
            }}
          >
            Reset Order
          </Button>
          <div className="text-sm text-gray-500">
            Total rows: {stableProducts.length}
          </div>
        </div>
      </div>
      
      {/* Dialog for changing row position */}
      <Dialog open={isOrderModalOpen} onOpenChange={setIsOrderModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Change Row Position</DialogTitle>
            <DialogDescription>
              Enter the new row number for this item.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex items-center gap-4">
              <label htmlFor="new-row" className="text-right">
                New Position:
              </label>
              <Input
                id="new-row"
                type="number"
                value={newRowNumber}
                onChange={(e) => setNewRowNumber(e.target.value)}
                min={1}
                max={stableProducts.length}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOrderModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRowReorder}>Move</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                <div className="flex items-center space-x-1">
                  <span>Row #</span>
                </div>
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
                  <div className="flex items-center justify-center gap-2">
                    <span>{index + 1}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedProductIdForReorder(product.id);
                        setNewRowNumber((index + 1).toString());
                        setIsOrderModalOpen(true);
                      }}
                    >
                      <MoveUp className="h-3 w-3" />
                    </Button>
                  </div>
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
    </div>
  );
}