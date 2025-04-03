// This file contains shared type definitions used throughout the client side

export interface StockStatus {
  isLowStock: boolean;
  isCriticalStock: boolean;
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
