import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Trash2, Send, Loader2, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase, type AccountCode, type BudgetRequest as DBBudgetRequest } from '@/lib/supabase';
import emailjs from '@emailjs/browser';

// EmailJS configuration
const EMAILJS_CONFIG = {
  PUBLIC_KEY: "MK2OUomFmzWPrHpMW",
  SERVICE_ID: "service_f2t090t",
  TEMPLATE_ID: "template_7xibgbq"
};

// Initialize EmailJS
try {
  emailjs.init(EMAILJS_CONFIG.PUBLIC_KEY);
} catch (error) {
  console.error("EmailJS initialization failed:", error);
}

interface MaterialItem {
  item: string;
  quantity: string;
}

interface BudgetRequestForm {
  requester: string;
  request_date: string;
  account_code: string;
  amount: string;
  note: string;
  material_list: MaterialItem[];
}

interface EmailPreviewData {
  approverName: string;
  approverEmail: string;
  ccEmails: string;
}

interface AddBudgetRequestDialogProps {
  onSuccess: () => void;
  editRequest?: DBBudgetRequest;
}

export function AddBudgetRequestDialog({ onSuccess, editRequest }: AddBudgetRequestDialogProps) {
  const { toast } = useToast();
  const today = new Date().toISOString().split('T')[0];
  
  const [formData, setFormData] = useState<BudgetRequestForm>({
    requester: editRequest?.requester || '',
    request_date: editRequest?.request_date || today,
    account_code: editRequest?.account_code || '',
    amount: editRequest?.amount?.toString() || '',
    note: editRequest?.note || '',
    material_list: editRequest?.material_list || [{ item: '', quantity: '' }]
  });

  const [accountCodes, setAccountCodes] = useState<AccountCode[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchAccountCodes = async () => {
      try {
        const { data, error } = await supabase
          .from('account_codes')
          .select('*')
          .order('code');
        
        if (error) throw error;
        setAccountCodes(data || []);
      } catch (err) {
        console.error('Error fetching account codes:', err);
      }
    };

    fetchAccountCodes();
  }, []);

  const addMaterialItem = () => {
    setFormData({
      ...formData,
      material_list: [...formData.material_list, { item: '', quantity: '' }]
    });
  };

  const removeMaterialItem = (index: number) => {
    const newList = formData.material_list.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      material_list: newList.length > 0 ? newList : [{ item: '', quantity: '' }]
    });
  };

  const updateMaterialItem = (index: number, field: keyof MaterialItem, value: string) => {
    const newList = [...formData.material_list];
    newList[index][field] = value;
    setFormData({
      ...formData,
      material_list: newList
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.requester || !formData.account_code || !formData.amount) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const requestData = {
        requester: formData.requester,
        request_date: formData.request_date,
        account_code: formData.account_code,
        amount: parseFloat(formData.amount),
        note: formData.note || '',
        material_list: formData.material_list.filter(item => item.item.trim() !== ''),
        status: 'PENDING' as const
      };

      let result;
      if (editRequest) {
        result = await supabase
          .from('budget_requests')
          .update(requestData)
          .eq('id', editRequest.id)
          .select();
      } else {
        result = await supabase
          .from('budget_requests')
          .insert([requestData])
          .select();
      }

      if (result.error) throw result.error;

      toast({
        title: editRequest ? 'Updated' : 'Created',
        description: `Budget request ${editRequest ? 'updated' : 'created'} successfully`
      });
      
      onSuccess();
    } catch (err) {
      console.error('Error saving budget request:', err);
      toast({
        title: 'Error',
        description: 'Failed to save budget request',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>
          {editRequest ? 'แก้ไขคำขออนุมัติ' : 'สร้างคำขออนุมัติใหม่'}
        </DialogTitle>
        <DialogDescription>
          กรอกข้อมูลคำขออนุมัติใช้งบประมาณ
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="requester">ผู้ขอ *</Label>
            <Input
              id="requester"
              value={formData.requester}
              onChange={(e) => setFormData({ ...formData, requester: e.target.value })}
              placeholder="ชื่อผู้ขอ"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="request_date">วันที่ขอ *</Label>
            <Input
              id="request_date"
              type="date"
              value={formData.request_date}
              onChange={(e) => setFormData({ ...formData, request_date: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="account_code">รหัสบัญชี *</Label>
            <Select
              value={formData.account_code}
              onValueChange={(value) => setFormData({ ...formData, account_code: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="เลือกรหัสบัญชี" />
              </SelectTrigger>
              <SelectContent>
                {accountCodes.map((account) => (
                  <SelectItem key={account.code} value={account.code}>
                    {account.code} - {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">จำนวนเงิน (บาท) *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="0.00"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="note">หมายเหตุ</Label>
          <Textarea
            id="note"
            value={formData.note}
            onChange={(e) => setFormData({ ...formData, note: e.target.value })}
            placeholder="หมายเหตุเพิ่มเติม"
            rows={3}
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              รายการวัสดุ
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addMaterialItem}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                เพิ่มรายการ
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {formData.material_list.map((item, index) => (
              <div key={index} className="flex gap-4 items-end">
                <div className="flex-1 space-y-2">
                  <Label>รายการ</Label>
                  <Input
                    value={item.item}
                    onChange={(e) => updateMaterialItem(index, 'item', e.target.value)}
                    placeholder="ชื่อรายการ"
                  />
                </div>
                <div className="w-32 space-y-2">
                  <Label>จำนวน</Label>
                  <Input
                    value={item.quantity}
                    onChange={(e) => updateMaterialItem(index, 'quantity', e.target.value)}
                    placeholder="จำนวน"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeMaterialItem(index)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="gap-2"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {editRequest ? 'บันทึกการแก้ไข' : 'สร้างคำขอ'}
          </Button>
        </div>
      </form>
    </DialogContent>
  );
}