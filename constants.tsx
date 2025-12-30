
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
    'Petit Déjeuner', 
    'Déjeuner', 
    'Dîner',
    'Fast Food', 
    'Snack',
    'Crêpes',
    'Gaufres',
    'Boissons',
    'Boissons Chaudes',
    'Desserts',
    'Suppléments',
    'Formules Teranga'
  ],
};

const RAW_PRODUCTS: Product[] = [
  // --- PETIT DÉJEUNER ---
  { id: 'PD01', name: 'OMELETTE SIMPLE', sku: 'PD-01', price: 40, stock: 999, category: 'Petit Déjeuner' },
  { id: 'PD02', name: 'OMELETTE FROMAGE', sku: 'PD-02', price: 50, stock: 999, category: 'Petit Déjeuner' },
  { id: 'PD03', name: 'OMELETTE FRMG JAMBON', sku: 'PD-03', price: 70, stock: 999, category: 'Petit Déjeuner' },
  { id: 'PD04', name: 'NIÉBÉ', sku: 'PD-04', price: 20, stock: 999, category: 'Petit Déjeuner' },
  { id: 'PD05', name: 'PETIT POIS', sku: 'PD-05', price: 20, stock: 999, category: 'Petit Déjeuner' },
  { id: 'PD06', name: 'SANDWICH (Petit Déj)', sku: 'PD-06', price: 50, stock: 999, category: 'Petit Déjeuner' },
  { id: 'PD07', name: 'SANDWICH SPÉCIAL', sku: 'PD-07', price: 80, stock: 999, category: 'Petit Déjeuner' },
  { id: 'PD08', name: 'CAFÉ TOUBA (Petit Déj)', sku: 'PD-08', price: 10, stock: 999, category: 'Petit Déjeuner' },
  { id: 'PD09', name: 'CAFÉ AU LAIT', sku: 'PD-09', price: 15, stock: 999, category: 'Petit Déjeuner' },

  // --- DÉJEUNER ---
  { id: 'DE01', name: 'RIZ AU POISSONS', sku: 'DE-01', price: 50, stock: 999, category: 'Déjeuner' },
  { id: 'DE02', name: 'MAFÉ', sku: 'DE-02', price: 50, stock: 999, category: 'Déjeuner' },
  { id: 'DE03', name: 'SOUPE KANDIA', sku: 'DE-03', price: 50, stock: 999, category: 'Déjeuner' },
  { id: 'DE04', name: 'YASSA POISSON', sku: 'DE-04', price: 50, stock: 999, category: 'Déjeuner' },
  { id: 'DE05', name: 'YASSA POULET / VIANDE', sku: 'DE-05', price: 70, stock: 999, category: 'Déjeuner' },
  { id: 'DE06', name: 'ATHIÉKÉ POISSON', sku: 'DE-06', price: 50, stock: 999, category: 'Déjeuner' },
  { id: 'DE07', name: 'ATHIÉKÉ POULET', sku: 'DE-07', price: 80, stock: 999, category: 'Déjeuner' },

  // --- DÎNER ---
  { id: 'DI01', name: 'SOUPOU', sku: 'DI-01', price: 80, stock: 999, category: 'Dîner' },
  { id: 'DI02', name: 'POISSON BRAISÉ (Petit)', sku: 'DI-02', price: 50, stock: 999, category: 'Dîner' },
  { id: 'DI03', name: 'POISSON BRAISÉ (Grand)', sku: 'DI-03', price: 80, stock: 999, category: 'Dîner' },
  { id: 'DI04', name: 'SANDWICH DÎNER (Petit)', sku: 'DI-04', price: 30, stock: 999, category: 'Dîner' },
  { id: 'DI05', name: 'SANDWICH DÎNER (Grand)', sku: 'DI-05', price: 50, stock: 999, category: 'Dîner' },
  { id: 'DI06', name: 'VERMICELLE', sku: 'DI-06', price: 50, stock: 999, category: 'Dîner' },
  { id: 'DI07', name: 'PETIT POIS (Dîner)', sku: 'DI-07', price: 50, stock: 999, category: 'Dîner' },
  { id: 'DI08', name: 'COUS COUS', sku: 'DI-08', price: 50, stock: 999, category: 'Dîner' },

  // --- FAST FOOD ---
  { id: 'FF01', name: 'POULET COMPLET', sku: 'FF-01', price: 400, stock: 999, category: 'Fast Food' },
  { id: 'FF02', name: 'POULET 1/2', sku: 'FF-02', price: 200, stock: 999, category: 'Fast Food' },
  { id: 'FF03', name: 'POULET 1/4', sku: 'FF-03', price: 80, stock: 999, category: 'Fast Food' },
  { id: 'FF04', name: 'PIZZA', sku: 'FF-04', price: 150, stock: 999, category: 'Fast Food' },
  { id: 'FF05', name: 'MINI PIZZA', sku: 'FF-05', price: 15, stock: 999, category: 'Fast Food' },
  { id: 'FF06', name: 'FATAYA (Unité)', sku: 'FF-06', price: 10, stock: 999, category: 'Fast Food' },
  { id: 'FF07', name: 'NÉME', sku: 'FF-07', price: 15, stock: 999, category: 'Fast Food' },
  { id: 'FF08', name: 'ROUSSOL', sku: 'FF-08', price: 10, stock: 999, category: 'Fast Food' },

  // --- SNACK ---
  { id: 'SN01', name: 'KEBAB', sku: 'SN-01', price: 50, stock: 999, category: 'Snack' },
  { id: 'SN02', name: 'KEBAB SPÉCIAL', sku: 'SN-02', price: 70, stock: 999, category: 'Snack' },
  { id: 'SN03', name: 'TACOS', sku: 'SN-03', price: 100, stock: 999, category: 'Snack' },
  { id: 'SN04', name: 'TACOS MIXTE', sku: 'SN-04', price: 150, stock: 999, category: 'Snack' },
  { id: 'SN05', name: 'KFC (6 PIÈCES)', sku: 'SN-05', price: 200, stock: 999, category: 'Snack' },
  { id: 'SN06', name: 'POUTINE', sku: 'SN-06', price: 100, stock: 999, category: 'Snack' },
  { id: 'SN07', name: 'HAMBURGER', sku: 'SN-07', price: 100, stock: 999, category: 'Snack' },
  { id: 'SN08', name: 'CHAWARMA', sku: 'SN-08', price: 100, stock: 999, category: 'Snack' },
  { id: 'SN09', name: 'SANDWICH AMÉRICAIN', sku: 'SN-09', price: 80, stock: 999, category: 'Snack' },

  // --- CRÊPES ---
  { id: 'CR01', name: 'CRÊPE SIMPLE', sku: 'CR-01', price: 40, stock: 999, category: 'Crêpes' },
  { id: 'CR02', name: 'CRÊPE MIEL', sku: 'CR-02', price: 50, stock: 999, category: 'Crêpes' },
  { id: 'CR03', name: 'CRÊPE MIEL BANANE', sku: 'CR-03', price: 70, stock: 999, category: 'Crêpes' },
  { id: 'CR04', name: 'CRÊPE CHOCOLAT', sku: 'CR-04', price: 80, stock: 999, category: 'Crêpes' },
  { id: 'CR05', name: 'CRÊPE CHOCOLAT BANANE', sku: 'CR-05', price: 90, stock: 999, category: 'Crêpes' },
  { id: 'CR06', name: 'CRÊPE NUTELLA', sku: 'CR-06', price: 100, stock: 999, category: 'Crêpes' },
  { id: 'CR07', name: 'CRÊPE NUTELLA BANANE', sku: 'CR-07', price: 120, stock: 999, category: 'Crêpes' },
  { id: 'CR08', name: 'CRÊPE FROMAGE (Salée)', sku: 'CR-08', price: 70, stock: 999, category: 'Crêpes' },
  { id: 'CR09', name: 'CRÊPE FROMAGE JAMBON', sku: 'CR-09', price: 120, stock: 999, category: 'Crêpes' },
  { id: 'CR10', name: 'CRÊPE POULET FROMAGE', sku: 'CR-10', price: 150, stock: 999, category: 'Crêpes' },
  { id: 'CR11', name: 'CRÊPE VIANDE FRMG', sku: 'CR-11', price: 160, stock: 999, category: 'Crêpes' },

  // --- GAUFRES ---
  { id: 'GA01', name: 'GAUFRE SIMPLE', sku: 'GA-01', price: 40, stock: 999, category: 'Gaufres' },
  { id: 'GA02', name: 'GAUFRE MIEL', sku: 'GA-02', price: 50, stock: 999, category: 'Gaufres' },
  { id: 'GA03', name: 'GAUFRE MIEL BANANE', sku: 'GA-03', price: 70, stock: 999, category: 'Gaufres' },
  { id: 'GA04', name: 'GAUFRE CHOCOLAT', sku: 'GA-04', price: 80, stock: 999, category: 'Gaufres' },
  { id: 'GA05', name: 'GAUFRE CHOCOLAT BANANE', sku: 'GA-05', price: 90, stock: 999, category: 'Gaufres' },
  { id: 'GA06', name: 'GAUFRE NUTELLA', sku: 'GA-06', price: 100, stock: 999, category: 'Gaufres' },
  { id: 'GA07', name: 'GAUFRE NUTELLA BANANE', sku: 'GA-07', price: 120, stock: 999, category: 'Gaufres' },

  // --- BOISSONS ---
  { id: 'BO01', name: 'SODA', sku: 'BO-01', price: 20, stock: 999, category: 'Boissons' },
  { id: 'BO02', name: 'JUS', sku: 'BO-02', price: 30, stock: 999, category: 'Boissons' },
  { id: 'BO03', name: 'MOJITO', sku: 'BO-03', price: 50, stock: 999, category: 'Boissons' },
  { id: 'BO04', name: 'EAU PM', sku: 'BO-04', price: 10, stock: 999, category: 'Boissons' },
  { id: 'BO05', name: 'FATAYA (Boisson/Snack)', sku: 'BO-05', price: 10, stock: 999, category: 'Boissons' },
  { id: 'BO06', name: 'NÉME (Boisson/Snack)', sku: 'BO-06', price: 15, stock: 999, category: 'Boissons' },
  { id: 'BO07', name: 'ROUSSOL (Boisson/Snack)', sku: 'BO-07', price: 10, stock: 999, category: 'Boissons' },

  // --- BOISSONS CHAUDES ---
  { id: 'BC01', name: 'CAFÉ TOUBA (Boisson)', sku: 'BC-01', price: 10, stock: 999, category: 'Boissons Chaudes' },
  { id: 'BC02', name: 'EXPRESSO', sku: 'BC-02', price: 50, stock: 999, category: 'Boissons Chaudes' },
  { id: 'BC03', name: 'NOUS NOUS', sku: 'BC-03', price: 40, stock: 999, category: 'Boissons Chaudes' },
  { id: 'BC04', name: 'CAPUCCINO', sku: 'BC-04', price: 70, stock: 999, category: 'Boissons Chaudes' },
  { id: 'BC05', name: 'ICE COFEE', sku: 'BC-05', price: 70, stock: 999, category: 'Boissons Chaudes' },
  { id: 'BC06', name: 'CHOCOLAT CHAUD', sku: 'BC-06', price: 100, stock: 999, category: 'Boissons Chaudes' },
  { id: 'BC07', name: 'THÉ', sku: 'BC-07', price: 70, stock: 999, category: 'Boissons Chaudes' },

  // --- DESSERTS ---
  { id: 'DS01', name: 'MILK SHAKE', sku: 'DS-01', price: 100, stock: 999, category: 'Desserts' },
  { id: 'DS02', name: 'SALADE DE FRUITS', sku: 'DS-02', price: 30, stock: 999, category: 'Desserts' },
  { id: 'DS03', name: 'BISCUIT / CACKE', sku: 'DS-03', price: 30, stock: 999, category: 'Desserts' },
  { id: 'DS04', name: 'JUS BOUYE', sku: 'DS-04', price: 30, stock: 999, category: 'Desserts' },
  { id: 'DS05', name: 'JUS BISAP', sku: 'DS-05', price: 30, stock: 999, category: 'Desserts' },
  { id: 'DS06', name: 'JUS GENGEMBRE', sku: 'DS-06', price: 30, stock: 999, category: 'Desserts' },
  { id: 'DS07', name: 'THIAKRY / NGALAKH', sku: 'DS-07', price: 30, stock: 999, category: 'Desserts' },

  // --- SUPPLÉMENTS ---
  { id: 'SP01', name: 'PORTION FRITES', sku: 'SP-01', price: 30, stock: 999, category: 'Suppléments' },
  { id: 'SP02', name: 'CUISSE POULET', sku: 'SP-02', price: 50, stock: 999, category: 'Suppléments' },
  { id: 'SP03', name: 'KFC LA PIÈCE', sku: 'SP-03', price: 40, stock: 999, category: 'Suppléments' },
  { id: 'SP04', name: 'BANANE (Supp)', sku: 'SP-04', price: 20, stock: 999, category: 'Suppléments' },
  { id: 'SP05', name: 'MIEL (Supp)', sku: 'SP-05', price: 30, stock: 999, category: 'Suppléments' },
  { id: 'SP06', name: 'FROMAGE (Supp)', sku: 'SP-06', price: 30, stock: 999, category: 'Suppléments' },
  { id: 'SP07', name: 'JAMBON (Supp)', sku: 'SP-07', price: 30, stock: 999, category: 'Suppléments' },
  { id: 'SP08', name: 'CHOCOLAT (Supp)', sku: 'SP-08', price: 20, stock: 999, category: 'Suppléments' },
  { id: 'SP09', name: 'NUTELLA (Supp)', sku: 'SP-09', price: 30, stock: 999, category: 'Suppléments' },

  // --- FORMULES TERANGA ---
  { id: 'TR01', name: 'PACK TERANGA PLUS', sku: 'TR-01', price: 550, stock: 999, category: 'Formules Teranga' },
  { id: 'TR02', name: 'PACK EXPRESS', sku: 'TR-02', price: 250, stock: 999, category: 'Formules Teranga' },
  { id: 'TR03', name: 'PACK TERANGA', sku: 'TR-03', price: 200, stock: 999, category: 'Formules Teranga' },
  { id: 'TR04', name: 'PACK GONAL', sku: 'TR-04', price: 250, stock: 999, category: 'Formules Teranga' },
  { id: 'TR05', name: 'PACK COUCHANT', sku: 'TR-05', price: 320, stock: 999, category: 'Formules Teranga' },
  { id: 'TR06', name: 'PACK BONJOUR', sku: 'TR-06', price: 200, stock: 999, category: 'Formules Teranga' },
];

export const INITIAL_PRODUCTS: Product[] = [...RAW_PRODUCTS];

export const INITIAL_EMPLOYEES: Employee[] = [
  { id: 'E001', name: 'Bamba Ndao', role: 'Gérant', department: 'Administration', salary: 25000, status: 'active', joinDate: '2023-01-15', isClockedIn: false },
];
