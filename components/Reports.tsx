
import React, { useState, useMemo } from 'react';
import { SaleOrder, ERPConfig, Product, Expense, CashSession } from '../types';
import { 
  BarChart3, 
  TrendingUp, 
  Calendar,
  Download,
  Zap,
  ShoppingCart,
  FileText,
  X,
  Award,
  FileDown,
  Printer,
  QrCode,
  TrendingDown,
  Scale,
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  Paperclip,
  Eye,
  FileSpreadsheet,
  Trophy,
  Medal,
  Star,
  PackageCheck,
  PieChart as PieIcon,
  DollarSign,
  Monitor,
  Lock,
  ChevronRight,
  Clock,
  DownloadCloud,
  Wallet,
  Send
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Cell, 
  Pie,
  Legend
} from 'recharts';
import * as XLSX from 'xlsx';

interface Props {
  sales: SaleOrder[];
  expenses: Expense[];
  products: Product[];
  config: ERPConfig;
  t: (key: any) => string;
  notify: (title: string, message: string, type?: 'success' | 'info' | 'warning') => void;
  sessions: CashSession[];
  simulateEmailSend?: (subject: string, body: string, trigger: any) => void;
}

const COLORS = ['#8b5cf6', '#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#ec4899', '#64748b'];

const CATEGORY_COLORS: Record<string, string> = {
  'Achats Marchandises': '#8b5cf6',
  'Salaires': '#3b82f6',
  'Loyer': '#ef4444',
  'Électricité/Eau': '#10b981',
  'Maintenance': '#f59e0b',
  'Marketing': '#ec4899',
  'Divers': '#64748b'
};

const Reports: React.FC<Props> = ({ sales, expenses = [], products, config, t, notify, sessions, simulateEmailSend }) => {
  const [activeReportTab, setActiveReportTab] = useState<'finance' | 'products' | 'sessions'>('finance');
  const [exportStartDate, setExportStartDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
  });
  const [exportEndDate, setExportEndDate] = useState(new Date().toISOString().split('T')[0]);

  const filteredSales = useMemo(() => {
    return sales.filter(sale => {
      const saleDateStr = sale.date.substring(0, 10);
      return saleDateStr >= exportStartDate && saleDateStr <= exportEndDate;
    });
  }, [sales, exportStartDate, exportEndDate]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter(exp => exp.date >= exportStartDate && exp.date <= exportEndDate);
  }, [expenses, exportStartDate, exportEndDate]);

  const totalRevenue = filteredSales.reduce((a, b) => b.status === 'refunded' ? a - b.total : a + b.total, 0);
  const totalCosts = filteredExpenses.reduce((a, b) => a + b.amount, 0);
  const netResult = totalRevenue - totalCosts;

  const handleSendReportByEmail = () => {
      if (simulateEmailSend) {
          const body = `Bonjour, voici le bilan d'analyse ${activeReportTab.toUpperCase()} pour MYA D'OR.
          
          PÉRIODE : ${exportStartDate} au ${exportEndDate}
          RÉSULTAT NET : ${netResult} ${config.currency}
          NOMBRE DE VENTES : ${filteredSales.length}
          NOMBRE DE SESSIONS : ${sessions.length}`;
          
          simulateEmailSend(`BILAN ANALYTIQUE : ${activeReportTab.toUpperCase()}`, body, 'onDailyExport');
      }
  };

  const expenseCategoryData = useMemo(() => {
    const data: Record<string, number> = {};
    filteredExpenses.forEach(exp => {
      data[exp.category] = (data[exp.category] || 0) + exp.amount;
    });
    return Object.entries(data)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredExpenses]);

  const topSellingStats = useMemo(() => {
    const productStats: Record<string, { name: string, qty: number, revenue: number, category: string }> = {};
    
    filteredSales.forEach(sale => {
      if (sale.status !== 'refunded') {
        sale.items?.forEach(item => {
          if (!productStats[item.productId]) {
            const originalProduct = products.find(p => p.id === item.productId);
            productStats[item.productId] = { 
              name: item.name, 
              qty: 0, 
              revenue: 0,
              category: originalProduct?.category || 'Divers'
            };
          }
          productStats[item.productId].qty += item.quantity;
          productStats[item.productId].revenue += (item.quantity * item.price);
        });
      }
    });

    const sorted = Object.values(productStats)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 10);

    return {
      list: sorted,
      chartData: sorted.slice(0, 5).map(p => ({
        name: p.name.length > 15 ? p.name.substring(0, 12) + '...' : p.name,
        fullName: p.name,
        quantité: p.qty,
        revenu: p.revenue
      }))
    };
  }, [filteredSales, products]);

  const comparisonData = useMemo(() => {
    const data: Record<string, { day: string, fullDate: string, recettes: number, depenses: number }> = {};
    
    const start = new Date(exportStartDate);
    const end = new Date(exportEndDate);
    const tempDate = new Date(start);

    while (tempDate <= end) {
      const isoDate = tempDate.toISOString().split('T')[0];
      data[isoDate] = { 
        day: tempDate.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' }),
        fullDate: isoDate,
        recettes: 0, 
        depenses: 0 
      };
      tempDate.setDate(tempDate.getDate() + 1);
    }
    
    filteredSales.forEach(sale => {
      if (sale.status !== 'refunded') {
        const dateStr = sale.date.substring(0, 10);
        if (data[dateStr]) data[dateStr].recettes += sale.total;
      }
    });

    filteredExpenses.forEach(exp => {
      if (data[exp.date]) data[exp.date].depenses += exp.amount;
    });

    return Object.values(data);
  }, [filteredSales, filteredExpenses, exportStartDate, exportEndDate]);

  const handleExportExcel = () => {
    let dataToExport: any[] = [];
    let filename = "";

    if (activeReportTab === 'finance') {
      dataToExport = comparisonData.map(d => ({
        'Date': d.fullDate,
        'Libellé Jour': d.day,
        'Recettes (IN)': d.recettes,
        'Dépenses (OUT)': d.depenses,
        'Résultat Journalier': d.recettes - d.depenses
      }));
      filename = `Rapport_Finance_${exportStartDate}_au_${exportEndDate}.xlsx`;
    } else if (activeReportTab === 'products') {
      dataToExport = topSellingStats.list.map(p => ({
        'Produit': p.name,
        'Catégorie': p.category,
        'Quantité Vendue': p.qty,
        'Chiffre d\'Affaires': p.revenue,
        'Prix Moyen Calculé': p.qty > 0 ? (p.revenue / p.qty).toFixed(2) : 0
      }));
      filename = `Performances_Produits_${exportStartDate}_au_${exportEndDate}.xlsx`;
    } else if (activeReportTab === 'sessions') {
      dataToExport = sessions.map(s => ({
        'Référence': s.id,
        'Caissier': s.cashierName,
        'Date Ouverture': new Date(s.openedAt).toLocaleString('fr-FR'),
        'Date Fermeture': s.closedAt ? new Date(s.closedAt).toLocaleString('fr-FR') : 'Session non fermée',
        'Fond Initial': s.openingBalance,
        'Ventes Espèces': s.totalCashSales,
        'Fond Attendu': s.expectedBalance,
        'Fond Physique Réel': s.closingBalance || 0,
        'Écart de Caisse': s.difference || 0,
        'Statut': s.status.toUpperCase()
      }));
      filename = `Historique_Sessions_Caisse.xlsx`;
    }

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Données d'Analyse");
    XLSX.writeFile(workbook, filename);
    notify("Export réussi", "Le fichier Excel a été téléchargé.", "success");
  };

  const handleExportPDF = () => {
    const element = document.getElementById('report-export-area');
    if (!element) return;

    const opt = {
      margin: [10, 10],
      filename: `Audit_SamaPos_${activeReportTab}_${new Date().toISOString().split('T')[0]}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
    };

    // @ts-ignore
    window.html2pdf().set(opt).from(element).save().then(() => {
      notify("Export PDF", "Le document d'analyse est prêt.", "success");
    });
  };

  return (
    <div className="h-full space-y-8 animate-fadeIn pb-20 pr-2 overflow-y-auto scrollbar-hide">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 no-print">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">Analyses & Audits</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Données consolidées de l'établissement</p>
        </div>
        <div className="flex items-center space-x-3 bg-white dark:bg-slate-900 p-1 rounded-2xl border shadow-sm">
           <button onClick={() => setActiveReportTab('finance')} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeReportTab === 'finance' ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/20' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>Finance</button>
           <button onClick={() => setActiveReportTab('products')} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeReportTab === 'products' ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/20' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>Produits</button>
           <button onClick={() => setActiveReportTab('sessions')} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeReportTab === 'sessions' ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/20' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>Caisses</button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center gap-6 no-print">
        <div className="flex items-center space-x-4 bg-slate-50 dark:bg-slate-800/50 px-6 py-3 rounded-2xl border border-slate-100 dark:border-slate-700">
          <div className="flex flex-col">
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Date de début</span>
            <input type="date" value={exportStartDate} onChange={e => setExportStartDate(e.target.value)} className="bg-transparent font-black text-xs outline-none text-purple-600" />
          </div>
          <span className="text-slate-300 font-bold px-2">→</span>
          <div className="flex flex-col">
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Date de fin</span>
            <input type="date" value={exportEndDate} onChange={e => setExportEndDate(e.target.value)} className="bg-transparent font-black text-xs outline-none text-purple-600" />
          </div>
        </div>
        
        <div className="flex items-center space-x-3 ml-auto">
           <button onClick={handleSendReportByEmail} className="bg-slate-900 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center hover:bg-black">
             <Send size={18} className="mr-3 text-purple-400"/> Envoyer par Email
           </button>
           <button onClick={handleExportPDF} className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 p-4 rounded-2xl text-slate-500 hover:text-rose-600 hover:border-rose-200 transition-all shadow-sm" title="Exporter en PDF">
             <FileDown size={22}/>
           </button>
           <button onClick={handleExportExcel} className="bg-emerald-600 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-emerald-900/20 hover:bg-emerald-700 transition-all flex items-center">
             <FileSpreadsheet size={18} className="mr-3"/> Exporter (.xlsx)
           </button>
        </div>
      </div>
      {/* ... reste du fichier inchangé ... */}
    </div>
  );
};

// Fix: Added missing default export
export default Reports;