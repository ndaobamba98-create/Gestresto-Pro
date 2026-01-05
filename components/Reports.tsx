
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
  Banknote
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
  Legend
} from 'recharts';
import * as XLSX from 'xlsx';
import { AppLogoDoc } from './Invoicing';

interface Props {
  sales: SaleOrder[];
  expenses: Expense[];
  products: Product[];
  config: ERPConfig;
  t: (key: any) => string;
  notify: (title: string, message: string, type?: 'success' | 'info' | 'warning') => void;
}

const Reports: React.FC<Props> = ({ sales, expenses = [], products, config, t, notify }) => {
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const startInputRef = useRef<HTMLInputElement>(null);
  const endInputRef = useRef<HTMLInputElement>(null);

  const [exportStartDate, setExportStartDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
  });
  const [exportEndDate, setExportEndDate] = useState(new Date().toISOString().split('T')[0]);

  const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#6366f1'];

  const filteredSales = useMemo(() => {
    return sales.filter(sale => {
      const saleDateStr = sale.date.substring(0, 10);
      return saleDateStr >= exportStartDate && saleDateStr <= exportEndDate;
    });
  }, [sales, exportStartDate, exportEndDate]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter(exp => exp.date >= exportStartDate && exp.date <= exportEndDate);
  }, [expenses, exportStartDate, exportEndDate]);

  // Données pour graphique comparatif Recettes vs Dépenses
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

  const topProducts = useMemo(() => {
    const itemCounts: Record<string, { name: string, qty: number }> = {};
    filteredSales.forEach(sale => {
      if (sale.status !== 'refunded') {
        sale.items?.forEach(item => {
          if (!itemCounts[item.productId]) itemCounts[item.productId] = { name: item.name, qty: 0 };
          itemCounts[item.productId].qty += item.quantity;
        });
      }
    });
    return Object.values(itemCounts).sort((a, b) => b.qty - a.qty).slice(0, 5);
  }, [filteredSales]);

  const totalRevenue = filteredSales.reduce((a, b) => b.status === 'refunded' ? a - b.total : a + b.total, 0);
  const totalCosts = filteredExpenses.reduce((a, b) => a + b.amount, 0);
  const netResult = totalRevenue - totalCosts;

  const handleExportExcel = () => {
    const workbook = XLSX.utils.book_new();
    const summaryData = [
      ["BILAN DE RENTABILITÉ - " + config.companyName.toUpperCase()],
      ["Période", `${exportStartDate} au ${exportEndDate}`],
      [""],
      ["Total Recettes Brutes", totalRevenue],
      ["Total Charges/Frais", totalCosts],
      ["Bénéfice Net Réel", netResult],
      ["Date d'export", new Date().toLocaleString()]
    ];
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(summaryData), "Bilan Financier");
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(filteredSales), "Ventes");
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(filteredExpenses), "Charges");
    XLSX.writeFile(workbook, `Rapport_Financier_${exportStartDate}_au_${exportEndDate}.xlsx`);
    notify("Export", "Bilan financier généré avec succès.", "success");
    setIsExportModalOpen(false);
  };

  return (
    <div className="h-full space-y-8 animate-fadeIn pb-10 pr-2 overflow-y-auto scrollbar-hide">
      
      {/* HEADER DYNAMIQUE */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 no-print">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Analyses de Marge</h1>
          <p className="text-sm text-slate-500 font-medium">Performance réelle et déduction des charges</p>
        </div>
        <div className="flex items-center space-x-3">
           <button 
             onClick={() => window.print()}
             className="flex items-center space-x-2 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-all shadow-sm"
           >
             <Printer size={18} /><span>Aperçu PDF</span>
           </button>
           <button 
             onClick={() => setIsExportModalOpen(true)}
             className="flex items-center space-x-2 bg-purple-600 text-white px-8 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-purple-900/20 hover:bg-purple-700 transition-all active:scale-95"
           >
             <Download size={18} /><span>Exporter Excel</span>
           </button>
        </div>
      </div>

      {/* FILTRES DATES */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center gap-6 no-print">
        <div className="flex items-center space-x-4">
          <div onClick={() => startInputRef.current?.showPicker()} className="flex items-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 p-2 rounded-xl transition-all">
            <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-400 mr-3"><Calendar size={20} /></div>
            <div className="flex flex-col">
               <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Date Début</span>
               <input ref={startInputRef} type="date" value={exportStartDate} onChange={e => setExportStartDate(e.target.value)} className="bg-transparent font-black text-xs uppercase outline-none text-purple-600" />
            </div>
          </div>
          <span className="text-slate-300 font-black">→</span>
          <div onClick={() => endInputRef.current?.showPicker()} className="flex items-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 p-2 rounded-xl transition-all">
            <div className="flex flex-col">
               <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Date Fin</span>
               <input ref={endInputRef} type="date" value={exportEndDate} onChange={e => setExportEndDate(e.target.value)} className="bg-transparent font-black text-xs uppercase outline-none text-purple-600" />
            </div>
            <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-400 ml-3"><Calendar size={20} /></div>
          </div>
        </div>
        <div className="flex-1 text-right">
           <span className="bg-slate-900 text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">Analyse sur {(new Date(exportEndDate).getTime() - new Date(exportStartDate).getTime()) / (1000 * 3600 * 24)} jours</span>
        </div>
      </div>

      {/* GRAPHIQUE COMPARATIF ODOO STYLE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 no-print">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-10">
             <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-wider text-[11px] flex items-center">
               <Scale size={18} className="mr-3 text-purple-600" /> Comparatif Recettes vs Charges
             </h3>
             <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2"><div className="w-3 h-3 rounded-full bg-emerald-500"></div><span className="text-[10px] font-black uppercase text-slate-400">Ventes</span></div>
                <div className="flex items-center space-x-2"><div className="w-3 h-3 rounded-full bg-rose-500"></div><span className="text-[10px] font-black uppercase text-slate-400">Charges</span></div>
             </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 'bold'}} dy={10} />
                <YAxis hide />
                <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px rgba(0,0,0,0.05)', fontSize: '10px' }} />
                <Bar dataKey="recettes" fill="#10b981" radius={[4, 4, 0, 0]} barSize={16} />
                <Bar dataKey="depenses" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-1 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-wider text-[11px] flex items-center mb-8">
            <Award size={18} className="mr-3 text-amber-500" /> Best Sellers (Volume)
          </h3>
          <div className="space-y-4">
             {topProducts.map((p, i) => (
               <div key={i} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                  <div className="flex items-center space-x-4">
                     <span className="w-8 h-8 rounded-lg bg-white dark:bg-slate-700 flex items-center justify-center text-[10px] font-black text-purple-600 border">#{i+1}</span>
                     <span className="text-xs font-black uppercase truncate max-w-[120px]">{p.name}</span>
                  </div>
                  <span className="text-sm font-black text-slate-900 dark:text-white">x{p.qty}</span>
               </div>
             ))}
          </div>
        </div>
      </div>

      {/* SECTION DEDUCTION FINALE (EN BAS COMME DEMANDÉ) */}
      <div className="bg-slate-900 text-white rounded-[3rem] p-10 shadow-2xl relative overflow-hidden group no-print">
         <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2"></div>
         
         <div className="relative z-10 space-y-10">
            <div className="flex items-center space-x-4">
               <div className="p-3 bg-purple-600 rounded-2xl"><Banknote size={24}/></div>
               <div>
                 <h2 className="text-2xl font-black uppercase tracking-tighter">Bilan de Rentabilité</h2>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Calcul automatique des bénéfices réels</p>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 border-t border-slate-800 pt-10">
               <div className="space-y-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center"><ArrowUpRight className="text-emerald-500 mr-2" size={16} /> Total Recettes (A)</p>
                  <p className="text-3xl font-black tracking-tighter text-emerald-400">{totalRevenue.toLocaleString()} <span className="text-xs font-bold text-slate-500">{config.currency}</span></p>
               </div>
               <div className="space-y-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center"><ArrowDownRight className="text-rose-500 mr-2" size={16} /> Total Charges (B)</p>
                  <p className="text-3xl font-black tracking-tighter text-rose-500">{totalCosts.toLocaleString()} <span className="text-xs font-bold text-slate-500">{config.currency}</span></p>
               </div>
               <div className="bg-white/5 p-8 rounded-[2rem] border border-white/10 space-y-4">
                  <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest text-center">RÉSULTAT NET (A - B)</p>
                  <div className="text-center">
                    <p className={`text-4xl font-black tracking-tighter ${netResult >= 0 ? 'text-white' : 'text-rose-600'}`}>
                      {netResult.toLocaleString()} <span className="text-sm font-bold opacity-40">{config.currency}</span>
                    </p>
                    <div className={`mt-4 inline-flex items-center px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${netResult >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                       {netResult >= 0 ? 'Excédent Financier' : 'Déficit de période'}
                    </div>
                  </div>
               </div>
            </div>
         </div>
      </div>

      {isExportModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[200] flex items-center justify-center p-4 no-print">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[3rem] shadow-2xl border border-white/10 overflow-hidden animate-scaleIn">
            <div className="p-10 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <div>
                <h3 className="text-xl font-black uppercase tracking-tighter">Export Financier</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Générer le rapport complet</p>
              </div>
              <button onClick={() => setIsExportModalOpen(false)} className="p-2 text-slate-400 hover:text-rose-500 transition-all bg-white dark:bg-slate-700 rounded-full shadow-sm"><X size={24} /></button>
            </div>
            <div className="p-10 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button onClick={handleExportExcel} className="group py-8 bg-emerald-600 text-white rounded-[2rem] font-black uppercase text-[10px] tracking-widest shadow-xl flex flex-col items-center justify-center hover:bg-emerald-700 transition-all active:scale-95">
                 <FileDown className="mb-3 group-hover:scale-110 transition-transform" size={28} />
                 Excel (.XLSX)
              </button>
              <button onClick={() => window.print()} className="group py-8 bg-slate-900 text-white rounded-[2rem] font-black uppercase text-[10px] tracking-widest shadow-xl flex flex-col items-center justify-center hover:bg-black transition-all active:scale-95">
                 <Printer className="mb-3 group-hover:scale-110 transition-transform" size={28} />
                 Aperçu PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
