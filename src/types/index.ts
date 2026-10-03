export type UserRole = 'super_admin' | 'admin' | 'staff';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  assignedBranchIds: string[]; // ['all'] or array of branch IDs
  phone?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt?: string;
}

export type BranchStatus = 'Planning' | 'Under Construction' | 'Setup in Progress' | 'Operational' | 'Closed';

export interface Branch {
  id: string;
  code: string;
  name: string;
  address: string;
  city: string;
  province: string;
  contactNumber: string;
  branchManager: string;
  openingDate: string;
  status: BranchStatus;
  notes: string;
  logoUrl?: string;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

export type ProjectStatus = 'Planning' | 'In Progress' | 'Near Completion' | 'Completed' | 'On Hold';

export interface Project {
  id: string;
  branchId: string;
  projectName: string;
  startDate: string;
  expectedCompletionDate: string;
  actualCompletionDate?: string;
  projectManager: string;
  status: ProjectStatus;
  estimatedBudget: number;
  actualCost: number;
  remainingBudget: number;
  progressPercent: number;
  notes: string;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

export interface LocationArea {
  id: string;
  branchId: string;
  name: string;
  code: string;
  description?: string;
}

export type ConstructionCategory =
  | 'Civil Work'
  | 'Flooring'
  | 'Ceiling'
  | 'Painting'
  | 'Glass Work'
  | 'Aluminum Work'
  | 'Carpentry'
  | 'Plumbing'
  | 'Electrical Work'
  | 'Masonry'
  | 'Signage'
  | 'Interior Work'
  | 'Exterior Work'
  | 'Labour'
  | 'Transportation'
  | 'Other Construction Work';

export type PaymentStatus = 'Paid' | 'Unpaid' | 'Partial';

export interface ConstructionCost {
  id: string;
  branchId: string;
  date: string;
  category: ConstructionCategory;
  subcategory?: string;
  description: string;
  workArea: string;
  vendorContractor: string;
  quantity: number;
  unit: string;
  unitRate: number;
  labourCost: number;
  materialCost: number;
  otherCost: number;
  totalCost: number;
  paymentStatus: PaymentStatus;
  paidAmount: number;
  invoiceRefNumber: string;
  remarks: string;
  attachmentName?: string;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

export type AssetCategory =
  | 'electrical'
  | 'lighting'
  | 'hvac'
  | 'furniture'
  | 'kitchen'
  | 'it_pos'
  | 'general';

export type AssetCondition = 'Brand New' | 'Good' | 'Fair' | 'Needs Repair' | 'Damaged';

export type AssetStatus =
  | 'New'
  | 'In Use'
  | 'Available'
  | 'Under Maintenance'
  | 'Damaged'
  | 'Lost'
  | 'Disposed';

export interface Asset {
  id: string;
  branchId: string;
  locationId: string;
  locationName: string;
  category: AssetCategory;
  subcategory: string;
  itemName: string;
  brand: string;
  model: string;
  specification: string;
  wattage?: string;
  voltage?: string;
  capacity?: string;
  tonnage?: string;
  material?: string;
  size?: string;
  color?: string;
  quantity: number;
  unit: string;
  unitCost: number;
  totalCost: number;
  serialNumber: string;
  installationDate: string;
  supplierId?: string;
  supplierName: string;
  invoiceNumber: string;
  warranty: string;
  warrantyExpiryDate?: string;
  condition: AssetCondition;
  status: AssetStatus;
  assignedTo?: string;
  ipAddress?: string;
  lastMaintenanceDate?: string;
  nextMaintenanceDate?: string;
  remarks: string;
  photoUrl?: string;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

export interface InventoryItem {
  id: string;
  itemCode: string;
  itemName: string;
  category: string;
  subcategory?: string;
  unit: string;
  branchId: string;
  warehouseLocation: string;
  openingStock: number;
  stockIn: number;
  stockOut: number;
  adjustments: number;
  currentStock: number;
  minimumLevel: number;
  reorderLevel: number;
  unitCost: number;
  stockValue: number;
  supplierName: string;
  remarks: string;
  createdAt: string;
  updatedAt: string;
}

export type StockTransactionType = 'STOCK_IN' | 'STOCK_OUT' | 'TRANSFER' | 'ADJUSTMENT';

export interface StockTransaction {
  id: string;
  inventoryItemId: string;
  itemName: string;
  branchId: string;
  transactionType: StockTransactionType;
  quantity: number;
  reason: string;
  targetBranchId?: string;
  referenceNumber: string;
  performedBy: string;
  date: string;
}

export interface PurchaseOrderItem {
  itemName: string;
  specification?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discount: number;
  taxPercent: number;
  total: number;
}

export type DeliveryStatus = 'Draft' | 'Ordered' | 'Partially Received' | 'Received' | 'Cancelled';

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  date: string;
  branchId: string;
  supplierId: string;
  supplierName: string;
  category: string;
  items: PurchaseOrderItem[];
  subtotal: number;
  discount: number;
  tax: number;
  grandTotal: number;
  paymentStatus: PaymentStatus;
  paidAmount: number;
  deliveryStatus: DeliveryStatus;
  invoiceNumber: string;
  notes: string;
  createdAt: string;
  createdBy: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  ntnTaxNumber: string;
  paymentTerms: string;
  category: string;
  notes: string;
  totalPurchases: number;
  paidAmount: number;
  outstandingAmount: number;
  createdAt: string;
}

export type ExpenseCategory =
  | 'Construction'
  | 'Electrical'
  | 'Furniture'
  | 'HVAC'
  | 'Kitchen'
  | 'IT'
  | 'Labour'
  | 'Transportation'
  | 'Rent'
  | 'Utilities'
  | 'Maintenance'
  | 'Other';

export interface Expense {
  id: string;
  branchId: string;
  date: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  paidBy: string;
  paymentMethod: 'Bank Transfer' | 'Cash' | 'Cheque' | 'Credit Card' | 'Online';
  vendor: string;
  referenceNumber: string;
  remarks: string;
  attachmentName?: string;
  createdAt: string;
  createdBy: string;
}

export interface DocumentAttachment {
  id: string;
  branchId: string;
  module: 'Asset' | 'Construction' | 'Purchase' | 'Expense' | 'Branch' | 'General';
  recordId?: string;
  title: string;
  documentType: 'Invoice' | 'Quotation' | 'Warranty Card' | 'Photo' | 'Contract' | 'Challan' | 'Other';
  fileName: string;
  fileSize: string;
  notes: string;
  uploadedBy: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userName: string;
  userRole: string;
  action: 'Created' | 'Updated' | 'Deleted' | 'Imported' | 'Exported' | 'Transferred';
  module: string;
  recordId: string;
  summary: string;
  timestamp: string;
}

export interface SystemSettings {
  companyName: string;
  companyTagline: string;
  currency: string;
  currencySymbol: string;
  taxRate: number;
  dateFormat: string;
  lowStockThreshold: number;
  warrantyAlertDays: number;
  maintenanceAlertDays: number;
}

export interface RecipeIngredient {
  inventoryItemId?: string;
  itemName: string;
  quantity: number;
  unit: string;
  unitCost: number;
  totalCost: number;
}

export interface Recipe {
  id: string;
  recipeCode: string;
  name: string;
  category: 'Mains' | 'Starters' | 'Beverages' | 'Desserts' | 'Bakery' | 'Sauces & Bases';
  portionYield: number;
  yieldUnit: string;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  ingredients: RecipeIngredient[];
  totalFoodCost: number;
  packagingCost: number;
  overheadCost: number;
  totalCostPerPortion: number;
  suggestedSellingPrice: number;
  sellingPrice: number;
  targetFoodCostPercent: number; // e.g. 28 - 32%
  actualFoodCostPercent: number; // calculated
  grossProfit: number;
  grossMarginPercent: number;
  branchAvailability: string[]; // ['all'] or array of branchIds
  instructions: string;
  status: 'active' | 'draft' | 'archived';
  createdAt: string;
  updatedAt: string;
}

export type BrandedDocType = 'inspection_sheet' | 'contractor_voucher' | 'asset_handover';

