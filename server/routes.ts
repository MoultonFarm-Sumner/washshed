import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { PgStorage } from "./pg-storage";
import { 
  insertProductSchema, 
  insertInventoryHistorySchema, 
  insertFieldLocationSchema 
} from "@shared/schema";
import { emailSettings } from "./emailSettings";
import { hashPassword, setAuthCookie, clearAuthCookie } from "./auth";

// Use the PostgreSQL storage implementation
const storage = new PgStorage();

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes - prefix all with /api
  
  // Products routes
  app.get("/api/products", async (req: Request, res: Response) => {
    try {
      const includeWholesaleKitchen = req.query.includeWholesaleKitchen === 'true';
      const products = await storage.getProducts();
      
      // Filter out Wholesale/Kitchen products unless explicitly requested
      // Only the Inventory page will set includeWholesaleKitchen=true
      const filteredProducts = includeWholesaleKitchen
        ? products
        : products.filter(p => !["Wholesale", "Kitchen"].includes(p.fieldLocation));
      
      res.json(filteredProducts);
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
      console.log("Validated product data:", validatedData);
      
      // Make sure unit field is present with a default value if not provided
      if (!validatedData.unit) {
        validatedData.unit = "unit";
      }
      
      const product = await storage.createProduct(validatedData);
      console.log("Created product:", product);
      
      // Add initial inventory history entry
      await storage.createInventoryHistory({
        productId: product.id,
        previousStock: 0,
        change: product.currentStock,
        newStock: product.currentStock,
        fieldLocation: product.fieldLocation,
        updatedBy: "Farm Admin" // TODO: Use actual user when authentication is implemented
      });
      
      res.status(201).json(product);
    } catch (error) {
      console.error("Error creating product:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid product data", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to create product: " + (error as Error).message });
    }
  });

  app.put("/api/products/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid product ID" });
      }
      
      // Get current product data
      const currentProduct = await storage.getProduct(id);
      if (!currentProduct) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      // Allow partial updates
      const validatedData = insertProductSchema.partial().parse(req.body);
      
      // Detect which fields are changing
      const fieldsChanged: string[] = [];
      
      // Create a field map
      const fieldDisplayNames: Record<string, string> = {
        currentStock: "Current Stock",
        washInventory: "Wash Inventory",
        standInventory: "Stand Inventory",
        harvestBins: "Harvest Bins",
        unitsHarvested: "Units Harvested",
        cropNeeds: "Crop Needs"
      };
      
      // Check for stock changes
      for (const fieldKey of Object.keys(validatedData)) {
        // Skip non-numeric fields
        if (!['currentStock', 'washInventory', 'standInventory', 'harvestBins', 'unitsHarvested', 'cropNeeds'].includes(fieldKey)) {
          continue;
        }
        
        // Get the old and new values
        const oldValueRaw = (currentProduct as any)[fieldKey];
        const newValueRaw = (validatedData as any)[fieldKey];
        
        // Skip if same value
        if (oldValueRaw === newValueRaw) {
          continue;
        }
        
        // Convert to numbers if possible
        const oldValue = oldValueRaw !== null && oldValueRaw !== undefined ? String(oldValueRaw) : "0";
        const newValue = newValueRaw !== null && newValueRaw !== undefined ? String(newValueRaw) : "0";
        
        const numOldVal = parseInt(oldValue);
        const numNewVal = parseInt(newValue);
        
        // Add to list of changed fields if numeric
        if (!isNaN(numOldVal) && !isNaN(numNewVal) && numOldVal !== numNewVal) {
          fieldsChanged.push(fieldKey);
        }
      }
      
      // Update the product
      const updatedProduct = await storage.updateProduct(id, validatedData);
      
      // Create history entries for each changed field
      for (const fieldKey of fieldsChanged) {
        const oldValue = parseInt(String((currentProduct as any)[fieldKey] || 0));
        const newValue = parseInt(String((validatedData as any)[fieldKey] || 0));
        const change = newValue - oldValue;
        
        // Get the field display name
        const fieldDisplayName = fieldDisplayNames[fieldKey] || fieldKey;
        
        // Create location string with field name
        const fieldInfo = `${fieldDisplayName} - ${currentProduct.fieldLocation}`;
        
        // Record the inventory change
        await storage.createInventoryHistory({
          productId: id,
          previousStock: oldValue,
          change: change,
          newStock: newValue,
          fieldLocation: fieldInfo, // Field type included here
          updatedBy: "Farm Admin" // TODO: Use actual user when authentication is implemented
        });
      }
      
      // Check if retail notes were updated and send notification if needed
      const settings = emailSettings.getSettings();
      if (
        updatedProduct &&
        settings.notifyOnRetailNotes && 
        settings.notificationEmail && 
        'retailNotes' in validatedData && 
        validatedData.retailNotes !== currentProduct.retailNotes
      ) {
        // Send notification about retail notes update
        await emailSettings.sendEmailNotification(
          `Retail Notes Updated for ${updatedProduct.name}`,
          `Retail notes have been updated for ${updatedProduct.name}.\n\nPrevious notes: ${currentProduct.retailNotes || 'None'}\n\nNew notes: ${validatedData.retailNotes || 'None'}`
        );
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
        updatedBy: z.string().default("Farm Admin"),
        fieldLocation: z.string().optional() // Optional custom field location
      });
      
      const { productId, change, updatedBy, fieldLocation } = schema.parse(req.body);
      
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
      
      // Create history record with specified field location or default to product's location
      const history = await storage.createInventoryHistory({
        productId,
        previousStock,
        change,
        newStock,
        fieldLocation: fieldLocation || product.fieldLocation, // Use provided location or default to product location
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
      const includeWholesaleKitchen = req.query.includeWholesaleKitchen === 'true';
      
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
      
      let enrichedHistory = history.map(entry => ({
        ...entry,
        productName: productMap.get(entry.productId)?.name || 'Unknown Product',
        // Use field location stored in history if available, otherwise use current product location
        fieldLocation: entry.fieldLocation || productMap.get(entry.productId)?.fieldLocation || 'Unknown Location',
        unit: productMap.get(entry.productId)?.unit || ''
      }));
      
      // Filter out Wholesale/Kitchen entries unless explicitly requested
      if (!includeWholesaleKitchen) {
        enrichedHistory = enrichedHistory.filter(entry => 
          !["Wholesale", "Kitchen"].includes(entry.fieldLocation)
        );
      }
      
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

  // Email settings routes
  app.get("/api/settings/email", (_req: Request, res: Response) => {
    try {
      const settings = emailSettings.getSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to get email settings" });
    }
  });

  app.post("/api/settings/email", (req: Request, res: Response) => {
    try {
      const schema = z.object({
        notificationEmail: z.string().email(),
        notifyOnRetailNotes: z.boolean().default(true),
        useSmtp: z.boolean().optional(),
        smtpServer: z.string().optional(),
        smtpPort: z.number().int().min(1).max(65535).optional(),
        smtpUsername: z.string().optional(),
        smtpPassword: z.string().optional(),
        smtpFromEmail: z.string().email().optional()
      });
      
      const { 
        notificationEmail, 
        notifyOnRetailNotes, 
        useSmtp, 
        smtpServer, 
        smtpPort, 
        smtpUsername, 
        smtpPassword, 
        smtpFromEmail 
      } = schema.parse(req.body);
      
      const settings = emailSettings.updateSettings({
        notificationEmail,
        notifyOnRetailNotes,
        ...(useSmtp !== undefined && { useSmtp }),
        ...(smtpServer !== undefined && { smtpServer }),
        ...(smtpPort !== undefined && { smtpPort }),
        ...(smtpUsername !== undefined && { smtpUsername }),
        ...(smtpPassword !== undefined && { smtpPassword }),
        ...(smtpFromEmail !== undefined && { smtpFromEmail })
      });
      
      res.json(settings);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid email settings", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to update email settings" });
    }
  });

  app.post("/api/settings/test-email", async (req: Request, res: Response) => {
    try {
      const schema = z.object({
        email: z.string().email()
      });
      
      const { email } = schema.parse(req.body);
      
      // Update the email temporarily for the test
      emailSettings.updateSettings({ notificationEmail: email });
      
      const success = await emailSettings.sendTestEmail();
      
      if (success) {
        res.json({ message: "Test email sent successfully" });
      } else {
        res.status(500).json({ message: "Failed to send test email" });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid email address", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to send test email" });
    }
  });

  // Application settings routes
  app.get("/api/settings/:key", async (req: Request, res: Response) => {
    try {
      const { key } = req.params;
      const value = await storage.getSetting(key);
      if (value === null) {
        return res.status(404).json({ message: "Setting not found" });
      }
      res.json({ key, value });
    } catch (error) {
      res.status(500).json({ message: "Failed to get setting" });
    }
  });

  app.post("/api/settings", async (req: Request, res: Response) => {
    try {
      const schema = z.object({
        key: z.string().min(1),
        value: z.any()
      });
      
      const { key, value } = schema.parse(req.body);
      
      const success = await storage.setSetting(key, value);
      if (success) {
        res.json({ key, value });
      } else {
        res.status(500).json({ message: "Failed to save setting" });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid setting data", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to save setting" });
    }
  });

  // Authentication routes
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const schema = z.object({
        password: z.string().min(1, "Password is required")
      });
      
      const { password } = schema.parse(req.body);
      
      // Hash the password
      const passwordHash = hashPassword(password);
      
      // Check if a password is already set
      const existingAuth = await storage.getSitePassword();
      
      if (!existingAuth) {
        // No password set yet, this is the initial setup
        await storage.setSitePassword(passwordHash);
        setAuthCookie(res, passwordHash);
        return res.json({ success: true, message: "Password set successfully" });
      }
      
      // Password already exists, verify it
      if (existingAuth.passwordHash !== passwordHash) {
        return res.status(401).json({ success: false, message: "Invalid password" });
      }
      
      // Valid password
      setAuthCookie(res, passwordHash);
      res.json({ success: true, message: "Login successful" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          success: false,
          message: "Invalid login data", 
          errors: error.errors 
        });
      }
      res.status(500).json({ success: false, message: "Login failed" });
    }
  });
  
  app.post("/api/auth/logout", (_req: Request, res: Response) => {
    clearAuthCookie(res);
    res.json({ success: true, message: "Logout successful" });
  });
  
  app.get("/api/auth/check", async (req: Request, res: Response) => {
    try {
      // Check if password is set in database
      const existingAuth = await storage.getSitePassword();
      
      if (!existingAuth) {
        // No password set, site is not protected yet
        return res.json({ 
          isProtected: false, 
          isAuthenticated: true, 
          message: "Site is not password protected" 
        });
      }
      
      // Check if user is authenticated via cookie
      const authCookie = req.cookies.authToken;
      const isAuthenticated = authCookie === existingAuth.passwordHash;
      
      // If not authenticated, make sure cookies are explicitly cleared to prevent issues
      if (!isAuthenticated) {
        clearAuthCookie(res);
      }
      
      // Add debug information to help troubleshoot
      console.log('Auth check:', {
        cookiePresent: !!authCookie,
        authenticated: isAuthenticated,
        cookieValue: authCookie ? authCookie.substring(0, 10) + '...' : 'none',
        expectedHash: existingAuth.passwordHash ? existingAuth.passwordHash.substring(0, 10) + '...' : 'none'
      });
      
      res.json({
        isProtected: true,
        isAuthenticated,
        message: isAuthenticated ? "Authenticated" : "Authentication required"
      });
    } catch (error) {
      console.error('Auth check error:', error);
      res.status(500).json({ 
        isProtected: false, 
        isAuthenticated: false, 
        message: "Error checking authentication status" 
      });
    }
  });
  
  app.post("/api/auth/change-password", async (req: Request, res: Response) => {
    try {
      const schema = z.object({
        currentPassword: z.string().min(1, "Current password is required"),
        newPassword: z.string().min(1, "New password is required")
      });
      
      const { currentPassword, newPassword } = schema.parse(req.body);
      
      // Hash the passwords
      const currentPasswordHash = hashPassword(currentPassword);
      const newPasswordHash = hashPassword(newPassword);
      
      // Check if current password is correct
      const existingAuth = await storage.getSitePassword();
      
      if (!existingAuth) {
        return res.status(400).json({ 
          success: false, 
          message: "No password has been set yet" 
        });
      }
      
      if (existingAuth.passwordHash !== currentPasswordHash) {
        return res.status(401).json({ 
          success: false, 
          message: "Current password is incorrect" 
        });
      }
      
      // Update the password
      await storage.setSitePassword(newPasswordHash);
      
      // Set the new auth cookie
      setAuthCookie(res, newPasswordHash);
      
      res.json({ success: true, message: "Password changed successfully" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          success: false,
          message: "Invalid password data", 
          errors: error.errors 
        });
      }
      res.status(500).json({ success: false, message: "Failed to change password" });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);
  return httpServer;
}
