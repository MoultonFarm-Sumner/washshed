import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Product } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Search, Utensils } from "lucide-react";
import DraggableInventoryTable from "../inventory/DraggableInventoryTable";
import ProductDetailsModal from "../inventory/ProductDetailsModal";

export default function KitchenPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // Fetch products from API
  const { data: products = [], isLoading, refetch } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });
  
  // Filter products for kitchen
  const filteredProducts = products
    .filter(product => product.showInKitchen)
    .filter(product => 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.fieldLocation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.fieldNotes && product.fieldNotes.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  
  const handleViewProductDetails = (product: Product) => {
    setSelectedProduct(product);
  };
  
  const closeProductDetailsModal = () => {
    setSelectedProduct(null);
  };
  
  return (
    <div className="container mx-auto py-6">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Utensils className="mr-2 h-5 w-5 text-amber-600" />
            <span>Kitchen Inventory</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="relative w-72">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search kitchen items..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                className="ml-2"
              >
                Refresh
              </Button>
            </div>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No kitchen items found.</p>
              <p className="text-sm mt-2">
                Add items to kitchen or change your search criteria.
              </p>
            </div>
          ) : (
            <DraggableInventoryTable
              products={filteredProducts}
              onViewDetails={handleViewProductDetails}
              onOrderChanged={() => refetch()}
            />
          )}
        </CardContent>
      </Card>
      
      {selectedProduct && (
        <ProductDetailsModal
          product={selectedProduct}
          isOpen={!!selectedProduct}
          onClose={closeProductDetailsModal}
          onProductUpdated={() => refetch()}
        />
      )}
    </div>
  );
}