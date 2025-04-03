import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, MapPin, SortAsc } from "lucide-react";
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
import InventoryCard from "./InventoryCard";
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

  // Fetch products
  const { data: products = [], isLoading, error, refetch } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  // Fetch field locations
  const { data: fieldLocations = [] } = useQuery<any[]>({
    queryKey: ["/api/field-locations"],
  });

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
          <div className="flex items-center mr-4">
            <span className="inline-block w-4 h-4 bg-yellow-400 rounded-full mr-2"></span>
            <span className="text-sm">Low Stock (&lt;10)</span>
          </div>
          <div className="flex items-center mr-4">
            <span className="inline-block w-4 h-4 bg-red-500 rounded-full mr-2"></span>
            <span className="text-sm">Critical Stock (&lt;5)</span>
          </div>
          <Button 
            className="bg-blue-600 hover:bg-blue-700" 
            onClick={() => setIsAddModalOpen(true)}
          >
            Add New Item
          </Button>
        </div>
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

      {/* Inventory Items Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="bg-white rounded-lg h-52 animate-pulse"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((product: Product) => (
            <InventoryCard 
              key={product.id} 
              product={product} 
              onViewDetails={handleViewDetails}
              onInventoryUpdated={refetch}
            />
          ))}
        </div>
      )}

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
