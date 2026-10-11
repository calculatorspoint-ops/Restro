export type UserRole = 'super_manager' | 'super_admin' | 'manager' | 'admin' | 'staff';

export function isSuperManagerRole(role?: string): boolean {
  if (!role || typeof role !== 'string') return false;
  const normalized = role.toLowerCase().replace(/[\s-]/g, '_');
  return normalized === 'super_manager' || normalized === 'super_admin';
}

export function isManagerRole(role?: string): boolean {
  if (!role || typeof role !== 'string') return false;
  const normalized = role.toLowerCase().replace(/[\s-]/g, '_');
  return normalized === 'manager' || normalized === 'admin' || isSuperManagerRole(role);
}

export function isStaffRole(role?: string): boolean {
  if (!role || typeof role !== 'string') return false;
  const normalized = role.toLowerCase().replace(/[\s-]/g, '_');
  return normalized === 'staff' && !isSuperManagerRole(role) && !isManagerRole(role);
}

export function getRoleDisplayName(role?: string, isMasterAdmin?: boolean): string {
  if (isMasterAdmin) return 'Super Manager';
  if (!role) return 'Staff';
  if (isSuperManagerRole(role)) return 'Super Manager';
  if (isManagerRole(role)) return 'Manager';
  return 'Staff';
}

/**
 * Granular Permissions Architecture
 */
export interface CrudPermissions {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
}

export interface AppPermissions {
  dashboard: { view: boolean };
  branches: CrudPermissions;
  projects: CrudPermissions;
  construction: CrudPermissions;
  assets: CrudPermissions;
  inventory: CrudPermissions;
  purchases: CrudPermissions & { approve: boolean };
  suppliers: CrudPermissions;
  expenses: CrudPermissions;
  recipes: CrudPermissions;
  locations: CrudPermissions;
  handover: CrudPermissions;
  documents: CrudPermissions;
  reports: { view: boolean; export: boolean };
  excel: { import: boolean; export: boolean };
  audit: { view: boolean };
  users: CrudPermissions & { manage_roles: boolean; manage_permissions: boolean };
  settings: { view: boolean; edit: boolean };
}

export type PermissionModuleName = keyof AppPermissions;

export interface User {
  id: string;
  userId?: string; // Tenant/owner user ID
  name: string;
  email: string;
  role: UserRole;
  isMasterAdmin?: boolean; // Protected Master Admin permanent flag
  assignedBranchIds: string[]; // ['all'] or array of branch IDs
  phone?: string;
  status: 'active' | 'inactive';
  permissions?: AppPermissions; // Computed effective permissions
  customPermissionOverrides?: Partial<Record<string, Record<string, boolean>>>; // Optional overrides
  password?: string; // Optional user password for credentials management
  passwordLastChangedAt?: string; // Timestamp of last password change
  mustChangePassword?: boolean; // Flag to require password change upon next login
  firebaseUid?: string; // Linked Firebase Authentication UID
  firebaseAuthSynced?: boolean; // Whether account credentials exist in Firebase Authentication
  createdAt: string;
  updatedAt?: string;
}

export type BranchStatus = 'Planning' | 'Under Construction' | 'Setup in Progress' | 'Operational' | 'Closed';

export interface Branch {
  id: string;
  userId?: string;
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
  userId?: string;
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
  userId?: string;
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
  userId?: string;
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
  userId?: string;
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
  userId?: string;
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
  userId?: string;
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
  userId?: string;
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
  userId?: string;
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
  userId?: string;
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
  userId?: string;
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
  userId?: string;
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
  userId?: string;
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

