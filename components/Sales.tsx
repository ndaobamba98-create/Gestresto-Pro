
import React, { useState, useMemo, useRef } from 'react';
import { SaleOrder, ERPConfig, Product, Expense, ViewType, PaymentMethod, User } from '../types';
import { 
  ShoppingCart, Filter, Download, Plus, CheckCircle2, Clock, Truck, X, Printer, Mail, 
  DownloadCloud, RotateCcw, Calendar, ChefHat, Trash2, AlertTriangle, MapPin, Phone, 
  Banknote, FileText, Search, User as UserIcon, Package, PlusCircle, MinusCircle, QrCode, 
  CreditCard, Smartphone, Wallet, FileSpreadsheet, Globe, FileDown, CheckSquare, 
  Square, Eye, ArrowUpRight, ArrowDownLeft, Scale, Wallet2, Edit3, Save, History, UserCheck, Send
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { AppLogoDoc } from './Invoicing';
import { AppLogo } from '../App';

interface Props {
  sales: SaleOrder[];
  expenses?: Expense[];
  onUpdate: (sales: SaleOrder[]) => void;
  onRefundSale: (saleId: string) => void;
  config: ERPConfig;
  products: Product[];
  userRole: string;
  currentUser: User;
  onAddSale: (sale: Partial<SaleOrder>) => void;
  notify: (title: string, message: string, type?: 'success' | 'info' | 'warning') => void;
  userPermissions: any;
  t: (key: any) => string;
  simulateEmailSend?: (subject: string, body: string, trigger: any) => void;
}

const PaymentIcons = ({ sale, compact = false }: { sale: SaleOrder, compact?: boolean }) => {
  const methods = sale.payments ? sale.payments.map(p => p.method) : [sale.paymentMethod || 'Especes'];
  
  return (
    <div className="flex -space-x-1 justify-center">
      {Array.from(new Set(methods)).map((m, i) => {
        const size = compact ? 12 : 20;
        const className = "p-1 rounded-lg border shadow-sm transition-transform hover:scale-110";
        switch(m) {
          case 'Bankily': return <Smartphone key={i} size={size} className={`${className} text-orange-600 bg-orange-50 border-orange-200`} />;
          case 'Masrvi': return <Wallet key={i} size={size} className={`${className} text-blue-600 bg-blue-50 border-blue-200`} />;
          case 'Especes': return <Banknote key={i} size={size} className={`${className} text-emerald-600 bg-emerald-50 border-emerald-200`} />;
          case 'Sedad': return <CreditCard key={i} size={size} className={`${className} text-purple-600 bg-purple-50 border-purple-200`} />;
          case 'Compte': return <UserCheck key={i} size={size} className={`${className} text-indigo-600 bg-indigo-50 border-indigo-200`} />;
          default: return <Wallet2 key={i} size={size} className={`${className} text-slate-500 bg-slate-50 border-slate-200`} />;
        }
      })}
    </div>
  );
};

const StatusBadge = ({ status }: { status: SaleOrder['status'] }) => {
  const baseClass = "flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border shadow-sm";
  switch (status) {
    case 'draft': 
      return <span className={`${baseClass} bg-slate-100 text-slate-500 border-slate-200`}><Clock size={12}/> <span>Brouillon</span></span>;
    case 'confirmed': 
      return <span className={`${baseClass} bg-emerald-100 text-emerald-600 border-emerald-200`}><CheckCircle2 size={12}/> <span>Confirmé</span></span>;
    case 'delivered': 
      return <span className={`${baseClass} bg-blue-100 text-blue-600 border-blue-200`}><Truck size={12}/> <span>Livré</span></span>;
    case 'refunded': 
      return <span className={`${baseClass} bg-rose-100 text-rose-600 border-rose-200`}><RotateCcw size={12}/> <span>Annulé</span></span>;
    case 'quotation': 
      return <span className={`${baseClass} bg-amber-100 text-amber-600 border-amber-200`}><FileText size={12}/> <span>Devis</span></span>;
    default: return <span className={baseClass}>{status}</span>;
  }
};

const Sales: React.FC<Props> = ({ sales, expenses = [], onUpdate, onRefundSale, config, products, userRole, currentUser, onAddSale, notify, t, userPermissions, simulateEmailSend }) => {
  const [viewMode, setViewMode] = useState<'sales_only' | 'journal_complet'>('journal_complet');
  const [selectedSale, setSelectedSale] = useState<SaleOrder | null>(null);
  const [editingSale, setEditingSale] = useState<SaleOrder | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const canExport = userPermissions.includes('manage_sales') || userRole === 'admin';
  const canEdit = userPermissions.includes('manage_sales') || userRole === 'admin';
  const canCancel = userRole === 'admin' || userRole === 'manager';

  const normalizeDate = (dateStr: string) => {
    if (!dateStr) return "";
    if (dateStr.includes('-') && dateStr.indexOf('-') === 4) return dateStr.substring(0, 10);
    return dateStr;
  };

  const journalEntries = useMemo(() => {
    const allEntries: any[] = [];
    
    sales.forEach(s => {
      const date = normalizeDate(s.date);
      if (date >= startDate && date <= endDate) {
        allEntries.push({
          type: 'sale',
          id: s.id,
          date: s.date,
          label: s.customer,
          amount: s.total,
          status: s.status,
          method: s.paymentMethod,
          original: s
        });
      }
    });

    if (viewMode === 'journal_complet') {
      expenses.forEach(e => {
        const date = normalizeDate(e.date);
        if (date >= startDate && date <= endDate) {
          allEntries.push({
            type: 'expense',
            id: e.id,
            date: e.date,
            label: e.description,
            amount: e.amount,
            status: 'paid',
            category: e.category,
            method: e.paymentMethod,
            original: e
          });
        }
      });
    }

    return allEntries.sort((a, b) => b.date.localeCompare(a.date));
  }, [sales, expenses, startDate, endDate, viewMode]);

  const filteredEntries = useMemo(() => {
    return journalEntries.filter(entry => 
      entry.label.toLowerCase().includes(searchTerm.toLowerCase()) || 
      entry.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [journalEntries, searchTerm]);

  const totals = useMemo(() => {
    let income = 0;
    let outcome = 0;
    filteredEntries.forEach(e => {
      if (e.type === 'sale' && e.status !== 'refunded') income += e.amount;
      else if (e.type === 'expense' || e.status === 'refunded') outcome += e.amount;
    });
    return { income, outcome, net: income - outcome };
  }, [filteredEntries]);

  const handleDetailedExport = () => {
    const data = filteredEntries.map(e => ({
      'Flux': e.type === 'sale' ? 'ENTRÉE' : 'SORTIE',
      'Date/Heure': e.date,
      'Référence': e.id,
      'Libellé Client/Objet': e.label,
      'Mode de Règlement': e.method,
      'Montant': e.amount,
      'Statut': e.status.toUpperCase(),
      'Catégorie/Zone': e.original.orderLocation || e.original.category || 'N/A'
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Journal");
    XLSX.writeFile(workbook, `Journal_Ventes_${startDate}_au_${endDate}.xlsx`);
    notify("Export réussi", "Le journal détaillé a été téléchargé.", "success");
  };

  const handleDownloadPDFJournal = () => {
    const element = document.getElementById('sales-print-area');
    if (!element) return;

    const opt = {
      margin: 10,
      filename: `Journal_SamaPos_${startDate}_au_${endDate}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
    };

    // @ts-ignore
    window.html2pdf().set(opt).from(element).save();
    notify("Téléchargement PDF", "Le journal est en cours de téléchargement.", "success");
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-24 pr-2">
      
      {/* HEADER PROFESSIONNEL */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 no-print">
        <div className="flex items-center space-x-6">
           <div className="p-4 bg-slate-900 text-white rounded-3xl shadow-xl"><FileText size={28} /></div>
           <div>
              <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">Historique des Ventes</h1>
              <p className="text-sm text-slate-500 font-medium mt-1">Audit complet et annulation des transactions</p>
           </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
           <div className="flex bg-white dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <button onClick={() => setViewMode('journal_complet')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${viewMode === 'journal_complet' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400'}`}>Journal Complet</button>
              <button onClick={() => setViewMode('sales_only')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${viewMode === 'sales_only' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400'}`}>Ventes Seules</button>
           </div>
           
           <div className="flex items-center space-x-3 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800">
             <Calendar size={16} className="text-purple-600 ml-2" />
             <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-transparent text-[10px] font-black uppercase outline-none" />
             <span className="text-slate-300">→</span>
             <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-transparent text-[10px] font-black uppercase outline-none" />
           </div>

           {canExport && (
             <div className="flex items-center space-x-2">
                <button onClick={handleDetailedExport} className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center shadow-sm">
                  <FileDown size={18} className="mr-2 text-emerald-600" /> Excel
                </button>
                <button onClick={handleDownloadPDFJournal} className="bg-rose-600 text-white px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-rose-700 transition-all flex items-center">
                  <FileText size={18} className="mr-2" /> PDF
                </button>
             </div>
           )}
        </div>
      </div>

      <div id="sales-print-area" className="bg-white dark:bg-slate-900 rounded-[2.5rem] border-2 border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex-1">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 no-print">
          <div className="relative w-full max-w-xl">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
             <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Chercher une écriture (Réf, Client, Libellé...)" className="w-full pl-12 pr-6 py-3.5 bg-white dark:bg-slate-800 border-none rounded-2xl text-xs font-bold outline-none shadow-sm focus:ring-2 focus:ring-purple-500" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
               <tr className="bg-slate-900 text-white">
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest">Date / Heure</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest">Référence</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest">Client / Motif</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-center">Statut</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-center">Paiement</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-right">Montant</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-right no-print">Action</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredEntries.map((entry) => {
                const isSale = entry.type === 'sale' && entry.status !== 'refunded';
                const isRefunded = entry.status === 'refunded';
                
                return (
                  <tr key={entry.id} className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-all group ${isRefunded ? 'bg-rose-50/10 grayscale-[0.3]' : ''}`}>
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className={`text-[10px] font-black uppercase ${isRefunded ? 'text-rose-400' : 'text-slate-400'}`}>{entry.date.split(' ')[0]}</span>
                        <span className="text-[9px] font-bold text-slate-300">{entry.date.split(' ')[1] || '--:--'}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-xs font-mono font-black text-purple-600">
                      <span className={isRefunded ? 'line-through text-rose-500 opacity-60' : ''}>#{entry.id.slice(-8)}</span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center space-x-3">
                         <div className={`p-2 rounded-lg ${isSale ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'}`}>
                           {isSale ? <ArrowUpRight size={14}/> : <ArrowDownLeft size={14}/>}
                         </div>
                         <div className="flex flex-col">
                            <span className={`text-sm font-black uppercase truncate max-w-[200px] ${isRefunded ? 'line-through text-rose-500/60' : 'text-slate-800 dark:text-slate-200'}`}>{entry.label}</span>
                            <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest">{entry.category || (entry.status === 'refunded' ? 'Vente Annulée' : 'Vente comptoir')}</span>
                         </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                       <div className="flex justify-center">
                          {entry.type === 'sale' ? <StatusBadge status={entry.status} /> : <span className="px-3 py-1 bg-slate-100 text-slate-400 rounded-lg text-[8px] font-black uppercase">DÉPENSE</span>}
                       </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                       <div className="flex justify-center">
                          {entry.type === 'sale' ? <PaymentIcons sale={entry.original} /> : <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{entry.method}</span>}
                       </div>
                    </td>
                    <td className="px-8 py-6 text-right font-black text-sm">
                       <span className={isRefunded ? 'text-rose-300 line-through' : isSale ? 'text-emerald-600' : 'text-rose-600'}>
                         {isSale ? '+' : '-'}{entry.amount.toLocaleString()} <span className="text-[10px] opacity-40">{config.currency}</span>
                       </span>
                    </td>
                    <td className="px-8 py-6 text-right no-print">
                       <div className="flex items-center justify-end space-x-2">
                          {canCancel && entry.type === 'sale' && !isRefunded && (
                            <button 
                              onClick={() => { if(confirm("Confirmer l'annulation de cette vente ?")) onRefundSale(entry.id); }}
                              className="p-2.5 bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl transition-all shadow-sm"
                              title="Annuler définitivement"
                            >
                              <RotateCcw size={18} />
                            </button>
                          )}
                          <button onClick={() => entry.type === 'sale' ? setSelectedSale(entry.original) : notify("Info", "Détails indisponibles pour les dépenses.", "info")} className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-purple-600 hover:bg-white dark:hover:bg-slate-700 rounded-xl transition-all shadow-sm">
                             <Eye size={18} />
                          </button>
                       </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Sales;
