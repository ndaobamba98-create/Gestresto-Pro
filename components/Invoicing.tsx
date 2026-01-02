import React, { useState, useMemo } from 'react';
import { SaleOrder, ERPConfig, Product, ViewType, Attachment, PaymentMethod } from '../types';
import { 
  FileText, Search, Plus, Download, Eye, Printer, X, RotateCcw, Calendar, MapPin, Phone, Trash, QrCode, User, CreditCard, Paperclip, File, Save, CheckCircle2, ShoppingCart, Smartphone, Banknote, Wallet, FileSpreadsheet, Mail, CheckSquare, Square, FileDown, MoreHorizontal
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
  t: (key: any) => string;
}

const Invoicing: React.FC<Props> = ({ sales, config, onUpdate, products, userRole, onAddSale, notify, userPermissions, t }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<SaleOrder | null>(null);

  const invoices = useMemo(() => sales.map(s => ({ ...s, invoiceStatus: s.invoiceStatus || 'posted' })), [sales]);
  
  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => 
      inv.customer.toLowerCase().includes(searchTerm.toLowerCase()) || 
      inv.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [invoices, searchTerm]);

  const toggleSelectAll = () => {
    if (selectedInvoices.length === filteredInvoices.length) {
      setSelectedInvoices([]);
    } else {
      setSelectedInvoices(filteredInvoices.map(i => i.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedInvoices(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleExportGlobalExcel = () => {
    const data = filteredInvoices.map(inv => ({
      'Référence': inv.id,
      'Date': inv.date,
      'Client': inv.customer,
      'Montant HT': (inv.total / (1 + config.taxRate/100)).toFixed(2),
      'TVA': (inv.total - (inv.total / (1 + config.taxRate/100))).toFixed(2),
      'Total TTC': inv.total,
      'Devise': config.currency,
      'Mode de Paiement': inv.paymentMethod || 'Espèces',
      'Statut': inv.invoiceStatus === 'refunded' ? 'AVOIR' : 'FACTURE'
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Journal Facturation");
    XLSX.writeFile(workbook, `Journal_Factures_${config.companyName.replace(/\s+/g, '_')}_${Date.now()}.xlsx`);
    notify("Succès", "Journal global exporté avec succès.", "success");
  };

  const handleExportBatchExcel = () => {
    const selectedData = invoices.filter(inv => selectedInvoices.includes(inv.id)).map(inv => ({
      'Référence': inv.id,
      'Date': inv.date,
      'Client': inv.customer,
      'Montant TTC': inv.total,
      'Paiement': inv.paymentMethod
    }));

    const worksheet = XLSX.utils.json_to_sheet(selectedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Selection");
    XLSX.writeFile(workbook, `Export_Selection_${selectedInvoices.length}_Factures.xlsx`);
    notify("Export", `${selectedInvoices.length} factures exportées.`, "info");
    setSelectedInvoices([]);
  };

  return (
    <div className="h-full flex flex-col space-y-8 animate-fadeIn pb-10 pr-2">
      {selectedInvoice && (
        <InvoiceModal sale={selectedInvoice} config={config} onClose={() => setSelectedInvoice(null)} notify={notify} />
      )}

      {/* BARRE D'ACTIONS FLOTTANTE (ODOO STYLE) */}
      {selectedInvoices.length > 0 && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-8 py-4 rounded-[2rem] shadow-2xl z-[150] flex items-center space-x-8 animate-slideUp">
           <div className="flex items-center space-x-3 border-r border-slate-700 pr-8">
              <span className="bg-purple-600 w-8 h-8 rounded-full flex items-center justify-center font-black text-xs">{selectedInvoices.length}</span>
              <span className="text-xs font-black uppercase tracking-widest">Documents sélectionnés</span>
           </div>
           <div className="flex items-center space-x-4">
              <button onClick={handleExportBatchExcel} className="flex items-center text-[10px] font-black uppercase tracking-widest hover:text-purple-400 transition-colors">
                <FileSpreadsheet size={18} className="mr-2 text-emerald-500" /> Export Excel
              </button>
              <button onClick={() => window.print()} className="flex items-center text-[10px] font-black uppercase tracking-widest hover:text-purple-400 transition-colors">
                <Printer size={18} className="mr-2 text-blue-400" /> Impression
              </button>
              <div className="h-4 w-px bg-slate-700"></div>
              <button onClick={() => setSelectedInvoices([])} className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-rose-500">Annuler</button>
           </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Facturation</h1>
          <p className="text-sm text-slate-500 font-medium">Sortir et archiver vos documents comptables</p>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={handleExportGlobalExcel}
            className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-all shadow-sm flex items-center"
          >
            <Download size={18} className="mr-2 text-purple-600" /> Export Global Excel
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-950 rounded-[2.5rem] border-2 border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex-1 relative">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
           <div className="flex items-center space-x-4">
              <button 
                onClick={toggleSelectAll}
                className="p-2 text-slate-400 hover:text-purple-600 transition-colors"
              >
                {selectedInvoices.length === filteredInvoices.length && filteredInvoices.length > 0 ? <CheckSquare size={20} className="text-purple-600" /> : <Square size={20} />}
              </button>
              <div className="relative w-96">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Chercher une facture (N°, Client...)" className="w-full pl-12 pr-6 py-3 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-2xl text-[11px] font-bold outline-none focus:border-purple-500" />
              </div>
           </div>
           <div className="flex items-center space-x-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <FileText size={14} />
              <span>{filteredInvoices.length} Documents au total</span>
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b bg-slate-50/20">
                <th className="px-6 py-6 w-10"></th>
                <th className="px-10 py-6">Référence</th>
                <th className="px-10 py-6">Date d'émission</th>
                <th className="px-10 py-6">Client / Entité</th>
                <th className="px-10 py-6 text-right">Montant TTC</th>
                <th className="px-10 py-6 text-center">État</th>
                <th className="px-10 py-6 text-right">Ouvrir</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {filteredInvoices.map((inv) => (
                <tr key={inv.id} className={`hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-all group ${selectedInvoices.includes(inv.id) ? 'bg-purple-50/50 dark:bg-purple-900/10' : ''}`}>
                  <td className="px-6 py-6">
                    <button onClick={() => toggleSelect(inv.id)} className={`transition-colors ${selectedInvoices.includes(inv.id) ? 'text-purple-600' : 'text-slate-200 dark:text-slate-700 hover:text-slate-400'}`}>
                       {selectedInvoices.includes(inv.id) ? <CheckSquare size={18} /> : <Square size={18} />}
                    </button>
                  </td>
                  <td className="px-10 py-6 font-black text-purple-600 font-mono text-xs">#{inv.id.slice(-8)}</td>
                  <td className="px-10 py-6 text-xs font-bold text-slate-500">{inv.date.split(',')[0]}</td>
                  <td className="px-10 py-6 font-black uppercase text-xs truncate max-w-[200px]">{inv.customer}</td>
                  <td className="px-10 py-6 text-right font-black text-sm">{inv.total.toLocaleString()} {config.currency}</td>
                  <td className="px-10 py-6 text-center">
                    <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest inline-flex items-center ${
                      inv.invoiceStatus === 'refunded' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {inv.invoiceStatus === 'refunded' ? <RotateCcw size={10} className="mr-1.5" /> : <CheckCircle2 size={10} className="mr-1.5" />}
                      {inv.invoiceStatus === 'refunded' ? 'Avoir' : 'Facturé'}
                    </span>
                  </td>
                  <td className="px-10 py-6 text-right">
                    <button onClick={() => setSelectedInvoice(inv)} className="p-3 bg-white dark:bg-slate-800 border rounded-2xl text-slate-400 hover:text-purple-600 hover:border-purple-500 transition-all shadow-sm"><Eye size={20} /></button>
                  </td>
                </tr>
              ))}
              {filteredInvoices.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-20 text-center opacity-30">
                    <FileText size={48} className="mx-auto mb-4" />
                    <p className="font-black uppercase text-sm tracking-widest">Aucune facture trouvée</p>
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

const InvoiceModal = ({ sale, config, onClose, notify }: { sale: SaleOrder, config: ERPConfig, onClose: () => void, notify: any }) => {
  const isRefund = sale.invoiceStatus === 'refunded';

  const handleExportSingleExcel = () => {
    const header = [
      [config.companyName.toUpperCase()],
      [config.showSloganOnInvoice ? config.companySlogan : ""],
      [`Siège: ${config.showAddressOnInvoice ? config.address : ""}`],
      [`Contact: ${config.showPhoneOnInvoice ? config.phone : ""} | ${config.showEmailOnInvoice ? config.email : ""}`],
      [`Matricule Fiscal: ${config.showRegNumberOnInvoice ? config.registrationNumber : ""}`],
      [""],
      [isRefund ? "AVOIR FINANCIER" : "FACTURE COMMERCIALE"],
      ["Référence", sale.id],
      ["Client", sale.customer],
      ["Date de facturation", sale.date],
      ["Mode de Règlement", sale.paymentMethod || "Espèces"],
      [""],
      ["DESIGNATION", "PU TTC", "QTE", "MONTANT TTC"]
    ];

    const rows = (sale.items || []).map(item => [
      item.name.toUpperCase(),
      item.price,
      item.quantity,
      item.price * item.quantity
    ]);

    const footer = [
      [""],
      ["", "", "TOTAL NET A PAYER", `${sale.total} ${config.currency}`],
      [""],
      [`Certifié conforme par Sama Pos + Cloud - Le ${new Date().toLocaleString()}`]
    ];

    const worksheet = XLSX.utils.aoa_to_sheet([...header, ...rows, ...footer]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Facturation Detail");
    
    worksheet['!cols'] = [{ wch: 40 }, { wch: 15 }, { wch: 12 }, { wch: 15 }];

    XLSX.writeFile(workbook, `Facture_${sale.id.slice(-6)}.xlsx`);
    notify("Export XLSX", "Le détail financier a été exporté avec les coordonnées entreprise.", "success");
  };

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[200] flex items-center justify-center p-4 sm:p-10 animate-fadeIn">
      <div className="bg-white w-full max-w-4xl rounded-[2rem] shadow-2xl overflow-hidden animate-scaleIn flex flex-col max-h-full border border-white/20">
        <div className="px-8 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/80 backdrop-blur-md no-print sticky top-0 z-10">
          <div className="flex items-center space-x-3">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Document {isRefund ? 'Avoir' : 'Facture'}</span>
            <span className="px-2.5 py-1 bg-purple-600 text-white text-[9px] font-black rounded-lg uppercase tracking-widest shadow-lg">#{sale.id.slice(-8)}</span>
          </div>
          <div className="flex items-center space-x-2">
            <button onClick={handleExportSingleExcel} className="bg-white border-2 border-slate-100 px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center hover:bg-slate-50 transition-all"><FileSpreadsheet size={16} className="mr-2 text-emerald-600" /> Excel</button>
            <button onClick={() => window.print()} className="bg-slate-900 text-white px-5 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center shadow-xl hover:bg-black transition-all"><Printer size={16} className="mr-2" /> PDF / Imprimer</button>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-rose-500 transition-all"><X size={24} /></button>
          </div>
        </div>

        <div id="invoice-print-area" className="p-10 sm:p-16 overflow-y-auto bg-white flex-1 text-slate-950 scrollbar-hide relative">
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] pointer-events-none select-none">
            <span className="text-[8rem] font-black uppercase -rotate-45 tracking-[1rem]">{isRefund ? 'RETOUR' : 'PAYÉ'}</span>
          </div>

          <div className="relative z-10">
            {/* EN-TÊTE PROFESSIONNEL AVEC COORDONNÉES COMPLETES */}
            <div className="flex justify-between items-start mb-12 pb-12 border-b border-slate-100">
              <div className="space-y-6">
                {config.showLogoOnInvoice && <AppLogoDoc className="w-24 h-24" />}
                <div className="space-y-1">
                  <h1 className="text-3xl font-black uppercase tracking-tighter leading-none">{config.companyName}</h1>
                  {config.showSloganOnInvoice && <p className="text-[10px] font-black text-purple-600 uppercase tracking-[0.3em] mb-4">{config.companySlogan}</p>}
                  <div className="space-y-1 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                    {config.showAddressOnInvoice && <p className="flex items-center"><MapPin size={12} className="mr-2 text-slate-300" /> {config.address}</p>}
                    {config.showPhoneOnInvoice && <p className="flex items-center"><Phone size={12} className="mr-2 text-slate-300" /> {config.phone}</p>}
                    {config.showEmailOnInvoice && <p className="flex items-center"><Mail size={12} className="mr-2 text-slate-300" /> {config.email}</p>}
                    {config.showRegNumberOnInvoice && <p className="flex items-center mt-3 pt-3 border-t border-slate-50 font-black text-slate-900 text-xs">RC/NIF: {config.registrationNumber}</p>}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <h2 className="text-4xl font-black uppercase tracking-tighter text-slate-900 mb-2">{isRefund ? 'Avoir' : 'Facture'}</h2>
                <p className="text-xl font-mono font-black text-purple-600 tracking-tighter">REF-{sale.id.slice(-8)}</p>
                <div className="mt-8 flex flex-col items-end space-y-1">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Émise le</span>
                  <p className="text-xs font-black bg-slate-900 text-white px-4 py-1.5 rounded-xl">{sale.date}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-10 mb-12">
              <div className="space-y-2 p-8 bg-slate-50 rounded-[2rem] border border-slate-100">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Destinataire / Client</p>
                <h3 className="text-2xl font-black uppercase tracking-tighter">{sale.customer}</h3>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center mt-2 pt-2 border-t border-slate-200/50"><User size={12} className="mr-2" /> Client Particulier</p>
              </div>
              <div className="space-y-2 text-right p-8">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Détails financiers</p>
                <div className="space-y-3">
                  <p className="text-base font-black uppercase tracking-widest flex items-center justify-end text-purple-600">
                    <CreditCard size={18} className="mr-2" /> {sale.paymentMethod || 'Espèces'}
                  </p>
                  <div className="text-[10px] font-bold text-slate-500 uppercase space-y-1">
                    <p>Point de vente : {sale.orderLocation || 'Comptoir Pro'}</p>
                    <p className="text-emerald-600 font-black">Statut de paiement : ACQUITTÉ</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-slate-200 overflow-hidden mb-12 shadow-sm">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-900 text-white">
                    <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em]">Désignation</th>
                    <th className="px-10 py-6 text-center text-[10px] font-black uppercase tracking-[0.2em]">Qté</th>
                    <th className="px-10 py-6 text-right text-[10px] font-black uppercase tracking-[0.2em]">Prix Unitaire</th>
                    <th className="px-10 py-6 text-right text-[10px] font-black uppercase tracking-[0.2em]">Total TTC</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sale.items?.map((item, idx) => (
                    <tr key={idx} className="group hover:bg-slate-50 transition-colors">
                      <td className="px-10 py-6 font-black uppercase text-xs text-slate-900">{item.name}</td>
                      <td className="px-10 py-6 text-center">
                        <span className="bg-slate-100 px-4 py-1.5 rounded-xl font-black text-xs">{item.quantity}</span>
                      </td>
                      <td className="px-10 py-6 text-right font-bold text-xs">{item.price.toLocaleString()}</td>
                      <td className="px-10 py-6 text-right font-black text-xs tracking-tighter">{(item.quantity * item.price).toLocaleString()} {config.currency}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-start gap-10 mb-16">
               <div className="flex-1 space-y-6">
                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b pb-1">Mentions Légales</p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase leading-relaxed">
                      {config.receiptFooter || "Merci de votre fidélité ! Toute réclamation doit être accompagnée de ce document."}
                    </p>
                  </div>
               </div>
               
               <div className="w-full md:w-[350px]">
                  <div className="bg-slate-950 text-white p-10 rounded-[2.5rem] shadow-2xl flex flex-col items-center relative overflow-hidden group">
                    <p className="text-[11px] font-black uppercase tracking-[0.4em] mb-5 opacity-40">TOTAL NET À RÉGLER</p>
                    <div className="flex items-baseline relative z-10">
                      <span className="text-6xl font-black font-mono tracking-tighter leading-none">{sale.total.toLocaleString()}</span>
                      <span className="text-lg font-bold ml-2 text-purple-500 uppercase">{config.currency}</span>
                    </div>
                    <div className="mt-8 flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-2xl text-emerald-400 shadow-inner">
                       <CheckCircle2 size={14} />
                       <span>Document Payé intégralement</span>
                    </div>
                  </div>
               </div>
            </div>

            <div className="pt-16 border-t border-dashed border-slate-200 flex flex-col md:flex-row justify-between items-center gap-10 text-center md:text-left">
               <div className="flex items-center space-x-6">
                  {config.showQrCodeOnInvoice && (
                    <div className="p-4 bg-slate-50 rounded-3xl border border-slate-100 shadow-inner">
                      <QrCode size={80} className="text-slate-900" />
                    </div>
                  )}
                  <div className="space-y-1">
                    <p className="text-[11px] font-black uppercase tracking-widest text-slate-900">Archivage Numérique</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase leading-relaxed max-w-[220px]">Ce document est certifié par Sama Pos +. Intégrité des données garantie via Blockchain Hash.</p>
                  </div>
               </div>
               <div className="space-y-6 text-center">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Le Gérant (Cachet & Signature)</p>
                  <div className="w-56 h-px bg-slate-900 mx-auto"></div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 italic">Fait à Nouakchott, le {new Date().toLocaleDateString()}</p>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Invoicing;