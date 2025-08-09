import { Product, Category, Supplier, StockMovement } from '@/types/stock';

export interface ExportData {
  products: Product[];
  categories: Category[];
  suppliers: Supplier[];
  movements: StockMovement[];
  exportDate: string;
  version: string;
}

export const exportDataToJSON = (data: ExportData): void => {
  const dataStr = JSON.stringify(data, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  
  const link = document.createElement('a');
  link.href = URL.createObjectURL(dataBlob);
  link.download = `stock-data-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportDataToCSV = (data: ExportData): void => {
  // Export Products
  const productHeaders = ['รหัสสินค้า', 'ชื่อสินค้า', 'SKU', 'หมวดหมู่', 'ซัพพลายเออร์', 'ราคาต่อหน่วย', 'จำนวนคงเหลือ', 'สต็อกต่ำสุด', 'สต็อกสูงสุด'];
  const productRows = data.products.map(product => [
    product.id,
    product.name,
    product.sku,
    product.category,
    product.supplier,
    product.unitPrice.toString(),
    product.currentStock.toString(),
    product.minStock.toString(),
    product.maxStock.toString()
  ]);

  const productCSV = [productHeaders, ...productRows]
    .map(row => row.map(field => `"${field}"`).join(','))
    .join('\n');

  // Export Categories
  const categoryHeaders = ['รหัส', 'ชื่อหมวดหมู่', 'คำอธิบาย'];
  const categoryRows = data.categories.map(category => [
    category.id,
    category.name,
    category.description || ''
  ]);

  const categoryCSV = [categoryHeaders, ...categoryRows]
    .map(row => row.map(field => `"${field}"`).join(','))
    .join('\n');

  // Export Suppliers
  const supplierHeaders = ['รหัส', 'ชื่อซัพพลายเออร์', 'ติดต่อ', 'อีเมล', 'โทรศัพท์'];
  const supplierRows = data.suppliers.map(supplier => [
    supplier.id,
    supplier.name,
    supplier.contact || '',
    supplier.email || '',
    supplier.phone || ''
  ]);

  const supplierCSV = [supplierHeaders, ...supplierRows]
    .map(row => row.map(field => `"${field}"`).join(','))
    .join('\n');

  // Create zip-like structure by downloading multiple files
  downloadCSVFile(productCSV, 'products');
  setTimeout(() => downloadCSVFile(categoryCSV, 'categories'), 500);
  setTimeout(() => downloadCSVFile(supplierCSV, 'suppliers'), 1000);
};

const downloadCSVFile = (csvContent: string, filename: string): void => {
  const BOM = '\uFEFF'; // UTF-8 BOM for proper Thai character display in Excel
  const dataBlob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  
  const link = document.createElement('a');
  link.href = URL.createObjectURL(dataBlob);
  link.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Template generation functions
export const generateProductTemplate = (): void => {
  const headers = ['รหัสสินค้า', 'ชื่อสินค้า', 'SKU', 'คำอธิบาย', 'หมวดหมู่', 'ซัพพลายเออร์', 'ราคาต่อหน่วย', 'จำนวนคงเหลือ', 'สต็อกต่ำสุด', 'สต็อกสูงสุด', 'บาร์โค้ด', 'ตำแหน่ง'];
  const sampleRows = [
    ['PROD001', 'สินค้าตัวอย่าง 1', 'SAMPLE-001', 'คำอธิบายสินค้า', 'Electronics', 'TechSupply Co.', '1000', '50', '10', '100', '1234567890123', 'A1-B2'],
    ['PROD002', 'สินค้าตัวอย่าง 2', 'SAMPLE-002', 'คำอธิบายสินค้า', 'Clothing', 'Fashion Forward', '500', '25', '5', '50', '1234567890124', 'B1-C3']
  ];

  const csvContent = [headers, ...sampleRows]
    .map(row => row.map(field => `"${field}"`).join(','))
    .join('\n');

  downloadCSVFile(csvContent, 'template-products');
};

export const generateCategoryTemplate = (): void => {
  const headers = ['รหัส', 'ชื่อหมวดหมู่', 'คำอธิบาย', 'สี'];
  const sampleRows = [
    ['CAT001', 'อิเล็กทรอนิกส์', 'อุปกรณ์อิเล็กทรอนิกส์และอุปกรณ์เสริม', '#3B82F6'],
    ['CAT002', 'เสื้อผ้า', 'เสื้อผ้าและแฟชั่น', '#10B981'],
    ['CAT003', 'หนังสือ', 'หนังสือและสิ่งพิมพ์', '#F59E0B']
  ];

  const csvContent = [headers, ...sampleRows]
    .map(row => row.map(field => `"${field}"`).join(','))
    .join('\n');

  downloadCSVFile(csvContent, 'template-categories');
};

export const generateSupplierTemplate = (): void => {
  const headers = ['รหัส', 'ชื่อซัพพลายเออร์', 'ผู้ติดต่อ', 'อีเมล', 'โทรศัพท์', 'ที่อยู่'];
  const sampleRows = [
    ['SUP001', 'บริษัทตัวอย่าง จำกัด', 'คุณสมชาย', 'contact@example.com', '02-123-4567', '123 ถนนสุขุมวิท กรุงเทพฯ 10110'],
    ['SUP002', 'ร้านค้าตัวอย่าง', 'คุณสมศรี', 'info@shop.com', '02-234-5678', '456 ถนนพระราม 4 กรุงเทพฯ 10500']
  ];

  const csvContent = [headers, ...sampleRows]
    .map(row => row.map(field => `"${field}"`).join(','))
    .join('\n');

  downloadCSVFile(csvContent, 'template-suppliers');
};

export const parseCSVFile = (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
        
        const data = lines.slice(1).map(line => {
          const values = line.split(',').map(v => v.replace(/"/g, '').trim());
          const obj: any = {};
          headers.forEach((header, index) => {
            obj[header] = values[index] || '';
          });
          return obj;
        });
        
        resolve(data);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error('Error reading file'));
    reader.readAsText(file, 'UTF-8');
  });
};

export const parseJSONFile = (file: File): Promise<ExportData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const data = JSON.parse(text) as ExportData;
        resolve(data);
      } catch (error) {
        reject(new Error('Invalid JSON format'));
      }
    };
    reader.onerror = () => reject(new Error('Error reading file'));
    reader.readAsText(file);
  });
};