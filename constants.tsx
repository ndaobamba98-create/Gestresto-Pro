
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

export const INITIAL_PRODUCTS: Product[] = [
  // --- PETIT DEJEUNER ---
  { id: 'PD01', name: 'Omelette Nature', sku: 'PD-OM-01', price: 40, stock: 999, category: '1. Petit Déjeuner' },
  { id: 'PD02', name: 'Omelette Fromage', sku: 'PD-OF-01', price: 50, stock: 999, category: '1. Petit Déjeuner' },
  { id: 'PD04', name: 'Niébé', sku: 'PD-NB-01', price: 20, stock: 999, category: '1. Petit Déjeuner' },

  // --- DEJEUNER ---
  { id: 'DJ01', name: 'Riz au Poissons', sku: 'DEJ-RP-01', price: 50, stock: 999, category: '2. Déjeuner' },
  { id: 'DJ02', name: 'Mafé', sku: 'DEJ-MF-01', price: 50, stock: 999, category: '2. Déjeuner' },
  { id: 'DJ03', name: 'Soupe Kandia', sku: 'DEJ-SK-01', price: 50, stock: 999, category: '2. Déjeuner' },

  // --- DINER ---
  { id: 'DN02', name: 'Poisson Braisé', sku: 'DIN-PB-01', price: 50, stock: 999, category: '3. Dîner' },
  { id: 'DN06', name: 'Vermicelle', sku: 'DIN-VM-01', price: 50, stock: 999, category: '3. Dîner' },

  // --- CRÊPES SUCRÉES ---
  { id: 'CS01', name: 'Crêpes simple', sku: 'CR-SM-01', price: 40, stock: 999, category: '4. Crêpes Sucrées' },
  { id: 'CS02', name: 'Crêpes Miel', sku: 'CR-ML-01', price: 50, stock: 999, category: '4. Crêpes Sucrées' },
  { id: 'CS04', name: 'Crêpes Chocolat', sku: 'CR-CH-01', price: 80, stock: 999, category: '4. Crêpes Sucrées' },
  { id: 'CS06', name: 'Crêpes Nutella', sku: 'CR-NT-01', price: 100, stock: 999, category: '4. Crêpes Sucrées' },
  { id: 'CS07', name: 'Crêpes Nutella banane', sku: 'CR-NB-01', price: 120, stock: 999, category: '4. Crêpes Sucrées' },

  // --- CRÊPES SALÉES ---
  { id: 'CSL01', name: 'Crêpes fromage', sku: 'CR-FR-01', price: 70, stock: 999, category: '5. Crêpes Salées' },
  { id: 'CSL03', name: 'Crêpes Poulet fromage', sku: 'CR-PF-01', price: 150, stock: 999, category: '5. Crêpes Salées' },
  { id: 'CSL04', name: 'Crêpes viande frmg', sku: 'CR-VF-01', price: 160, stock: 999, category: '5. Crêpes Salées' },

  // --- FAST FOOD & SNACKS (FULL INTEGRATION FROM IMAGES) ---
  { id: 'FF01', name: 'Poulet Complet', sku: 'FF-PC-01', price: 400, stock: 999, category: '6. Fast Food & Snacks' },
  { id: 'FF02', name: 'Poulet 1/2', sku: 'FF-P2-01', price: 200, stock: 999, category: '6. Fast Food & Snacks' },
  { id: 'FF03', name: 'Poulet 1/4', sku: 'FF-P4-01', price: 80, stock: 999, category: '6. Fast Food & Snacks' },
  { id: 'FF04', name: 'Pizza', sku: 'FF-PZ-01', price: 150, stock: 999, category: '6. Fast Food & Snacks' },
  { id: 'FF05', name: 'Mini Pizza', sku: 'FF-MP-01', price: 15, stock: 999, category: '6. Fast Food & Snacks' },
  { id: 'FF06', name: 'Fataya', sku: 'FF-FT-01', price: 10, stock: 999, category: '6. Fast Food & Snacks' },
  { id: 'FF07', name: 'Néme', sku: 'FF-NM-01', price: 15, stock: 999, category: '6. Fast Food & Snacks' },
  { id: 'FF08', name: 'Roussol', sku: 'FF-RS-01', price: 10, stock: 999, category: '6. Fast Food & Snacks' },
  { id: 'SN01', name: 'Kebab', sku: 'SN-KB-01', price: 50, stock: 999, category: '6. Fast Food & Snacks' },
  { id: 'SN02', name: 'Kebab Spécial', sku: 'SN-KS-01', price: 70, stock: 999, category: '6. Fast Food & Snacks' },
  { id: 'SN03', name: 'Tacos', sku: 'SN-TC-01', price: 100, stock: 999, category: '6. Fast Food & Snacks' },
  { id: 'SN04', name: 'Tacos mixte', sku: 'SN-TM-01', price: 150, stock: 999, category: '6. Fast Food & Snacks' },
  { id: 'SN05', name: 'KFC (6 pièces)', sku: 'SN-KF-01', price: 200, stock: 999, category: '6. Fast Food & Snacks' },
  { id: 'SN06', name: 'Poutine', sku: 'SN-PT-01', price: 100, stock: 999, category: '6. Fast Food & Snacks' },
  { id: 'SN07', name: 'Hamburger', sku: 'SN-HB-01', price: 100, stock: 999, category: '6. Fast Food & Snacks' },
  { id: 'SN08', name: 'Chawarma', sku: 'SN-CH-01', price: 100, stock: 999, category: '6. Fast Food & Snacks' },
  { id: 'SN09', name: 'Sandwich Américain', sku: 'SN-SA-01', price: 80, stock: 999, category: '6. Fast Food & Snacks' },

  // --- BOISSONS ---
  { id: 'BS01', name: 'Soda', sku: 'BS-SD-01', price: 20, stock: 999, category: '7. Boissons' },
  { id: 'BS02', name: 'Jus', sku: 'BS-JS-01', price: 30, stock: 999, category: '7. Boissons' },
  { id: 'BS04', name: 'Eau PM', sku: 'BS-EPM-01', price: 10, stock: 1000, category: '7. Boissons' },

  // --- SUPPLEMENTS ---
  { id: 'SUP07', name: 'Frites', sku: 'SP-FR-01', price: 30, stock: 999, category: '8. Suppléments' },
  { id: 'SUP08', name: 'Cuisse Poulet', sku: 'SP-CP-01', price: 50, stock: 999, category: '8. Suppléments' },
  { id: 'SUP09', name: 'KFC la pièce', sku: 'SP-KF-01', price: 40, stock: 999, category: '8. Suppléments' },
  { id: 'SUP01', name: 'Suppl. Banane', sku: 'SP-BN-01', price: 20, stock: 999, category: '8. Suppléments' },
  { id: 'SUP03', name: 'Suppl. Fromage', sku: 'SP-FR-02', price: 30, stock: 999, category: '8. Suppléments' },
  { id: 'SUP06', name: 'Suppl. Nutella', sku: 'SP-NT-01', price: 30, stock: 999, category: '8. Suppléments' }
].sort((a, b) => a.category.localeCompare(b.category));

export const INITIAL_TASKS: Task[] = [
  { id: 'T1', title: 'Préparer les commandes Crêpes/Snacks', project: 'Cuisine', status: 'done', assignee: 'Fatou' },
  { id: 'T2', title: 'Vérifier stock Tacos et Poulet', project: 'Stock', status: 'todo', assignee: 'Moussa' },
];

export const INITIAL_SALES: SaleOrder[] = [
  { 
    id: 'S001', 
    customer: 'Vente Comptoir', 
    date: '2024-03-20 12:30', 
    total: 100, 
    status: 'confirmed',
    items: [
      { productId: 'SN03', name: 'Tacos', quantity: 1, price: 100 }
    ],
    paymentMethod: 'Especes',
    amountReceived: 100,
    change: 0
  }
];
