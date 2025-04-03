import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldLocation } from "@shared/schema";
import { ArrowDown, Database, Download, Upload } from "lucide-react";

// Predefined sample data based on the attached file
const SAMPLE_DATA = `Field Location\tCrop\tCrop Needs\tStand Inventory\tWash Inventory\tHarvest (Bins)\tUnits Harvested\tField Notes\tRetail Notes
Stone Wall\tE.G. Arugula\t60\t1\t1\t1\t20\t\t
Veg. Ridge\tHead Lettuce\t\t\t\t\t\t\t
Upper Blais\tRed Leaf\t15\t\t\t\t\t\t
Upper Blais\tIceberg\t\t\t\t\t\t\t
Upper Blais\tGreen Leaf\t15\t\t\t\t\t\t
Upper Blais\tOak Leaf\t\t\t\t\t\t\t
Upper Blais\tRomaine\t\t\t\t\t\t\t
Side Hill 3\tSalanova\t80\t\t\t\t\t\t
Side Hill 3\tArugula\t\t\t\t\t\t\t
Side Hill 3\tMixed Greens\t\t\t\t\t\t\t
Side Hill 3\tSpinach\t40\t\t\t\t\t\t
Side Hill 3\tBaby Kale\t\t\t\t\t\t\t
Veg. Ridge\tKale\t\t\t\t\t\t\t
Veg. Ridge\tRed Kale\t\t\t\t\t\t\t
Veg. Ridge\tGreen Kale\t\t\t\t\t\t\t
Veg. Ridge\tToscano Kale\t\t\t\t\t\t\t
Veg. Ridge\tHerbs\t\t\t\t\t\t\t
Veg. Ridge\tDill\t\t\t\t\t\t\t
Veg. Ridge\tCilantro\t\t\t\t\t\t\t
Veg. Ridge\tParsley\t\t\t\t\t\t\t
Side Hill 3\tBasil\t\t\t\t\t\t\t
Side Hill 3\tBok Choy\t\t\t\t\t\t\t
Veg. Ridge\tRed Beets\t\t\t\t\t\t\t
Veg. Ridge\tGold Beets\t\t\t\t\t\t\t
Veg. Ridge\tLoose Red Beets\t\t\t\t\t\t\t
Veg. Ridge\tLoose Gold Beets\t\t\t\t\t\t\t
Veg. Ridge\tBeet Greens\t\t\t\t\t\t\t
Lower Blais\tSwiss Chard\t\t\t\t\t\t\t
Lower Blais\tCarrots\t\t\t\t\t\t\t
Lower Blais\tRainbow Carrots\t\t\t\t\t\t\t
Lower Blais\tLoose Carrots\t\t\t\t\t\t\t
Lower Blais\tParsnips\t\t\t\t\t\t\t
Lower Blais\tGarlic Scapes\t\t\t\t\t\t\t
Lower Blais\tScallions\t\t\t\t\t\t\t
Lower Blais\tLoose Onions\t\t\t\t\t\t\t
Rock Pile\tLeeks\t\t\t\t\t\t\t
Corn Ridge\tBunched Onions\t\t\t\t\t\t\t
Corn Ridge\tYellow Onions\t\t\t\t\t\t\t
Corn Ridge\tRed Onions\t\t\t\t\t\t\t
Stone Wall\tCelery\t\t\t\t\t\t\t
Side Hill 1\tBroccoli\t\t\t\t\t\t\t
Side Hill 1\tCauliflower\t\t\t\t\t\t\t
Side Hill 2\tGreen Cabbage\t\t\t\t\t\t\t
Rt. 25\tRed Cabbage\t\t\t\t\t\t\t
Rt. 25\tBrussel Sprouts\t\t\t\t\t\t\t
Rt. 25\tArtichokes\t\t\t\t\t\t\t
Stone Wall\tGreen Peppers\t\t\t\t\t\t\t
Stone Wall\tColored Peppers\t\t\t\t\t\t\t
Stone Wall\tPurple\t\t\t\t\t\t\t
Stone Wall\tCubanelle\t\t\t\t\t\t\t
Stone Wall\tShishito\t\t\t\t\t\t\t
Stone Wall\tPoblano\t\t\t\t\t\t\t
Stone Wall\tMixed Hots\t\t\t\t\t\t\t
Stone Wall\tLunchbox\t\t\t\t\t\t\t
Upper Blais\tEggplant\t\t\t\t\t\t\t
Upper Blais\tOriental Eggplant\t\t\t\t\t\t\t
Upper Blais\tItalian Eggplant\t\t\t\t\t\t\t
Upper Blais\tPurple Eggplant\t\t\t\t\t\t\t
Upper Blais\tAnnina Eggplant\t\t\t\t\t\t\t
Wholesale\tSalad Mix\t15\t\t\t\t\t\t
Kitchen\tNova\t15\t\t\t\t\t\t
Kitchen\tScallions\t\t\t\t\t\t\t
Kitchen\tBok Choy\t\t\t\t\t\t\t
Kitchen\tButternut\t\t\t\t\t\t\t
Harvest Box\t\t\t\t\t\t\t\t
External Picks\t\t\t\t\t\t\t\t
Dane\tRed Potatoes\t\t\t\t\t\t\t
Dane\tWhite Potatoes\t\t\t\t\t\t\t
Dane\tYukon\t\t\t\t\t\t\t
Dane\tFingerling\t\t\t\t\t\t\t
Dane\tQuarts\t\t\t\t\t\t\t
Dane\tBags\t\t\t\t\t\t\t
Hoisington\tCherry Tomatoes\t\t\t\t\t\t\t
Stone Wall\tSlicing Tomatoes\t\t\t\t\t\t\t
Stone Wall\tCanner\t\t\t\t\t\t\t
Stone Wall\tHeirlooms\t\t\t\t\t\t\t
Stone Wall\tPlum\t\t\t\t\t\t\t
Stone Wall\tOrange\t\t\t\t\t\t\t
Lower Blais\tYellow Beans\t\t\t\t\t\t\t
Lower Blais\tGreen Beans\t\t\t\t\t\t\t
Lower Blais\tBagged Beans\t\t\t\t\t\t\t
Lower Blais\tSnap Peas\t\t\t\t\t\t\t
Lower Blais\tShell Peas\t\t\t\t\t\t\t
Lower Blais\tStrawberries\t\t\t\t\t\t\t
Corn Ridge\tCorn\t\t\t\t\t\t\t`;

interface ImportItem {
  fieldLocation: string;
  productName: string;
  cropNeeds: string;
  standInventory: string;
  washInventory: string;
  harvestBins: string;
  unitsHarvested: string;
  fieldNotes: string;
  retailNotes: string;
}

export default function DataImportPage() {
  const { toast } = useToast();
  const [data, setData] = useState(SAMPLE_DATA);
  const [parsedData, setParsedData] = useState<ImportItem[]>([]);
  const [importStatus, setImportStatus] = useState<{
    total: number;
    processed: number;
    success: number;
    failed: number;
  }>({ total: 0, processed: 0, success: 0, failed: 0 });
  const [isImporting, setIsImporting] = useState(false);
  const [uniqueLocations, setUniqueLocations] = useState<string[]>([]);
  const [importStep, setImportStep] = useState<'parse' | 'review' | 'importing' | 'complete'>('parse');

  // Fetch existing field locations
  const { data: existingLocations = [] } = useQuery<FieldLocation[]>({
    queryKey: ["/api/field-locations"],
  });

  // Add field location mutation
  const { mutateAsync: addFieldLocation } = useMutation({
    mutationFn: (name: string) => {
      return apiRequest("POST", "/api/field-locations", { name });
    },
  });

  // Add product mutation
  const { mutateAsync: addProduct } = useMutation({
    mutationFn: (product: any) => {
      return apiRequest("POST", "/api/products", product);
    },
  });

  const parseTabDelimited = () => {
    try {
      const lines = data.split('\n').filter(line => line.trim() !== '');
      const headers = lines[0].split('\t');
      
      const items: ImportItem[] = [];
      let currentLocation = '';
      
      // Start from 1 to skip the header row
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split('\t');
        
        // If the field location is not empty, use it as the current location
        if (values[0].trim() !== '') {
          currentLocation = values[0].trim();
        }
        
        // Skip if the product name is empty (after field location)
        if (!values[1] || values[1].trim() === '') {
          continue;
        }
        
        items.push({
          fieldLocation: currentLocation,
          productName: values[1].trim(),
          cropNeeds: values[2] ? values[2].trim() : '',
          standInventory: values[3] ? values[3].trim() : '',
          washInventory: values[4] ? values[4].trim() : '',
          harvestBins: values[5] ? values[5].trim() : '',
          unitsHarvested: values[6] ? values[6].trim() : '',
          fieldNotes: values[7] ? values[7].trim() : '',
          retailNotes: values[8] ? values[8].trim() : '',
        });
      }
      
      // Extract unique field locations
      const locationSet = new Set<string>();
      items.forEach(item => {
        if (item.fieldLocation) {
          locationSet.add(item.fieldLocation);
        }
      });
      const locations = Array.from(locationSet);
      
      setParsedData(items);
      setUniqueLocations(locations);
      setImportStep('review');
      
      toast({
        title: "Data Parsed Successfully",
        description: `Found ${items.length} products across ${locations.length} field locations.`,
      });
    } catch (error) {
      toast({
        title: "Error Parsing Data",
        description: "Please check the format of your data and try again.",
        variant: "destructive",
      });
    }
  };

  const handleImport = async () => {
    if (parsedData.length === 0) {
      toast({
        title: "No Data",
        description: "Please parse the data first.",
        variant: "destructive",
      });
      return;
    }
    
    setIsImporting(true);
    setImportStep('importing');
    
    // Reset import status
    setImportStatus({
      total: parsedData.length,
      processed: 0,
      success: 0,
      failed: 0,
    });
    
    // Create a map of existing locations for quick lookup
    const existingLocationMap = new Map(
      existingLocations.map(loc => [loc.name.toLowerCase(), true])
    );
    
    // First, ensure all field locations exist
    for (const location of uniqueLocations) {
      if (!existingLocationMap.has(location.toLowerCase())) {
        try {
          await addFieldLocation(location);
          existingLocationMap.set(location.toLowerCase(), true);
        } catch (error) {
          console.error("Failed to add location:", location, error);
        }
      }
    }
    
    // Now import products
    for (const item of parsedData) {
      try {
        const productData = {
          name: item.productName,
          fieldLocation: item.fieldLocation,
          unit: 'count', // Default unit
          currentStock: parseInt(item.standInventory) || 0,
          minStock: 0,
          fieldNotes: item.fieldNotes,
          retailNotes: item.retailNotes,
          cropNeeds: item.cropNeeds,
          standInventory: item.standInventory,
          washInventory: item.washInventory,
          harvestBins: item.harvestBins,
          unitsHarvested: item.unitsHarvested,
        };
        
        await addProduct(productData);
        
        setImportStatus(prev => ({
          ...prev,
          processed: prev.processed + 1,
          success: prev.success + 1,
        }));
      } catch (error) {
        console.error("Failed to add product:", item, error);
        setImportStatus(prev => ({
          ...prev,
          processed: prev.processed + 1,
          failed: prev.failed + 1,
        }));
      }
    }
    
    setIsImporting(false);
    setImportStep('complete');
    
    // Invalidate queries to update data
    queryClient.invalidateQueries({ queryKey: ["/api/products"] });
    queryClient.invalidateQueries({ queryKey: ["/api/field-locations"] });
    
    toast({
      title: "Import Complete",
      description: `Successfully imported ${importStatus.success} products. ${importStatus.failed} failed.`,
    });
  };

  const resetImport = () => {
    setImportStep('parse');
    setParsedData([]);
    setUniqueLocations([]);
    setImportStatus({ total: 0, processed: 0, success: 0, failed: 0 });
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-medium text-gray-800">Data Import</h2>
        <p className="text-gray-600 mt-2">
          Import field locations and products from a tab-delimited format.
        </p>
      </div>

      {importStep === 'parse' && (
        <Card>
          <CardHeader>
            <CardTitle>Import Data</CardTitle>
            <CardDescription>
              Paste your tab-delimited data below, or use the sample data that's pre-filled.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={data}
              onChange={(e) => setData(e.target.value)}
              className="min-h-[300px] font-mono text-sm"
              placeholder="Paste your tab-delimited data here"
            />
            <div className="flex justify-end">
              <Button onClick={parseTabDelimited}>
                <ArrowDown className="mr-2 h-4 w-4" />
                Parse Data
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {importStep === 'review' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Review Import Data</CardTitle>
              <CardDescription>
                Please review the data before importing. This will add {parsedData.length} products
                across {uniqueLocations.length} field locations.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <h3 className="text-lg font-medium mb-2">Field Locations to Import:</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {uniqueLocations.map((location, index) => (
                    <div 
                      key={index} 
                      className={`p-2 rounded-md ${
                        existingLocations.some(l => l.name.toLowerCase() === location.toLowerCase())
                          ? 'bg-green-50 text-green-700'
                          : 'bg-blue-50 text-blue-700'
                      }`}
                    >
                      {location}
                      {existingLocations.some(l => l.name.toLowerCase() === location.toLowerCase()) && (
                        <span className="text-xs ml-2">(exists)</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">Products to Import:</h3>
                <div className="overflow-auto max-h-[300px] border rounded-md">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Crop Needs</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stand Inventory</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {parsedData.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-3 py-2 text-sm">{item.fieldLocation}</td>
                          <td className="px-3 py-2 text-sm">{item.productName}</td>
                          <td className="px-3 py-2 text-sm">{item.cropNeeds}</td>
                          <td className="px-3 py-2 text-sm">{item.standInventory}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
            <div className="px-6 py-4 border-t flex justify-end space-x-2">
              <Button variant="outline" onClick={resetImport}>
                Back
              </Button>
              <Button onClick={handleImport} disabled={isImporting}>
                <Database className="mr-2 h-4 w-4" />
                Import Data
              </Button>
            </div>
          </Card>
        </div>
      )}

      {importStep === 'importing' && (
        <Card>
          <CardHeader>
            <CardTitle>Importing Data</CardTitle>
            <CardDescription>Please wait while the data is being imported...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              <div className="mt-4 text-center">
                <p className="text-lg font-semibold">Processing {importStatus.processed} of {importStatus.total}</p>
                <p className="text-sm text-gray-500">
                  Success: {importStatus.success} | Failed: {importStatus.failed}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {importStep === 'complete' && (
        <Card>
          <CardHeader>
            <CardTitle>Import Complete</CardTitle>
            <CardDescription>
              The data has been successfully imported into the system.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="py-4 text-center">
              <div className="flex items-center justify-center h-16 w-16 rounded-full bg-green-100 text-green-500 mx-auto">
                <Download className="h-8 w-8" />
              </div>
              <h3 className="mt-4 text-lg font-medium">Import Summary</h3>
              <div className="mt-2">
                <p>Total items: {importStatus.total}</p>
                <p>Successfully imported: {importStatus.success}</p>
                <p>Failed: {importStatus.failed}</p>
              </div>
            </div>
          </CardContent>
          <div className="px-6 py-4 border-t flex justify-end">
            <Button onClick={resetImport}>
              <Upload className="mr-2 h-4 w-4" />
              Import More Data
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}