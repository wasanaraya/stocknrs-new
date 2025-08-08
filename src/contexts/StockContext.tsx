import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { Product, StockMovement, Category, Supplier, StockStats, StockFilter } from '@/types/stock';

interface StockState {
  products: Product[];
  movements: StockMovement[];
  categories: Category[];
  suppliers: Supplier[];
  stats: StockStats;
  filter: StockFilter;
  loading: boolean;
}

type StockAction =
  | { type: 'ADD_PRODUCT'; payload: Product }
  | { type: 'UPDATE_PRODUCT'; payload: Product }
  | { type: 'DELETE_PRODUCT'; payload: string }
  | { type: 'ADD_MOVEMENT'; payload: StockMovement }
  | { type: 'ADD_CATEGORY'; payload: Category }
  | { type: 'ADD_SUPPLIER'; payload: Supplier }
  | { type: 'SET_FILTER'; payload: StockFilter }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'CALCULATE_STATS' };

const initialState: StockState = {
  products: [],
  movements: [],
  categories: [
    { id: '1', name: 'Electronics', description: 'Electronic devices and accessories', color: '#3B82F6' },
    { id: '2', name: 'Clothing', description: 'Apparel and fashion items', color: '#10B981' },
    { id: '3', name: 'Books', description: 'Books and publications', color: '#F59E0B' },
    { id: '4', name: 'Home & Garden', description: 'Home improvement and garden supplies', color: '#8B5CF6' },
  ],
  suppliers: [
    { id: '1', name: 'TechSupply Co.', contact: 'John Smith', email: 'john@techsupply.com', phone: '+1-555-0123' },
    { id: '2', name: 'Fashion Forward', contact: 'Sarah Johnson', email: 'sarah@fashionforward.com', phone: '+1-555-0124' },
    { id: '3', name: 'BookWorld', contact: 'Mike Wilson', email: 'mike@bookworld.com', phone: '+1-555-0125' },
  ],
  stats: {
    totalProducts: 0,
    totalValue: 0,
    lowStockItems: 0,
    outOfStockItems: 0,
    recentMovements: 0,
  },
  filter: {},
  loading: false,
};

// Sample data
const sampleProducts: Product[] = [
  {
    id: '1',
    name: 'MacBook Pro 16"',
    sku: 'MBP-16-001',
    description: 'Apple MacBook Pro 16-inch with M3 chip',
    category: '1',
    supplier: '1',
    currentStock: 15,
    minStock: 5,
    maxStock: 50,
    unitPrice: 2499.99,
    barcode: '123456789012',
    location: 'A1-B2',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Wireless Headphones',
    sku: 'WH-001',
    description: 'Premium noise-canceling wireless headphones',
    category: '1',
    supplier: '1',
    currentStock: 3,
    minStock: 10,
    maxStock: 100,
    unitPrice: 299.99,
    barcode: '123456789013',
    location: 'A2-C1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'Designer T-Shirt',
    sku: 'TS-001',
    description: 'Premium cotton designer t-shirt',
    category: '2',
    supplier: '2',
    currentStock: 0,
    minStock: 20,
    maxStock: 200,
    unitPrice: 49.99,
    barcode: '123456789014',
    location: 'B1-A3',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '4',
    name: 'JavaScript Guide',
    sku: 'JS-GUIDE-001',
    description: 'Complete guide to modern JavaScript development',
    category: '3',
    supplier: '3',
    currentStock: 45,
    minStock: 10,
    maxStock: 100,
    unitPrice: 39.99,
    barcode: '123456789015',
    location: 'C1-A1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

function calculateStats(products: Product[], movements: StockMovement[]): StockStats {
  const totalProducts = products.length;
  const totalValue = products.reduce((sum, product) => sum + (product.currentStock * product.unitPrice), 0);
  const lowStockItems = products.filter(p => p.currentStock <= p.minStock && p.currentStock > 0).length;
  const outOfStockItems = products.filter(p => p.currentStock === 0).length;
  const recentMovements = movements.filter(m => {
    const movementDate = new Date(m.createdAt);
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return movementDate >= oneWeekAgo;
  }).length;

  return {
    totalProducts,
    totalValue,
    lowStockItems,
    outOfStockItems,
    recentMovements,
  };
}

function stockReducer(state: StockState, action: StockAction): StockState {
  switch (action.type) {
    case 'ADD_PRODUCT':
      return {
        ...state,
        products: [...state.products, action.payload],
      };
    case 'UPDATE_PRODUCT':
      return {
        ...state,
        products: state.products.map(p => p.id === action.payload.id ? action.payload : p),
      };
    case 'DELETE_PRODUCT':
      return {
        ...state,
        products: state.products.filter(p => p.id !== action.payload),
      };
    case 'ADD_MOVEMENT':
      const updatedProducts = state.products.map(product => {
        if (product.id === action.payload.productId) {
          const newStock = action.payload.type === 'IN' 
            ? product.currentStock + action.payload.quantity
            : action.payload.type === 'OUT'
            ? Math.max(0, product.currentStock - action.payload.quantity)
            : action.payload.quantity;
          
          return {
            ...product,
            currentStock: newStock,
            updatedAt: new Date().toISOString(),
          };
        }
        return product;
      });
      
      return {
        ...state,
        products: updatedProducts,
        movements: [action.payload, ...state.movements],
      };
    case 'ADD_CATEGORY':
      return {
        ...state,
        categories: [...state.categories, action.payload],
      };
    case 'ADD_SUPPLIER':
      return {
        ...state,
        suppliers: [...state.suppliers, action.payload],
      };
    case 'SET_FILTER':
      return {
        ...state,
        filter: action.payload,
      };
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
      };
    case 'CALCULATE_STATS':
      return {
        ...state,
        stats: calculateStats(state.products, state.movements),
      };
    default:
      return state;
  }
}

interface StockContextValue extends StockState {
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;
  addStockMovement: (movement: Omit<StockMovement, 'id' | 'createdAt'>) => void;
  addCategory: (category: Omit<Category, 'id'>) => void;
  addSupplier: (supplier: Omit<Supplier, 'id'>) => void;
  setFilter: (filter: StockFilter) => void;
  getFilteredProducts: () => Product[];
  getStockLevel: (product: Product) => 'high' | 'medium' | 'low' | 'out';
}

const StockContext = createContext<StockContextValue | undefined>(undefined);

export function StockProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(stockReducer, {
    ...initialState,
    products: sampleProducts,
  });

  useEffect(() => {
    dispatch({ type: 'CALCULATE_STATS' });
  }, [state.products, state.movements]);

  const addProduct = (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    const product: Product = {
      ...productData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    dispatch({ type: 'ADD_PRODUCT', payload: product });
  };

  const updateProduct = (product: Product) => {
    dispatch({ type: 'UPDATE_PRODUCT', payload: { ...product, updatedAt: new Date().toISOString() } });
  };

  const deleteProduct = (id: string) => {
    dispatch({ type: 'DELETE_PRODUCT', payload: id });
  };

  const addStockMovement = (movementData: Omit<StockMovement, 'id' | 'createdAt'>) => {
    const movement: StockMovement = {
      ...movementData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    dispatch({ type: 'ADD_MOVEMENT', payload: movement });
  };

  const addCategory = (categoryData: Omit<Category, 'id'>) => {
    const category: Category = {
      ...categoryData,
      id: Date.now().toString(),
    };
    dispatch({ type: 'ADD_CATEGORY', payload: category });
  };

  const addSupplier = (supplierData: Omit<Supplier, 'id'>) => {
    const supplier: Supplier = {
      ...supplierData,
      id: Date.now().toString(),
    };
    dispatch({ type: 'ADD_SUPPLIER', payload: supplier });
  };

  const setFilter = (filter: StockFilter) => {
    dispatch({ type: 'SET_FILTER', payload: filter });
  };

  const getStockLevel = (product: Product): 'high' | 'medium' | 'low' | 'out' => {
    if (product.currentStock === 0) return 'out';
    if (product.currentStock <= product.minStock) return 'low';
    if (product.currentStock <= product.minStock * 2) return 'medium';
    return 'high';
  };

  const getFilteredProducts = () => {
    let filtered = [...state.products];

    if (state.filter.searchTerm) {
      const searchLower = state.filter.searchTerm.toLowerCase();
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchLower) ||
        product.sku.toLowerCase().includes(searchLower) ||
        product.description?.toLowerCase().includes(searchLower)
      );
    }

    if (state.filter.category) {
      filtered = filtered.filter(product => product.category === state.filter.category);
    }

    if (state.filter.supplier) {
      filtered = filtered.filter(product => product.supplier === state.filter.supplier);
    }

    if (state.filter.stockLevel) {
      filtered = filtered.filter(product => getStockLevel(product) === state.filter.stockLevel);
    }

    return filtered;
  };

  return (
    <StockContext.Provider
      value={{
        ...state,
        addProduct,
        updateProduct,
        deleteProduct,
        addStockMovement,
        addCategory,
        addSupplier,
        setFilter,
        getFilteredProducts,
        getStockLevel,
      }}
    >
      {children}
    </StockContext.Provider>
  );
}

export function useStock() {
  const context = useContext(StockContext);
  if (context === undefined) {
    throw new Error('useStock must be used within a StockProvider');
  }
  return context;
}