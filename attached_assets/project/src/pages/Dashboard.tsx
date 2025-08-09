import React from 'react';
import { Layout } from '@/components/Layout/Layout';
import { StatsCard } from '@/components/Dashboard/StatsCard';
import { StockOverview } from '@/components/Dashboard/StockOverview';
import { useStock } from '@/contexts/StockContext';
import { 
  Package, 
  DollarSign, 
  AlertTriangle, 
  TrendingUp, 
  ArrowUpDown,
  ShoppingCart
} from 'lucide-react';

export default function Dashboard() {
  const { stats } = useStock();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  return (
    <Layout title="แดชบอร์ด">
      <div className="w-full space-y-6 pb-8">
        {/* Page Header */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-white/30 shadow-card">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 font-kanit">แดชบอร์ด</h1>
          <p className="text-gray-600 mt-1">ภาพรวมระบบจัดการสต็อกสินค้า</p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="รายการสินค้าทั้งหมด"
            value={stats.totalProducts}
            subtitle="สินค้าที่มีในระบบ"
            icon={Package}
            trend={{ value: 12, isPositive: true }}
          />
          <StatsCard
            title="มูลค่ารวม"
            value={formatCurrency(stats.totalValue)}
            subtitle="มูลค่าสต็อกปัจจุบัน"
            icon={DollarSign}
            trend={{ value: 8, isPositive: true }}
          />
          <StatsCard
            title="สินค้าใกล้หมด"
            value={stats.lowStockItems}
            subtitle="สินค้าที่ต่ำกว่าระดับขั้นต่ำ"
            icon={AlertTriangle}
            trend={{ value: 3, isPositive: false }}
            className={stats.lowStockItems > 0 ? 'border-warning/50' : ''}
          />
          <StatsCard
            title="การเคลื่อนไหวล่าสุด"
            value={stats.recentMovements}
            subtitle="7 วันที่ผ่านมา"
            icon={ArrowUpDown}
            trend={{ value: 15, isPositive: true }}
          />
        </div>

        {/* Stock Overview */}
        <StockOverview />

        {/* Quick Actions */}
        <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          <div className="bg-white/60 backdrop-blur-sm shadow-card rounded-2xl p-4 sm:p-6 hover:shadow-hover transition-all duration-300 border border-white/30">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-primary/10 rounded-full">
                <Package className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-foreground text-sm sm:text-base">เพิ่มสินค้าใหม่</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">ลงทะเบียนสินค้าใหม่เข้าระบบ</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/60 backdrop-blur-sm shadow-card rounded-2xl p-4 sm:p-6 hover:shadow-hover transition-all duration-300 border border-white/30">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-success/10 rounded-full">
                <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-success" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-foreground text-sm sm:text-base">รับสินค้าเข้า</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">บันทึกสินค้าที่รับเข้ามา</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/60 backdrop-blur-sm shadow-card rounded-2xl p-4 sm:p-6 hover:shadow-hover transition-all duration-300 border border-white/30 md:col-span-2 lg:col-span-1">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-warning/10 rounded-full">
                <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6 text-warning" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-foreground text-sm sm:text-base">จ่ายสินค้าออก</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">บันทึกสินค้าที่จ่ายออกไป</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}