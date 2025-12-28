
export interface Lead {
  id: string;
  name: string;
  company: string;
  value: number;
  status: 'new' | 'qualified' | 'proposition' | 'won' | 'lost';
  contact: string;
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
}

export type PaymentMethod = 'Bankily' | 'Masrvi' | 'Especes' | 'Sedad' | 'Bimbank';

export interface SaleOrder {
  id: string;
  customer: string;
  date: string;
  total: number;
  status: 'quotation' | 'confirmed' | 'delivered' | 'refunded';
  items?: SaleItem[];
  invoiceStatus?: 'draft' | 'posted' | 'paid' | 'cancelled' | 'refunded';
  paymentMethod?: PaymentMethod;
  amountReceived?: number;
  change?: number;
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
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  department: 'Cuisine' | 'Salle' | 'Livraison' | 'Administration';
  salary: number;
  status: 'active' | 'on-leave' | 'absent';
  joinDate: string;
  isClockedIn?: boolean;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  checkIn: string;
  checkOut?: string;
  date: string;
}

export interface ERPConfig {
  companyName: string;
  companySlogan: string;
  email: string;
  phone: string;
  address: string;
  currency: string;
  taxRate: number;
  receiptFooter: string;
  autoPrintReceipt: boolean;
}

export type UserRole = 'admin' | 'cashier' | 'manager';

export interface RolePermission {
  role: UserRole;
  allowedViews: ViewType[];
}

export type ViewType = 'dashboard' | 'invoicing' | 'sales' | 'inventory' | 'reports' | 'pos' | 'settings' | 'hr';
