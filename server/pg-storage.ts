import { db } from './database';
import { 
  Product, 
  InventoryHistory, 
  FieldLocation, 
  Setting,
  SiteAuth,
  InsertProduct, 
  InsertInventoryHistory, 
  InsertFieldLocation,
  InsertSetting,
  products,
  inventoryHistory,
  fieldLocations,
  settings,
  siteAuth
} from '../shared/schema';
import { IStorage } from './storage';
import { eq, desc, between, sql } from 'drizzle-orm';

export class PgStorage implements IStorage {
  // Product operations
  async getProducts(): Promise<Product[]> {
    return await db.select().from(products);
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const result = await db.select().from(products).where(eq(products.id, id));
    return result.length > 0 ? result[0] : undefined;
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const result = await db.insert(products).values(product).returning();
    return result[0];
  }

  async updateProduct(id: number, productData: Partial<Product>): Promise<Product | undefined> {
    const result = await db
      .update(products)
      .set(productData)
      .where(eq(products.id, id))
      .returning();
    
    return result.length > 0 ? result[0] : undefined;
  }

  async deleteProduct(id: number): Promise<boolean> {
    const result = await db
      .delete(products)
      .where(eq(products.id, id))
      .returning({ id: products.id });
    
    return result.length > 0;
  }

  // Inventory history operations
  async getInventoryHistory(): Promise<InventoryHistory[]> {
    return await db
      .select()
      .from(inventoryHistory)
      .orderBy(desc(inventoryHistory.timestamp));
  }

  async getInventoryHistoryByDateRange(startDate: Date, endDate: Date): Promise<InventoryHistory[]> {
    return await db
      .select()
      .from(inventoryHistory)
      .where(
        between(
          inventoryHistory.timestamp,
          sql`${startDate.toISOString()}::timestamp`,
          sql`${endDate.toISOString()}::timestamp`
        )
      )
      .orderBy(desc(inventoryHistory.timestamp));
  }

  async getInventoryHistoryByProduct(productId: number): Promise<InventoryHistory[]> {
    return await db
      .select()
      .from(inventoryHistory)
      .where(eq(inventoryHistory.productId, productId))
      .orderBy(desc(inventoryHistory.timestamp));
  }

  async createInventoryHistory(history: InsertInventoryHistory): Promise<InventoryHistory> {
    const result = await db
      .insert(inventoryHistory)
      .values(history)
      .returning();
    
    return result[0];
  }

  // Field location operations
  async getFieldLocations(): Promise<FieldLocation[]> {
    return await db
      .select()
      .from(fieldLocations)
      .orderBy(fieldLocations.name);
  }

  async createFieldLocation(location: InsertFieldLocation): Promise<FieldLocation> {
    const result = await db
      .insert(fieldLocations)
      .values(location)
      .returning();
    
    return result[0];
  }

  async deleteFieldLocation(id: number): Promise<boolean> {
    const result = await db
      .delete(fieldLocations)
      .where(eq(fieldLocations.id, id))
      .returning({ id: fieldLocations.id });
    
    return result.length > 0;
  }
  
  // Authentication operations
  async getSitePassword(): Promise<SiteAuth | null> {
    const results = await db
      .select()
      .from(siteAuth)
      .limit(1);
    
    return results.length > 0 ? results[0] : null;
  }
  
  async setSitePassword(passwordHash: string): Promise<SiteAuth> {
    const now = new Date();
    // Check if a password exists first
    const existing = await this.getSitePassword();
    
    if (existing) {
      // Update existing password
      const result = await db
        .update(siteAuth)
        .set({ 
          passwordHash, 
          updatedAt: now 
        })
        .where(eq(siteAuth.id, existing.id))
        .returning();
      
      return result[0];
    } else {
      // Create new password
      const result = await db
        .insert(siteAuth)
        .values({ 
          passwordHash,
          createdAt: now,
          updatedAt: now
        })
        .returning();
      
      return result[0];
    }
  }

  // Settings operations
  async getSetting(key: string): Promise<any | null> {
    const result = await db
      .select()
      .from(settings)
      .where(eq(settings.key, key));
    
    if (result.length === 0) return null;
    
    // The value is stored as JSONB in PostgreSQL, so it should already be parsed
    return result[0].value;
  }
  
  async setSetting(key: string, value: any): Promise<boolean> {
    // For JSONB column, we can pass the value directly to Drizzle
    // Check if setting already exists
    const existing = await db
      .select()
      .from(settings)
      .where(eq(settings.key, key));
    
    if (existing.length > 0) {
      // Update existing setting
      await db
        .update(settings)
        .set({ value })
        .where(eq(settings.key, key));
    } else {
      // Insert new setting
      await db
        .insert(settings)
        .values({ key, value });
    }
    
    return true;
  }
}