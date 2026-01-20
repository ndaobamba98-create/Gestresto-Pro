
import React, { useState, useMemo } from 'react';
import { SaleOrder, ERPConfig, Product, ViewType, Attachment, PaymentMethod } from '../types';
import { 
  FileText, Search, Plus, Download, Eye, Printer, X, RotateCcw, Calendar, MapPin, Phone, Trash, QrCode, User, CreditCard, Paperclip, File, Save, CheckCircle2, ShoppingCart, Smartphone, Banknote, Wallet, FileSpreadsheet, Mail, CheckSquare, Square, FileDown, ArrowLeft, ChevronRight, BadgeCheck, Receipt, Hash, UserCircle2, Coins
} from 'lucide-react';
import * as XLSX from 'xlsx';

export const AppLogoDoc = ({ className = "w-16 h-16", customLogo = undefined }) => (
  <div className={`${className} flex items-center justify-center overflow-hidden rounded-xl`}>
    {customLogo ? (
      <img src={customLogo} alt="Logo" className="w-full h-full object-cover" />
    ) : (
      <div style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#0f172a',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '2px solid #1e293b'
      }}>
        <svg viewBox="0 0 100 100" style={{ width: '80%', height: '80%' }} fill="none" xmlns="http://www.w3.org/2000/svg">
          <text x="50%" y="55%" dominantBaseline="central" textAnchor="middle" fill="white" fontSize="38" fontWeight="900" letterSpacing="-2">
            TP+
          </text>
          <circle cx="20" cy="20" r="10" fill="#a855f7" opacity="0.8" />
        </svg>
      </div>
    )}
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
  const [viewedInvoice, setViewedInvoice] = useState<SaleOrder | null>(null);

  const invoices = useMemo(() => sales.map(s => ({ ...s, invoiceStatus: s.invoiceStatus || 'posted' })), [sales]);
  
  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => 
      inv.customer.toLowerCase().includes(searchTerm.toLowerCase()) || 
      inv.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [invoices, searchTerm]);

  const handleExportGlobalExcel = () => {
    const data = filteredInvoices.map(inv => ({
      'Référence': inv.id,
      'Date': new Date(inv.date).toLocaleDateString('fr-FR'),
      'Client': inv.customer,
      'Total TTC': inv.total,
      'Mode de Paiement': inv.paymentMethod || 'Espèces',
      'Statut': inv.invoiceStatus === 'refunded' ? 'AVOIR' : 'FACTURE'
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Journal");
    XLSX.writeFile(workbook, `Journal_Factures_${Date.now()}.xlsx`);
  };

  if (viewedInvoice) {
    return (
      <InvoiceSinglePageView 
        sale={viewedInvoice} 
        config={config} 
        onBack={() => setViewedInvoice(null)} 
        notify={notify} 
      />
    );
  }

  return (
    <div className="h-full flex flex-col space-y-8 animate-fadeIn pb-10 pr-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center space-x-5">
           <div className="p-4 bg-purple-600 text-white rounded-3xl shadow-xl shadow-purple-900/20"><Receipt size={32} /></div>
           <div>
              <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">Facturation</h1>
              <p className="text-sm text-slate-500 font-medium mt-1">Audit et gestion des pièces comptables</p>
           </div>
        </div>
        <button onClick={handleExportGlobalExcel} className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 px-6 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all shadow-sm flex items-center group">
          <FileSpreadsheet size={18} className="mr-3 text-emerald-600 group-hover:scale-110 transition-transform" /> Export Master Excel
        </button>
      </div>

      <div className="bg-white dark:bg-slate-950 rounded-[3rem] border-2 border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex-1 flex flex-col">
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-50/50 dark:bg-slate-900/30">
           <div className="relative w-full max-w-xl">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Rechercher par numéro, client ou montant..." className="w-full pl-14 pr-8 py-4 bg-white dark:bg-slate-800 border-2 border-transparent focus:border-purple-500 rounded-2xl text-xs font-bold outline-none shadow-sm transition-all" />
           </div>
           <div className="flex items-center space-x-3 px-6 py-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{filteredInvoices.length} Documents enregistrés</span>
           </div>
        </div>

        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b bg-slate-50/20">
                <th className="px-10 py-6">Document</th>
                <th className="px-10 py-6">Date d'émission</th>
                <th className="px-10 py-6">Client / Bénéficiaire</th>
                <th className="px-10 py-6 text-right">Montant TTC</th>
                <th className="px-10 py-6 text-center">Statut Fiscal</th>
                <th className="px-10 py-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {filteredInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/50 transition-all group">
                  <td className="px-10 py-6">
                    <div className="flex items-center space-x-3">
                       <div className={`p-2 rounded-lg ${inv.invoiceStatus === 'refunded' ? 'bg-rose-50 text-rose-500' : 'bg-purple-50 text-purple-600'}`}>
                          <FileText size={18} />
                       </div>
                       <span className="font-black text-slate-900 dark:text-white font-mono text-xs uppercase tracking-tighter">#{inv.id.slice(-8)}</span>
                    </div>
                  </td>
                  <td className="px-10 py-6">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{new Date(inv.date).toLocaleDateString('fr-FR', {day:'2-digit', month:'long', year:'numeric'})}</span>
                      <span className="text-[9px] font-black text-slate-400 uppercase mt-0.5">{new Date(inv.date).toLocaleTimeString('fr-FR', {hour:'2-digit', minute:'2-digit'})}</span>
                    </div>
                  </td>
                  <td className="px-10 py-6">
                    <div className="flex items-center space-x-3">
                       <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-400">{inv.customer.charAt(0)}</div>
                       <span className="font-black uppercase text-xs text-slate-800 dark:text-slate-100 tracking-tight">{inv.customer}</span>
                    </div>
                  </td>
                  <td className="px-10 py-6 text-right">
                    <div className="flex flex-col items-end">
                      <span className="font-black text-sm text-slate-900 dark:text-white">{inv.total.toLocaleString()} {config.currency}</span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase">{inv.paymentMethod || 'Espèces'}</span>
                    </div>
                  </td>
                  <td className="px-10 py-6 text-center">
                    <span className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border-2 ${inv.invoiceStatus === 'refunded' ? 'bg-rose-50 border-rose-100 text-rose-600' : 'bg-emerald-50 border-emerald-100 text-emerald-600'}`}>
                      {inv.invoiceStatus === 'refunded' ? 'Avoir / Retour' : 'Validé & Payé'}
                    </span>
                  </td>
                  <td className="px-10 py-6 text-right">
                    <button onClick={() => setViewedInvoice(inv)} className="p-3 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl text-slate-400 hover:text-purple-600 hover:border-purple-200 transition-all shadow-sm group-hover:scale-110" title="Consulter le document">
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

const InvoiceSinglePageView = ({ sale, config, onBack, notify }: { sale: SaleOrder, config: ERPConfig, onBack: () => void, notify: any }) => {
  const isRefund = sale.invoiceStatus === 'refunded';

  const handleDownloadPDF = () => {
    const element = document.getElementById('invoice-print-area');
    if (!element) return;

    const opt = {
      margin: 0,
      filename: `Facture_${sale.id.slice(-8)}.pdf`,
      image: { type: 'jpeg', quality: 1.0 },
      html2canvas: { 
        scale: 3, // Haute résolution
        useCORS: true, 
        letterRendering: true,
        backgroundColor: '#ffffff',
      },
      jsPDF: { unit: 'mm', format: 'a5', orientation: 'portrait' }
    };

    // @ts-ignore
    window.html2pdf().set(opt).from(element).save().then(() => {
       notify("Document exporté", "Le PDF A5 est prêt.", "success");
    });
  };

  return (
    <div className="h-full flex flex-col space-y-6 animate-fadeIn pb-10">
      <div className="flex items-center justify-between no-print bg-white dark:bg-slate-900 p-5 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center space-x-5">
          <button onClick={onBack} className="p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl hover:bg-slate-200 transition-all text-slate-600 dark:text-slate-400">
            <ArrowLeft size={22} />
          </button>
          <div>
            <div className="flex items-center space-x-2">
               <h2 className="text-xl font-black uppercase tracking-tighter">{isRefund ? 'Note d\'Avoir' : 'Facture Client'}</h2>
               <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${isRefund ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>{isRefund ? 'Retourné' : 'Validé'}</span>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase mt-0.5 tracking-widest flex items-center"><Hash size={10} className="mr-1"/> Réf: {sale.id}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button onClick={handleDownloadPDF} className="bg-emerald-600 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-900/20 hover:bg-emerald-700 transition-all flex items-center">
            <FileDown size={20} className="mr-3" /> Exporter PDF A5
          </button>
          <button onClick={() => window.print()} className="bg-slate-900 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-black transition-all flex items-center">
            <Printer size={20} className="mr-3" /> Impression Directe
          </button>
        </div>
      </div>

      <div className="flex-1 flex justify-center overflow-y-auto scrollbar-hide py-4">
        {/* LE CONTENEUR A5 RÉEL (148mm x 210mm) */}
        <div 
          id="invoice-print-area" 
          className="bg-white text-slate-950 shadow-2xl relative flex flex-col print:shadow-none font-sans"
          style={{ 
            width: '148mm', 
            height: '210mm', 
            minWidth: '148mm', 
            minHeight: '210mm',
            padding: '10mm',
            boxSizing: 'border-box',
            backgroundColor: '#ffffff'
          }}
        >
          {/* BANDEAU D'ÉTAT SUPÉRIEUR */}
          <div className={`absolute top-0 left-0 right-0 h-1.5 ${isRefund ? 'bg-rose-600' : 'bg-emerald-600'}`}></div>

          <div className="relative z-10 flex flex-col h-full">
            
            {/* EN-TÊTE COMPAGNIE */}
            <div className="flex justify-between items-start border-b border-slate-200 pb-4 mb-4">
              <div className="flex items-start space-x-4">
                {config.showLogoOnInvoice && <AppLogoDoc className="w-12 h-12" customLogo={config.companyLogo} />}
                <div className="space-y-0.5">
                  <h1 className="text-md font-black uppercase leading-none text-slate-900">{config.companyName}</h1>
                  {config.showSloganOnInvoice && <p className="text-[7.5px] font-black text-purple-600 uppercase tracking-widest opacity-80">{config.companySlogan}</p>}
                  <div className="pt-2 space-y-0.5">
                    {config.showAddressOnInvoice && <div className="flex items-start text-[6.5px] font-bold text-slate-500 uppercase max-w-[150px]"><MapPin size={7} className="mr-1 mt-0.5 shrink-0"/> {config.address}</div>}
                    {config.showPhoneOnInvoice && <div className="flex items-center text-[6.5px] font-bold text-slate-500"><Phone size={7} className="mr-1 shrink-0"/> {config.phone}</div>}
                    {config.showRegNumberOnInvoice && <div className="text-[6.5px] font-black text-slate-900 uppercase mt-1 bg-slate-100 px-1.5 py-0.5 rounded inline-block">NIF: {config.registrationNumber}</div>}
                  </div>
                </div>
              </div>
              
              <div className="text-right flex flex-col items-end">
                <h2 className="text-lg font-black uppercase tracking-tight text-slate-900 mb-1">{isRefund ? 'Avoir' : 'Facture'}</h2>
                <p className="text-[9px] font-mono font-black text-slate-900 uppercase tracking-tighter">#{sale.id.slice(-8)}</p>
                <div className="mt-4 text-right">
                   <p className="text-[6px] font-black text-slate-400 uppercase tracking-widest">Date Émission</p>
                   <p className="text-[8px] font-black text-slate-900 uppercase">{new Date(sale.date).toLocaleDateString('fr-FR')}</p>
                </div>
              </div>
            </div>

            {/* SECTION CLIENTS */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex flex-col justify-between">
                <div>
                   <p className="text-[6px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Destinataire</p>
                   <h3 className="text-[10px] font-black uppercase truncate text-slate-900">{sale.customer}</h3>
                </div>
                <div className="mt-2 pt-2 border-t border-slate-200/50">
                   <p className="text-[7px] font-bold text-slate-500 uppercase">Zone : {sale.orderLocation || 'Générale'}</p>
                </div>
              </div>
              
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex flex-col justify-between text-right">
                <div>
                   <p className="text-[6px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Paiement</p>
                   <span className="text-[9px] font-black uppercase text-purple-600 bg-purple-50 px-2 py-1 rounded border border-purple-100 inline-block">{sale.paymentMethod || 'Espèces'}</span>
                </div>
                <div className="mt-2 pt-2 border-t border-slate-200/50">
                   <p className="text-[7px] font-bold text-slate-500 uppercase">État : Libéré</p>
                </div>
              </div>
            </div>

            {/* TABLEAU DES ARTICLES (DESIGN ÉPURÉ) */}
            <div className="flex-1">
              <table className="w-full text-left text-[8.5px] border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white border-b border-slate-900">
                    <th className="px-3 py-2 uppercase font-black tracking-widest">Désignation</th>
                    <th className="px-2 py-2 text-center uppercase font-black tracking-widest">Qté</th>
                    <th className="px-3 py-2 text-right uppercase font-black tracking-widest">P.U</th>
                    <th className="px-3 py-2 text-right uppercase font-black tracking-widest">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sale.items?.map((item, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-transparent' : 'bg-slate-50/50'}>
                      <td className="px-3 py-2 font-black uppercase text-slate-800 leading-tight">
                         {item.name}
                      </td>
                      <td className="px-2 py-2 text-center font-black text-slate-900">x{item.quantity}</td>
                      <td className="px-3 py-2 text-right font-bold text-slate-500">{item.price.toLocaleString()}</td>
                      <td className="px-3 py-2 text-right font-black text-slate-900">{(item.quantity * item.price).toLocaleString()}</td>
                    </tr>
                  ))}
                  {/* Remplissage visuel */}
                  {[...Array(Math.max(0, 8 - (sale.items?.length || 0)))].map((_, i) => (
                    <tr key={`empty-${i}`} className="border-none">
                      <td className="px-3 py-2 h-7" colSpan={4}></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* TOTAUX & SIGNATURES */}
            <div className="border-t-2 border-slate-900 pt-3">
               <div className="flex justify-between items-start">
                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 space-y-1 min-w-[100px]">
                     <p className="text-[6px] font-black text-slate-400 uppercase border-b pb-1 mb-1 flex items-center">Détail Encaissement</p>
                     <div className="flex justify-between text-[7px] font-bold">
                        <span className="text-slate-500">Recu:</span>
                        <span className="text-slate-900">{(sale.amountReceived || sale.total).toLocaleString()}</span>
                     </div>
                     <div className="flex justify-between text-[7px] font-bold">
                        <span className="text-slate-500">Rendu:</span>
                        <span className="text-emerald-600">{(sale.change || 0).toLocaleString()}</span>
                     </div>
                  </div>

                  <div className="text-right">
                     <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-lg">
                        <p className="text-[6px] font-black text-purple-400 uppercase tracking-[0.2em] mb-1">Total TTC ({config.currency})</p>
                        <div className="text-2xl font-black font-mono tracking-tighter">
                          {sale.total.toLocaleString()}
                        </div>
                     </div>
                  </div>
               </div>

               <div className="mt-8 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                     {config.showQrCodeOnInvoice && <div className="p-1.5 border border-slate-900 rounded-lg"><QrCode size={30} className="text-slate-900" /></div>}
                     <div className="space-y-0.5">
                       <p className="text-[6.5px] font-black uppercase text-slate-900">Certifié Authentique</p>
                       <p className="text-[5.5px] font-bold text-slate-400 uppercase max-w-[120px]">Ce document électronique ARCH/2025 fait foi de preuve d'achat.</p>
                     </div>
                  </div>
                  
                  <div className="flex flex-col items-center">
                     <p className="text-[6px] font-black text-slate-400 uppercase tracking-widest mb-4">Cachet & Signature</p>
                     <div className="w-24 h-px bg-slate-300"></div>
                  </div>
               </div>
            </div>

            <div className="text-center pt-4 mt-auto">
               <p className="text-[6.5px] font-black text-slate-400 uppercase tracking-widest italic">{config.receiptFooter || 'Merci de votre fidélité'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Invoicing;
