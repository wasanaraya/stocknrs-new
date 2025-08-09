import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { Product, StockMovement, Category, Supplier, StockStats, StockFilter } from '@/types/stock';
import { supabase } from '@/lib/supabase';

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

function calculateStats(products: Product[], movements: StockMovement[]): StockStats {
  const totalProducts = products.length;
  const totalValue = products.reduce((sum, product) => sum + (product.currentStock * product.unitPrice), 0);
  const lowStockItems = products.filter(p => p.currentStock <= p.minStock && p.currentStock > 0).length;
  const outOfStockItems = products.filter(p => p.currentStock === 0).length;
  const recentMovements = movements.filter(m => {
    const movementDate = new Date(m.created_at);
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
    case 'SET_PRODUCTS':
      return { ...state, products: action.payload };
    case 'SET_CATEGORIES':
      return { ...state, categories: action.payload };
    case 'SET_SUPPLIERS':
      return { ...state, suppliers: action.payload };
    case 'SET_MOVEMENTS':
      return { ...state, movements: action.payload };
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
        if (product.id === action.payload.product_id) {
          const newStock = action.payload.type === 'in' 
            ? product.current_stock + action.payload.quantity
            : Math.max(0, product.current_stock - action.payload.quantity);
          
          return {
            ...product,
            current_stock: newStock,
            updated_at: new Date().toISOString(),
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
  addProduct: (product: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateProduct: (product: Product) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  addStockMovement: (movement: Omit<StockMovement, 'id' | 'created_at'>) => Promise<void>;
  addCategory: (category: Omit<Category, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateCategory: (category: Category) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  addSupplier: (supplier: Omit<Supplier, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateSupplier: (supplier: Supplier) => Promise<void>;
  deleteSupplier: (id: string) => Promise<void>;
  setFilter: (filter: StockFilter) => void;
  getFilteredProducts: () => Product[];
  getStockLevel: (product: Product) => 'high' | 'medium' | 'low' | 'out';
}

const StockContext = createContext<StockContextValue | undefined>(undefined);

export function StockProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(stockReducer, initialState);

  const fetchProducts = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    const { data, error } = await supabase.from('products').select('*');
    if (error) {
      console.error('Error fetching products:', error);
    } else {
      dispatch({ type: 'SET_PRODUCTS', payload: data || [] });
    }
    dispatch({ type: 'SET_LOADING', payload: false });
  }, []);

  const fetchCategories = useCallback(async () => {
    const { data, error } = await supabase.from('categories').select('*');
    if (error) {
      console.error('Error fetching categories:', error);
    } else {
      dispatch({ type: 'SET_CATEGORIES', payload: data || [] });
    }
  }, []);

  const fetchSuppliers = useCallback(async () => {
    const { data, error } = await supabase.from('suppliers').select('*');
    if (error) {
      console.error('Error fetching suppliers:', error);
    } else {
      dispatch({ type: 'SET_SUPPLIERS', payload: data || [] });
    }
  }, []);

  const fetchMovements = useCallback(async () => {
    const { data, error } = await supabase.from('movements').select('*');
    if (error) {
      console.error('Error fetching movements:', error);
    } else {
      dispatch({ type: 'SET_MOVEMENTS', payload: data || [] });
    }
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchSuppliers();
    fetchMovements();
  }, [fetchProducts, fetchCategories, fetchSuppliers, fetchMovements]);

  useEffect(() => {
    dispatch({ type: 'CALCULATE_STATS' });
  }, [state.products, state.movements]);

  const addProduct = async (productData: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => {
    const { data, error } = await supabase.from('products').insert([productData]).select();
    if (error) {
      console.error('Error adding product:', error);
    } else if (data && data.length > 0) {
      dispatch({ type: 'ADD_PRODUCT', payload: data[0] });
    }
  };

  const updateProduct = async (product: Product) => {
    const { data, error } = await supabase.from('products').update(product).eq('id', product.id).select();
    if (error) {
      console.error('Error updating product:', error);
    } else if (data && data.length > 0) {
      dispatch({ type: 'UPDATE_PRODUCT', payload: data[0] });
    }
  };

  const deleteProduct = async (id: string) => {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) {
      console.error('Error deleting product:', error);
    } else {
      dispatch({ type: 'DELETE_PRODUCT', payload: id });
    }
  };

  const addStockMovement = async (movementData: Omit<StockMovement, 'id' | 'created_at'>) => {
    const { data, error } = await supabase.from('movements').insert([movementData]).select();
    if (error) {
      console.error('Error adding movement:', error);
    } else if (data && data.length > 0) {
      dispatch({ type: 'ADD_MOVEMENT', payload: data[0] });
      // Re-fetch products to update stock levels, as triggers handle stock updates in DB
      fetchProducts(); 
    }
  };

  const addCategory = async (categoryData: Omit<Category, 'id' | 'created_at' | 'updated_at'>) => {
    const { data, error } = await supabase.from('categories').insert([categoryData]).select();
    if (error) {
      console.error('Error adding category:', error);
    } else if (data && data.length > 0) {
      dispatch({ type: 'ADD_CATEGORY', payload: data[0] });
    }
  };

  const updateCategory = async (category: Category) => {
    const { data, error } = await supabase.from('categories').update(category).eq('id', category.id).select();
    if (error) {
      console.error('Error updating category:', error);
    } else if (data && data.length > 0) {
      dispatch({ type: 'SET_CATEGORIES', payload: state.categories.map(c => c.id === data[0].id ? data[0] : c) });
    }
  };

  const deleteCategory = async (id: string) => {
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) {
      console.error('Error deleting category:', error);
    } else {
      dispatch({ type: 'SET_CATEGORIES', payload: state.categories.filter(c => c.id !== id) });
    }
  };

  const addSupplier = async (supplierData: Omit<Supplier, 'id' | 'created_at' | 'updated_at'>) => {
    const { data, error } = await supabase.from('suppliers').insert([supplierData]).select();
    if (error) {
      console.error('Error adding supplier:', error);
    } else if (data && data.length > 0) {
      dispatch({ type: 'ADD_SUPPLIER', payload: data[0] });
    }
  };

  const updateSupplier = async (supplier: Supplier) => {
    const { data, error } = await supabase.from('suppliers').update(supplier).eq('id', supplier.id).select();
    if (error) {
      console.error('Error updating supplier:', error);
    } else if (data && data.length > 0) {
      dispatch({ type: 'SET_SUPPLIERS', payload: state.suppliers.map(s => s.id === data[0].id ? data[0] : s) });
    }
  };

  const deleteSupplier = async (id: string) => {
    const { error } = await supabase.from('suppliers').delete().eq('id', id);
    if (error) {
      console.error('Error deleting supplier:', error);
    } else {
      dispatch({ type: 'SET_SUPPLIERS', payload: state.suppliers.filter(s => s.id !== id) });
    }
  };

  const setFilter = (filter: StockFilter) => {
    dispatch({ type: 'SET_FILTER', payload: filter });
  };

  const getStockLevel = (product: Product): 'high' | 'medium' | 'low' | 'out' => {
    if (product.current_stock === 0) return 'out';
    if (product.current_stock <= product.min_stock) return 'low';
    if (product.current_stock <= product.min_stock * 2) return 'medium';
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
      filtered = filtered.filter(product => product.category_id === state.filter.category);
    }

    if (state.filter.supplier) {
      filtered = filtered.filter(product => product.supplier_id === state.filter.supplier);
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
        updateCategory,
        deleteCategory,
        addSupplier,
        updateSupplier,
        deleteSupplier,
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

