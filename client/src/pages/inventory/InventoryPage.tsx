import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import InventoryTable from "./InventoryTable";
import ProductDetailsModal from "./ProductDetailsModal";
import { Product } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AddProductModal from "./AddProductModal";
import { useIsMobile } from "@/hooks/use-mobile";

export default function InventoryPage() {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [filterFieldLocation, setFilterFieldLocation] = useState<string>("");
  
  // Fetch all products
  const {
    data: products = [],
    isLoading,
    error,
  } = useQuery<Product[]>({
    queryKey: ["/api/products", "?includeWholesaleKitchen=true"],
  });

  // Get all unique field locations for filter dropdown
  const fieldLocations = Array.from(
    new Set(products.map((product) => product.fieldLocation))
  ).filter(Boolean);
  
  // Update products order (future implementation)
  const { mutate: updateProductsOrder } = useMutation({
    mutationFn: (reorderedProducts: Product[]) => {
      // This would save the new order to the server
      // For now, we'll just return success
      return Promise.resolve({ success: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products", "?includeWholesaleKitchen=true"] });
      toast({
        title: "Order Updated",
        description: "Product order has been updated successfully",
      });
    },
  });
  
  // Update a product's data
  const { mutate: updateProductMutation } = useMutation({
    mutationFn: ({ id, ...data }: { id: number; [key: string]: any }) => {
      return apiRequest("PUT", `/api/products/${id}`, data);
    },
    onSuccess: async (response, variables) => {
      // If stock was changed, create inventory history entry
      if ('currentStock' in variables) {
        const product = products.find(p => p.id === variables.id);
        if (product && product.currentStock !== variables.currentStock) {
          await apiRequest("POST", "/api/inventory/adjust", {
            productId: variables.id,
            change: variables.currentStock - product.currentStock,
            updatedBy: "Farm Admin" // In a real app, get the current user
          });
        }
      }
      
      queryClient.invalidateQueries({ queryKey: ["/api/products", "?includeWholesaleKitchen=true"] });
      toast({
        title: "Updated",
        description: "Product updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update product",
        variant: "destructive",
      });
    }
  });
  
  // Create a new product
  const { mutate: addProductMutation } = useMutation({
    mutationFn: (productData: Partial<Product>) => {
      return apiRequest("POST", "/api/products", productData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products", "?includeWholesaleKitchen=true"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create product",
        variant: "destructive",
      });
    }
  });

  // No longer needed for reordering

  // Filter products based on search term and field location
  const filteredProducts = products.filter((product) => {
    const matchesSearch = searchTerm
      ? product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.fieldLocation.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.fieldNotes && product.fieldNotes.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (product.retailNotes && product.retailNotes.toLowerCase().includes(searchTerm.toLowerCase()))
      : true;
    
    const matchesLocation = filterFieldLocation
      ? product.fieldLocation === filterFieldLocation
      : true;
    
    return matchesSearch && matchesLocation;
  });

  // Open product details modal
  const handleViewProductDetails = (product: Product) => {
    setSelectedProduct(product);
    setIsDetailsModalOpen(true);
  };

  // When a product is updated
  const handleProductUpdated = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/products", "?includeWholesaleKitchen=true"] });
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
          <h1 className="text-2xl font-bold mb-1">Farm Inventory</h1>
          <p className="text-gray-600">
            Manage your farm inventory across all locations
          </p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)} className="bg-primary hover:bg-green-800">
          <Plus className="mr-1 h-4 w-4" /> Add New Crop
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filter Inventory</CardTitle>
          <CardDescription>
            Find specific items in your inventory
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by name, location, or notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="w-full sm:w-64">
              <Select value={filterFieldLocation} onValueChange={setFilterFieldLocation}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by field location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value=" ">All Locations</SelectItem>
                  {fieldLocations.map((location) => (
                    <SelectItem key={location} value={location}>
                      {location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="field" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="field">Field Inventory</TabsTrigger>
          <TabsTrigger value="wholesale-kitchen">Wholesale/Kitchen</TabsTrigger>
        </TabsList>

        <TabsContent value="field" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Field Inventory</CardTitle>
              <CardDescription>
                View and manage inventory for field operations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-white rounded-lg">
                <InventoryTable 
                  products={filteredProducts.filter(p => !["Wholesale", "Kitchen"].includes(p.fieldLocation))} 
                  onViewDetails={handleViewProductDetails}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="wholesale-kitchen" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Wholesale &amp; Kitchen Inventory</CardTitle>
              <CardDescription>
                Track crop quantities for wholesale and kitchen use
              </CardDescription>
            </CardHeader>
            <CardContent>
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
                    {Array.from(new Set(filteredProducts
                      .filter(p => !["Wholesale", "Kitchen"].includes(p.fieldLocation))
                      .map(p => p.name)))
                      .map((cropName) => {
                        // Get the main product for this crop
                        const product = filteredProducts.find(p => 
                          p.name === cropName && !["Wholesale", "Kitchen"].includes(p.fieldLocation)
                        )!;
                        
                        // Find corresponding Wholesale and Kitchen products if they exist
                        const wholesaleProduct = products.find(p => 
                          p.fieldLocation === "Wholesale" && p.name === cropName
                        ) || { id: 0, washInventory: "0" };
                        
                        const kitchenProduct = products.find(p => 
                          p.fieldLocation === "Kitchen" && p.name === cropName
                        ) || { id: 0, washInventory: "0" };
                        
                        return (
                          <tr 
                            key={product.id} 
                            className="hover:bg-gray-100 cursor-pointer"
                            onClick={() => handleViewProductDetails(product)}
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
                                    
                                    // If this product doesn't have a wholesale entry yet, create one
                                    if (wholesaleProduct.id === 0) {
                                      const newWholesaleProduct = {
                                        name: product.name,
                                        fieldLocation: "Wholesale",
                                        washInventory: "0", // Using washInventory instead of currentStock
                                        unit: product.unit,
                                        minStock: 0,
                                        retailNotes: product.retailNotes,
                                        fieldNotes: product.fieldNotes,
                                      };
                                      
                                      addProductMutation(newWholesaleProduct);
                                      toast({
                                        title: "Wholesale Entry Created",
                                        description: `Created wholesale entry for ${product.name}`,
                                      });
                                      return;
                                    }
                                    
                                    // Using washInventory instead of currentStock
                                    const currentValue = parseInt(wholesaleProduct.washInventory || "0");
                                    const newValue = Math.max(0, currentValue - 1).toString();
                                    updateProductMutation({
                                      id: wholesaleProduct.id,
                                      washInventory: newValue
                                    });
                                  }}
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                
                                <Input
                                  className="w-16 h-7 px-1 text-center"
                                  value={wholesaleProduct.washInventory || "0"}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    // Allow manual entry of values
                                    if (wholesaleProduct.id !== 0) {
                                      const newValue = e.target.value.replace(/[^0-9]/g, "");
                                      updateProductMutation({
                                        id: wholesaleProduct.id,
                                        washInventory: newValue
                                      });
                                    }
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                  readOnly={wholesaleProduct.id === 0}
                                />
                                
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-6 w-6 rounded-full p-0"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    
                                    if (wholesaleProduct.id === 0) {
                                      const newWholesaleProduct = {
                                        name: product.name,
                                        fieldLocation: "Wholesale",
                                        washInventory: "1", // Using washInventory instead of currentStock
                                        unit: product.unit,
                                        minStock: 0,
                                        retailNotes: product.retailNotes,
                                        fieldNotes: product.fieldNotes,
                                      };
                                      
                                      addProductMutation(newWholesaleProduct);
                                      toast({
                                        title: "Wholesale Entry Created",
                                        description: `Created wholesale entry for ${product.name}`,
                                      });
                                      return;
                                    }
                                    
                                    // Using washInventory instead of currentStock
                                    const currentValue = parseInt(wholesaleProduct.washInventory || "0");
                                    const newValue = (currentValue + 1).toString();
                                    updateProductMutation({
                                      id: wholesaleProduct.id,
                                      washInventory: newValue
                                    });
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
                                    
                                    if (kitchenProduct.id === 0) {
                                      const newKitchenProduct = {
                                        name: product.name,
                                        fieldLocation: "Kitchen",
                                        washInventory: "0", // Using washInventory instead of currentStock
                                        unit: product.unit,
                                        minStock: 0,
                                        retailNotes: product.retailNotes,
                                        fieldNotes: product.fieldNotes,
                                      };
                                      
                                      addProductMutation(newKitchenProduct);
                                      toast({
                                        title: "Kitchen Entry Created", 
                                        description: `Created kitchen entry for ${product.name}`,
                                      });
                                      return;
                                    }
                                    
                                    // Using washInventory instead of currentStock
                                    const currentValue = parseInt(kitchenProduct.washInventory || "0");
                                    const newValue = Math.max(0, currentValue - 1).toString();
                                    updateProductMutation({
                                      id: kitchenProduct.id,
                                      washInventory: newValue
                                    });
                                  }}
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                
                                <Input
                                  className="w-16 h-7 px-1 text-center"
                                  value={kitchenProduct.washInventory || "0"}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    // Allow manual entry of values
                                    if (kitchenProduct.id !== 0) {
                                      const newValue = e.target.value.replace(/[^0-9]/g, "");
                                      updateProductMutation({
                                        id: kitchenProduct.id,
                                        washInventory: newValue
                                      });
                                    }
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                  readOnly={kitchenProduct.id === 0}
                                />
                                
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-6 w-6 rounded-full p-0"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    
                                    if (kitchenProduct.id === 0) {
                                      const newKitchenProduct = {
                                        name: product.name,
                                        fieldLocation: "Kitchen",
                                        washInventory: "1", // Using washInventory instead of currentStock
                                        unit: product.unit,
                                        minStock: 0,
                                        retailNotes: product.retailNotes,
                                        fieldNotes: product.fieldNotes,
                                      };
                                      
                                      addProductMutation(newKitchenProduct);
                                      toast({
                                        title: "Kitchen Entry Created",
                                        description: `Created kitchen entry for ${product.name}`,
                                      });
                                      return;
                                    }
                                    
                                    // Using washInventory instead of currentStock
                                    const currentValue = parseInt(kitchenProduct.washInventory || "0");
                                    const newValue = (currentValue + 1).toString();
                                    updateProductMutation({
                                      id: kitchenProduct.id,
                                      washInventory: newValue
                                    });
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
                                  handleViewProductDetails(product);
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
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {selectedProduct && (
        <ProductDetailsModal
          product={selectedProduct}
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          onProductUpdated={handleProductUpdated}
        />
      )}

      <AddProductModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onProductAdded={handleProductUpdated}
      />
    </div>
  );
}