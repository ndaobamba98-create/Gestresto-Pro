
import { Lead, Product, Task, SaleOrder, Employee, ERPConfig, User, Expense, Supplier, PaymentMethod } from './types';
import { Banknote, Smartphone, Wallet, CreditCard } from 'lucide-react';
import React from 'react';

export const APP_USERS: User[] = [
  { id: 'U001', name: 'Bamba Ndao', role: 'admin', initials: 'BN', color: 'from-slate-700 to-slate-900' },
  { id: 'U002', name: 'Amy Ndaw', role: 'cashier', initials: 'AN', color: 'from-emerald-600 to-emerald-800' },
  { id: 'U003', name: 'Maman Ndaw', role: 'cashier', initials: 'MN', color: 'from-purple-600 to-purple-800' },
];

export const PAYMENT_METHODS_LIST: { id: PaymentMethod, label: string, color: string }[] = [
  { id: 'Especes', label: 'Espèces', color: 'bg-emerald-500' },
  { id: 'Bankily', label: 'Bankily', color: 'bg-orange-500' },
  { id: 'Masrvi', label: 'Masrvi', color: 'bg-blue-600' },
  { id: 'Sedad', label: 'Sedad', color: 'bg-purple-600' },
  { id: 'Bimbank', label: 'Bimbank', color: 'bg-red-600' },
];

export const POS_LOCATIONS = {
  tables: ['Table 1', 'Table 2', 'Table 3', 'Table 4'],
  bar: ['Bar 1', 'Bar 2', 'Bar 3', 'Bar 4'],
  takeaway: ['Emporter 1', 'Emporter 2'],
  delivery: ['Livraison 1', 'Livraison 2'],
  default: 'Comptoir'
};

// Add missing language property to INITIAL_CONFIG to satisfy ERPConfig type requirement.
export const INITIAL_CONFIG: ERPConfig = {
  companyName: "FAST FOOD MYA D'OR",
  companySlogan: "Le goût qui vaut de l'or",
  email: 'restaurantfastfoodmyador@gmail.com',
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
    'Petit Déjeuner', 
    'Déjeuner', 
    'Dîner',
    'Fast Food & Snack', 
    'Crepes & Gaufres',
    'Boissons',
    'Desserts',
    'Suppléments',
    'Formules'
  ],
  language: 'fr',
  showLogoOnInvoice: true,
  showSloganOnInvoice: true,
  showAddressOnInvoice: true,
  showPhoneOnInvoice: true,
  showEmailOnInvoice: false,
  showRegNumberOnInvoice: true,
  showQrCodeOnInvoice: true,
};

export const INITIAL_SUPPLIERS: Supplier[] = [
  { id: 'S001', name: 'Grossiste Alim', contact: 'Ahmed', phone: '44556677', category: 'Alimentation' },
  { id: 'S002', name: 'SNDE', contact: 'Service Client', phone: '1212', category: 'Services Publics' },
];

export const INITIAL_EXPENSES: Expense[] = [
  { id: 'EXP-001', description: 'Achat Provisions Hebdo', amount: 5000, date: '2025-05-15', category: 'Achats Marchandises', paymentMethod: 'Especes', supplierId: 'S001', status: 'paid' },
];

const RAW_PRODUCTS: Product[] = [
  // --- PETIT DÉJEUNER (Issu de Nos Repas) ---
  { id: 'PD01', name: 'OMELETTE SIMPLE', sku: 'PD-01', price: 40, stock: 999, category: 'Petit Déjeuner' },
  { id: 'PD02', name: 'OMELETTE FROMAGE', sku: 'PD-02', price: 50, stock: 999, category: 'Petit Déjeuner' },
  { id: 'PD03', name: 'OMELETTE FRMG JAMBON', sku: 'PD-03', price: 70, stock: 999, category: 'Petit Déjeuner' },
  { id: 'PD04', name: 'NIÉBÉ', sku: 'PD-04', price: 20, stock: 999, category: 'Petit Déjeuner' },
  { id: 'PD05', name: 'PETIT POIS', sku: 'PD-05', price: 20, stock: 999, category: 'Petit Déjeuner' },
  { id: 'PD06', name: 'SANDWICH (Simple)', sku: 'PD-06', price: 50, stock: 999, category: 'Petit Déjeuner' },
  { id: 'PD07', name: 'SANDWICH (Spécial)', sku: 'PD-07', price: 80, stock: 999, category: 'Petit Déjeuner' },
  { id: 'PD08', name: 'CAFÉ TOUBA (PD)', sku: 'PD-08', price: 10, stock: 999, category: 'Petit Déjeuner' },
  { id: 'PD09', name: 'CAFÉ AU LAIT', sku: 'PD-09', price: 15, stock: 999, category: 'Petit Déjeuner' },

  // --- DÉJEUNER (Issu de Nos Repas) ---
  { id: 'DE01', name: 'RIZ AU POISSONS', sku: 'DE-01', price: 50, stock: 999, category: 'Déjeuner' },
  { id: 'DE02', name: 'MAFÉ', sku: 'DE-02', price: 50, stock: 999, category: 'Déjeuner' },
  { id: 'DE03', name: 'SOUPE KANDIA', sku: 'DE-03', price: 50, stock: 999, category: 'Déjeuner' },
  { id: 'DE04', name: 'YASSA POISSON', sku: 'DE-04', price: 50, stock: 999, category: 'Déjeuner' },
  { id: 'DE05', name: 'YASSA POULET / VIANDE', sku: 'DE-05', price: 70, stock: 999, category: 'Déjeuner' },
  { id: 'DE06', name: 'ATHIÉKÉ POISSON', sku: 'DE-06', price: 50, stock: 999, category: 'Déjeuner' },
  { id: 'DE07', name: 'ATHIÉKÉ POULET', sku: 'DE-07', price: 80, stock: 999, category: 'Déjeuner' },

  // --- DÎNER (Issu de Nos Repas) ---
  { id: 'DI01', name: 'SOUPOU', sku: 'DI-01', price: 80, stock: 999, category: 'Dîner' },
  { id: 'DI02', name: 'POISSON BRAISÉ (P)', sku: 'DI-02', price: 50, stock: 999, category: 'Dîner' },
  { id: 'DI03', name: 'POISSON BRAISÉ (G)', sku: 'DI-03', price: 80, stock: 999, category: 'Dîner' },
  { id: 'DI04', name: 'SANDWICH DÎNER (P)', sku: 'DI-04', price: 30, stock: 999, category: 'Dîner' },
  { id: 'DI05', name: 'SANDWICH DÎNER (G)', sku: 'DI-05', price: 50, stock: 999, category: 'Dîner' },
  { id: 'DI06', name: 'VERMICELLE', sku: 'DI-06', price: 50, stock: 999, category: 'Dîner' },
  { id: 'DI07', name: 'PETIT POIS (Dîner)', sku: 'DI-07', price: 50, stock: 999, category: 'Dîner' },
  { id: 'DI08', name: 'COUS COUS', sku: 'DI-08', price: 50, stock: 999, category: 'Dîner' },

  // --- FAST FOOD & SNACK ---
  { id: 'FF01', name: 'POULET COMPLET', sku: 'FF-01', price: 400, stock: 999, category: 'Fast Food & Snack' },
  { id: 'FF02', name: 'POULET 1/2', sku: 'FF-02', price: 200, stock: 999, category: 'Fast Food & Snack' },
  { id: 'FF03', name: 'POULET 1/4', sku: 'FF-03', price: 80, stock: 999, category: 'Fast Food & Snack' },
  { id: 'FF04', name: 'PIZZA', sku: 'FF-04', price: 150, stock: 999, category: 'Fast Food & Snack' },
  { id: 'FF05', name: 'MINI PIZZA', sku: 'FF-05', price: 15, stock: 999, category: 'Fast Food & Snack' },
  { id: 'FF06', name: 'FATAYA', sku: 'FF-06', price: 10, stock: 999, category: 'Fast Food & Snack' },
  { id: 'FF07', name: 'NÉME', sku: 'FF-07', price: 15, stock: 999, category: 'Fast Food & Snack' },
  { id: 'FF08', name: 'ROUSSOL', sku: 'FF-08', price: 10, stock: 999, category: 'Fast Food & Snack' },
  { id: 'FF09', name: 'KEBAB', sku: 'FF-09', price: 50, stock: 999, category: 'Fast Food & Snack' },
  { id: 'FF10', name: 'KEBAB SPÉCIAL', sku: 'FF-10', price: 70, stock: 999, category: 'Fast Food & Snack' },
  { id: 'FF11', name: 'TACOS', sku: 'FF-11', price: 100, stock: 999, category: 'Fast Food & Snack' },
  { id: 'FF12', name: 'TACOS MIXTE', sku: 'FF-12', price: 150, stock: 999, category: 'Fast Food & Snack' },
  { id: 'FF13', name: 'KFC (6 PIÈCES)', sku: 'FF-13', price: 200, stock: 999, category: 'Fast Food & Snack' },
  { id: 'FF14', name: 'POUTINE', sku: 'FF-14', price: 100, stock: 999, category: 'Fast Food & Snack' },
  { id: 'FF15', name: 'HAMBURGER', sku: 'FF-15', price: 100, stock: 999, category: 'Fast Food & Snack' },
  { id: 'FF16', name: 'CHAWARMA', sku: 'FF-16', price: 100, stock: 999, category: 'Fast Food & Snack' },
  { id: 'FF17', name: 'SANDWICH AMÉRICAIN', sku: 'FF-17', price: 80, stock: 999, category: 'Fast Food & Snack' },

  // --- CREPES & GAUFRES ---
  { id: 'CG01', name: 'CRÊPES SIMPLE', sku: 'CG-01', price: 40, stock: 999, category: 'Crepes & Gaufres' },
  { id: 'CG02', name: 'CRÊPES MIEL', sku: 'CG-02', price: 50, stock: 999, category: 'Crepes & Gaufres' },
  { id: 'CG03', name: 'CRÊPES MIEL BANANE', sku: 'CG-03', price: 70, stock: 999, category: 'Crepes & Gaufres' },
  { id: 'CG04', name: 'CRÊPES CHOCOLAT', sku: 'CG-04', price: 80, stock: 999, category: 'Crepes & Gaufres' },
  { id: 'CG05', name: 'CRÊPES CHOCOLAT BANANE', sku: 'CG-05', price: 90, stock: 999, category: 'Crepes & Gaufres' },
  { id: 'CG06', name: 'CRÊPES NUTELLA', sku: 'CG-06', price: 100, stock: 999, category: 'Crepes & Gaufres' },
  { id: 'CG07', name: 'CRÊPES NUTELLA BANANE', sku: 'CG-07', price: 120, stock: 999, category: 'Crepes & Gaufres' },
  { id: 'CG08', name: 'CRÊPES FROMAGE', sku: 'CG-08', price: 70, stock: 999, category: 'Crepes & Gaufres' },
  { id: 'CG09', name: 'CRÊPES FROMAGE JAMBON', sku: 'CG-09', price: 120, stock: 999, category: 'Crepes & Gaufres' },
  { id: 'CG10', name: 'CRÊPES POULET FROMAGE', sku: 'CG-10', price: 150, stock: 999, category: 'Crepes & Gaufres' },
  { id: 'CG11', name: 'CRÊPES VIANDE FRMG', sku: 'CG-11', price: 160, stock: 999, category: 'Crepes & Gaufres' },
  { id: 'CG12', name: 'GAUFRE MIEL', sku: 'CG-12', price: 50, stock: 999, category: 'Crepes & Gaufres' },
  { id: 'CG13', name: 'GAUFRE MIEL BANANE', sku: 'CG-13', price: 70, stock: 999, category: 'Crepes & Gaufres' },
  { id: 'CG14', name: 'GAUFRE CHOCOLAT', sku: 'CG-14', price: 80, stock: 999, category: 'Crepes & Gaufres' },
  { id: 'CG15', name: 'GAUFRE CHOCOLAT BANANE', sku: 'CG-15', price: 90, stock: 999, category: 'Crepes & Gaufres' },
  { id: 'CG16', name: 'GAUFRE NUTELLA', sku: 'CG-16', price: 100, stock: 999, category: 'Crepes & Gaufres' },
  { id: 'CG17', name: 'GAUFRE NUTELLA BANANE', sku: 'CG-17', price: 120, stock: 999, category: 'Crepes & Gaufres' },

  // --- BOISSONS ---
  { id: 'BO01', name: 'SODA', sku: 'BO-01', price: 20, stock: 999, category: 'Boissons' },
  { id: 'BO02', name: 'JUS', sku: 'BO-02', price: 30, stock: 999, category: 'Boissons' },
  { id: 'BO03', name: 'MOJITO', sku: 'BO-03', price: 50, stock: 999, category: 'Boissons' },
  { id: 'BO04', name: 'EAU PM', sku: 'BO-04', price: 10, stock: 999, category: 'Boissons' },
  { id: 'BO05', name: 'CAFÉ TOUBA (Boissons)', sku: 'BO-05', price: 10, stock: 999, category: 'Boissons' },
  { id: 'BO06', name: 'EXPRESSO', sku: 'BO-06', price: 50, stock: 999, category: 'Boissons' },
  { id: 'BO07', name: 'NOUS NOUS', sku: 'BO-07', price: 40, stock: 999, category: 'Boissons' },
  { id: 'BO08', name: 'CAPUCCINO', sku: 'BO-08', price: 70, stock: 999, category: 'Boissons' },
  { id: 'BO09', name: 'ICE COFFEE', sku: 'BO-09', price: 70, stock: 999, category: 'Boissons' },
  { id: 'BO10', name: 'CHOCOLAT CHAUD', sku: 'BO-10', price: 100, stock: 999, category: 'Boissons' },
  { id: 'BO11', name: 'THÉ', sku: 'BO-11', price: 70, stock: 999, category: 'Boissons' },

  // --- DESSERTS ---
  { id: 'DS01', name: 'MILK SHAKE', sku: 'DS-01', price: 100, stock: 999, category: 'Desserts' },
  { id: 'DS02', name: 'SALADE DE FRUITS', sku: 'DS-02', price: 30, stock: 999, category: 'Desserts' },
  { id: 'DS03', name: 'BISCUIT / CAKE', sku: 'DS-03', price: 30, stock: 999, category: 'Desserts' },
  { id: 'DS04', name: 'JUS BOUYE', sku: 'DS-04', price: 30, stock: 999, category: 'Desserts' },
  { id: 'DS05', name: 'JUS BISAP', sku: 'DS-05', price: 30, stock: 999, category: 'Desserts' },
  { id: 'DS06', name: 'JUS GENGEMBRE', sku: 'DS-06', price: 30, stock: 999, category: 'Desserts' },
  { id: 'DS07', name: 'THIAKRY / NGALAKH', sku: 'DS-07', price: 30, stock: 999, category: 'Desserts' },

  // --- SUPPLÉMENTS ---
  { id: 'SP01', name: 'BANANE (SUPP)', sku: 'SP-01', price: 20, stock: 999, category: 'Suppléments' },
  { id: 'SP02', name: 'MIEL (SUPP)', sku: 'SP-02', price: 30, stock: 999, category: 'Suppléments' },
  { id: 'SP03', name: 'FROMAGE (SUPP)', sku: 'SP-03', price: 30, stock: 999, category: 'Suppléments' },
  { id: 'SP04', name: 'JAMBON (SUPP)', sku: 'SP-04', price: 30, stock: 999, category: 'Suppléments' },
  { id: 'SP05', name: 'CHOCOLAT (SUPP)', sku: 'SP-05', price: 20, stock: 999, category: 'Suppléments' },
  { id: 'SP06', name: 'NUTELLA (SUPP)', sku: 'SP-06', price: 30, stock: 999, category: 'Suppléments' },
  { id: 'SP07', name: 'GAUFRE SIMPLE (SUPP)', sku: 'SP-07', price: 40, stock: 999, category: 'Suppléments' },
  { id: 'SP08', name: 'FRITES', sku: 'SP-08', price: 30, stock: 999, category: 'Suppléments' },
  { id: 'SP09', name: 'CUISSE POULET', sku: 'SP-09', price: 50, stock: 999, category: 'Suppléments' },
  { id: 'SP10', name: 'KFC LA PIÈCE', sku: 'SP-10', price: 40, stock: 999, category: 'Suppléments' },

  // --- FORMULES ---
  { id: 'FO01', name: 'FORMULE TERANGA PLUS', sku: 'FO-01', price: 550, stock: 999, category: 'Formules' },
  { id: 'FO02', name: 'FORMULE TERANGA POULET', sku: 'FO-02', price: 550, stock: 999, category: 'Formules' },
  { id: 'FO03', name: 'FORMULE TERANGA', sku: 'FO-03', price: 200, stock: 999, category: 'Formules' },
  { id: 'FO04', name: 'FORMULE EXPRESS', sku: 'FO-04', price: 250, stock: 999, category: 'Formules' },
  { id: 'FO05', name: 'FORMULE GONAL', sku: 'FO-05', price: 250, stock: 999, category: 'Formules' },
  { id: 'FO06', name: 'FORMULE COUCHANT', sku: 'FO-06', price: 320, stock: 999, category: 'Formules' },
  { id: 'FO07', name: 'FORMULE BONJOUR', sku: 'FO-07', price: 200, stock: 999, category: 'Formules' },
];

export const INITIAL_PRODUCTS: Product[] = [...RAW_PRODUCTS];

export const INITIAL_EMPLOYEES: Employee[] = [
  { id: 'E001', name: 'Bamba Ndao', role: 'Gérant', department: 'Administration', salary: 2000, status: 'active', joinDate: '2023-01-15', isClockedIn: false },
  { id: 'E002', name: 'Amy Ndaw', role: 'Caissière', department: 'Salle', salary: 4000, status: 'active', joinDate: '2024-01-01', isClockedIn: false },
  { id: 'E003', name: 'Maman Ndaw', role: 'Caissière', department: 'Salle', salary: 4000, status: 'active', joinDate: '2024-01-01', isClockedIn: false },
  { id: 'E004', name: 'Yatera', role: 'Cuisinier', department: 'Cuisine', salary: 6000, status: 'active', joinDate: '2025-01-01', isClockedIn: false },
];
