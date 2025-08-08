import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { CheckCircle, XCircle, FileText, Calendar, User, CreditCard, Loader2, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase, type BudgetRequest, type Approval } from '@/lib/supabase';

export default function ApprovalPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const requestId = searchParams.get('request_id');
  const decision = searchParams.get('decision') as 'APPROVE' | 'REJECT' | null;
  
  const [request, setRequest] = useState<BudgetRequest | null>(null);
  const [note, setNote] = useState('');
  const [approverName, setApproverName] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [pendingDecision, setPendingDecision] = useState<'APPROVED' | 'REJECTED' | null>(null);

  useEffect(() => {
    console.log('ApprovalPage - URL params:', { requestId, decision });
    if (requestId) {
      fetchRequest();
    } else {
      console.log('ApprovalPage - No request_id found in URL');
      setLoading(false);
    }
  }, [requestId]);

  const fetchRequest = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('budget_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (error) throw error;
      setRequest(data);
    } catch (error) {
      console.error('Error fetching request:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถดึงข้อมูลคำขออนุมัติได้",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDecisionClick = (decision: 'APPROVED' | 'REJECTED') => {
    console.log('handleDecisionClick called:', decision);
    setPendingDecision(decision);
    setConfirmDialogOpen(true);
  };

  const isFormValid = () => {
    const decisionText = pendingDecision === 'APPROVED' ? 'อนุมัติ' : 'ไม่อนุมัติ';
    return approverName.trim() !== '' && confirmText.trim() === decisionText;
  };

  const confirmDecision = async () => {
    if (!request || !pendingDecision || !requestId || !isFormValid()) return;

    console.log('confirmDecision started:', { requestId, pendingDecision, approverName });
    setSubmitting(true);
    try {
      // 1. อัปเดตสถานะในตาราง budget_requests
      console.log('Updating budget_requests table...');
      const { data: updatedRequest, error: updateError } = await supabase
        .from('budget_requests')
        .update({ status: pendingDecision })
        .eq('id', requestId)
        .select()
        .single();

      if (updateError) {
        console.error('Update error:', updateError);
        throw updateError;
      }
      console.log('Budget request updated:', updatedRequest);

      // 2. เพิ่มประวัติการอนุมัติในตาราง approvals
      console.log('Inserting approval record...');
      const approvalData = {
        request_id: requestId, // ใช้ string ตรงๆ ไม่ต้อง parseInt
        decision: pendingDecision === 'APPROVED' ? 'APPROVE' : 'REJECT', // แปลงเป็นค่าที่ database ต้องการ
        remark: note.trim() || null, // ใช้ remark แทน note
        approver_name: approverName.trim() // ใช้ approver_name แทน approved_by
      };
      console.log('Approval data to insert:', approvalData);
      
      const { data: newApproval, error: insertError } = await supabase
        .from('approvals')
        .insert(approvalData)
        .select()
        .single();

      if (insertError) {
        console.error('Insert error details:', insertError);
        console.error('Error message:', insertError.message);
        console.error('Error code:', insertError.code);
        console.error('Error details:', insertError.details);
        console.error('Error hint:', insertError.hint);
        console.error('Full error object:', JSON.stringify(insertError, null, 2));
        console.log('Data that failed to insert:', JSON.stringify(approvalData, null, 2));
        console.log('requestId type:', typeof requestId, 'value:', requestId);
        console.log('pendingDecision type:', typeof pendingDecision, 'value:', pendingDecision);
        console.log('approverName type:', typeof approverName, 'value:', approverName);
        console.log('note type:', typeof note, 'value:', note);
        throw insertError;
      }
      console.log('Approval record inserted:', newApproval);

      // 3. แสดงข้อความสำเร็จ
      console.log('Showing success toast...');
      toast({
        title: `บันทึกการ${pendingDecision === 'APPROVED' ? 'อนุมัติ' : 'ไม่อนุมัติ'}เรียบร้อยแล้ว`,
        description: `คำขอเลขที่ ${request.request_no} ได้รับการ${pendingDecision === 'APPROVED' ? 'อนุมัติ' : 'ไม่อนุมัติ'}โดย ${approverName}`,
      });

      // 4. ปิด dialog และ redirect
      console.log('Closing dialog and redirecting...');
      setConfirmDialogOpen(false);
      setTimeout(() => {
        console.log('Navigating to home...');
        navigate('/');
      }, 2000);

    } catch (error) {
      console.error('Error saving approval:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: `เกิดข้อผิดพลาด: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
      console.log('confirmDecision completed');
    }
  };

  if (loading) {
    return (
      <Layout title="กำลังโหลด...">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </Layout>
    );
  }

  if (!request || !requestId) {
    return (
      <Layout title="ไม่พบข้อมูล">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="text-center p-8">
              <XCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">ไม่พบคำขออนุมัติ</h2>
              <p className="text-muted-foreground mb-4">
                ไม่สามารถแสดงข้อมูลคำขออนุมัติได้ กรุณาตรวจสอบลิงก์อีกครั้ง
              </p>
              <Button onClick={() => navigate('/')}>
                กลับหน้าหลัก
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  if (request.status !== 'PENDING') {
    return (
      <Layout title="คำขอได้รับการตัดสินแล้ว">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="text-center p-8">
              <Badge 
                variant={request.status === 'APPROVED' ? 'default' : 'destructive'}
                className="text-lg p-2 mb-4"
              >
                {request.status === 'APPROVED' ? 'อนุมัติแล้ว' : 'ไม่อนุมัติ'}
              </Badge>
              <h2 className="text-xl font-semibold mb-2">คำขอนี้ได้รับการตัดสินแล้ว</h2>
              <p className="text-muted-foreground mb-4">
                คำขอเลขที่ {request.request_no} ได้รับการ{request.status === 'APPROVED' ? 'อนุมัติ' : 'ไม่อนุมัติ'}แล้ว
              </p>
              <Button onClick={() => navigate('/')}>
                กลับหน้าหลัก
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="อนุมัติคำขอใช้งบประมาณ">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card className="bg-gradient-card shadow-card">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-foreground flex items-center gap-2">
              <FileText className="h-6 w-6" />
              คำขออนุมัติใช้งบประมาณ
            </CardTitle>
            <Badge variant="outline" className="w-fit">
              รอการอนุมัติ
            </Badge>
          </CardHeader>
        </Card>

        {/* Request Details with Carousel */}
        <Card>
          <CardHeader>
            <CardTitle>รายละเอียดคำขอ</CardTitle>
          </CardHeader>
          <CardContent>
            <Carousel className="w-full max-w-full">
              <CarouselContent>
                {/* Slide 1: Basic Information & Budget */}
                <CarouselItem>
                  <div className="space-y-6">
                    <div className="text-center mb-4">
                      <Badge variant="outline" className="text-sm">ข้อมูลคำขอ (1/2)</Badge>
                    </div>
                    
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-muted-foreground">เลขที่คำขอ</Label>
                        <p className="text-lg font-semibold">{request.request_no}</p>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                          <User className="h-4 w-4" />
                          ผู้ขอ
                        </Label>
                        <p className="text-lg">{request.requester}</p>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          วันที่ขอ
                        </Label>
                        <p>{new Date(request.request_date).toLocaleDateString('th-TH', {
                          year: 'numeric',
                          month: 'long', 
                          day: 'numeric'
                        })}</p>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                          <CreditCard className="h-4 w-4" />
                          รหัสบัญชี
                        </Label>
                        <p>{request.account_code} - {request.account_name}</p>
                      </div>
                    </div>

                    <Separator />

                    {/* Budget Information */}
                    <div className="text-center space-y-4">
                      <div className="space-y-2">
                        <Label className="text-lg font-semibold">จำนวนเงินที่ขอ</Label>
                        <div className="p-6 border-2 border-primary rounded-lg bg-primary/5">
                          <p className="text-4xl font-bold text-primary">
                            {request.amount.toLocaleString('th-TH')} บาท
                          </p>
                        </div>
                      </div>
                      
                      {request.note && (
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-muted-foreground">หมายเหตุจากผู้ขอ</Label>
                          <div className="bg-muted p-4 rounded-lg border-l-4 border-blue-500">
                            <p className="text-sm leading-relaxed">{request.note}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CarouselItem>

                {/* Slide 2: Material List */}
                <CarouselItem>
                  <div className="space-y-4">
                    <div className="text-center mb-4">
                      <Badge variant="outline" className="text-sm">รายการวัสดุ (2/2)</Badge>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-lg font-semibold flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        รายการวัสดุที่ขอ
                      </Label>
                      {request.material_list && request.material_list.length > 0 ? (
                        <div className="border rounded-lg overflow-hidden animate-fade-in">
                          <table className="w-full">
                            <thead className="bg-muted">
                              <tr>
                                <th className="text-left p-3 font-medium">ลำดับ</th>
                                <th className="text-left p-3 font-medium">รายการ</th>
                                <th className="text-left p-3 font-medium">จำนวน</th>
                              </tr>
                            </thead>
                            <tbody>
                              {request.material_list.map((item, index) => (
                                <tr key={index} className="border-t hover:bg-muted/50 transition-colors">
                                  <td className="p-3 font-medium text-center">{index + 1}</td>
                                  <td className="p-3">{item.item || 'ไม่ระบุ'}</td>
                                  <td className="p-3">{item.quantity || 'ไม่ระบุ'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="text-center p-8">
                          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                          <p className="text-muted-foreground">
                            ไม่มีรายการวัสดุที่ระบุ
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </CarouselItem>
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </CardContent>
        </Card>

        {/* Decision Section */}
        <Card>
          <CardHeader>
            <CardTitle>การตัดสินใจ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="note">หมายเหตุการอนุมัติ (ไม่บังคับ)</Label>
              <Textarea
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="ระบุหมายเหตุหรือเงื่อนไขการอนุมัติ (ถ้ามี)"
                rows={3}
              />
            </div>

            <div className="flex gap-4 pt-4">
              <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
                <AlertDialogTrigger asChild>
                  <Button 
                    size="lg" 
                    className="flex-1"
                    onClick={() => handleDecisionClick('APPROVED')}
                  >
                    <CheckCircle className="h-5 w-5 mr-2" />
                    อนุมัติ
                  </Button>
                </AlertDialogTrigger>
                
                <AlertDialogTrigger asChild>
                  <Button 
                    size="lg" 
                    variant="destructive" 
                    className="flex-1"
                    onClick={() => handleDecisionClick('REJECTED')}
                  >
                    <XCircle className="h-5 w-5 mr-2" />
                    ไม่อนุมัติ
                  </Button>
                </AlertDialogTrigger>

                <AlertDialogContent className="max-w-md">
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      ยืนยันการ{pendingDecision === 'APPROVED' ? 'อนุมัติ' : 'ไม่อนุมัติ'}
                    </AlertDialogTitle>
                    <AlertDialogDescription asChild>
                      <div className="space-y-4">
                        <p>คุณกำลังจะ{pendingDecision === 'APPROVED' ? 'อนุมัติ' : 'ไม่อนุมัติ'}คำขอใช้งบประมาณของ <strong>คุณ {request.requester}</strong></p>
                        <p><strong>จำนวนเงิน:</strong> {request.amount.toLocaleString('th-TH')} บาท</p>
                        
                        <div className="space-y-2">
                          <Label htmlFor="approverNameInput">ชื่อผู้อนุมัติ *</Label>
                          <Input
                            id="approverNameInput"
                            value={approverName}
                            onChange={(e) => setApproverName(e.target.value)}
                            placeholder="กรุณาระบุชื่อผู้อนุมัติ"
                            required
                          />
                        </div>

                        {note.trim() && (
                          <div className="p-3 bg-muted rounded">
                            <strong>หมายเหตุ:</strong> {note.trim()}
                          </div>
                        )}

                        <div className="space-y-2">
                          <Label htmlFor="decisionConfirmInput">
                            เพื่อยืนยัน โปรดพิมพ์คำว่า "<strong>{pendingDecision === 'APPROVED' ? 'อนุมัติ' : 'ไม่อนุมัติ'}</strong>" ในช่องด้านล่าง
                          </Label>
                          <Input
                            id="decisionConfirmInput"
                            value={confirmText}
                            onChange={(e) => setConfirmText(e.target.value)}
                            placeholder={`พิมพ์ "${pendingDecision === 'APPROVED' ? 'อนุมัติ' : 'ไม่อนุมัติ'}" เพื่อยืนยัน`}
                            autoComplete="off"
                          />
                        </div>
                        
                        <div className="text-sm text-muted-foreground">
                          การตัดสินใจนี้จะไม่สามารถเปลี่ยนแปลงได้หลังจากยืนยัน
                        </div>
                      </div>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={submitting}>
                      ยกเลิก
                    </AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={confirmDecision}
                      disabled={submitting || !isFormValid()}
                      className={pendingDecision === 'REJECTED' ? 'bg-destructive hover:bg-destructive/90' : ''}
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          กำลังบันทึก...
                        </>
                      ) : (
                        `ยืนยันการ${pendingDecision === 'APPROVED' ? 'อนุมัติ' : 'ไม่อนุมัติ'}`
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}