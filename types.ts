
export type Language = 'fr' | 'en' | 'ar';

export interface Attachment {
  id: string;
  name: string;
  type: string;
  url: string; 
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  department: string;
  salary: number;
  status: 'active' | 'absent' | 'on_leave';
  joinDate: string;
  isClockedIn: boolean;
  photo?: string;
  email?: string;
  phone?: string;
  address?: string;
  bankAccount?: string; // RIB/IBAN
  attachments?: Attachment[];
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  type: 'Annuel' | 'Maladie' | 'Exceptionnel';
  startDate: string;
  endDate: string;
  status: 'pending' | 'approved' | 'rejected';
  reason?: string;
}

export interface Payslip {
  id: string;
  employeeId: string;
  month: string;
  year: number;
  netSalary: number;
  date: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  checkIn: string;
  checkOut?: string;
  date: string;
}

export type UserRole = 'admin' | 'cashier' | 'manager';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  initials: string;
  color: string;
  password?: string; // Ajouté pour la sécurité
}

export type ViewType = 
  | 'dashboard' | 'pos' | 'sales' | 'inventory' | 'expenses' | 'hr' | 'manage_hr' 
  | 'attendances' | 'settings' | 'invoicing' | 'reports' | 'logout' | 'switch_account' 
  | 'manage_categories' | 'manage_security' | 'manage_inventory' | 'manage_invoicing'
  | 'manage_notifications' | 'manage_sales' | 'customers' | 'manage_customers' | 'manage_users';

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
  showLogoOnInvoice: boolean;
  showSloganOnInvoice: boolean;
  showAddressOnInvoice: boolean;
  showPhoneOnInvoice: boolean;
  showEmailOnInvoice: boolean;
  showRegNumberOnInvoice: boolean;
  showQrCodeOnInvoice: boolean;
}

export interface SaleItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
}

export type PaymentMethod = 'Bankily' | 'Masrvi' | 'Especes' | 'Sedad' | 'Bimbank' | 'Carte' | 'Mobile' | 'Compte';

export interface SalePayment {
  method: PaymentMethod;
  amount: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  balance: number; // Solde du compte (positif = crédit, négatif = dette)
  email?: string;
}

export interface SaleOrder {
  id: string;
  customer: string;
  customerId?: string;
  date: string;
  total: number;
  status: 'draft' | 'confirmed' | 'delivered' | 'refunded' | 'quotation';
  items?: SaleItem[];
  invoiceStatus?: 'draft' | 'posted' | 'paid' | 'cancelled' | 'refunded';
  paymentMethod?: PaymentMethod;
  payments?: SalePayment[];
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
  difference?: number;
  status: 'open' | 'closed';
  cashierName: string;
  cashierId: string;
  totalCashSales: number;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  date: string;
  category: 'Loyer' | 'Électricité/Eau' | 'Salaires' | 'Marketing' | 'Maintenance' | 'Divers' | 'Achats Marchandises';
  paymentMethod: PaymentMethod;
  status: 'paid' | 'pending';
  supplierId?: string;
  attachments?: Attachment[];
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
}

export interface Supplier {
  id: string;
  name: string;
  contact: string;
  phone: string;
  category: string;
}

export interface RolePermission {
  role: UserRole;
  allowedViews: ViewType[];
}
