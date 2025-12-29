
import { Lead, Product, Task, SaleOrder, Employee, ERPConfig } from './types';

export const INITIAL_CONFIG: ERPConfig = {
  companyName: "MYA D'OR FAST-FOOD",
  companySlogan: "Le goût qui vaut de l'or",
  email: 'contact@myador.mr',
  phone: '+222 43 85 27 44',
  address: "À côté de l'Hôpital Basra, Nouakchott",
  currency: 'MRU',
  taxRate: 0,
  receiptFooter: 'Merci de votre visite chez MYA D\'OR !',
  autoPrintReceipt: true,
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

  // BOISSONS (Tout le menu Boissons / Boissons Chaudes / Desserts)
  { id: 'BS01', name: 'Soda', sku: 'BS-SO-01', price: 20, stock: 999, category: 'Boissons' },
  { id: 'BS02', name: 'Jus Canette', sku: 'BS-JU-02', price: 30, stock: 999, category: 'Boissons' },
  { id: 'BS03', name: 'Mojito', sku: 'BS-MO-03', price: 50, stock: 999, category: 'Boissons' },
  { id: 'BS04', name: 'Eau PM', sku: 'BS-EA-04', price: 10, stock: 999, category: 'Boissons' },
  { id: 'BS05', name: 'Fataya', sku: 'BS-FA-05', price: 10, stock: 999, category: 'Boissons' },
  { id: 'BS06', name: 'Néme', sku: 'BS-NE-06', price: 15, stock: 999, category: 'Boissons' },
  { id: 'BS07', name: 'Roussol', sku: 'BS-RO-07', price: 10, stock: 999, category: 'Boissons' },
  { id: 'BS08', name: 'Café Touba', sku: 'BS-CT-08', price: 10, stock: 999, category: 'Boissons' },
  { id: 'BS09', name: 'Expresso', sku: 'BS-EX-09', price: 50, stock: 999, category: 'Boissons' },
  { id: 'BS10', name: 'Nous Nous', sku: 'BS-NN-10', price: 40, stock: 999, category: 'Boissons' },
  { id: 'BS11', name: 'Capuccino', sku: 'BS-CP-11', price: 70, stock: 999, category: 'Boissons' },
  { id: 'BS12', name: 'Ice Cofee', sku: 'BS-IC-12', price: 70, stock: 999, category: 'Boissons' },
  { id: 'BS13', name: 'Chocolat Chaud', sku: 'BS-CC-13', price: 100, stock: 999, category: 'Boissons' },
  { id: 'BS14', name: 'Thé', sku: 'BS-TH-14', price: 70, stock: 999, category: 'Boissons' },
  { id: 'BS15', name: 'Milk shake', sku: 'BS-MS-15', price: 100, stock: 999, category: 'Boissons' },
  { id: 'BS16', name: 'Salade de Fruits', sku: 'BS-SF-16', price: 30, stock: 999, category: 'Boissons' },
  { id: 'BS17', name: 'Biscuit / Cacke', sku: 'BS-BC-17', price: 30, stock: 999, category: 'Boissons' },
  { id: 'BS18', name: 'Jus Bouye', sku: 'BS-JB-18', price: 30, stock: 999, category: 'Boissons' },
  { id: 'BS19', name: 'Jus Bisap', sku: 'BS-BI-19', price: 30, stock: 999, category: 'Boissons' },
  { id: 'BS20', name: 'Jus Gengembre', sku: 'BS-GG-20', price: 30, stock: 999, category: 'Boissons' },
  { id: 'BS21', name: 'Thiakry / Ngalakh', sku: 'BS-TN-21', price: 30, stock: 999, category: 'Boissons' },

  // FORMULES MENUS
  { id: 'FM01', name: 'Menu Teranga Plus / Poulet Teranga', sku: 'FM-TP-01', price: 550, stock: 999, category: 'Formules Menus' },
  { id: 'FM02', name: 'Menu Express', sku: 'FM-EX-02', price: 250, stock: 999, category: 'Formules Menus' },
  { id: 'FM03', name: 'Menu Teranga', sku: 'FM-TE-03', price: 200, stock: 999, category: 'Formules Menus' },
  { id: 'FM04', name: 'Menu Gonal', sku: 'FM-GO-04', price: 250, stock: 999, category: 'Formules Menus' },
  { id: 'FM05', name: 'Menu Couchant', sku: 'FM-CO-05', price: 320, stock: 999, category: 'Formules Menus' },
  { id: 'FM06', name: 'Menu Bonjour', sku: 'FM-BO-06', price: 200, stock: 999, category: 'Formules Menus' },
];

// Exportation de la liste triée alphabétiquement par nom de produit
export const INITIAL_PRODUCTS: Product[] = [...RAW_PRODUCTS].sort((a, b) => a.name.localeCompare(b.name));

export const INITIAL_TASKS: Task[] = [];

export const INITIAL_SALES: SaleOrder[] = [];
