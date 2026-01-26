
import { Product, Employee, ERPConfig, User, Customer, Lead, Task } from './types';

export const APP_USERS: User[] = [
  { id: 'U001', name: 'Bamba Ndao', role: 'admin', initials: 'BN', color: 'from-slate-700 to-slate-900', password: '1234' },
  { id: 'U002', name: 'Amy Ndaw', role: 'cashier', initials: 'AN', color: 'from-emerald-600 to-emerald-800', password: '0000' },
];

export const INITIAL_CONFIG: ERPConfig = {
  companyName: "FAST FOOD MYA D'OR",
  companySlogan: "Le goût qui vaut de l'or",
  email: 'restaurationsfastfoodmyador@gmail.com',
  phone: '+222 43 85 27 44',
  address: "À côté de l'Hôpital Basra, Nouakchott",
  registrationNumber: 'RC-NKC-2025-B123',
  currency: 'MRU',
  taxRate: 0,
  receiptFooter: 'Merci de votre visite chez MYA D\'OR !',
  autoPrintReceipt: true,
  invoicePrefix: 'FAC/2025/',
  nextInvoiceNumber: 1,
  theme: 'purple',
  categories: [
    'Déjeuner & Dîner', 'Fast Food', 'Dessert & Boissons'
  ],
  language: 'fr',
  showLogoOnInvoice: true,
  showSloganOnInvoice: true,
  showAddressOnInvoice: true,
  showPhoneOnInvoice: true,
  showEmailOnInvoice: true,
  showRegNumberOnInvoice: true,
  showQrCodeOnInvoice: true
};

export const INITIAL_CUSTOMERS: Customer[] = [
  { id: 'C001', name: 'Client de passage', phone: '00000000', balance: 0 },
];

export const INITIAL_PRODUCTS: Product[] = [
  // --- DÉJEUNER & DÎNER ---
  { id: 'DD001', name: 'RIZ AU POISSON', sku: 'DD-01', price: 50, stock: 999, category: 'Déjeuner & Dîner' },
  { id: 'DD002', name: 'YASSA (POULET/VIANDE/POISSON)', sku: 'DD-02', price: 50, stock: 999, category: 'Déjeuner & Dîner' },
  { id: 'DD003', name: 'SOUP KANDIA', sku: 'DD-03', price: 50, stock: 999, category: 'Déjeuner & Dîner' },
  { id: 'DD004', name: 'MAFÉ', sku: 'DD-04', price: 50, stock: 999, category: 'Déjeuner & Dîner' },
  { id: 'DD005', name: 'MBAXAL', sku: 'DD-05', price: 50, stock: 999, category: 'Déjeuner & Dîner' },
  { id: 'DD006', name: 'FIRIRE (PETIT)', sku: 'DD-06', price: 50, stock: 999, category: 'Déjeuner & Dîner' },
  { id: 'DD007', name: 'FIRIRE (GRAND)', sku: 'DD-07', price: 80, stock: 999, category: 'Déjeuner & Dîner' },
  { id: 'DD008', name: 'NIÉBÉ (PETIT)', sku: 'DD-08', price: 20, stock: 999, category: 'Déjeuner & Dîner' },
  { id: 'DD009', name: 'NIÉBÉ (MOYEN)', sku: 'DD-09', price: 30, stock: 999, category: 'Déjeuner & Dîner' },
  { id: 'DD010', name: 'VERMICELLES', sku: 'DD-10', price: 50, stock: 999, category: 'Déjeuner & Dîner' },
  { id: 'DD011', name: 'MBAXAL SALOUM', sku: 'DD-11', price: 50, stock: 999, category: 'Déjeuner & Dîner' },
  { id: 'DD012', name: 'POULET COMPLET', sku: 'DD-12', price: 400, stock: 999, category: 'Déjeuner & Dîner' },
  { id: 'DD013', name: '1/2 POULET', sku: 'DD-13', price: 200, stock: 999, category: 'Déjeuner & Dîner' },
  { id: 'DD014', name: '1/4 POULET', sku: 'DD-14', price: 100, stock: 999, category: 'Déjeuner & Dîner' },
  { id: 'DD015', name: 'FRITES', sku: 'DD-15', price: 50, stock: 999, category: 'Déjeuner & Dîner' },

  // --- FAST FOOD ---
  { id: 'FF001', name: 'TACOS VIANDE', sku: 'FF-01', price: 100, stock: 999, category: 'Fast Food' },
  { id: 'FF002', name: 'TACOS POULET', sku: 'FF-02', price: 100, stock: 999, category: 'Fast Food' },
  { id: 'FF003', name: 'TACOS ROYAL', sku: 'FF-03', price: 150, stock: 999, category: 'Fast Food' },
  { id: 'FF004', name: 'TACOS MIXTE (POULET+VIANDE)', sku: 'FF-04', price: 150, stock: 999, category: 'Fast Food' },
  { id: 'FF005', name: 'KEBAB', sku: 'FF-05', price: 50, stock: 999, category: 'Fast Food' },
  { id: 'FF006', name: 'KEBAB SPÉCIAL', sku: 'FF-06', price: 70, stock: 999, category: 'Fast Food' },
  { id: 'FF007', name: 'SANDWICH (PETIT)', sku: 'FF-07', price: 30, stock: 999, category: 'Fast Food' },
  { id: 'FF008', name: 'SANDWICH (GRAND)', sku: 'FF-08', price: 50, stock: 999, category: 'Fast Food' },
  { id: 'FF009', name: 'HAMBURGER', sku: 'FF-09', price: 100, stock: 999, category: 'Fast Food' },
  { id: 'FF010', name: 'PIZZA', sku: 'FF-10', price: 150, stock: 999, category: 'Fast Food' },
  { id: 'FF011', name: 'MINI PIZZA', sku: 'FF-11', price: 15, stock: 999, category: 'Fast Food' },
  { id: 'FF012', name: 'FATAYA', sku: 'FF-12', price: 10, stock: 999, category: 'Fast Food' },
  { id: 'FF013', name: 'NEME', sku: 'FF-13', price: 15, stock: 999, category: 'Fast Food' },
  { id: 'FF014', name: 'ROUSSOL', sku: 'FF-14', price: 10, stock: 999, category: 'Fast Food' },

  // --- DESSERT & BOISSONS ---
  { id: 'DB001', name: 'JUS (BISAP/BOUYE/ETC)', sku: 'DB-01', price: 20, stock: 999, category: 'Dessert & Boissons' },
  { id: 'DB002', name: 'BOISSONS (COCA/FANTA/SPRITE)', sku: 'DB-02', price: 20, stock: 999, category: 'Dessert & Boissons' },
  { id: 'DB003', name: 'MOJITO', sku: 'DB-03', price: 50, stock: 999, category: 'Dessert & Boissons' },
  { id: 'DB004', name: 'EAU', sku: 'DB-04', price: 10, stock: 999, category: 'Dessert & Boissons' },
  { id: 'DB005', name: 'CAFÉ TOUBA', sku: 'DB-05', price: 10, stock: 999, category: 'Dessert & Boissons' },
  { id: 'DB006', name: 'CAFÉ AU LAIT', sku: 'DB-06', price: 20, stock: 999, category: 'Dessert & Boissons' },
  { id: 'DB007', name: 'EXPRESSO', sku: 'DB-07', price: 50, stock: 999, category: 'Dessert & Boissons' },
  { id: 'DB008', name: 'CAPPUCCINO', sku: 'DB-08', price: 70, stock: 999, category: 'Dessert & Boissons' },
  { id: 'DB009', name: 'ICE COFFEE', sku: 'DB-09', price: 80, stock: 999, category: 'Dessert & Boissons' },
  { id: 'DB010', name: 'SALADE DE FRUITS', sku: 'DB-10', price: 30, stock: 999, category: 'Dessert & Boissons' },
  { id: 'DB011', name: 'NGALAKH / THIACKRY', sku: 'DB-11', price: 20, stock: 999, category: 'Dessert & Boissons' },
  { id: 'DB012', name: 'LAKH', sku: 'DB-12', price: 50, stock: 999, category: 'Dessert & Boissons' }
];

export const INITIAL_EMPLOYEES: Employee[] = [
  { id: 'E001', name: 'Bamba Ndao', role: 'Administrateur', department: 'Direction', salary: 0, status: 'active', joinDate: '2025-01-01', isClockedIn: false },
  { id: 'E002', name: 'Amy Ndaw', role: 'Caissière', department: 'Salle', salary: 0, status: 'active', joinDate: '2025-01-01', isClockedIn: false },
];

export const INITIAL_LEADS: Lead[] = [
  { id: 'L001', title: 'Contrat Cantine', contact: 'Ecole Primaire A', stage: 'new', revenue: 5000, priority: 'high' }
];

export const INITIAL_TASKS: Task[] = [
  { id: 'T001', title: 'Réviser Menu', description: 'Ajouter des plats végétariens', stage: 'todo', priority: 'medium', deadline: '2025-02-15' }
];

export const POS_LOCATIONS = {
  tables: ['Table 1', 'Table 2', 'Table 3', 'Table 4', 'Table 5', 'Table 6'],
  bar: ['Comptoir 1', 'Comptoir 2', 'Comptoir 3'],
  takeaway: ['Emporter 1', 'Emporter 2', 'Emporter 3'],
  delivery: ['Livraison 1', 'Livraison 2'],
  default: 'Comptoir'
};
