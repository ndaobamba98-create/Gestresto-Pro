
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
  DownloadCloud
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
}

const COLORS = ['#8b5cf6', '#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#ec4899'];

const Reports: React.FC<Props> = ({ sales, expenses = [], products, config, t, notify, sessions }) => {
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
      .slice(0, 10); // Augmenté à 10 pour l'export

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
    
    // Générer les jours entre start et end
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

  const totalRevenue = filteredSales.reduce((a, b) => b.status === 'refunded' ? a - b.total : a + b.total, 0);
  const totalCosts = filteredExpenses.reduce((a, b) => a + b.amount, 0);
  const netResult = totalRevenue - totalCosts;

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
           <button onClick={handleExportPDF} className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 p-4 rounded-2xl text-slate-500 hover:text-rose-600 hover:border-rose-200 transition-all shadow-sm" title="Exporter en PDF">
             <FileDown size={22}/>
           </button>
           <button onClick={handleExportExcel} className="bg-emerald-600 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-emerald-900/20 hover:bg-emerald-700 transition-all flex items-center">
             <FileSpreadsheet size={18} className="mr-3"/> Exporter (.xlsx)
           </button>
        </div>
      </div>

      <div id="report-export-area">
        {activeReportTab === 'finance' && (
          <div className="space-y-8 animate-fadeIn">
             <div className="bg-slate-900 text-white rounded-[3rem] p-10 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-12 text-center md:text-left">
                   <div className="space-y-2">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-center md:justify-start"><ArrowUpRight className="text-emerald-500 mr-2" size={16} /> Recettes Totales</p>
                      <p className="text-3xl font-black text-white">{totalRevenue.toLocaleString()} <span className="text-xs opacity-40">{config.currency}</span></p>
                   </div>
                   <div className="space-y-2">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-center md:justify-start"><ArrowDownRight className="text-rose-500 mr-2" size={16} /> Charges Cumulées</p>
                      <p className="text-3xl font-black text-white">{totalCosts.toLocaleString()} <span className="text-xs opacity-40">{config.currency}</span></p>
                   </div>
                   <div className="bg-white/5 p-6 rounded-[2rem] border border-white/10 text-center">
                      <p className="text-[10px] font-black text-purple-400 uppercase mb-2">Résultat Net</p>
                      <p className={`text-4xl font-black ${netResult >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>{netResult.toLocaleString()} <span className="text-xs">{config.currency}</span></p>
                   </div>
                </div>
             </div>

             <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm">
               <div className="flex items-center justify-between mb-10">
                  <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-wider text-[11px] flex items-center">
                    <Scale size={20} className="mr-3 text-blue-600" /> Comparatif Entrées / Sorties par Jour
                  </h3>
               </div>
               <div className="h-80">
                 <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={comparisonData}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                     <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 'bold'}} dy={10} />
                     <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 'bold'}} />
                     <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px rgba(0,0,0,0.1)' }} />
                     <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }} />
                     <Bar name="Recettes" dataKey="recettes" fill="#10b981" radius={[6, 6, 0, 0]} barSize={20} />
                     <Bar name="Dépenses" dataKey="depenses" fill="#ef4444" radius={[6, 6, 0, 0]} barSize={20} />
                   </BarChart>
                 </ResponsiveContainer>
               </div>
             </div>
          </div>
        )}

        {activeReportTab === 'products' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fadeIn">
             <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col min-h-[500px]">
                <div className="flex items-center justify-between mb-12">
                   <div className="flex items-center">
                      <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-2xl text-purple-600 mr-4 shadow-sm"><ShoppingCart size={20} /></div>
                      <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-tighter text-sm">Top 5 - Volume des Ventes</h3>
                   </div>
                </div>
                <div className="flex-1">
                   <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={topSellingStats.chartData} layout="vertical" margin={{ left: 20, right: 40 }}>
                         <XAxis type="number" hide />
                         <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 'bold', fill: '#94a3b8'}} width={100} />
                         <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px rgba(0,0,0,0.1)', fontSize: '11px' }} />
                         <Bar dataKey="quantité" radius={[0, 10, 10, 0]} barSize={30}>
                            {topSellingStats.chartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                         </Bar>
                      </BarChart>
                   </ResponsiveContainer>
                </div>
             </div>

             <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col min-h-[500px]">
                <div className="flex items-center justify-between mb-12">
                   <div className="flex items-center">
                      <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl text-emerald-600 mr-4 shadow-sm"><PieIcon size={20} /></div>
                      <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-tighter text-sm">Répartition du CA</h3>
                   </div>
                </div>
                <div className="flex-1 relative">
                   <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                         <Pie data={topSellingStats.chartData} dataKey="revenu" nameKey="name" innerRadius={80} outerRadius={110} paddingAngle={5}>
                            {topSellingStats.chartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                         </Pie>
                         <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', fontSize: '11px' }} />
                      </PieChart>
                   </ResponsiveContainer>
                   <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mb-4">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Total Segment</span>
                      <span className="text-2xl font-black text-slate-900 dark:text-white">{topSellingStats.list.reduce((acc,p)=>acc+p.revenue, 0).toLocaleString()}</span>
                      <span className="text-[9px] font-black text-purple-600 uppercase">{config.currency}</span>
                   </div>
                </div>
             </div>
          </div>
        )}

        {activeReportTab === 'sessions' && (
          <div className="bg-white dark:bg-slate-900 rounded-[3rem] border-2 border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden animate-fadeIn">
             <div className="p-8 border-b bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                   <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl"><Monitor size={24}/></div>
                   <h2 className="text-xl font-black uppercase tracking-tight">Historique des Sessions</h2>
                </div>
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{sessions.length} Sessions archivées</span>
             </div>
             
             <div className="overflow-x-auto">
               <table className="w-full text-left">
                 <thead className="bg-slate-900 text-white">
                   <tr className="text-[10px] font-black uppercase tracking-widest">
                     <th className="px-10 py-5">Caissier / ID</th>
                     <th className="px-10 py-5 text-center">Ouvert le</th>
                     <th className="px-10 py-5 text-center">Fermé le</th>
                     <th className="px-10 py-5 text-right">Attendu</th>
                     <th className="px-10 py-5 text-right">Compté</th>
                     <th className="px-10 py-5 text-center">Écart</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                   {sessions.map((sess) => (
                     <tr key={sess.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                       <td className="px-10 py-6">
                          <div className="flex flex-col">
                             <span className="text-xs font-black uppercase">{sess.cashierName}</span>
                             <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">#{sess.id.slice(-6)}</span>
                          </div>
                       </td>
                       <td className="px-10 py-6 text-center text-[10px] font-bold text-slate-500">
                          {new Date(sess.openedAt).toLocaleString('fr-FR', {day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit'})}
                       </td>
                       <td className="px-10 py-6 text-center text-[10px] font-bold text-slate-500">
                          {sess.closedAt ? new Date(sess.closedAt).toLocaleString('fr-FR', {day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit'}) : '---'}
                       </td>
                       <td className="px-10 py-6 text-right font-black text-xs text-slate-800 dark:text-slate-200">
                          {sess.expectedBalance.toLocaleString()} {config.currency}
                       </td>
                       <td className="px-10 py-6 text-right font-black text-xs text-slate-900 dark:text-white">
                          {sess.closingBalance?.toLocaleString() || '---'} {config.currency}
                       </td>
                       <td className="px-10 py-6 text-center">
                          <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 ${sess.difference === 0 ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : sess.difference! > 0 ? 'bg-blue-50 border-blue-100 text-blue-600' : 'bg-rose-50 border-rose-100 text-rose-600'}`}>
                             {sess.difference === 0 ? 'OK' : sess.difference! > 0 ? `+${sess.difference}` : sess.difference}
                          </span>
                       </td>
                     </tr>
                   ))}
                   {sessions.length === 0 && (
                     <tr>
                       <td colSpan={6} className="py-24 text-center opacity-20">
                          <Lock size={64} className="mx-auto mb-6" />
                          <p className="font-black uppercase text-sm tracking-[0.3em]">Aucun archivage disponible</p>
                       </td>
                     </tr>
                   )}
                 </tbody>
               </table>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
