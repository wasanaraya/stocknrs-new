import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { supabase, type Supplier } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface AddSupplierDialogProps {
  onSupplierAdded?: () => void;
}

interface SupplierFormData {
  name: string;
  email: string;
  phone: string;
  address: string;
}

export function AddSupplierDialog({ onSupplierAdded }: AddSupplierDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const { toast } = useToast();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<SupplierFormData>();

  const onSubmit = async (data: SupplierFormData) => {
    setIsLoading(true);
    try {
      const newSupplier: Omit<Supplier, 'id' | 'created_at'> = {
        name: data.name,
        email: data.email,
        phone: data.phone,
        address: data.address
      };

      const { error } = await supabase
        .from('suppliers')
        .insert([newSupplier]);

      if (error) throw error;

      toast({
        title: "สำเร็จ",
        description: "เพิ่มผู้จัดหาสำเร็จแล้ว",
      });

      reset();
      setOpen(false);
      onSupplierAdded?.();
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถเพิ่มผู้จัดหาได้",
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
          Add Supplier
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-gradient-card shadow-glow border-white/10">
        <DialogHeader>
          <DialogTitle className="text-foreground">เพิ่มผู้จัดหาใหม่</DialogTitle>
          <DialogDescription>
            เพิ่มผู้จัดหาหรือซัพพลายเออร์ใหม่ในระบบ
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">ชื่อผู้จัดหา</Label>
            <Input
              id="name"
              {...register('name', { required: 'กรุณากรอกชื่อผู้จัดหา' })}
              placeholder="ชื่อบริษัทหรือผู้จัดหา"
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">อีเมล</Label>
            <Input
              id="email"
              type="email"
              {...register('email', { 
                required: 'กรุณากรอกอีเมล',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'รูปแบบอีเมลไม่ถูกต้อง'
                }
              })}
              placeholder="email@example.com"
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">เบอร์โทรศัพท์</Label>
            <Input
              id="phone"
              {...register('phone', { required: 'กรุณากรอกเบอร์โทรศัพท์' })}
              placeholder="0xx-xxx-xxxx"
            />
            {errors.phone && (
              <p className="text-sm text-destructive">{errors.phone.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">ที่อยู่</Label>
            <Textarea
              id="address"
              {...register('address', { required: 'กรุณากรอกที่อยู่' })}
              placeholder="ที่อยู่ของผู้จัดหา"
              rows={3}
            />
            {errors.address && (
              <p className="text-sm text-destructive">{errors.address.message}</p>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              ยกเลิก
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading}
              className="bg-gradient-primary hover:bg-primary/90"
            >
              {isLoading ? 'กำลังบันทึก...' : 'บันทึก'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}