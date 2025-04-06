import { pgTable, text, serial, integer, boolean, timestamp, varchar, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Site authentication model
export const siteAuth = pgTable("site_auth", {
  id: serial("id").primaryKey(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Product model
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  fieldLocation: text("field_location").notNull(),
  currentStock: integer("current_stock").notNull().default(0),
  unit: text("unit"),  // Making unit optional
  cropNeeds: text("crop_needs"),
  standInventory: text("stand_inventory"),
  washInventory: text("wash_inventory"),
  harvestBins: text("harvest_bins"),
  unitsHarvested: text("units_harvested"),
  fieldNotes: text("field_notes"),
  retailNotes: text("retail_notes"),
  imageUrl: text("image_url"),
  dateAdded: timestamp("date_added").notNull().defaultNow(),
});

// Inventory history model
export const inventoryHistory = pgTable("inventory_history", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  previousStock: integer("previous_stock").notNull(),
  change: integer("change").notNull(),
  newStock: integer("new_stock").notNull(),
  fieldLocation: text("field_location"),
  updatedBy: text("updated_by").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

// Field locations table
export const fieldLocations = pgTable("field_locations", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
});

// Settings table for app configuration and user preferences
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Product insert schema
export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  dateAdded: true,
});

// Inventory History insert schema
export const insertInventoryHistorySchema = createInsertSchema(inventoryHistory).omit({
  id: true,
  timestamp: true,
});

// Field location insert schema
export const insertFieldLocationSchema = createInsertSchema(fieldLocations).omit({
  id: true,
});

// Settings insert schema
export const insertSettingsSchema = createInsertSchema(settings).omit({
  id: true,
  updatedAt: true,
});

// SiteAuth insert schema
export const insertSiteAuthSchema = createInsertSchema(siteAuth).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type SiteAuth = typeof siteAuth.$inferSelect;
export type InsertSiteAuth = z.infer<typeof insertSiteAuthSchema>;

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export type InventoryHistory = typeof inventoryHistory.$inferSelect;
export type InsertInventoryHistory = z.infer<typeof insertInventoryHistorySchema>;

export type FieldLocation = typeof fieldLocations.$inferSelect;
export type InsertFieldLocation = z.infer<typeof insertFieldLocationSchema>;

export type Setting = typeof settings.$inferSelect;
export type InsertSetting = z.infer<typeof insertSettingsSchema>;

// Extended schema for form validation
export const productFormSchema = insertProductSchema.extend({
  name: z.string().min(2, "Name must be at least 2 characters"),
  fieldLocation: z.string().min(1, "Field location is required"),
  currentStock: z.number().min(0, "Stock cannot be negative"),
  unit: z.string().optional(),  // Unit is now optional
  cropNeeds: z.string().optional(),
  standInventory: z.string().optional(),
  washInventory: z.string().optional(),
  harvestBins: z.string().optional(),
  unitsHarvested: z.string().optional(),
  fieldNotes: z.string().optional(),
  retailNotes: z.string().optional(),
});
