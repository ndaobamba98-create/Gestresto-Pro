
import React, { useState } from 'react';
import { SaleOrder, ERPConfig, Product, ViewType, Attachment, PaymentMethod } from '../types';
import { 
  FileText, Search, Plus, Download, Eye, Printer, X, RotateCcw, Calendar, MapPin, Phone, Trash, QrCode, User, CreditCard, Paperclip, File, Save, CheckCircle2, ShoppingCart, Smartphone, Banknote, Wallet
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { PAYMENT_METHODS_LIST } from '../constants';

export const AppLogoDoc = ({ className = "w-16 h-16" }) => (
  <div className={`relative ${className}`}>
    <div className="w-full h-full bg-slate-900 rounded-2xl flex items-center justify-center shadow-lg overflow-hidden border border-slate-700">
      <svg viewBox="0 0 100 100" className="w-10/12 h-10/12" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M30 35C30 26.7157 36.7157 20 45 20H70V35H45C42.2386 35 40 37.2386 40 40C40 42.7614 42.2386 45 45 45H55C63.2843 45 70 51.7157 70 60C70 68.2843 63.2843 75 55 75H30V60H55C57.7614 60 60 57.7614 60 55C60 52.2386 57.7614 50 55 50H45C36.7157 50 30 43.2843 30 35Z" fill="#a855f7"/>
        <circle cx="20" cy="20" r="10" fill="#3b82f6" />
      </svg>
    </div>
  </div>
);

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

const Invoicing: React.FC<Props> = ({ sales, config, onUpdate, products, userRole, onAddSale, notify, userPermissions }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedInvoice, setSelectedInvoice] = useState<SaleOrder | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [creationType, setCreationType] = useState<'invoice' | 'refund'>('invoice');

  const [newCust, setNewCust] = useState('');
  const [newItems, setNewItems] = useState<{product: Product, qty: number}[]>([]);
  const [newPaymentMethod, setNewPaymentMethod] = useState<PaymentMethod>('Especes');
  const [pSearch, setPSearch] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  const canManageDoc = userPermissions.includes('manage_invoicing');

  const invoices = sales.map(s => ({ ...s, invoiceStatus: s.invoiceStatus || 'posted' }));
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
    setNewPaymentMethod('Especes');
    setPSearch('');
    setAttachments([]);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    (Array.from(files) as File[]).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const newAttachment: Attachment = { id: `ATT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, name: file.name, type: file.type, url: event.target?.result as string };
        setAttachments(prev => [...prev, newAttachment]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  const handleSaveDocument = () => {
    if (!newCust || newItems.length === 0) return;
    const now = new Date();
    const total = newItems.reduce((acc, i) => acc + (i.product.price * i.qty), 0);
    const saleData: Partial<SaleOrder> = {
      customer: newCust,
      date: now.toLocaleString(),
      total: total,
      status: creationType === 'refund' ? 'refunded' : 'confirmed',
      invoiceStatus: creationType === 'refund' ? 'refunded' : 'posted',
      paymentMethod: newPaymentMethod,
      items: newItems.map(i => ({ productId: i.product.id, name: i.product.name, quantity: i.qty, price: i.product.price })),
      orderLocation: 'Bureau',
      attachments: attachments
    };
    onAddSale(saleData);
    setIsCreating(false);
    notify(creationType === 'refund' ? "Avoir Créé" : "Facture Créée", `Document généré pour ${newCust}.`, 'success');
  };

  const handleExportExcel = () => {
    const data = filteredInvoices.map(inv => ({ 'Référence': inv.id, 'Client': inv.customer, 'Date': inv.date, 'Montant TTC': inv.total, 'Devise': config.currency, 'Type': inv.invoiceStatus === 'refunded' ? 'AVOIR' : 'FACTURE' }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Facturation");
    XLSX.writeFile(workbook, `Facturation_SamaCaisse_${Date.now()}.xlsx`);
  };

  return (
    <div className="h-full flex flex-col space-y-8 animate-fadeIn pb-10 pr-2">
      {selectedInvoice && (
        <InvoiceModal sale={selectedInvoice} config={config} onClose={() => setSelectedInvoice(null)} />
      )}

      {isCreating && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-950 w-full max-w-6xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scaleIn border border-white/10">
            <div className={`p-8 border-b flex justify-between items-center ${creationType === 'refund' ? 'bg-rose-50 dark:bg-rose-900/10' : 'bg-slate-50 dark:bg-slate-900/50'}`}>
              <div className="flex items-center space-x-5">
                <div className={`p-4 rounded-[1.25rem] text-white shadow-xl ${creationType === 'refund' ? 'bg-rose-600' : 'bg-purple-600'}`}>
                  {creationType === 'refund' ? <RotateCcw size={26} /> : <FileText size={26} />}
                </div>
                <div>
                  <h3 className="text-2xl font-black uppercase tracking-tighter">{creationType === 'refund' ? "Nouvel Avoir" : "Nouvelle Facture"}</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Saisie manuelle du document</p>
                </div>
              </div>
              <button onClick={() => setIsCreating(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-all"><X size={32}/></button>
            </div>
            
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
              <div className="flex-1 p-12 space-y-10 overflow-y-auto scrollbar-hide">
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <label className="text-[11px] font-black uppercase text-slate-500 tracking-[0.2em] ml-1">Client Destinataire</label>
                    <div className="relative">
                      <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                      <input value={newCust} onChange={e => setNewCust(e.target.value)} placeholder="Nom complet..." className="w-full pl-14 pr-6 py-5 rounded-2xl border-2 border-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-white font-bold focus:border-purple-500 outline-none transition-all text-lg" />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <label className="text-[11px] font-black uppercase text-slate-500 tracking-[0.2em] ml-1">Règlement via</label>
                    <select value={newPaymentMethod} onChange={e => setNewPaymentMethod(e.target.value as PaymentMethod)} className="w-full px-6 py-5 bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl font-black uppercase text-xs tracking-widest outline-none focus:border-purple-500 appearance-none">
                      {PAYMENT_METHODS_LIST.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
                    </select>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <label className="text-[11px] font-black uppercase text-slate-500 tracking-[0.2em] ml-1 flex items-center"><Paperclip size={16} className="mr-2" /> Justificatifs & Pièces Jointes</label>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                     <label className="h-28 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2rem] flex flex-col items-center justify-center text-slate-400 hover:border-purple-500 hover:text-purple-600 hover:bg-purple-50/50 dark:hover:bg-purple-900/10 transition-all cursor-pointer group">
                        <Plus size={28} className="group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-black uppercase mt-1 tracking-widest">Ajouter</span>
                        <input type="file" multiple className="hidden" onChange={handleFileUpload} />
                     </label>
                     {attachments.map(file => (
                       <div key={file.id} className="relative h-28 bg-white dark:bg-slate-900 rounded-[2rem] border-2 border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center p-4 group hover:border-purple-300 transition-all">
                          <div className="p-3 bg-purple-50 dark:bg-purple-900/20 text-purple-600 rounded-xl mb-2">
                             <File size={20} />
                          </div>
                          <span className="text-[9px] font-bold text-slate-600 dark:text-slate-300 text-center truncate w-full">{file.name}</span>
                          <button onClick={() => removeAttachment(file.id)} className="absolute -top-2 -right-2 bg-rose-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-lg hover:bg-rose-600"><Trash size={12}/></button>
                       </div>
                     ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[11px] font-black uppercase text-slate-500 tracking-[0.2em] ml-1">Lignes de facturation</label>
                  <div className="relative">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20}/>
                    <input value={pSearch} onChange={e => setPSearch(e.target.value)} placeholder="Rechercher un plat dans le menu..." className="w-full pl-14 pr-6 py-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 dark:bg-slate-900 focus:border-purple-500 outline-none font-bold transition-all" />
                  </div>
                  {pSearch && (
                    <div className="border-2 border-slate-100 dark:border-slate-800 rounded-2xl max-h-56 overflow-y-auto shadow-xl divide-y divide-slate-50 dark:divide-slate-800">
                      {products.filter(p => p.name.toLowerCase().includes(pSearch.toLowerCase())).map(p => (
                        <button key={p.id} onClick={() => {setNewItems([...newItems, {product: p, qty: 1}]); setPSearch('');}} className="w-full p-5 flex justify-between items-center hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all">
                          <span className="font-bold text-sm">{p.name}</span>
                          <div className="flex items-center space-x-4">
                            <span className="font-black text-purple-600">{p.price.toLocaleString()} {config.currency}</span>
                            <Plus size={18} className="text-slate-300" />
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="w-[450px] bg-slate-50 dark:bg-slate-900/80 p-12 flex flex-col border-l border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between mb-8">
                  <h4 className="text-[11px] font-black uppercase text-slate-400 tracking-[0.3em]">Récapitulatif</h4>
                  <span className="text-[10px] font-black text-purple-600 bg-purple-50 dark:bg-purple-900/20 px-3 py-1 rounded-full uppercase">{newItems.length} articles</span>
                </div>
                <div className="flex-1 space-y-3 overflow-y-auto scrollbar-hide">
                  {newItems.map((item, i) => (
                    <div key={i} className="bg-white dark:bg-slate-950 p-4 rounded-2xl flex justify-between items-center shadow-sm border border-slate-100 dark:border-slate-800 group">
                      <div className="flex-1 mr-4">
                        <p className="text-xs font-black truncate text-slate-800 dark:text-slate-100">{item.product.name}</p>
                        <p className="text-[10px] font-bold text-slate-400">{(item.product.price * item.qty).toLocaleString()} {config.currency}</p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="bg-slate-50 dark:bg-slate-800 px-3 py-1 rounded-lg text-xs font-black">x{item.qty}</div>
                        <button onClick={() => setNewItems(newItems.filter((_, idx) => idx !== i))} className="text-slate-300 hover:text-rose-500 transition-colors p-1"><Trash size={16}/></button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-10 pt-10 border-t-2 border-slate-200 dark:border-slate-800 space-y-8">
                  <div className="flex justify-between items-end">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Montant Net</span>
                    <span className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white">
                      {newItems.reduce((a,b) => a+(b.product.price*b.qty), 0).toLocaleString()} 
                      <span className="text-sm font-bold text-purple-600 ml-2 uppercase tracking-normal">{config.currency}</span>
                    </span>
                  </div>
                  <button onClick={handleSaveDocument} className={`w-full py-5 rounded-[2rem] font-black uppercase text-[11px] tracking-[0.2em] text-white shadow-2xl transition-all active:scale-95 ${creationType === 'refund' ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-900/20' : 'bg-purple-600 hover:bg-purple-700 shadow-purple-900/20'}`}>Générer le document</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Facturation</h1>
          <p className="text-sm text-slate-500 font-medium">Flux financier et archivage légal</p>
        </div>
        <div className="flex items-center space-x-3">
          <button onClick={handleExportExcel} className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-all shadow-sm flex items-center"><Download size={18} className="mr-2" /> Export</button>
          {canManageDoc && (
            <div className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-[1.25rem] border border-slate-200 dark:border-slate-700">
              <button onClick={() => handleOpenCreation('refund')} className="bg-white dark:bg-slate-900 text-rose-600 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-50 transition-all shadow-sm">Nouvel Avoir</button>
              <button onClick={() => handleOpenCreation('invoice')} className="bg-purple-600 text-white px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-purple-900/20 hover:bg-purple-700 transition-all flex items-center"><Plus size={16} className="mr-2" /> Nouvelle Facture</button>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-950 rounded-[2.5rem] border-2 border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex-1">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
           <div className="relative w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Chercher un document (Réf, Client)..." className="w-full pl-12 pr-6 py-3 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-2xl text-[11px] font-bold outline-none focus:border-purple-500 transition-all" />
           </div>
           <div className="flex items-center space-x-2">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest mr-2">Filtre Statut:</span>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-xl px-4 py-2 text-[10px] font-black uppercase outline-none focus:border-purple-500">
                <option value="all">Tous les documents</option>
                <option value="posted">Factures validées</option>
                <option value="refunded">Avoirs / Retours</option>
              </select>
           </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50 dark:border-slate-800">
                <th className="px-10 py-6">Référence</th>
                <th className="px-10 py-6">Client / Entité</th>
                <th className="px-10 py-6 text-right">Montant</th>
                <th className="px-10 py-6 text-center">Statut</th>
                <th className="px-10 py-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {filteredInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-all group">
                  <td className="px-10 py-6 font-black text-purple-600 font-mono tracking-tighter">#{inv.id.slice(-8)}</td>
                  <td className="px-10 py-6">
                    <div className="flex flex-col">
                      <span className="font-black text-sm text-slate-800 dark:text-slate-100 uppercase">{inv.customer}</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">{inv.date}</span>
                      <span className="text-[8px] font-black uppercase text-slate-400">{inv.paymentMethod}</span>
                    </div>
                  </td>
                  <td className="px-10 py-6 text-right">
                    <span className={`text-base font-black ${inv.invoiceStatus === 'refunded' ? 'text-rose-600' : 'text-slate-900 dark:text-white'}`}>
                      {inv.invoiceStatus === 'refunded' ? '-' : ''}{inv.total.toLocaleString()} {config.currency}
                    </span>
                  </td>
                  <td className="px-10 py-6 text-center">
                    <span className={`inline-flex items-center px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                      inv.invoiceStatus === 'refunded' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                    }`}>
                      {inv.invoiceStatus === 'refunded' ? 'Avoir' : 'Facturé'}
                    </span>
                  </td>
                  <td className="px-10 py-6 text-right">
                    <div className="flex items-center justify-end space-x-3 opacity-0 group-hover:opacity-100 transition-all">
                      {inv.attachments && inv.attachments.length > 0 && <Paperclip size={18} className="text-purple-600" />}
                      <button onClick={() => setSelectedInvoice(inv)} className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-purple-600 rounded-2xl shadow-sm hover:shadow-md transition-all"><Eye size={20} /></button>
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

const InvoiceModal = ({ sale, config, onClose }: { sale: SaleOrder, config: ERPConfig, onClose: () => void }) => {
  const isRefund = sale.invoiceStatus === 'refunded';
  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[100] flex items-center justify-center p-4 sm:p-10 animate-fadeIn">
      <div className="bg-white w-full max-w-3xl rounded-[2rem] shadow-2xl overflow-hidden animate-scaleIn flex flex-col max-h-full border border-white/20">
        <div className="px-8 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/80 backdrop-blur-md no-print sticky top-0 z-10">
          <div className="flex items-center space-x-3">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Document {isRefund ? 'Avoir' : 'Facture'}</span>
            <span className="px-2.5 py-1 bg-purple-600 text-white text-[9px] font-black rounded-lg uppercase tracking-widest shadow-lg">#{sale.id.slice(-8)}</span>
          </div>
          <div className="flex items-center space-x-3">
            <button onClick={() => window.print()} className="bg-slate-900 text-white px-5 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center shadow-xl hover:bg-black transition-all"><Printer size={16} className="mr-2" /> Imprimer</button>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-rose-500 transition-all"><X size={24} /></button>
          </div>
        </div>

        <div id="invoice-print-area" className="p-10 sm:p-12 overflow-y-auto bg-white flex-1 text-slate-950 scrollbar-hide relative">
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] pointer-events-none select-none">
            <span className="text-[8rem] font-black uppercase -rotate-45 tracking-[1rem]">{isRefund ? 'RETOUR' : 'PAYÉ'}</span>
          </div>

          <div className="relative z-10">
            <div className="flex justify-between items-start mb-16">
              <div className="space-y-4">
                <AppLogoDoc className="w-16 h-16" />
                <div>
                  <h1 className="text-2xl font-black uppercase tracking-tighter leading-none mb-1">{config.companyName}</h1>
                  <p className="text-[9px] font-black text-purple-600 uppercase tracking-[0.3em]">{config.companySlogan}</p>
                </div>
              </div>
              <div className="text-right">
                <h2 className="text-3xl font-black uppercase tracking-tighter text-slate-900 mb-1">{isRefund ? 'Avoir' : 'Facture'}</h2>
                <p className="text-lg font-mono font-black text-purple-600 tracking-tighter">REF-{sale.id.slice(-8)}</p>
                <div className="mt-4 flex flex-col items-end space-y-0.5">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Émise le</span>
                  <p className="text-xs font-black">{sale.date}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-10 mb-12">
              <div className="space-y-2">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 pb-1">Destinataire</p>
                <h3 className="text-xl font-black uppercase tracking-tighter">{sale.customer}</h3>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center"><User size={12} className="mr-2" /> Particulier</p>
              </div>
              <div className="space-y-2 text-right">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 pb-1">Règlement</p>
                <div className="space-y-1">
                  <p className="text-xs font-black uppercase tracking-widest flex items-center justify-end"><CreditCard size={14} className="mr-1.5 text-purple-600" /> {sale.paymentMethod || 'Espèces'}</p>
                  <p className="text-[9px] font-bold text-slate-500">Service : {sale.orderLocation || 'Comptoir'}</p>
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
                    <th className="px-6 py-4 text-right text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">Total TTC</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sale.items?.map((item, idx) => (
                    <tr key={idx} className="group hover:bg-slate-50/50 transition-colors">
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

            <div className="flex flex-col md:flex-row justify-between items-start gap-10 mb-16">
               <div className="flex-1 space-y-6">
                  {sale.attachments && sale.attachments.length > 0 && (
                    <div className="no-print space-y-3">
                      <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center"><Paperclip size={12} className="mr-2" /> Documents supports</h4>
                      <div className="grid grid-cols-2 gap-3">
                        {sale.attachments.map(att => (
                          <a key={att.id} href={att.url} target="_blank" rel="noopener noreferrer" className="flex items-center p-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-purple-300 transition-all group">
                            <div className="p-1.5 bg-white rounded-lg text-purple-600 mr-3 shadow-sm group-hover:bg-purple-600 group-hover:text-white transition-all"><File size={12} /></div>
                            <span className="text-[10px] font-black truncate uppercase tracking-widest">{att.name}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Conformité</p>
                    <div className="grid grid-cols-2 gap-3 text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                       <div>RC: {config.registrationNumber}</div>
                       <div>Vente: Comptoir</div>
                    </div>
                  </div>
               </div>
               
               <div className="w-full md:w-[280px]">
                  <div className="bg-slate-950 text-white p-8 rounded-[2rem] shadow-2xl flex flex-col items-center relative overflow-hidden group">
                    <p className="text-[9px] font-black uppercase tracking-[0.4em] mb-4 opacity-40">TOTAL À RÉGLER</p>
                    <div className="flex items-baseline relative z-10">
                      <span className="text-4xl font-black font-mono tracking-tighter leading-none">{sale.total.toLocaleString()}</span>
                      <span className="text-sm font-bold ml-2 text-purple-500 uppercase">{config.currency}</span>
                    </div>
                    <div className="mt-6 flex items-center space-x-1.5 text-[9px] font-black uppercase tracking-widest bg-white/10 px-3 py-1.5 rounded-full text-emerald-400">
                       <CheckCircle2 size={12} />
                       <span>Payé via {sale.paymentMethod}</span>
                    </div>
                  </div>
               </div>
            </div>

            <div className="pt-12 border-t border-dashed border-slate-200 flex flex-col md:flex-row justify-between items-center gap-10 text-center md:text-left">
               <div className="flex items-center space-x-4">
                  <QrCode size={60} className="text-slate-900" />
                  <div className="space-y-0.5">
                    <p className="text-[9px] font-black uppercase tracking-widest">Vérification numérique</p>
                    <p className="text-[8px] font-bold text-slate-400 uppercase leading-relaxed max-w-[150px]">Authentifiez ce document via notre portail sécurisé.</p>
                  </div>
               </div>
               <div className="space-y-4 text-center">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Cachet & Signature</p>
                  <div className="w-40 h-px bg-slate-900 mx-auto"></div>
                  <p className="text-[8px] font-bold text-slate-300 uppercase italic">MYA D'OR FAST-FOOD</p>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Invoicing;
