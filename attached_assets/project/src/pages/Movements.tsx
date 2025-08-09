
import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, ArrowUp, ArrowDown, Package, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase, Movement } from '@/lib/supabase';
import { AddMovementDialog } from '@/components/Dialogs/AddMovementDialog';

interface MovementWithProduct extends Movement {
  product_name: string;
  product_sku: string;
}

export default function Movements() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [movements, setMovements] = useState<MovementWithProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchMovements();
  }, []);

  const fetchMovements = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('movements')
        .select(`
          *,
          products!inner (
            name,
            sku
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      const movementsWithProduct = data?.map(movement => ({
        ...movement,
        product_name: movement.products.name,
        product_sku: movement.products.sku
      })) || [];

      setMovements(movementsWithProduct);
    } catch (error) {
      console.error('Error fetching movements:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถดึงข้อมูลการเคลื่อนไหวสต็อกได้",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredMovements = movements.filter(movement => {
    const matchesSearch = movement.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         movement.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         movement.product_sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || movement.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const todayMovements = movements.filter(m => 
    new Date(m.created_at).toDateString() === new Date().toDateString()
  );

  const todayStockIn = todayMovements.filter(m => m.type === 'in').length;
  const todayStockOut = todayMovements.filter(m => m.type === 'out').length;

  return (
    <Layout title="การเคลื่อนไหวสต็อก">
      <div className="w-full space-y-6 pb-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">การเคลื่อนไหวสต็อก</h1>
            <p className="text-muted-foreground">ติดตามการรับเข้าและเบิกออกสต็อกทั้งหมด</p>
          </div>
          <AddMovementDialog onMovementAdded={fetchMovements} />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <Card className="bg-gradient-card shadow-card">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <ArrowUp className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">รับเข้าวันนี้</p>
                  <p className="text-xl sm:text-2xl font-bold text-green-600">
                    {todayStockIn}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card shadow-card">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-red-500/10 rounded-lg">
                  <ArrowDown className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">เบิกออกวันนี้</p>
                  <p className="text-xl sm:text-2xl font-bold text-red-600">
                    {todayStockOut}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card shadow-card sm:col-span-2 lg:col-span-1">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Package className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">รายการเคลื่อนไหวทั้งหมด</p>
                  <p className="text-xl sm:text-2xl font-bold text-foreground">{movements.length.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-gradient-card shadow-card">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="ค้นหารายการเคลื่อนไหว..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="ประเภทรายการ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทุกประเภท</SelectItem>
                  <SelectItem value="in">รับเข้า</SelectItem>
                  <SelectItem value="out">เบิกออก</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Movements Table */}
        <Card className="bg-gradient-card shadow-card">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">รายการเคลื่อนไหวล่าสุด</CardTitle>
          </CardHeader>
          <CardContent className="p-0 sm:p-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">กำลังโหลดข้อมูล...</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs sm:text-sm">วันที่</TableHead>
                      <TableHead className="text-xs sm:text-sm">สินค้า</TableHead>
                      <TableHead className="text-xs sm:text-sm hidden sm:table-cell">SKU</TableHead>
                      <TableHead className="text-xs sm:text-sm">ประเภท</TableHead>
                      <TableHead className="text-xs sm:text-sm">จำนวน</TableHead>
                      <TableHead className="text-xs sm:text-sm hidden md:table-cell">เหตุผล</TableHead>
                      <TableHead className="text-xs sm:text-sm hidden lg:table-cell">เลขที่อ้างอิง</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMovements.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          ไม่พบข้อมูลการเคลื่อนไหวสต็อก
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredMovements.map((movement) => (
                        <TableRow key={movement.id}>
                          <TableCell className="font-medium text-xs sm:text-sm">
                            <div className="flex flex-col">
                              <span>{new Date(movement.created_at).toLocaleDateString('th-TH')}</span>
                              <span className="text-xs text-muted-foreground sm:hidden">
                                {movement.product_sku}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs sm:text-sm">
                            <div className="max-w-[150px] truncate" title={movement.product_name}>
                              {movement.product_name}
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-xs sm:text-sm hidden sm:table-cell">
                            {movement.product_sku}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={movement.type === 'in' ? 'default' : 'secondary'}
                              className={`text-xs ${movement.type === 'in' 
                                ? 'bg-green-500/10 text-green-600' 
                                : 'bg-red-500/10 text-red-600'
                              }`}
                            >
                              <div className="flex items-center">
                                {movement.type === 'in' ? (
                                  <ArrowUp className="mr-1 h-2 w-2 sm:h-3 sm:w-3" />
                                ) : (
                                  <ArrowDown className="mr-1 h-2 w-2 sm:h-3 sm:w-3" />
                                )}
                                <span className="hidden sm:inline">
                                  {movement.type === 'in' ? 'รับเข้า' : 'เบิกออก'}
                                </span>
                                <span className="sm:hidden">
                                  {movement.type === 'in' ? '+' : '-'}
                                </span>
                              </div>
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium text-xs sm:text-sm">
                            <span className={movement.type === 'in' ? 'text-green-600' : 'text-red-600'}>
                              {movement.type === 'in' ? '+' : '-'}{movement.quantity.toLocaleString()}
                            </span>
                          </TableCell>
                          <TableCell className="text-xs sm:text-sm hidden md:table-cell">
                            <div className="max-w-[120px] truncate" title={movement.reason}>
                              {movement.reason}
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-xs sm:text-sm hidden lg:table-cell">
                            {movement.reference || '-'}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
