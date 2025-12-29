
import { Lead, Product, Task, SaleOrder, Employee, ERPConfig, User } from './types';

export const APP_USERS: User[] = [
  { id: 'U001', name: 'Bamba Ndao', role: 'admin', initials: 'BN', color: 'from-slate-700 to-slate-900' },
  { id: 'U002', name: 'Moussa Traoré', role: 'cashier', initials: 'MT', color: 'from-emerald-600 to-emerald-800' },
  { id: 'U003', name: 'Caissier 2', role: 'cashier', initials: 'C2', color: 'from-purple-600 to-purple-800' },
];

export const POS_LOCATIONS = {
  tables: ['Table 1', 'Table 2', 'Table 3', 'Table 4'],
  bar: ['Bar 1', 'Bar 2', 'Bar 3', 'Bar 4'],
  takeaway: ['Emporter 1', 'Emporter 2'],
  delivery: ['Livraison 1', 'Livraison 2'],
  default: 'Comptoir'
};

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
    'Restauration', 
    'Fast Food', 
    'Snack',
    'Suppléments', 
    'Boissons',
    'Desserts',
    'Crêpes & Gaufres'
  ].sort((a, b) => a.localeCompare(b)),
};

const RAW_PRODUCTS: Product[] = [
  // RESTAURATION
  { id: 'PD01', name: 'OMELETTE', sku: 'PD-OM-01', price: 40, stock: 999, category: 'Restauration' },
  { id: 'PD02', name: 'OMELETTE Fromage', sku: 'PD-OM-02', price: 50, stock: 999, category: 'Restauration' },
  { id: 'PD03', name: 'OMELETTE Frmg Jambon', sku: 'PD-OM-03', price: 70, stock: 999, category: 'Restauration' },
  { id: 'PD04', name: 'Niébé', sku: 'PD-NI-04', price: 20, stock: 999, category: 'Restauration' },
  { id: 'PD05', name: 'Petit Pois', sku: 'PD-PP-05', price: 20, stock: 999, category: 'Restauration' },
  { id: 'PD06', name: 'Sandwich Simple', sku: 'PD-SA-06', price: 50, stock: 999, category: 'Restauration' },
  { id: 'PD07', name: 'Sandwich Spécial', sku: 'PD-SA-07', price: 80, stock: 999, category: 'Restauration' },
  { id: 'DJ01', name: 'Riz au Poissons', sku: 'DJ-RP-01', price: 50, stock: 999, category: 'Restauration' },
  { id: 'DJ02', name: 'Mafé', sku: 'DJ-MA-02', price: 50, stock: 999, category: 'Restauration' },
  { id: 'DJ03', name: 'Soupe Kandia', sku: 'DJ-SK-03', price: 50, stock: 999, category: 'Restauration' },
  { id: 'DJ04', name: 'Yassa Poisson', sku: 'DJ-YP-04', price: 50, stock: 999, category: 'Restauration' },
  { id: 'DJ05', name: 'Yassa Poulet / Viande', sku: 'DJ-YPV-05', price: 70, stock: 999, category: 'Restauration' },
  { id: 'DJ06', name: 'Athiéké Poisson', sku: 'DJ-AP-06', price: 50, stock: 999, category: 'Restauration' },
  { id: 'DJ07', name: 'Athiéké Poulet', sku: 'DJ-AP-07', price: 80, stock: 999, category: 'Restauration' },
  { id: 'DN01', name: 'Soupou', sku: 'DN-SO-01', price: 80, stock: 999, category: 'Restauration' },
  { id: 'DN02', name: 'Poisson Braisé (Petit)', sku: 'DN-PB-01', price: 50, stock: 999, category: 'Restauration' },
  { id: 'DN03', name: 'Poisson Braisé (Grand)', sku: 'DN-PB-02', price: 80, stock: 999, category: 'Restauration' },
  { id: 'DN06', name: 'Vermicelle', sku: 'DN-VE-06', price: 50, stock: 999, category: 'Restauration' },
  { id: 'DN08', name: 'Cous Cous', sku: 'DN-CO-08', price: 50, stock: 999, category: 'Restauration' },

  // FAST FOOD
  { id: 'FF01', name: 'Poulet Complet', sku: 'FF-PC-01', price: 400, stock: 999, category: 'Fast Food' },
  { id: 'FF02', name: 'Poulet 1/2', sku: 'FF-P12-02', price: 200, stock: 999, category: 'Fast Food' },
  { id: 'FF03', name: 'Poulet 1/4', sku: 'FF-P14-03', price: 80, stock: 999, category: 'Fast Food' },
  { id: 'FF04', name: 'Pizza', sku: 'FF-PI-04', price: 150, stock: 999, category: 'Fast Food' },
  { id: 'FF05', name: 'Mini Pizza', sku: 'FF-MP-05', price: 15, stock: 999, category: 'Fast Food' },
  { id: 'FF06', name: 'Fataya', sku: 'FF-FA-06', price: 10, stock: 999, category: 'Fast Food' },
  { id: 'FF07', name: 'Néme', sku: 'FF-NE-07', price: 15, stock: 999, category: 'Fast Food' },
  { id: 'FF08', name: 'Roussol', sku: 'FF-RO-08', price: 10, stock: 999, category: 'Fast Food' },

  // SNACK
  { id: 'SN01', name: 'Kebab', sku: 'SN-KE-01', price: 50, stock: 999, category: 'Snack' },
  { id: 'SN02', name: 'Kebab Spécial', sku: 'SN-KS-02', price: 70, stock: 999, category: 'Snack' },
  { id: 'SN03', name: 'Tacos', sku: 'SN-TA-03', price: 100, stock: 999, category: 'Snack' },
  { id: 'SN04', name: 'Tacos mixte', sku: 'SN-TM-04', price: 150, stock: 999, category: 'Snack' },
  { id: 'SN05', name: 'KFC (6 pièces)', sku: 'SN-KFC-05', price: 200, stock: 999, category: 'Snack' },
  { id: 'SN06', name: 'Poutine', sku: 'SN-PO-06', price: 100, stock: 999, category: 'Snack' },
  { id: 'SN07', name: 'Hamburger', sku: 'SN-HA-07', price: 100, stock: 999, category: 'Snack' },
  { id: 'SN08', name: 'Chawarma', sku: 'SN-CH-08', price: 100, stock: 999, category: 'Snack' },
  { id: 'SN09', name: 'Sandwich Américain', sku: 'SN-SAM-09', price: 80, stock: 999, category: 'Snack' },

  // SUPPLEMENTS
  { id: 'SP01', name: 'Frites', sku: 'SP-FR-01', price: 30, stock: 999, category: 'Suppléments' },
  { id: 'SP02', name: 'Cuisse Poulet', sku: 'SP-CP-02', price: 50, stock: 999, category: 'Suppléments' },
  { id: 'SP03', name: 'KFC la pièce', sku: 'SP-KFP-03', price: 40, stock: 999, category: 'Suppléments' },
  { id: 'SP04', name: 'Supplément Banane', sku: 'SP-BA-04', price: 20, stock: 999, category: 'Suppléments' },
  { id: 'SP05', name: 'Supplément Miel', sku: 'SP-MI-05', price: 30, stock: 999, category: 'Suppléments' },
  { id: 'SP06', name: 'Supplément Fromage', sku: 'SP-FR-06', price: 30, stock: 999, category: 'Suppléments' },
  { id: 'SP07', name: 'Supplément Jambon', sku: 'SP-JA-07', price: 30, stock: 999, category: 'Suppléments' },
  { id: 'SP08', name: 'Supplément Chocolat', sku: 'SP-CH-08', price: 20, stock: 999, category: 'Suppléments' },
  { id: 'SP09', name: 'Supplément Nutella', sku: 'SP-NU-09', price: 30, stock: 999, category: 'Suppléments' },

  // BOISSONS
  { id: 'B001', name: 'Soda', sku: 'B-SO-01', price: 20, stock: 999, category: 'Boissons' },
  { id: 'B002', name: 'Jus', sku: 'B-JU-02', price: 30, stock: 999, category: 'Boissons' },
  { id: 'B003', name: 'Mojito', sku: 'B-MO-03', price: 50, stock: 999, category: 'Boissons' },
  { id: 'B004', name: 'Eau PM', sku: 'B-EPM-04', price: 10, stock: 999, category: 'Boissons' },
  { id: 'BC01', name: 'Café Touba', sku: 'BC-CT-01', price: 10, stock: 999, category: 'Boissons' },
  { id: 'BC02', name: 'Expresso', sku: 'BC-EX-02', price: 50, stock: 999, category: 'Boissons' },
  { id: 'BC03', name: 'Nous Nous', sku: 'BC-NN-03', price: 40, stock: 999, category: 'Boissons' },
  { id: 'BC04', name: 'Capuccino', sku: 'BC-CP-04', price: 70, stock: 999, category: 'Boissons' },
  { id: 'BC05', name: 'Ice Coffee', sku: 'BC-IC-05', price: 70, stock: 999, category: 'Boissons' },
  { id: 'BC06', name: 'Chocolat Chaud', sku: 'BC-CH-06', price: 100, stock: 999, category: 'Boissons' },
  { id: 'BC07', name: 'Thé', sku: 'BC-TH-07', price: 70, stock: 999, category: 'Boissons' },

  // DESSERTS
  { id: 'DS01', name: 'Milk shake', sku: 'DS-MS-01', price: 100, stock: 999, category: 'Desserts' },
  { id: 'DS02', name: 'Salade de Fruits', sku: 'DS-SF-02', price: 30, stock: 999, category: 'Desserts' },
  { id: 'DS03', name: 'Biscuit / Cake', sku: 'DS-BC-03', price: 30, stock: 999, category: 'Desserts' },
  { id: 'DS04', name: 'Jus Bouye', sku: 'DS-JB-04', price: 30, stock: 999, category: 'Desserts' },
  { id: 'DS05', name: 'Jus Bisap', sku: 'DS-JBI-05', price: 30, stock: 999, category: 'Desserts' },
  { id: 'DS06', name: 'Jus Gengembre', sku: 'DS-JG-06', price: 30, stock: 999, category: 'Desserts' },
  { id: 'DS07', name: 'Thiakry / Ngalakh', sku: 'DS-TN-07', price: 30, stock: 999, category: 'Desserts' },

  // CREPES & GAUFRES
  { id: 'CR01', name: 'Crêpe simple', sku: 'CR-SI-01', price: 40, stock: 999, category: 'Crêpes & Gaufres' },
  { id: 'CR02', name: 'Crêpe Miel', sku: 'CR-MI-02', price: 50, stock: 999, category: 'Crêpes & Gaufres' },
  { id: 'CR03', name: 'Crêpe Miel Banane', sku: 'CR-MB-03', price: 70, stock: 999, category: 'Crêpes & Gaufres' },
  { id: 'CR04', name: 'Crêpe Chocolat', sku: 'CR-CH-04', price: 80, stock: 999, category: 'Crêpes & Gaufres' },
  { id: 'CR05', name: 'Crêpe Chocolat banane', sku: 'CR-CB-05', price: 90, stock: 999, category: 'Crêpes & Gaufres' },
  { id: 'CR06', name: 'Crêpe Nutella', sku: 'CR-NU-06', price: 100, stock: 999, category: 'Crêpes & Gaufres' },
  { id: 'CR07', name: 'Crêpe Nutella banane', sku: 'CR-NB-07', price: 120, stock: 999, category: 'Crêpes & Gaufres' },
  { id: 'CR08', name: 'Crêpe fromage', sku: 'CR-FR-08', price: 70, stock: 999, category: 'Crêpes & Gaufres' },
  { id: 'CR09', name: 'Crêpe fromage Jambon', sku: 'CR-FJ-09', price: 120, stock: 999, category: 'Crêpes & Gaufres' },
  { id: 'CR10', name: 'Crêpe Poulet fromage', sku: 'CR-PF-10', price: 150, stock: 999, category: 'Crêpes & Gaufres' },
  { id: 'CR11', name: 'Crêpe viande frmg', sku: 'CR-VF-11', price: 160, stock: 999, category: 'Crêpes & Gaufres' },
  { id: 'GA01', name: 'Gaufre simple', sku: 'GA-SI-01', price: 40, stock: 999, category: 'Crêpes & Gaufres' },
  { id: 'GA02', name: 'Gaufre Miel', sku: 'GA-MI-02', price: 50, stock: 999, category: 'Crêpes & Gaufres' },
  { id: 'GA03', name: 'Gaufre Miel Banane', sku: 'GA-MB-03', price: 70, stock: 999, category: 'Crêpes & Gaufres' },
  { id: 'GA04', name: 'Gaufre Chocolat', sku: 'GA-CH-04', price: 80, stock: 999, category: 'Crêpes & Gaufres' },
  { id: 'GA05', name: 'Gaufre Chocolat banane', sku: 'GA-CB-05', price: 90, stock: 999, category: 'Crêpes & Gaufres' },
  { id: 'GA06', name: 'Gaufre Nutella', sku: 'GA-NU-06', price: 100, stock: 999, category: 'Crêpes & Gaufres' },
  { id: 'GA07', name: 'Gaufre Nutella banane', sku: 'GA-NB-07', price: 120, stock: 999, category: 'Crêpes & Gaufres' },
];

export const INITIAL_PRODUCTS: Product[] = [...RAW_PRODUCTS].sort((a, b) => a.name.localeCompare(b.name));

export const INITIAL_EMPLOYEES: Employee[] = [
  { id: 'E001', name: 'Bamba Ndao', role: 'Gérant', department: 'Administration', salary: 25000, status: 'active', joinDate: '2023-01-15', isClockedIn: false },
];
