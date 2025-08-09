import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { Product, StockMovement, Category, Supplier, StockStats, StockFilter, StockLevel } from '@/types/stock';

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
  | { type: 'SET_PRODUCTS'; payload: Product[] }
  | { type: 'SET_CATEGORIES'; payload: Category[] }
  | { type: 'SET_SUPPLIERS'; payload: Supplier[] }
  | { type: 'SET_MOVEMENTS'; payload: StockMovement[] }
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
  categories: [],
  suppliers: [],
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

const stockReducer = (state: StockState, action: StockAction): StockState => {
  switch (action.type) {
    case 'SET_PRODUCTS':
      return { ...state, products: action.payload };
    case 'SET_CATEGORIES':
      return { ...state, categories: action.payload };
    case 'SET_SUPPLIERS':
      return { ...state, suppliers: action.payload };
    case 'SET_MOVEMENTS':
      return { ...state, movements: action.payload };
    case 'ADD_PRODUCT':
      return { ...state, products: [...state.products, action.payload] };
    case 'UPDATE_PRODUCT':
      return {
        ...state,
        products: state.products.map(p => p.id === action.payload.id ? action.payload : p)
      };
    case 'DELETE_PRODUCT':
      return {
        ...state,
        products: state.products.filter(p => p.id !== action.payload)
      };
    case 'ADD_MOVEMENT':
      return { ...state, movements: [action.payload, ...state.movements] };
    case 'ADD_CATEGORY':
      return { ...state, categories: [...state.categories, action.payload] };
    case 'ADD_SUPPLIER':
      return { ...state, suppliers: [...state.suppliers, action.payload] };
    case 'SET_FILTER':
      return { ...state, filter: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'CALCULATE_STATS':
      const stats = calculateStats(state.products, state.movements);
      return { ...state, stats };
    default:
      return state;
  }
};

const calculateStats = (products: Product[], movements: StockMovement[]): StockStats => {
  const totalProducts = products.length;
  const totalValue = products.reduce((sum, p) => sum + (p.current_stock * p.unit_price), 0);
  const lowStockItems = products.filter(p => p.current_stock <= p.min_stock).length;
  const outOfStockItems = products.filter(p => p.current_stock === 0).length;
  
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recentMovements = movements.filter(m => 
    new Date(m.created_at) >= sevenDaysAgo
  ).length;

  return {
    totalProducts,
    totalValue,
    lowStockItems,
    outOfStockItems,
    recentMovements,
  };
};

interface StockContextValue {
  state: StockState;
  products: Product[];
  movements: StockMovement[];
  categories: Category[];
  suppliers: Supplier[];
  stats: StockStats;
  filter: StockFilter;
  loading: boolean;
  addProduct: (product: Product) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;
  addMovement: (movement: StockMovement) => void;
  addCategory: (category: Category) => void;
  addSupplier: (supplier: Supplier) => void;
  setFilter: (filter: StockFilter) => void;
  setLoading: (loading: boolean) => void;
  refreshData: () => void;
  getStockLevel: (product: Product) => StockLevel;
  getFilteredProducts: () => Product[];
}

const StockContext = createContext<StockContextValue | undefined>(undefined);

export function StockProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(stockReducer, initialState);

  useEffect(() => {
    dispatch({ type: 'CALCULATE_STATS' });
  }, [state.products, state.movements]);

  const getStockLevel = (product: Product): StockLevel => {
    if (product.current_stock === 0) return 'out';
    if (product.current_stock <= product.min_stock) return 'low';
    if (product.max_stock && product.current_stock >= product.max_stock) return 'high';
    return 'medium';
  };

  const getFilteredProducts = (): Product[] => {
    return state.products.filter(product => {
      const matchesSearch = !state.filter.searchTerm || 
        product.name.toLowerCase().includes(state.filter.searchTerm.toLowerCase()) ||
        product.sku.toLowerCase().includes(state.filter.searchTerm.toLowerCase());
      
      const matchesCategory = !state.filter.category || product.category_id === state.filter.category;
      const matchesSupplier = !state.filter.supplier || product.supplier_id === state.filter.supplier;
      
      const stockLevel = getStockLevel(product);
      const matchesStockLevel = !state.filter.stockLevel || stockLevel === state.filter.stockLevel;
      
      return matchesSearch && matchesCategory && matchesSupplier && matchesStockLevel;
    });
  };

  const value: StockContextValue = {
    state,
    products: state.products,
    movements: state.movements,
    categories: state.categories,
    suppliers: state.suppliers,
    stats: state.stats,
    filter: state.filter,
    loading: state.loading,
    addProduct: (product) => dispatch({ type: 'ADD_PRODUCT', payload: product }),
    updateProduct: (product) => dispatch({ type: 'UPDATE_PRODUCT', payload: product }),
    deleteProduct: (id) => dispatch({ type: 'DELETE_PRODUCT', payload: id }),
    addMovement: (movement) => dispatch({ type: 'ADD_MOVEMENT', payload: movement }),
    addCategory: (category) => dispatch({ type: 'ADD_CATEGORY', payload: category }),
    addSupplier: (supplier) => dispatch({ type: 'ADD_SUPPLIER', payload: supplier }),
    setFilter: (filter) => dispatch({ type: 'SET_FILTER', payload: filter }),
    setLoading: (loading) => dispatch({ type: 'SET_LOADING', payload: loading }),
    refreshData: () => {
      // This would typically fetch from API
      dispatch({ type: 'CALCULATE_STATS' });
    },
    getStockLevel,
    getFilteredProducts,
  };

  return (
    <StockContext.Provider value={value}>
      {children}
    </StockContext.Provider>
  );
}

export const useStock = (): StockContextValue => {
  const context = useContext(StockContext);
  if (context === undefined) {
    throw new Error('useStock must be used within a StockProvider');
  }
  return context;
};