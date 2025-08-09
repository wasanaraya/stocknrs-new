import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Filter, Package, MapPin, DollarSign, Edit, Trash2, Loader2, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase, Product, Category, Supplier } from '@/lib/supabase';
import { AddProductDialog } from '@/components/Dialogs/AddProductDialog';
import { EditProductDialog } from '@/components/Dialogs/EditProductDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface ProductWithDetails extends Product {
  category_name: string;
  supplier_name: string;
}

interface FilterState {
  searchTerm: string;
  category: string;
  supplier: string;
  stockLevel: string;
}

export default function Products() {
  const { toast } = useToast();
  const [products, setProducts] = useState<ProductWithDetails[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  
  const [filter, setFilter] = useState<FilterState>({
    searchTerm: '',
    category: '',
    supplier: '',
    stockLevel: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [productsResult, categoriesResult, suppliersResult] = await Promise.all([
        supabase
          .from('products')
          .select(`
            *,
            categories!inner (name),
            suppliers!inner (name)
          `)
          .order('name'),
        supabase.from('categories').select('*').order('name'),
        supabase.from('suppliers').select('*').order('name')
      ]);

      if (productsResult.error) throw productsResult.error;
      if (categoriesResult.error) throw categoriesResult.error;
      if (suppliersResult.error) throw suppliersResult.error;

      const productsWithDetails = productsResult.data?.map(product => ({
        ...product,
        category_name: product.categories.name,
        supplier_name: product.suppliers.name
      })) || [];

      setProducts(productsWithDetails);
      setCategories(categoriesResult.data || []);
      setSuppliers(suppliersResult.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถดึงข้อมูลได้",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStockLevel = (product: ProductWithDetails): string => {
    if (product.current_stock === 0) return 'out';
    if (product.current_stock <= product.min_stock) return 'low';
    if (product.max_stock && product.current_stock >= product.max_stock) return 'high';
    return 'medium';
  };

  const getFilteredProducts = () => {
    return products.filter(product => {
      const matchesSearch = filter.searchTerm === '' || 
        product.name.toLowerCase().includes(filter.searchTerm.toLowerCase()) ||
        product.sku.toLowerCase().includes(filter.searchTerm.toLowerCase());
      
      const matchesCategory = filter.category === '' || product.category_id === filter.category;
      const matchesSupplier = filter.supplier === '' || product.supplier_id === filter.supplier;
      
      const stockLevel = getStockLevel(product);
      const matchesStockLevel = filter.stockLevel === '' || stockLevel === filter.stockLevel;
      
      return matchesSearch && matchesCategory && matchesSupplier && matchesStockLevel;
    });
  };

  const handleSearchChange = (value: string) => {
    setFilter({ ...filter, searchTerm: value });
  };

  const handleEditProduct = (product: ProductWithDetails) => {
    setEditingProduct(product);
    setEditDialogOpen(true);
  };

  const handleDeleteProduct = async (productId: string, productName: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      toast({
        title: "ลบสินค้าเรียบร้อย",
        description: `ลบสินค้า ${productName} เรียบร้อยแล้ว`,
      });

      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถลบสินค้าได้",
        variant: "destructive",
      });
    }
  };

  const getStockBadgeVariant = (level: string) => {
    switch (level) {
      case 'out': return 'destructive';
      case 'low': return 'secondary';
      case 'medium': return 'default';
      case 'high': return 'default';
      default: return 'default';
    }
  };

  const getStockBadgeColor = (level: string) => {
    switch (level) {
      case 'out': return 'bg-red-500 text-white';
      case 'low': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-blue-500 text-white';
      case 'high': return 'bg-green-500 text-white';
      default: return 'bg-muted';
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
    }).format(value);
  };

  const filteredProducts = getFilteredProducts();

  return (
    <Layout title="สินค้า">
      <div className="w-full space-y-6 pb-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">กำลังโหลดข้อมูล...</span>
          </div>
        ) : (
          <>
        {/* Page Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white/60 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-white/30 shadow-card">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 font-kanit">จัดการสินค้า</h1>
            <p className="text-gray-600 mt-1">จัดการข้อมูลสินค้าและสต็อก</p>
          </div>
          
          <div className="w-full lg:w-auto flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
            <div className="relative flex-1 lg:max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <Input
                placeholder="ค้นหาสินค้า..."
                value={filter.searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-9 bg-white/80 backdrop-blur-sm border-white/50"
              />
            </div>
            <AddProductDialog onProductAdded={fetchData} />
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white/50 backdrop-blur-sm rounded-2xl shadow-card border border-white/30 p-4 sm:p-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">ตัวกรอง:</span>
            </div>
            
            <div className="flex flex-wrap gap-2 sm:gap-4">
              <Select value={filter.category} onValueChange={(value) => setFilter({ ...filter, category: value === 'all' ? '' : value })}>
                <SelectTrigger className="w-32 sm:w-40">
                  <SelectValue placeholder="หมวดหมู่" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">หมวดหมู่ทั้งหมด</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filter.supplier} onValueChange={(value) => setFilter({ ...filter, supplier: value === 'all' ? '' : value })}>
                <SelectTrigger className="w-32 sm:w-40">
                  <SelectValue placeholder="ผู้จำหน่าย" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ผู้จำหน่ายทั้งหมด</SelectItem>
                  {suppliers.map(supplier => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filter.stockLevel} onValueChange={(value) => setFilter({ ...filter, stockLevel: value === 'all' ? '' : value })}>
                <SelectTrigger className="w-32 sm:w-40">
                  <SelectValue placeholder="ระดับสต็อก" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทุกระดับ</SelectItem>
                  <SelectItem value="high">สต็อกสูง</SelectItem>
                  <SelectItem value="medium">สต็อกปานกลาง</SelectItem>
                  <SelectItem value="low">สต็อกต่ำ</SelectItem>
                  <SelectItem value="out">สินค้าหมด</SelectItem>
                </SelectContent>
              </Select>

              {(filter.category || filter.supplier || filter.stockLevel || filter.searchTerm) && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setFilter({ searchTerm: '', category: '', supplier: '', stockLevel: '' })}
                  className="text-xs sm:text-sm"
                >
                  ล้างตัวกรอง
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="w-full min-h-0">
          {filteredProducts.length > 0 ? (
            <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
              {filteredProducts.map(product => {
                const stockLevel = getStockLevel(product);
                
                return (
                  <Card key={product.id} className="bg-white/70 backdrop-blur-sm shadow-card hover:shadow-hover transition-all duration-300 border border-white/40 hover:border-primary/30 h-fit">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1 flex-1 min-w-0">
                          <CardTitle className="text-base sm:text-lg break-words">{product.name}</CardTitle>
                          <p className="text-xs sm:text-sm text-muted-foreground break-all">SKU: {product.sku}</p>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <Badge 
                            variant={getStockBadgeVariant(stockLevel)}
                            className={`${getStockBadgeColor(stockLevel)} text-xs`}
                          >
                            {stockLevel === 'out' ? 'หมด' : `เหลือ ${product.current_stock.toLocaleString()}`}
                          </Badge>
                          <div className="flex space-x-1">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-7 w-7 p-0"
                              onClick={() => handleEditProduct(product)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive">
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="bg-gradient-card shadow-glow border-white/10">
                                <AlertDialogHeader>
                                  <AlertDialogTitle>ยืนยันการลบ</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    คุณแน่ใจหรือไม่ที่จะลบสินค้า "{product.name}"?
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteProduct(product.id, product.name)}
                                    className="bg-destructive hover:bg-destructive/90"
                                  >
                                    ลบ
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {product.description && (
                        <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 break-words">
                          {product.description}
                        </p>
                      )}
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Package className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                            <span className="text-muted-foreground">หมวดหมู่:</span>
                          </div>
                          <p className="font-medium break-words">{product.category_name}</p>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                            <span className="text-muted-foreground">ราคา:</span>
                          </div>
                          <p className="font-medium">{formatCurrency(product.unit_price)}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                          <span className="text-xs sm:text-sm text-muted-foreground">ที่ตั้ง:</span>
                        </div>
                        <p className="text-xs sm:text-sm font-medium break-words">{product.location || 'ไม่ได้ระบุ'}</p>
                      </div>
                      
                      {/* Expiry Date for Medicine */}
                      {product.expiry_date && (
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                            <span className="text-xs sm:text-sm text-muted-foreground">วันหมดอายุ:</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <p className="text-xs sm:text-sm font-medium">
                              {new Date(product.expiry_date).toLocaleDateString('th-TH')}
                            </p>
                            {new Date(product.expiry_date) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) && (
                              <Badge variant="destructive" className="text-xs">
                                {new Date(product.expiry_date) <= new Date() ? 'หมดอายุแล้ว' : 'ใกล้หมดอายุ'}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between pt-2 border-t border-border text-xs sm:text-sm">
                        <div>
                          <span className="text-muted-foreground">ผู้จำหน่าย: </span>
                          <span className="font-medium break-words">{product.supplier_name}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">ขั้นต่ำ: </span>
                          <span className="font-medium">{product.min_stock.toLocaleString()}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="bg-gradient-card shadow-card">
              <CardContent className="p-8 sm:p-12 text-center">
                <p className="text-muted-foreground">ไม่พบสินค้าที่ตรงกับการค้นหา</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Edit Product Dialog */}
        <EditProductDialog
          product={editingProduct}
          categories={categories}
          suppliers={suppliers}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onProductUpdated={fetchData}
        />
        <AddProductDialog
          categories={categories}
          suppliers={suppliers}
          onProductAdded={fetchData}
        />
          </>
        )}
      </div>
    </Layout>
  );
}

