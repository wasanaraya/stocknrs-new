import React from 'react';
import { Bell, Search, Menu, Package } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface HeaderProps {
  title: string;
  onMenuClick?: () => void;
}

export function Header({ title, onMenuClick }: HeaderProps) {
  return (
    <header className="bg-white/60 backdrop-blur-sm shadow-card border-b border-white/30 relative z-30">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden hover:bg-white/20"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5 text-gray-700" />
          </Button>
          
          <div className="flex items-center space-x-2 md:hidden">
            <Package className="h-6 w-6 text-primary" />
            <span className="font-bold text-gray-800">ระบบจัดการสต็อก</span>
          </div>
          
          <h1 className="hidden md:block text-2xl font-bold text-gray-800 font-kanit">{title}</h1>
        </div>

        <div className="flex items-center space-x-4">
          <div className="hidden md:block relative w-96">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <Input
              placeholder="ค้นหาสินค้า, SKU, หรือบาร์โค้ด..."
              className="pl-9 bg-white/80 backdrop-blur-sm border-white/50"
            />
          </div>

          <Button variant="ghost" size="sm" className="relative hover:bg-white/20">
            <Bell className="h-5 w-5 text-gray-700" />
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
            >
              3
            </Badge>
          </Button>
        </div>
      </div>
    </header>
  );
}