
import React from 'react';
import { SaleOrder, ERPConfig, Product } from '../types';
import { 
  BarChart3, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  PieChart as PieIcon,
  Calendar,
  Download,
  Target,
  Award,
  Zap,
  ShoppingCart,
  FileText,
  Clock,
  Eye
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
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
  
  const revenueByDay = [
    { day: 'Lun', total: 4500 },
    { day: 'Mar', total: 5200 },
    { day: 'Mer', total: 4800 },
    { day: 'Jeu', total: 6100 },
    { day: 'Ven', total: 8500 },
    { day: 'Sam', total: 9800 },
    { day: 'Dim', total: 7200 },
  ];

  const categoryDistribution = [
    { name: 'Petit Déj', value: 15 },
    { name: 'Déjeuner', value: 40 },
    { name: 'Dîner', value: 30 },
    { name: 'Fast Food', value: 15 },
  ];

  const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b'];

  const recentSales = sales.slice(0, 6);

  const handleExportExcel = () => {
    // Onglet 1: Résumé des revenus hebdomadaires
    const revenueSheet = XLSX.utils.json_to_sheet(revenueByDay);
    // Onglet 2: Distribution par catégorie
    const catSheet = XLSX.utils.json_to_sheet(categoryDistribution);
    // Onglet 3: Dernières transactions
    const transactionsSheet = XLSX.utils.json_to_sheet(sales.map(s => ({
      'ID': s.id,
      'Client': s.customer,
      'Date': s.date,
      'Total': s.total,
      'Statut': s.status,
      'Paiement': s.paymentMethod
    })));

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, revenueSheet, "Revenus Hebdo");
    XLSX.utils.book_append_sheet(workbook, catSheet, "Ventes par Service");
    XLSX.utils.book_append_sheet(workbook, transactionsSheet, "Toutes Transactions");

    const fileName = `Analyses_MYA_DOR_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  return (
    <div className="h-full overflow-y-auto space-y-8 animate-fadeIn pb-10 pr-2 scrollbar-hide">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-white">Analyses & Rapports</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Performances détaillées de Gestresto Pro</p>
        </div>
        <div className="flex items-center space-x-3">
          <button onClick={handleExportExcel} className="flex items-center space-x-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 shadow-sm hover:bg-slate-50 transition-all">
            <Download size={16} /><span>Exporter Excel</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <ReportStat title="Ventes Totales" value={`${sales.reduce((a,b) => b.status === 'refunded' ? a - b.total : a + b.total, 0).toLocaleString()} ${config.currency}`} trend="+12%" positive icon={Zap} color="bg-purple-600" />
        <ReportStat title="Factures Payées" value={sales.filter(s => s.invoiceStatus === 'paid').length.toString()} trend="Caisse OK" positive icon={FileText} color="bg-emerald-600" />
        <ReportStat title="Commandes POS" value={sales.length.toString()} trend="+5.0%" positive icon={ShoppingCart} color="bg-blue-600" />
        <ReportStat title="Taux TVA" value={`${config.taxRate}%`} trend="Configuré" positive icon={Target} color="bg-orange-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-wider text-xs flex items-center"><TrendingUp size={16} className="mr-2 text-purple-600" /> Courbe de Revenu Hebdomadaire</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueByDay}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.1}/><stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 'bold'}} dy={10} />
                <YAxis hide />
                <Tooltip cursor={{stroke: '#8b5cf6', strokeWidth: 2}} contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff' }} />
                <Area type="monotone" dataKey="total" stroke="#8b5cf6" strokeWidth={4} fillOpacity={1} fill="url(#colorTotal)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-wider text-xs mb-8 flex items-center"><PieIcon size={16} className="mr-2 text-blue-600" /> Ventes par Services</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryDistribution} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={8} dataKey="value">
                  {categoryDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            {categoryDistribution.map((cat, i) => (
              <div key={cat.name} className="flex items-center justify-between text-[10px] font-bold">
                <div className="flex items-center text-slate-500"><span className="w-2 h-2 rounded-full mr-2" style={{backgroundColor: COLORS[i]}}></span>{cat.name}</div>
                <span className="text-slate-800 dark:text-white">{cat.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-wider text-xs flex items-center"><ShoppingCart size={16} className="mr-2 text-emerald-600" /> Dernières Commandes & Factures</h3>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Temps Réel</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-[10px] font-black text-slate-400 uppercase tracking-widest"><th className="px-8 py-4">ID</th><th className="px-8 py-4">Client</th><th className="px-8 py-4">Date</th><th className="px-8 py-4">Total</th><th className="px-8 py-4">Statut</th><th className="px-8 py-4 text-right">Moyen</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {recentSales.map((sale) => (
                <tr key={sale.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-8 py-4 font-mono font-bold text-purple-600">#{sale.id}</td>
                  <td className="px-8 py-4 font-bold text-slate-800 dark:text-slate-200">{sale.customer}</td>
                  <td className="px-8 py-4 text-xs font-medium text-slate-500">{sale.date}</td>
                  <td className={`px-8 py-4 font-black ${sale.status === 'refunded' ? 'text-rose-500 line-through' : 'text-slate-900 dark:text-white'}`}>{sale.total.toLocaleString()} {config.currency}</td>
                  <td className="px-8 py-4">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${sale.status === 'confirmed' ? 'bg-blue-100 text-blue-700' : sale.status === 'refunded' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>{sale.status}</span>
                  </td>
                  <td className="px-8 py-4 text-right text-[10px] font-black uppercase text-slate-400">{sale.paymentMethod}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const ReportStat: React.FC<{title: string, value: string, trend: string, positive: boolean, icon: any, color: string}> = ({title, value, trend, positive, icon: Icon, color}) => (
  <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group">
    <div className="flex items-center justify-between mb-4">
      <div className={`${color} p-2 rounded-xl text-white shadow-lg ${color.replace('bg-', 'shadow-')}/20 transition-transform group-hover:scale-110`}><Icon size={18} /></div>
      <div className={`text-[10px] font-black uppercase tracking-widest ${positive ? 'text-emerald-600' : 'text-slate-400'}`}>{trend}</div>
    </div>
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
    <p className="text-xl font-black text-slate-900 dark:text-white">{value}</p>
  </div>
);

export default Reports;
