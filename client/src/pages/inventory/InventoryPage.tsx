import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import DraggableInventoryTable from "./DraggableInventoryTable";
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
    queryKey: ["/api/products"],
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
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Order Updated",
        description: "Product order has been updated successfully",
      });
    },
  });

  // Handle product reordering via drag and drop
  const handleProductsReordered = (reorderedProducts: Product[]) => {
    // This would update the order in the database
    updateProductsOrder(reorderedProducts);
  };

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
    queryClient.invalidateQueries({ queryKey: ["/api/products"] });
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
          <TabsTrigger value="retail">Retail</TabsTrigger>
          <TabsTrigger value="wholesale">Wholesale</TabsTrigger>
          <TabsTrigger value="kitchen">Kitchen</TabsTrigger>
        </TabsList>

        <TabsContent value="field" className="space-y-4">
          <div className="bg-white rounded-lg shadow">
            <DraggableInventoryTable 
              products={filteredProducts} 
              onViewDetails={handleViewProductDetails}
              onOrderChanged={handleProductsReordered}
            />
          </div>
        </TabsContent>
        
        <TabsContent value="retail" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Retail Inventory</CardTitle>
              <CardDescription>
                View and manage inventory for retail sales
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
                        Current Stock
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
                    {filteredProducts.filter(product => product.showInRetail !== false).map((product) => (
                      <tr 
                        key={product.id} 
                        className="hover:bg-gray-100 cursor-pointer"
                        onClick={() => handleViewProductDetails(product)}
                      >
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {product.fieldLocation}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                          {product.name}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {product.currentStock}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate">
                          {product.retailNotes || "No notes"}
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
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="wholesale" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Wholesale Inventory</CardTitle>
              <CardDescription>
                View and manage inventory for wholesale operations
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
                        Current Stock
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
                    {filteredProducts.filter(product => product.showInWholesale === true).map((product) => (
                      <tr 
                        key={product.id} 
                        className="hover:bg-gray-100 cursor-pointer"
                        onClick={() => handleViewProductDetails(product)}
                      >
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {product.fieldLocation}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                          {product.name}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {product.currentStock}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate">
                          {product.fieldNotes || "No notes"}
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
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="kitchen" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Kitchen Inventory</CardTitle>
              <CardDescription>
                View and manage inventory for kitchen use
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
                        Current Stock
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
                    {filteredProducts.filter(product => product.showInKitchen === true).map((product) => (
                      <tr 
                        key={product.id} 
                        className="hover:bg-gray-100 cursor-pointer"
                        onClick={() => handleViewProductDetails(product)}
                      >
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {product.fieldLocation}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                          {product.name}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {product.currentStock}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate">
                          {product.fieldNotes || "No notes"}
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
                    ))}
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