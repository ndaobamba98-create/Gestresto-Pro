
import React, { useState, useMemo } from 'react';
import { SaleOrder, UserRole, ERPConfig, Product, ViewType, Expense } from '../types';
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingCart, 
  Eye, 
  ArrowUpRight,
  Zap,
  Package,
  History,
  Monitor,
  FileText,
  IdCard,
  ChevronRight,
  LayoutGrid,
  Users
} from 'lucide-react';
import { CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, XAxis, YAxis } from 'recharts';

interface Props {
  leads: any[];
  sales: SaleOrder[];
  expenses: Expense[];
  userRole: UserRole;
  config: ERPConfig;
  products: Product[];
  t: (key: any) => string;
  onNavigate: (view: ViewType) => void;
}

const Dashboard: React.FC<Props> = ({ sales, expenses = [], userRole, config, products, t, onNavigate }) => {
  const totalRevenue = useMemo(() => sales.reduce((acc, curr) => curr.status === 'refunded' ? acc - curr.total : acc + curr.total, 0), [sales]);
  const totalExpenses = useMemo(() => expenses.reduce((acc, curr) => acc + curr.amount, 0), [expenses]);
  const netProfit = totalRevenue - totalExpenses;
  
  const lowStockProducts = useMemo(() => products.filter(p => p.stock <= (p.lowStockThreshold || 10)), [products]);

  const apps = [
    { id: 'pos', icon: Monitor, label: 'Caisse POS', color: 'bg-emerald-500', desc: 'Vente directe' },
    { id: 'inventory', icon: Package, label: 'Stocks', color: 'bg-orange-500', desc: 'Menu & Logistique' },
    { id: 'invoicing', icon: FileText, label: 'Factures', color: 'bg-indigo-500', desc: 'Comptabilité' },
    { id: 'hr', icon: IdCard, label: 'RH', color: 'bg-slate-700', desc: 'Personnel' },
    { id: 'customers', icon: Users, label: 'Clients', color: 'bg-purple-600', desc: 'Comptes' },
  ];

  return (
    <div className="h-full overflow-y-auto space-y-10 animate-fadeIn pb-20 pr-2 scrollbar-hide">
      
      <div className="space-y-6">
        <div className="flex items-center justify-between">
           <div className="flex items-center space-x-3">
              <div className="p-2 bg-accent/10 rounded-xl text-accent"><LayoutGrid size={20}/></div>
              <h2 className="text-sm font-black uppercase tracking-widest">Workspace ERP</h2>
           </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {apps.map((app) => (
            <button 
              key={app.id}
              onClick={() => onNavigate(app.id as ViewType)}
              className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-accent group transition-all text-center flex flex-col items-center space-y-4"
            >
              <div className={`${app.color} p-4 rounded-2xl text-white shadow-lg group-hover:scale-110 transition-transform`}>
                <app.icon size={28} />
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-tight text-slate-800 dark:text-white leading-none">{app.label}</p>
                <p className="text-[8px] font-bold text-slate-400 uppercase mt-1 opacity-0 group-hover:opacity-100 transition-opacity">{app.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Revenu Brut" value={`${totalRevenue.toLocaleString()} ${config.currency}`} icon={DollarSign} color="bg-emerald-500" trend={`Flux brut`} />
        
        <div className="bg-slate-900 dark:bg-slate-800 p-8 rounded-[3rem] border-2 border-accent/30 shadow-2xl flex items-start justify-between transition-all hover:-translate-y-1 group">
          <div className="space-y-3">
            <p className="text-[10px] font-black text-purple-400 uppercase tracking-[0.2em]">Résultat Net</p>
            <h4 className="text-2xl font-black text-white tracking-tighter">{netProfit.toLocaleString()} <span className="text-xs opacity-40">{config.currency}</span></h4>
            <div className="flex items-center">
              <div className="h-1.5 w-32 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-accent" style={{ width: `${Math.max(0, Math.min(100, (netProfit / (totalRevenue || 1)) * 100))}%` }}></div>
              </div>
              <span className="text-[10px] font-black ml-3 text-emerald-400">{((netProfit / (totalRevenue || 1)) * 100).toFixed(0)}%</span>
            </div>
          </div>
          <div className="bg-accent p-4 rounded-2xl text-white shadow-2xl shadow-accent/40 group-hover:rotate-12 transition-transform">
            <Zap size={24} />
          </div>
        </div>

        <StatCard title="Volume Ventes" value={`${sales.length}`} icon={ShoppingCart} color="bg-blue-500" trend="Transactions" />
        <StatCard title="Ruptures" value={`${lowStockProducts.length}`} icon={Package} color="bg-orange-500" trend="Articles sous seuil" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-[450px]">
          <div className="flex items-center justify-between mb-8">
             <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-tighter text-sm flex items-center">
              <History className="mr-3 text-accent" size={18} /> Journal des Opérations
            </h3>
            <button onClick={() => onNavigate('sales')} className="text-[9px] font-black text-accent uppercase tracking-widest hover:underline flex items-center">Voir Historique <ChevronRight size={14}/></button>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-hide space-y-4">
            {sales.slice(0, 10).map((sale) => (
              <div key={sale.id} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-transparent hover:border-accent transition-all flex items-center justify-between group">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center font-black text-[10px] text-slate-400 shadow-sm">#{sale.id.slice(-3)}</div>
                  <div>
                    <p className="text-xs font-black uppercase text-slate-800 dark:text-slate-200 truncate max-w-[150px]">{sale.customer}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">{sale.date.split(' ')[0]}</p>
                  </div>
                </div>
                <div className="text-right flex items-center space-x-4">
                  <div>
                    <p className={`text-sm font-black tracking-tighter ${sale.status === 'refunded' ? 'text-rose-500 line-through' : 'text-slate-900 dark:text-white'}`}>{sale.total.toLocaleString()} {config.currency}</p>
                    <span className={`text-[8px] px-2 py-0.5 rounded-lg font-black uppercase tracking-widest ${sale.status === 'refunded' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>{sale.status}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
          <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-tighter text-sm mb-10">Activité Hebdomadaire</h3>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={[{name: 'Lun', s: 400}, {name: 'Mar', s: 700}, {name: 'Mer', s: 500}, {name: 'Jeu', s: 900}, {name: 'Ven', s: 1200}, {name: 'Sam', s: 1500}, {name: 'Dim', s: 1100}]}>
                <defs><linearGradient id="colS" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--accent-color)" stopOpacity={0.2}/><stop offset="95%" stopColor="var(--accent-color)" stopOpacity={0}/></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 'bold'}} dy={10} />
                <YAxis hide />
                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px rgba(0,0,0,0.1)' }} />
                <Area type="monotone" dataKey="s" stroke="var(--accent-color)" strokeWidth={4} fillOpacity={1} fill="url(#colS)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{title: string, value: string, icon: any, color: string, trend: string}> = ({title, value, icon: Icon, color, trend}) => (
  <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm flex items-start justify-between transition-all hover:-translate-y-1 hover:shadow-xl group">
    <div className="space-y-3">
      <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">{title}</p>
      <h4 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">{value}</h4>
      <p className="text-[10px] font-black uppercase text-emerald-500 flex items-center">
        <ArrowUpRight size={12} className="mr-1.5" /> {trend}
      </p>
    </div>
    <div className={`${color} p-4 rounded-2xl text-white shadow-2xl transition-transform group-hover:scale-110 group-hover:rotate-6`}>
      <Icon size={24} />
    </div>
  </div>
);

export default Dashboard;
