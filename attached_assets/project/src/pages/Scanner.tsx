
import React, { useState, useRef, useEffect } from 'react';
import { Layout } from '@/components/Layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScanLine, Search, Package, AlertCircle, Camera, CameraOff } from 'lucide-react';
import { supabase, type Product } from '@/lib/supabase';
import { BrowserMultiFormatReader } from '@zxing/library';
import { useToast } from '@/hooks/use-toast';

interface ProductWithCategory extends Product {
  categories?: { name: string };
  suppliers?: { name: string };
}

export default function Scanner() {
  const [barcode, setBarcode] = useState('');
  const [scannedProduct, setScannedProduct] = useState<ProductWithCategory | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [recentScans, setRecentScans] = useState<ProductWithCategory[]>([]);
  const [cameraPermission, setCameraPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const [scannerDetected, setScannerDetected] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  const scannerInputRef = useRef<string>('');
  const scannerTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const searchProductByBarcode = async (barcodeValue: string) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories(name),
          suppliers(name)
        `)
        .eq('sku', barcodeValue)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error searching product:', error);
      return null;
    }
  };

  const handleScan = async () => {
    if (!barcode.trim()) return;
    
    const product = await searchProductByBarcode(barcode.trim());
    setScannedProduct(product);
    
    if (product) {
      // Add to recent scans
      setRecentScans(prev => {
        const filtered = prev.filter(p => p.id !== product.id);
        return [product, ...filtered].slice(0, 5);
      });
      
      toast({
        title: "สินค้าพบแล้ว",
        description: `${product.name} - คงเหลือ ${product.current_stock} ชิ้น`,
      });
    } else {
      toast({
        title: "ไม่พบสินค้า",
        description: `ไม่พบสินค้าที่มี SKU: ${barcode}`,
        variant: "destructive",
      });
      
      setTimeout(() => setScannedProduct(null), 3000);
    }
  };

  const startCameraScanning = async () => {
    try {
      setIsScanning(true);
      
      // Request camera permission
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment' // Use back camera if available
        } 
      });
      
      setCameraPermission('granted');
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        
        // Initialize barcode reader
        codeReaderRef.current = new BrowserMultiFormatReader();
        
        codeReaderRef.current.decodeFromVideoDevice(
          undefined,
          videoRef.current,
          async (result, error) => {
            if (result) {
              const barcodeValue = result.getText();
              setBarcode(barcodeValue);
              
              // Stop scanning and search for product
              stopScanning();
              
              const product = await searchProductByBarcode(barcodeValue);
              setScannedProduct(product);
              
              if (product) {
                setRecentScans(prev => {
                  const filtered = prev.filter(p => p.id !== product.id);
                  return [product, ...filtered].slice(0, 5);
                });
                
                toast({
                  title: "สแกนสำเร็จ",
                  description: `${product.name} - คงเหลือ ${product.current_stock} ชิ้น`,
                });
              } else {
                toast({
                  title: "ไม่พบสินค้า",
                  description: `ไม่พบสินค้าที่มี SKU: ${barcodeValue}`,
                  variant: "destructive",
                });
              }
            }
          }
        );
      }
    } catch (error) {
      console.error('Camera error:', error);
      setCameraPermission('denied');
      setIsScanning(false);
      
      toast({
        title: "ไม่สามารถเข้าถึงกล้องได้",
        description: "กรุณาอนุญาตการใช้งานกล้องหรือใช้การป้อนข้อมูลด้วยตนเอง",
        variant: "destructive",
      });
    }
  };

  const stopScanning = () => {
    setIsScanning(false);
    
    // Stop camera stream
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    
    // Stop barcode reader
    if (codeReaderRef.current) {
      codeReaderRef.current.reset();
    }
  };

  // Barcode scanner detection and handling
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Prevent default behavior for scanner input
      const isEnter = event.key === 'Enter';
      const isValidChar = /^[a-zA-Z0-9]$/.test(event.key);
      
      if (isValidChar || isEnter) {
        // Clear existing timeout
        if (scannerTimeoutRef.current) {
          clearTimeout(scannerTimeoutRef.current);
        }

        if (isEnter) {
          // Process the accumulated input
          if (scannerInputRef.current.length > 3) { // Typical barcode length
            const scannedCode = scannerInputRef.current;
            setScannerDetected(true);
            setBarcode(scannedCode);
            
            // Process the scanned barcode
            searchProductByBarcode(scannedCode).then(product => {
              setScannedProduct(product);
              
              if (product) {
                setRecentScans(prev => {
                  const filtered = prev.filter(p => p.id !== product.id);
                  return [product, ...filtered].slice(0, 5);
                });
                
                toast({
                  title: "สแกนสำเร็จ (เครื่องอ่านบาร์โค้ด)",
                  description: `${product.name} - คงเหลือ ${product.current_stock} ชิ้น`,
                });
              } else {
                toast({
                  title: "ไม่พบสินค้า",
                  description: `ไม่พบสินค้าที่มี SKU: ${scannedCode}`,
                  variant: "destructive",
                });
              }
            });
            
            // Reset scanner detection after 3 seconds
            setTimeout(() => setScannerDetected(false), 3000);
          }
          
          // Reset the input buffer
          scannerInputRef.current = '';
        } else {
          // Accumulate characters
          scannerInputRef.current += event.key;
          
          // Set timeout to reset buffer if typing is too slow (human typing)
          scannerTimeoutRef.current = setTimeout(() => {
            scannerInputRef.current = '';
          }, 100); // 100ms timeout - scanners type much faster than humans
        }
      }
    };

    // Add event listener
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (scannerTimeoutRef.current) {
        clearTimeout(scannerTimeoutRef.current);
      }
      stopScanning();
    };
  }, [toast]);

  return (
    <Layout title="สแกนบาร์โค้ด">
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">สแกนบาร์โค้ด</h1>
          <p className="text-muted-foreground mt-2">สแกนหรือป้อน SKU สินค้าเพื่อค้นหาข้อมูลสต็อก</p>
          {scannerDetected && (
            <div className="mt-2 p-2 bg-green-500/10 text-green-600 rounded-lg text-sm">
              ✓ ตรวจพบเครื่องอ่านบาร์โค้ด
            </div>
          )}
        </div>

        {/* Scanner Interface */}
        <div className="w-full max-w-md mx-auto space-y-6 px-4 sm:px-0">
          {/* Camera Scanner */}
          <Card className="bg-gradient-card shadow-card">
            <CardContent className="p-4 sm:p-6">
              <div className="text-center space-y-4">
                <div className="relative mx-auto w-full max-w-sm aspect-[4/3] rounded-lg border-2 border-dashed border-muted overflow-hidden bg-black">
                  {isScanning ? (
                    <video
                      ref={videoRef}
                      className="w-full h-full object-cover"
                      autoPlay
                      playsInline
                      muted
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Camera className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground" />
                    </div>
                  )}
                  
                  {isScanning && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-20 sm:w-32 h-1 bg-primary animate-pulse"></div>
                    </div>
                  )}
                </div>
                
                <div className="flex space-x-2">
                  <Button 
                    onClick={startCameraScanning}
                    disabled={isScanning || cameraPermission === 'denied'}
                    className="flex-1 bg-gradient-primary hover:bg-primary/90 text-sm sm:text-base"
                  >
                    <Camera className="mr-2 h-4 w-4" />
                    {isScanning ? 'กำลังสแกน...' : 'เริ่มสแกน'}
                  </Button>
                  
                  {isScanning && (
                    <Button 
                      onClick={stopScanning}
                      variant="outline"
                      size="icon"
                    >
                      <CameraOff className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                {cameraPermission === 'denied' && (
                  <p className="text-xs sm:text-sm text-destructive">
                    ไม่สามารถเข้าถึงกล้องได้ กรุณาใช้การป้อนข้อมูลด้วยตนเอง
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Manual Input */}
          <Card className="bg-gradient-card shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-center text-lg">ป้อน SKU ด้วยตนเอง</CardTitle>
              <p className="text-xs text-muted-foreground text-center mt-1">
                รองรับเครื่องอ่านบาร์โค้ด หรือพิมพ์ SKU ด้วยตนเอง
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex space-x-2">
                <Input
                  placeholder="ป้อน SKU สินค้า..."
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleScan()}
                  className="text-sm sm:text-base"
                />
                <Button onClick={handleScan} size="icon">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Scan Result */}
        {scannedProduct && (
          <div className="w-full max-w-4xl mx-auto px-4 sm:px-0">
            <Card className="bg-gradient-card shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center text-lg sm:text-xl">
                  <Package className="mr-2 h-5 w-5" />
                  พบสินค้าแล้ว
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">ชื่อสินค้า</label>
                      <p className="text-lg sm:text-xl font-semibold text-foreground break-words">{scannedProduct.name}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">SKU</label>
                      <p className="text-sm sm:text-base text-foreground break-all">{scannedProduct.sku}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">หมวดหมู่</label>
                      <p className="text-sm sm:text-base text-foreground">{scannedProduct.categories?.name || 'ไม่ระบุ'}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">สต็อกปัจจุบัน</label>
                      <p className="text-2xl sm:text-3xl font-bold text-foreground">{scannedProduct.current_stock.toLocaleString()}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">ราคาต่อหน่วย</label>
                      <p className="text-lg sm:text-xl font-semibold text-foreground">฿{scannedProduct.unit_price.toLocaleString()}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">สถานะสต็อก</label>
                      <div>
                        <Badge 
                          variant={scannedProduct.current_stock > scannedProduct.min_stock ? 'default' : scannedProduct.current_stock > 0 ? 'secondary' : 'destructive'}
                          className={`text-xs sm:text-sm ${
                            scannedProduct.current_stock > scannedProduct.min_stock
                              ? 'bg-green-500/10 text-green-600' 
                              : scannedProduct.current_stock > 0
                                ? 'bg-yellow-500/10 text-yellow-600'
                                : 'bg-red-500/10 text-red-600'
                          }`}
                        >
                          {scannedProduct.current_stock > scannedProduct.min_stock 
                            ? 'สต็อกเพียงพอ' 
                            : scannedProduct.current_stock > 0 
                              ? 'สต็อกต่ำ' 
                              : 'หมดสต็อก'
                          }
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 pt-4">
                  <Button variant="outline" className="flex-1 text-sm sm:text-base">
                    อัพเดทสต็อก
                  </Button>
                  <Button variant="outline" className="flex-1 text-sm sm:text-base">
                    รายละเอียดเพิ่มเติม
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Product Not Found */}
        {barcode && scannedProduct === null && barcode.trim() !== '' && (
          <div className="w-full max-w-md mx-auto px-4 sm:px-0">
            <Card className="bg-gradient-card shadow-card">
              <CardContent className="p-6 text-center">
                <AlertCircle className="h-10 w-10 sm:h-12 sm:w-12 text-yellow-500 mx-auto mb-4" />
                <p className="text-foreground font-medium text-sm sm:text-base">ไม่พบสินค้า</p>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1 break-all">
                  ไม่พบสินค้าที่มี SKU: {barcode}
                </p>
                <Button 
                  variant="outline" 
                  className="mt-4 text-sm sm:text-base"
                  onClick={() => {
                    setBarcode('');
                    setScannedProduct(null);
                  }}
                >
                  ลองใหม่
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Recent Scans */}
        <div className="w-full max-w-4xl mx-auto px-4 sm:px-0">
          <Card className="bg-gradient-card shadow-card">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">การสแกนล่าสุด</CardTitle>
            </CardHeader>
            <CardContent>
              {recentScans.length > 0 ? (
                <div className="space-y-3">
                  {recentScans.map((product, index) => (
                    <div key={product.id} className="flex items-center justify-between p-3 bg-accent/50 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground text-sm sm:text-base truncate">{product.name}</p>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          {new Date(Date.now() - index * 60000).toLocaleTimeString('th-TH')}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs sm:text-sm ml-2 flex-shrink-0">{product.sku}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8 text-sm sm:text-base">
                  ยังไม่มีการสแกนสินค้า
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
