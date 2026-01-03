
import React, { useState, useMemo, useRef } from 'react';
import { SaleOrder, ERPConfig, Product, SaleItem, PaymentMethod } from '../types';
import { 
  ShoppingCart, Filter, Download, Plus, CheckCircle2, Clock, Truck, X, Printer, Mail, 
  DownloadCloud, RotateCcw, Calendar, ChefHat, Trash2, AlertTriangle, MapPin, Phone, 
  Banknote, FileText, Search, User, Package, PlusCircle, MinusCircle, QrCode, 
  CreditCard, Smartphone, Wallet, FileSpreadsheet, Globe, FileDown, CheckSquare, 
  Square, Eye 
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { AppLogoDoc } from './Invoicing';
import { AppLogo } from '../App';

interface Props {
  sales: SaleOrder[];
  onUpdate: (sales: SaleOrder[]) => void;
  config: ERPConfig;
  products: Product[];
  userRole: string;
  onAddSale: (sale: Partial<SaleOrder>) => void;
  notify: (title: string, message: string, type?: 'success' | 'info' | 'warning') => void;
  userPermissions: any;
  t: (key: any) => string;
}

const Sales: React.FC<Props> = ({ sales, onUpdate, config, products, userRole, onAddSale, notify, t, userPermissions }) => {
  const [activeTab, setActiveTab] = useState<'all' | 'quotation' | 'confirmed' | 'delivered' | 'refunded'>('all');
  const [selectedSale, setSelectedSale] = useState<SaleOrder | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const startInputRef = useRef<HTMLInputElement>(null);
  const endInputRef = useRef<HTMLInputElement>(null);

  // Permissions
  const canExport = userPermissions.includes('manage_sales') || userRole === 'admin';

  // Plage de dates par défaut : Mois en cours (du 1er au dernier jour)
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0];
  });

  const tabMap: any = { 'quotation': 'quotation', 'confirmed': 'confirmed', 'delivered': 'delivered', 'refunded': 'refunded' };
  
  // Fonction utilitaire pour normaliser les dates stockées (JJ/MM/AAAA ou AAAA-MM-JJ)
  const normalizeDate = (dateStr: string) => {
    if (!dateStr) return "";
    // Format ISO AAAA-MM-JJ
    if (dateStr.includes('-') && dateStr.indexOf('-') === 4) {
      return dateStr.substring(0, 10);
    }
    // Format localisé JJ/MM/AAAA
    if (dateStr.includes('/')) {
      const parts = dateStr.split(' ')[0].replace(',', '').split('/');
      if (parts.length === 3) {
        // On assume JJ/MM/AAAA -> AAAA-MM-JJ
        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
    }
    return dateStr;
  };

  const filteredSales = useMemo(() => {
    return sales.filter(s => {
      // Filtre de statut
      const matchesTab = activeTab === 'all' || s.status === tabMap[activeTab];
      
      // Filtre de recherche
      const matchesSearch = s.customer.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           s.id.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Filtrage par date normalisée
      const saleDateStr = normalizeDate(s.date);
      const matchesDate = saleDateStr >= startDate && saleDateStr <= endDate;

      return matchesTab && matchesSearch && matchesDate;
    });
  }, [sales, activeTab, searchTerm, startDate, endDate]);

  const salesToPrint = useMemo(() => {
    if (selectedIds.length > 0) {
      return sales.filter(s => selectedIds.includes(s.id));
    }
    return filteredSales;
  }, [sales, selectedIds, filteredSales]);

  const totalsByMethod = useMemo(() => {
    const summary: Record<string, number> = {};
    salesToPrint.forEach(s => {
      const m = s.paymentMethod || 'Espèces';
      if (s.status !== 'refunded') {
        summary[m] = (summary[m] || 0) + s.total;
      } else {
        summary[m] = (summary[m] || 0) - s.total;
      }
    });
    return Object.entries(summary);
  }, [salesToPrint]);

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredSales.length && filteredSales.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredSales.map(s => s.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleExportJournalPDF = () => {
    if (salesToPrint.length === 0) {
      notify("Export impossible", "Aucune donnée sur cette période.", "warning");
      return;
    }
    window.print();
  };

  const handleExportExcel = (data: SaleOrder[]) => {
    if (data.length === 0) {
      notify("Export Excel", "Aucune donnée à exporter.", "warning");
      return;
    }

    // Préparation des données pour Excel
    const exportData = data.map(s => ({
      'Référence': s.id,
      'Date & Heure': s.date,
      'Nom du Client': s.customer,
      'Mode de Paiement': s.paymentMethod || 'Espèces',
      'Statut de la Vente': s.status.toUpperCase(),
      'Source/Lieu': s.orderLocation || 'Comptoir',
      'Montant Net': s.total,
      'Devise': config.currency
    }));

    // Création de la feuille Excel
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    
    // Auto-ajustement de la largeur des colonnes
    const wscols = [
      {wch: 15}, {wch: 20}, {wch: 25}, {wch: 15}, {wch: 15}, {wch: 15}, {wch: 12}, {wch: 10}
    ];
    worksheet['!cols'] = wscols;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Journal des Ventes");
    
    // Nom de fichier dynamique basé sur le mois en cours
    const monthName = new Date(startDate).toLocaleString('fr-FR', { month: 'long', year: 'numeric' });
    const fileName = `Journal_Ventes_MYADOR_${monthName.replace(/\s+/g, '_')}.xlsx`;
    
    XLSX.writeFile(workbook, fileName);
    notify("Journal Excel", `${data.length} transactions exportées pour ${monthName}.`, "success");
    setSelectedIds([]);
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

  return (
    <div className="space-y-8 animate-fadeIn pb-10 pr-2">
      
      {/* BARRE ACTIONS FLOTTANTE */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-8 py-4 rounded-[2rem] shadow-2xl z-[150] flex items-center space-x-8 animate-slideUp no-print">
           <div className="flex items-center space-x-3 border-r border-slate-700 pr-8">
              <span className="bg-purple-600 w-8 h-8 rounded-full flex items-center justify-center font-black text-xs">{selectedIds.length}</span>
              <span className="text-xs font-black uppercase tracking-widest">Sélectionnés</span>
           </div>
           <div className="flex items-center space-x-6">
              {canExport && (
                <>
                  <button onClick={handleExportJournalPDF} className="flex items-center text-[10px] font-black uppercase tracking-widest hover:text-purple-400 transition-colors">
                    <Printer size={18} className="mr-2 text-blue-400" /> Journal PDF
                  </button>
                  <button onClick={() => handleExportExcel(sales.filter(s => selectedIds.includes(s.id)))} className="flex items-center text-[10px] font-black uppercase tracking-widest hover:text-emerald-400 transition-colors">
                    <FileSpreadsheet size={18} className="mr-2 text-emerald-500" /> Export Excel
                  </button>
                </>
              )}
              <div className="h-4 w-px bg-slate-700"></div>
              <button onClick={() => setSelectedIds([])} className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-rose-500">Annuler</button>
           </div>
        </div>
      )}

      {/* ZONE D'IMPRESSION JOURNAL */}
      <div id="report-print-area" className="hidden print:block p-12 bg-white text-slate-950">
          <div className="flex justify-between items-start mb-12 border-b-2 pb-8 border-slate-200">
             <div className="flex items-center space-x-5">
                <AppLogoDoc className="w-16 h-16" />
                <div>
                   <h1 className="text-2xl font-black uppercase tracking-tighter">{config.companyName}</h1>
                   <p className="text-[10px] font-black text-purple-600 uppercase tracking-widest">Journal Central des Ventes</p>
                </div>
             </div>
             <div className="text-right">
                <h2 className="text-xl font-black uppercase">Rapport de Ventes</h2>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Période du {startDate} au {endDate}</p>
             </div>
          </div>

          <table className="w-full text-left mb-10">
             <thead>
                <tr className="bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest">
                   <th className="px-4 py-4">Réf</th>
                   <th className="px-4 py-4">Date & Heure</th>
                   <th className="px-4 py-4">Client</th>
                   <th className="px-4 py-4">Mode</th>
                   <th className="px-4 py-4 text-center">Statut</th>
                   <th className="px-4 py-4 text-right">Montant</th>
                </tr>
             </thead>
             <tbody className="divide-y border-b text-[9px] font-bold text-slate-800">
                {salesToPrint.map(s => (
                   <tr key={s.id} className={s.status === 'refunded' ? 'opacity-50 text-rose-600' : ''}>
                      <td className="px-4 py-4 font-mono">#{s.id.slice(-8)}</td>
                      <td className="px-4 py-4 whitespace-nowrap">{s.date}</td>
                      <td className="px-4 py-4 uppercase truncate max-w-[150px]">{s.customer}</td>
                      <td className="px-4 py-4">{s.paymentMethod || 'Espèces'}</td>
                      <td className="px-4 py-4 text-center uppercase text-[8px]">{s.status}</td>
                      <td className="px-4 py-4 text-right font-black">{s.total.toLocaleString()} {config.currency}</td>
                   </tr>
                ))}
             </tbody>
             <tfoot>
                <tr className="bg-slate-100 font-black text-xs">
                   <td colSpan={5} className="px-4 py-6 text-right uppercase tracking-widest">Total Net des Recettes :</td>
                   <td className="px-4 py-6 text-right text-purple-600">
                      {salesToPrint.reduce((a,b) => b.status === 'refunded' ? a - b.total : a + b.total, 0).toLocaleString()} {config.currency}
                   </td>
                </tr>
             </tfoot>
          </table>

          <div className="grid grid-cols-2 gap-12 mt-12">
             <div className="space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b pb-2">Résumé par Paiement</h3>
                <table className="w-full text-left">
                   <thead>
                      <tr className="text-[8px] font-black uppercase text-slate-400 border-b">
                         <th className="py-2">Mode</th>
                         <th className="py-2 text-right">Cumul</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y text-[9px] font-bold text-slate-700">
                      {totalsByMethod.map(([method, val]) => (
                         <tr key={method}>
                            <td className="py-3 uppercase">{method}</td>
                            <td className="py-3 text-right font-black">{val.toLocaleString()} {config.currency}</td>
                         </tr>
                      ))}
                   </tbody>
                </table>
             </div>
             <div className="bg-slate-50 p-6 rounded-2xl flex flex-col items-center justify-center text-center space-y-4">
                <QrCode size={60} className="opacity-20" />
                <p className="text-[8px] font-bold text-slate-400 uppercase leading-relaxed">
                   Validation Numérique Sama Pos +<br/>
                   Document généré le {new Date().toLocaleString()}
                </p>
             </div>
          </div>
      </div>

      {/* HEADER PRINCIPAL AVEC LOGO */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 no-print">
        <div className="flex items-center space-x-6">
           <AppLogo iconOnly className="w-14 h-14" />
           <div>
              <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">Journal des Ventes</h1>
              <p className="text-sm text-slate-500 font-medium mt-1">Historique financier et archivage mensuel</p>
           </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
           {/* FILTRES DE DATES */}
           <div className="flex items-center space-x-3 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
             <div 
               onClick={() => startInputRef.current?.showPicker()} 
               className="flex items-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 p-1 rounded-xl transition-all"
             >
               <Calendar size={16} className="text-purple-600 mr-2" />
               <input 
                 ref={startInputRef}
                 type="date" 
                 value={startDate} 
                 onChange={e => setStartDate(e.target.value)} 
                 className="bg-transparent text-[10px] font-black uppercase outline-none text-slate-600 dark:text-slate-300 cursor-pointer" 
               />
             </div>
             <span className="text-slate-300 font-black">→</span>
             <div 
               onClick={() => endInputRef.current?.showPicker()} 
               className="flex items-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 p-1 rounded-xl transition-all"
             >
               <input 
                 ref={endInputRef}
                 type="date" 
                 value={endDate} 
                 onChange={e => setEndDate(e.target.value)} 
                 className="bg-transparent text-[10px] font-black uppercase outline-none text-slate-600 dark:text-slate-300 cursor-pointer" 
               />
               <Calendar size={16} className="text-purple-600 ml-2" />
             </div>
           </div>
           
           {canExport && (
             <div className="flex items-center space-x-2">
                <button 
                  onClick={handleExportJournalPDF} 
                  className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center shadow-sm"
                  title="Exporter le journal PDF de la période"
                >
                  <FileDown size={18} className="mr-2 text-rose-600" /> Journal PDF
                </button>
                <button 
                  onClick={() => handleExportExcel(filteredSales)} 
                  className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center shadow-sm"
                  title="Exporter le journal Excel du mois en cours"
                >
                  <FileSpreadsheet size={18} className="mr-2 text-emerald-600" /> Excel
                </button>
             </div>
           )}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border-2 border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex-1 no-print">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/30">
          <div className="flex items-center space-x-4">
             <button onClick={toggleSelectAll} className="p-2 text-slate-400 hover:text-purple-600 transition-colors">
                {selectedIds.length === filteredSales.length && filteredSales.length > 0 ? <CheckSquare size={20} className="text-purple-600" /> : <Square size={20} />}
             </button>
             <div className="relative w-72">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Réf Doc ou Client..." className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border rounded-xl text-[11px] font-bold outline-none focus:border-purple-500" />
             </div>
          </div>
          <div className="flex border-slate-100 dark:border-slate-800 overflow-x-auto scrollbar-hide">
            {(['all', 'quotation', 'confirmed', 'delivered', 'refunded'] as const).map((tab) => (
              <button key={tab} onClick={() => { setActiveTab(tab); setSelectedIds([]); }} className={`px-6 py-3 text-[9px] font-black uppercase tracking-widest transition-all border-b-2 whitespace-nowrap ${activeTab === tab ? 'border-purple-600 text-purple-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
                <span>{tab === 'all' ? 'Toutes' : tab === 'quotation' ? 'Devis' : tab === 'confirmed' ? 'En Cours' : tab === 'delivered' ? 'Livrées' : 'Retours'}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
               <tr className="bg-slate-50/50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
                  <th className="px-6 py-5 w-10"></th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Réf Doc</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest">Client / Heure</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-right">Montant Net</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-center">Statut</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-right">Consulter</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {filteredSales.map((sale) => (
                <tr key={sale.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all group ${sale.status === 'refunded' ? 'opacity-60' : ''} ${selectedIds.includes(sale.id) ? 'bg-purple-50 dark:bg-purple-900/10' : ''}`}>
                  <td className="px-6 py-5 text-center">
                    <button onClick={() => toggleSelect(sale.id)} className={`transition-colors ${selectedIds.includes(sale.id) ? 'text-purple-600' : 'text-slate-200 dark:text-slate-700 hover:text-slate-400'}`}>
                       {selectedIds.includes(sale.id) ? <CheckSquare size={18} /> : <Square size={18} />}
                    </button>
                  </td>
                  <td className="px-8 py-5 text-xs font-black text-purple-600 font-mono tracking-tighter">#{sale.id.slice(-8)}</td>
                  <td className="px-8 py-5"><div className="flex flex-col"><span className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase truncate max-w-[150px]">{sale.customer}</span><span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{sale.date}</span></div></td>
                  <td className={`px-8 py-5 text-sm font-black text-right text-slate-900 dark:text-white ${sale.status === 'refunded' ? 'line-through text-rose-500' : ''}`}>{sale.total.toLocaleString()} {config.currency}</td>
                  <td className="px-8 py-5 text-center"><span className={`inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${getStatusStyle(sale.status)}`}>{sale.status}</span></td>
                  <td className="px-8 py-5 text-right"><button onClick={() => setSelectedSale(sale)} className="bg-white dark:bg-slate-800 border p-2 rounded-xl text-slate-400 hover:text-purple-600 hover:border-purple-500 transition-all shadow-sm"><Eye size={18}/></button></td>
                </tr>
              ))}
              {filteredSales.length === 0 && (
                <tr><td colSpan={6} className="py-20 text-center opacity-20 uppercase font-black tracking-widest text-sm">Aucune donnée trouvée sur cette période</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Sales;
