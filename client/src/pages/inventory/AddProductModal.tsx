import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { InsertProduct, FieldLocation } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Store, Warehouse, Utensils } from "lucide-react";

// Define the form schema using zod
const formSchema = z.object({
  name: z.string().min(1, "Crop name is required"),
  fieldLocation: z.string().min(1, "Field location is required"),
  currentStock: z.coerce.number().int().min(0, "Stock must be 0 or more"),
  showInRetail: z.boolean().default(true),
  showInWholesale: z.boolean().default(false),
  showInKitchen: z.boolean().default(false),
});

type FormValues = z.infer<typeof formSchema>;

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductAdded: () => void;
}

export default function AddProductModal({
  isOpen,
  onClose,
  onProductAdded,
}: AddProductModalProps) {
  const { toast } = useToast();
  
  // Fetch field locations
  const { data: fieldLocations = [] } = useQuery<FieldLocation[]>({
    queryKey: ["/api/field-locations"],
  });

  // Define form with validation
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      fieldLocation: "",
      currentStock: 0,
      showInRetail: true,
      showInWholesale: false,
      showInKitchen: false,
    },
  });

  // Mutation for creating a new product
  const { mutate: addProduct, isPending } = useMutation({
    mutationFn: (values: FormValues) => {
      const newProduct: InsertProduct = {
        name: values.name,
        fieldLocation: values.fieldLocation,
        currentStock: values.currentStock,
        fieldNotes: "",
        retailNotes: "",
        cropNeeds: "",
        standInventory: "0",
        washInventory: "0",
        harvestBins: "0",
        unitsHarvested: "0",
        showInRetail: values.showInRetail,
        showInWholesale: values.showInWholesale,
        showInKitchen: values.showInKitchen,
      };
      return apiRequest("POST", "/api/products", newProduct);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      form.reset();
      onProductAdded();
      onClose();
      toast({
        title: "Success",
        description: "New crop added successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add the new crop",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: FormValues) => {
    addProduct(values);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Crop</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Crop Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter crop name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
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
                        <SelectValue placeholder="Select field location" />
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
              name="currentStock"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Initial Stock</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min={0}
                      placeholder="0" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator className="my-4" />
            
            <div className="space-y-3">
              <h3 className="text-md font-medium">Display In:</h3>
              
              <FormField
                control={form.control}
                name="showInRetail"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center space-x-2">
                      <Store className="h-4 w-4" />
                      <FormLabel className="m-0">Retail</FormLabel>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="showInWholesale"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center space-x-2">
                      <Warehouse className="h-4 w-4" />
                      <FormLabel className="m-0">Wholesale</FormLabel>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="showInKitchen"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center space-x-2">
                      <Utensils className="h-4 w-4" />
                      <FormLabel className="m-0">Kitchen</FormLabel>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
                        
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                className="bg-primary hover:bg-green-800" 
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  "Add Crop"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}