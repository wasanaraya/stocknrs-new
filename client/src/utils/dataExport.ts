export interface ExportData {
  products: any[];
  categories: any[];
  suppliers: any[];
  movements: any[];
}

export const exportDataToJSON = (data: ExportData): void => {
  const dataStr = JSON.stringify(data, null, 2);
  const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
  
  const exportFileDefaultName = `stock-data-${new Date().toISOString().split('T')[0]}.json`;
  
  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportFileDefaultName);
  linkElement.click();
};

export const exportDataToCSV = (data: any[], filename: string): void => {
  if (data.length === 0) return;
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(header => JSON.stringify(row[header] || '')).join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

export const parseJSONFile = (file: File): Promise<any> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const result = JSON.parse(e.target?.result as string);
        resolve(result);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
};

export const parseCSVFile = (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csv = e.target?.result as string;
        const lines = csv.split('\n');
        const headers = lines[0].split(',').map(h => h.replace(/"/g, ''));
        const data = lines.slice(1).map(line => {
          const values = line.split(',').map(v => v.replace(/"/g, ''));
          const obj: any = {};
          headers.forEach((header, index) => {
            obj[header] = values[index] || '';
          });
          return obj;
        }).filter(obj => Object.values(obj).some(v => v !== ''));
        resolve(data);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
};

export const generateProductTemplate = (): void => {
  const template = [
    { name: 'Product Name', sku: 'SKU001', description: 'Product Description', category_id: 'category-1', supplier_id: 'supplier-1', unit_price: 100, current_stock: 50, min_stock: 10, max_stock: 100, unit: 'pcs', location: 'A1-01' }
  ];
  exportDataToCSV(template, 'products-template');
};

export const generateCategoryTemplate = (): void => {
  const template = [
    { name: 'Category Name', description: 'Category Description', is_medicine: false }
  ];
  exportDataToCSV(template, 'categories-template');
};

export const generateSupplierTemplate = (): void => {
  const template = [
    { name: 'Supplier Name', email: 'supplier@example.com', phone: '+66 123 456 789', address: '123 Supplier Street, Bangkok, Thailand' }
  ];
  exportDataToCSV(template, 'suppliers-template');
};