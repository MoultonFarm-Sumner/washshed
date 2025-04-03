import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Search, MapPin, SortAsc, Plus, Minus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Product } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import ProductDetailsModal from "./ProductDetailsModal";
import AddProductModal from "./AddProductModal";

export default function InventoryPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [fieldFilter, setFieldFilter] = useState("all");
  const [sortOption, setSortOption] = useState("name");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("field"); // 'field' or 'wholesale'

  // Fetch products
  const { data: products = [], isLoading, error, refetch } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  // Fetch field locations
  const { data: fieldLocations = [] } = useQuery<any[]>({
    queryKey: ["/api/field-locations"],
  });

  // Mutation for updating wash inventory 
  const { mutate: updateWashInventory } = useMutation({
    mutationFn: ({ id, value }: { id: number, value: string }) => {
      return apiRequest("PUT", `/api/products/${id}`, {
        washInventory: value
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update wash inventory",
        variant: "destructive",
      });
    }
  });

  // Mutation for updating product field location
  const { mutate: updateFieldLocation } = useMutation({
    mutationFn: ({ id, fieldLocation }: { id: number, fieldLocation: string }) => {
      return apiRequest("PUT", `/api/products/${id}`, {
        fieldLocation
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update field location",
        variant: "destructive",
      });
    }
  });

  // Function to handle wash inventory increment/decrement
  const handleWashInventoryChange = (product: Product, change: number) => {
    const currentValue = product.washInventory ? parseInt(product.washInventory) : 0;
    const newValue = Math.max(0, currentValue + change).toString();
    updateWashInventory({ id: product.id, value: newValue });
  };

  // Function to handle field location change
  const handleFieldLocationChange = (product: Product) => {
    // Prompt for new field location
    const newLocation = prompt("Enter new field location:", product.fieldLocation);
    if (newLocation && newLocation !== product.fieldLocation) {
      updateFieldLocation({ id: product.id, fieldLocation: newLocation });
    }
  };

  // Filter and sort products
  const filteredProducts = products
    .filter((product: Product) => {
      // Apply search filter
      const matchesSearch = product.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      
      // Apply field location filter
      const matchesField = fieldFilter === "all" || product.fieldLocation === fieldFilter;
      
      return matchesSearch && matchesField;
    })
    .sort((a: Product, b: Product) => {
      // Apply sorting
      switch (sortOption) {
        case "name":
          return a.name.localeCompare(b.name);
        case "stock-low":
          return a.currentStock - b.currentStock;
        case "stock-high":
          return b.currentStock - a.currentStock;
        case "field":
          return a.fieldLocation.localeCompare(b.fieldLocation);
        default:
          return 0;
      }
    });

  const handleViewDetails = (product: Product) => {
    setSelectedProduct(product);
    setIsDetailsModalOpen(true);
  };

  if (error) {
    toast({
      title: "Error",
      description: "Failed to load inventory data",
      variant: "destructive",
    });
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-medium text-gray-800">Current Inventory</h2>
        <div className="flex flex-wrap gap-2 items-center">
          <Button 
            className="bg-blue-600 hover:bg-blue-700" 
            onClick={() => setIsAddModalOpen(true)}
          >
            Add New Item
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab("field")}
          className={`py-2 px-4 text-sm font-medium ${
            activeTab === "field"
              ? "border-b-2 border-blue-500 text-blue-600"
              : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
          }`}
        >
          Field & Wash Shed
        </button>
        <button
          onClick={() => setActiveTab("wholesale")}
          className={`py-2 px-4 text-sm font-medium ${
            activeTab === "wholesale"
              ? "border-b-2 border-blue-500 text-blue-600"
              : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
          }`}
        >
          Wholesale & Kitchen
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {/* Search Field */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <Input
            placeholder="Search inventory..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        {/* Field Location Filter */}
        <div className="relative">
          <Select value={fieldFilter} onValueChange={setFieldFilter}>
            <SelectTrigger className="pl-10">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <SelectValue placeholder="All Field Locations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Field Locations</SelectItem>
              {fieldLocations.map((location: any) => (
                <SelectItem key={location.id} value={location.name}>
                  {location.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Sort By */}
        <div className="relative">
          <Select value={sortOption} onValueChange={setSortOption}>
            <SelectTrigger className="pl-10">
              <SortAsc className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <SelectValue placeholder="Sort by Name" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Sort by Name</SelectItem>
              <SelectItem value="stock-low">Sort by Stock (Low to High)</SelectItem>
              <SelectItem value="stock-high">Sort by Stock (High to Low)</SelectItem>
              <SelectItem value="field">Sort by Field Location</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Inventory Items Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-6 text-center">
            <div className="animate-spin inline-block w-8 h-8 border-4 border-current border-t-transparent text-blue-600 rounded-full"></div>
            <p className="mt-2 text-gray-600">Loading inventory data...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-gray-500">No items found.</p>
            {(searchQuery || fieldFilter !== "all") && (
              <p className="text-gray-500 text-sm mt-1">
                Try adjusting your search filters.
              </p>
            )}
          </div>
        ) : activeTab === "field" ? (
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
                    Units
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
                {filteredProducts.map((product: Product) => {
                  return (
                    <tr 
                      key={product.id} 
                      className="hover:bg-gray-100 cursor-pointer"
                      onClick={() => handleViewDetails(product)}
                    >
                      <td 
                        className="px-4 py-3 whitespace-nowrap text-sm text-gray-800 hover:bg-blue-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFieldLocationChange(product);
                        }}
                      >
                        {product.fieldLocation}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800">
                        {product.name}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800">
                        {product.cropNeeds || "-"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800">
                        {product.standInventory || product.currentStock}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800">
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-6 w-6 rounded-full p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleWashInventoryChange(product, -1);
                            }}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span>
                            {product.washInventory || "0"}
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-6 w-6 rounded-full p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleWashInventoryChange(product, 1);
                            }}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800">
                        {product.harvestBins || "-"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800">
                        {product.unitsHarvested || "-"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800">
                        {product.unit}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800 max-w-[200px] truncate">
                        {product.fieldNotes || "-"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewDetails(product);
                          }}
                          className="px-2 py-1 text-xs"
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
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Wash Inventory
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Wholesale Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kitchen Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Units
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
                {filteredProducts.map((product: Product) => {
                  // Placeholder values for wholesale & kitchen
                  const wholesale = "0";
                  const kitchen = "0";
                  
                  return (
                    <tr 
                      key={product.id} 
                      className="hover:bg-gray-100 cursor-pointer"
                      onClick={() => handleViewDetails(product)}
                    >
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800">
                        {product.name}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800">
                        {product.washInventory || "0"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800">
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-6 w-6 rounded-full p-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span>
                            {wholesale}
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-6 w-6 rounded-full p-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800">
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-6 w-6 rounded-full p-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span>
                            {kitchen}
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-6 w-6 rounded-full p-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800">
                        {product.unit}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800 max-w-[200px] truncate">
                        {product.retailNotes || "-"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewDetails(product);
                          }}
                          className="px-2 py-1 text-xs"
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
        )}
      </div>

      {/* Product Details Modal */}
      {selectedProduct && (
        <ProductDetailsModal
          product={selectedProduct}
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          onProductUpdated={refetch}
        />
      )}

      {/* Add Product Modal */}
      <AddProductModal 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onProductAdded={refetch}
        fieldLocations={fieldLocations}
      />
    </div>
  );
}
