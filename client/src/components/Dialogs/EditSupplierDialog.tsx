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
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase, Supplier } from '@/lib/supabase';

interface EditSupplierDialogProps {
  supplier: Supplier | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSupplierUpdated: () => void;
}

export function EditSupplierDialog({ supplier, open, onOpenChange, onSupplierUpdated }: EditSupplierDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });

  // Initialize form data when supplier changes
  useEffect(() => {
    if (supplier && open) {
      setFormData({
        name: supplier.name || '',
        email: supplier.email || '',
        phone: supplier.phone || '',
        address: supplier.address || ''
      });
    }
  }, [supplier, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!supplier || !formData.name.trim() || !formData.email.trim() || !formData.phone.trim()) {
      toast({
        title: "กรุณากรอกข้อมูลให้ครบถ้วน",
        description: "กรุณาระบุชื่อ อีเมล และเบอร์โทร",
        variant: "destructive",
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: "อีเมลไม่ถูกต้อง",
        description: "กรุณาระบุอีเมลในรูปแบบที่ถูกต้อง",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('suppliers')
        .update({
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          address: formData.address.trim() || null
        })
        .eq('id', supplier.id);

      if (error) throw error;

      toast({
        title: "อัปเดตผู้จำหน่ายเรียบร้อย",
        description: `อัปเดตผู้จำหน่าย ${formData.name} เรียบร้อยแล้ว`,
      });

      onOpenChange(false);
      onSupplierUpdated();

    } catch (error) {
      console.error('Error updating supplier:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถอัปเดตผู้จำหน่ายได้",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>แก้ไขผู้จำหน่าย</DialogTitle>
          <DialogDescription>
            แก้ไขข้อมูลผู้จำหน่ายในระบบ
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">ชื่อผู้จำหน่าย *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="ชื่อผู้จำหน่าย"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">อีเมล *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              placeholder="example@company.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">เบอร์โทร *</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              placeholder="02-123-4567"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">ที่อยู่</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
              placeholder="ที่อยู่ผู้จำหน่าย"
              rows={3}
            />
          </div>

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