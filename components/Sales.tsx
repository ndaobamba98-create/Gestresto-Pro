
import React, { useState } from 'react';
import { SaleOrder, ERPConfig, Product, SaleItem, PaymentMethod } from '../types';
// Import missing Wallet icon
import { ShoppingCart, Filter, Download, Plus, CheckCircle2, Clock, Truck, X, Printer, Mail, DownloadCloud, RotateCcw, Calendar, ChefHat, Trash2, AlertTriangle, MapPin, Phone, Banknote, FileText, Search, User, Package, PlusCircle, MinusCircle, QrCode, CreditCard, Smartphone, Wallet } from 'lucide-react';
import * as XLSX from 'xlsx';
import { AppLogoDoc } from './Invoicing';
import { PAYMENT_METHODS_LIST } from '../constants';

interface Props {
  sales: SaleOrder[];
  onUpdate: (sales: SaleOrder[]) => void;
  config: ERPConfig;
  products: Product[];
  userRole: string;
  onAddSale: (sale: Partial<SaleOrder>) => void;
  notify: (title: string, message: string, type?: 'success' | 'info' | 'warning') => void;
}

const Sales: React.FC<Props> = ({ sales, onUpdate, config, products, userRole, onAddSale, notify }) => {
  const [activeTab, setActiveTab] = useState<'all' | 'quotation' | 'confirmed' | 'delivered' | 'refunded'>('all');
  const [selectedSale, setSelectedSale] = useState<SaleOrder | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string, customer: string } | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  
  const [newOrderCustomer, setNewOrderCustomer] = useState('');
  const [newOrderItems, setNewOrderItems] = useState<{product: Product, qty: number}[]>([]);
  const [newOrderPaymentMethod, setNewOrderPaymentMethod] = useState<PaymentMethod>('Especes');
  const [itemSearch, setItemSearch] = useState('');

  const filteredSales = activeTab === 'all' ? sales : sales.filter(s => s.status === tabMap[activeTab]);

  const tabMap: any = {
    'quotation': 'quotation',
    'confirmed': 'confirmed',
    'delivered': 'delivered',
    'refunded': 'refunded'
  };

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
      paymentMethod: newOrderPaymentMethod,
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

  const handleExportExcel = () => {
    const dataToExport = filteredSales.map(s => ({
      'Référence': s.id,
      'Client': s.customer,
      'Date': s.date,
      'Montant Total': s.total,
      'Devise': config.currency,
      'Statut': s.status,
      'Méthode Paiement': s.paymentMethod || 'Espèces',
      'Emplacement': s.orderLocation || 'Comptoir'
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Ventes");
    
    const wscols = [{ wch: 15 }, { wch: 30 }, { wch: 20 }, { wch: 15 }, { wch: 10 }, { wch: 15 }, { wch: 20 }, { wch: 15 }];
    worksheet['!cols'] = wscols;

    const fileName = `Ventes_MYA_DOR_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    notify("Export réussi", "La liste des ventes a été téléchargée.", 'success');
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
    <div className="space-y-8 animate-fadeIn pb-10 pr-2">
      {selectedSale && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[100] flex items-center justify-center p-4 sm:p-10 animate-fadeIn">
          <div className="bg-white w-full max-w-3xl rounded-[2rem] shadow-2xl overflow-hidden animate-scaleIn flex flex-col max-h-full border border-white/20">
            <div className="px-8 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/80 backdrop-blur-md no-print sticky top-0 z-10">
              <div className="flex items-center space-x-3">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Doc #{selectedSale.id.slice(-6)}</span>
                <span className={`px-2.5 py-1 text-[9px] font-black rounded-lg uppercase tracking-widest ${getStatusStyle(selectedSale.status)}`}>{selectedSale.status}</span>
              </div>
              <div className="flex items-center space-x-3">
                <button onClick={() => window.print()} className="bg-slate-900 text-white px-5 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center shadow-xl hover:bg-black transition-all"><Printer size={16} className="mr-2" /> Imprimer</button>
                <button onClick={() => setSelectedSale(null)} className="p-2 text-slate-400 hover:text-rose-500 transition-all"><X size={24} /></button>
              </div>
            </div>

            <div id="invoice-print-area" className="p-10 sm:p-12 overflow-y-auto bg-white flex-1 text-slate-950 scrollbar-hide relative">
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-16">
                  <div className="space-y-4">
                    <AppLogoDoc className="w-16 h-16" />
                    <div>
                      <h2 className="text-2xl font-black uppercase tracking-tighter leading-none mb-1">{config.companyName}</h2>
                      <p className="text-[9px] font-black text-purple-600 uppercase tracking-[0.3em]">{config.companySlogan}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <h1 className="text-3xl font-black uppercase tracking-tighter text-slate-900 mb-1">{selectedSale.status === 'quotation' ? 'Devis' : 'Commande'}</h1>
                    <p className="text-lg font-mono font-black text-purple-600 tracking-tighter">REF-{selectedSale.id.slice(-8)}</p>
                    <div className="mt-4 flex flex-col items-end space-y-0.5">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Émis le</span>
                      <p className="text-xs font-black">{selectedSale.date}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-10 mb-12">
                  <div className="space-y-2">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 pb-1">Client</p>
                    <h3 className="text-xl font-black uppercase tracking-tighter">{selectedSale.customer}</h3>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center"><User size={12} className="mr-2" /> Vente Directe</p>
                  </div>
                  <div className="space-y-2 text-right">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 pb-1">Paiement</p>
                    <div className="space-y-1">
                      <p className="text-xs font-black uppercase tracking-widest flex items-center justify-end"><CreditCard size={14} className="mr-1.5 text-purple-600" /> {selectedSale.paymentMethod || 'Espèces'}</p>
                      <p className="text-[9px] font-bold text-slate-500">Service : {selectedSale.orderLocation || 'Comptoir'}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-100 overflow-hidden mb-10 shadow-sm">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="px-6 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">Désignation</th>
                        <th className="px-6 py-4 text-center text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">Qté</th>
                        <th className="px-6 py-4 text-right text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">P.U</th>
                        <th className="px-6 py-4 text-right text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedSale.items?.map((item, idx) => (
                        <tr key={idx} className={`group hover:bg-slate-50/50 transition-colors ${selectedSale.status === 'refunded' ? 'opacity-40 line-through' : ''}`}>
                          <td className="px-6 py-4 font-black uppercase text-[11px] text-slate-900">{item.name}</td>
                          <td className="px-6 py-4 text-center">
                            <span className="bg-slate-100 px-2.5 py-1 rounded-lg font-black text-[11px]">{item.quantity}</span>
                          </td>
                          <td className="px-6 py-4 text-right font-bold text-[11px]">{item.price.toLocaleString()}</td>
                          <td className="px-6 py-4 text-right font-black text-[11px] tracking-tighter">{(item.quantity * item.price).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-col md:flex-row justify-end items-start gap-10 mb-16">
                   <div className="w-full md:w-[280px]">
                      <div className="bg-slate-950 text-white p-8 rounded-[2rem] shadow-2xl flex flex-col items-center relative overflow-hidden group">
                        <p className="text-[9px] font-black uppercase tracking-[0.4em] mb-4 opacity-40">TOTAL TTC</p>
                        <div className="flex items-baseline relative z-10">
                          <span className="text-4xl font-black font-mono tracking-tighter leading-none">{selectedSale.total.toLocaleString()}</span>
                          <span className="text-sm font-bold ml-2 text-purple-500 uppercase">{config.currency}</span>
                        </div>
                      </div>
                   </div>
                </div>

                <div className="pt-12 border-t border-dashed border-slate-200 flex flex-col md:flex-row justify-between items-center gap-10 text-center md:text-left">
                   <div className="flex items-center space-x-4">
                      <QrCode size={60} className="text-slate-900" />
                      <div className="space-y-0.5">
                        <p className="text-[9px] font-black uppercase tracking-widest">Suivi Commande</p>
                        <p className="text-[8px] font-bold text-slate-400 uppercase leading-relaxed max-w-[150px]">Vérifiez l'authenticité de cette pièce via SamaCaisse Pro.</p>
                      </div>
                   </div>
                   <div className="space-y-4 text-center">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Signature Gérant</p>
                      <div className="w-40 h-px bg-slate-900 mx-auto"></div>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {isCreating && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
           <div className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-[3rem] overflow-hidden flex flex-col max-h-[90vh] shadow-2xl border border-white/10">
              <div className="p-8 border-b flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
                 <h3 className="text-2xl font-black uppercase tracking-tighter">Nouvelle Commande</h3>
                 <button onClick={() => setIsCreating(false)}><X size={32}/></button>
              </div>
              <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                 <div className="flex-1 p-10 overflow-y-auto space-y-8 scrollbar-hide">
                    <div className="space-y-3">
                      <label className="text-[11px] font-black uppercase text-slate-500 tracking-widest ml-1">Client</label>
                      <input value={newOrderCustomer} onChange={e => setNewOrderCustomer(e.target.value)} placeholder="Nom complet..." className="w-full px-6 py-4 rounded-2xl border-2 dark:bg-slate-800 font-bold focus:border-purple-500 outline-none" />
                    </div>

                    {/* AJOUT SÉLECTEUR DE MODE DE PAIEMENT */}
                    <div className="space-y-3">
                      <label className="text-[11px] font-black uppercase text-slate-500 tracking-widest ml-1">Mode de Paiement</label>
                      <div className="grid grid-cols-4 gap-3">
                        {PAYMENT_METHODS_LIST.filter(m => ['Especes', 'Bankily', 'Masrvi', 'Sedad'].includes(m.id)).map((method) => (
                          <button 
                            key={method.id} 
                            onClick={() => setNewOrderPaymentMethod(method.id)}
                            className={`px-4 py-3 rounded-xl border-2 font-black uppercase text-[10px] tracking-widest transition-all flex items-center justify-center space-x-2 ${
                              newOrderPaymentMethod === method.id 
                              ? 'bg-purple-600 border-purple-400 text-white shadow-md' 
                              : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-800 text-slate-400'
                            }`}
                          >
                            {method.id === 'Especes' && <Banknote size={14} />}
                            {method.id === 'Bankily' && <Smartphone size={14} />}
                            {method.id === 'Masrvi' && <Wallet size={14} />}
                            {method.id === 'Sedad' && <CreditCard size={14} />}
                            <span>{method.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[11px] font-black uppercase text-slate-500 tracking-widest ml-1">Sélectionner des plats</label>
                      <div className="relative"><Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400"/><input value={itemSearch} onChange={e => setItemSearch(e.target.value)} placeholder="Chercher un plat..." className="w-full pl-14 pr-6 py-4 rounded-2xl border-2 dark:bg-slate-800 focus:border-purple-500 outline-none" /></div>
                    </div>
                    {itemSearch && <div className="border-2 rounded-2xl overflow-hidden divide-y">{products.filter(p => p.name.toLowerCase().includes(itemSearch.toLowerCase())).slice(0, 5).map(p => (<button key={p.id} onClick={() => setNewOrderItems(prev => [...prev, {product: p, qty: 1}])} className="w-full p-5 flex justify-between items-center hover:bg-purple-50 transition-colors"><span className="font-bold">{p.name}</span><span className="text-purple-600 font-black">{p.price} {config.currency}</span></button>))}</div>}
                 </div>
                 <div className="w-[400px] bg-slate-50 dark:bg-slate-900 p-10 flex flex-col border-l border-slate-100 dark:border-slate-800">
                    <h4 className="text-[11px] font-black text-slate-400 uppercase mb-6 tracking-widest">Panier actif</h4>
                    <div className="flex-1 space-y-3 overflow-y-auto scrollbar-hide">{newOrderItems.map(item => (<div key={item.product.id} className="bg-white dark:bg-slate-950 p-4 rounded-2xl flex justify-between items-center shadow-sm border border-slate-100 dark:border-slate-800"><span className="text-xs font-black truncate flex-1">{item.product.name}</span><div className="flex items-center space-x-3 ml-3"><button onClick={() => setNewOrderItems(prev => prev.map(i => i.product.id === item.product.id ? {...i, qty: Math.max(1, i.qty-1)} : i))} className="p-1 hover:text-purple-600"><MinusCircle size={20}/></button><span className="text-xs font-black w-4 text-center">{item.qty}</span><button onClick={() => setNewOrderItems(prev => prev.map(i => i.product.id === item.product.id ? {...i, qty: i.qty+1} : i))} className="p-1 hover:text-purple-600"><PlusCircle size={20}/></button></div></div>))}</div>
                    <div className="mt-10 pt-8 border-t-2 flex justify-between items-baseline mb-8"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total</span><span className="text-3xl font-black">{newOrderItems.reduce((a,b) => a+(b.product.price*b.qty), 0).toLocaleString()} <span className="text-xs">{config.currency}</span></span></div>
                    <div className="grid grid-cols-2 gap-3"><button onClick={() => handleSaveOrder('quotation')} className="py-4 bg-white dark:bg-slate-800 border-2 rounded-2xl font-black text-[10px] tracking-widest uppercase">DEVIS</button><button onClick={() => handleSaveOrder('confirmed')} className="py-4 bg-purple-600 text-white rounded-2xl font-black text-[10px] tracking-widest uppercase shadow-xl shadow-purple-900/20">VALIDER</button></div>
                 </div>
              </div>
           </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div><h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Journal de Vente</h1><p className="text-sm text-slate-500 font-medium">Flux commercial et documents clients</p></div>
        <div className="flex items-center space-x-3">{(userRole === 'admin' || userRole === 'manager') && (<button onClick={() => setIsCreating(true)} className="bg-purple-600 text-white px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-purple-900/20 active:scale-95 transition-all"><Plus size={18} className="mr-2" /> Nouveau Document</button>)}<button onClick={handleExportExcel} className="bg-white dark:bg-slate-900 border-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all"><Download size={18} className="mr-2" /> Excel</button></div>
      </div>
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border-2 border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex-1">
        <div className="flex border-b border-slate-100 dark:border-slate-800 overflow-x-auto scrollbar-hide bg-slate-50/30">{(['all', 'quotation', 'confirmed', 'delivered', 'refunded'] as const).map((tab) => (<button key={tab} onClick={() => setActiveTab(tab)} className={`px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] transition-all border-b-4 whitespace-nowrap ${activeTab === tab ? 'border-purple-600 text-purple-600 bg-white dark:bg-slate-800' : 'border-transparent text-slate-400 hover:text-slate-600'}`}><span>{tab === 'all' ? 'Tous les documents' : tab === 'quotation' ? 'Devis' : tab === 'confirmed' ? 'Commandes' : tab === 'delivered' ? 'Livrées' : 'Avoirs / Retours'}</span></button>))}</div>
        <div className="overflow-x-auto"><table className="w-full text-left"><thead><tr className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800"><th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Référence</th><th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Client</th><th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Montant</th><th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Statut</th><th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th></tr></thead><tbody className="divide-y divide-slate-50 dark:divide-slate-800">{filteredSales.map((sale) => (<tr key={sale.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all group ${sale.status === 'refunded' ? 'opacity-60' : ''}`}><td className="px-8 py-5 text-xs font-black text-purple-600 font-mono tracking-tighter">#{sale.id.slice(-8)}</td><td className="px-8 py-5"><div className="flex flex-col"><span className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase">{sale.customer}</span><span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{sale.date}</span><span className="text-[8px] font-black uppercase text-slate-400">{sale.paymentMethod}</span></div></td><td className={`px-8 py-5 text-sm font-black text-right text-slate-900 dark:text-white ${sale.status === 'refunded' ? 'line-through text-rose-500' : ''}`}>{sale.total.toLocaleString()} {config.currency}</td><td className="px-8 py-5 text-center"><span className={`inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${getStatusStyle(sale.status)}`}>{getStatusIcon(sale.status)}{sale.status}</span></td><td className="px-8 py-5 text-right"><div className="flex items-center justify-end space-x-2"><button onClick={() => setSelectedSale(sale)} className="bg-slate-900 text-white px-4 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-purple-600 transition-all shadow-sm">Consulter</button>{(userRole === 'admin' || userRole === 'manager') && (<button onClick={() => setDeleteConfirm({ id: sale.id, customer: sale.customer })} className="p-2 text-slate-300 hover:text-rose-600 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={18} /></button>)}</div></td></tr>))}</tbody></table></div>
      </div>
    </div>
  );
};

export default Sales;
