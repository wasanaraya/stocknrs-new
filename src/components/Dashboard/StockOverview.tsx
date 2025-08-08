import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useStock } from '@/contexts/StockContext';
import { AlertTriangle, Package, TrendingDown } from 'lucide-react';
import { Link } from 'react-router-dom';

export function StockOverview() {
  const { products, categories, getStockLevel } = useStock();

  const lowStockProducts = products.filter(p => getStockLevel(p) === 'low');
  const outOfStockProducts = products.filter(p => getStockLevel(p) === 'out');

  const getStockBadgeVariant = (level: string) => {
    switch (level) {
      case 'out': return 'destructive';
      case 'low': return 'secondary';
      case 'medium': return 'default';
      case 'high': return 'default';
      default: return 'default';
    }
  };

  const getStockBadgeColor = (level: string) => {
    switch (level) {
      case 'out': return 'bg-stock-low';
      case 'low': return 'bg-stock-medium';
      case 'medium': return 'bg-stock-medium';
      case 'high': return 'bg-stock-high';
      default: return 'bg-muted';
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Low Stock Alerts */}
      <Card className="bg-white/70 backdrop-blur-sm shadow-card border border-white/40">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base font-medium flex items-center text-gray-800">
            <AlertTriangle className="h-4 w-4 text-warning mr-2" />
            แจ้งเตือนสินค้าใกล้หมด
          </CardTitle>
          <Badge variant="secondary" className="bg-warning/10 text-warning">
            {lowStockProducts.length}
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {lowStockProducts.slice(0, 5).map(product => {
              const category = categories.find(c => c.id === product.category);
              return (
                <div key={product.id} className="flex items-center justify-between p-3 bg-white/50 backdrop-blur-sm rounded-lg border border-white/30">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{product.name}</p>
                    <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
                    <p className="text-xs text-muted-foreground">{category?.name}</p>
                  </div>
                  <div className="text-right space-y-1">
                    <Badge 
                      variant={getStockBadgeVariant(getStockLevel(product))}
                      className={getStockBadgeColor(getStockLevel(product))}
                    >
                      {product.currentStock} เหลือ
                    </Badge>
                    <p className="text-xs text-gray-500">ขั้นต่ำ: {product.minStock}</p>
                  </div>
                </div>
              );
            })}
            {lowStockProducts.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">
                ไม่มีสินค้าใกล้หมด
              </p>
            )}
            {lowStockProducts.length > 5 && (
              <div className="text-center pt-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/products?filter=low">ดูสินค้าใกล้หมดทั้งหมด</Link>
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Out of Stock */}
      <Card className="bg-white/70 backdrop-blur-sm shadow-card border border-white/40">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base font-medium flex items-center text-gray-800">
            <TrendingDown className="h-4 w-4 text-destructive mr-2" />
            สินค้าหมดสต็อก
          </CardTitle>
          <Badge variant="destructive">
            {outOfStockProducts.length}
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {outOfStockProducts.slice(0, 5).map(product => {
              const category = categories.find(c => c.id === product.category);
              return (
                <div key={product.id} className="flex items-center justify-between p-3 bg-white/50 backdrop-blur-sm rounded-lg border border-white/30">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{product.name}</p>
                    <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
                    <p className="text-xs text-muted-foreground">{category?.name}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="destructive">
                      สินค้าหมด
                    </Badge>
                  </div>
                </div>
              );
            })}
            {outOfStockProducts.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">
                สินค้าทั้งหมดมีสต็อก
              </p>
            )}
            {outOfStockProducts.length > 5 && (
              <div className="text-center pt-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/products?filter=out">ดูสินค้าหมดสต็อกทั้งหมด</Link>
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}