
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
  FileSpreadsheet
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

  const filteredSales = useMemo(() => {
    return sales.filter(sale => {
      const saleDateStr = sale.date.substring(0, 10);
      return saleDateStr >= exportStartDate && saleDateStr <= exportEndDate;
    });
  }, [sales, exportStartDate, exportEndDate]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter(exp => exp.date >= exportStartDate && exp.date <= exportEndDate);
  }, [expenses, exportStartDate, exportEndDate]);

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

    // 1. FEUILLE BILAN
    const summaryData = [
      ["RAPPORT FINANCIER GLOBAL - " + config.companyName.toUpperCase()],
      ["Période", `${exportStartDate} au ${exportEndDate}`],
      ["Date d'extraction", new Date().toLocaleString()],
      [""],
      ["INDICATEURS CLÉS", "MONTANT (" + config.currency + ")"],
      ["Total Recettes Brutes", totalRevenue],
      ["Total Charges & Dépenses", totalCosts],
      ["Bénéfice Net Réel", netResult],
      [""],
      ["Nombre de transactions", filteredSales.length],
      ["Panier Moyen", filteredSales.length > 0 ? (totalRevenue / filteredSales.length).toFixed(2) : 0]
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, wsSummary, "Bilan");

    // 2. FEUILLE VENTES DÉTAILLÉES (ITEM PAR ITEM)
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

    // 3. FEUILLE CHARGES
    const expensesExportData = filteredExpenses.map(e => ({
      'Date': e.date,
      'Référence': e.id,
      'Désignation': e.description,
      'Catégorie': e.category,
      'Mode Paiement': e.paymentMethod,
      'Montant': e.amount,
      'Justificatif': e.attachments && e.attachments.length > 0 ? 'OUI' : 'NON'
    }));
    const wsExpenses = XLSX.utils.json_to_sheet(expensesExportData);
    XLSX.utils.book_append_sheet(workbook, wsExpenses, "Charges");

    // Téléchargement
    XLSX.writeFile(workbook, `Archive_Comptable_${exportStartDate}_au_${exportEndDate}.xlsx`);
    notify("Succès", "L'archive complète a été générée.", "success");
    setIsExportModalOpen(false);
  };

  return (
    <div className="h-full space-y-8 animate-fadeIn pb-10 pr-2 overflow-y-auto scrollbar-hide">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 no-print">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Analyses de Marge</h1>
          <p className="text-sm text-slate-500 font-medium">Audit des flux financiers</p>
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 no-print">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-10">
             <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-wider text-[11px] flex items-center">
               <Scale size={18} className="mr-3 text-purple-600" /> Comparatif Flux
             </h3>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} dy={10} />
                <YAxis hide />
                <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '16px', border: 'none' }} />
                <Bar dataKey="recettes" fill="#10b981" radius={[4, 4, 0, 0]} barSize={16} />
                <Bar dataKey="depenses" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-1 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-wider text-[11px] flex items-center mb-6">
            <FileText size={18} className="mr-3 text-rose-500" /> Charges Récentes PJ
          </h3>
          <div className="space-y-3 overflow-y-auto max-h-[300px] scrollbar-hide pr-2">
             {filteredExpenses.filter(e => e.attachments && e.attachments.length > 0).slice(0, 10).map((e, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100">
                   <div className="flex flex-col">
                      <span className="text-[10px] font-black uppercase truncate max-w-[100px]">{e.description}</span>
                      <span className="text-[8px] font-bold text-slate-400">{e.amount.toLocaleString()} {config.currency}</span>
                   </div>
                   <div className="flex space-x-1">
                      {e.attachments?.map(att => (
                        <a key={att.id} href={att.url} target="_blank" rel="noopener noreferrer" className="p-2 bg-white dark:bg-slate-700 rounded-lg shadow-sm text-purple-600 hover:text-white hover:bg-purple-600 transition-all" title={att.name}>
                           <Paperclip size={12} />
                        </a>
                      ))}
                   </div>
                </div>
             ))}
             {filteredExpenses.filter(e => e.attachments && e.attachments.length > 0).length === 0 && (
               <p className="text-center py-10 text-[9px] font-black text-slate-400 uppercase opacity-50">Aucun justificatif scanné</p>
             )}
          </div>
        </div>
      </div>

      <div className="bg-slate-900 text-white rounded-[3rem] p-10 shadow-2xl relative overflow-hidden group">
         <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="space-y-2">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center"><ArrowUpRight className="text-emerald-500 mr-2" size={16} /> Ventes (A)</p>
               <p className="text-3xl font-black text-emerald-400">{totalRevenue.toLocaleString()} {config.currency}</p>
            </div>
            <div className="space-y-2">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center"><ArrowDownRight className="text-rose-500 mr-2" size={16} /> Charges (B)</p>
               <p className="text-3xl font-black text-rose-500">{totalCosts.toLocaleString()} {config.currency}</p>
            </div>
            <div className="bg-white/5 p-6 rounded-[2rem] border border-white/10 text-center">
               <p className="text-[10px] font-black text-purple-400 uppercase mb-2">Résultat Net</p>
               <p className={`text-4xl font-black ${netResult >= 0 ? 'text-white' : 'text-rose-600'}`}>{netResult.toLocaleString()} {config.currency}</p>
            </div>
         </div>
      </div>
    </div>
  );
};

export default Reports;
