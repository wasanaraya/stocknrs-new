import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export function StatsCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend, 
  className 
}: StatsCardProps) {
  return (
    <Card className={cn('bg-white/70 backdrop-blur-sm shadow-card hover:shadow-hover transition-all duration-300 border border-white/40', className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-gray-800">{value}</p>
              {subtitle && (
                <p className="text-xs text-gray-500">{subtitle}</p>
              )}
            </div>
          </div>
          <div className="p-3 bg-gradient-primary/20 backdrop-blur-sm rounded-full border border-primary/30">
            <Icon className="h-6 w-6 text-primary drop-shadow-sm" />
          </div>
        </div>
        
        {trend && (
          <div className="mt-4 flex items-center">
            <span className={cn(
              'text-xs font-medium',
              trend.isPositive ? 'text-success' : 'text-destructive'
            )}>
              {trend.isPositive ? '+' : ''}{trend.value}%
            </span>
            <span className="text-xs text-gray-500 ml-1">จากงวดที่แล้ว</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}