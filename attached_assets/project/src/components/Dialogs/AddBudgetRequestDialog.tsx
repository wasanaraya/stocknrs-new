import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout/Layout';
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
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailPreviewData, setEmailPreviewData] = useState<EmailPreviewData>({
    approverName: '',
    approverEmail: '',
    ccEmails: ''
  });
  const [currentRequestData, setCurrentRequestData] = useState<any>(null);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  useEffect(() => {
    fetchAccountCodes();
  }, []);

  const fetchAccountCodes = async () => {
    try {
      const { data, error } = await supabase
        .from('account_codes')
        .select('id, code, name')
        .order('code');

      if (error) throw error;
      setAccountCodes(data || []);
    } catch (error) {
      console.error('Error fetching account codes:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถดึงข้อมูลรหัสบัญชีได้",
        variant: "destructive",
      });
    }
  };

  const generateRequestNo = async (): Promise<string> => {
    try {
      const { data, error } = await supabase
        .from('budget_requests')
        .select('request_no')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      let nextNo = 1;
      if (data && data.length > 0) {
        const lastRequestNo = data[0].request_no;
        const match = lastRequestNo.match(/REQ-(\d+)/);
        if (match) {
          nextNo = parseInt(match[1]) + 1;
        }
      }

      return `REQ-${nextNo.toString().padStart(3, '0')}`;
    } catch (error) {
      console.error('Error generating request number:', error);
      throw error;
    }
  };

  const handleInputChange = (field: keyof BudgetRequestForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleMaterialChange = (index: number, field: keyof MaterialItem, value: string) => {
    setFormData(prev => ({
      ...prev,
      material_list: prev.material_list.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const addMaterialItem = () => {
    setFormData(prev => ({
      ...prev,
      material_list: [...prev.material_list, { item: '', quantity: '' }]
    }));
  };

  const removeMaterialItem = (index: number) => {
    if (formData.material_list.length > 1) {
      setFormData(prev => ({
        ...prev,
        material_list: prev.material_list.filter((_, i) => i !== index)
      }));
    }
  };

  const handleBudgetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.requester || !formData.account_code || !formData.amount) {
      toast({
        title: "กรุณากรอกข้อมูลให้ครบถ้วน",
        description: "ชื่อผู้ขอ รหัสบัญชี และจำนวนเงินเป็นข้อมูลที่จำเป็น",
        variant: "destructive",
      });
      return;
    }

    const selectedAccount = accountCodes.find(ac => ac.code === formData.account_code);
    const materialList = formData.material_list.filter(item => 
      item.item.trim() !== '' || item.quantity.trim() !== ''
    );
    
    const requestData = {
      requester: formData.requester,
      request_date: formData.request_date,
      account_code: formData.account_code,
      account_name: selectedAccount?.name || '',
      amount: parseFloat(formData.amount),
      note: formData.note,
      material_list: materialList,
    };
    
    setCurrentRequestData(requestData);
    openEmailPreviewModal(requestData);
  };

  const openEmailPreviewModal = (requestData: any) => {
    setCurrentRequestData(requestData);
    setIsEmailModalOpen(true);
  };

  const generateEmailPreview = () => {
    if (!currentRequestData) return "กำลังโหลดข้อมูล...";

    const itemsTable = currentRequestData.material_list && currentRequestData.material_list.length > 0 
      ? `<table style="width: 100%; border-collapse: collapse; margin: 15px 0; font-family: sans-serif; font-size: 14px; border: 1px solid #dee2e6;">
           <thead>
             <tr style="background-color: #f8f9fa;">
               <th style="border: 1px solid #dee2e6; padding: 12px; text-align: left; font-weight: 600; color: #495057;">รายการ</th>
               <th style="border: 1px solid #dee2e6; padding: 12px; text-align: left; font-weight: 600; color: #495057;">จำนวน</th>
             </tr>
           </thead>
           <tbody>
             ${currentRequestData.material_list.map((item: MaterialItem, index: number) => `
               <tr style="background-color: ${index % 2 === 0 ? '#ffffff' : '#f8f9fa'};">
                 <td style="border: 1px solid #dee2e6; padding: 12px; color: #495057;">${item.item || 'ไม่ระบุ'}</td>
                 <td style="border: 1px solid #dee2e6; padding: 12px; color: #495057;">${item.quantity || 'ไม่ระบุ'}</td>
               </tr>`).join('')}
           </tbody>
         </table>` 
      : `<div style="padding: 15px; background-color: #f8f9fa; border: 1px solid #dee2e6; border-radius: 4px; color: #6c757d; text-align: center;">
           <p style="margin: 0; font-style: italic;">(ไม่มีรายการวัสดุที่ระบุ)</p>
         </div>`;

    const emailContent = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333;">
        <p style="margin-bottom: 15px;"><strong>เรียน ผจศ. คุณ ${emailPreviewData.approverName || '(ชื่อผู้อนุมัติ)'}</strong></p>
        <p style="margin-bottom: 15px;">ด้วย คุณ <strong>${currentRequestData.requester}</strong> ได้ขอใช้งบประมาณ <strong>${currentRequestData.account_name}</strong></p>
        <p style="margin-bottom: 15px;">เป็นจำนวนเงิน <strong style="color: #007bff;">${currentRequestData.amount.toLocaleString('th-TH')} บาท</strong> เพื่อจัดหารายการตามตารางดังต่อไปนี้:</p>
        ${itemsTable}
        <p style="margin-top: 20px; margin-bottom: 15px;">จึงเรียนมาเพื่อโปรดพิจารณาอนุมัติ</p>
        ${currentRequestData.note ? `<p style="margin-top: 15px; padding: 10px; background-color: #fff3cd; border-left: 4px solid #ffc107;"><strong>หมายเหตุ:</strong> ${currentRequestData.note}</p>` : ''}
      </div>
    `;

    return emailContent;
  };

  const sendBudgetRequest = async () => {
    if (!emailPreviewData.approverName || !emailPreviewData.approverEmail) {
      toast({
        title: "กรุณากรอกข้อมูลให้ครบถ้วน",
        description: "ชื่อและอีเมลผู้อนุมัติเป็นข้อมูลที่จำเป็น",
        variant: "destructive",
      });
      return;
    }

    setIsSendingEmail(true);
    
    toast({
      title: "กำลังส่งคำขอ...",
      description: "กำลังบันทึกข้อมูลและส่งอีเมล",
    });
    
    try {
      const requestNo = editRequest ? editRequest.request_no : await generateRequestNo();
      let requestId = ''; // ประกาศตัวแปรเพื่อเก็บ ID
      
      if (editRequest) {
        // Update existing request
        const { error: saveError } = await supabase
          .from('budget_requests')
          .update({
            requester: currentRequestData.requester,
            request_date: currentRequestData.request_date,
            account_code: currentRequestData.account_code,
            account_name: currentRequestData.account_name,
            amount: currentRequestData.amount,
            note: currentRequestData.note,
            material_list: currentRequestData.material_list,
          })
          .eq('id', editRequest.id);

        if (saveError) throw saveError;
        requestId = editRequest.id.toString(); // ใช้ ID เดิม
      } else {
        // Create new request
        const { data: savedRequest, error: saveError } = await supabase
          .from('budget_requests')
          .insert({
            request_no: requestNo,
            requester: currentRequestData.requester,
            request_date: currentRequestData.request_date,
            account_code: currentRequestData.account_code,
            account_name: currentRequestData.account_name,
            amount: currentRequestData.amount,
            note: currentRequestData.note,
            material_list: currentRequestData.material_list,
            status: 'PENDING'
          })
          .select()
          .single();

        if (saveError) throw saveError;
        
        // เก็บ ID ที่ได้จากการสร้างใหม่
        requestId = savedRequest.id;
      }

      try {
        // ใช้ ID ที่ถูกต้อง
        await sendEmailJS(currentRequestData, emailPreviewData.approverName, emailPreviewData.approverEmail, 
          emailPreviewData.ccEmails.split(',').map(e => e.trim()).filter(e => e), requestId);
        
        setIsEmailModalOpen(false);
        toast({
          title: `${editRequest ? 'แก้ไข' : 'ส่ง'}คำขออนุมัติเรียบร้อย ✅`,
          description: `เลขที่รายการ: ${requestNo} - บันทึกและส่งอีเมลเรียบร้อยแล้ว`,
        });
      } catch (emailError) {
        console.error("EmailJS error:", emailError);
        
        setIsEmailModalOpen(false);
        toast({
          title: `${editRequest ? 'แก้ไข' : 'บันทึก'}คำขอเรียบร้อย ⚠️`,
          description: `เลขที่รายการ: ${requestNo} - บันทึกแล้ว แต่ไม่สามารถส่งอีเมลได้`,
          variant: "destructive",
        });
      }

      // Reset form
      if (!editRequest) {
        setFormData({
          requester: '',
          request_date: today,
          account_code: '',
          amount: '',
          note: '',
          material_list: [{ item: '', quantity: '' }]
        });
      }

      setEmailPreviewData({
        approverName: '',
        approverEmail: '',
        ccEmails: ''
      });

      onSuccess();

    } catch (error) {
      console.error('Error saving budget request:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: `ไม่สามารถบันทึกคำขออนุมัติได้: ${error}`,
        variant: "destructive",
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  const sendEmailJS = async (requestData: any, approverName: string, approverEmail: string, ccEmails: string[], requestId: string) => {
    if (!EMAILJS_CONFIG.SERVICE_ID || !EMAILJS_CONFIG.TEMPLATE_ID || !EMAILJS_CONFIG.PUBLIC_KEY) {
      throw new Error("EmailJS configuration is incomplete.");
    }
    
    const appBaseUrl = window.location.origin;
    const approveUrl = `${appBaseUrl}/approval?request_id=${requestId}&decision=APPROVE`;
    const rejectUrl = `${appBaseUrl}/approval?request_id=${requestId}&decision=REJECT`;

    const itemsTable = requestData.material_list.length > 0 
      ? `<table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
           <thead style="background-color: #f8f9fa;">
             <tr>
               <th style="border: 1px solid #dee2e6; padding: 12px; text-align: left;">รายการ</th>
               <th style="border: 1px solid #dee2e6; padding: 12px; text-align: left;">จำนวน</th>
             </tr>
           </thead>
           <tbody>
             ${requestData.material_list.map((i: MaterialItem, index: number) => `
               <tr style="background-color: ${index % 2 === 0 ? '#ffffff' : '#f8f9fa'};">
                 <td style="border: 1px solid #dee2e6; padding: 12px;">${i.item}</td>
                 <td style="border: 1px solid #dee2e6; padding: 12px;">${i.quantity}</td>
               </tr>`).join('')}
           </tbody>
         </table>` 
      : '<p>(ไม่มีรายการวัสดุที่ระบุ)</p>';

    const templateParams = {
      requester: requestData.requester,
      approver_name: approverName,
      approver_email: approverEmail,
      cc_emails: ccEmails.join(','),
      account_name: requestData.account_name,
      amount: requestData.amount.toLocaleString('th-TH'),
      items_table: itemsTable,
      note: requestData.note || '-',
      approve_url: approveUrl,
      reject_url: rejectUrl,
    };

    try {
      const response = await emailjs.send(EMAILJS_CONFIG.SERVICE_ID, EMAILJS_CONFIG.TEMPLATE_ID, templateParams);
      return response;
    } catch (err) {
      console.error("EmailJS send error details:", err);
      
      if (err.status === 404) {
        throw new Error(`EmailJS 404 Error: Service ID หรือ Template ID ไม่ถูกต้อง`);
      }
      
      throw new Error(`EmailJS Error: ${err.text || err.message || 'Unknown error'}`);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleBudgetSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="requester">ชื่อผู้ขอ *</Label>
            <Input
              id="requester"
              value={formData.requester}
              onChange={(e) => handleInputChange('requester', e.target.value)}
              placeholder="กรอกชื่อผู้ขอ"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="request_date">วันที่ *</Label>
            <Input
              id="request_date"
              type="date"
              value={formData.request_date}
              onChange={(e) => handleInputChange('request_date', e.target.value)}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="account_code">รหัสบัญชี *</Label>
            <Select
              value={formData.account_code}
              onValueChange={(value) => handleInputChange('account_code', value)}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="เลือกรหัสบัญชี" />
              </SelectTrigger>
              <SelectContent>
                {accountCodes.map((account) => (
                  <SelectItem key={account.id} value={account.code}>
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
              min="0"
              value={formData.amount}
              onChange={(e) => handleInputChange('amount', e.target.value)}
              placeholder="0.00"
              required
            />
          </div>
        </div>

        {/* Material List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-lg font-semibold">รายการวัสดุ</Label>
            <Button type="button" variant="outline" size="sm" onClick={addMaterialItem}>
              <Plus className="h-4 w-4 mr-2" />
              เพิ่มรายการ
            </Button>
          </div>
          
          <div className="space-y-3">
            {formData.material_list.map((item, index) => (
              <div key={index} className="flex gap-3 items-end">
                <div className="flex-1">
                  <Label htmlFor={`item-${index}`}>รายการ</Label>
                  <Input
                    id={`item-${index}`}
                    value={item.item}
                    onChange={(e) => handleMaterialChange(index, 'item', e.target.value)}
                    placeholder="ระบุรายการวัสดุ"
                  />
                </div>
                <div className="w-32">
                  <Label htmlFor={`quantity-${index}`}>จำนวน</Label>
                  <Input
                    id={`quantity-${index}`}
                    value={item.quantity}
                    onChange={(e) => handleMaterialChange(index, 'quantity', e.target.value)}
                    placeholder="จำนวน"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeMaterialItem(index)}
                  disabled={formData.material_list.length === 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Note */}
        <div className="space-y-2">
          <Label htmlFor="note">หมายเหตุ</Label>
          <Textarea
            id="note"
            value={formData.note}
            onChange={(e) => handleInputChange('note', e.target.value)}
            placeholder="ระบุหมายเหตุเพิ่มเติม (ไม่บังคับ)"
            rows={3}
          />
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button type="submit" size="lg" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                กำลังดำเนินการ...
              </>
            ) : (
              <>
                <Send className="h-5 w-5 mr-2" />
                {editRequest ? 'บันทึกการแก้ไข' : 'ส่งคำขออนุมัติ'}
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Email Preview Modal */}
      <Dialog open={isEmailModalOpen} onOpenChange={setIsEmailModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              ตัวอย่างอีเมลที่จะส่งไปยังผู้อนุมัติ
            </DialogTitle>
            <DialogDescription>
              ตรวจสอบเนื้อหาอีเมลก่อนส่งไปยังผู้อนุมัติ
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Email Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">ข้อมูลผู้อนุมัติ</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="approver_name">ชื่อผู้อนุมัติ *</Label>
                    <Input
                      id="approver_name"
                      value={emailPreviewData.approverName}
                      onChange={(e) => setEmailPreviewData(prev => ({ ...prev, approverName: e.target.value }))}
                      placeholder="ชื่อผู้อนุมัติ"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="approver_email">อีเมลผู้อนุมัติ *</Label>
                    <Input
                      id="approver_email"
                      type="email"
                      value={emailPreviewData.approverEmail}
                      onChange={(e) => setEmailPreviewData(prev => ({ ...prev, approverEmail: e.target.value }))}
                      placeholder="email@example.com"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cc_emails">CC (ไม่บังคับ)</Label>
                  <Input
                    id="cc_emails"
                    value={emailPreviewData.ccEmails}
                    onChange={(e) => setEmailPreviewData(prev => ({ ...prev, ccEmails: e.target.value }))}
                    placeholder="email1@example.com, email2@example.com"
                  />
                  <p className="text-sm text-muted-foreground">
                    คั่นด้วยเครื่องหมายจุลภาค (,) หากมีหลายอีเมล
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Email Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">ตัวอย่างอีเมล</CardTitle>
              </CardHeader>
              <CardContent>
                <div 
                  className="border rounded-lg p-4 bg-muted/30 min-h-[200px]"
                  dangerouslySetInnerHTML={{ __html: generateEmailPreview() }}
                />
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setIsEmailModalOpen(false)}
                disabled={isSendingEmail}
              >
                ยกเลิก
              </Button>
              <Button onClick={sendBudgetRequest} disabled={isSendingEmail}>
                {isSendingEmail ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    กำลังส่ง...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    ส่งอีเมลและบันทึก
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}