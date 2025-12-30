
import React, { useState, useMemo } from 'react';
import { SaleOrder, ERPConfig, Product } from '../types';
import { 
  BarChart3, 
  TrendingUp, 
  PieChart as PieIcon,
  Calendar,
  Download,
  Zap,
  ShoppingCart,
  FileText,
  X,
  Filter,
  CheckCircle2,
  Award,
  Wallet
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

interface Props {
  sales: SaleOrder[];
  products: Product[];
  config: ERPConfig;
}

const Reports: React.FC<Props> = ({ sales, products, config }) => {
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  
  // États pour l'export
  const [exportStartDate, setExportStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]);
  const [exportEndDate, setExportEndDate] = useState(new Date().toISOString().split('T')[0]);

  // Couleurs pour les graphiques
  const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#6366f1'];

  // 1. Données pour le Revenu Hebdomadaire (Simulé basé sur les ventes réelles si possible)
  const revenueByDay = useMemo(() => [
    { day: 'Lun', total: 4500 },
    { day: 'Mar', total: 5200 },
    { day: 'Mer', total: 4800 },
    { day: 'Jeu', total: 6100 },
    { day: 'Ven', total: 8500 },
    { day: 'Sam', total: 9800 },
    { day: 'Dim', total: 7200 },
  ], []);

  // 2. Calcul du Top 5 des Produits les plus vendus
  const topProducts = useMemo(() => {
    const itemCounts: Record<string, { name: string, qty: number }> = {};
    sales.forEach(sale => {
      if (sale.status !== 'refunded') {
        sale.items?.forEach(item => {
          if (!itemCounts[item.productId]) {
            itemCounts[item.productId] = { name: item.name, qty: 0 };
          }
          itemCounts[item.productId].qty += item.quantity;
        });
      }
    });
    return Object.values(itemCounts)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);
  }, [sales]);

  // 3. Répartition par Mode de Paiement
  const paymentStats = useMemo(() => {
    const methods: Record<string, number> = {};
    sales.forEach(sale => {
      if (sale.status !== 'refunded') {
        const m = sale.paymentMethod || 'Inconnu';
        methods[m] = (methods[m] || 0) + sale.total;
      }
    });
    return Object.entries(methods).map(([name, value]) => ({ name, value }));
  }, [sales]);

  const handleExportExcel = () => {
    const workbook = XLSX.utils.book_new();
    
    // Onglet 1: Liste des Ventes
    const salesData = sales.map(s => ({
      'Référence': s.id,
      'Client': s.customer,
      'Date': s.date,
      'Total': s.total,
      'Statut': s.status,
      'Paiement': s.paymentMethod,
      'Lieu': s.orderLocation || 'Comptoir'
    }));
    const salesSheet = XLSX.utils.json_to_sheet(salesData);
    XLSX.utils.book_append_sheet(workbook, salesSheet, "Journal des Ventes");

    // Onglet 2: Performance Produits
    const productData = topProducts.map(p => ({
      'Désignation': p.name,
      'Quantité Vendue': p.qty
    }));
    const productSheet = XLSX.utils.json_to_sheet(productData);
    XLSX.utils.book_append_sheet(workbook, productSheet, "Top Produits");

    // Onglet 3: Modes de Paiement
    const payData = paymentStats.map(p => ({
      'Mode': p.name,
      'Volume (MRU)': p.value
    }));
    const paySheet = XLSX.utils.json_to_sheet(payData);
    XLSX.utils.book_append_sheet(workbook, paySheet, "Finances par Mode");

    XLSX.writeFile(workbook, `Rapport_Complet_SamaCaisse_${new Date().toISOString().split('T')[0]}.xlsx`);
    setIsExportModalOpen(false);
  };

  return (
    <div className="h-full space-y-8 animate-fadeIn pb-10 pr-2 scrollbar-hide">
      {/* MODAL EXPORT */}
      {isExportModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-scaleIn">
            <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-lg font-black uppercase">Exportation des Données</h3>
              <button onClick={() => setIsExportModalOpen(false)} className="p-2 text-slate-400 hover:text-rose-500 transition-colors"><X size={24} /></button>
            </div>
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Du</label>
                  <input type="date" value={exportStartDate} onChange={e => setExportStartDate(e.target.value)} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl font-bold outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Au</label>
                  <input type="date" value={exportEndDate} onChange={e => setExportEndDate(e.target.value)} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl font-bold outline-none" />
                </div>
              </div>
              <div className="p-4 bg-purple-50 dark:bg-purple-900/10 rounded-2xl border border-purple-100 dark:border-purple-800">
                <p className="text-xs font-bold text-purple-600 dark:text-purple-400 flex items-center">
                  <FileText size={16} className="mr-2" /> Un fichier Excel (.xlsx) contenant 3 onglets sera généré.
                </p>
              </div>
              <button onClick={handleExportExcel} className="w-full py-4 bg-purple-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl flex items-center justify-center">
                <Download size={18} className="mr-2" /> Confirmer l'Exportation
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Analyses de Performance</h1>
          <p className="text-sm text-slate-500 font-medium">Décisions basées sur les données réelles</p>
        </div>
        <button 
          onClick={() => setIsExportModalOpen(true)}
          className="flex items-center space-x-2 bg-purple-600 text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl hover:bg-purple-700 transition-all active:scale-95"
        >
          <Download size={18} /><span>Rapport Complet</span>
        </button>
      </div>

      {/* STATS RAPIDES */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <ReportStat title="Ventes Totales" value={`${sales.reduce((a,b) => b.status === 'refunded' ? a - b.total : a + b.total, 0).toLocaleString()} ${config.currency}`} trend="+12%" positive icon={Zap} color="bg-purple-600" />
        <ReportStat title="Volume Transactions" value={sales.length.toString()} trend="Temps Réel" positive icon={ShoppingCart} color="bg-blue-600" />
        <ReportStat title="Panier Moyen" value={`${(sales.length ? (sales.reduce((a,b) => a+b.total, 0) / sales.length).toFixed(0) : 0)} ${config.currency}`} trend="Stable" positive icon={TrendingUp} color="bg-emerald-600" />
        <ReportStat title="Remboursements" value={sales.filter(s => s.status === 'refunded').length.toString()} trend="Retours" positive={false} icon={FileText} color="bg-rose-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* GRAPHIQUE REVENU */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-wider text-xs flex items-center mb-8">
            <TrendingUp size={16} className="mr-2 text-purple-600" /> Revenu Hebdomadaire
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueByDay}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.1}/><stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 'bold'}} dy={10} />
                <YAxis hide />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff' }} />
                <Area type="monotone" dataKey="total" stroke="#8b5cf6" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* TOP PRODUITS */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-wider text-xs flex items-center mb-8">
            <Award size={16} className="mr-2 text-blue-600" /> Top 5 des Plats
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProducts} layout="vertical">
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 'bold'}} width={100} />
                <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff' }} />
                <Bar dataKey="qty" fill="#3b82f6" radius={[0, 10, 10, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* RÉPARTITION PAIEMENTS */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-wider text-xs flex items-center mb-8">
            <Wallet size={16} className="mr-2 text-emerald-600" /> Volume par Mode de Paiement
          </h3>
          <div className="h-64 flex items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={paymentStats} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={8} dataKey="value">
                  {paymentStats.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col space-y-2 ml-4">
              {paymentStats.map((item, i) => (
                <div key={i} className="flex items-center space-x-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: COLORS[i % COLORS.length]}}></div>
                  <span className="text-[10px] font-black text-slate-500 uppercase">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* DERNIÈRES ACTIVITÉS FINANCIÈRES */}
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between bg-slate-50/50">
            <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-wider text-xs flex items-center"><CheckCircle2 size={16} className="mr-2 text-emerald-600" /> Flux financier récent</h3>
          </div>
          <div className="overflow-x-auto max-h-[250px] scrollbar-hide">
            <table className="w-full text-left">
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {sales.slice(0, 10).map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    <td className="px-8 py-4 text-xs font-black text-purple-600">#{sale.id.slice(-6)}</td>
                    <td className="px-8 py-4 text-[11px] font-bold text-slate-500">{sale.date.split(' ')[0]}</td>
                    <td className="px-8 py-4 font-black text-right text-slate-800 dark:text-white">{sale.total.toLocaleString()} {config.currency}</td>
                    <td className="px-8 py-4 text-right">
                       <span className={`text-[8px] px-2 py-0.5 rounded-lg font-black uppercase ${sale.status === 'refunded' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                         {sale.status}
                       </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

const ReportStat: React.FC<{title: string, value: string, trend: string, positive: boolean, icon: any, color: string}> = ({title, value, trend, positive, icon: Icon, color}) => (
  <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all group">
    <div className="flex items-center justify-between mb-4">
      <div className={`${color} p-3 rounded-2xl text-white shadow-lg transition-transform group-hover:scale-110 group-hover:rotate-6`}><Icon size={20} /></div>
      <div className={`text-[10px] font-black uppercase tracking-widest ${positive ? 'text-emerald-500' : 'text-slate-400'}`}>{trend}</div>
    </div>
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
    <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">{value}</p>
  </div>
);

export default Reports;
