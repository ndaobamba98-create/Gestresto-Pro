
import React, { useState, useMemo, useRef } from 'react';
import { SaleOrder, ERPConfig, Product, Expense, ViewType } from '../types';
import { 
  ShoppingCart, Filter, Download, Plus, CheckCircle2, Clock, Truck, X, Printer, Mail, 
  DownloadCloud, RotateCcw, Calendar, ChefHat, Trash2, AlertTriangle, MapPin, Phone, 
  Banknote, FileText, Search, User, Package, PlusCircle, MinusCircle, QrCode, 
  CreditCard, Smartphone, Wallet, FileSpreadsheet, Globe, FileDown, CheckSquare, 
  Square, Eye, ArrowUpRight, ArrowDownLeft, Scale, Wallet2
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { AppLogoDoc } from './Invoicing';
import { AppLogo } from '../App';

interface Props {
  sales: SaleOrder[];
  expenses?: Expense[]; // Ajout des dépenses pour le journal global
  onUpdate: (sales: SaleOrder[]) => void;
  config: ERPConfig;
  products: Product[];
  userRole: string;
  onAddSale: (sale: Partial<SaleOrder>) => void;
  notify: (title: string, message: string, type?: 'success' | 'info' | 'warning') => void;
  userPermissions: any;
  t: (key: any) => string;
}

const PaymentIcons = ({ sale }: { sale: SaleOrder }) => {
  const methods = sale.payments ? sale.payments.map(p => p.method) : [sale.paymentMethod || 'Especes'];
  
  return (
    <div className="flex -space-x-1">
      {Array.from(new Set(methods)).map((m, i) => {
        switch(m) {
          case 'Bankily': return <Smartphone key={i} size={12} className="text-orange-500 bg-orange-50 dark:bg-orange-950/30 p-0.5 rounded-sm border border-orange-100" />;
          case 'Masrvi': return <Wallet key={i} size={12} className="text-blue-500 bg-blue-50 dark:bg-blue-950/30 p-0.5 rounded-sm border border-blue-100" />;
          case 'Especes': return <Banknote key={i} size={12} className="text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 p-0.5 rounded-sm border border-emerald-100" />;
          case 'Sedad': return <CreditCard key={i} size={12} className="text-purple-500 bg-purple-50 dark:bg-purple-950/30 p-0.5 rounded-sm border border-purple-100" />;
          default: return <Wallet2 key={i} size={12} className="text-slate-400 p-0.5 rounded-sm border" />;
        }
      })}
    </div>
  );
};

const Sales: React.FC<Props> = ({ sales, expenses = [], onUpdate, config, products, userRole, onAddSale, notify, t, userPermissions }) => {
  const [viewMode, setViewMode] = useState<'sales_only' | 'journal_complet'>('journal_complet');
  const [selectedSale, setSelectedSale] = useState<SaleOrder | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const startInputRef = useRef<HTMLInputElement>(null);
  const endInputRef = useRef<HTMLInputElement>(null);

  const canExport = userPermissions.includes('manage_sales') || userRole === 'admin';

  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    return d.toISOString().split('T')[0]; // Par défaut aujourd'hui pour le journal de caisse
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const normalizeDate = (dateStr: string) => {
    if (!dateStr) return "";
    if (dateStr.includes('-') && dateStr.indexOf('-') === 4) return dateStr.substring(0, 10);
    if (dateStr.includes('/')) {
      const parts = dateStr.split(' ')[0].replace(',', '').split('/');
      if (parts.length === 3) return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
    return dateStr;
  };

  // Fusion des flux de trésorerie (Ventes + Dépenses)
  const journalEntries = useMemo(() => {
    const allEntries: any[] = [];
    
    // Ajouter les ventes
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

    // Ajouter les dépenses (si mode complet activé)
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

  const handleExportExcel = () => {
    const data = filteredEntries.map(e => ({
      'Flux': e.type === 'sale' ? 'ENTRÉE' : 'SORTIE',
      'Date': e.date,
      'Référence': e.id,
      'Libellé': e.label,
      'Montant': e.amount,
      'Mode': e.method,
      'Statut': e.status.toUpperCase()
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Journal");
    XLSX.writeFile(workbook, `Journal_Caisse_${startDate}_au_${endDate}.xlsx`);
    notify("Export", "Le journal de caisse a été généré.", "success");
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-24 pr-2">
      
      {/* HEADER PROFESSIONNEL */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 no-print">
        <div className="flex items-center space-x-6">
           <div className="p-4 bg-slate-900 text-white rounded-3xl shadow-xl"><FileText size={28} /></div>
           <div>
              <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">Journal Central</h1>
              <p className="text-sm text-slate-500 font-medium mt-1">Audit complet des flux Entrées/Sorties</p>
           </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
           <div className="flex bg-white dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <button onClick={() => setViewMode('journal_complet')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${viewMode === 'journal_complet' ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/20' : 'text-slate-400'}`}>Journal Complet</button>
              <button onClick={() => setViewMode('sales_only')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${viewMode === 'sales_only' ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/20' : 'text-slate-400'}`}>Ventes Seules</button>
           </div>
           
           <div className="flex items-center space-x-3 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800">
             <Calendar size={16} className="text-purple-600 ml-2" />
             <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-transparent text-[10px] font-black uppercase outline-none" />
             <span className="text-slate-300">→</span>
             <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-transparent text-[10px] font-black uppercase outline-none" />
           </div>

           {canExport && (
             <button onClick={handleExportExcel} className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center shadow-sm">
               <FileDown size={18} className="mr-2 text-emerald-600" /> Excel
             </button>
           )}
        </div>
      </div>

      {/* ZONE JOURNAL TYPE ODOO / COMPTABILITÉ */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border-2 border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex-1 no-print">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/30">
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
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest">Libellé Transaction</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-center">Règlement</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-right">Entrée (+)</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-right">Sortie (-)</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-right">Action</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredEntries.map((entry) => {
                const isSale = entry.type === 'sale' && entry.status !== 'refunded';
                const isOutcome = entry.type === 'expense' || entry.status === 'refunded';
                
                return (
                  <tr key={entry.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all group">
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-slate-400 uppercase">{entry.date.split(' ')[0]}</span>
                        <span className="text-[9px] font-bold text-slate-300">{entry.date.split(' ')[1] || '--:--'}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-xs font-mono font-black text-purple-600">#{entry.id.slice(-8)}</td>
                    <td className="px-8 py-6">
                      <div className="flex items-center space-x-3">
                         <div className={`p-2 rounded-lg ${isSale ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'}`}>
                           {isSale ? <ArrowUpRight size={14}/> : <ArrowDownLeft size={14}/>}
                         </div>
                         <div className="flex flex-col">
                            <span className="text-sm font-black uppercase text-slate-800 dark:text-slate-200 truncate max-w-[200px]">{entry.label}</span>
                            <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest">{entry.category || (entry.status === 'refunded' ? 'Avoir client' : 'Vente comptoir')}</span>
                         </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                       <div className="flex justify-center">
                          {entry.type === 'sale' ? <PaymentIcons sale={entry.original} /> : <span className="text-[9px] font-black text-slate-400 uppercase">{entry.method}</span>}
                       </div>
                    </td>
                    <td className="px-8 py-6 text-right font-black text-sm text-emerald-600">
                       {isSale ? `+${entry.amount.toLocaleString()}` : '--'}
                    </td>
                    <td className="px-8 py-6 text-right font-black text-sm text-rose-600">
                       {isOutcome ? `-${entry.amount.toLocaleString()}` : '--'}
                    </td>
                    <td className="px-8 py-6 text-right">
                       <button onClick={() => entry.type === 'sale' ? setSelectedSale(entry.original) : notify("Info", "Détails de dépense non modifiables ici.", "info")} className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-purple-600 hover:bg-white dark:hover:bg-slate-700 rounded-xl transition-all shadow-sm">
                          <Eye size={16} />
                       </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* BANDEAU RÉCAPITULATIF DE CAISSE (FLOATING FOOTER) */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-5xl no-print px-4">
         <div className="bg-slate-900 text-white rounded-[2.5rem] p-6 shadow-2xl flex items-center justify-between border border-white/10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/10 rounded-full blur-3xl group-hover:bg-purple-600/20 transition-all"></div>
            
            <div className="flex items-center space-x-12 relative z-10 px-6">
               <div className="flex flex-col">
                  <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest flex items-center"><ArrowUpRight size={10} className="mr-1"/> Recettes Totales</span>
                  <span className="text-xl font-black">{totals.income.toLocaleString()} <span className="text-[10px] opacity-40">{config.currency}</span></span>
               </div>
               <div className="w-px h-8 bg-slate-700"></div>
               <div className="flex flex-col">
                  <span className="text-[9px] font-black text-rose-400 uppercase tracking-widest flex items-center"><ArrowDownLeft size={10} className="mr-1"/> Charges Déduites</span>
                  <span className="text-xl font-black">{totals.outcome.toLocaleString()} <span className="text-[10px] opacity-40">{config.currency}</span></span>
               </div>
            </div>

            <div className="bg-white/5 border border-white/10 px-10 py-3 rounded-3xl flex flex-col items-center group-hover:bg-white/10 transition-all">
                <span className="text-[8px] font-black text-purple-400 uppercase tracking-[0.3em] mb-1">Position de Caisse Nette</span>
                <div className="flex items-baseline space-x-2">
                   <span className={`text-3xl font-black tracking-tighter ${totals.net >= 0 ? 'text-white' : 'text-rose-500'}`}>{totals.net.toLocaleString()}</span>
                   <span className="text-xs font-bold opacity-30 uppercase">{config.currency}</span>
                </div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default Sales;
