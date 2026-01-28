
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
  Users,
  Wifi,
  Copy,
  ArrowDownRight,
  Wallet,
  Coins,
  // Fix: Added missing BarChart3 import
  BarChart3
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
  
  const payrollTotal = useMemo(() => 
    expenses.filter(e => e.category === 'Salaires').reduce((acc, curr) => acc + curr.amount, 0)
  , [expenses]);

  const otherExpenses = useMemo(() => 
    expenses.filter(e => e.category !== 'Salaires').reduce((acc, curr) => acc + curr.amount, 0)
  , [expenses]);

  const totalExpenses = payrollTotal + otherExpenses;
  const netProfit = totalRevenue - totalExpenses;

  const apps = [
    { id: 'pos', icon: Monitor, label: 'Caisse POS', color: 'bg-emerald-500', desc: 'Vente directe' },
    { id: 'inventory', icon: Package, label: 'Stocks', color: 'bg-orange-500', desc: 'Menu & Logistique' },
    { id: 'expenses', icon: Wallet, label: 'Dépenses', color: 'bg-rose-500', desc: 'Frais & Journal' },
    { id: 'hr', icon: IdCard, label: 'RH & Paie', color: 'bg-slate-700', desc: 'Masse Salariale' },
    { id: 'reports', icon: BarChart3, label: 'Analyses', color: 'bg-indigo-500', desc: 'Rapports' },
  ];

  return (
    <div className="h-full overflow-y-auto space-y-10 animate-fadeIn pb-20 pr-2 scrollbar-hide">
      
      <div className="space-y-6">
        <div className="flex items-center justify-between">
           <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-600/10 rounded-xl text-purple-600"><LayoutGrid size={20}/></div>
              <h2 className="text-sm font-black uppercase tracking-widest">Menu Principal</h2>
           </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {apps.map((app) => (
            <button 
              key={app.id}
              onClick={() => onNavigate(app.id as ViewType)}
              className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-purple-500 group transition-all text-center flex flex-col items-center space-y-4"
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
        <StatCard title="Revenu Brut" value={`${totalRevenue.toLocaleString()} ${config.currency}`} icon={TrendingUp} color="bg-emerald-500" trend={`Encaissements`} />
        
        <div className="bg-slate-900 dark:bg-slate-800 p-8 rounded-[3rem] border-2 border-purple-500/30 shadow-2xl flex items-start justify-between transition-all hover:-translate-y-1 group">
          <div className="space-y-3">
            <p className="text-[10px] font-black text-purple-400 uppercase tracking-[0.2em]">Résultat Net</p>
            <h4 className="text-2xl font-black text-white tracking-tighter">{netProfit.toLocaleString()} <span className="text-xs opacity-40">{config.currency}</span></h4>
            <div className="flex items-center">
              <div className="h-1.5 w-32 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500" style={{ width: `${Math.max(0, Math.min(100, (netProfit / (totalRevenue || 1)) * 100))}%` }}></div>
              </div>
              <span className="text-[10px] font-black ml-3 text-emerald-400">{((netProfit / (totalRevenue || 1)) * 100).toFixed(0)}%</span>
            </div>
          </div>
          <div className="bg-purple-600 p-4 rounded-2xl text-white shadow-2xl shadow-purple-900/40 group-hover:rotate-12 transition-transform">
            <Zap size={24} />
          </div>
        </div>

        <StatCard title="Masse Salariale" value={`${payrollTotal.toLocaleString()} ${config.currency}`} icon={Users} color="bg-blue-500" trend="Payé ce mois" />
        <StatCard title="Charges Opé." value={`${otherExpenses.toLocaleString()} ${config.currency}`} icon={ArrowDownRight} color="bg-rose-500" trend="Hors salaires" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-[450px]">
          <div className="flex items-center justify-between mb-8">
             <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-tighter text-sm flex items-center">
              <History className="mr-3 text-purple-600" size={18} /> Flux de Trésorerie Récents
            </h3>
            <button onClick={() => onNavigate('sales')} className="text-[9px] font-black text-purple-600 uppercase tracking-widest hover:underline flex items-center">Journal Complet <ChevronRight size={14}/></button>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-hide space-y-4">
            {expenses.slice(0, 5).map(exp => (
              <div key={exp.id} className="p-4 bg-rose-50/50 dark:bg-rose-900/5 rounded-2xl border border-transparent hover:border-rose-200 transition-all flex items-center justify-between group">
                 <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-rose-500 shadow-sm"><ArrowDownRight size={18}/></div>
                    <div>
                       <p className="text-xs font-black uppercase text-slate-800 dark:text-slate-200 truncate max-w-[200px]">{exp.description}</p>
                       <p className="text-[9px] font-bold text-slate-400 uppercase">{exp.category}</p>
                    </div>
                 </div>
                 <span className="text-sm font-black text-rose-600">-{exp.amount.toLocaleString()}</span>
              </div>
            ))}
            {sales.slice(0, 5).map((sale) => (
              <div key={sale.id} className="p-4 bg-emerald-50/50 dark:bg-emerald-900/5 rounded-2xl border border-transparent hover:border-emerald-200 transition-all flex items-center justify-between group">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-emerald-500 shadow-sm"><ArrowUpRight size={18}/></div>
                  <div>
                    <p className="text-xs font-black uppercase text-slate-800 dark:text-slate-200 truncate max-w-[200px]">{sale.customer}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase">{new Date(sale.date).toLocaleDateString()}</p>
                  </div>
                </div>
                <span className="text-sm font-black text-emerald-600">+{sale.total.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
          <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-tighter text-sm mb-10">Performance Ventes</h3>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={[{name: 'Lun', s: 400}, {name: 'Mar', s: 700}, {name: 'Mer', s: 500}, {name: 'Jeu', s: 900}, {name: 'Ven', s: 1200}, {name: 'Sam', s: 1500}, {name: 'Dim', s: 1100}]}>
                <defs><linearGradient id="colS" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#9333ea" stopOpacity={0.2}/><stop offset="95%" stopColor="#9333ea" stopOpacity={0}/></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 'bold'}} dy={10} />
                <YAxis hide />
                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px rgba(0,0,0,0.1)' }} />
                <Area type="monotone" dataKey="s" stroke="#9333ea" strokeWidth={4} fillOpacity={1} fill="url(#colS)" />
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
      <p className="text-[10px] font-black uppercase text-slate-400 flex items-center">
        {trend}
      </p>
    </div>
    <div className={`${color} p-4 rounded-2xl text-white shadow-2xl transition-transform group-hover:scale-110 group-hover:rotate-6`}>
      <Icon size={24} />
    </div>
  </div>
);

export default Dashboard;
