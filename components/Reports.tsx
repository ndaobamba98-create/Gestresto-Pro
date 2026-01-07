
import React, { useState, useMemo, useRef } from 'react';
import { SaleOrder, ERPConfig, Product, Expense } from '../types';
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
  // Fix: Add missing DollarSign import
  DollarSign
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
  AreaChart,
  Area,
  Legend,
  Cell as RechartsCell
} from 'recharts';
import * as XLSX from 'xlsx';

interface Props {
  sales: SaleOrder[];
  expenses: Expense[];
  products: Product[];
  config: ERPConfig;
  t: (key: any) => string;
  notify: (title: string, message: string, type?: 'success' | 'info' | 'warning') => void;
}

const COLORS = ['#8b5cf6', '#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#ec4899'];

const Reports: React.FC<Props> = ({ sales, expenses = [], products, config, t, notify }) => {
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const startInputRef = useRef<HTMLInputElement>(null);
  const endInputRef = useRef<HTMLInputElement>(null);

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

  // Données pour les statistiques de produits
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
      .slice(0, 5);

    return {
      list: sorted,
      chartData: sorted.map(p => ({
        name: p.name.length > 15 ? p.name.substring(0, 12) + '...' : p.name,
        fullName: p.name,
        quantité: p.qty,
        revenu: p.revenue
      }))
    };
  }, [filteredSales, products]);

  const comparisonData = useMemo(() => {
    const data: Record<string, { day: string, recettes: number, depenses: number }> = {};
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayLabel = d.toLocaleDateString('fr-FR', { weekday: 'short' });
      const isoDate = d.toISOString().split('T')[0];
      return { dayLabel, isoDate };
    }).reverse();

    last7Days.forEach(item => data[item.isoDate] = { day: item.dayLabel, recettes: 0, depenses: 0 });
    
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
  }, [filteredSales, filteredExpenses]);

  const totalRevenue = filteredSales.reduce((a, b) => b.status === 'refunded' ? a - b.total : a + b.total, 0);
  const totalCosts = filteredExpenses.reduce((a, b) => a + b.amount, 0);
  const netResult = totalRevenue - totalCosts;

  const handleFullMasterExport = () => {
    const workbook = XLSX.utils.book_new();
    const summaryData = [
      ["RAPPORT FINANCIER GLOBAL - " + config.companyName.toUpperCase()],
      ["Période", `${exportStartDate} au ${exportEndDate}`],
      ["Date d'extraction", new Date().toLocaleString()],
      [""],
      ["INDICATEURS CLÉS", "MONTANT (" + config.currency + ")"],
      ["Total Recettes Brutes", totalRevenue],
      ["Total Charges & DépENSES", totalCosts],
      ["Bénéfice Net Réel", netResult],
      [""],
      ["Nombre de transactions", filteredSales.length],
      ["Panier Moyen", filteredSales.length > 0 ? (totalRevenue / filteredSales.length).toFixed(2) : 0]
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, wsSummary, "Bilan");

    const salesExportData: any[] = [];
    filteredSales.forEach(s => {
      s.items?.forEach(item => {
        salesExportData.push({
          'Date': s.date,
          'Facture': s.id,
          'Client': s.customer,
          'Article': item.name,
          'Quantité': item.quantity,
          'Prix Unitaire': item.price,
          'Total Ligne': item.quantity * item.price,
          'Mode Paiement': s.paymentMethod || 'Espèces',
          'Statut': s.status.toUpperCase(),
          'Emplacement': s.orderLocation || 'Comptoir'
        });
      });
    });
    const wsSales = XLSX.utils.json_to_sheet(salesExportData);
    XLSX.utils.book_append_sheet(workbook, wsSales, "Ventes Détaillées");

    const expensesExportData = filteredExpenses.map(e => ({
      'Date': e.date,
      'Référence': e.id,
      'Désignation': e.description,
      'Catégorie': e.category,
      'Mode Paiement': e.paymentMethod,
      'Montant': e.amount,
    }));
    const wsExpenses = XLSX.utils.json_to_sheet(expensesExportData);
    XLSX.utils.book_append_sheet(workbook, wsExpenses, "Charges");

    XLSX.writeFile(workbook, `Archive_Comptable_${exportStartDate}_au_${exportEndDate}.xlsx`);
    notify("Succès", "L'archive complète a été générée.", "success");
  };

  return (
    <div className="h-full space-y-8 animate-fadeIn pb-20 pr-2 overflow-y-auto scrollbar-hide">
      
      {/* HEADER ACTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 no-print">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Analyses Statistiques</h1>
          <p className="text-sm text-slate-500 font-medium">Performance produits & flux financiers</p>
        </div>
        <div className="flex items-center space-x-3">
           <button onClick={() => window.print()} className="flex items-center space-x-2 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 px-6 py-3 rounded-2xl text-[10px] font-black uppercase hover:bg-slate-50 transition-all shadow-sm">
             <Printer size={18} /><span>Aperçu PDF</span>
           </button>
           <button onClick={handleFullMasterExport} className="flex items-center space-x-2 bg-emerald-600 text-white px-8 py-3.5 rounded-2xl text-xs font-black uppercase shadow-xl hover:bg-emerald-700 transition-all">
             <FileSpreadsheet size={18} className="mr-2" /><span>Télécharger Données</span>
           </button>
        </div>
      </div>

      {/* FILTRES DATES */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center gap-6 no-print">
        <div className="flex items-center space-x-4">
          <div onClick={() => startInputRef.current?.showPicker()} className="flex flex-col cursor-pointer">
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Début</span>
            <input ref={startInputRef} type="date" value={exportStartDate} onChange={e => setExportStartDate(e.target.value)} className="bg-transparent font-black text-xs outline-none text-purple-600" />
          </div>
          <span className="text-slate-300">→</span>
          <div onClick={() => endInputRef.current?.showPicker()} className="flex flex-col cursor-pointer">
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Fin</span>
            <input ref={endInputRef} type="date" value={exportEndDate} onChange={e => setExportEndDate(e.target.value)} className="bg-transparent font-black text-xs outline-none text-purple-600" />
          </div>
        </div>
        <div className="flex items-center space-x-2 ml-auto text-[10px] font-black uppercase text-slate-400">
           <Zap size={14} className="text-purple-600" />
           <span>Données synchronisées en temps réel</span>
        </div>
      </div>

      {/* RÉSULTAT GLOBAL */}
      <div className="bg-slate-900 text-white rounded-[3rem] p-10 shadow-2xl relative overflow-hidden group">
         <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
         <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="space-y-2">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center"><ArrowUpRight className="text-emerald-500 mr-2" size={16} /> Recettes Brutes</p>
               <p className="text-3xl font-black text-white">{totalRevenue.toLocaleString()} <span className="text-xs opacity-40">{config.currency}</span></p>
            </div>
            <div className="space-y-2">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center"><ArrowDownRight className="text-rose-500 mr-2" size={16} /> Charges & Frais</p>
               <p className="text-3xl font-black text-white">{totalCosts.toLocaleString()} <span className="text-xs opacity-40">{config.currency}</span></p>
            </div>
            <div className="bg-white/5 p-6 rounded-[2rem] border border-white/10 text-center">
               <p className="text-[10px] font-black text-purple-400 uppercase mb-2">Bénéfice Net Période</p>
               <p className={`text-4xl font-black ${netResult >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>{netResult.toLocaleString()} {config.currency}</p>
            </div>
         </div>
      </div>

      {/* SECTION PRODUITS LES PLUS VENDUS (STATISTIQUES) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* GRAPHIQUE BARRES QUANTITÉS */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col min-h-[450px]">
           <div className="flex items-center justify-between mb-8">
              <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-tighter text-sm flex items-center">
                <BarChart3 size={20} className="mr-3 text-purple-600" /> Top 5 par Quantité
              </h3>
              <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-xl text-purple-600"><ShoppingCart size={16} /></div>
           </div>
           
           <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={topSellingStats.chartData} layout="vertical" margin={{ left: 20, right: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} strokeOpacity={0.1} />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold', fill: '#94a3b8'}} width={80} />
                    <Tooltip 
                      cursor={{fill: 'transparent'}}
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px rgba(0,0,0,0.1)', fontSize: '11px', fontWeight: 'black' }}
                      formatter={(value) => [value, "Unités vendues"]}
                    />
                    <Bar dataKey="quantité" radius={[0, 10, 10, 0]} barSize={24}>
                       {topSellingStats.chartData.map((entry, index) => (
                         <RechartsCell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                       ))}
                    </Bar>
                 </BarChart>
              </ResponsiveContainer>
           </div>
           <div className="mt-6 pt-4 border-t border-slate-50 dark:border-slate-800">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Volume total sur la période : {topSellingStats.list.reduce((acc,p)=>acc+p.qty, 0)} plats</p>
           </div>
        </div>

        {/* GRAPHIQUE PIE REVENUS */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col min-h-[450px]">
           <div className="flex items-center justify-between mb-8">
              <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-tighter text-sm flex items-center">
                <PieIcon size={20} className="mr-3 text-emerald-500" /> Part du Chiffre d'Affaires
              </h3>
              <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl text-emerald-600"><DollarSign size={16} /></div>
           </div>

           <div className="flex-1 relative">
              <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                    <Pie
                       data={topSellingStats.chartData}
                       dataKey="revenu"
                       nameKey="name"
                       innerRadius={70}
                       outerRadius={100}
                       paddingAngle={5}
                    >
                       {topSellingStats.chartData.map((entry, index) => (
                         <RechartsCell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                       ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px rgba(0,0,0,0.1)', fontSize: '11px' }}
                      formatter={(value: any) => [`${value.toLocaleString()} ${config.currency}`, "Contribution"]}
                    />
                    <Legend verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{fontSize: '10px', fontWeight: 'bold', paddingTop: '20px'}} />
                 </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mb-10">
                 <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Valeur Top 5</span>
                 <span className="text-xl font-black text-slate-900 dark:text-white">{topSellingStats.list.reduce((acc,p)=>acc+p.revenue, 0).toLocaleString()}</span>
              </div>
        </div>
        </div>

      </div>

      {/* FLUX FINANCIERS HEBDOMADAIRES */}
      <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-10">
           <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-wider text-[11px] flex items-center">
             <Scale size={20} className="mr-3 text-blue-600" /> Balance Recettes vs Dépenses (7j)
           </h3>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={comparisonData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 'bold'}} dy={10} />
              <YAxis hide />
              <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px rgba(0,0,0,0.1)' }} />
              <Legend verticalAlign="top" align="right" wrapperStyle={{paddingBottom: '20px', fontSize: '10px', fontWeight: 'black', textTransform: 'uppercase'}} />
              <Bar name="Entrées (+)" dataKey="recettes" fill="#10b981" radius={[6, 6, 0, 0]} barSize={18} />
              <Bar name="Sorties (-)" dataKey="depenses" fill="#ef4444" radius={[6, 6, 0, 0]} barSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Reports;
