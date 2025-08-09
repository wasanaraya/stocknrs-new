export interface Product {
  id: string;
  name: string;
  sku: string;
  description?: string;
  category: string;
  supplier: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  unitPrice: number;
  barcode?: string;
  location?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  type: 'IN' | 'OUT' | 'ADJUSTMENT';
  quantity: number;
  reason: string;
  reference?: string;
  createdAt: string;
  createdBy: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  color: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact?: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface StockStats {
  totalProducts: number;
  totalValue: number;
  lowStockItems: number;
  outOfStockItems: number;
  recentMovements: number;
}

export type StockLevel = 'high' | 'medium' | 'low' | 'out';

export interface StockFilter {
  category?: string;
  supplier?: string;
  stockLevel?: StockLevel;
  searchTerm?: string;
}