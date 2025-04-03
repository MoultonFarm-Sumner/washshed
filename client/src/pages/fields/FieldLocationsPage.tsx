import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Link } from "wouter";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { FieldLocation } from "@shared/schema";

export default function FieldLocationsPage() {
  const { toast } = useToast();
  const [newLocation, setNewLocation] = useState("");
  const [deleteLocationId, setDeleteLocationId] = useState<number | null>(null);

  // Fetch field locations
  const { data: fieldLocations = [], isLoading } = useQuery<FieldLocation[]>({
    queryKey: ["/api/field-locations"],
  });

  // Delete confirmation dialog state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Add new field location
  const { mutate: addFieldLocation, isPending: isAddingLocation } = useMutation({
    mutationFn: (name: string) => {
      return apiRequest("POST", "/api/field-locations", { name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/field-locations"] });
      setNewLocation("");
      toast({
        title: "Location Added",
        description: "New field location has been added successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add field location.",
        variant: "destructive",
      });
    },
  });

  // Delete field location
  const { mutate: deleteFieldLocation, isPending: isDeletingLocation } = useMutation({
    mutationFn: (id: number) => {
      return apiRequest("DELETE", `/api/field-locations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/field-locations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Location Deleted",
        description: "Field location has been deleted successfully.",
      });
      setShowDeleteConfirm(false);
      setDeleteLocationId(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete field location. It may be in use by products.",
        variant: "destructive",
      });
      setShowDeleteConfirm(false);
    },
  });

  const handleAddLocation = () => {
    if (newLocation.trim()) {
      addFieldLocation(newLocation.trim());
    } else {
      toast({
        title: "Error",
        description: "Location name cannot be empty.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteClick = (id: number) => {
    setDeleteLocationId(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (deleteLocationId !== null) {
      deleteFieldLocation(deleteLocationId);
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-medium text-gray-800">Field Locations</h2>
          <p className="text-gray-600 mt-2">
            Manage your farm's field locations for inventory tracking.
          </p>
        </div>
        <Link href="/fields/import">
          <Button variant="outline">
            <Upload className="mr-2 h-4 w-4" />
            Bulk Import Data
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-medium mb-4">Add New Location</h3>
            <div className="flex gap-2">
              <Input
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                placeholder="Enter field location name"
                className="flex-1"
              />
              <Button onClick={handleAddLocation} disabled={isAddingLocation}>
                <Plus className="mr-2 h-4 w-4" />
                Add
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-medium mb-4">Current Locations</h3>
            {isLoading ? (
              <div className="p-4 text-center">
                <div className="animate-spin inline-block w-6 h-6 border-4 border-current border-t-transparent text-blue-600 rounded-full"></div>
                <p className="mt-2 text-sm text-gray-600">Loading locations...</p>
              </div>
            ) : fieldLocations.length === 0 ? (
              <p className="text-gray-500 p-4 text-center">No field locations found.</p>
            ) : (
              <ul className="space-y-2">
                {fieldLocations.map((location) => (
                  <li
                    key={location.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                  >
                    <span className="font-medium">{location.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteClick(location.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the field location. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeletingLocation}
              className="bg-red-500 hover:bg-red-600"
            >
              {isDeletingLocation ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}