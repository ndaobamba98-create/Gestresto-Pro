
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
}

export type UserRole = 'admin' | 'cashier' | 'manager';

export interface RolePermission {
  role: UserRole;
  allowedViews: ViewType[];
}

export type ViewType = 'dashboard' | 'pos' | 'sales' | 'inventory' | 'hr' | 'attendances' | 'settings' | 'invoicing' | 'reports' | 'logout' | 'switch_account' | 'manage_categories';
