
import React, { useState } from 'react';
import { SaleOrder, ERPConfig } from '../types';
import { 
  FileText, 
  Search, 
  Filter, 
  Plus, 
  Download, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  MoreVertical,
  Eye,
  Printer,
  Trash2,
  X,
  RotateCcw
} from 'lucide-react';

interface Props {
  sales: SaleOrder[];
  config: ERPConfig;
  onUpdate: (sales: SaleOrder[]) => void;
}

const Invoicing: React.FC<Props> = ({ sales, config, onUpdate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedInvoice, setSelectedInvoice] = useState<SaleOrder | null>(null);

  const invoices = sales.map(s => ({
    ...s,
    invoiceStatus: s.invoiceStatus || 'posted'
  }));

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = inv.customer.toLowerCase().includes(searchTerm.toLowerCase()) || inv.id.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || inv.invoiceStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleRefund = (id: string) => {
    if (window.confirm("Créer un avoir pour cette facture ?")) {
      const updatedSales = sales.map(s => 
        s.id === id ? { ...s, invoiceStatus: 'refunded' as const, status: 'refunded' as const } : s
      );
      onUpdate(updatedSales);
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'draft': return 'bg-slate-100 text-slate-600 border-slate-200';
      case 'posted': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'paid': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'cancelled': return 'bg-rose-50 text-rose-600 border-rose-100';
      case 'refunded': return 'bg-rose-100 text-rose-700 border-rose-200';
      default: return 'bg-slate-50 text-slate-500';
    }
  };

  const totals = {
    total: filteredInvoices.reduce((a, b) => {
      return b.invoiceStatus === 'refunded' ? a - b.total : a + b.total;
    }, 0),
    paid: filteredInvoices.filter(i => i.invoiceStatus === 'paid').reduce((a, b) => a + b.total, 0),
    due: filteredInvoices.filter(i => i.invoiceStatus === 'posted').reduce((a, b) => a + b.total, 0),
    refunded: filteredInvoices.filter(i => i.invoiceStatus === 'refunded').reduce((a, b) => a + b.total, 0),
  };

  return (
    <div className="h-full flex flex-col space-y-6 animate-fadeIn pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-white">Facturation</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Suivi des factures clients et règlements</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="N° Facture ou client..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 dark:text-slate-100 transition-all shadow-sm"
            />
          </div>
          <button className="bg-purple-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-purple-700 flex items-center shadow-lg shadow-purple-200 dark:shadow-none transition-all">
            <Plus size={18} className="mr-2" /> Créer Facture
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">C.A Net</p>
          <p className="text-2xl font-black text-slate-800 dark:text-white">{totals.total.toLocaleString()} {config.currency}</p>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-900/10 p-6 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 shadow-sm">
          <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Encaissé</p>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{totals.paid.toLocaleString()} {config.currency}</p>
        </div>
        <div className="bg-rose-50 dark:bg-rose-900/10 p-6 rounded-2xl border border-rose-100 dark:border-rose-900/30 shadow-sm">
          <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-1">Avoirs / Remb.</p>
          <p className="text-2xl font-black text-rose-600 dark:text-rose-400">{totals.refunded.toLocaleString()} {config.currency}</p>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/10 p-6 rounded-2xl border border-blue-100 dark:border-blue-900/30 shadow-sm">
          <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">Dû Clients</p>
          <p className="text-2xl font-black text-blue-600 dark:text-blue-400">{totals.due.toLocaleString()} {config.currency}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex-1 flex flex-col transition-colors">
        <div className="px-6 py-4 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex space-x-1">
            {['all', 'draft', 'posted', 'paid', 'refunded', 'cancelled'].map(status => (
              <button 
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                  statusFilter === status 
                    ? 'bg-slate-800 dark:bg-slate-700 text-white' 
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
              >
                {status === 'all' ? 'Toutes' : status === 'posted' ? 'Publiées' : status === 'refunded' ? 'Avoirs' : status}
              </button>
            ))}
          </div>
          <button className="text-slate-400 hover:text-purple-600 transition-colors">
            <Download size={18} />
          </button>
        </div>

        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 dark:border-slate-800">
                <th className="px-6 py-4">Numéro</th>
                <th className="px-6 py-4">Client</th>
                <th className="px-6 py-4">Paiement</th>
                <th className="px-6 py-4">Montant</th>
                <th className="px-6 py-4">Statut</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {filteredInvoices.map((inv) => (
                <tr key={inv.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group ${inv.invoiceStatus === 'refunded' ? 'bg-rose-50/20' : ''}`}>
                  <td className="px-6 py-4">
                    <span className="text-sm font-black text-purple-600 dark:text-purple-400 font-mono">#{inv.id}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{inv.customer}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[10px] font-black text-slate-500 uppercase bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                      {inv.paymentMethod || 'Non spécifié'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-sm font-black ${inv.invoiceStatus === 'refunded' ? 'text-rose-500 line-through' : 'text-slate-900 dark:text-white'}`}>
                      {inv.total.toLocaleString()} {config.currency}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${getStatusColor(inv.invoiceStatus)}`}>
                      {inv.invoiceStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {inv.invoiceStatus !== 'refunded' && (
                        <button 
                          onClick={() => handleRefund(inv.id)}
                          className="p-1.5 text-rose-400 hover:text-rose-600 transition-colors"
                          title="Rembourser"
                        >
                          <RotateCcw size={16} />
                        </button>
                      )}
                      <button className="p-1.5 text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"><Eye size={16} /></button>
                      <button className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"><Printer size={16} /></button>
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

export default Invoicing;
