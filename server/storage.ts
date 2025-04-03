import { 
  Product, InsertProduct, 
  InventoryHistory, InsertInventoryHistory,
  FieldLocation, InsertFieldLocation,
  products, inventoryHistory, fieldLocations
} from "../shared/schema";

// Interface for storage operations
export interface IStorage {
  // Product operations
  getProducts(): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<Product>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;
  
  // Inventory history operations
  getInventoryHistory(): Promise<InventoryHistory[]>;
  getInventoryHistoryByDateRange(startDate: Date, endDate: Date): Promise<InventoryHistory[]>;
  getInventoryHistoryByProduct(productId: number): Promise<InventoryHistory[]>;
  createInventoryHistory(history: InsertInventoryHistory): Promise<InventoryHistory>;
  
  // Field location operations
  getFieldLocations(): Promise<FieldLocation[]>;
  createFieldLocation(location: InsertFieldLocation): Promise<FieldLocation>;
  deleteFieldLocation(id: number): Promise<boolean>;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private products: Map<number, Product>;
  private inventoryHistory: Map<number, InventoryHistory>;
  private fieldLocations: Map<number, FieldLocation>;
  private productIdCounter: number;
  private historyIdCounter: number;
  private fieldLocationIdCounter: number;

  constructor() {
    this.products = new Map();
    this.inventoryHistory = new Map();
    this.fieldLocations = new Map();
    this.productIdCounter = 1;
    this.historyIdCounter = 1;
    this.fieldLocationIdCounter = 1;
    
    // Seed field locations
    this.seedFieldLocations();
    // Seed sample products
    this.seedProducts();
  }

  private seedFieldLocations() {
    const defaultLocations = [
      "North Field",
      "South Field",
      "East Field",
      "West Field",
      "Greenhouse"
    ];

    defaultLocations.forEach(name => {
      const id = this.fieldLocationIdCounter++;
      this.fieldLocations.set(id, {
        id,
        name
      });
    });
  }

  private seedProducts() {
    const defaultProducts: InsertProduct[] = [
      {
        name: "Carrots",
        fieldLocation: "Lower Blais",
        currentStock: 32,
        unit: "bunches",
        cropNeeds: "60",
        standInventory: "1",
        washInventory: "1",
        harvestBins: "1",
        unitsHarvested: "20",
        fieldNotes: "Planted March 15. Organic cultivation methods applied.",
        retailNotes: "Sweet orange variety. Popular with regular customers. Keep refrigerated.",
        imageUrl: "https://images.unsplash.com/photo-1589927986089-35812388d1f4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=80&h=80&q=80"
      },
      {
        name: "Arugula",
        fieldLocation: "Stone Wall",
        currentStock: 8,
        unit: "",
        cropNeeds: "60",
        standInventory: "1",
        washInventory: "1",
        harvestBins: "1",
        unitsHarvested: "20",
        fieldNotes: "Date Range: Thurs-Fri",
        retailNotes: "Popular at weekend markets.",
        imageUrl: "https://images.unsplash.com/photo-1566842600175-97dca3a750e3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=80&h=80&q=80"
      },
      {
        name: "Green Leaf",
        fieldLocation: "Upper Blais",
        currentStock: 3,
        unit: "",
        cropNeeds: "15",
        standInventory: "",
        washInventory: "",
        harvestBins: "",
        unitsHarvested: "",
        fieldNotes: "Succession planted every 2 weeks.",
        retailNotes: "Very popular. Harvest day of or day before market.",
        imageUrl: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=80&h=80&q=80"
      },
      {
        name: "Spinach",
        fieldLocation: "Side Hill 3",
        currentStock: 24,
        unit: "",
        cropNeeds: "40",
        standInventory: "",
        washInventory: "",
        harvestBins: "",
        unitsHarvested: "",
        fieldNotes: "Direct seeded April 1.",
        retailNotes: "Keep refrigerated for display.",
        imageUrl: "https://images.unsplash.com/photo-1591070883261-0ea4973cc61b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=80&h=80&q=80"
      }
    ];

    defaultProducts.forEach(product => {
      const id = this.productIdCounter++;
      const dateAdded = new Date();
      dateAdded.setMonth(dateAdded.getMonth() - 2); // Set to 2 months ago
      
      this.products.set(id, {
        ...product,
        id,
        dateAdded
      });
    });

    // Add initial history records for products
    this.products.forEach(product => {
      const historyEntry: InsertInventoryHistory = {
        productId: product.id,
        previousStock: 0,
        change: product.currentStock,
        newStock: product.currentStock,
        fieldLocation: product.fieldLocation,
        updatedBy: "Farm Admin"
      };
      this.createInventoryHistory(historyEntry);
    });
  }

  // Product methods
  async getProducts(): Promise<Product[]> {
    return Array.from(this.products.values());
  }

  async getProduct(id: number): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const id = this.productIdCounter++;
    const newProduct = {
      ...product,
      id,
      dateAdded: new Date()
    };
    this.products.set(id, newProduct);
    return newProduct;
  }

  async updateProduct(id: number, product: Partial<Product>): Promise<Product | undefined> {
    const existingProduct = this.products.get(id);
    if (!existingProduct) return undefined;

    const updatedProduct = { ...existingProduct, ...product };
    this.products.set(id, updatedProduct);
    return updatedProduct;
  }

  async deleteProduct(id: number): Promise<boolean> {
    return this.products.delete(id);
  }

  // Inventory history methods
  async getInventoryHistory(): Promise<InventoryHistory[]> {
    return Array.from(this.inventoryHistory.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async getInventoryHistoryByDateRange(startDate: Date, endDate: Date): Promise<InventoryHistory[]> {
    return Array.from(this.inventoryHistory.values())
      .filter(history => {
        const historyDate = history.timestamp;
        return historyDate >= startDate && historyDate <= endDate;
      })
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async getInventoryHistoryByProduct(productId: number): Promise<InventoryHistory[]> {
    return Array.from(this.inventoryHistory.values())
      .filter(history => history.productId === productId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async createInventoryHistory(history: InsertInventoryHistory): Promise<InventoryHistory> {
    const id = this.historyIdCounter++;
    const newHistory = {
      ...history,
      id,
      timestamp: new Date()
    };
    this.inventoryHistory.set(id, newHistory);
    return newHistory;
  }

  // Field location methods
  async getFieldLocations(): Promise<FieldLocation[]> {
    return Array.from(this.fieldLocations.values());
  }

  async createFieldLocation(location: InsertFieldLocation): Promise<FieldLocation> {
    const id = this.fieldLocationIdCounter++;
    const newLocation = {
      ...location,
      id
    };
    this.fieldLocations.set(id, newLocation);
    return newLocation;
  }

  async deleteFieldLocation(id: number): Promise<boolean> {
    return this.fieldLocations.delete(id);
  }
}

// Use PgStorage from pg-storage.ts
import { PgStorage } from './pg-storage';

// Export a singleton instance of PgStorage for persistent database storage
export const storage = new PgStorage();
