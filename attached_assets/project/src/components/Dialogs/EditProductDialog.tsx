import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Loader2, CalendarIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase, Product } from '@/lib/supabase';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface CategoryForProduct {
  id: string;
  name: string;
  is_medicine?: boolean;
}

interface SupplierForProduct {
  id: string;
  name: string;
}

interface EditProductDialogProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProductUpdated: () => void;
}

export function EditProductDialog({ product, open, onOpenChange, onProductUpdated }: EditProductDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<CategoryForProduct[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierForProduct[]>([]);
  const [expiryDate, setExpiryDate] = useState<Date | undefined>(undefined);
  
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    barcode: '',
    description: '',
    category_id: '',
    supplier_id: '',
    unit_price: '',
    current_stock: '',
    min_stock: '',
    max_stock: '',
    location: ''
  });
  
  const selectedCategory = categories.find(cat => cat.id === formData.category_id);

  // Initialize form data when product changes
  useEffect(() => {
    if (product && open) {
      setFormData({
        name: product.name || '',
        sku: product.sku || '',
        barcode: product.barcode || '',
        description: product.description || '',
        category_id: product.category_id || '',
        supplier_id: product.supplier_id || '',
        unit_price: product.unit_price?.toString() || '',
        current_stock: product.current_stock?.toString() || '',
        min_stock: product.min_stock?.toString() || '',
        max_stock: product.max_stock?.toString() || '',
        location: product.location || ''
      });
      
      if (product.expiry_date) {
        setExpiryDate(new Date(product.expiry_date));
      } else {
        setExpiryDate(undefined);
      }
    }
  }, [product, open]);

  const fetchCategoriesAndSuppliers = async () => {
    try {
      const [categoriesResult, suppliersResult] = await Promise.all([
        supabase.from('categories').select('id, name, is_medicine').order('name'),
        supabase.from('suppliers').select('id, name').order('name')
      ]);

      if (categoriesResult.error) throw categoriesResult.error;
      if (suppliersResult.error) throw suppliersResult.error;

      setCategories(categoriesResult.data || []);
      setSuppliers(suppliersResult.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถดึงข้อมูลหมวดหมู่และผู้จำหน่ายได้",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (open) {
      fetchCategoriesAndSuppliers();
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!product || !formData.name || !formData.category_id || !formData.supplier_id || !formData.unit_price) {
      toast({
        title: "กรุณากรอกข้อมูลให้ครบถ้วน",
        description: "กรุณาระบุชื่อสินค้า หมวดหมู่ ผู้จำหน่าย และราคา",
        variant: "destructive",
      });
      return;
    }

    // Check if medicine category requires expiry date
    if (selectedCategory?.is_medicine && !expiryDate) {
      toast({
        title: "กรุณาระบุวันหมดอายุ",
        description: "หมวดหมู่ยาต้องระบุวันหมดอายุ",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Update product
      const { error } = await supabase
        .from('products')
        .update({
          name: formData.name,
          sku: formData.sku || product.sku, // Keep original SKU if not changed
          barcode: formData.barcode || null,
          description: formData.description || null,
          category_id: formData.category_id,
          supplier_id: formData.supplier_id,
          unit_price: parseFloat(formData.unit_price),
          current_stock: parseInt(formData.current_stock) || 0,
          min_stock: parseInt(formData.min_stock) || 0,
          max_stock: formData.max_stock ? parseInt(formData.max_stock) : null,
          location: formData.location || null,
          expiry_date: expiryDate ? expiryDate.toISOString().split('T')[0] : null
        })
        .eq('id', product.id);

      if (error) throw error;

      toast({
        title: "อัปเดตสินค้าเรียบร้อย",
        description: `อัปเดตสินค้า ${formData.name} เรียบร้อยแล้ว`,
      });

      onOpenChange(false);
      onProductUpdated();

    } catch (error) {
      console.error('Error updating product:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถอัปเดตสินค้าได้",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>แก้ไขสินค้า</DialogTitle>
          <DialogDescription>
            แก้ไขข้อมูลสินค้าในระบบ
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">ชื่อสินค้า *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="ชื่อสินค้า"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sku">SKU</Label>
              <Input
                id="sku"
                value={formData.sku}
                onChange={(e) => setFormData({...formData, sku: e.target.value})}
                placeholder="SKU-0001"
                disabled // Usually don't allow SKU changes
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">รายละเอียด</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="รายละเอียดสินค้า"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">หมวดหมู่ *</Label>
              <Select value={formData.category_id} onValueChange={(value) => setFormData({...formData, category_id: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกหมวดหมู่" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplier">ผู้จำหน่าย *</Label>
              <Select value={formData.supplier_id} onValueChange={(value) => setFormData({...formData, supplier_id: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกผู้จำหน่าย" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Barcode */}
          <div className="space-y-2">
            <Label htmlFor="barcode">บาร์โค้ด</Label>
            <Input
              id="barcode"
              value={formData.barcode}
              onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
              placeholder="บาร์โค้ดสินค้า"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="unit_price">ราคาต่อหน่วย (บาท) *</Label>
              <Input
                id="unit_price"
                type="number"
                min="0"
                step="0.01"
                value={formData.unit_price}
                onChange={(e) => setFormData({...formData, unit_price: e.target.value})}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">ที่ตั้ง</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                placeholder="A1-B2-C3"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="current_stock">สต็อกปัจจุบัน</Label>
              <Input
                id="current_stock"
                type="number"
                min="0"
                value={formData.current_stock}
                onChange={(e) => setFormData({...formData, current_stock: e.target.value})}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="min_stock">สต็อกขั้นต่ำ</Label>
              <Input
                id="min_stock"
                type="number"
                min="0"
                value={formData.min_stock}
                onChange={(e) => setFormData({...formData, min_stock: e.target.value})}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_stock">สต็อกสูงสุด</Label>
              <Input
                id="max_stock"
                type="number"
                min="0"
                value={formData.max_stock}
                onChange={(e) => setFormData({...formData, max_stock: e.target.value})}
                placeholder="ไม่จำกัด"
              />
            </div>
          </div>

          {/* Expiry Date for Medicine */}
          {selectedCategory?.is_medicine && (
            <div className="space-y-2">
              <Label>วันหมดอายุ *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !expiryDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {expiryDate ? format(expiryDate, "dd/MM/yyyy") : "เลือกวันหมดอายุ"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={expiryDate}
                    onSelect={setExpiryDate}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <p className="text-xs text-muted-foreground">
                หมวดหมู่ยาต้องระบุวันหมดอายุ
              </p>
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              ยกเลิก
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  กำลังบันทึก...
                </>
              ) : (
                'บันทึกการแก้ไข'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}