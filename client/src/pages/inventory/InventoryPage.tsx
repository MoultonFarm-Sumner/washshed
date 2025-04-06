import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus } from "lucide-react";
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
import WholesaleKitchenTab from "./WholesaleKitchenTab";



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
        <Button 
          onClick={() => setIsAddModalOpen(true)} 
          className="bg-green-600 hover:bg-green-700 text-white"
        >
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
                <WholesaleKitchenTab 
                  products={filteredProducts.filter(p => !["Wholesale", "Kitchen"].includes(p.fieldLocation))}
                  onViewDetails={handleViewProductDetails}
                />
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