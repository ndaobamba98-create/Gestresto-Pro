
import { Lead, Product, Task, SaleOrder, Employee, ERPConfig, User } from './types';

export const APP_USERS: User[] = [
  { id: 'U001', name: 'Bamba Ndao', role: 'admin', initials: 'BN', color: 'from-slate-700 to-slate-900' },
  { id: 'U002', name: 'Moussa Traoré', role: 'cashier', initials: 'MT', color: 'from-emerald-600 to-emerald-800' },
  { id: 'U003', name: 'Fatou Sow', role: 'manager', initials: 'FS', color: 'from-blue-600 to-blue-800' },
  { id: 'U004', name: 'Caisse 02', role: 'cashier', initials: 'C2', color: 'from-purple-600 to-purple-800' },
];

export const POS_LOCATIONS = {
  tables: ['Table 1', 'Table 2', 'Table 3', 'Table 4'],
  bar: ['Bar 1', 'Bar 2', 'Bar 3', 'Bar 4'],
  takeaway: ['Emporter 1', 'Emporter 2', 'Emporter 3'],
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
};

export const INITIAL_EMPLOYEES: Employee[] = [
  { id: 'E001', name: 'Bamba Ndao', role: 'Gérant', department: 'Administration', salary: 25000, status: 'active', joinDate: '2023-01-15' },
  { id: 'E002', name: 'Fatou Sow', role: 'Cuisinière Chef', department: 'Cuisine', salary: 18000, status: 'active', joinDate: '2023-03-10' },
  { id: 'E003', name: 'Moussa Traoré', role: 'Serveur / Caisse', department: 'Salle', salary: 10000, status: 'active', joinDate: '2023-11-01' },
];

export const INITIAL_LEADS: Lead[] = [
  { id: '1', name: 'Commande Groupe Hôpital', company: 'Hôpital Basra', value: 5000, status: 'qualified', contact: 'Dr. Ahmed' },
  { id: '2', name: 'Livraison Bureau CNSS', company: 'CNSS', value: 2500, status: 'new', contact: 'Mme Sarr' },
];

const RAW_PRODUCTS: Product[] = [
  // PETIT DEJEUNER
  { id: 'PD01', name: 'Omelette Nature', sku: 'PD-OM-01', price: 40, stock: 999, category: 'Petit Déjeuner' },
  { id: 'PD02', name: 'Omelette Fromage', sku: 'PD-OM-02', price: 50, stock: 999, category: 'Petit Déjeuner' },
  { id: 'PD03', name: 'Omelette Fromage Jambon', sku: 'PD-OM-03', price: 70, stock: 999, category: 'Petit Déjeuner' },
  { id: 'PD04', name: 'Niébé', sku: 'PD-NI-04', price: 20, stock: 999, category: 'Petit Déjeuner' },
  { id: 'PD05', name: 'Petit Pois (P.Déj)', sku: 'PD-PP-05', price: 20, stock: 999, category: 'Petit Déjeuner' },
  { id: 'PD06', name: 'Sandwich Simple', sku: 'PD-SA-06', price: 50, stock: 999, category: 'Petit Déjeuner' },
  { id: 'PD07', name: 'Sandwich Spécial', sku: 'PD-SA-07', price: 80, stock: 999, category: 'Petit Déjeuner' },

  // DEJEUNER
  { id: 'DJ01', name: 'Riz au Poissons', sku: 'DJ-RP-01', price: 50, stock: 999, category: 'Déjeuner' },
  { id: 'DJ02', name: 'Mafé', sku: 'DJ-MA-02', price: 50, stock: 999, category: 'Déjeuner' },
  { id: 'DJ03', name: 'Soupe Kandia', sku: 'DJ-SK-03', price: 50, stock: 999, category: 'Déjeuner' },
  { id: 'DJ04', name: 'Yassa Poisson', sku: 'DJ-YP-04', price: 50, stock: 999, category: 'Déjeuner' },
  { id: 'DJ05', name: 'Yassa Poulet / Viande', sku: 'DJ-YPV-05', price: 70, stock: 999, category: 'Déjeuner' },
  { id: 'DJ06', name: 'Athiéké Poisson', sku: 'DJ-AP-06', price: 50, stock: 999, category: 'Déjeuner' },
  { id: 'DJ07', name: 'Athiéké Poulet', sku: 'DJ-AP-07', price: 80, stock: 999, category: 'Déjeuner' },

  // DINER
  { id: 'DN01', name: 'Soupou', sku: 'DN-SO-01', price: 80, stock: 999, category: 'Dîner' },
  { id: 'DN02', name: 'Poisson Braisé (Petit)', sku: 'DN-PB-02', price: 50, stock: 999, category: 'Dîner' },
  { id: 'DN03', name: 'Poisson Braisé (Grand)', sku: 'DN-PB-03', price: 80, stock: 999, category: 'Dîner' },
  { id: 'DN04', name: 'Sandwich Dîner (Petit)', sku: 'DN-SA-04', price: 30, stock: 999, category: 'Dîner' },
  { id: 'DN05', name: 'Sandwich Dîner (Grand)', sku: 'DN-SA-05', price: 50, stock: 999, category: 'Dîner' },
  { id: 'DN06', name: 'Vermicelle', sku: 'DN-VE-06', price: 50, stock: 999, category: 'Dîner' },
  { id: 'DN07', name: 'Petit Pois (Dîner)', sku: 'DN-PP-07', price: 50, stock: 999, category: 'Dîner' },
  { id: 'DN08', name: 'Cous Cous', sku: 'DN-CO-08', price: 50, stock: 999, category: 'Dîner' },

  // FAST FOOD & SNACK
  { id: 'FF01', name: 'Poulet Complet', sku: 'FF-PC-01', price: 400, stock: 999, category: 'Fast Food & Snack' },
  { id: 'FF02', name: 'Poulet 1/2', sku: 'FF-PH-02', price: 200, stock: 999, category: 'Fast Food & Snack' },
  { id: 'FF03', name: 'Poulet 1/4', sku: 'FF-PQ-03', price: 80, stock: 999, category: 'Fast Food & Snack' },
  { id: 'FF04', name: 'Pizza', sku: 'FF-PI-04', price: 150, stock: 999, category: 'Fast Food & Snack' },
  { id: 'FF05', name: 'Mini Pizza', sku: 'FF-MP-05', price: 15, stock: 999, category: 'Fast Food & Snack' },
  { id: 'SN01', name: 'Kebab', sku: 'SN-KE-01', price: 50, stock: 999, category: 'Fast Food & Snack' },
  { id: 'SN02', name: 'Kebab Spécial', sku: 'SN-KS-02', price: 70, stock: 999, category: 'Fast Food & Snack' },
  { id: 'SN03', name: 'Tacos', sku: 'SN-TA-03', price: 100, stock: 999, category: 'Fast Food & Snack' },
  { id: 'SN04', name: 'Tacos Mixte', sku: 'SN-TM-04', price: 150, stock: 999, category: 'Fast Food & Snack' },
  { id: 'SN05', name: 'KFC (6 pièces)', sku: 'SN-KF-05', price: 200, stock: 999, category: 'Fast Food & Snack' },
  { id: 'SN06', name: 'Poutine', sku: 'SN-PO-06', price: 100, stock: 999, category: 'Fast Food & Snack' },
  { id: 'SN07', name: 'Hamburger', sku: 'SN-HA-07', price: 100, stock: 999, category: 'Fast Food & Snack' },
  { id: 'SN08', name: 'Chawarma', sku: 'SN-CH-08', price: 100, stock: 999, category: 'Fast Food & Snack' },
  { id: 'SN09', name: 'Sandwich Américain', sku: 'SN-SA-09', price: 80, stock: 999, category: 'Fast Food & Snack' },

  // SUPPLEMENTS
  { id: 'SP01', name: 'Frites', sku: 'SP-FR-01', price: 30, stock: 999, category: 'Suppléments' },
  { id: 'SP02', name: 'Cuisse Poulet', sku: 'SP-CP-02', price: 50, stock: 999, category: 'Suppléments' },
  { id: 'SP03', name: 'KFC la pièce', sku: 'SP-KF-03', price: 40, stock: 999, category: 'Suppléments' },
  { id: 'SP04', name: 'Supp. Banane', sku: 'SP-BA-04', price: 20, stock: 999, category: 'Suppléments' },
  { id: 'SP05', name: 'Supp. Miel', sku: 'SP-MI-05', price: 30, stock: 999, category: 'Suppléments' },
  { id: 'SP06', name: 'Supp. Fromage', sku: 'SP-FR-06', price: 30, stock: 999, category: 'Suppléments' },
  { id: 'SP07', name: 'Supp. Jambon', sku: 'SP-JA-07', price: 30, stock: 999, category: 'Suppléments' },
  { id: 'SP08', name: 'Supp. Chocolat', sku: 'SP-CH-08', price: 20, stock: 999, category: 'Suppléments' },
  { id: 'SP09', name: 'Supp. Nutella', sku: 'SP-NU-09', price: 30, stock: 999, category: 'Suppléments' },

  // CREPES & GAUFRES
  { id: 'CG01', name: 'Crêpe simple', sku: 'CG-CR-01', price: 40, stock: 999, category: 'Crêpes & Gaufres' },
  { id: 'CG02', name: 'Crêpe Miel', sku: 'CG-CR-02', price: 50, stock: 999, category: 'Crêpes & Gaufres' },
  { id: 'CG03', name: 'Crêpe Miel Banane', sku: 'CG-CR-03', price: 70, stock: 999, category: 'Crêpes & Gaufres' },
  { id: 'CG04', name: 'Crêpe Chocolat', sku: 'CG-CR-04', price: 80, stock: 999, category: 'Crêpes & Gaufres' },
  { id: 'CG05', name: 'Crêpe Chocolat banane', sku: 'CG-CR-05', price: 90, stock: 999, category: 'Crêpes & Gaufres' },
  { id: 'CG06', name: 'Crêpe Nutella', sku: 'CG-CR-06', price: 100, stock: 999, category: 'Crêpes & Gaufres' },
  { id: 'CG07', name: 'Crêpe Nutella banane', sku: 'CG-CR-07', price: 120, stock: 999, category: 'Crêpes & Gaufres' },
  { id: 'CG08', name: 'Crêpe Fromage', sku: 'CG-CR-08', price: 70, stock: 999, category: 'Crêpes & Gaufres' },
  { id: 'CG09', name: 'Crêpe fromage Jambon', sku: 'CG-CR-09', price: 120, stock: 999, category: 'Crêpes & Gaufres' },
  { id: 'CG10', name: 'Crêpe Poulet fromage', sku: 'CG-CR-10', price: 150, stock: 999, category: 'Crêpes & Gaufres' },
  { id: 'CG11', name: 'Crêpe viande frmg', sku: 'CG-CR-11', price: 160, stock: 999, category: 'Crêpes & Gaufres' },
  { id: 'CG12', name: 'Gaufre simple', sku: 'CG-GA-12', price: 40, stock: 999, category: 'Crêpes & Gaufres' },
  { id: 'CG13', name: 'Gaufre Miel', sku: 'CG-GA-13', price: 50, stock: 999, category: 'Crêpes & Gaufres' },
  { id: 'CG14', name: 'Gaufre Miel Banane', sku: 'CG-GA-14', price: 70, stock: 999, category: 'Crêpes & Gaufres' },
  { id: 'CG15', name: 'Gaufre Chocolat', sku: 'CG-GA-15', price: 80, stock: 999, category: 'Crêpes & Gaufres' },
  { id: 'CG16', name: 'Gaufre Chocolat banane', sku: 'CG-GA-16', price: 90, stock: 999, category: 'Crêpes & Gaufres' },
  { id: 'CG17', name: 'Gaufre Nutella', sku: 'CG-GA-17', price: 100, stock: 999, category: 'Crêpes & Gaufres' },
  { id: 'CG18', name: 'Gaufre Nutella banane', sku: 'CG-GA-18', price: 120, stock: 999, category: 'Crêpes & Gaufres' },

  // BOISSONS
  { id: 'BS01', name: 'Soda', sku: 'BS-SO-01', price: 20, stock: 999, category: 'Boissons' },
  { id: 'BS02', name: 'Jus Canette', sku: 'BS-JU-02', price: 30, stock: 999, category: 'Boissons' },
  { id: 'BS03', name: 'Mojito', sku: 'BS-MO-03', price: 50, stock: 999, category: 'Boissons' },
  { id: 'BS04', name: 'Eau PM', sku: 'BS-EA-04', price: 10, stock: 999, category: 'Boissons' },
];

export const INITIAL_PRODUCTS: Product[] = [...RAW_PRODUCTS].sort((a, b) => a.name.localeCompare(b.name));

export const INITIAL_TASKS: Task[] = [];

export const INITIAL_SALES: SaleOrder[] = [];
