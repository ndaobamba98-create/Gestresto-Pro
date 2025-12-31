
import React, { useState, useMemo, useRef } from 'react';
import { SaleOrder, ERPConfig, Product } from '../types';
import { 
  BarChart3, 
  TrendingUp, 
  Calendar,
  Download,
  Zap,
  ShoppingCart,
  FileText,
  X,
  CheckCircle2,
  Award,
  Wallet,
  FileDown,
  Printer,
  QrCode,
  TrendingDown,
  Info
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
  Area
} from 'recharts';
import * as XLSX from 'xlsx';
import { AppLogoDoc } from './Invoicing';

interface Props {
  sales: SaleOrder[];
  products: Product[];
  config: ERPConfig;
  t: (key: any) => string;
  notify: (title: string, message: string, type?: 'success' | 'info' | 'warning') => void;
}

const Reports: React.FC<Props> = ({ sales, products, config, t, notify }) => {
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

  const revenueByDay = useMemo(() => {
    const days: Record<string, number> = {};
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toLocaleDateString('fr-FR', { weekday: 'short' });
    }).reverse();

    last7Days.forEach(day => days[day] = 0);
    filteredSales.forEach(sale => {
      if (sale.status !== 'refunded') {
        const saleDateStr = sale.date.substring(0, 10);
        const dayName = new Date(saleDateStr).toLocaleDateString('fr-FR', { weekday: 'short' });
        if (days[dayName] !== undefined) days[dayName] += sale.total;
      }
    });
    return Object.entries(days).map(([day, total]) => ({ day, total }));
  }, [filteredSales]);

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

  const paymentStats = useMemo(() => {
    const methods: Record<string, number> = {};
    filteredSales.forEach(sale => {
      if (sale.status !== 'refunded') {
        const m = sale.paymentMethod || 'Inconnu';
        methods[m] = (methods[m] || 0) + sale.total;
      }
    });
    return Object.entries(methods).map(([name, value]) => ({ name, value }));
  }, [filteredSales]);

  const totalRevenue = filteredSales.reduce((a, b) => b.status === 'refunded' ? a - b.total : a + b.total, 0);
  const averageBasket = filteredSales.length > 0 ? (totalRevenue / filteredSales.length).toFixed(0) : 0;

  const handleExportExcel = () => {
    const workbook = XLSX.utils.book_new();
    const summaryData = [
      ["RAPPORT PERFORMANCE - " + config.companyName.toUpperCase()],
      ["Période", `${exportStartDate} au ${exportEndDate}`],
      [""],
      ["Chiffre d'Affaires Net", totalRevenue],
      ["Transactions", filteredSales.length],
      ["Panier Moyen", averageBasket],
      ["Date", new Date().toLocaleString()]
    ];
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(summaryData), "Synthèse");
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(filteredSales), "Journal");
    XLSX.writeFile(workbook, `Rapport_Business_${exportStartDate}_au_${exportEndDate}.xlsx`);
    notify("Export", "Fichier Excel généré.", "success");
    setIsExportModalOpen(false);
  };

  return (
    <div className="h-full space-y-8 animate-fadeIn pb-10 pr-2 scrollbar-hide">
      
      {/* VUE D'IMPRESSION */}
      <div id="report-print-area" className="hidden print:block p-12 bg-white text-slate-900">
         <div className="flex justify-between items-start mb-12 pb-8 border-b-2 border-slate-100">
            <div className="flex items-center space-x-6">
              <AppLogoDoc className="w-20 h-20" />
              <div>
                <h1 className="text-3xl font-black uppercase tracking-tighter leading-none mb-1">{config.companyName}</h1>
                <p className="text-[11px] font-black text-purple-600 uppercase tracking-[0.3em]">Business Performance Report</p>
              </div>
            </div>
            <div className="text-right">
              <h2 className="text-2xl font-black uppercase tracking-tight text-slate-800">Rapport de Synthèse</h2>
              <p className="text-xs font-bold text-slate-500 mt-1">Période du {exportStartDate} au {exportEndDate}</p>
            </div>
         </div>

         <div className="grid grid-cols-4 gap-6 mb-12">
            {[
              { label: 'Recettes Brutes', val: `${totalRevenue.toLocaleString()} ${config.currency}`, color: 'text-purple-600' },
              { label: 'Transactions', val: filteredSales.length, color: 'text-slate-900' },
              { label: 'Panier Moyen', val: `${averageBasket} ${config.currency}`, color: 'text-slate-900' },
              { label: 'Volume Plats', val: topProducts.reduce((a,b) => a + b.qty, 0), color: 'text-emerald-600' }
            ].map((s, i) => (
              <div key={i} className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">{s.label}</p>
                <p className={`text-xl font-black ${s.color}`}>{s.val}</p>
              </div>
            ))}
         </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 no-print">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Analyses Business</h1>
          <p className="text-sm text-slate-500 font-medium">Suivi des performances opérationnelles</p>
        </div>
        <div className="flex items-center space-x-3">
           <button 
             onClick={() => window.print()}
             className="flex items-center space-x-2 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-all shadow-sm"
           >
             <Printer size={18} /><span>Journal PDF</span>
           </button>
           <button 
             onClick={() => setIsExportModalOpen(true)}
             className="flex items-center space-x-2 bg-purple-600 text-white px-8 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-purple-900/20 hover:bg-purple-700 transition-all active:scale-95"
           >
             <Download size={18} /><span>Exporter Rapport</span>
           </button>
        </div>
      </div>

      {/* FILTRES DATES AVEC OUVERTURE CALENDRIER AU CLIC */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center gap-6 no-print">
        <div className="flex items-center space-x-4">
          <div 
            onClick={() => startInputRef.current?.showPicker()} 
            className="flex items-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 p-2 rounded-xl transition-all"
          >
            <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-400 mr-3"><Calendar size={20} /></div>
            <div className="flex flex-col">
               <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Du</span>
               <input 
                 ref={startInputRef}
                 type="date" 
                 value={exportStartDate} 
                 onChange={e => setExportStartDate(e.target.value)} 
                 className="bg-transparent font-black text-xs uppercase outline-none text-purple-600 cursor-pointer" 
               />
            </div>
          </div>
          <span className="text-slate-300 font-black">→</span>
          <div 
            onClick={() => endInputRef.current?.showPicker()} 
            className="flex items-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 p-2 rounded-xl transition-all"
          >
            <div className="flex flex-col">
               <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Au</span>
               <input 
                 ref={endInputRef}
                 type="date" 
                 value={exportEndDate} 
                 onChange={e => setExportEndDate(e.target.value)} 
                 className="bg-transparent font-black text-xs uppercase outline-none text-purple-600 cursor-pointer" 
               />
            </div>
            <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-400 ml-3"><Calendar size={20} /></div>
          </div>
        </div>
        <div className="h-8 w-px bg-slate-100 dark:bg-slate-800 hidden md:block"></div>
        <div className="flex-1">
           <span className="bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 px-4 py-2 rounded-full text-[10px] font-black uppercase">{filteredSales.length} Transactions trouvées</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 no-print">
        <ReportStat title="Ventes Brutes" value={`${totalRevenue.toLocaleString()} ${config.currency}`} trend="+12%" positive icon={Zap} color="bg-purple-600" />
        <ReportStat title="Transactions" value={filteredSales.length.toString()} trend="Service" positive icon={ShoppingCart} color="bg-blue-600" />
        <ReportStat title="Panier Moyen" value={`${averageBasket} ${config.currency}`} trend="Stable" positive icon={TrendingUp} color="bg-emerald-600" />
        <ReportStat title="Avoirs/Retours" value={filteredSales.filter(s => s.status === 'refunded').length.toString()} trend="Pertes" positive={false} icon={FileText} color="bg-rose-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 no-print">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-wider text-[10px] flex items-center mb-8">
            <TrendingUp size={16} className="mr-3 text-purple-600" /> Dynamique des Recettes
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueByDay}>
                <defs><linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.15}/><stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 'bold'}} dy={10} />
                <YAxis hide />
                <Tooltip cursor={{stroke: '#8b5cf6', strokeWidth: 2}} contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '16px', color: '#fff' }} />
                <Area type="monotone" dataKey="total" stroke="#8b5cf6" strokeWidth={5} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-wider text-[10px] flex items-center mb-8">
            <Award size={16} className="mr-3 text-amber-500" /> Top 5 des Meilleures Ventes
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProducts} layout="vertical" margin={{ left: 20 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 'black'}} width={120} />
                <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff' }} />
                <Bar dataKey="qty" fill="#3b82f6" radius={[0, 10, 10, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {isExportModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[200] flex items-center justify-center p-4 no-print">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[3rem] shadow-2xl border border-white/10 overflow-hidden animate-scaleIn">
            <div className="p-10 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <div>
                <h3 className="text-xl font-black uppercase tracking-tighter">Extraction de Données</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Choisir le format d'export</p>
              </div>
              <button onClick={() => setIsExportModalOpen(false)} className="p-2 text-slate-400 hover:text-rose-500 transition-all bg-white dark:bg-slate-700 rounded-full shadow-sm"><X size={24} /></button>
            </div>
            
            <div className="p-10 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button onClick={handleExportExcel} className="group py-6 bg-emerald-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl flex flex-col items-center justify-center hover:bg-emerald-700 transition-all active:scale-95">
                 <Download className="mb-2 group-hover:scale-110 transition-transform" size={24} />
                 Format Excel (.xlsx)
              </button>
              <button onClick={() => window.print()} className="group py-6 bg-rose-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl flex flex-col items-center justify-center hover:bg-rose-700 transition-all active:scale-95">
                 <FileDown className="mb-2 group-hover:scale-110 transition-transform" size={24} />
                 Format PDF (.pdf)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ReportStat: React.FC<{title: string, value: string, trend: string, positive: boolean, icon: any, color: string}> = ({title, value, trend, positive, icon: Icon, color}) => (
  <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-2xl transition-all group overflow-hidden relative">
    <div className={`absolute top-0 right-0 w-24 h-24 ${color} opacity-[0.03] rounded-bl-[4rem] group-hover:scale-150 transition-transform duration-700`}></div>
    <div className="flex items-center justify-between mb-6">
      <div className={`${color} p-4 rounded-2xl text-white shadow-xl shadow-slate-900/10 transition-transform group-hover:scale-110 group-hover:rotate-6`}><Icon size={24} /></div>
      <div className={`flex items-center px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${positive ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'}`}>
        {trend}
      </div>
    </div>
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">{title}</p>
    <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">{value}</p>
  </div>
);

export default Reports;
