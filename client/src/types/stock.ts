export interface Product {
  id: string;
  name: string;
  sku: string;
  description?: string;
  category_id: string;
  supplier_id: string;
  current_stock: number;
  min_stock: number;
  max_stock?: number;
  unit_price: number;
  barcode?: string;
  location?: string;
  created_at: string;
  updated_at: string;
}

export interface StockMovement {
  id: string;
  product_id: string;
  type: string;
  quantity: number;
  reason: string;
  reference?: string;
  notes?: string;
  created_at: string;
  created_by?: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  created_at?: string;
}

export interface Supplier {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  created_at?: string;
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

