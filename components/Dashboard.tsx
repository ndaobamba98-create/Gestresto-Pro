
import React, { useState, useMemo } from 'react';
import { SaleOrder, UserRole, ERPConfig, Product } from '../types';
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingCart, 
  Eye, 
  FileText, 
  X, 
  RotateCcw, 
  ArrowUpRight,
  UserCheck,
  Download,
  Zap,
  AlertTriangle,
  Package
} from 'lucide-react';
import { CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, XAxis, YAxis } from 'recharts';
import * as XLSX from 'xlsx';

interface Props {
  leads: any[];
  sales: SaleOrder[];
  userRole: UserRole;
  config: ERPConfig;
  products: Product[]; // Ajout des produits pour les alertes de stock
}

const SimpleLogoIcon = ({ className = "w-10 h-10" }) => (
  <div className={`bg-slate-900 rounded-xl flex items-center justify-center shadow-md ${className}`}>
    <svg viewBox="0 0 100 100" className="w-7/12 h-7/12" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M30 35C30 26.7 36.7 20 45 20H70V35H45C42.2 35 40 37.2 40 40C40 42.7 42.2 45 45 45H55C63.3 45 70 51.7 70 60C70 68.3 63.3 75 55 75H30V60H55C57.8 60 60 57.8 60 55C60 52.2 57.8 50 55 50H45C36.7 50 30 43.3 30 35Z" fill="#a855f7"/>
    </svg>
  </div>
);

const Dashboard: React.FC<Props> = ({ sales, userRole, config, products }) => {
  const [selectedSale, setSelectedSale] = useState<SaleOrder | null>(null);
  const totalRevenue = sales.reduce((acc, curr) => curr.status === 'refunded' ? acc - curr.total : acc + curr.total, 0);
  const averageOrderValue = sales.length > 0 ? (totalRevenue / sales.length).toFixed(0) : 0;
  const chartData = [ { name: 'Jan', sales: 4000 }, { name: 'Feb', sales: 3000 }, { name: 'Mar', sales: 2000 }, { name: 'Apr', sales: 2780 }, { name: 'May', sales: 1890 }, { name: 'Jun', sales: 2390 } ];
  
  // Calcul des alertes de stock
  const lowStockProducts = useMemo(() => {
    return products.filter(p => {
      const threshold = p.lowStockThreshold || 10;
      return p.stock <= threshold;
    }).sort((a, b) => a.stock - b.stock);
  }, [products]);

  const handleExportFlash = () => {
    const data = [{
      'Date du Rapport': new Date().toLocaleDateString(),
      'Chiffre d\'Affaire': totalRevenue,
      'Nombre de Ventes': sales.length,
      'Panier Moyen': averageOrderValue,
      'Remboursements': sales.filter(s => s.status === 'refunded').length,
      'Alertes Stock': lowStockProducts.length
    }];
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Bilan Flash");
    XLSX.writeFile(workbook, `Bilan_Flash_${Date.now()}.xlsx`);
  };

  const getStatusStyle = (status: string) => {
    switch(status) {
      case 'confirmed': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'delivered': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'refunded': return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400';
    }
  };

  return (
    <div className="h-full overflow-y-auto space-y-8 animate-fadeIn pb-10 pr-2 scrollbar-hide">
      {selectedSale && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-widest text-slate-500">Facturation #{selectedSale.id}</span>
              <button onClick={() => setSelectedSale(null)} className="p-2 hover:text-rose-500 transition-colors"><X size={24} /></button>
            </div>
            <div className="p-10 space-y-8 overflow-y-auto">
               <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-4">
                    <SimpleLogoIcon className="w-12 h-12" />
                    <div><h2 className="text-xl font-black uppercase tracking-tighter">SamaCaisse Pro</h2><p className="text-[9px] font-black text-slate-400 uppercase">{config.companyName}</p></div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black uppercase tracking-widest text-purple-600">Facture</p>
                    <p className="text-xs font-bold text-slate-500">{selectedSale.date}</p>
                  </div>
               </div>
               <div className="bg-slate-50 p-6 rounded-2xl flex justify-between">
                  <div><p className="text-[9px] font-black text-slate-400 uppercase mb-1">Client</p><h4 className="text-md font-black">{selectedSale.customer}</h4></div>
                  <div className="text-right"><p className="text-[9px] font-black text-slate-400 uppercase mb-1">Total</p><h4 className="text-xl font-black text-purple-600">{selectedSale.total.toLocaleString()} {config.currency}</h4></div>
               </div>
               <table className="w-full text-left">
                  <thead><tr className="text-[10px] font-black text-slate-400 uppercase border-b pb-2 tracking-widest"><th className="py-2">Article</th><th className="py-2 text-center">Qté</th><th className="py-2 text-right">Montant</th></tr></thead>
                  <tbody>{selectedSale.items?.map((item, idx) => (<tr key={idx} className="text-sm border-b last:border-0"><td className="py-3 font-bold">{item.name}</td><td className="py-3 text-center">{item.quantity}</td><td className="py-3 text-right font-black">{(item.quantity * item.price).toLocaleString()}</td></tr>))}</tbody>
               </table>
            </div>
            <div className="p-6 border-t flex justify-end"><button onClick={() => setSelectedSale(null)} className="px-6 py-2 bg-slate-900 text-white rounded-xl font-bold uppercase text-xs">Fermer</button></div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Bilan du Service</h1>
          <p className="text-slate-500 text-sm">Rapport consolidé MYA D'OR - {new Date().toLocaleDateString()}</p>
        </div>
        <button 
          onClick={handleExportFlash}
          className="flex items-center space-x-2 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-all shadow-sm"
        >
          <Zap size={16} className="text-amber-500" />
          <span>Rapport Flash</span>
        </button>
      </div>

      {/* ALERTES DE STOCK */}
      {lowStockProducts.length > 0 && (
        <div className="bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/30 rounded-3xl p-6 animate-pulse">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-rose-500 text-white rounded-xl shadow-lg">
              <AlertTriangle size={20} />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase text-rose-600 dark:text-rose-400 tracking-widest">Alertes de Stock ({lowStockProducts.length})</h3>
              <p className="text-[10px] font-bold text-rose-500/70 uppercase">Certains produits sont bientôt en rupture</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {lowStockProducts.slice(0, 6).map(p => (
              <div key={p.id} className="bg-white dark:bg-slate-900/50 p-4 rounded-2xl border border-rose-100 dark:border-rose-900/20 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-400">
                    <Package size={14} />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase truncate max-w-[120px]">{p.name}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Seuil: {p.lowStockThreshold || 10}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-rose-600">{p.stock} restants</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Recettes" value={`${totalRevenue.toLocaleString()} ${config.currency}`} icon={DollarSign} color="bg-blue-500" trend="+12.5%" />
        <StatCard title="Pointages" value={`${sales.length}`} icon={UserCheck} size={24} color="bg-emerald-500" trend="Staff Actif" />
        <StatCard title="Panier Moyen" value={`${averageOrderValue} ${config.currency}`} icon={ShoppingCart} color="bg-purple-500" trend="+2.4%" />
        <StatCard title="Ruptures" value={`${lowStockProducts.length}`} icon={Package} color="bg-rose-500" trend="Alertes Stock" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="font-semibold text-slate-800 dark:text-white mb-8 flex items-center justify-between">
            <span>Graphique des Ventes</span>
            <TrendingUp size={16} className="text-purple-600" />
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs><linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.1}/><stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.1} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} dy={10} />
                <YAxis hide />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff' }} />
                <Area type="monotone" dataKey="sales" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
          <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50">
            <h3 className="font-semibold text-slate-800 dark:text-white flex items-center">
              <FileText className="mr-3 text-purple-600" size={18} /> Flux de Vente
            </h3>
            <button className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center">Voir Tout <ArrowUpRight size={14} className="ml-1" /></button>
          </div>
          <div className="flex-1 overflow-y-auto max-h-[300px] scrollbar-hide">
            {sales.slice(0, 10).map((sale) => (
              <div key={sale.id} className="px-8 py-5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border-b border-slate-50 last:border-0 group">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-600 font-black text-xs">#{sale.id.slice(-3)}</div>
                  <div>
                    <p className="text-sm font-black text-slate-800 dark:text-slate-200 truncate max-w-[120px]">{sale.customer}</p>
                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-tighter">{sale.date}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-6">
                  <div className="text-right">
                    <p className={`text-sm font-black ${sale.status === 'refunded' ? 'text-rose-500 line-through' : 'text-slate-900 dark:text-white'}`}>{sale.total.toLocaleString()} {config.currency}</p>
                    <span className={`text-[8px] px-2 py-0.5 rounded-lg font-black uppercase tracking-widest ${getStatusStyle(sale.status)}`}>{sale.status}</span>
                  </div>
                  <button onClick={() => setSelectedSale(sale)} className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-purple-600 rounded-xl transition-all opacity-0 group-hover:opacity-100"><Eye size={16}/></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{title: string, value: string, icon: any, color: string, trend: string}> = ({title, value, icon: Icon, color, trend}) => (
  <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-start justify-between transition-all hover:-translate-y-1 hover:shadow-xl group">
    <div className="space-y-3">
      <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">{title}</p>
      <h4 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">{value}</h4>
      <p className={`text-[10px] font-black uppercase flex items-center ${trend.includes(' STAFF') || trend.startsWith('-') ? 'text-blue-500' : 'text-emerald-500'}`}>
        <TrendingUp size={12} className="mr-1.5" /> {trend}
      </p>
    </div>
    <div className={`${color} p-4 rounded-2xl text-white shadow-2xl ${color.replace('bg-', 'shadow-')}/20 transition-transform group-hover:scale-110 group-hover:rotate-6`}>
      <Icon size={24} />
    </div>
  </div>
);

export default Dashboard;
