
import React, { useState } from 'react';
import { Lead, SaleOrder, UserRole, ERPConfig } from '../types';
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  Package, 
  ArrowUpRight, 
  ShoppingCart, 
  Eye, 
  FileText, 
  X, 
  Printer, 
  DownloadCloud,
  CheckCircle2,
  Clock,
  Truck,
  RotateCcw,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Banknote
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface Props {
  leads: Lead[];
  sales: SaleOrder[];
  userRole: UserRole;
  config: ERPConfig;
}

const LogoG = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10" />
    <path d="M16 8.5C15.1 7.6 13.8 7 12.3 7 9.4 7 7 9.2 7 12s2.4 5 5.3 5c2.4 0 4.4-1.5 5.1-3.5H12" />
  </svg>
);

const Dashboard: React.FC<Props> = ({ leads, sales, userRole, config }) => {
  const [selectedSale, setSelectedSale] = useState<SaleOrder | null>(null);
  const totalRevenue = sales.reduce((acc, curr) => curr.status === 'refunded' ? acc - curr.total : acc + curr.total, 0);
  const averageOrderValue = sales.length > 0 ? (totalRevenue / sales.length).toFixed(0) : 0;
  const chartData = [ { name: 'Jan', sales: 4000, leads: 24 }, { name: 'Feb', sales: 3000, leads: 13 }, { name: 'Mar', sales: 2000, leads: 98 }, { name: 'Apr', sales: 2780, leads: 39 }, { name: 'May', sales: 1890, leads: 48 }, { name: 'Jun', sales: 2390, leads: 38 } ];
  const cashierSales = sales.filter(s => s.customer === 'Vente Comptoir');

  const getStatusStyle = (status: string) => {
    switch(status) {
      case 'confirmed': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'delivered': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'quotation': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
      case 'refunded': return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400';
    }
  };

  const InvoiceModal = ({ sale, onClose }: { sale: SaleOrder, onClose: () => void }) => {
    const [date, time] = sale.date.includes(' ') ? sale.date.split(' ') : [sale.date, '--:--'];
    return (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
        <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden animate-scaleIn border border-slate-200 dark:border-slate-800 flex flex-col">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
            <div className="flex items-center space-x-2">
              <Printer className="text-slate-400" size={18} />
              <span className="text-xs font-black uppercase tracking-widest text-slate-500">Détails Facturation</span>
            </div>
            <div className="flex items-center space-x-2">
              <button className="p-2 text-slate-400 hover:text-purple-600 transition-colors"><Printer size={20} /></button>
              <button onClick={onClose} className="p-2 text-slate-400 hover:text-rose-500 transition-colors ml-4"><X size={24} /></button>
            </div>
          </div>
          
          <div className="p-10 space-y-10 overflow-y-auto max-h-[80vh]">
            <div className="flex justify-between items-start">
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                    <LogoG className="text-white w-7 h-7" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">
                      Gestresto<span className="text-purple-600">Pro</span>
                    </h2>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{config.companyName}</p>
                  </div>
                </div>
                <div className="text-[10px] text-slate-500 font-bold space-y-0.5">
                  <p className="flex items-center"><MapPin size={10} className="mr-1.5" /> {config.address}</p>
                  <p className="flex items-center"><Phone size={10} className="mr-1.5" /> {config.phone}</p>
                </div>
              </div>

              <div className="text-right space-y-2">
                <div className="space-y-0.5">
                  <p className="text-[9px] font-black text-slate-400 uppercase">Facture Référence</p>
                  <p className="text-lg font-mono font-black text-slate-800 dark:text-white">#{sale.id}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[9px] font-black text-slate-400 uppercase">Transaction le</p>
                  <p className="text-sm font-black text-slate-800 dark:text-white flex items-center justify-end">
                    <Calendar size={13} className="mr-2 text-slate-400" /> {date}
                  </p>
                  <p className="text-xs font-bold text-slate-500 flex items-center justify-end">
                    <Clock size={12} className="mr-2 text-slate-400" /> {time}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-100 dark:border-slate-700 flex justify-between items-center">
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Client</p>
                <h4 className="text-md font-black text-slate-800 dark:text-white">{sale.customer}</h4>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Paiement</p>
                <div className="flex items-center text-slate-800 dark:text-white font-black text-sm">
                  <Banknote size={14} className="mr-1.5 text-purple-600" />
                  {sale.paymentMethod || 'Espèces'}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-12 px-4 py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                <div className="col-span-8">Article</div>
                <div className="col-span-2 text-center">Qté</div>
                <div className="col-span-2 text-right">Total</div>
              </div>
              {(sale.items || []).map((item, idx) => (
                <div key={idx} className={`grid grid-cols-12 px-4 py-2 text-sm border-b border-slate-50 dark:border-slate-800/50 ${sale.status === 'refunded' ? 'text-slate-400 line-through opacity-60 grayscale' : ''}`}>
                  <div className="col-span-8 font-bold text-slate-800 dark:text-slate-200">{item.name}</div>
                  <div className="col-span-2 text-center font-mono">{item.quantity}</div>
                  <div className="col-span-2 text-right font-black text-slate-800 dark:text-white font-mono">{(item.quantity * item.price).toLocaleString()}</div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-4">
              <div className="w-64 pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center px-4">
                <span className="text-[10px] font-black text-slate-500 uppercase">Total {config.currency}</span>
                <span className={`text-2xl font-black ${sale.status === 'refunded' ? 'text-rose-600 line-through opacity-50' : 'text-purple-600 dark:text-purple-400'}`}>{sale.total.toLocaleString()}</span>
              </div>
            </div>
          </div>
          
          <div className="p-6 bg-slate-50 dark:bg-slate-800 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <button onClick={onClose} className="bg-slate-800 text-white px-8 py-2 rounded-xl font-bold hover:bg-slate-700 transition-all">Fermer</button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full overflow-y-auto space-y-8 animate-fadeIn pb-10 pr-2">
      {selectedSale && <InvoiceModal sale={selectedSale} onClose={() => setSelectedSale(null)} />}
      <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold text-slate-800 dark:text-white">{userRole === 'admin' ? "Tableau de bord de gestion" : "Mes performances du jour"}</h1><p className="text-slate-500 text-sm">Rapport en temps réel des activités - {config.companyName}</p></div><div className="flex space-x-2"><button className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-colors">Exporter</button>{userRole === 'admin' && (<button className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 shadow-sm transition-colors">Imprimer Bilan</button>)}</div></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {userRole === 'admin' ? (<><StatCard title="Chiffre d'Affaires" value={`${totalRevenue.toLocaleString()} ${config.currency}`} icon={DollarSign} color="bg-blue-500" trend="+12.5%" /><StatCard title="Panier Moyen" value={`${averageOrderValue} ${config.currency}`} icon={ShoppingCart} color="bg-purple-500" trend="+2.4%" /><StatCard title="Remboursements" value={sales.filter(s => s.status === 'refunded').length.toString()} icon={RotateCcw} color="bg-rose-500" trend={`${sales.filter(s => s.status === 'refunded').length} retours`} /><StatCard title="Commandes" value={sales.filter(s => s.status !== 'refunded').length.toString()} icon={FileText} color="bg-orange-500" trend="+5.0%" /></>) : (<><StatCard title="Mes Encaissements" value={`${cashierSales.filter(s => s.status !== 'refunded').reduce((a, b) => a + b.total, 0).toLocaleString()} ${config.currency}`} icon={DollarSign} color="bg-emerald-500" trend="+5.2%" /><StatCard title="Commandes POS" value={cashierSales.length.toString()} icon={ShoppingCart} color="bg-blue-500" trend="+8.0%" /><StatCard title="Panier Moyen" value={`${cashierSales.length > 0 ? (cashierSales.reduce((a, b) => a + b.total, 0) / cashierSales.length).toFixed(0) : 0} ${config.currency}`} icon={TrendingUp} color="bg-purple-500" trend="-0.5%" /><StatCard title="Clients Fidèles" value="12" icon={Users} color="bg-indigo-500" trend="+2" /></>)}
      </div>
      {userRole === 'admin' && (<div className="grid grid-cols-1 lg:grid-cols-2 gap-6"><div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm"><h3 className="font-semibold text-slate-800 dark:text-white mb-6">Évolution de la Facturation</h3><div className="h-64"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData}><defs><linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.1}/><stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} /><XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} /><YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} /><Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} itemStyle={{ color: '#8b5cf6' }} /><Area type="monotone" dataKey="sales" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" /></AreaChart></ResponsiveContainer></div></div><div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"><div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between"><h3 className="font-semibold text-slate-800 dark:text-white">Facturation Récente</h3><FileText className="text-slate-400" size={18} /></div><div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[256px] overflow-y-auto">{(userRole === 'admin' ? sales : cashierSales).map((sale) => (<div key={sale.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group"><div className="flex items-center space-x-4"><div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-600 font-bold text-xs">#{sale.id.slice(-3)}</div><div><p className="text-sm font-bold text-slate-800 dark:text-slate-200">{sale.customer}</p><div className="flex items-center space-x-2"><p className="text-[9px] text-slate-400 font-black uppercase tracking-tighter">{sale.date.split(' ')[0]}</p><p className="text-[9px] text-purple-400 font-black uppercase tracking-tighter flex items-center"><Clock size={8} className="mr-0.5" /> {sale.date.split(' ')[1] || '--:--'}</p></div></div></div><div className="flex items-center space-x-4"><div className="text-right"><p className={`text-sm font-black ${sale.status === 'refunded' ? 'text-rose-500 line-through' : 'text-slate-900 dark:text-white'}`}>{sale.total.toLocaleString()} {config.currency}</p><span className={`text-[8px] px-1.5 py-0.5 rounded-full font-black uppercase tracking-widest ${getStatusStyle(sale.status)}`}>{sale.status}</span></div><button onClick={() => setSelectedSale(sale)} className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-purple-600 dark:hover:text-purple-400 rounded-lg transition-all opacity-0 group-hover:opacity-100"><Eye size={16} /></button></div></div>))}</div></div></div>)}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"><div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between"><h3 className="font-semibold text-slate-800 dark:text-white">Dernières Commandes Clients</h3><button className="text-slate-400 hover:text-slate-600 transition-colors flex items-center text-xs font-bold">VOIR TOUT <ArrowUpRight size={14} className="ml-1" /></button></div><div className="overflow-x-auto"><table className="w-full text-left"><thead><tr className="bg-slate-50 dark:bg-slate-800/50 text-[10px] font-black text-slate-400 uppercase tracking-widest"><th className="px-6 py-4">Commande</th><th className="px-6 py-4">Client</th><th className="px-6 py-4">Date & Heure</th><th className="px-6 py-4">Montant</th><th className="px-6 py-4">Statut</th><th className="px-6 py-4 text-right">Action</th></tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-800">{(userRole === 'admin' ? sales : cashierSales).slice(0, 5).map((sale) => (<tr key={sale.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"><td className="px-6 py-4 text-sm font-medium text-purple-600 dark:text-purple-400 font-mono">#{sale.id}</td><td className="px-6 py-4 text-sm font-semibold text-slate-800 dark:text-slate-200">{sale.customer}</td><td className="px-6 py-4 text-xs"><div className="flex flex-col"><span className="font-bold text-slate-700 dark:text-slate-300">{sale.date.split(' ')[0]}</span><span className="text-[10px] text-slate-400 font-black">{sale.date.split(' ')[1] || '--:--'}</span></div></td><td className={`px-6 py-4 text-sm font-black ${sale.status === 'refunded' ? 'text-rose-500 line-through' : 'text-slate-900 dark:text-white'}`}>{sale.total.toLocaleString()} {config.currency}</td><td className="px-6 py-4"><span className={`text-[9px] px-2 py-1 rounded-lg font-black uppercase ${getStatusStyle(sale.status)}`}>{sale.status}</span></td><td className="px-6 py-4 text-right"><button onClick={() => setSelectedSale(sale)} className="text-slate-400 hover:text-purple-600 font-bold text-xs flex items-center justify-end ml-auto">Facture <Eye size={12} className="ml-1" /></button></td></tr>))}</tbody></table></div></div>
    </div>
  );
};

const StatCard: React.FC<{title: string, value: string, icon: any, color: string, trend: string}> = ({title, value, icon: Icon, color, trend}) => (
  <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-start justify-between transition-colors"><div><p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{title}</p><h4 className="text-2xl font-bold text-slate-900 dark:text-white">{value}</h4><p className={`text-xs mt-2 flex items-center ${trend.includes('retours') || trend.startsWith('-') ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}><TrendingUp size={14} className="mr-1" /> {trend}</p></div><div className={`${color} p-3 rounded-xl text-white shadow-lg ${color.replace('bg-', 'shadow-')}/20`}><Icon size={24} /></div></div>
);

export default Dashboard;
