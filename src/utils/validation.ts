import { z } from 'zod';

/**
 * Enterprise Form Validation Schemas using Zod for RestoSetup ERP (MK Innovexa)
 */

export const branchSchema = z.object({
  code: z.string().min(2, 'Branch code is required (e.g. BR-01)'),
  name: z.string().min(3, 'Branch name must be at least 3 characters'),
  city: z.string().min(2, 'City is required'),
  address: z.string().min(5, 'Full street address is required'),
  status: z.enum(['Operational', 'Setup in Progress', 'Under Construction', 'Planning', 'Closed']),
  openingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Opening date must be in YYYY-MM-DD format'),
  contactNumber: z.string().min(7, 'A valid contact phone number is required'),
  branchManager: z.string().min(2, 'Branch manager name is required')
});

export const projectSchema = z.object({
  projectName: z.string().min(3, 'Project name is required'),
  branchId: z.string().min(1, 'Target branch must be selected'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Valid start date (YYYY-MM-DD) is required'),
  expectedCompletionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Valid target completion date is required'),
  estimatedBudget: z.number().min(0, 'Estimated budget cannot be negative'),
  status: z.enum(['Planning', 'In Progress', 'Testing', 'Handed Over', 'Completed', 'On Hold'])
});

export const assetSchema = z.object({
  itemName: z.string().min(2, 'Asset item name is required'),
  branchId: z.string().min(1, 'Assigned branch is required'),
  category: z.string().min(1, 'Category is required'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  unitCost: z.number().min(0, 'Unit cost cannot be negative'),
  condition: z.enum(['New', 'Good', 'Fair', 'Needs Maintenance', 'Under Repair', 'Damaged', 'Scrapped']),
  status: z.enum(['Operational', 'In Storage', 'Under Maintenance', 'Decommissioned', 'Pending Installation', 'Disposed'])
});

export const inventoryItemSchema = z.object({
  itemCode: z.string().min(2, 'Item code is required'),
  itemName: z.string().min(2, 'Item description is required'),
  category: z.string().min(1, 'Category is required'),
  branchId: z.string().min(1, 'Branch selection is required'),
  unit: z.string().min(1, 'Unit of measurement is required'),
  unitCost: z.number().min(0, 'Unit cost cannot be negative'),
  openingStock: z.number().min(0, 'Opening stock cannot be negative'),
  minimumLevel: z.number().min(0, 'Minimum alert level cannot be negative')
});

export const purchaseOrderSchema = z.object({
  poNumber: z.string().min(3, 'PO Number is required'),
  supplierName: z.string().min(2, 'Supplier name is required'),
  branchId: z.string().min(1, 'Target branch is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date format must be YYYY-MM-DD'),
  paymentStatus: z.enum(['Unpaid', 'Partial', 'Paid']),
  deliveryStatus: z.enum(['Pending', 'Partial', 'Received', 'Cancelled']),
  subtotal: z.number().min(0, 'Subtotal cannot be negative')
});

export const supplierSchema = z.object({
  name: z.string().min(2, 'Company/Vendor name is required'),
  category: z.string().min(2, 'Service category is required'),
  contactPerson: z.string().min(2, 'Contact person is required'),
  phone: z.string().min(7, 'Valid contact telephone number is required'),
  city: z.string().min(2, 'City is required')
});

export const expenseSchema = z.object({
  branchId: z.string().min(1, 'Target branch is required'),
  category: z.string().min(1, 'Expense category is required'),
  description: z.string().min(3, 'Expense description is required'),
  amount: z.number().min(1, 'Expense amount must be greater than zero'),
  paidBy: z.string().min(2, 'Payer name/designation is required'),
  paymentMethod: z.string().min(2, 'Payment method is required')
});

export const recipeSchema = z.object({
  recipeCode: z.string().min(2, 'Recipe code is required'),
  name: z.string().min(2, 'Menu item name is required'),
  category: z.string().min(1, 'Category is required'),
  portionYield: z.number().min(1, 'Portion yield must be at least 1'),
  sellingPrice: z.number().min(0, 'Selling price cannot be negative')
});

export const locationSchema = z.object({
  name: z.string().min(2, 'Location/Room name is required'),
  code: z.string().min(2, 'Area code is required'),
  branchId: z.string().min(1, 'Branch assignment is required')
});

export const constructionCostSchema = z.object({
  branchId: z.string().min(1, 'Target branch is required'),
  category: z.string().min(1, 'Construction milestone category is required'),
  description: z.string().min(3, 'Scope description is required'),
  totalCost: z.number().min(0, 'Total cost cannot be negative'),
  vendorContractor: z.string().min(2, 'Contractor name is required')
});

/**
 * Universal validation helper that returns field-level error messages
 */
export function validateForm<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: Record<string, string> } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const path = issue.path.join('.');
    if (path && !errors[path]) {
      errors[path] = issue.message;
    }
  }

  return { success: false, errors };
}
