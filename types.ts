
export type Language = 'fr' | 'en' | 'ar';

export interface Attachment {
  id: string;
  name: string;
  type: string;
  url: string; // Base64 ou URL blob
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  initials: string;
  color: string;
}

export interface Lead {
  id: string;
  name: string;
  company?: string;
  value?: number;
  status: string;
  contact?: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  category: string;
  lowStockThreshold?: number; 
}

export interface Purchase {
  id: string;
  productId: string;
  productName: string;
  supplierId: string;
  supplierName: string;
  quantity: number;
  costPrice: number;
  totalAmount: number;
  date: string;
  status: 'received' | 'pending';
  attachments?: Attachment[];
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  date: string;
  category: 'Loyer' | 'Électricité/Eau' | 'Salaires' | 'Marketing' | 'Maintenance' | 'Divers' | 'Achats Marchandises';
  paymentMethod: PaymentMethod;
  supplierId?: string;
  status: 'paid' | 'pending';
  attachments?: Attachment[];
}

export interface Supplier {
  id: string;
  name: string;
  contact: string;
  phone: string;
  category: string;
}

export interface Task {
  id: string;
  title: string;
  project: string;
  status: 'todo' | 'in-progress' | 'done';
  assignee: string;
}

export interface SaleItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  notes?: string;
}

export type PaymentMethod = 'Bankily' | 'Masrvi' | 'Especes' | 'Sedad' | 'Bimbank' | 'Carte' | 'Mobile';

export interface SaleOrder {
  id: string;
  customer: string;
  date: string;
  total: number;
  status: 'draft' | 'confirmed' | 'delivered' | 'refunded' | 'quotation';
  items?: SaleItem[];
  invoiceStatus?: 'draft' | 'posted' | 'paid' | 'cancelled' | 'refunded';
  paymentMethod?: PaymentMethod;
  amountReceived?: number;
  change?: number;
  orderLocation?: string;
  attachments?: Attachment[];
}

export interface CashSession {
  id: string;
  openedAt: string;
  closedAt?: string;
  openingBalance: number;
  expectedBalance: number;
  closingBalance?: number;
  status: 'open' | 'closed';
  cashierName: string;
  cashierId: string;
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  department: string;
  salary: number;
  status: 'active' | 'absent';
  joinDate: string;
  isClockedIn: boolean;
  attachments?: Attachment[];
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  checkIn: string;
  checkOut?: string;
  date: string;
}

export type AppTheme = 'purple' | 'emerald' | 'blue' | 'rose' | 'amber' | 'slate';

export interface ERPConfig {
  companyName: string;
  companySlogan: string;
  email: string;
  phone: string;
  address: string;
  registrationNumber: string;
  currency: string;
  taxRate: number;
  receiptFooter: string;
  autoPrintReceipt: boolean;
  invoicePrefix: string;
  nextInvoiceNumber: number;
  theme: AppTheme;
  categories: string[];
  language: Language;
}

export type UserRole = 'admin' | 'cashier' | 'manager';

export interface RolePermission {
  role: UserRole;
  allowedViews: ViewType[];
}

export type ViewType = 
  | 'dashboard' | 'pos' | 'sales' | 'inventory' | 'expenses' | 'hr' | 'manage_hr' 
  | 'attendances' | 'settings' | 'invoicing' | 'reports' | 'logout' | 'switch_account' 
  | 'manage_categories' | 'manage_security' | 'manage_inventory' | 'manage_invoicing';
