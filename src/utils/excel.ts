import * as XLSX from 'xlsx';

export function exportToExcel(data: any[], fileName: string, sheetName = 'Sheet1') {
  if (!data || data.length === 0) {
    alert('No data available to export.');
    return;
  }
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, `${fileName}_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export function parseExcelFile(file: File): Promise<{ headers: string[]; rows: any[] }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
        if (!json || json.length === 0) {
          resolve({ headers: [], rows: [] });
          return;
        }
        const headers = (json[0] || []).map((h: any) => String(h || '').trim());
        const dataRows = json.slice(1);
        const rows = dataRows
          .filter(row => row.some((val: any) => val !== null && val !== undefined && val !== ''))
          .map(row => {
            const obj: Record<string, any> = {};
            headers.forEach((header, idx) => {
              obj[header] = row[idx] !== undefined ? row[idx] : '';
            });
            return obj;
          });
        resolve({ headers, rows });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}

export const EXCEL_TEMPLATES: Record<string, { name: string; filename: string; columns: string[]; sampleRow: any }> = {
  inventory: {
    name: 'Master Inventory Template',
    filename: 'template_master_inventory.xlsx',
    columns: ['itemCode', 'itemName', 'category', 'subcategory', 'unit', 'warehouseLocation', 'openingStock', 'minimumLevel', 'reorderLevel', 'unitCost', 'supplierName', 'remarks'],
    sampleRow: {
      itemCode: 'INV-SAMPLE-01',
      itemName: 'Commercial Sanitizing Wipes',
      category: 'Cleaning Supplies',
      subcategory: 'Surface Disinfectant',
      unit: 'canisters (100 wipes)',
      warehouseLocation: 'Dry Store',
      openingStock: 25,
      minimumLevel: 10,
      reorderLevel: 20,
      unitCost: 1200,
      supplierName: 'CleanGuard Hygiene Solutions',
      remarks: 'Sample standard row'
    }
  },
  electrical: {
    name: 'Electrical & Power Items Template',
    filename: 'template_electrical_items.xlsx',
    columns: ['id', 'itemName', 'subcategory', 'brand', 'model', 'specification', 'voltage', 'quantity', 'unit', 'unitCost', 'serialNumber', 'installationDate', 'supplierName', 'warranty', 'condition', 'status', 'remarks'],
    sampleRow: {
      id: 'AST-ELC-SMP-01',
      itemName: 'Industrial Exhaust Fan 18 Inch',
      subcategory: 'Ventilation & Fans',
      brand: 'Pak Fans Commercial',
      model: 'PF-EXH-18-HD',
      specification: '220V 1400 RPM Heavy duty copper winding',
      voltage: '220V',
      quantity: 4,
      unit: 'units',
      unitCost: 14500,
      serialNumber: 'PF-2026-90',
      installationDate: '2026-03-01',
      supplierName: 'Pak Lighting Solutions',
      warranty: '2 Years',
      condition: 'Brand New',
      status: 'In Use',
      remarks: 'Kitchen smoke extraction'
    }
  },
  lighting: {
    name: 'Lighting Fixtures Template',
    filename: 'template_lighting_fixtures.xlsx',
    columns: ['id', 'itemName', 'subcategory', 'brand', 'model', 'wattage', 'quantity', 'unit', 'unitCost', 'installationDate', 'supplierName', 'warranty', 'condition', 'status', 'remarks'],
    sampleRow: {
      id: 'AST-LGT-SMP-01',
      itemName: 'Track Spotlight 24W Warm White',
      subcategory: 'Track Lights',
      brand: 'Philips Master',
      model: 'PHL-TRK-24W',
      wattage: '24W',
      quantity: 18,
      unit: 'units',
      unitCost: 3200,
      installationDate: '2026-02-20',
      supplierName: 'Pak Lighting Solutions',
      warranty: '2 Years',
      condition: 'Brand New',
      status: 'In Use',
      remarks: 'Aiming at art walls and food presentation counter'
    }
  },
  hvac: {
    name: 'AC & HVAC Equipment Template',
    filename: 'template_hvac_ac.xlsx',
    columns: ['id', 'itemName', 'subcategory', 'brand', 'model', 'capacity', 'tonnage', 'quantity', 'unitCost', 'installationDate', 'supplierName', 'warranty', 'condition', 'status', 'remarks'],
    sampleRow: {
      id: 'AST-HVC-SMP-01',
      itemName: '1.5 Ton DC Inverter Split AC',
      subcategory: 'Inverter Split AC',
      brand: 'Orient',
      model: 'Ultron Bold 1.5 Ton T3',
      capacity: '18000 BTU',
      tonnage: '1.5 Ton',
      quantity: 2,
      unitCost: 165000,
      installationDate: '2026-02-25',
      supplierName: 'Karachi Air Conditioners',
      warranty: '5 Years Compressor',
      condition: 'Brand New',
      status: 'In Use',
      remarks: 'Manager office and staff breakroom'
    }
  },
  furniture: {
    name: 'Furniture & Fixtures Template',
    filename: 'template_furniture.xlsx',
    columns: ['id', 'itemName', 'subcategory', 'material', 'size', 'color', 'brand', 'quantity', 'unitCost', 'supplierName', 'condition', 'status', 'remarks'],
    sampleRow: {
      id: 'AST-FUR-SMP-01',
      itemName: 'High Bar Stools with Backrest',
      subcategory: 'Bar Seating',
      material: 'Steel Frame & Vegan Leather',
      size: 'Height 750mm',
      color: 'Matte Black & Cognac Brown',
      brand: 'Master Craft',
      quantity: 8,
      unitCost: 11500,
      supplierName: 'Master Foam & Furniture',
      condition: 'Brand New',
      status: 'In Use',
      remarks: 'Beverage bar counter stools'
    }
  },
  kitchen: {
    name: 'Kitchen Equipment Template',
    filename: 'template_kitchen_equipment.xlsx',
    columns: ['id', 'itemName', 'subcategory', 'brand', 'model', 'specification', 'capacity', 'quantity', 'unitCost', 'serialNumber', 'supplierName', 'warranty', 'condition', 'status', 'remarks'],
    sampleRow: {
      id: 'AST-KIT-SMP-01',
      itemName: 'Stainless Steel Double Bowl Sink Table',
      subcategory: 'Washing & Prep',
      brand: 'Al-Rehman Custom Fabricated',
      model: 'ARC-SS-DB-1800',
      specification: 'SS 304 16 Gauge with faucet backsplash and undershelf',
      capacity: '1800 x 700 mm',
      quantity: 2,
      unitCost: 85000,
      serialNumber: 'ARC-2026-SS09',
      supplierName: 'Al-Rehman Stainless Steel',
      warranty: '3 Years Structural',
      condition: 'Brand New',
      status: 'In Use',
      remarks: 'Dishwashing area'
    }
  },
  it_pos: {
    name: 'IT & POS Hardware Template',
    filename: 'template_it_pos.xlsx',
    columns: ['id', 'itemName', 'subcategory', 'brand', 'model', 'specification', 'quantity', 'unitCost', 'serialNumber', 'ipAddress', 'supplierName', 'warranty', 'condition', 'status', 'remarks'],
    sampleRow: {
      id: 'AST-ITP-SMP-01',
      itemName: 'Cash Drawer Heavy Duty 5-Note 8-Coin',
      subcategory: 'Cash Drawers',
      brand: 'Sunmi / Posiflex',
      model: 'CR-4100 RJ11 Port',
      specification: 'Metal construction, dual media slots, RJ11 auto kick trigger',
      quantity: 2,
      unitCost: 18500,
      serialNumber: 'CD-2026-11',
      ipAddress: 'N/A',
      supplierName: 'Apex IT Solutions',
      warranty: '1 Year',
      condition: 'Brand New',
      status: 'In Use',
      remarks: 'Connected to receipt printer auto-pop'
    }
  },
  construction: {
    name: 'Building & Construction Costing Template',
    filename: 'template_construction_costing.xlsx',
    columns: ['id', 'date', 'category', 'subcategory', 'description', 'workArea', 'vendorContractor', 'quantity', 'unit', 'unitRate', 'materialCost', 'labourCost', 'otherCost', 'paymentStatus', 'paidAmount', 'invoiceRefNumber', 'remarks'],
    sampleRow: {
      id: 'cst-smp-01',
      date: '2026-03-01',
      category: 'Painting',
      subcategory: 'Anti-fungal Interior Paint',
      description: 'Supply and 3 coats of Jotun Fenomastic silk paint with primer',
      workArea: 'Main Dining Hall',
      vendorContractor: 'Elite Painters & Decorators',
      quantity: 4500,
      unit: 'sqft',
      unitRate: 85,
      materialCost: 260000,
      labourCost: 120000,
      otherCost: 2500,
      paymentStatus: 'Paid',
      paidAmount: 382500,
      invoiceRefNumber: 'INV-EPD-90',
      remarks: 'Color scheme: Warm Greige & Soft Off-White'
    }
  },
  purchases: {
    name: 'Purchases Template',
    filename: 'template_purchases.xlsx',
    columns: ['poNumber', 'date', 'supplierName', 'category', 'subtotal', 'discount', 'tax', 'grandTotal', 'paymentStatus', 'paidAmount', 'deliveryStatus', 'invoiceNumber', 'notes'],
    sampleRow: {
      poNumber: 'PO-2026-SAMPLE',
      date: '2026-03-01',
      supplierName: 'Pak Lighting Solutions',
      category: 'Electrical & Lighting',
      subtotal: 100000,
      discount: 5000,
      tax: 15200,
      grandTotal: 110200,
      paymentStatus: 'Paid',
      paidAmount: 110200,
      deliveryStatus: 'Received',
      invoiceNumber: 'INV-PLE-SMP',
      notes: 'Sample purchase order'
    }
  },
  expenses: {
    name: 'Expenses Template',
    filename: 'template_expenses.xlsx',
    columns: ['date', 'category', 'description', 'amount', 'paidBy', 'paymentMethod', 'vendor', 'referenceNumber', 'remarks'],
    sampleRow: {
      date: '2026-03-05',
      category: 'Maintenance',
      description: 'Kitchen exhaust duct cleaning and filter replacement',
      amount: 35000,
      paidBy: 'Tariq Mehmood',
      paymentMethod: 'Cash',
      vendor: 'FreshAir Duct Services',
      referenceNumber: 'VOUCH-D-22',
      remarks: 'Quarterly compliance cleaning'
    }
  }
};

export function downloadTemplate(templateKey: string) {
  const config = EXCEL_TEMPLATES[templateKey];
  if (!config) return;
  const worksheet = XLSX.utils.json_to_sheet([config.sampleRow], { header: config.columns });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');
  XLSX.writeFile(workbook, config.filename);
}
