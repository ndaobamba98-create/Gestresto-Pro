
import React, { useMemo } from 'react';
import { SaleOrder, ERPConfig } from '../types';
import { ChefHat, CheckCircle2, Clock, MapPin, Package, AlertCircle } from 'lucide-react';

interface Props {
  sales: SaleOrder[];
  onUpdateSales: (sales: SaleOrder[]) => void;
  config: ERPConfig;
  notify: any;
}

const Kitchen: React.FC<Props> = ({ sales, onUpdateSales, config, notify }) => {
  // On ne suit que les commandes confirmées qui ne sont pas encore livrées/servies
  const activeOrders = useMemo(() => 
    sales.filter(s => s.status === 'confirmed').sort((a, b) => a.date.localeCompare(b.date))
  , [sales]);

  const handleSetServed = (id: string) => {
    const updated = sales.map(s => s.id === id ? { ...s, status: 'delivered' } as SaleOrder : s);
    onUpdateSales(updated);
    notify("Commande Servie", `La commande #${id.slice(-6)} est terminée.`, "success");
  };

  return (
    <div className="h-full flex flex-col space-y-8 animate-fadeIn pb-10 pr-2">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter">Suivi de Préparation</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Commandes en attente de service</p>
        </div>
        <div className="bg-orange-100 text-orange-600 px-6 py-3 rounded-2xl flex items-center space-x-3 border border-orange-200">
           <AlertCircle size={20} />
           <span className="font-black text-xs uppercase tracking-widest">{activeOrders.length} En cuisine</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {activeOrders.map(order => {
          const timeElapsed = Math.floor((Date.now() - new Date(order.date).getTime()) / 60000);
          const isLate = timeElapsed > 20;

          return (
            <div key={order.id} className={`bg-white dark:bg-slate-900 rounded-[2.5rem] border-2 shadow-sm flex flex-col overflow-hidden transition-all hover:shadow-xl ${isLate ? 'border-rose-500' : 'border-slate-100 dark:border-slate-800'}`}>
              <div className={`p-6 flex justify-between items-center ${isLate ? 'bg-rose-500 text-white' : 'bg-slate-900 text-white'}`}>
                <div>
                   <h3 className="text-md font-black uppercase font-mono tracking-tighter">#{order.id.slice(-6)}</h3>
                   <div className="flex items-center mt-1 space-x-2">
                      <MapPin size={10} className="opacity-60" />
                      <span className="text-[9px] font-black uppercase tracking-widest">{order.orderLocation}</span>
                   </div>
                </div>
                <div className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-[10px] font-black ${isLate ? 'bg-white text-rose-600 animate-pulse' : 'bg-white/10 text-white'}`}>
                   <Clock size={12} />
                   <span>{timeElapsed}m</span>
                </div>
              </div>

              <div className="p-6 flex-1 space-y-4">
                <div className="space-y-2">
                   {order.items?.map((item, idx) => (
                     <div key={idx} className="flex justify-between items-start group">
                        <div className="flex space-x-3">
                           <div className="w-5 h-5 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-500">x{item.quantity}</div>
                           <span className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase">{item.name}</span>
                        </div>
                     </div>
                   ))}
                </div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-700">
                 <button 
                   onClick={() => handleSetServed(order.id)}
                   className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-lg shadow-emerald-900/20 transition-all flex items-center justify-center space-x-2"
                 >
                   <CheckCircle2 size={18} />
                   <span>Servi / Prêt</span>
                 </button>
              </div>
            </div>
          );
        })}

        {activeOrders.length === 0 && (
           <div className="col-span-full py-40 flex flex-col items-center justify-center opacity-20 space-y-6">
              <ChefHat size={120} className="text-slate-400" />
              <p className="text-xl font-black uppercase tracking-[0.4em]">Cuisine vide</p>
           </div>
        )}
      </div>
    </div>
  );
};

export default Kitchen;
