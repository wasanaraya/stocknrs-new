import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Plus, Loader2, CalendarIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
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

interface AddProductDialogProps {
  onProductAdded: () => void;
}

export function AddProductDialog({ onProductAdded }: AddProductDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
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
  
  // Barcode scanner detection
  const scannerInputRef = React.useRef<string>('');
  const scannerTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

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

  const generateSKU = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('sku')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      let nextNum = 1;
      if (data && data.length > 0) {
        const lastSKU = data[0].sku;
        const match = lastSKU.match(/SKU-(\d+)/);
        if (match) {
          nextNum = parseInt(match[1]) + 1;
        }
      }

      return `SKU-${nextNum.toString().padStart(4, '0')}`;
    } catch (error) {
      console.error('Error generating SKU:', error);
      return `SKU-${Date.now()}`;
    }
  };

  // Check if barcode exists
  const checkBarcodeExists = async (barcode: string) => {
    if (!barcode) return false;
    
    const { data, error } = await supabase
      .from('products')
      .select('id')
      .eq('sku', barcode)
      .single();
      
    return !error && data;
  };

  // Barcode scanner detection
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!open) return; // Only when dialog is open
      
      const isEnter = event.key === 'Enter';
      const isValidChar = /^[a-zA-Z0-9]$/.test(event.key);
      
      if (isValidChar || isEnter) {
        // Clear existing timeout
        if (scannerTimeoutRef.current) {
          clearTimeout(scannerTimeoutRef.current);
        }

        if (isEnter) {
          // Process the accumulated input
          if (scannerInputRef.current.length > 3) { // Typical barcode length
            const scannedBarcode = scannerInputRef.current;
            setFormData(prev => ({ ...prev, barcode: scannedBarcode }));
            
            toast({
              title: "สแกนบาร์โค้ดสำเร็จ",
              description: `บาร์โค้ด: ${scannedBarcode}`,
            });
          }
          
          // Reset the input buffer
          scannerInputRef.current = '';
        } else {
          // Accumulate characters
          scannerInputRef.current += event.key;
          
          // Set timeout to reset buffer if typing is too slow
          scannerTimeoutRef.current = setTimeout(() => {
            scannerInputRef.current = '';
          }, 100);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (scannerTimeoutRef.current) {
        clearTimeout(scannerTimeoutRef.current);
      }
    };
  }, [open, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.category_id || !formData.supplier_id || !formData.unit_price) {
      toast({
        title: "กรุณากรอกข้อมูลให้ครบถ้วน",
        description: "กรุณาระบุชื่อสินค้า หมวดหมู่ ผู้จำหน่าย และราคา",
        variant: "destructive",
      });
      return;
    }

    // Check if barcode already exists
    if (formData.barcode) {
      const barcodeExists = await checkBarcodeExists(formData.barcode);
      if (barcodeExists) {
        toast({
          title: "บาร์โค้ดซ้ำ",
          description: "บาร์โค้ดนี้มีอยู่ในระบบแล้ว กรุณาใช้บาร์โค้ดอื่น",
          variant: "destructive",
        });
        return;
      }
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
      // Use barcode as SKU if SKU is empty but barcode is provided
      let sku = formData.sku;
      if (!sku && formData.barcode) {
        sku = formData.barcode;
      }
      
      // Generate SKU if both are empty
      if (!sku) {
        sku = await generateSKU();
      }

      // Check if SKU already exists
      const { data: existingSKU, error: skuError } = await supabase
        .from('products')
        .select('id')
        .eq('sku', sku)
        .single();

      if (skuError && skuError.code !== 'PGRST116') throw skuError;
      
      if (existingSKU) {
        toast({
          title: "SKU ซ้ำ",
          description: "SKU นี้มีอยู่ในระบบแล้ว กรุณาระบุ SKU อื่น",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Insert new product
      const { error } = await supabase
        .from('products')
        .insert({
          name: formData.name,
          sku: sku,
          description: formData.description || null,
          category_id: formData.category_id,
          supplier_id: formData.supplier_id,
          unit_price: parseFloat(formData.unit_price),
          current_stock: parseInt(formData.current_stock) || 0,
          min_stock: parseInt(formData.min_stock) || 0,
          max_stock: formData.max_stock ? parseInt(formData.max_stock) : null,
          location: formData.location || null,
          expiry_date: expiryDate ? expiryDate.toISOString().split('T')[0] : null
        });

      if (error) throw error;

      toast({
        title: "เพิ่มสินค้าเรียบร้อย",
        description: `เพิ่มสินค้า ${formData.name} (${sku}) เรียบร้อยแล้ว`,
      });

      // Reset form
      setFormData({
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
      
      setOpen(false);
      onProductAdded();

    } catch (error) {
      console.error('Error adding product:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถเพิ่มสินค้าได้",
        variant: "destructive",
      });
      
      setExpiryDate(undefined);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-primary hover:opacity-90 shadow-hover">
          <Plus className="h-4 w-4 mr-2" />
          เพิ่มสินค้าใหม่
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>เพิ่มสินค้าใหม่</DialogTitle>
          <DialogDescription>
            กรอกข้อมูลสินค้าให้ครบถ้วน สามารถใช้เครื่องอ่านบาร์โค้ดได้
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
              <Label htmlFor="sku">SKU (ไม่ระบุจะสร้างอัตโนมัติ)</Label>
              <Input
                id="sku"
                value={formData.sku}
                onChange={(e) => setFormData({...formData, sku: e.target.value})}
                placeholder="SKU-0001"
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
                placeholder="สแกนหรือป้อนบาร์โค้ด"
              />
              <p className="text-xs text-muted-foreground">
                รองรับเครื่องอ่านบาร์โค้ด หรือป้อนด้วยตนเอง (ถ้าไม่ระบุ SKU จะใช้บาร์โค้ดเป็น SKU)
              </p>
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
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
              <p className="text-xs text-muted-foreground">
                หมวดหมู่ยาต้องระบุวันหมดอายุ
              </p>
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              ยกเลิก
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  กำลังบันทึก...
                </>
              ) : (
                'เพิ่มสินค้า'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}