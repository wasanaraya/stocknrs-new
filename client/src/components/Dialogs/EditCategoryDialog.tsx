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
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase, Category } from '@/lib/supabase';

interface EditCategoryDialogProps {
  category: Category | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCategoryUpdated: () => void;
}

export function EditCategoryDialog({ category, open, onOpenChange, onCategoryUpdated }: EditCategoryDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_medicine: false
  });

  // Initialize form data when category changes
  useEffect(() => {
    if (category && open) {
      setFormData({
        name: category.name || '',
        description: category.description || '',
        is_medicine: category.is_medicine || false
      });
    }
  }, [category, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!category || !formData.name.trim()) {
      toast({
        title: "กรุณากรอกข้อมูลให้ครบถ้วน",
        description: "กรุณาระบุชื่อหมวดหมู่",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('categories')
        .update({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          is_medicine: formData.is_medicine
        })
        .eq('id', category.id);

      if (error) throw error;

      toast({
        title: "อัปเดตหมวดหมู่เรียบร้อย",
        description: `อัปเดตหมวดหมู่ ${formData.name} เรียบร้อยแล้ว`,
      });

      onOpenChange(false);
      onCategoryUpdated();

    } catch (error) {
      console.error('Error updating category:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถอัปเดตหมวดหมู่ได้",
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
          <DialogTitle>แก้ไขหมวดหมู่</DialogTitle>
          <DialogDescription>
            แก้ไขข้อมูลหมวดหมู่สินค้า
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">ชื่อหมวดหมู่ *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="ชื่อหมวดหมู่"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">คำอธิบาย</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="คำอธิบายหมวดหมู่"
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_medicine"
              checked={formData.is_medicine}
              onCheckedChange={(checked) => setFormData({...formData, is_medicine: checked as boolean})}
            />
            <Label htmlFor="is_medicine" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              หมวดหมู่ยา (ต้องการวันหมดอายุ)
            </Label>
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