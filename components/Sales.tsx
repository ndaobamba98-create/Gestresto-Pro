
import React, { useState } from 'react';
import { SaleOrder, ERPConfig, Product, SaleItem } from '../types';
import { ShoppingCart, Filter, Download, Plus, CheckCircle2, Clock, Truck, X, Printer, Mail, DownloadCloud, RotateCcw, Calendar, ChefHat, Trash2, AlertTriangle, MapPin, Phone, Banknote, FileText, Search, User, Package, PlusCircle, MinusCircle } from 'lucide-react';

interface Props {
  sales: SaleOrder[];
  onUpdate: (sales: SaleOrder[]) => void;
  config: ERPConfig;
  products: Product[];
  userRole: string;
  onAddSale: (sale: Partial<SaleOrder>) => void;
  notify: (title: string, message: string, type?: 'success' | 'info' | 'warning') => void;
}

const LogoG = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10" />
    <path d="M16 8.5C15.1 7.6 13.8 7 12.3 7 9.4 7 7 9.2 7 12s2.4 5 5.3 5c2.4 0 4.4-1.5 5.1-3.5H12" />
  </svg>
);

const Sales: React.FC<Props> = ({ sales, onUpdate, config, products, userRole, onAddSale, notify }) => {
  const [activeTab, setActiveTab] = useState<'all' | 'quotation' | 'confirmed' | 'delivered' | 'refunded'>('all');
  const [selectedSale, setSelectedSale] = useState<SaleOrder | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string, customer: string } | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  
  const [newOrderCustomer, setNewOrderCustomer] = useState('');
  const [newOrderItems, setNewOrderItems] = useState<{product: Product, qty: number}[]>([]);
  const [itemSearch, setItemSearch] = useState('');

  const filteredSales = activeTab === 'all' ? sales : sales.filter(s => s.status === activeTab);

  const handleRefund = (id: string) => {
    const updatedSales = sales.map(s => s.id === id ? { ...s, status: 'refunded' as const, invoiceStatus: 'refunded' as const } : s);
    onUpdate(updatedSales);
    setSelectedSale(null);
    notify("Avoir généré", `La commande ${id} a été remboursée.`, 'warning');
  };

  const handleDelete = () => {
    if (deleteConfirm) {
      onUpdate(sales.filter(s => s.id !== deleteConfirm.id));
      setDeleteConfirm(null);
      notify("Document supprimé", "L'enregistrement a été retiré définitivement.", 'info');
    }
  };

  const handleSaveOrder = (status: 'quotation' | 'confirmed') => {
    if (!newOrderCustomer || newOrderItems.length === 0) return;

    const now = new Date();
    const formattedDate = now.toLocaleDateString('fr-FR') + ' ' + now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const total = newOrderItems.reduce((acc, item) => acc + (item.product.price * item.qty), 0);

    const saleData: Partial<SaleOrder> = {
      customer: newOrderCustomer,
      date: formattedDate,
      total: total,
      status: status,
      invoiceStatus: status === 'confirmed' ? 'posted' : 'draft',
      paymentMethod: 'Especes',
      items: newOrderItems.map(i => ({
        productId: i.product.id,
        name: i.product.name,
        quantity: i.qty,
        price: i.product.price
      }))
    };

    onAddSale(saleData);
    setIsCreating(false);
    setNewOrderCustomer('');
    setNewOrderItems([]);
    setItemSearch('');
  };

  const getStatusStyle = (status: string) => {
    switch(status) {
      case 'confirmed': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'delivered': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'quotation': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
      case 'refunded': return 'bg-rose-100 text-rose-700 dark:bg-rose-100/30 dark:text-rose-400';
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

  return (
    <div className="space-y-6 animate-fadeIn pb-10 pr-2">
      {selectedSale && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-3xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-4 border-b flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
                 <h3 className="font-black uppercase text-xs">Aperçu Document</h3>
                 <button onClick={() => setSelectedSale(null)}><X size={24}/></button>
              </div>
              <div id="invoice-print-area" className="p-12 overflow-y-auto bg-white dark:bg-slate-900">
                {/* Header avec Logo */}
                <div className="flex justify-between items-start border-b-4 border-purple-600 pb-8">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-slate-900 text-white rounded-2xl flex items-center justify-center">
                        <LogoG className="w-10 h-10" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">FAST FOOD MYA D'OR</h2>
                        <p className="text-[10px] font-black text-purple-600 uppercase tracking-widest">{config.companySlogan}</p>
                      </div>
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                      <p className="flex items-center font-bold"><MapPin size={14} className="mr-2 text-slate-400" /> {config.address}</p>
                      <p className="flex items-center font-bold"><Phone size={14} className="mr-2 text-slate-400" /> {config.phone}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <h1 className="text-4xl font-black uppercase text-slate-900 dark:text-white">Document</h1>
                    <p className="text-xl font-mono text-purple-600 font-black">#{selectedSale.id}</p>
                    <p className="text-xs font-bold text-slate-500 mt-2 flex items-center justify-end"><Calendar size={12} className="mr-1" /> {selectedSale.date}</p>
                  </div>
                </div>
                
                <div className="mt-8 grid grid-cols-2 gap-8">
                   <div>
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest border-b pb-2 mb-2">Destinataire</p>
                      <p className="text-lg font-black text-slate-900 dark:text-white">{selectedSale.customer}</p>
                   </div>
                   <div className="text-right">
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest border-b pb-2 mb-2">Paiement</p>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{selectedSale.paymentMethod || 'Espèces'}</p>
                   </div>
                </div>

                <table className="w-full mt-8 text-left">
                  <thead>
                    <tr className="bg-slate-900 text-white text-[10px] font-black uppercase">
                      <th className="p-4">Désignation</th>
                      <th className="p-4 text-center">Qté</th>
                      <th className="p-4 text-right">P.U</th>
                      <th className="p-4 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedSale.items?.map((item, i) => (
                      <tr key={i} className={`text-sm ${selectedSale.status === 'refunded' ? 'text-slate-400 line-through opacity-50' : ''}`}>
                        <td className="p-4 font-bold text-slate-800">{item.name}</td>
                        <td className="p-4 text-center font-mono">{item.quantity}</td>
                        <td className="p-4 text-right font-mono">{item.price.toLocaleString()}</td>
                        <td className="p-4 text-right font-black font-mono">{(item.quantity * item.price).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="flex justify-end mt-8">
                   <div className="w-64 p-6 bg-purple-600 text-white rounded-2xl flex justify-between items-center shadow-xl">
                      <span className="text-xs font-black uppercase">{selectedSale.status === 'refunded' ? 'Avoir' : 'Total TTC'}</span>
                      <span className="text-2xl font-black">{selectedSale.total.toLocaleString()} {config.currency}</span>
                   </div>
                </div>

                <div className="mt-20 pt-10 border-t border-dashed border-slate-200 text-center">
                  <p className="text-slate-500 text-sm font-medium italic mb-2">"{config.receiptFooter}"</p>
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-4">RC: {config.registrationNumber}</p>
                  <div className="flex flex-col items-center space-y-2">
                    <div className="text-[10px] font-black text-purple-600 uppercase tracking-[0.3em] px-6 py-2 border-2 border-purple-100 rounded-full inline-block">Gestresto Pro</div>
                    <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">FAST FOOD MYA D'OR • Logiciel de Gestion</p>
                  </div>
                </div>
              </div>
              <div className="p-6 border-t flex justify-end space-x-3 bg-slate-50 dark:bg-slate-800/50">
                 <button onClick={() => window.print()} className="bg-purple-600 text-white px-6 py-2 rounded-xl font-bold uppercase text-xs flex items-center shadow-lg"><Printer size={16} className="mr-2"/> Imprimer</button>
                 <button onClick={() => setSelectedSale(null)} className="bg-slate-800 text-white px-6 py-2 rounded-xl font-bold uppercase text-xs">Fermer</button>
              </div>
           </div>
        </div>
      )}
      {isCreating && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-3xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-6 border-b flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
                 <h3 className="text-xl font-black uppercase tracking-tighter">Nouvelle Commande</h3>
                 <button onClick={() => setIsCreating(false)}><X size={24}/></button>
              </div>
              <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                 <div className="flex-1 p-8 overflow-y-auto space-y-6">
                    <input value={newOrderCustomer} onChange={e => setNewOrderCustomer(e.target.value)} placeholder="Nom du client..." className="w-full px-5 py-4 rounded-xl border-2 dark:bg-slate-800 font-bold" />
                    <div className="relative"><Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"/><input value={itemSearch} onChange={e => setItemSearch(e.target.value)} placeholder="Chercher un plat..." className="w-full pl-12 pr-5 py-3 rounded-xl border dark:bg-slate-800" /></div>
                    {itemSearch && <div className="border rounded-xl overflow-hidden">{products.filter(p => p.name.toLowerCase().includes(itemSearch.toLowerCase())).slice(0, 5).map(p => (<button key={p.id} onClick={() => setNewOrderItems(prev => [...prev, {product: p, qty: 1}])} className="w-full px-4 py-3 flex justify-between items-center hover:bg-purple-50 transition-colors border-b last:border-0"><span className="font-bold">{p.name}</span><span className="text-purple-600 font-black">{p.price} {config.currency}</span></button>))}</div>}
                 </div>
                 <div className="w-96 bg-slate-50 dark:bg-slate-800/30 p-8 flex flex-col">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase mb-4">Panier de vente</h4>
                    <div className="flex-1 space-y-2">{newOrderItems.map(item => (<div key={item.product.id} className="bg-white p-3 rounded-xl flex justify-between items-center shadow-sm"><span className="text-xs font-bold truncate flex-1">{item.product.name}</span><div className="flex items-center space-x-2 ml-2"><button onClick={() => setNewOrderItems(prev => prev.map(i => i.product.id === item.product.id ? {...i, qty: Math.max(1, i.qty-1)} : i))}><MinusCircle size={18}/></button><span className="text-xs font-black">{item.qty}</span><button onClick={() => setNewOrderItems(prev => prev.map(i => i.product.id === item.product.id ? {...i, qty: i.qty+1} : i))}><PlusCircle size={18}/></button></div></div>))}</div>
                    <div className="mt-8 pt-4 border-t flex justify-between items-center mb-6"><span className="text-sm font-black text-slate-400">Total</span><span className="text-xl font-black">{newOrderItems.reduce((a,b) => a+(b.product.price*b.qty), 0).toLocaleString()} {config.currency}</span></div>
                    <div className="grid grid-cols-2 gap-2"><button onClick={() => handleSaveOrder('quotation')} className="py-3 bg-white border rounded-xl font-bold text-xs">DEVIS</button><button onClick={() => handleSaveOrder('confirmed')} className="py-3 bg-purple-600 text-white rounded-xl font-black text-xs">VALIDER</button></div>
                 </div>
              </div>
           </div>
        </div>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-slate-800 dark:text-white">Suivi des Ventes</h1><p className="text-sm text-slate-500">Gérez vos devis, commandes et livraisons</p></div>
        <div className="flex items-center space-x-3">{(userRole === 'admin' || userRole === 'manager') && (<button onClick={() => setIsCreating(true)} className="bg-purple-600 text-white px-6 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest shadow-lg shadow-purple-900/20 active:scale-95"><Plus size={18} className="mr-2" /> Nouveau Document</button>)}<button className="bg-white border text-slate-600 px-4 py-2.5 rounded-xl text-sm font-medium"><Download size={18} className="mr-2" /> Exporter</button></div>
      </div>
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-100 dark:border-slate-800 overflow-x-auto scrollbar-hide">{(['all', 'quotation', 'confirmed', 'delivered', 'refunded'] as const).map((tab) => (<button key={tab} onClick={() => setActiveTab(tab)} className={`px-6 py-4 text-xs font-black uppercase tracking-widest transition-colors border-b-2 whitespace-nowrap ${activeTab === tab ? 'border-purple-600 text-purple-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}><span>{tab === 'all' ? 'Toutes' : tab === 'quotation' ? 'Devis' : tab === 'confirmed' ? 'Commandes' : tab === 'delivered' ? 'Livrées' : 'Avoirs'}</span></button>))}</div>
        <div className="overflow-x-auto"><table className="w-full text-left"><thead><tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800"><th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Référence</th><th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Client</th><th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date / Heure</th><th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Total TTC</th><th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Statut</th><th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th></tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-800">{filteredSales.map((sale) => (<tr key={sale.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group ${sale.status === 'refunded' ? 'bg-rose-50/30 opacity-60' : ''}`}><td className="px-6 py-4 text-xs font-black text-purple-600 font-mono">{sale.id}</td><td className="px-6 py-4 text-sm font-bold text-slate-800 dark:text-slate-200">{sale.customer}</td><td className="px-6 py-4 text-[10px] font-bold text-slate-500">{sale.date}</td><td className={`px-6 py-4 text-sm font-black text-right text-slate-900 dark:text-white ${sale.status === 'refunded' ? 'line-through' : ''}`}>{sale.total.toLocaleString()} {config.currency}</td><td className="px-6 py-4"><span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider ${getStatusStyle(sale.status)}`}>{getStatusIcon(sale.status)}{sale.status}</span></td><td className="px-6 py-4 text-right"><div className="flex items-center justify-end space-x-2"><button onClick={() => setSelectedSale(sale)} className="bg-purple-50 text-purple-600 px-3 py-1.5 rounded-lg font-bold text-xs hover:bg-purple-600 hover:text-white transition-all">Consulter</button>{(userRole === 'admin' || userRole === 'manager') && (<button onClick={() => setDeleteConfirm({ id: sale.id, customer: sale.customer })} className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={16} /></button>)}</div></td></tr>))}</tbody></table></div>
      </div>
    </div>
  );
};

export default Sales;
