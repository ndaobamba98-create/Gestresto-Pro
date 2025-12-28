
import React, { useState } from 'react';
import { SaleOrder, ERPConfig } from '../types';
import { ShoppingCart, Filter, Download, Plus, CheckCircle2, Clock, Truck, X, Printer, Mail, DownloadCloud, RotateCcw, Calendar, ChefHat } from 'lucide-react';

interface Props {
  sales: SaleOrder[];
  onUpdate: (sales: SaleOrder[]) => void;
  config: ERPConfig;
}

const Sales: React.FC<Props> = ({ sales, onUpdate, config }) => {
  const [activeTab, setActiveTab] = useState<'all' | 'quotation' | 'confirmed' | 'delivered' | 'refunded'>('all');
  const [selectedSale, setSelectedSale] = useState<SaleOrder | null>(null);

  const filteredSales = activeTab === 'all' ? sales : sales.filter(s => s.status === activeTab);

  const handleRefund = (id: string) => {
    if (window.confirm("Voulez-vous vraiment rembourser cette commande ? Cette action est irréversible.")) {
      const updatedSales = sales.map(s => 
        s.id === id ? { ...s, status: 'refunded' as const, invoiceStatus: 'refunded' as const } : s
      );
      onUpdate(updatedSales);
    }
  };

  const getStatusStyle = (status: string) => {
    switch(status) {
      case 'confirmed': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'delivered': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'quotation': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
      case 'refunded': return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'confirmed': return <CheckCircle2 size={12} className="mr-1" />;
      case 'delivered': return <Truck size={12} className="mr-1" />;
      case 'quotation': return <Clock size={12} className="mr-1" />;
      case 'refunded': return <RotateCcw size={12} className="mr-1" />;
      default: return null;
    }
  };

  const InvoiceModal = ({ sale, onClose }: { sale: SaleOrder, onClose: () => void }) => {
    const [date, time] = sale.date.includes(' ') ? sale.date.split(' ') : [sale.date, '--:--'];
    
    return (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
        <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-scaleIn border border-slate-200 dark:border-slate-800">
          <div className={`p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between ${sale.status === 'refunded' ? 'bg-rose-50 dark:bg-rose-900/20' : 'bg-slate-50 dark:bg-slate-800/50'}`}>
            <div className="flex items-center space-x-4">
               {/* LOGO GESTRESTO PRO SUR FACTURE */}
               <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <ChefHat size={24} className="text-white" />
               </div>
               <div>
                 <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">
                   Gestresto<span className="text-purple-600 dark:text-purple-400">Pro</span>
                 </h3>
                 <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Facture #{sale.id}</p>
               </div>
            </div>
            <div className="flex items-center space-x-2">
              <button className="p-2 text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"><Printer size={20} /></button>
              <button className="p-2 text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"><DownloadCloud size={20} /></button>
              <button onClick={onClose} className="p-2 text-slate-400 hover:text-rose-500 transition-colors ml-4"><X size={24} /></button>
            </div>
          </div>
          
          <div className="p-8 space-y-8 overflow-y-auto max-h-[70vh]">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-lg font-black text-slate-800 dark:text-white uppercase">{config.companyName}</h2>
                <p className="text-xs text-slate-500 font-medium">{config.address}</p>
                <p className="text-xs text-slate-500 font-medium">{config.phone}</p>
              </div>
              <div className="text-right flex flex-col items-end">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Date d'émission</p>
                <div className="flex items-center text-slate-800 dark:text-white font-black">
                  <Calendar size={14} className="mr-1.5 text-slate-400" /> {date}
                </div>
                <div className="flex items-center text-slate-500 dark:text-slate-400 text-xs font-bold mt-1">
                  <Clock size={12} className="mr-1.5 text-slate-400" /> {time}
                </div>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-100 dark:border-slate-700">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Destinataire</p>
              <h4 className="text-lg font-black text-slate-800 dark:text-white">{sale.customer}</h4>
              <p className="text-sm text-slate-500">Client Direct</p>
            </div>

            {/* Items Table */}
            <div className="space-y-4">
              <div className="grid grid-cols-12 px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                <div className="col-span-6">Désignation</div>
                <div className="col-span-2 text-center">Quantité</div>
                <div className="col-span-2 text-right">P.U</div>
                <div className="col-span-2 text-right">Total</div>
              </div>
              
              {(sale.items || []).map((item, idx) => (
                <div key={idx} className={`grid grid-cols-12 px-4 py-3 text-sm border-b border-slate-50 dark:border-slate-800/50 ${sale.status === 'refunded' ? 'line-through opacity-50' : ''}`}>
                  <div className="col-span-6 font-bold text-slate-800 dark:text-slate-200">{item.name}</div>
                  <div className="col-span-2 text-center text-slate-500">{item.quantity}</div>
                  <div className="col-span-2 text-right text-slate-500">{item.price} {config.currency}</div>
                  <div className="col-span-2 text-right font-black text-slate-800 dark:text-white">{(item.quantity * item.price).toLocaleString()} {config.currency}</div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="flex justify-end pt-4">
              <div className="w-64 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 font-medium">Sous-total</span>
                  <span className={`font-bold dark:text-white ${sale.status === 'refunded' ? 'line-through' : ''}`}>{sale.total.toLocaleString()} {config.currency}</span>
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-slate-200 dark:border-slate-700">
                  <span className="text-lg font-black text-slate-800 dark:text-white uppercase">{sale.status === 'refunded' ? 'Avoir' : 'Total'}</span>
                  <span className={`text-2xl font-black ${sale.status === 'refunded' ? 'text-rose-600' : 'text-purple-600 dark:text-purple-400'}`}>
                    {sale.total.toLocaleString()} {config.currency}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-10 text-center border-t border-dashed border-slate-200 dark:border-slate-800">
              <p className="text-slate-500 text-sm font-medium italic mb-2">"{config.receiptFooter}"</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Logiciel de Gestion Gestresto Pro - Système Intégré</p>
            </div>
          </div>

          <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-end space-x-3">
            {sale.status !== 'refunded' && (
              <button 
                onClick={() => handleRefund(sale.id)}
                className="bg-rose-100 text-rose-700 px-6 py-2 rounded-xl font-bold hover:bg-rose-200 transition-all flex items-center"
              >
                <RotateCcw size={18} className="mr-2" /> Rembourser
              </button>
            )}
            <button onClick={onClose} className="bg-slate-800 text-white px-6 py-2 rounded-xl font-bold hover:bg-slate-700 transition-all">Fermer</button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {selectedSale && <InvoiceModal sale={selectedSale} onClose={() => setSelectedSale(null)} />}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Suivi des Ventes</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Commandes confirmées et livrées</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center shadow-sm transition-colors">
            <Download size={18} className="mr-2" /> Exporter
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
        <div className="flex border-b border-slate-100 dark:border-slate-800">
          {(['all', 'confirmed', 'delivered', 'refunded'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-4 text-sm font-medium transition-colors border-b-2 relative ${
                activeTab === tab 
                  ? 'border-purple-600 text-purple-600' 
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <span className="capitalize">{tab === 'all' ? 'Toutes' : tab === 'refunded' ? 'Avoirs' : tab}</span>
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                <th className="px-6 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Client</th>
                <th className="px-6 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Date & Heure</th>
                <th className="px-6 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total</th>
                <th className="px-6 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Statut</th>
                <th className="px-6 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredSales.map((sale) => (
                <tr key={sale.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group ${sale.status === 'refunded' ? 'bg-rose-50/30' : ''}`}>
                  <td className="px-6 py-4 text-sm font-medium text-purple-600 dark:text-purple-400 font-mono">#{sale.id}</td>
                  <td className="px-6 py-4 text-sm text-slate-800 dark:text-slate-200 font-semibold">{sale.customer}</td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex flex-col">
                      <span className="text-slate-800 dark:text-slate-200 font-bold">{sale.date.split(' ')[0]}</span>
                      <span className="text-[10px] text-slate-400 font-bold flex items-center">
                        <Clock size={10} className="mr-1" /> {sale.date.split(' ')[1] || '--:--'}
                      </span>
                    </div>
                  </td>
                  <td className={`px-6 py-4 text-sm font-bold ${sale.status === 'refunded' ? 'text-rose-500 line-through' : 'text-slate-900 dark:text-white'}`}>
                    {sale.total.toLocaleString()} {config.currency}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getStatusStyle(sale.status)}`}>
                      {getStatusIcon(sale.status)}
                      {sale.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button 
                        onClick={() => setSelectedSale(sale)}
                        className="bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 px-3 py-1.5 rounded-lg font-bold text-xs"
                      >
                        Facture
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Sales;
