
import React, { useState } from 'react';
import { SaleOrder, ERPConfig, Product, SaleItem } from '../types';
import { 
  FileText, Search, Filter, Plus, Download, CheckCircle2, Clock, AlertCircle, Eye, Printer, Trash2, X, RotateCcw, Calendar, MapPin, Phone, Mail, Banknote, DownloadCloud, User, Package, PlusCircle, MinusCircle, QrCode
} from 'lucide-react';

interface Props {
  sales: SaleOrder[];
  config: ERPConfig;
  onUpdate: (sales: SaleOrder[]) => void;
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

const Invoicing: React.FC<Props> = ({ sales, config, onUpdate, products, userRole, onAddSale, notify }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedInvoice, setSelectedInvoice] = useState<SaleOrder | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const [newCust, setNewCust] = useState('');
  const [newItems, setNewItems] = useState<{product: Product, qty: number}[]>([]);
  const [pSearch, setPSearch] = useState('');

  const invoices = sales.map(s => ({
    ...s,
    invoiceStatus: s.invoiceStatus || 'posted'
  }));

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = inv.customer.toLowerCase().includes(searchTerm.toLowerCase()) || inv.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || inv.invoiceStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSaveInvoice = () => {
    if (!newCust || newItems.length === 0) return;
    const now = new Date();
    const formattedDate = now.toLocaleDateString('fr-FR') + ' ' + now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const total = newItems.reduce((acc, i) => acc + (i.product.price * i.qty), 0);

    const saleData: Partial<SaleOrder> = {
      customer: newCust,
      date: formattedDate,
      total: total,
      status: 'confirmed',
      invoiceStatus: 'posted',
      paymentMethod: 'Especes',
      items: newItems.map(i => ({
        productId: i.product.id,
        name: i.product.name,
        quantity: i.qty,
        price: i.product.price
      })),
      orderLocation: 'Comptoir'
    };

    onAddSale(saleData);
    setIsCreating(false);
    setNewCust('');
    setNewItems([]);
    setPSearch('');
  };

  const handleRefund = (id: string) => {
    if (window.confirm("Créer un avoir pour cette facture ?")) {
      const updatedSales = sales.map(s => 
        s.id === id ? { ...s, invoiceStatus: 'refunded' as const, status: 'refunded' as const } : s
      );
      onUpdate(updatedSales);
      setSelectedInvoice(null);
      notify("Avoir généré", `La facture ${id} a été remboursée.`, 'warning');
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'draft': return 'bg-slate-100 text-slate-600 border-slate-200';
      case 'posted': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'paid': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'refunded': return 'bg-rose-50 text-rose-700 border-rose-100';
      default: return 'bg-slate-50 text-slate-500';
    }
  };

  const totals = {
    total: filteredInvoices.reduce((a, b) => b.invoiceStatus === 'refunded' ? a - b.total : a + b.total, 0),
    paid: filteredInvoices.filter(i => i.invoiceStatus === 'paid').reduce((a, b) => a + b.total, 0),
    due: filteredInvoices.filter(i => i.invoiceStatus === 'posted').reduce((a, b) => a + b.total, 0),
    refunded: filteredInvoices.filter(i => i.invoiceStatus === 'refunded').reduce((a, b) => a + b.total, 0),
  };

  const InvoiceModal = ({ sale, onClose }: { sale: SaleOrder, onClose: () => void }) => {
    const taxRate = config.taxRate || 0;
    const totalTTC = sale.total;
    const totalHT = totalTTC / (1 + taxRate / 100);
    const taxAmount = totalTTC - totalHT;

    return (
      <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fadeIn no-print-overlay">
        <div className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-scaleIn border border-slate-200 dark:border-slate-800 flex flex-col max-h-[95vh]">
          {/* Toolbar */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50 no-print">
            <div className="flex items-center space-x-4">
              <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-lg text-purple-600">
                <FileText size={20} />
              </div>
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">Visualisation de la Facture</h3>
            </div>
            <div className="flex items-center space-x-3">
              <button onClick={() => window.print()} className="bg-purple-600 text-white px-6 py-2.5 rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-purple-700 transition-all shadow-lg shadow-purple-900/20 flex items-center">
                <Printer size={16} className="mr-2" /> Imprimer / PDF
              </button>
              <button onClick={onClose} className="p-2 text-slate-400 hover:text-rose-500 transition-colors">
                <X size={24} />
              </button>
            </div>
          </div>

          {/* Invoice Body */}
          <div id="invoice-print-area" className="p-16 overflow-y-auto bg-white dark:bg-slate-900 relative">
            {/* Status Stamp */}
            <div className="absolute top-48 right-16 pointer-events-none z-0 opacity-10 transform rotate-12 select-none no-print">
              <div className={`text-8xl font-black border-8 px-8 py-4 rounded-3xl uppercase tracking-tighter ${
                sale.invoiceStatus === 'paid' ? 'border-emerald-500 text-emerald-500' : 
                sale.invoiceStatus === 'refunded' ? 'border-rose-500 text-rose-500' : 'border-blue-500 text-blue-500'
              }`}>
                {sale.invoiceStatus === 'paid' ? 'PAYÉE' : sale.invoiceStatus === 'refunded' ? 'AVOIR' : 'PUBLIÉE'}
              </div>
            </div>

            <div className="relative z-10 space-y-12">
              {/* Header */}
              <div className="flex justify-between items-start border-b-4 border-slate-900 pb-10">
                <div className="flex items-center space-x-6">
                  <div className="w-20 h-20 bg-slate-900 text-white rounded-3xl flex items-center justify-center shadow-2xl">
                    <LogoG className="w-12 h-12" />
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">FAST FOOD MYA D'OR</h2>
                    <p className="text-[11px] font-black text-purple-600 uppercase tracking-[0.4em]">{config.companySlogan}</p>
                    <div className="flex flex-col text-[11px] font-bold text-slate-500 mt-2 space-y-0.5">
                      <span className="flex items-center"><MapPin size={12} className="mr-2" /> {config.address}</span>
                      <span className="flex items-center"><Phone size={12} className="mr-2" /> {config.phone}</span>
                      <span className="flex items-center"><Mail size={12} className="mr-2" /> {config.email}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right space-y-2">
                  <h1 className="text-6xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">FACTURE</h1>
                  <p className="text-2xl font-mono font-black text-purple-600 bg-purple-50 dark:bg-purple-900/20 px-4 py-1 rounded-xl inline-block">#{sale.id}</p>
                  {sale.orderLocation && (
                    <p className="text-sm font-black text-slate-500 uppercase tracking-[0.2em] mt-2 bg-slate-50 dark:bg-slate-800 px-3 py-1 rounded-lg border inline-block">{sale.orderLocation}</p>
                  )}
                </div>
              </div>

              {/* Addresses & Info */}
              <div className="grid grid-cols-2 gap-20">
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] border-b border-slate-100 pb-2">Facturé à</h4>
                  <div className="space-y-1">
                    <p className="text-2xl font-black text-slate-900 dark:text-white uppercase">{sale.customer}</p>
                    <p className="text-sm font-bold text-slate-500">Client Comptoir / Particulier</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] border-b border-slate-100 pb-2">Informations</h4>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase">Date d'émission</p>
                      <p className="text-sm font-black text-slate-800 dark:text-slate-200">{sale.date.split(' ')[0]}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase">Échéance</p>
                      <p className="text-sm font-black text-slate-800 dark:text-slate-200">À réception</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase">Paiement</p>
                      <p className="text-sm font-black text-slate-800 dark:text-slate-200">{sale.paymentMethod || 'Espèces'}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase">Vendeur</p>
                      <p className="text-sm font-black text-slate-800 dark:text-slate-200">MYA D'OR Admin</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest">
                      <th className="px-8 py-5">Description des articles</th>
                      <th className="px-8 py-5 text-center">Qté</th>
                      <th className="px-8 py-5 text-right">Prix Unitaire</th>
                      <th className="px-8 py-5 text-right">Montant HT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {sale.items?.map((item, idx) => (
                      <tr key={idx} className={`text-sm ${sale.invoiceStatus === 'refunded' ? 'bg-rose-50/10' : ''}`}>
                        <td className="px-8 py-6">
                          <p className="font-black text-slate-900 dark:text-slate-100">{item.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Catégorie: Restauration</p>
                        </td>
                        <td className="px-8 py-6 text-center font-mono font-bold text-slate-600">{item.quantity}</td>
                        <td className="px-8 py-6 text-right font-mono text-slate-600">{item.price.toLocaleString()}</td>
                        <td className="px-8 py-6 text-right font-black font-mono text-slate-900 dark:text-white">{(item.quantity * item.price).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals & Notes */}
              <div className="flex justify-between items-start pt-4">
                <div className="max-w-md space-y-6">
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Notes & Conditions</h4>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed italic border-l-4 border-slate-100 pl-4">
                      {config.receiptFooter || "Merci de votre confiance. Toute réclamation doit être faite sous 24h."}
                    </p>
                  </div>
                  <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 flex items-center space-x-4">
                    <div className="p-3 bg-white dark:bg-slate-900 rounded-xl shadow-sm">
                      <QrCode size={40} className="text-slate-900 dark:text-white" />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase">Validation Électronique</p>
                      <p className="text-[10px] font-bold text-slate-600">Scannez pour vérifier l'authenticité de cette facture sur notre portail client.</p>
                    </div>
                  </div>
                </div>

                <div className="w-80 space-y-3">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-500 uppercase px-4">
                    <span>Sous-Total HT</span>
                    <span className="font-mono">{totalHT.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-bold text-slate-500 uppercase px-4">
                    <span>TVA ({taxRate}%)</span>
                    <span className="font-mono">{taxAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                  </div>
                  <div className={`p-8 rounded-3xl shadow-2xl flex flex-col items-center justify-center transform scale-105 origin-right mt-6 ${
                    sale.invoiceStatus === 'refunded' ? 'bg-rose-600 text-white' : 'bg-slate-900 text-white'
                  }`}>
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] mb-2 opacity-70">
                      {sale.invoiceStatus === 'refunded' ? 'MONTANT DE L\'AVOIR' : 'TOTAL NET À PAYER'}
                    </span>
                    <span className="text-4xl font-black font-mono">
                      {sale.total.toLocaleString()} <span className="text-sm">{config.currency}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Bank Details Footer */}
              <div className="pt-12 mt-12 border-t border-dashed border-slate-200 grid grid-cols-3 gap-8 text-center">
                 <div className="space-y-1">
                   <p className="text-[9px] font-black text-slate-400 uppercase">Bankily / Masrvi</p>
                   <p className="text-sm font-black text-slate-800 dark:text-slate-200">{config.phone}</p>
                 </div>
                 <div className="space-y-1">
                   <p className="text-[9px] font-black text-slate-400 uppercase">Registre Commerce</p>
                   <p className="text-sm font-black text-slate-800 dark:text-slate-200">{config.registrationNumber}</p>
                 </div>
                 <div className="space-y-1">
                   <p className="text-[9px] font-black text-slate-400 uppercase">Support Client</p>
                   <p className="text-sm font-black text-slate-800 dark:text-slate-200">{config.email}</p>
                 </div>
              </div>
            </div>
          </div>
          
          <div className="p-6 bg-slate-50 dark:bg-slate-800 border-t border-slate-100 dark:border-slate-800 flex justify-end space-x-3 no-print">
            {sale.invoiceStatus !== 'refunded' && (
              <button onClick={() => handleRefund(sale.id)} className="bg-rose-50 text-rose-700 px-6 py-2.5 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-rose-100 transition-all flex items-center border border-rose-100">
                <RotateCcw size={16} className="mr-2" /> Créer un avoir
              </button>
            )}
            <button onClick={onClose} className="bg-slate-900 text-white px-10 py-2.5 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-800 transition-all">Fermer</button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col space-y-6 animate-fadeIn pb-10 pr-2">
      {selectedInvoice && <InvoiceModal sale={selectedInvoice} onClose={() => setSelectedInvoice(null)} />}
      {isCreating && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-6 border-b flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                <h3 className="text-xl font-black uppercase tracking-tighter flex items-center">
                  <Plus className="mr-3 text-purple-600" /> Créer une Facture Directe
                </h3>
                <button onClick={() => setIsCreating(false)} className="p-2 text-slate-400 hover:text-rose-500"><X size={24}/></button>
              </div>
              <div className="flex-1 flex overflow-hidden">
                 <div className="flex-1 p-8 space-y-6 overflow-y-auto">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Client</label>
                      <input value={newCust} onChange={e => setNewCust(e.target.value)} placeholder="Nom du client ou entreprise..." className="w-full px-5 py-4 rounded-xl border-2 border-slate-100 dark:border-slate-800 dark:bg-slate-800 font-bold focus:border-purple-500 transition-all outline-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Sélection des articles</label>
                      <div className="relative">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"/>
                        <input value={pSearch} onChange={e => setPSearch(e.target.value)} placeholder="Chercher un article au menu..." className="w-full pl-12 pr-5 py-3 rounded-xl border-2 border-slate-100 dark:bg-slate-800 dark:border-slate-800 outline-none focus:border-purple-500" />
                      </div>
                    </div>
                    {pSearch && (
                      <div className="grid grid-cols-1 gap-2 border border-slate-100 dark:border-slate-800 rounded-2xl p-2 max-h-60 overflow-y-auto">
                        {products.filter(p => p.name.toLowerCase().includes(pSearch.toLowerCase())).slice(0, 10).map(p => (
                          <button key={p.id} onClick={() => setNewItems(prev => [...prev, {product: p, qty: 1}])} className="w-full px-4 py-3 flex justify-between items-center hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-xl transition-all group">
                            <span className="font-bold text-slate-700 dark:text-slate-300 group-hover:text-purple-600">{p.name}</span>
                            <span className="text-purple-600 font-black">{p.price} {config.currency}</span>
                          </button>
                        ))}
                      </div>
                    )}
                 </div>
                 <div className="w-96 bg-slate-50 dark:bg-slate-800/30 p-8 flex flex-col border-l border-slate-100 dark:border-slate-800">
                    <h4 className="text-[10px] font-black uppercase text-slate-400 mb-6 tracking-widest">Récapitulatif Lignes</h4>
                    <div className="flex-1 space-y-3 overflow-y-auto pr-2">
                      {newItems.map((item, i) => (
                        <div key={i} className="bg-white dark:bg-slate-900 p-4 rounded-2xl flex justify-between items-center shadow-sm border border-slate-100 dark:border-slate-800 animate-slideInRight">
                          <div className="flex-1 mr-3">
                            <p className="text-xs font-black text-slate-800 dark:text-slate-100 truncate">{item.product.name}</p>
                            <p className="text-[10px] font-bold text-slate-400">{item.product.price} {config.currency} / u.</p>
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className="text-xs font-black bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg">{item.qty}x</span>
                            <button onClick={() => setNewItems(prev => prev.filter((_, idx) => idx !== i))} className="text-rose-500 hover:text-rose-700">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                      {newItems.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center opacity-30 text-center space-y-4">
                          <Package size={48} />
                          <p className="text-xs font-black uppercase tracking-widest">Panier vide</p>
                        </div>
                      )}
                    </div>
                    <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center mb-6">
                      <span className="text-sm font-black uppercase text-slate-400">Total TTC</span>
                      <span className="text-3xl font-black text-slate-900 dark:text-white">{newItems.reduce((a,b) => a+(b.product.price*b.qty), 0).toLocaleString()} <span className="text-sm font-bold">{config.currency}</span></span>
                    </div>
                    <button onClick={handleSaveInvoice} disabled={!newCust || newItems.length === 0} className={`w-full py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl transition-all ${!newCust || newItems.length === 0 ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-purple-600 text-white hover:bg-purple-700 active:scale-[0.98]'}`}>
                      ENREGISTRER LA FACTURE
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-white">Facturation</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Gérez vos factures clients et les avoirs de remboursement</p>
        </div>
        <div className="flex items-center space-x-3">
          {(userRole === 'admin' || userRole === 'manager') && (
            <button onClick={() => setIsCreating(true)} className="bg-purple-600 text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-purple-900/20 hover:bg-purple-700 transition-all active:scale-95 flex items-center">
              <Plus size={18} className="mr-2" /> Créer Facture
            </button>
          )}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input type="text" placeholder="Rechercher par numéro ou client..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 dark:text-slate-100 transition-all shadow-sm outline-none" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">C.A Net</p>
            <div className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500"><Banknote size={14} /></div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{totals.total.toLocaleString()} {config.currency}</p>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-900/10 p-6 rounded-[2rem] border border-emerald-100 dark:border-emerald-900/30 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Encaissé</p>
            <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600"><CheckCircle2 size={14} /></div>
          </div>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{totals.paid.toLocaleString()} {config.currency}</p>
        </div>
        <div className="bg-rose-50 dark:bg-rose-900/10 p-6 rounded-[2rem] border border-rose-100 dark:border-rose-900/30 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Avoirs</p>
            <div className="p-1.5 bg-rose-100 dark:bg-rose-900/30 rounded-lg text-rose-600"><RotateCcw size={14} /></div>
          </div>
          <p className="text-2xl font-black text-rose-600 dark:text-rose-400">{totals.refunded.toLocaleString()} {config.currency}</p>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/10 p-6 rounded-[2rem] border border-blue-100 dark:border-blue-900/30 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">En attente</p>
            <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600"><Clock size={14} /></div>
          </div>
          <p className="text-2xl font-black text-blue-600 dark:text-blue-400">{totals.due.toLocaleString()} {config.currency}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex-1 flex flex-col transition-colors">
        <div className="px-8 py-5 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex space-x-1 overflow-x-auto scrollbar-hide">
            {['all', 'posted', 'paid', 'refunded'].map(status => (
              <button 
                key={status} 
                onClick={() => setStatusFilter(status)} 
                className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                  statusFilter === status ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
              >
                {status === 'all' ? 'Toutes les factures' : status === 'posted' ? 'Publiées' : status === 'paid' ? 'Payées' : 'Avoirs'}
              </button>
            ))}
          </div>
          <button className="p-2 text-slate-400 hover:text-purple-600 transition-all"><Filter size={18} /></button>
        </div>
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50 dark:border-slate-800">
                <th className="px-8 py-5">Référence</th>
                <th className="px-8 py-5">Client</th>
                <th className="px-8 py-5">Date</th>
                <th className="px-8 py-5">Montant TTC</th>
                <th className="px-8 py-5">Statut</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {filteredInvoices.map((inv) => (
                <tr key={inv.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group ${inv.invoiceStatus === 'refunded' ? 'bg-rose-50/10' : ''}`}>
                  <td className="px-8 py-5 font-black text-purple-600 font-mono text-sm">#{inv.id}</td>
                  <td className="px-8 py-5">
                    <p className="text-sm font-black text-slate-800 dark:text-slate-200">{inv.customer}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{inv.orderLocation || 'Comptoir'}</p>
                  </td>
                  <td className="px-8 py-5 text-xs font-bold text-slate-500">{inv.date.split(' ')[0]}</td>
                  <td className={`px-8 py-5 text-sm font-black ${inv.invoiceStatus === 'refunded' ? 'text-rose-500 line-through' : 'text-slate-900 dark:text-white'}`}>
                    {inv.total.toLocaleString()} {config.currency}
                  </td>
                  <td className="px-8 py-5">
                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase border shadow-sm ${getStatusColor(inv.invoiceStatus)}`}>
                      {inv.invoiceStatus === 'posted' ? 'PUBLIÉE' : inv.invoiceStatus === 'paid' ? 'PAYÉE' : 'AVOIR'}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <button onClick={() => setSelectedInvoice(inv)} className="bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-purple-600 p-2.5 rounded-xl transition-all opacity-0 group-hover:opacity-100 flex items-center justify-center ml-auto">
                      <Eye size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredInvoices.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center opacity-30 space-y-4">
                      <FileText size={48} />
                      <p className="text-sm font-black uppercase tracking-widest">Aucune facture trouvée</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Invoicing;
