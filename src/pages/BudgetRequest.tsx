import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Eye, Edit, Trash2, MoreHorizontal, Printer, Calendar, User, CreditCard, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase, type BudgetRequest as DBBudgetRequest, type Approval } from '@/lib/supabase';

// Type for partial approval data we actually use
type ApprovalInfo = {
  approver_name: string;
  created_at: string;
  remark?: string;
};
import { AddBudgetRequestDialog } from '@/components/Dialogs/AddBudgetRequestDialog';

export default function BudgetRequest() {
  const { toast } = useToast();
  const [requests, setRequests] = useState<DBBudgetRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<DBBudgetRequest | null>(null);
  const [approvalData, setApprovalData] = useState<ApprovalInfo | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [requestToDelete, setRequestToDelete] = useState<DBBudgetRequest | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  useEffect(() => {
    const fetchApprovalData = async () => {
      if (selectedRequest && selectedRequest.status !== 'PENDING') {
        try {
          const { data: approval, error } = await supabase
            .from('approvals')
            .select('approver_name, created_at, remark')
            .eq('request_id', selectedRequest.id)
            .single();
          if (!error) setApprovalData(approval);
          else setApprovalData(null);
        } catch (err) {
          console.error('Error fetching approval data:', err);
          setApprovalData(null);
        }
      } else {
        setApprovalData(null);
      }
    };
    fetchApprovalData();
  }, [selectedRequest]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('budget_requests')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setRequests(data || []);
    } catch (err) {
      console.error('Error fetching requests:', err);
      toast({ title: 'Error', description: 'Failed to load requests', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Handle delete action
  const handleDelete = async () => {
    if (!requestToDelete) return;
    try {
      const { error } = await supabase
        .from('budget_requests')
        .delete()
        .eq('id', requestToDelete.id);
      if (error) throw error;
      toast({ title: 'Deleted', description: `Deleted request ${requestToDelete.request_no}` });
      setDeleteDialogOpen(false);
      setRequestToDelete(null);
      // Refresh list
      fetchRequests();
    } catch (err) {
      console.error('Error deleting request:', err);
      toast({ title: 'Error', description: 'Failed to delete', variant: 'destructive' });
    }
  };

  const handlePrint = async (request: DBBudgetRequest) => {
    let approvalInfo: ApprovalInfo | null = null;
    if (request.status !== 'PENDING') {
      try {
        const { data } = await supabase
          .from('approvals')
          .select('approver_name, created_at, remark')
          .eq('request_id', request.id)
          .single();
        approvalInfo = data;
      } catch (err) {
        console.error('Error fetching approval data for print:', err);
      }
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const itemsTable = request.material_list?.length
      ? `<table style="width:100%;border-collapse:collapse;margin:20px 0;"><thead><tr><th>รายการ</th><th>จำนวน</th></tr></thead><tbody>${request.material_list
          .map(
            (item, idx) => `<tr><td>${item.item}</td><td>${item.quantity}</td></tr>`
          )
          .join('')}</tbody></table>`
      : `<p style="text-align:center;color:#666;">ไม่มีรายการวัสดุ</p>`;

    const printContent = `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <title>พิมพ์คำขอ ${request.request_no}</title>
  <style>
    body { font-family: 'Sarabun', sans-serif; margin:20px; }
    .header { text-align:center; margin-bottom:30px; }
    .info-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin:20px 0; }
    table { width:100%; border-collapse:collapse; margin:20px 0; }
    th, td { border:1px solid #ccc; padding:8px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>คำขออนุมัติใช้งบประมาณ</h1>
    <p>เลขที่คำขอ: ${request.request_no}</p>
  </div>
  <div class="info-grid">
    <div><strong>ผู้ขอ:</strong> ${request.requester}</div>
    <div><strong>วันที่ขอ:</strong> ${new Date(request.request_date).toLocaleDateString('th-TH')}</div>
  </div>
  <div class="info-grid">
    <div><strong>จำนวนเงิน:</strong> ${request.amount.toLocaleString('th-TH')} บาท</div>
    <div><strong>สถานะ:</strong> ${request.status === 'PENDING' ? 'รอการอนุมัติ' : request.status === 'APPROVED' ? 'อนุมัติแล้ว' : 'ไม่อนุมัติ'}</div>
  </div>
  ${approvalInfo ? `
  <div class="approval-section" style="margin:20px 0;padding:10px;border:1px solid #007bff;">
    <h2>ข้อมูลการอนุมัติ</h2>
    <p><strong>ผู้อนุมัติ:</strong> ${approvalInfo.approver_name}</p>
    <p><strong>วันที่อนุมัติ:</strong> ${new Date(approvalInfo.created_at).toLocaleString('th-TH')}</p>
    ${approvalInfo.remark ? `<p><strong>หมายเหตุ:</strong> ${approvalInfo.remark}</p>` : ''}
  </div>
  ` : ''}
  <h3>รายการวัสดุ</h3>
  ${itemsTable}
  <div style="margin-top:30px;text-align:center;color:#666;">
    <p>พิมพ์เมื่อ: ${new Date().toLocaleString('th-TH')}</p>
  </div>
</body>
</html>`;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">รอการอนุมัติ</Badge>;
      case 'APPROVED':
        return <Badge variant="default" className="bg-green-50 text-green-700 border-green-200">อนุมัติแล้ว</Badge>;
      case 'REJECTED':
        return <Badge variant="destructive">ไม่อนุมัติ</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const canEdit = (request: DBBudgetRequest) => {
    return request.status === 'PENDING';
  };

  if (loading) {
    return (
      <Layout title="คำขออนุมัติใช้งบประมาณ">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>กำลังโหลดข้อมูล...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="คำขออนุมัติใช้งบประมาณ">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">คำขออนุมัติใช้งบประมาณ</h1>
            <p className="text-muted-foreground">จัดการคำขออนุมัติใช้งบประมาณทั้งหมด</p>
          </div>
          <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="gap-2">
                <Plus className="h-5 w-5" />
                เพิ่มคำขอใหม่
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>เพิ่มคำขออนุมัติใช้งบประมาณ</DialogTitle>
              </DialogHeader>
              <AddBudgetRequestDialog 
                onSuccess={() => {
                  setEditDialogOpen(false);
                  fetchRequests();
                }}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Requests List */}
        <div className="grid gap-4">
          {requests.length === 0 ? (
            <Card>
              <CardContent className="text-center p-8">
                <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">ยังไม่มีคำขออนุมัติ</h3>
                <p className="text-muted-foreground mb-4">
                  เริ่มต้นโดยการสร้างคำขออนุมัติใช้งบประมาณใหม่
                </p>
                <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      เพิ่มคำขอใหม่
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>เพิ่มคำขออนุมัติใช้งบประมาณ</DialogTitle>
                    </DialogHeader>
                    <AddBudgetRequestDialog 
                      onSuccess={() => {
                        setEditDialogOpen(false);
                        fetchRequests();
                      }}
                    />
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          ) : (
            requests.map((request) => (
              <Card key={request.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-3">
                        <h3 className="text-lg font-semibold">{request.request_no}</h3>
                        {getStatusBadge(request.status)}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">ผู้ขอ:</span>
                          <span className="font-medium">{request.requester}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">วันที่:</span>
                          <span>{new Date(request.request_date).toLocaleDateString('th-TH')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">จำนวน:</span>
                          <span className="font-semibold text-primary">
                            {request.amount.toLocaleString('th-TH')} บาท
                          </span>
                        </div>
                      </div>

                      <div className="mt-2 text-sm text-muted-foreground">
                        <span>บัญชี: {request.account_code} - {request.account_name}</span>
                      </div>
                    </div>

                     <div className="flex items-center gap-2">
                       <Button
                         variant="outline"
                         size="sm"
                         onClick={() => {
                           setSelectedRequest(request);
                           setDetailDialogOpen(true);
                         }}
                       >
                        <Eye className="h-4 w-4" />
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handlePrint(request)}
                          >
                            <Printer className="h-4 w-4 mr-2" />
                            พิมพ์
                          </DropdownMenuItem>
                          {canEdit(request) && (
                            <>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedRequest(request);
                                  setEditDialogOpen(true);
                                }}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                แก้ไข
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => {
                                  setRequestToDelete(request);
                                  setDeleteDialogOpen(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                ลบ
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Detail Dialog */}
        <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle>รายละเอียดคำขออนุมัติ</DialogTitle>
                {selectedRequest && (
                  <Button 
                    onClick={() => handlePrint(selectedRequest)}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    <Printer className="h-4 w-4" />
                    พิมพ์
                  </Button>
                )}
              </div>
            </DialogHeader>
            {selectedRequest && (
              <div className="space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="space-y-2">
                     <span className="text-sm font-medium text-muted-foreground">เลขที่คำขอ</span>
                     <p className="text-lg font-semibold">{selectedRequest.request_no}</p>
                   </div>
                   <div className="space-y-2">
                     <span className="text-sm font-medium text-muted-foreground">สถานะ</span>
                     <div>{getStatusBadge(selectedRequest.status)}</div>
                   </div>
                   <div className="space-y-2">
                     <span className="text-sm font-medium text-muted-foreground">ผู้ขอ</span>
                     <p>{selectedRequest.requester}</p>
                   </div>
                   <div className="space-y-2">
                     <span className="text-sm font-medium text-muted-foreground">วันที่ขอ</span>
                     <p>{new Date(selectedRequest.request_date).toLocaleDateString('th-TH')}</p>
                   </div>
                   <div className="space-y-2">
                     <span className="text-sm font-medium text-muted-foreground">รหัสบัญชี</span>
                     <p>{selectedRequest.account_code} - {selectedRequest.account_name}</p>
                   </div>
                   <div className="space-y-2">
                     <span className="text-sm font-medium text-muted-foreground">จำนวนเงิน</span>
                     <p className="text-2xl font-bold text-primary">
                       {selectedRequest.amount.toLocaleString('th-TH')} บาท
                     </p>
                   </div>
                   {approvalData && (
                     <>
                       <div className="space-y-2">
                         <span className="text-sm font-medium text-muted-foreground">ผู้อนุมัติ</span>
                         <p className="font-medium">{approvalData.approver_name}</p>
                       </div>
                       <div className="space-y-2">
                         <span className="text-sm font-medium text-muted-foreground">วันที่อนุมัติ</span>
                         <p>{new Date(approvalData.created_at).toLocaleDateString('th-TH', { 
                           year: 'numeric', 
                           month: 'long', 
                           day: 'numeric',
                           hour: '2-digit',
                           minute: '2-digit'
                         })}</p>
                       </div>
                     </>
                   )}
                 </div>

                 {approvalData?.remark && (
                   <div className="space-y-2">
                     <span className="text-sm font-medium text-muted-foreground">หมายเหตุจากผู้อนุมัติ</span>
                     <p className="bg-muted p-3 rounded-lg border-l-4 border-primary">{approvalData.remark}</p>
                   </div>
                 )}

                {selectedRequest.note && (
                  <div className="space-y-2">
                    <span className="text-sm font-medium text-muted-foreground">หมายเหตุ</span>
                    <p className="bg-muted p-3 rounded-lg">{selectedRequest.note}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <span className="text-sm font-medium text-muted-foreground">รายการวัสดุ</span>
                  {selectedRequest.material_list && selectedRequest.material_list.length > 0 ? (
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-muted">
                          <tr>
                            <th className="text-left p-3 font-medium">รายการ</th>
                            <th className="text-left p-3 font-medium">จำนวน</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedRequest.material_list.map((item, index) => (
                            <tr key={index} className="border-t">
                              <td className="p-3">{item.item || 'ไม่ระบุ'}</td>
                              <td className="p-3">{item.quantity || 'ไม่ระบุ'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-muted-foreground bg-muted p-3 rounded-lg text-center">
                      ไม่มีรายการวัสดุที่ระบุ
                    </p>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>ยืนยันการลบ</AlertDialogTitle>
              <AlertDialogDescription>
                คุณต้องการลบคำขอเลขที่ {requestToDelete?.request_no} หรือไม่?
                การดำเนินการนี้ไม่สามารถย้อนกลับได้
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDelete}
                className="bg-destructive hover:bg-destructive/90"
              >
                ลบ
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
}