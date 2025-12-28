
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
  Zap
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
    { name: 'Menus', value: 45 },
    { name: 'Snacks', value: 25 },
    { name: 'Boissons', value: 20 },
    { name: 'Desserts', value: 10 },
  ];

  const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b'];

  const topProducts = products.slice(0, 5).map(p => ({
    name: p.name,
    sales: Math.floor(Math.random() * 50) + 10,
    revenue: 0
  })).sort((a,b) => b.sales - a.sales);

  return (
    <div className="h-full overflow-y-auto space-y-8 animate-fadeIn pb-10 pr-2 scrollbar-hide">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-white">Analyse des Ventes</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Statistiques et performance commerciale</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 rounded-xl flex">
            <button className="px-4 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-white shadow-sm">Hebdomadaire</button>
            <button className="px-4 py-1.5 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800">Mensuel</button>
          </div>
          <button className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 hover:text-purple-600 transition-all shadow-sm">
            <Download size={20} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <ReportStat title="Ventes Totales" value={`45 900 ${config.currency}`} trend="+15%" positive icon={Zap} color="bg-purple-600" />
        <ReportStat title="Marge Brute" value="32%" trend="+2.4%" positive icon={TrendingUp} color="bg-blue-600" />
        <ReportStat title="Pertes / Refus" value={`1 200 ${config.currency}`} trend="-0.8%" positive={false} icon={ArrowDownRight} color="bg-rose-600" />
        <ReportStat title="Nouveaux Clients" value="124" trend="+12" positive icon={Award} color="bg-emerald-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Sales Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-wider text-xs">Ventes de la semaine</h3>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                46 100 <span className="text-sm font-bold text-slate-400">{config.currency}</span>
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-purple-600"></span>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Revenu Réel</span>
            </div>
          </div>
          <div className="h-72 flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueByDay}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                <XAxis 
                  dataKey="day" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 'bold'}} 
                  dy={10} 
                />
                <YAxis hide />
                <Tooltip 
                  cursor={{stroke: '#8b5cf6', strokeWidth: 2}}
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff' }}
                />
                <Area type="monotone" dataKey="total" stroke="#8b5cf6" strokeWidth={4} fillOpacity={1} fill="url(#colorTotal)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Distribution */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-wider text-xs mb-8">Ventes par Catégorie</h3>
          <div className="h-64 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {categoryDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
              <p className="text-2xl font-black text-slate-800 dark:text-white">100%</p>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Répartition</p>
            </div>
          </div>
          <div className="mt-8 space-y-3">
            {categoryDistribution.map((cat, i) => (
              <div key={cat.name} className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="w-2.5 h-2.5 rounded-full mr-3" style={{backgroundColor: COLORS[i]}}></span>
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{cat.name}</span>
                </div>
                <span className="text-xs font-black text-slate-900 dark:text-white">{cat.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-wider text-xs">Produits Vedettes</h3>
            <span className="text-[10px] font-black text-purple-600 uppercase tracking-widest">Semaine en cours</span>
          </div>
          <div className="space-y-6">
            {topProducts.map((prod, i) => (
              <div key={i} className="flex items-center justify-between group">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-sm font-black text-slate-400 group-hover:bg-purple-50 group-hover:text-purple-600 transition-colors">
                    {i + 1}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{prod.name}</p>
                    <p className="text-[10px] text-slate-500 font-medium">{prod.sales} ventes directes</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-24 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-purple-600 rounded-full" 
                      style={{width: `${(prod.sales / topProducts[0].sales) * 100}%`}}
                    ></div>
                  </div>
                  <span className="text-xs font-black text-slate-900 dark:text-white">+{Math.floor(Math.random()*10)+2}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Goals Tracker */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-wider text-xs mb-8">Objectifs de Ventes</h3>
            <div className="space-y-8">
              <div>
                <div className="flex justify-between items-end mb-2">
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Chiffre Hebdo</p>
                  <p className="text-xs font-black text-slate-400">75% atteint</p>
                </div>
                <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{width: '75%'}}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-end mb-2">
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Nouveaux Clients</p>
                  <p className="text-xs font-black text-slate-400">42% atteint</p>
                </div>
                <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{width: '42%'}}></div>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-12 bg-purple-50 dark:bg-purple-900/20 p-6 rounded-2xl flex items-center justify-between border border-purple-100 dark:border-purple-800">
            <div>
              <p className="text-[10px] font-black text-purple-600 uppercase tracking-widest mb-1">Potentiel de Croissance</p>
              <p className="text-lg font-black text-purple-900 dark:text-purple-300">+22.5% prévus</p>
            </div>
            <div className="p-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm text-purple-600">
              <Target size={24} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ReportStat: React.FC<{title: string, value: string, trend: string, positive: boolean, icon: any, color: string}> = ({title, value, trend, positive, icon: Icon, color}) => (
  <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group">
    <div className="flex items-center justify-between mb-4">
      <div className={`${color} p-2 rounded-xl text-white shadow-lg ${color.replace('bg-', 'shadow-')}/20 group-hover:scale-110 transition-transform`}>
        <Icon size={20} />
      </div>
      <div className={`flex items-center text-xs font-black uppercase tracking-widest ${positive ? 'text-emerald-600' : 'text-rose-600'}`}>
        {positive ? <ArrowUpRight size={14} className="mr-1" /> : <ArrowDownRight size={14} className="mr-1" />}
        {trend}
      </div>
    </div>
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
    <p className="text-xl font-black text-slate-900 dark:text-white">{value}</p>
  </div>
);

export default Reports;
