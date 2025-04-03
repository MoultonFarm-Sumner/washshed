import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertProductSchema, 
  insertInventoryHistorySchema, 
  insertFieldLocationSchema 
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes - prefix all with /api
  
  // Products routes
  app.get("/api/products", async (_req: Request, res: Response) => {
    try {
      const products = await storage.getProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to get products" });
    }
  });

  app.get("/api/products/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid product ID" });
      }
      
      const product = await storage.getProduct(id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Failed to get product" });
    }
  });

  app.post("/api/products", async (req: Request, res: Response) => {
    try {
      const validatedData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(validatedData);
      
      // Add initial inventory history entry
      await storage.createInventoryHistory({
        productId: product.id,
        previousStock: 0,
        change: product.currentStock,
        newStock: product.currentStock,
        updatedBy: "Farm Admin" // TODO: Use actual user when authentication is implemented
      });
      
      res.status(201).json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid product data", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  app.put("/api/products/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid product ID" });
      }
      
      // Allow partial updates
      const validatedData = insertProductSchema.partial().parse(req.body);
      
      const updatedProduct = await storage.updateProduct(id, validatedData);
      if (!updatedProduct) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      res.json(updatedProduct);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid product data", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  app.delete("/api/products/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid product ID" });
      }
      
      const success = await storage.deleteProduct(id);
      if (!success) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  // Inventory adjustment route
  app.post("/api/inventory/adjust", async (req: Request, res: Response) => {
    try {
      const schema = z.object({
        productId: z.number(),
        change: z.number(),
        updatedBy: z.string().default("Farm Admin")
      });
      
      const { productId, change, updatedBy } = schema.parse(req.body);
      
      const product = await storage.getProduct(productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      const previousStock = product.currentStock;
      const newStock = Math.max(0, previousStock + change); // Prevent negative stock
      
      // Update product stock
      const updatedProduct = await storage.updateProduct(productId, {
        currentStock: newStock
      });
      
      // Create history record
      const history = await storage.createInventoryHistory({
        productId,
        previousStock,
        change,
        newStock,
        updatedBy
      });
      
      res.json({ product: updatedProduct, history });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid adjustment data", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to adjust inventory" });
    }
  });

  // Inventory history routes
  app.get("/api/inventory/history", async (req: Request, res: Response) => {
    try {
      const startDateParam = req.query.startDate as string;
      const endDateParam = req.query.endDate as string;
      const productIdParam = req.query.productId as string;
      
      let history;
      
      if (startDateParam && endDateParam) {
        const startDate = new Date(startDateParam);
        const endDate = new Date(endDateParam);
        // Set endDate to end of day
        endDate.setHours(23, 59, 59, 999);
        
        history = await storage.getInventoryHistoryByDateRange(startDate, endDate);
      } else if (productIdParam) {
        const productId = parseInt(productIdParam);
        if (isNaN(productId)) {
          return res.status(400).json({ message: "Invalid product ID" });
        }
        
        history = await storage.getInventoryHistoryByProduct(productId);
      } else {
        history = await storage.getInventoryHistory();
      }
      
      // Enrich history with product names
      const products = await storage.getProducts();
      const productMap = new Map(products.map(p => [p.id, p]));
      
      const enrichedHistory = history.map(entry => ({
        ...entry,
        productName: productMap.get(entry.productId)?.name || 'Unknown Product',
        fieldLocation: productMap.get(entry.productId)?.fieldLocation || 'Unknown Location',
        unit: productMap.get(entry.productId)?.unit || ''
      }));
      
      res.json(enrichedHistory);
    } catch (error) {
      res.status(500).json({ message: "Failed to get inventory history" });
    }
  });

  // Field locations routes
  app.get("/api/field-locations", async (_req: Request, res: Response) => {
    try {
      const locations = await storage.getFieldLocations();
      res.json(locations);
    } catch (error) {
      res.status(500).json({ message: "Failed to get field locations" });
    }
  });

  app.post("/api/field-locations", async (req: Request, res: Response) => {
    try {
      const validatedData = insertFieldLocationSchema.parse(req.body);
      const location = await storage.createFieldLocation(validatedData);
      res.status(201).json(location);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid field location data", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to create field location" });
    }
  });

  app.delete("/api/field-locations/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid field location ID" });
      }
      
      const success = await storage.deleteFieldLocation(id);
      if (!success) {
        return res.status(404).json({ message: "Field location not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete field location" });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);
  return httpServer;
}
