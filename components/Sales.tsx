
import React, { useState } from 'react';
import { SaleOrder, ERPConfig, Product, SaleItem, PaymentMethod } from '../types';
import { ShoppingCart, Filter, Download, Plus, CheckCircle2, Clock, Truck, X, Printer, Mail, DownloadCloud, RotateCcw, Calendar, ChefHat, Trash2, AlertTriangle, MapPin, Phone, Banknote, FileText, Search, User, Package, PlusCircle, MinusCircle, QrCode, CreditCard, Smartphone, Wallet, FileSpreadsheet, Globe, FileDown } from 'lucide-react';
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
  userPermissions: any;
  t: (key: any) => string;
}

const Sales: React.FC<Props> = ({ sales, onUpdate, config, products, userRole, onAddSale, notify, t }) => {
  const [activeTab, setActiveTab] = useState<'all' | 'quotation' | 'confirmed' | 'delivered' | 'refunded'>('all');
  const [selectedSale, setSelectedSale] = useState<SaleOrder | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isJournalPrintOpen, setIsJournalPrintOpen] = useState(false);

  const tabMap: any = { 'quotation': 'quotation', 'confirmed': 'confirmed', 'delivered': 'delivered', 'refunded': 'refunded' };
  const filteredSales = activeTab === 'all' ? sales : sales.filter(s => s.status === tabMap[activeTab]);

  const handleExportJournalPDF = () => {
    window.print();
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
      
      {/* VUE D'IMPRESSION DU JOURNAL DE VENTES (Cachée à l'écran) */}
      <div id="report-print-area" className="hidden print:block p-12 bg-white text-slate-950">
          <div className="flex justify-between items-start mb-12 border-b-2 pb-8 border-slate-200">
             <div className="flex items-center space-x-5">
                <AppLogoDoc className="w-16 h-16" />
                <div>
                   <h1 className="text-2xl font-black uppercase tracking-tighter">{config.companyName}</h1>
                   <p className="text-[10px] font-black text-purple-600 uppercase tracking-widest">Journal des Opérations Commerciales</p>
                </div>
             </div>
             <div className="text-right">
                <h2 className="text-xl font-black uppercase">Extrait de Journal</h2>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Filtre : {activeTab === 'all' ? 'Toutes les ventes' : activeTab.toUpperCase()}</p>
                <p className="text-[8px] font-black text-slate-400 mt-4 uppercase">Généré le {new Date().toLocaleString()}</p>
             </div>
          </div>

          <table className="w-full text-left">
             <thead>
                <tr className="bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest">
                   <th className="px-4 py-4">Réf Document</th>
                   <th className="px-4 py-4">Date & Heure</th>
                   <th className="px-4 py-4">Client</th>
                   <th className="px-4 py-4">Mode</th>
                   <th className="px-4 py-4 text-center">Statut</th>
                   <th className="px-4 py-4 text-right">Montant</th>
                </tr>
             </thead>
             <tbody className="divide-y border-b text-[9px] font-bold text-slate-800">
                {filteredSales.map(s => (
                   <tr key={s.id} className={s.status === 'refunded' ? 'opacity-50 text-rose-600' : ''}>
                      <td className="px-4 py-4 font-mono">#{s.id.slice(-8)}</td>
                      <td className="px-4 py-4 whitespace-nowrap">{s.date}</td>
                      <td className="px-4 py-4 uppercase">{s.customer}</td>
                      <td className="px-4 py-4">{s.paymentMethod || 'Espèces'}</td>
                      <td className="px-4 py-4 text-center uppercase text-[8px]">{s.status}</td>
                      <td className="px-4 py-4 text-right font-black">{s.total.toLocaleString()} {config.currency}</td>
                   </tr>
                ))}
             </tbody>
             <tfoot>
                <tr className="bg-slate-50 font-black text-xs">
                   <td colSpan={5} className="px-4 py-6 text-right uppercase tracking-widest">Cumul des Transactions :</td>
                   <td className="px-4 py-6 text-right text-purple-600">
                      {filteredSales.reduce((a,b) => b.status === 'refunded' ? a - b.total : a + b.total, 0).toLocaleString()} {config.currency}
                   </td>
                </tr>
             </tfoot>
          </table>

          <div className="mt-20 flex justify-between items-end border-t border-dashed pt-8">
             <div className="opacity-40"><QrCode size={40} /></div>
             <div className="text-right">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Visa Comptable / Direction</p>
                <div className="w-48 h-px bg-slate-900 mt-10"></div>
             </div>
          </div>
      </div>

      {selectedSale && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[100] flex items-center justify-center p-4 sm:p-10 animate-fadeIn">
          <div className="bg-white w-full max-w-4xl rounded-[2rem] shadow-2xl overflow-hidden animate-scaleIn flex flex-col max-h-full border border-white/20">
            <div className="px-8 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/80 backdrop-blur-md no-print sticky top-0 z-10">
              <div className="flex items-center space-x-3">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Document #{selectedSale.id.slice(-6)}</span>
                <span className={`px-2.5 py-1 text-[9px] font-black rounded-lg uppercase tracking-widest ${getStatusStyle(selectedSale.status)}`}>{selectedSale.status}</span>
              </div>
              <div className="flex items-center space-x-2">
                <button onClick={() => window.print()} className="bg-slate-900 text-white px-5 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center shadow-xl hover:bg-black transition-all"><Printer size={16} className="mr-2" /> PDF / Imprimer</button>
                <button onClick={() => setSelectedSale(null)} className="p-2 text-slate-400 hover:text-rose-500 transition-all"><X size={24} /></button>
              </div>
            </div>

            <div id="invoice-print-area" className="p-10 sm:p-16 overflow-y-auto bg-white flex-1 text-slate-950 scrollbar-hide relative">
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-12 pb-12 border-b border-slate-100">
                  <div className="space-y-6">
                    <AppLogoDoc className="w-20 h-20" />
                    <div className="space-y-1">
                      <h2 className="text-2xl font-black uppercase tracking-tighter leading-none">{config.companyName}</h2>
                      <p className="text-[10px] font-black text-purple-600 uppercase tracking-[0.3em] mb-4">{config.companySlogan}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <h1 className="text-4xl font-black uppercase tracking-tighter text-slate-900 mb-2">{selectedSale.status === 'quotation' ? 'Devis' : 'Commande'}</h1>
                    <p className="text-xl font-mono font-black text-purple-600 tracking-tighter">REF-{selectedSale.id.slice(-8)}</p>
                    <p className="text-xs font-black bg-slate-100 px-3 py-1 rounded-lg mt-4">{selectedSale.date}</p>
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-slate-200 overflow-hidden mb-12 shadow-sm">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-900 text-white">
                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em]">Désignation de l'article</th>
                        <th className="px-8 py-5 text-center text-[10px] font-black uppercase tracking-[0.2em]">Qté</th>
                        <th className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-[0.2em]">Total TTC</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedSale.items?.map((item, idx) => (
                        <tr key={idx} className={`group hover:bg-slate-50 transition-colors ${selectedSale.status === 'refunded' ? 'opacity-40 line-through' : ''}`}>
                          <td className="px-8 py-6 font-black uppercase text-xs text-slate-900">{item.name}</td>
                          <td className="px-8 py-6 text-center"><span className="bg-slate-100 px-3 py-1 rounded-lg font-black text-xs">{item.quantity}</span></td>
                          <td className="px-8 py-6 text-right font-black text-xs tracking-tighter">{(item.quantity * item.price).toLocaleString()} {config.currency}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-col items-end mb-16">
                   <div className="w-[320px] bg-slate-950 text-white p-8 rounded-[2.5rem] shadow-2xl flex flex-col items-center">
                      <p className="text-[10px] font-black uppercase tracking-[0.4em] mb-4 opacity-40">NET À PAYER TTC</p>
                      <div className="flex items-baseline">
                        <span className="text-5xl font-black font-mono tracking-tighter leading-none">{selectedSale.total.toLocaleString()}</span>
                        <span className="text-md font-bold ml-2 text-purple-500 uppercase">{config.currency}</span>
                      </div>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 no-print">
        <div>
           <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Journal de Vente</h1>
           <p className="text-sm text-slate-500 font-medium">Flux commercial et archivage de données</p>
        </div>
        <div className="flex items-center space-x-3">
           <button 
             onClick={handleExportJournalPDF}
             className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center shadow-sm"
           >
             <FileDown size={18} className="mr-2 text-rose-600" /> Export Journal PDF
           </button>
           <button onClick={() => notify("Info", "Exportation globale Excel en cours...")} className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center shadow-sm"><FileSpreadsheet size={18} className="mr-2 text-emerald-600" /> Journal Excel</button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border-2 border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex-1 no-print">
        <div className="flex border-b border-slate-100 dark:border-slate-800 overflow-x-auto scrollbar-hide bg-slate-50/30">
          {(['all', 'quotation', 'confirmed', 'delivered', 'refunded'] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] transition-all border-b-4 whitespace-nowrap ${activeTab === tab ? 'border-purple-600 text-purple-600 bg-white dark:bg-slate-800' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
              <span>{tab === 'all' ? 'Toutes les ventes' : tab === 'quotation' ? 'Devis' : tab === 'confirmed' ? 'Commandes' : tab === 'delivered' ? 'Livrées' : 'Remboursées'}</span>
            </button>
          ))}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
               <tr className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Référence</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest">Client</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-right">Montant</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-center">Statut</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-right">Actions</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {filteredSales.map((sale) => (
                <tr key={sale.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all group ${sale.status === 'refunded' ? 'opacity-60' : ''}`}>
                  <td className="px-8 py-5 text-xs font-black text-purple-600 font-mono tracking-tighter">#{sale.id.slice(-8)}</td>
                  <td className="px-8 py-5"><div className="flex flex-col"><span className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase">{sale.customer}</span><span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{sale.date}</span></div></td>
                  <td className={`px-8 py-5 text-sm font-black text-right text-slate-900 dark:text-white ${sale.status === 'refunded' ? 'line-through text-rose-500' : ''}`}>{sale.total.toLocaleString()} {config.currency}</td>
                  <td className="px-8 py-5 text-center"><span className={`inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${getStatusStyle(sale.status)}`}>{sale.status}</span></td>
                  <td className="px-8 py-5 text-right"><button onClick={() => setSelectedSale(sale)} className="bg-slate-900 text-white px-4 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-purple-600 transition-all shadow-sm">Consulter</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Sales;
