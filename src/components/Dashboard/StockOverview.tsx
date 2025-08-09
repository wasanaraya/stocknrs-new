import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Package, AlertTriangle } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  sku: string;
  current_stock: number;
  min_stock: number;
  unit_price: number;
}

interface StockOverviewProps {
  products?: Product[];
  onViewDetails?: (product: Product) => void;
}

export function StockOverview({ products = [], onViewDetails }: StockOverviewProps) {
  const lowStockItems = products.filter(p => p.current_stock <= p.min_stock);
  const outOfStockItems = products.filter(p => p.current_stock === 0);

  const getStockLevel = (product: Product) => {
    if (product.current_stock === 0) return 'out';
    if (product.current_stock <= product.min_stock) return 'low';
    return 'normal';
  };

  const getStockBadge = (level: string) => {
    switch (level) {
      case 'out':
        return <Badge variant="destructive">หมด</Badge>;
      case 'low':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">ต่ำ</Badge>;
      default:
        return <Badge variant="default" className="bg-green-100 text-green-800">ปกติ</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Alert Summary */}
      {(lowStockItems.length > 0 || outOfStockItems.length > 0) && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <AlertTriangle className="h-5 w-5" />
              แจ้งเตือนสต็อก
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {outOfStockItems.length > 0 && (
                <div className="p-3 bg-red-50 rounded-lg">
                  <h4 className="font-medium text-red-800 mb-2">สินค้าหมด ({outOfStockItems.length} รายการ)</h4>
                  <ul className="text-sm text-red-700 space-y-1">
                    {outOfStockItems.slice(0, 3).map(item => (
                      <li key={item.id}>• {item.name} ({item.sku})</li>
                    ))}
                    {outOfStockItems.length > 3 && (
                      <li>และอีก {outOfStockItems.length - 3} รายการ</li>
                    )}
                  </ul>
                </div>
              )}
              
              {lowStockItems.length > 0 && (
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <h4 className="font-medium text-yellow-800 mb-2">สต็อกต่ำ ({lowStockItems.length} รายการ)</h4>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    {lowStockItems.slice(0, 3).map(item => (
                      <li key={item.id}>• {item.name} ({item.sku})</li>
                    ))}
                    {lowStockItems.length > 3 && (
                      <li>และอีก {lowStockItems.length - 3} รายการ</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Products */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            สินค้าล่าสุด
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {products.slice(0, 5).map((product) => (
              <div key={product.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium">{product.name}</h4>
                  <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
                  <p className="text-sm">
                    สต็อก: {product.current_stock} / ขั้นต่ำ: {product.min_stock}
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  {getStockBadge(getStockLevel(product))}
                  {onViewDetails && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onViewDetails(product)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
            
            {products.length === 0 && (
              <div className="text-center py-6 text-muted-foreground">
                ยังไม่มีข้อมูลสินค้า
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}