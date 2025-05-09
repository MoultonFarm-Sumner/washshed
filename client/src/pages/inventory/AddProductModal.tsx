import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

// Define the form schema using zod
const formSchema = z.object({
  name: z.string().min(1, "Crop name is required"),
  fieldLocation: z.string().min(1, "Field location is required"),
  currentStock: z.coerce.number().int().min(0, "Stock must be 0 or more"),
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
  const [formIsSubmitting, setFormIsSubmitting] = useState(false);
  
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
    },
  });

  const handleSubmit = async (values: FormValues) => {
    setFormIsSubmitting(true);
    
    try {
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
      };
      
      await apiRequest("POST", "/api/products", newProduct);
      
      // Success
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      form.reset();
      onProductAdded();
      onClose();
      toast({
        title: "Success",
        description: "New crop added successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add the new crop",
        variant: "destructive",
      });
    } finally {
      setFormIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Crop</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
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
                    value={field.value}
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
                      
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                disabled={formIsSubmitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white" 
                disabled={formIsSubmitting}
              >
                {formIsSubmitting ? (
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