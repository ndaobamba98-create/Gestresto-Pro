
import React, { useState } from 'react';
import { SaleOrder, ERPConfig, Product, SaleItem, ViewType } from '../types';
import { 
  FileText, Search, Plus, Download, Eye, Printer, X, RotateCcw, Calendar, MapPin, Phone, Trash, QrCode, User, CreditCard, Hash
} from 'lucide-react';
import * as XLSX from 'xlsx';

// Define the missing Props interface for Invoicing component
interface Props {
  sales: SaleOrder[];
  config: ERPConfig;
  onUpdate: (sales: SaleOrder[]) => void;
  products: Product[];
  userRole: string;
  onAddSale: (sale: Partial<SaleOrder>) => void;
  notify: (title: string, message: string, type?: 'success' | 'info' | 'warning') => void;
  userPermissions: ViewType[];
}

// Logo stylisé haut de gamme pour les documents
const AppLogoIcon = ({ className = "w-10 h-10" }) => (
  <div className={`relative ${className}`}>
    <div className="w-full h-full bg-slate-900 rounded-[1.5rem] flex items-center justify-center shadow-xl border border-white/10 overflow-hidden">
      <svg viewBox="0 0 100 100" className="w-8/12 h-8/12" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M30 35C30 26.7157 36.7157 20 45 20H70V35H45C42.2386 35 40 37.2386 40 40C40 42.7614 42.2386 45 45 45H55C63.2843 45 70 51.7157 70 60C70 68.2843 63.2843 75 55 75H30V60H55C57.7614 60 60 57.7614 60 55C60 52.2386 57.7614 50 55 50H45C36.7157 50 30 43.2843 30 35Z" fill="white"/>
        <circle cx="20" cy="20" r="10" fill="#a855f7" />
      </svg>
    </div>
  </div>
);

const Invoicing: React.FC<Props> = ({ sales, config, onUpdate, products, userRole, onAddSale, notify }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedInvoice, setSelectedInvoice] = useState<SaleOrder | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [creationType, setCreationType] = useState<'invoice' | 'refund'>('invoice');

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

  const handleOpenCreation = (type: 'invoice' | 'refund') => {
    setCreationType(type);
    setIsCreating(true);
    setNewCust('');
    setNewItems([]);
    setPSearch('');
  };

  const handleSaveDocument = () => {
    if (!newCust || newItems.length === 0) return;
    const now = new Date();
    const formattedDate = now.toLocaleDateString('fr-FR') + ' ' + now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const total = newItems.reduce((acc, i) => acc + (i.product.price * i.qty), 0);

    const saleData: Partial<SaleOrder> = {
      customer: newCust,
      date: formattedDate,
      total: total,
      status: creationType === 'refund' ? 'refunded' : 'confirmed',
      invoiceStatus: creationType === 'refund' ? 'refunded' : 'posted',
      paymentMethod: 'Especes',
      items: newItems.map(i => ({
        productId: i.product.id,
        name: i.product.name,
        quantity: i.qty,
        price: i.product.price
      })),
      orderLocation: 'Bureau'
    };

    onAddSale(saleData);
    setIsCreating(false);
    notify(
      creationType === 'refund' ? "Avoir Enregistré" : "Facture Créée", 
      `Document pour ${newCust} généré avec succès.`, 
      creationType === 'refund' ? 'warning' : 'success'
    );
  };

  const handleExportExcel = () => {
    const dataToExport = filteredInvoices.map(inv => ({
      'Référence': inv.id,
      'Client': inv.customer,
      'Date': inv.date,
      'Montant TTC': inv.total,
      'Devise': config.currency,
      'Type': inv.invoiceStatus === 'refunded' ? 'AVOIR' : 'FACTURE'
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Facturation");
    XLSX.writeFile(workbook, `Facturation_SamaCaisse_${Date.now()}.xlsx`);
  };

  return (
    <div className="h-full flex flex-col space-y-6 animate-fadeIn pb-10 pr-2">
      {selectedInvoice && (
        <InvoiceModal 
          sale={selectedInvoice} 
          config={config} 
          onClose={() => setSelectedInvoice(null)} 
          onRefund={() => {
            if (window.confirm("Confirmer la création d'un avoir pour cette facture ?")) {
              const updatedSales = sales.map(s => 
                s.id === selectedInvoice.id ? { ...s, invoiceStatus: 'refunded' as const, status: 'refunded' as const } : s
              );
              onUpdate(updatedSales);
              setSelectedInvoice(null);
              notify("Avoir généré", "Document converti.", 'warning');
            }
          }}
        />
      )}

      {isCreating && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-950 w-full max-w-5xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scaleIn">
            <div className={`p-8 border-b flex justify-between items-center ${creationType === 'refund' ? 'bg-rose-50 dark:bg-rose-900/20' : 'bg-slate-50 dark:bg-slate-900/50'}`}>
              <div className="flex items-center space-x-4">
                <div className={`p-3 rounded-2xl text-white shadow-lg ${creationType === 'refund' ? 'bg-rose-600' : 'bg-purple-600'}`}>
                  {creationType === 'refund' ? <RotateCcw size={24} /> : <Plus size={24} />}
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tighter">
                    {creationType === 'refund' ? "Nouvel Avoir" : "Nouvelle Facture"}
                  </h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Document financier direct</p>
                </div>
              </div>
              <button onClick={() => setIsCreating(false)} className="p-2 text-slate-400 hover:text-rose-500 transition-colors"><X size={28}/></button>
            </div>
            
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
              <div className="flex-1 p-10 space-y-8 overflow-y-auto">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-1">Client Destinataire</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input value={newCust} onChange={e => setNewCust(e.target.value)} placeholder="Nom ou Raison Sociale..." className="w-full pl-12 pr-6 py-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 dark:bg-slate-900 font-bold focus:border-purple-500 outline-none transition-all" />
                  </div>
                </div>
                
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-1">Recherche Articles</label>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20}/>
                    <input value={pSearch} onChange={e => setPSearch(e.target.value)} placeholder="Filtrer le catalogue..." className="w-full pl-12 pr-6 py-4 rounded-2xl border-2 border-slate-100 dark:bg-slate-900 outline-none focus:border-purple-500 font-medium" />
                  </div>
                </div>

                {pSearch && (
                  <div className="grid grid-cols-1 gap-2 border border-slate-100 dark:border-slate-800 rounded-3xl p-3 max-h-60 overflow-y-auto bg-slate-50/50 dark:bg-slate-900/50">
                    {products.filter(p => p.name.toLowerCase().includes(pSearch.toLowerCase())).slice(0, 10).map(p => (
                      <button key={p.id} onClick={() => {
                        const exists = newItems.find(i => i.product.id === p.id);
                        if(exists) {
                          setNewItems(newItems.map(i => i.product.id === p.id ? {...i, qty: i.qty + 1} : i));
                        } else {
                          setNewItems([...newItems, {product: p, qty: 1}]);
                        }
                      }} className="w-full px-5 py-4 flex justify-between items-center hover:bg-purple-600 hover:text-white rounded-2xl transition-all group">
                        <span className="font-bold text-slate-700 dark:text-slate-300 group-hover:text-white">{p.name}</span>
                        <span className="font-black opacity-80">{p.price} {config.currency}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="w-[400px] bg-slate-50 dark:bg-slate-900/80 p-10 flex flex-col border-l border-slate-100 dark:border-slate-800 shadow-inner">
                <h4 className="text-[10px] font-black uppercase text-slate-500 mb-8 tracking-[0.3em]">Résumé du Document</h4>
                <div className="flex-1 space-y-4 overflow-y-auto pr-2 scrollbar-hide">
                  {newItems.map((item, i) => (
                    <div key={i} className="bg-white dark:bg-slate-950 p-5 rounded-3xl flex justify-between items-center shadow-sm border border-slate-100 dark:border-slate-800 animate-slideInRight">
                      <div className="flex-1 mr-3">
                        <p className="text-xs font-black text-slate-900 dark:text-slate-100 truncate">{item.product.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 mt-0.5">{item.product.price} {config.currency} / unité</p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="text-xs font-black px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl">x{item.qty}</span>
                        <button onClick={() => setNewItems(prev => prev.filter((_, idx) => idx !== i))} className="text-rose-500 p-2 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-xl transition-all"><Trash size={18}/></button>
                      </div>
                    </div>
                  ))}
                  {newItems.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center opacity-20 text-center space-y-4">
                      <FileText size={48} />
                      <p className="text-[10px] font-black uppercase tracking-widest">Aucun article</p>
                    </div>
                  )}
                </div>
                
                <div className="mt-10 pt-8 border-t border-slate-200 dark:border-slate-700 space-y-6">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Montant Total HT</span>
                    <span className="text-lg font-bold">{(newItems.reduce((a,b) => a+(b.product.price*b.qty), 0)).toLocaleString()} {config.currency}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-black uppercase text-slate-500 tracking-widest">TOTAL TTC</span>
                    <span className={`text-4xl font-black ${creationType === 'refund' ? 'text-rose-600' : 'text-slate-950 dark:text-white'}`}>
                      {newItems.reduce((a,b) => a+(b.product.price*b.qty), 0).toLocaleString()}
                    </span>
                  </div>
                  <button 
                    onClick={handleSaveDocument} 
                    disabled={!newCust || newItems.length === 0} 
                    className={`w-full py-5 rounded-3xl font-black uppercase text-xs tracking-[0.2em] shadow-2xl transition-all active:scale-95 ${
                      creationType === 'refund' 
                        ? 'bg-rose-600 hover:bg-rose-700 text-white' 
                        : 'bg-purple-600 hover:bg-purple-700 text-white'
                    } disabled:opacity-50 disabled:grayscale`}
                  >
                    Valider le Document
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Facturation & Avoirs</h1>
          <p className="text-sm text-slate-500 font-medium">Contrôle des flux financiers et documents légaux</p>
        </div>
        <div className="flex items-center space-x-3">
          <button onClick={handleExportExcel} className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-200 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center">
            <Download size={18} className="mr-2" /> Export
          </button>
          {userRole !== 'cashier' && (
            <>
              <button onClick={() => handleOpenCreation('refund')} className="bg-rose-50 dark:bg-rose-900/20 text-rose-600 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest shadow-sm hover:bg-rose-600 hover:text-white transition-all border border-rose-100 dark:border-rose-900/30">
                <RotateCcw size={18} className="mr-2" /> Avoir
              </button>
              <button onClick={() => handleOpenCreation('invoice')} className="bg-purple-600 text-white px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl hover:bg-purple-700 transition-all active:scale-95">
                <Plus size={18} className="mr-2" /> Facture
              </button>
            </>
          )}
        </div>
      </div>

      {/* TABLE SECTION */}
      <div className="bg-white dark:bg-slate-950 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex-1 flex flex-col transition-colors">
        <div className="px-10 py-6 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex space-x-2">
            {['all', 'posted', 'refunded'].map(status => (
              <button 
                key={status} 
                onClick={() => setStatusFilter(status)} 
                className={`px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                  statusFilter === status ? 'bg-slate-950 text-white shadow-xl' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
              >
                {status === 'all' ? 'Tous les documents' : status === 'posted' ? 'Factures' : 'Avoirs'}
              </button>
            ))}
          </div>
          <div className="relative w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input type="text" placeholder="Rechercher par client ou ID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 pr-6 py-3 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl text-xs font-bold outline-none focus:border-purple-500 transition-all" />
          </div>
        </div>
        <div className="overflow-x-auto flex-1 scrollbar-hide">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-50 dark:border-slate-800">
                <th className="px-10 py-6">Réf. Document</th>
                <th className="px-10 py-6">Client / Entité</th>
                <th className="px-10 py-6">Date de Création</th>
                <th className="px-10 py-6 text-right">Montant Final</th>
                <th className="px-10 py-6 text-center">Nature</th>
                <th className="px-10 py-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {filteredInvoices.map((inv) => (
                <tr key={inv.id} className={`hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors group ${inv.invoiceStatus === 'refunded' ? 'bg-rose-50/10' : ''}`}>
                  <td className="px-10 py-6 font-black text-purple-600 font-mono text-sm tracking-tighter">#{inv.id.slice(-8)}</td>
                  <td className="px-10 py-6 font-bold text-slate-900 dark:text-slate-100">{inv.customer}</td>
                  <td className="px-10 py-6 text-[11px] font-bold text-slate-500">{inv.date}</td>
                  <td className={`px-10 py-6 text-base font-black text-right ${inv.invoiceStatus === 'refunded' ? 'text-rose-600' : 'text-slate-950 dark:text-white'}`}>
                    {inv.invoiceStatus === 'refunded' ? '-' : ''}{inv.total.toLocaleString()} {config.currency}
                  </td>
                  <td className="px-10 py-6 text-center">
                    <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase border-2 ${
                      inv.invoiceStatus === 'refunded' ? 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-900/20 dark:border-rose-800' : 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:border-blue-800'
                    }`}>
                      {inv.invoiceStatus === 'refunded' ? 'AVOIR' : 'FACTURE'}
                    </span>
                  </td>
                  <td className="px-10 py-6 text-right">
                    <button onClick={() => setSelectedInvoice(inv)} className="p-3 bg-slate-100 dark:bg-slate-900 rounded-2xl text-slate-500 hover:text-purple-600 opacity-0 group-hover:opacity-100 transition-all shadow-sm">
                      <Eye size={20} />
                    </button>
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

// COMPOSANT MODAL FACTURE HAUTE QUALITÉ RÉVISÉ (MODERNE ET SIMPLE)
const InvoiceModal = ({ sale, config, onClose, onRefund }: { sale: SaleOrder, config: ERPConfig, onClose: () => void, onRefund: () => void }) => {
  const isRefund = sale.invoiceStatus === 'refunded';
  
  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[100] flex items-center justify-center p-4 sm:p-10 animate-fadeIn">
      <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-[0_0_100px_rgba(0,0,0,0.4)] overflow-hidden animate-scaleIn flex flex-col max-h-full">
        
        {/* ACTIONS HEADER (NO PRINT) */}
        <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 no-print">
          <div className="flex items-center space-x-3">
             <div className={`w-3 h-3 rounded-full ${isRefund ? 'bg-rose-500' : 'bg-emerald-500'}`}></div>
             <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Document {isRefund ? 'Remboursement' : 'Certifié'}</span>
          </div>
          <div className="flex items-center space-x-3">
            <button onClick={() => window.print()} className="bg-slate-900 text-white px-6 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center shadow-lg hover:bg-black transition-all">
              <Printer size={16} className="mr-2" /> Imprimer
            </button>
            <button onClick={onClose} className="p-2.5 text-slate-400 hover:text-rose-500 transition-colors bg-white rounded-xl border border-slate-200">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* FACTURE REELLE (PRINT AREA) */}
        <div id="invoice-print-area" className="p-16 overflow-y-auto bg-white flex-1 text-slate-900">
          
          {/* HEADER PREMIUM */}
          <div className="flex justify-between items-start mb-20">
            <div className="flex items-center space-x-8">
              <AppLogoIcon className="w-20 h-20" />
              <div>
                <h2 className="text-3xl font-black text-slate-950 uppercase tracking-tighter leading-none mb-1">FAST FOOD MYA D'OR</h2>
                <p className="text-[10px] font-black text-purple-600 uppercase tracking-[0.4em]">{config.companySlogan}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Date d'émission</p>
              <p className="text-sm font-black">{sale.date.split(' ')[0]}</p>
            </div>
          </div>

          {/* INFOS CLES */}
          <div className="grid grid-cols-2 gap-20 mb-20">
            <div className="space-y-4">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Destinataire</p>
               <h3 className="text-3xl font-black text-slate-950 uppercase tracking-tight">{sale.customer}</h3>
               <div className="flex items-center text-xs font-bold text-slate-500">
                 <MapPin size={12} className="mr-2 opacity-40" /> Nouakchott, Mauritanie
               </div>
            </div>
            <div className="space-y-4">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Référence</p>
               <h3 className="text-3xl font-black font-mono text-slate-950">#{sale.id.slice(-8)}</h3>
               <div className="flex items-center text-xs font-black text-purple-600 uppercase">
                 <CreditCard size={12} className="mr-2" /> {sale.paymentMethod || 'Espèces'}
               </div>
            </div>
          </div>

          {/* TABLEAU EPURE */}
          <div className="mb-20">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b-2 border-slate-950">
                  <th className="py-4 text-[10px] font-black uppercase tracking-widest">Désignation</th>
                  <th className="py-4 text-center text-[10px] font-black uppercase tracking-widest">Qté</th>
                  <th className="py-4 text-right text-[10px] font-black uppercase tracking-widest">Prix U.</th>
                  <th className="py-4 text-right text-[10px] font-black uppercase tracking-widest">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sale.items?.map((item, idx) => (
                  <tr key={idx} className="group">
                    <td className="py-6 font-black text-slate-900 uppercase text-xs">{item.name}</td>
                    <td className="py-6 text-center font-bold text-slate-400 text-sm">x{item.quantity}</td>
                    <td className="py-6 text-right font-bold text-slate-500 text-sm">{item.price.toLocaleString()}</td>
                    <td className="py-6 text-right font-black text-slate-950 text-sm">{(item.quantity * item.price).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* TOTAL & FOOTER */}
          <div className="flex justify-between items-start pt-10">
            <div className="max-w-[200px]">
               <QrCode size={80} className="text-slate-100 mb-4" />
               <p className="text-[8px] font-bold text-slate-300 uppercase leading-relaxed tracking-wider">Ce document fait office de preuve d'achat officielle. Conservé dans le registre MYA D'OR.</p>
            </div>
            
            <div className="flex flex-col items-end">
               <div className="flex justify-between w-64 mb-4 px-2">
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sous-Total HT</span>
                 <span className="text-sm font-bold">{sale.total.toLocaleString()} {config.currency}</span>
               </div>
               <div className="flex justify-between w-64 mb-8 px-2">
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">TVA (0%)</span>
                 <span className="text-sm font-bold">0 {config.currency}</span>
               </div>
               
               <div className={`p-10 rounded-[2.5rem] ${isRefund ? 'bg-rose-600' : 'bg-slate-900'} text-white shadow-2xl flex flex-col items-center min-w-[320px] transform hover:scale-[1.02] transition-transform`}>
                  <p className="text-[9px] font-black uppercase tracking-[0.4em] mb-4 opacity-60">
                    {isRefund ? 'MONTANT À REMBOURSER' : 'TOTAL NET À PAYER'}
                  </p>
                  <div className="flex items-baseline">
                    <span className="text-6xl font-black font-mono tracking-tighter leading-none">
                      {sale.total.toLocaleString()}
                    </span>
                    <span className="text-xl font-bold ml-3 uppercase opacity-80">{config.currency}</span>
                  </div>
               </div>
            </div>
          </div>

          <div className="mt-24 pt-10 border-t border-slate-100 flex justify-between items-center text-[9px] font-black text-slate-400 uppercase tracking-widest">
            <div>SamaCaisse Pro Edition Restauration</div>
            <div>{config.companyName} • {config.phone} • RC: {config.registrationNumber}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Invoicing;
