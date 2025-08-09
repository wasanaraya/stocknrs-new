import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  Package, 
  BarChart3, 
  ArrowUpDown, 
  Settings, 
  FileText,
  Tags,
  Truck,
  ScanLine,
  DollarSign
} from 'lucide-react';

const navigation = [
  { name: 'แดชบอร์ด', href: '/dashboard', icon: BarChart3 },
  { name: 'สินค้า', href: '/products', icon: Package },
  { name: 'การเคลื่อนไหวสต็อก', href: '/movements', icon: ArrowUpDown },
  { name: 'หมวดหมู่', href: '/categories', icon: Tags },
  { name: 'ผู้จำหน่าย', href: '/suppliers', icon: Truck },
  { name: 'สแกนบาร์โค้ด', href: '/scanner', icon: ScanLine },
  { name: 'ขอใช้งบประมาณ', href: '/budget-request', icon: DollarSign },
  { name: 'รายงาน', href: '/reports', icon: FileText },
  { name: 'ตั้งค่า', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col lg:z-40">
      <div className="flex min-h-0 flex-1 flex-col bg-gradient-primary shadow-glow border-r border-primary/20">
        <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
          <div className="flex flex-shrink-0 items-center px-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg shadow-inner-glow">
                <Package className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white drop-shadow-sm">ระบบจัดการสต็อก</h1>
                <p className="text-xs text-white/80">Stock Management</p>
              </div>
            </div>
          </div>
          
          <nav className="mt-8 flex-1 space-y-1 px-2">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 backdrop-blur-sm',
                    isActive
                      ? 'bg-white/20 text-white shadow-glow border border-white/30'
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                  )}
                >
                  <item.icon
                    className={cn(
                    'mr-3 h-5 w-5 flex-shrink-0 drop-shadow-sm',
                    isActive 
                      ? 'text-white' 
                      : 'text-white/70 group-hover:text-white'
                  )}
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
        
        <div className="flex flex-shrink-0 border-t border-white/20 p-4">
          <div className="group block w-full flex-shrink-0">
            <div className="flex items-center">
              <div className="inline-block h-9 w-9 rounded-full bg-white/20 backdrop-blur-sm shadow-inner-glow"></div>
              <div className="ml-3">
                <p className="text-sm font-medium text-white drop-shadow-sm">ผู้ดูแลระบบ</p>
                <p className="text-xs text-white/80">ผู้จัดการสต็อก</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}