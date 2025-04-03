// This file contains shared type definitions used throughout the client side

export interface StockStatus {
  isLowStock: boolean;
  isCriticalStock: boolean;
}

export interface Product {
  id: number;
  name: string;
  fieldLocation: string;
  unit: string;
  currentStock: number;
  minStock: number;
  dateAdded: string;
  fieldNotes?: string;
  retailNotes?: string;
  cropNeeds?: string;
  standInventory?: string;
  washInventory?: string;
  harvestBins?: string;
  unitsHarvested?: string;
}

export interface ReportItem {
  id: number;
  name: string;
  fieldLocation: string;
  unit: string;
  starting: number;
  added: number;
  removed: number;
  current: number;
  isLowStock: boolean;
  isCriticalStock: boolean;
  fieldNotes?: string;
  retailNotes?: string;
  washInventory?: string;
  standInventory?: string;
  harvestBins?: string;
  cropNeeds?: string;
  unitsHarvested?: string;
}

export interface HistoryEntry {
  id: number;
  productId: number;
  productName: string;
  fieldLocation: string;
  previousStock: number;
  change: number;
  newStock: number;
  unit: string;
  updatedBy: string;
  timestamp: string;
}

export interface FilterOptions {
  search?: string;
  fieldLocation?: string;
  sortBy?: string;
  dateFrom?: string;
  dateTo?: string;
}
