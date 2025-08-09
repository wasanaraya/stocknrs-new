import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { supabase, type Category } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface AddCategoryDialogProps {
  onCategoryAdded?: () => void;
}

interface CategoryFormData {
  name: string;
  description: string;
  is_medicine: boolean;
}

export function AddCategoryDialog({ onCategoryAdded }: AddCategoryDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const { toast } = useToast();
  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<CategoryFormData>({
    defaultValues: {
      name: '',
      description: '',
      is_medicine: false
    }
  });

  const onSubmit = async (data: CategoryFormData) => {
    setIsLoading(true);
    try {
      const newCategory: Omit<Category, 'id' | 'created_at'> = {
        name: data.name,
        description: data.description,
        is_medicine: data.is_medicine
      };

      const { error } = await supabase
        .from('categories')
        .insert([newCategory]);

      if (error) throw error;

      toast({
        title: "สำเร็จ",
        description: "เพิ่มหมวดหมู่สำเร็จแล้ว",
      });

      reset();
      setOpen(false);
      onCategoryAdded?.();
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถเพิ่มหมวดหมู่ได้",
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
          Add Category
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-gradient-card shadow-glow border-white/10">
        <DialogHeader>
          <DialogTitle className="text-foreground">เพิ่มหมวดหมู่ใหม่</DialogTitle>
          <DialogDescription>
            เพิ่มหมวดหมู่ใหม่สำหรับจัดกลุ่มสินค้า
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">ชื่อหมวดหมู่</Label>
            <Input
              id="name"
              {...register('name', { required: 'กรุณากรอกชื่อหมวดหมู่' })}
              placeholder="เช่น อิเล็กทรอนิกส์, เครื่องใช้ไฟฟ้า"
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">คำอธิบาย</Label>
            <Textarea
              id="description"
              {...register('description', { required: 'กรุณากรอกคำอธิบาย' })}
              placeholder="อธิบายเกี่ยวกับหมวดหมู่นี้"
              rows={3}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="is_medicine"
                checked={watch('is_medicine')}
                onCheckedChange={(checked) => setValue('is_medicine', checked as boolean)}
              />
              <Label htmlFor="is_medicine" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                หมวดหมู่ยา (ต้องระบุวันหมดอายุ)
              </Label>
            </div>
            <p className="text-xs text-muted-foreground">
              เมื่อเลือกเป็นหมวดหมู่ยา ระบบจะบังคับให้กรอกวันหมดอายุเมื่อเพิ่มสินค้า
            </p>
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