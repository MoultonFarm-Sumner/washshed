import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Edit, Trash2, Search, MapPin, SortAsc } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Product } from "@shared/schema";
import AddProductModal from "../inventory/AddProductModal";
import ProductDetailsModal from "../inventory/ProductDetailsModal";

export default function ProductsPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [fieldFilter, setFieldFilter] = useState("all");
  const [sortOption, setSortOption] = useState("name");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Fetch products
  const {
    data: products = [],
    isLoading,
    error,
    refetch,
  } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  // Fetch field locations
  const { data: fieldLocations = [] } = useQuery<any[]>({
    queryKey: ["/api/field-locations"],
  });

  // Delete product mutation
  const { mutate: deleteProduct, isPending: isDeleting } = useMutation({
    mutationFn: (id: number) => {
      return apiRequest("DELETE", `/api/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setIsDeleteDialogOpen(false);
      setProductToDelete(null);
      toast({
        title: "Success",
        description: "Product deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive",
      });
    },
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
        case "field":
          return a.fieldLocation.localeCompare(b.fieldLocation);
        case "date-added":
          return new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime();
        default:
          return 0;
      }
    });

  // Calculate pagination
  const totalItems = filteredProducts.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const paginatedProducts = filteredProducts.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  // Handle edit button click
  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setIsEditModalOpen(true);
  };

  // Handle delete button click
  const handleDelete = (product: Product) => {
    setProductToDelete(product);
    setIsDeleteDialogOpen(true);
  };

  // Confirm delete
  const confirmDelete = () => {
    if (productToDelete) {
      deleteProduct(productToDelete.id);
    }
  };

  // Format date
  const formatDate = (dateString: string | Date) => {
    try {
      const date = dateString instanceof Date ? dateString : new Date(dateString);
      return format(date, "MMMM d, yyyy");
    } catch (error) {
      return "Invalid date";
    }
  };

  if (error) {
    toast({
      title: "Error",
      description: "Failed to load products",
      variant: "destructive",
    });
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap justify-between items-center gap-4">
        <h2 className="text-2xl font-medium text-gray-800">Product Management</h2>
        <Button 
          className="bg-primary hover:bg-green-800" 
          onClick={() => setIsAddModalOpen(true)}
        >
          Add New Product
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {/* Search Field */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <Input
            placeholder="Search products..."
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
              <SelectItem value="field">Sort by Field Location</SelectItem>
              <SelectItem value="date-added">Sort by Date Added</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-6 text-center">
            <div className="animate-spin inline-block w-8 h-8 border-4 border-current border-t-transparent text-blue-600 rounded-full"></div>
            <p className="mt-2 text-gray-600">Loading products...</p>
          </div>
        ) : paginatedProducts.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-gray-500">No products found.</p>
            {(searchQuery || fieldFilter) && (
              <p className="text-gray-500 text-sm mt-1">
                Try adjusting your search filters.
              </p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Field Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Unit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date Added
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedProducts.map((product: Product) => (
                  <tr key={product.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <img
                            className="h-10 w-10 rounded-full object-cover"
                            src={product.imageUrl || "https://via.placeholder.com/60"}
                            alt={product.name}
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {product.name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                      {product.fieldLocation}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                      {product.currentStock}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                      {product.unit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                      {formatDate(product.dateAdded)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(product)}
                        className="text-blue-600 hover:text-blue-800 mr-3"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(product)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalItems > 0 && (
          <div className="bg-gray-50 px-6 py-3 flex items-center justify-between border-t border-gray-200">
            <div className="text-sm text-gray-700">
              Showing <span className="font-medium">{(page - 1) * pageSize + 1}</span> to{" "}
              <span className="font-medium">
                {Math.min(page * pageSize, totalItems)}
              </span>{" "}
              of <span className="font-medium">{totalItems}</span> products
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="px-3 py-1 text-sm"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
                className="px-3 py-1 text-sm text-blue-600"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Add Product Modal */}
      <AddProductModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onProductAdded={refetch}
        fieldLocations={fieldLocations}
      />

      {/* Edit Product Modal */}
      {selectedProduct && (
        <ProductDetailsModal
          product={selectedProduct}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onProductUpdated={refetch}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-medium">{productToDelete?.name}</span>? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
