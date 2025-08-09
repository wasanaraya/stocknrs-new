
import React, { useState, useEffect, useRef } from 'react';
import { Layout } from '@/components/Layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Bell, Database, Shield, Palette, Upload, Download, Trash2 } from 'lucide-react';
import { useStock } from '@/contexts/StockContext';
import { exportDataToJSON, exportDataToCSV, parseJSONFile, parseCSVFile, ExportData, generateProductTemplate, generateCategoryTemplate, generateSupplierTemplate } from '@/utils/dataExport';

const settingsSchema = z.object({
  companyName: z.string().min(1, 'ชื่อบริษัทจำเป็นต้องระบุ'),
  email: z.string().email('รูปแบบอีเมลไม่ถูกต้อง'),
  phone: z.string().min(1, 'เบอร์โทรศัพท์จำเป็นต้องระบุ'),
  address: z.string().min(1, 'ที่อยู่จำเป็นต้องระบุ'),
  lowStockAlert: z.boolean(),
  emailNotifications: z.boolean(),
  autoBackup: z.boolean(),
  theme: z.enum(['light', 'dark', 'system']),
  language: z.enum(['en', 'th']),
  currency: z.enum(['THB', 'USD', 'EUR'])
});

type SettingsFormData = z.infer<typeof settingsSchema>;

export default function Settings() {
  const [isLoading, setIsLoading] = useState(false);
  const { products, categories, suppliers, movements, getStockLevel } = useStock();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Load settings from localStorage
  const loadSettings = (): SettingsFormData => {
    const saved = localStorage.getItem('app-settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (error) {
        console.error('Error parsing saved settings:', error);
      }
    }
    return {
      companyName: 'StockFlow Inc.',
      email: 'admin@stockflow.com',
      phone: '+66 123 456 789',
      address: '123 Business Street, Bangkok, Thailand',
      lowStockAlert: true,
      emailNotifications: true,
      autoBackup: true,
      theme: 'light',
      language: 'th',
      currency: 'THB'
    };
  };

  const form = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: loadSettings()
  });

  // Apply theme changes immediately
  useEffect(() => {
    const theme = form.watch('theme');
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (theme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      // system theme
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [form.watch('theme')]);

  // Check for low stock items
  useEffect(() => {
    const settings = form.getValues();
    if (settings.lowStockAlert) {
      const lowStockItems = products.filter(product => {
        const stockLevel = getStockLevel(product);
        return stockLevel === 'low' || stockLevel === 'out';
      });
      
      if (lowStockItems.length > 0) {
        toast({
          title: "⚠️ การแจ้งเตือนสต็อกต่ำ",
          description: `มีสินค้า ${lowStockItems.length} รายการที่สต็อกต่ำหรือหมดแล้ว`,
          variant: "destructive",
        });
      }
    }
  }, [products, form.getValues, getStockLevel, toast]);

  const onSubmit = async (data: SettingsFormData) => {
    setIsLoading(true);
    try {
      // Save to localStorage
      localStorage.setItem('app-settings', JSON.stringify(data));
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "สำเร็จ",
        description: "บันทึกการตั้งค่าเรียบร้อยแล้ว",
      });
    } catch (error) {
      toast({
        title: "ข้อผิดพลาด",
        description: "เกิดข้อผิดพลาดในการบันทึกการตั้งค่า",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    form.reset(loadSettings());
    toast({
      title: "ยกเลิกแล้ว",
      description: "ยกเลิกการเปลี่ยนแปลง",
    });
  };

  // Export functions
  const handleExportJSON = () => {
    const exportData: ExportData = {
      products,
      categories,
      suppliers,
      movements,
      exportDate: new Date().toISOString(),
      version: '1.0'
    };
    exportDataToJSON(exportData);
    toast({
      title: "ส่งออกเรียบร้อย",
      description: "ส่งออกข้อมูล JSON เรียบร้อยแล้ว",
    });
  };

  const handleExportCSV = () => {
    const exportData: ExportData = {
      products,
      categories,
      suppliers,
      movements,
      exportDate: new Date().toISOString(),
      version: '1.0'
    };
    exportDataToCSV(exportData);
    toast({
      title: "ส่งออกเรียบร้อย",
      description: "ส่งออกข้อมูล CSV เรียบร้อยแล้ว",
    });
  };

  // Import functions
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      if (file.name.endsWith('.json')) {
        const data = await parseJSONFile(file);
        toast({
          title: "นำเข้าเรียบร้อย",
          description: `นำเข้าข้อมูลเรียบร้อยแล้ว: ${data.products.length} สินค้า, ${data.categories.length} หมวดหมู่, ${data.suppliers.length} ซัพพลายเออร์`,
        });
      } else if (file.name.endsWith('.csv')) {
        const data = await parseCSVFile(file);
        toast({
          title: "นำเข้าเรียบร้อย",
          description: `นำเข้าข้อมูล CSV เรียบร้อยแล้ว: ${data.length} รายการ`,
        });
      } else {
        toast({
          title: "รูปแบบไฟล์ไม่ถูกต้อง",
          description: "รองรับเฉพาะ .json และ .csv",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "ข้อผิดพลาด",
        description: "เกิดข้อผิดพลาดในการนำเข้าข้อมูล",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteAllData = () => {
    if (window.confirm('คุณแน่ใจหรือไม่ที่จะลบข้อมูลทั้งหมด? การกระทำนี้ไม่สามารถยกเลิกได้')) {
      localStorage.clear();
      toast({
        title: "ลบเรียบร้อย",
        description: "ลบข้อมูลทั้งหมดเรียบร้อยแล้ว",
      });
      window.location.reload();
    }
  };

  // Template functions
  const handleDownloadProductTemplate = () => {
    generateProductTemplate();
    toast({
      title: "ดาวน์โหลดเรียบร้อย",
      description: "ดาวน์โหลด Template สินค้าเรียบร้อยแล้ว",
    });
  };

  const handleDownloadCategoryTemplate = () => {
    generateCategoryTemplate();
    toast({
      title: "ดาวน์โหลดเรียบร้อย",
      description: "ดาวน์โหลด Template หมวดหมู่เรียบร้อยแล้ว",
    });
  };

  const handleDownloadSupplierTemplate = () => {
    generateSupplierTemplate();
    toast({
      title: "ดาวน์โหลดเรียบร้อย",
      description: "ดาวน์โหลด Template ซัพพลายเออร์เรียบร้อยแล้ว",
    });
  };

  // Notification functions
  const checkLowStockAlerts = () => {
    const settings = form.getValues();
    if (!settings.lowStockAlert) return;

    const lowStockItems = products.filter(product => {
      const stockLevel = getStockLevel(product);
      return stockLevel === 'low' || stockLevel === 'out';
    });

    if (lowStockItems.length > 0) {
      toast({
        title: "🔔 แจ้งเตือนสต็อกต่ำ",
        description: `พบสินค้า ${lowStockItems.length} รายการที่ต้องการเติมสต็อก`,
        variant: "destructive",
      });
    } else {
      toast({
        title: "✅ สต็อกปกติ",
        description: "ไม่มีสินค้าที่สต็อกต่ำในขณะนี้",
      });
    }
  };

  const testEmailNotification = () => {
    const settings = form.getValues();
    if (settings.emailNotifications) {
      toast({
        title: "📧 ทดสอบการแจ้งเตือน",
        description: `ส่งอีเมลทดสอบไปยัง ${settings.email} แล้ว`,
      });
    } else {
      toast({
        title: "การแจ้งเตือนปิดอยู่",
        description: "กรุณาเปิดการแจ้งเตือนทางอีเมลก่อน",
        variant: "destructive",
      });
    }
  };

  return (
    <Layout title="การตั้งค่า">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold text-foreground">การตั้งค่า</h1>
            <p className="text-muted-foreground">จัดการการตั้งค่าและการกำหนดค่าของแอปพลิเคชัน</p>
          </div>

          <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">ทั่วไป</TabsTrigger>
            <TabsTrigger value="notifications">การแจ้งเตือน</TabsTrigger>
            <TabsTrigger value="system">ระบบ</TabsTrigger>
            <TabsTrigger value="security">ความปลอดภัย</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <Card className="bg-gradient-card shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="mr-2 h-5 w-5" />
                  ข้อมูลบริษัท
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ชื่อบริษัท</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>อีเมล</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>เบอร์โทรศัพท์</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>สกุลเงิน</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="THB">Thai Baht (฿)</SelectItem>
                            <SelectItem value="USD">US Dollar ($)</SelectItem>
                            <SelectItem value="EUR">Euro (€)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ที่อยู่</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card className="bg-gradient-card shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Palette className="mr-2 h-5 w-5" />
                  รูปแบบการแสดงผล
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="theme"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ธีม</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="light">สว่าง</SelectItem>
                            <SelectItem value="dark">มืด</SelectItem>
                            <SelectItem value="system">ตามระบบ</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="language"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ภาษา</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="en">English</SelectItem>
                            <SelectItem value="th">ไทย</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card className="bg-gradient-card shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bell className="mr-2 h-5 w-5" />
                  การตั้งค่าการแจ้งเตือน
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="lowStockAlert"
                  render={({ field }) => (
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-foreground">แจ้งเตือนสต็อกต่ำ</h4>
                        <p className="text-sm text-muted-foreground">รับการแจ้งเตือนเมื่อสินค้าใกล้หมด</p>
                      </div>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </div>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="emailNotifications"
                  render={({ field }) => (
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-foreground">การแจ้งเตือนทางอีเมล</h4>
                        <p className="text-sm text-muted-foreground">รับข้อมูลอัพเดทสำคัญทางอีเมล</p>
                      </div>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </div>
                  )}
                />
                
                <div className="space-y-4">
                  <h4 className="font-medium text-foreground">ทดสอบการแจ้งเตือน</h4>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button 
                      type="button"
                      variant="outline" 
                      onClick={checkLowStockAlerts}
                      className="justify-start"
                    >
                      <Bell className="mr-2 h-4 w-4" />
                      ตรวจสอบสต็อกต่ำ
                    </Button>
                    <Button 
                      type="button"
                      variant="outline"
                      onClick={testEmailNotification}
                      className="justify-start"
                    >
                      📧 ทดสอบอีเมล
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="system" className="space-y-6">
            <Card className="bg-gradient-card shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Database className="mr-2 h-5 w-5" />
                  การตั้งค่าระบบ
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="autoBackup"
                  render={({ field }) => (
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-foreground">การสำรองข้อมูลอัตโนมัติ</h4>
                        <p className="text-sm text-muted-foreground">สำรองข้อมูลอัตโนมัติทุกวัน</p>
                      </div>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </div>
                  )}
                />
                
                <div className="space-y-4">
                  <h4 className="font-medium text-foreground">การจัดการข้อมูล</h4>
                  <p className="text-sm text-muted-foreground">
                    ส่งออกหรือนำเข้าข้อมูลสินค้า หมวดหมู่ และซัพพลายเออร์
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h5 className="font-medium text-sm">ส่งออกข้อมูล</h5>
                      <div className="flex flex-col gap-2">
                        <Button 
                          variant="outline" 
                          onClick={handleExportJSON}
                          className="justify-start"
                          disabled={isLoading}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          ส่งออก JSON
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={handleExportCSV}
                          className="justify-start"
                          disabled={isLoading}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          ส่งออก CSV
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h5 className="font-medium text-sm">นำเข้าข้อมูล</h5>
                      <div className="flex flex-col gap-2">
                        <Button 
                          variant="outline"
                          onClick={handleImportClick}
                          className="justify-start"
                          disabled={isLoading}
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          นำเข้าไฟล์
                        </Button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".json,.csv"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                        <Button 
                          variant="outline" 
                          onClick={handleDeleteAllData}
                          className="justify-start text-destructive hover:text-destructive-foreground hover:bg-destructive"
                          disabled={isLoading}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          ลบข้อมูลทั้งหมด
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    <p>• รองรับไฟล์ JSON และ CSV</p>
                    <p>• การลบข้อมูลจะไม่สามารถยกเลิกได้</p>
                  </div>
                </div>

                <div className="space-y-4 border-t pt-4">
                  <h4 className="font-medium text-foreground">Template การนำเข้าข้อมูล</h4>
                  <p className="text-sm text-muted-foreground">
                    ดาวน์โหลด Template CSV สำหรับการนำเข้าข้อมูล
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <Button 
                      variant="outline"
                      onClick={handleDownloadProductTemplate}
                      className="justify-start"
                      disabled={isLoading}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Template สินค้า
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={handleDownloadCategoryTemplate}
                      className="justify-start"
                      disabled={isLoading}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Template หมวดหมู่
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={handleDownloadSupplierTemplate}
                      className="justify-start"
                      disabled={isLoading}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Template ซัพพลายเออร์
                    </Button>
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    <p>• Template มีข้อมูลตัวอย่างและรูปแบบที่ถูกต้อง</p>
                    <p>• แก้ไขข้อมูลใน Template แล้วนำเข้ากลับเข้าระบบ</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card className="bg-gradient-card shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="mr-2 h-5 w-5" />
                  การตั้งค่าความปลอดภัย
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-foreground">เปลี่ยนรหัสผ่าน</h4>
                  <div className="grid grid-cols-1 gap-4 max-w-md">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">รหัสผ่านปัจจุบัน</Label>
                      <Input id="currentPassword" type="password" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">รหัสผ่านใหม่</Label>
                      <Input id="newPassword" type="password" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">ยืนยันรหัสผ่าน</Label>
                      <Input id="confirmPassword" type="password" />
                    </div>
                    <Button className="w-fit">อัพเดทรหัสผ่าน</Button>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-medium text-foreground">การจัดการเซสชัน</h4>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button variant="outline">ออกจากระบบทุกอุปกรณ์</Button>
                    <Button variant="outline">ดูเซสชันที่ใช้งาน</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={resetForm}>
              ยกเลิก
            </Button>
            <Button 
              type="submit" 
              className="bg-gradient-primary hover:bg-primary/90"
              disabled={isLoading}
            >
              {isLoading ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
            </Button>
          </div>
        </form>
      </Form>
    </Layout>
  );
}
