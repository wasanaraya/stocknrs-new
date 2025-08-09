import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { supabase, type Product as DBProduct, type Category as DBCategory, type Supplier as DBSupplier, type Movement as DBMovement } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

// Updated types to match database structure
interface Product extends DBProduct {
  category_name?: string;
  supplier_name?: string;
}

interface StockMovement extends DBMovement {
  product_name?: string;
  product_sku?: string;
}

interface Category extends DBCategory {}

interface Supplier extends DBSupplier {}

interface StockStats {
  totalProducts: number;
  totalValue: number;
  lowStockItems: number;
  outOfStockItems: number;
  recentMovements: number;
}

interface StockFilter {
  category?: string;
  supplier?: string;
  stockLevel?: 'high' | 'medium' | 'low' | 'out';
  searchTerm?: string;
}

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
  | { type: 'SET_MOVEMENTS'; payload: StockMovement[] }
  | { type: 'SET_CATEGORIES'; payload: Category[] }
  | { type: 'SET_SUPPLIERS'; payload: Supplier[] }
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
  loading: true,
};

function calculateStats(products: Product[], movements: StockMovement[]): StockStats {
  const totalProducts = products.length;
  const totalValue = products.reduce((sum, product) => sum + (product.current_stock * product.unit_price), 0);
  const lowStockItems = products.filter(p => p.current_stock <= p.min_stock && p.current_stock > 0).length;
  const outOfStockItems = products.filter(p => p.current_stock === 0).length;
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
      return {
        ...state,
        products: action.payload,
      };
    case 'SET_MOVEMENTS':
      return {
        ...state,
        movements: action.payload,
      };
    case 'SET_CATEGORIES':
      return {
        ...state,
        categories: action.payload,
      };
    case 'SET_SUPPLIERS':
      return {
        ...state,
        suppliers: action.payload,
      };
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
      return {
        ...state,
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
  addCategory: (category: Omit<Category, 'id' | 'created_at'>) => Promise<void>;
  addSupplier: (supplier: Omit<Supplier, 'id' | 'created_at'>) => Promise<void>;
  setFilter: (filter: StockFilter) => void;
  getFilteredProducts: () => Product[];
  getStockLevel: (product: Product) => 'high' | 'medium' | 'low' | 'out';
  refreshData: () => Promise<void>;
}

const StockContext = createContext<StockContextValue | undefined>(undefined);

export function StockProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(stockReducer, initialState);
  const { toast } = useToast();

  // Fetch all data from database
  const fetchAllData = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      // Fetch products with category and supplier names
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select(`
          *,
          categories!inner (name),
          suppliers!inner (name)
        `)
        .order('name');

      if (productsError) throw productsError;

      const products = productsData?.map(product => ({
        ...product,
        category_name: product.categories.name,
        supplier_name: product.suppliers.name
      })) || [];

      // Fetch movements with product details
      const { data: movementsData, error: movementsError } = await supabase
        .from('movements')
        .select(`
          *,
          products!inner (name, sku)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (movementsError) throw movementsError;

      const movements = movementsData?.map(movement => ({
        ...movement,
        product_name: movement.products.name,
        product_sku: movement.products.sku
      })) || [];

      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (categoriesError) throw categoriesError;

      // Fetch suppliers
      const { data: suppliersData, error: suppliersError } = await supabase
        .from('suppliers')
        .select('*')
        .order('name');

      if (suppliersError) throw suppliersError;

      // Update state
      dispatch({ type: 'SET_PRODUCTS', payload: products });
      dispatch({ type: 'SET_MOVEMENTS', payload: movements });
      dispatch({ type: 'SET_CATEGORIES', payload: categoriesData || [] });
      dispatch({ type: 'SET_SUPPLIERS', payload: suppliersData || [] });
      dispatch({ type: 'CALCULATE_STATS' });

    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถดึงข้อมูลจากฐานข้อมูลได้",
        variant: "destructive",
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Initialize data on mount
  useEffect(() => {
    fetchAllData();
  }, []);

  // Recalculate stats when products or movements change
  useEffect(() => {
    dispatch({ type: 'CALCULATE_STATS' });
  }, [state.products, state.movements]);

  const addProduct = async (productData: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .insert([productData])
        .select(`
          *,
          categories!inner (name),
          suppliers!inner (name)
        `)
        .single();

      if (error) throw error;

      const product = {
        ...data,
        category_name: data.categories.name,
        supplier_name: data.suppliers.name
      };

      dispatch({ type: 'ADD_PRODUCT', payload: product });
    } catch (error) {
      console.error('Error adding product:', error);
      throw error;
    }
  };

  const updateProduct = async (product: Product) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({
          name: product.name,
          sku: product.sku,
          description: product.description,
          category_id: product.category_id,
          supplier_id: product.supplier_id,
          unit_price: product.unit_price,
          current_stock: product.current_stock,
          min_stock: product.min_stock,
          max_stock: product.max_stock,
          location: product.location,
          barcode: product.barcode,
          expiry_date: product.expiry_date
        })
        .eq('id', product.id);

      if (error) throw error;

      dispatch({ type: 'UPDATE_PRODUCT', payload: product });
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;

      dispatch({ type: 'DELETE_PRODUCT', payload: id });
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  };

  const addStockMovement = async (movementData: Omit<StockMovement, 'id' | 'created_at'>) => {
    try {
      const { data, error } = await supabase
        .from('movements')
        .insert([{
          product_id: movementData.product_id,
          type: movementData.type,
          quantity: movementData.quantity,
          reason: movementData.reason,
          reference: movementData.reference,
          notes: movementData.notes,
          created_by: movementData.created_by
        }])
        .select(`
          *,
          products!inner (name, sku)
        `)
        .single();

      if (error) throw error;

      const movement = {
        ...data,
        product_name: data.products.name,
        product_sku: data.products.sku
      };

      dispatch({ type: 'ADD_MOVEMENT', payload: movement });
    } catch (error) {
      console.error('Error adding movement:', error);
      throw error;
    }
  };

  const addCategory = async (categoryData: Omit<Category, 'id' | 'created_at'>) => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .insert([categoryData])
        .select()
        .single();

      if (error) throw error;

      dispatch({ type: 'ADD_CATEGORY', payload: data });
    } catch (error) {
      console.error('Error adding category:', error);
      throw error;
    }
  };

  const addSupplier = async (supplierData: Omit<Supplier, 'id' | 'created_at'>) => {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .insert([supplierData])
        .select()
        .single();

      if (error) throw error;

      dispatch({ type: 'ADD_SUPPLIER', payload: data });
    } catch (error) {
      console.error('Error adding supplier:', error);
      throw error;
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

  const refreshData = async () => {
    await fetchAllData();
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
        refreshData,
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