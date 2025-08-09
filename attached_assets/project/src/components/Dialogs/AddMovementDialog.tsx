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
import { Plus, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
interface ProductForMovement {
  id: string;
  name: string;
  sku: string;
  current_stock: number;
}

interface AddMovementDialogProps {
  onMovementAdded: () => void;
}

export function AddMovementDialog({ onMovementAdded }: AddMovementDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState<ProductForMovement[]>([]);
  
  const [formData, setFormData] = useState({
    product_id: '',
    type: '' as 'in' | 'out' | '',
    quantity: '',
    reason: '',
    reference: '',
    notes: ''
  });

  useEffect(() => {
    if (open) {
      fetchProducts();
    }
  }, [open]);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, sku, current_stock')
        .order('name');

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถดึงข้อมูลสินค้าได้",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.product_id || !formData.type || !formData.quantity || !formData.reason) {
      toast({
        title: "กรุณากรอกข้อมูลให้ครบถ้วน",
        description: "กรุณาระบุสินค้า ประเภท จำนวน และเหตุผล",
        variant: "destructive",
      });
      return;
    }

    const quantity = parseInt(formData.quantity);
    if (quantity <= 0) {
      toast({
        title: "จำนวนไม่ถูกต้อง",
        description: "กรุณาระบุจำนวนที่มากกว่า 0",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Get current product stock
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('current_stock')
        .eq('id', formData.product_id)
        .single();

      if (productError) throw productError;

      // Check if stock out is possible
      if (formData.type === 'out' && product.current_stock < quantity) {
        toast({
          title: "สต็อกไม่เพียงพอ",
          description: `สต็อกปัจจุบัน: ${product.current_stock} ไม่เพียงพอสำหรับการเบิก ${quantity}`,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Add movement record
      const { error: movementError } = await supabase
        .from('movements')
        .insert({
          product_id: formData.product_id,
          type: formData.type,
          quantity: quantity,
          reason: formData.reason,
          reference: formData.reference || null,
          notes: formData.notes || null
        });

      if (movementError) throw movementError;

      // Update product stock
      const newStock = formData.type === 'in' 
        ? product.current_stock + quantity
        : product.current_stock - quantity;

      const { error: updateError } = await supabase
        .from('products')
        .update({ current_stock: newStock })
        .eq('id', formData.product_id);

      if (updateError) throw updateError;

      toast({
        title: "บันทึกข้อมูลเรียบร้อย",
        description: `บันทึกการ${formData.type === 'in' ? 'รับเข้า' : 'เบิกออก'} ${quantity} หน่วยเรียบร้อยแล้ว`,
      });

      // Reset form
      setFormData({
        product_id: '',
        type: '' as 'in' | 'out' | '',
        quantity: '',
        reason: '',
        reference: '',
        notes: ''
      });
      
      setOpen(false);
      onMovementAdded();

    } catch (error) {
      console.error('Error adding movement:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถบันทึกข้อมูลได้",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-primary hover:bg-primary/90">
          <Plus className="mr-2 h-4 w-4" />
          Record Movement
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>บันทึกการเคลื่อนไหวสต็อก</DialogTitle>
          <DialogDescription>
            บันทึกการรับเข้าหรือเบิกออกสินค้าในระบบ
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="product">สินค้า *</Label>
            <Select value={formData.product_id} onValueChange={(value) => setFormData({...formData, product_id: value})}>
              <SelectTrigger>
                <SelectValue placeholder="เลือกสินค้า" />
              </SelectTrigger>
              <SelectContent>
                {products.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name} (SKU: {product.sku}) - สต็อก: {product.current_stock}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">ประเภท *</Label>
            <Select value={formData.type} onValueChange={(value) => setFormData({...formData, type: value as 'in' | 'out'})}>
              <SelectTrigger>
                <SelectValue placeholder="เลือกประเภท" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="in">รับเข้า (Stock In)</SelectItem>
                <SelectItem value="out">เบิกออก (Stock Out)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">จำนวน *</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={formData.quantity}
              onChange={(e) => setFormData({...formData, quantity: e.target.value})}
              placeholder="จำนวนที่ต้องการ"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">เหตุผล *</Label>
            <Select value={formData.reason} onValueChange={(value) => setFormData({...formData, reason: value})}>
              <SelectTrigger>
                <SelectValue placeholder="เลือกเหตุผล" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Purchase">การสั่งซื้อ</SelectItem>
                <SelectItem value="Return">การคืนสินค้า</SelectItem>
                <SelectItem value="Adjustment">การปรับปรุงสต็อก</SelectItem>
                <SelectItem value="Sale">การขาย</SelectItem>
                <SelectItem value="Damaged">สินค้าเสียหาย</SelectItem>
                <SelectItem value="Transfer">การโอนย้าย</SelectItem>
                <SelectItem value="Other">อื่นๆ</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reference">เลขที่อ้างอิง</Label>
            <Input
              id="reference"
              value={formData.reference}
              onChange={(e) => setFormData({...formData, reference: e.target.value})}
              placeholder="เลขที่ใบสั่งซื้อ/ใบส่งของ"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">หมายเหตุ</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              placeholder="หมายเหตุเพิ่มเติม"
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2">
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
                'บันทึก'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}