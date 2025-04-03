import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { productFormSchema } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Save, Image, X } from "lucide-react";

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductAdded: () => void;
  fieldLocations: any[];
}

export default function AddProductModal({
  isOpen,
  onClose,
  onProductAdded,
  fieldLocations,
}: AddProductModalProps) {
  const { toast } = useToast();
  const [imageUrl, setImageUrl] = useState("");

  // Form definition with Zod validation
  const form = useForm<z.infer<typeof productFormSchema>>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      fieldLocation: "",
      currentStock: 0,
      unit: "bunches",
      productionNotes: "",
      retailNotes: "",
      imageUrl: "",
    },
  });

  // Mutation for adding a new product
  const { mutate: addProduct, isPending } = useMutation({
    mutationFn: (data: z.infer<typeof productFormSchema>) => {
      return apiRequest("POST", "/api/products", {
        ...data,
        imageUrl: imageUrl || undefined,
      });
    },
    onSuccess: () => {
      onProductAdded();
      onClose();
      form.reset();
      setImageUrl("");
      toast({
        title: "Success",
        description: "Product added successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add product",
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (data: z.infer<typeof productFormSchema>) => {
    addProduct({
      ...data,
      imageUrl: imageUrl,
    });
  };

  // Handle image URL input
  const handleImageUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageUrl(e.target.value);
  };

  // For a production app, you'd implement file upload here
  // This is a simplified version using direct URL input
  const handleImageUpload = () => {
    // Open a dialog to prompt for image URL
    const url = prompt("Enter the URL of the image:");
    if (url) {
      setImageUrl(url);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add New Product</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Carrots, Tomatoes, etc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="fieldLocation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Field Location</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a location" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {fieldLocations.map((location) => (
                          <SelectItem key={location.id} value={location.name}>
                            {location.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a unit" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="bunches">bunches</SelectItem>
                        <SelectItem value="lbs">lbs</SelectItem>
                        <SelectItem value="heads">heads</SelectItem>
                        <SelectItem value="boxes">boxes</SelectItem>
                        <SelectItem value="each">each</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="currentStock"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Initial Stock</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Enter initial quantity"
                      min={0}
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="productionNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Production Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter planting information, growing conditions, etc."
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="retailNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Retail Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter information for market/sales use"
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <FormLabel>Product Image</FormLabel>
              <div className="mt-1 flex items-center">
                <div className="flex-shrink-0 h-16 w-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                  {imageUrl ? (
                    <div className="relative w-full h-full">
                      <img
                        src={imageUrl}
                        alt="Product preview"
                        className="object-cover w-full h-full"
                      />
                      <button
                        type="button"
                        onClick={() => setImageUrl("")}
                        className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-bl-lg"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <Image className="h-6 w-6 text-gray-400" />
                  )}
                </div>
                <div className="ml-4 flex flex-col sm:flex-row gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleImageUpload}
                  >
                    Upload Image
                  </Button>
                  <Input
                    type="text"
                    placeholder="or enter image URL"
                    value={imageUrl}
                    onChange={handleImageUrlChange}
                    className="flex-1 w-full sm:w-auto"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isPending}
                className="bg-primary hover:bg-green-800"
              >
                <Save className="mr-1 h-4 w-4" />
                Save Product
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
