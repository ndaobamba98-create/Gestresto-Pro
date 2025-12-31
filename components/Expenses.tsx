
import React, { useState, useMemo } from 'react';
import { Expense, Supplier, ERPConfig, Purchase, Product, Attachment, ViewType } from '../types';
import { 
  Plus, Search, Download, Trash2, Edit3, X, Filter, Wallet, Building, Tag, Calendar, Banknote, 
  ArrowUpRight, PieChart as PieIcon, CheckCircle2, Clock, AlertTriangle, Layers, Save, ShoppingBag, Eye, Paperclip, File, Printer, QrCode, CheckSquare, Square, FileSpreadsheet, FileDown
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { AppLogoDoc } from './Invoicing';

interface Props {
  expenses: Expense[];
  setExpenses: (expenses: Expense[]) => void;
  purchases: Purchase[];
  onAddPurchase: (purchase: Purchase) => void;
  onDeletePurchase: (id: string) => void;
  suppliers: Supplier[];
  setSuppliers: (suppliers: Supplier[]) => void;
  products: Product[];
  config: ERPConfig;
  userRole: string;
  notify: (title: string, message: string, type?: 'success' | 'info' | 'warning') => void;
  t: (key: any) => string;
}

const Expenses: React.FC<Props> = ({ expenses, setExpenses, purchases, onAddPurchase, onDeletePurchase, suppliers, setSuppliers, products, config, userRole, notify, t }) => {
  const [activeView, setActiveView] = useState<'expenses' | 'purchases' | 'suppliers'>('purchases');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('Tous');
  
  const [selectedPurchases, setSelectedPurchases] = useState<string[]>([]);
  
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [viewingPurchase, setViewingPurchase] = useState<Purchase | null>(null);
  
  const [editingExpense, setEditingExpense] = useState<Partial<Expense> | null>(null);
  const [editingPurchase, setEditingPurchase] = useState<Partial<Purchase> | null>(null);
  const [editingSupplier, setEditingSupplier] = useState<Partial<Supplier> | null>(null);

  const expenseCategories: Expense['category'][] = ['Loyer', 'Électricité/Eau', 'Salaires', 'Marketing', 'Maintenance', 'Divers', 'Achats Marchandises'];

  const filteredExpenses = useMemo(() => expenses.filter(exp => 
    exp.description.toLowerCase().includes(searchTerm.toLowerCase()) && 
    (categoryFilter === 'Tous' || exp.category === categoryFilter)
  ), [expenses, searchTerm, categoryFilter]);

  const filteredPurchases = useMemo(() => purchases.filter(p => 
    p.productName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.id.toLowerCase().includes(searchTerm.toLowerCase())
  ), [purchases, searchTerm]);

  const filteredSuppliers = useMemo(() => suppliers.filter(sup => 
    sup.name.toLowerCase().includes(searchTerm.toLowerCase())
  ), [suppliers, searchTerm]);

  const toggleSelectPurchase = (id: string) => {
    setSelectedPurchases(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAllPurchases = () => {
    if (selectedPurchases.length === filteredPurchases.length && filteredPurchases.length > 0) {
      setSelectedPurchases([]);
    } else {
      setSelectedPurchases(filteredPurchases.map(p => p.id));
    }
  };

  const handleFileUpload = (type: 'purchase' | 'expense', e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    (Array.from(files) as File[]).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const newAttachment: Attachment = { id: `ATT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, name: file.name, type: file.type, url: event.target?.result as string };
        if (type === 'purchase') {
          setEditingPurchase(prev => ({ ...prev, attachments: [...(prev?.attachments || []), newAttachment] }));
        } else {
          setEditingExpense(prev => ({ ...prev, attachments: [...(prev?.attachments || []), newAttachment] }));
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeAttachment = (type: 'purchase' | 'expense', id: string) => {
    if (type === 'purchase') {
      setEditingPurchase(prev => ({ ...prev, attachments: prev?.attachments?.filter(a => a.id !== id) }));
    } else {
      setEditingExpense(prev => ({ ...prev, attachments: prev?.attachments?.filter(a => a.id !== id) }));
    }
  };

  const exportPurchasesToExcel = (data: Purchase[]) => {
    const exportData = data.map(p => ({
      'ID Achat': p.id,
      'Date': p.date,
      'Produit': p.productName,
      'Fournisseur': p.supplierName,
      'Quantité': p.quantity,
      'Prix Unitaire': p.costPrice,
      'Total TTC': p.totalAmount,
      'Devise': config.currency,
      'Statut': p.status === 'received' ? 'REÇU' : 'EN ATTENTE'
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Journal des Achats");
    XLSX.writeFile(workbook, `Achats_Stock_${config.companyName.replace(/\s+/g, '_')}_${Date.now()}.xlsx`);
    notify("Export réussi", `${data.length} achats exportés en Excel.`, "success");
  };

  const handleExportExcel = () => {
    if (activeView === 'purchases') {
      exportPurchasesToExcel(filteredPurchases);
    } else if (activeView === 'expenses') {
      const data = filteredExpenses.map(e => ({
        'ID Charge': e.id,
        'Date': e.date,
        'Description': e.description,
        'Catégorie': e.category,
        'Montant': e.amount,
        'Méthode': e.paymentMethod,
        'Statut': e.status
      }));
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Charges");
      XLSX.writeFile(workbook, `Charges_${Date.now()}.xlsx`);
      notify("Export", "Frais exportés.", "success");
    } else {
      const data = filteredSuppliers.map(s => ({
        'Nom': s.name,
        'Contact': s.contact,
        'Téléphone': s.phone,
        'Catégorie': s.category
      }));
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Fournisseurs");
      XLSX.writeFile(workbook, `Fournisseurs_${Date.now()}.xlsx`);
      notify("Export", "Annuaire fournisseurs exporté.", "success");
    }
  };

  const handleExportSelectedPurchases = () => {
    const selected = purchases.filter(p => selectedPurchases.includes(p.id));
    exportPurchasesToExcel(selected);
    setSelectedPurchases([]);
  };

  const handleSavePurchase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPurchase || !editingPurchase.productId || !editingPurchase.quantity) return;
    const product = products.find(p => p.id === editingPurchase.productId);
    const supplier = suppliers.find(s => s.id === editingPurchase.supplierId);
    const newPurchase: Purchase = {
      id: `PUR-${Date.now()}`,
      productId: editingPurchase.productId!,
      productName: product?.name || 'Inconnu',
      supplierId: editingPurchase.supplierId || '',
      supplierName: supplier?.name || 'Inconnu',
      quantity: editingPurchase.quantity!,
      costPrice: editingPurchase.costPrice || 0,
      totalAmount: (editingPurchase.quantity! * (editingPurchase.costPrice || 0)),
      date: editingPurchase.date || new Date().toISOString().split('T')[0],
      status: 'received',
      attachments: editingPurchase.attachments || []
    };
    onAddPurchase(newPurchase);
    setIsPurchaseModalOpen(false);
    setEditingPurchase(null);
    notify("Achat Enregistré", `${newPurchase.productName} ajouté au stock.`, "success");
  };

  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExpense || !editingExpense.description || !editingExpense.amount) return;
    const newExp = { ...editingExpense, id: editingExpense.id || `EXP-${Date.now()}`, attachments: editingExpense.attachments || [] } as Expense;
    setExpenses(expenses.find(e => e.id === newExp.id) ? expenses.map(e => e.id === newExp.id ? newExp : e) : [newExp, ...expenses]);
    setIsExpenseModalOpen(false);
    notify("Succès", "Sortie enregistrée", "success");
  };

  return (
    <div className="h-full space-y-8 animate-fadeIn pb-10">
      {viewingPurchase && <PurchaseReceiptModal purchase={viewingPurchase} config={config} onClose={() => setViewingPurchase(null)} />}

      {/* BARRE D'ACTIONS FLOTTANTE POUR ACHATS SELECTIONNÉS */}
      {activeView === 'purchases' && selectedPurchases.length > 0 && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-8 py-4 rounded-[2rem] shadow-2xl z-[150] flex items-center space-x-8 animate-slideUp">
           <div className="flex items-center space-x-3 border-r border-slate-700 pr-8">
              <span className="bg-purple-600 w-8 h-8 rounded-full flex items-center justify-center font-black text-xs">{selectedPurchases.length}</span>
              <span className="text-xs font-black uppercase tracking-widest">Achats sélectionnés</span>
           </div>
           <div className="flex items-center space-x-4">
              <button onClick={handleExportSelectedPurchases} className="flex items-center text-[10px] font-black uppercase tracking-widest hover:text-emerald-400 transition-colors">
                <FileSpreadsheet size={18} className="mr-2 text-emerald-500" /> Export Excel
              </button>
              <div className="h-4 w-px bg-slate-700"></div>
              <button onClick={() => setSelectedPurchases([])} className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-rose-500">Annuler</button>
           </div>
        </div>
      )}

      {isPurchaseModalOpen && editingPurchase && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-scaleIn">
            <div className="p-8 bg-purple-600 text-white flex justify-between items-center"><h3 className="text-xl font-black uppercase tracking-tighter">Réception de Stock</h3><button onClick={() => setIsPurchaseModalOpen(false)}><X size={28}/></button></div>
            <form onSubmit={handleSavePurchase} className="p-8 space-y-6 max-h-[75vh] overflow-y-auto scrollbar-hide">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400">Produit</label>
                <select required value={editingPurchase.productId || ''} onChange={e => setEditingPurchase({...editingPurchase, productId: e.target.value})} className="w-full px-5 py-4 border-2 rounded-2xl dark:bg-slate-800 font-bold outline-none focus:border-purple-500">
                  <option value="">Choisir un produit...</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400">Qté</label><input type="number" required value={editingPurchase.quantity || ''} onChange={e => setEditingPurchase({...editingPurchase, quantity: parseInt(e.target.value) || 0})} className="w-full px-5 py-4 border-2 rounded-2xl dark:bg-slate-800 font-black text-xl" /></div>
                <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400">P.U Achat</label><input type="number" required value={editingPurchase.costPrice || ''} onChange={e => setEditingPurchase({...editingPurchase, costPrice: parseFloat(e.target.value) || 0})} className="w-full px-5 py-4 border-2 rounded-2xl dark:bg-slate-800 font-black text-xl" /></div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400">Fournisseur</label>
                <select required value={editingPurchase.supplierId || ''} onChange={e => setEditingPurchase({...editingPurchase, supplierId: e.target.value})} className="w-full px-5 py-4 border-2 rounded-2xl dark:bg-slate-800 font-bold outline-none focus:border-purple-500">
                  <option value="">Choisir un fournisseur...</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="space-y-3">
                 <label className="text-[10px] font-black uppercase text-slate-400 flex items-center"><Paperclip size={14} className="mr-2" /> Justificatif d'achat</label>
                 <div className="grid grid-cols-3 gap-3">
                   <label className="h-20 border-2 border-dashed rounded-2xl flex items-center justify-center text-slate-300 hover:text-purple-600 hover:border-purple-600 cursor-pointer transition-all">
                      <Plus size={24} />
                      <input type="file" multiple className="hidden" onChange={e => handleFileUpload('purchase', e)} />
                   </label>
                   {editingPurchase.attachments?.map(file => (
                     <div key={file.id} className="relative h-20 bg-slate-50 dark:bg-slate-800 rounded-2xl border flex flex-col items-center justify-center p-2 group">
                        <File size={16} className="text-purple-600 mb-1" />
                        <span className="text-[8px] font-bold text-center truncate w-full px-2">{file.name}</span>
                        <button type="button" onClick={() => removeAttachment('purchase', file.id)} className="absolute -top-1 -right-1 bg-rose-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={10}/></button>
                     </div>
                   ))}
                 </div>
              </div>
              <button type="submit" className="w-full py-5 bg-purple-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl">Valider l'achat</button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL FOURNISSEUR */}
      {isSupplierModalOpen && editingSupplier && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-scaleIn">
            <div className="p-8 bg-slate-900 text-white flex justify-between items-center"><h3 className="text-xl font-black uppercase tracking-tighter">Fiche Fournisseur</h3><button onClick={() => setIsSupplierModalOpen(false)}><X size={28}/></button></div>
            <div className="p-8 space-y-6">
               <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400">Raison Sociale</label><input value={editingSupplier.name} onChange={e => setEditingSupplier({...editingSupplier, name: e.target.value})} className="w-full px-5 py-4 border-2 rounded-2xl dark:bg-slate-800" /></div>
               <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400">Téléphone</label><input value={editingSupplier.phone} onChange={e => setEditingSupplier({...editingSupplier, phone: e.target.value})} className="w-full px-5 py-4 border-2 rounded-2xl dark:bg-slate-800" /></div>
               <button onClick={() => { if(editingSupplier.name) { setSuppliers([...suppliers, editingSupplier as Supplier]); setIsSupplierModalOpen(false); notify("Fournisseur", "Ajouté avec succès.", "success"); } }} className="w-full py-5 bg-purple-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest">Enregistrer Fournisseur</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div><h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Gestion des Sorties</h1><p className="text-sm text-slate-500 font-medium">Achats de marchandises et frais d'exploitation</p></div>
        <div className="flex items-center space-x-3">
          <div className="bg-white dark:bg-slate-900 p-1.5 rounded-2xl flex border shadow-sm">
            <button onClick={() => { setActiveView('purchases'); setSearchTerm(''); }} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeView === 'purchases' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>Achats Stock</button>
            <button onClick={() => { setActiveView('expenses'); setSearchTerm(''); }} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeView === 'expenses' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>Frais & Charges</button>
            <button onClick={() => { setActiveView('suppliers'); setSearchTerm(''); }} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeView === 'suppliers' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>Fournisseurs</button>
          </div>
          <button onClick={handleExportExcel} className="p-3 bg-white dark:bg-slate-900 border rounded-xl shadow-sm hover:bg-slate-50 transition-all text-slate-600 dark:text-slate-300" title="Exporter en Excel"><Download size={20}/></button>
          {activeView === 'purchases' && <button onClick={() => { setEditingPurchase({ date: new Date().toISOString().split('T')[0], attachments: [] }); setIsPurchaseModalOpen(true); }} className="bg-purple-600 text-white px-8 py-3.5 rounded-2xl text-xs font-black uppercase shadow-xl hover:bg-purple-700 transition-all flex items-center"><Plus size={18} className="mr-2" /> Nouvel Achat</button>}
          {activeView === 'suppliers' && <button onClick={() => { setEditingSupplier({ name: '', phone: '', contact: '', category: 'Alimentation' }); setIsSupplierModalOpen(true); }} className="bg-slate-900 text-white px-8 py-3.5 rounded-2xl text-xs font-black uppercase shadow-xl hover:bg-black transition-all flex items-center"><Plus size={18} className="mr-2" /> Nouveau Fournisseur</button>}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border-2 border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex-1 relative">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
           <div className="flex items-center space-x-4">
              {activeView === 'purchases' && (
                <button 
                  onClick={toggleSelectAllPurchases}
                  className="p-2 text-slate-400 hover:text-purple-600 transition-colors"
                >
                  {selectedPurchases.length === filteredPurchases.length && filteredPurchases.length > 0 ? <CheckSquare size={20} className="text-purple-600" /> : <Square size={20} />}
                </button>
              )}
              <div className="relative w-96">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder={`Chercher ${activeView === 'purchases' ? 'un achat' : activeView === 'expenses' ? 'une charge' : 'un fournisseur'}...`} className="w-full pl-12 pr-6 py-3 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-2xl text-[11px] font-bold outline-none focus:border-purple-500" />
              </div>
           </div>
           <div className="flex items-center space-x-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <span>{activeView === 'purchases' ? filteredPurchases.length : activeView === 'expenses' ? filteredExpenses.length : filteredSuppliers.length} résultats</span>
           </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b bg-slate-50/20">
                {activeView === 'purchases' && <th className="px-6 py-6 w-10"></th>}
                <th className="px-10 py-6">Désignation / Nom</th>
                <th className="px-10 py-6">Date / Contact</th>
                <th className="px-10 py-6 text-right">Montant / Info</th>
                <th className="px-10 py-6 text-center">Pièces</th>
                <th className="px-10 py-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {activeView === 'purchases' && filteredPurchases.map((p) => (
                <tr key={p.id} className={`hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-all group ${selectedPurchases.includes(p.id) ? 'bg-purple-50/50 dark:bg-purple-900/10' : ''}`}>
                  <td className="px-6 py-6 text-center">
                    <button onClick={() => toggleSelectPurchase(p.id)} className={`transition-colors ${selectedPurchases.includes(p.id) ? 'text-purple-600' : 'text-slate-200 dark:text-slate-700 hover:text-slate-400'}`}>
                       {selectedPurchases.includes(p.id) ? <CheckSquare size={18} /> : <Square size={18} />}
                    </button>
                  </td>
                  <td className="px-10 py-6 font-black text-purple-600 font-mono text-xs">#{p.id.slice(-6)} <br/><span className="text-[10px] text-slate-500 font-bold uppercase">{p.productName}</span></td>
                  <td className="px-10 py-6 font-bold uppercase text-xs text-slate-600 dark:text-slate-300">{p.date} <br/><span className="text-[10px] text-slate-400 font-medium">{p.supplierName}</span></td>
                  <td className="px-10 py-6 text-right font-black text-sm">{p.totalAmount.toLocaleString()} {config.currency}</td>
                  <td className="px-10 py-6 text-center">{p.attachments && p.attachments.length > 0 ? <Paperclip size={14} className="mx-auto text-purple-600" /> : <span className="opacity-10">-</span>}</td>
                  <td className="px-10 py-6 text-right"><div className="flex items-center justify-end space-x-2"><button onClick={() => setViewingPurchase(p)} className="p-3 bg-white dark:bg-slate-800 border rounded-2xl text-slate-400 hover:text-purple-600 hover:border-purple-500 transition-all shadow-sm"><Eye size={18} /></button><button onClick={() => onDeletePurchase(p.id)} className="p-3 bg-white dark:bg-slate-800 border rounded-2xl text-slate-400 hover:text-rose-500 hover:border-rose-500 transition-all shadow-sm"><Trash2 size={18} /></button></div></td>
                </tr>
              ))}
              {activeView === 'expenses' && filteredExpenses.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-all group">
                  <td className="px-10 py-6 font-black uppercase text-xs text-slate-800 dark:text-slate-200">{e.description}</td>
                  <td className="px-10 py-6 text-xs font-bold text-slate-500">{e.date}</td>
                  <td className="px-10 py-6 text-right font-black text-rose-600 text-sm">-{e.amount.toLocaleString()} {config.currency}</td>
                  <td className="px-10 py-6 text-center">{e.attachments && e.attachments.length > 0 ? <Paperclip size={14} className="mx-auto text-purple-600" /> : <span className="opacity-10">-</span>}</td>
                  <td className="px-10 py-6 text-right"><button onClick={() => setExpenses(expenses.filter(item => item.id !== e.id))} className="p-3 bg-white dark:bg-slate-800 border rounded-2xl text-slate-400 hover:text-rose-500 transition-all shadow-sm"><Trash2 size={18} /></button></td>
                </tr>
              ))}
              {activeView === 'suppliers' && filteredSuppliers.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-all group">
                  <td className="px-10 py-6 font-black uppercase text-sm text-slate-800 dark:text-slate-100">{s.name}</td>
                  <td className="px-10 py-6 text-xs font-bold text-slate-500">{s.contact}</td>
                  <td className="px-10 py-6 text-right font-black text-slate-700 dark:text-slate-300">{s.phone}</td>
                  <td className="px-10 py-6 text-center"></td>
                  <td className="px-10 py-6 text-right"><button className="p-3 bg-white dark:bg-slate-800 border rounded-2xl text-slate-400 hover:text-purple-600 transition-all shadow-sm"><Edit3 size={18} /></button></td>
                </tr>
              ))}
              {(activeView === 'purchases' && filteredPurchases.length === 0) || (activeView === 'expenses' && filteredExpenses.length === 0) || (activeView === 'suppliers' && filteredSuppliers.length === 0) ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center opacity-30">
                    <ShoppingBag size={48} className="mx-auto mb-4" />
                    <p className="font-black uppercase text-sm tracking-widest">Aucune donnée enregistrée</p>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const PurchaseReceiptModal = ({ purchase, config, onClose }: any) => {
  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[120] flex items-center justify-center p-4 sm:p-10 animate-fadeIn">
      <div className="bg-white w-full max-w-3xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-full border border-white/20">
        <div className="px-8 py-4 border-b flex justify-between items-center bg-slate-50 no-print sticky top-0 z-10">
          <div className="flex items-center space-x-3">
             <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Bon de Réception</span>
             <span className="px-2.5 py-1 bg-slate-900 text-white text-[9px] font-black rounded-lg uppercase tracking-widest">#{purchase.id.slice(-6)}</span>
          </div>
          <div className="flex items-center space-x-3">
             <button onClick={() => window.print()} className="bg-purple-600 text-white px-5 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center shadow-xl hover:bg-purple-700 transition-all"><Printer size={16} className="mr-2" /> Imprimer / PDF</button>
             <button onClick={onClose} className="p-2 text-slate-400 hover:text-rose-500 transition-all"><X size={24}/></button>
          </div>
        </div>

        <div id="invoice-print-area" className="p-10 sm:p-12 overflow-y-auto bg-white flex-1 text-slate-900 scrollbar-hide relative">
          <div className="flex justify-between items-start mb-16">
            <div className="space-y-4">
               <AppLogoDoc className="w-16 h-16" />
               <div>
                  <h2 className="text-2xl font-black uppercase tracking-tighter leading-none mb-1">{config.companyName}</h2>
                  <p className="text-[9px] font-black text-purple-600 uppercase tracking-[0.3em]">Gestion du Stock</p>
               </div>
            </div>
            <div className="text-right">
              <h2 className="text-3xl font-black uppercase tracking-tighter text-slate-900 mb-1">RECEPTION</h2>
              <p className="text-lg font-mono text-purple-600 font-black">REF-{purchase.id.slice(-8)}</p>
              <p className="text-xs font-bold text-slate-500 mt-2 uppercase">{purchase.date}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-10 mb-12 p-6 bg-slate-50 rounded-2xl border border-slate-100">
            <div>
               <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Fournisseur Émetteur</p>
               <h3 className="text-xl font-black uppercase tracking-tighter">{purchase.supplierName}</h3>
            </div>
            <div className="text-right">
               <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Statut Logistique</p>
               <p className="text-xs font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-3 py-1.5 rounded-full inline-block">Stock Réceptionné</p>
            </div>
          </div>

          <table className="w-full text-left mb-12">
            <thead>
              <tr className="border-b border-slate-950">
                <th className="py-4 text-[9px] uppercase font-black tracking-widest">Désignation de l'Article</th>
                <th className="py-4 text-center text-[9px] uppercase font-black tracking-widest">Qté reçue</th>
                <th className="py-4 text-right text-[9px] uppercase font-black tracking-widest">Valeur Entrée</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="py-6 font-black uppercase text-[11px] text-slate-900">{purchase.productName}</td>
                <td className="py-6 text-center font-bold text-[11px] font-mono">x{purchase.quantity}</td>
                <td className="py-6 text-right font-black text-[11px] font-mono">{purchase.totalAmount.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
          
          {purchase.attachments && purchase.attachments.length > 0 && (
            <div className="no-print border-t border-dashed pt-8 mb-12">
              <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Justificatifs numérisés</h4>
              <div className="grid grid-cols-2 gap-4">
                {purchase.attachments.map(att => (
                  <a key={att.id} href={att.url} target="_blank" rel="noopener noreferrer" className="flex items-center p-3 bg-slate-50 rounded-2xl border border-slate-100 hover:border-purple-500 transition-all group">
                    {att.type.startsWith('image/') ? <img src={att.url} className="w-10 h-10 object-cover rounded-lg mr-3 border" /> : <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center mr-3"><File size={16} className="text-purple-600" /></div>}
                    <div className="flex-1 overflow-hidden"><p className="text-[10px] font-black truncate uppercase tracking-widest">{att.name}</p></div>
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col items-end">
            <div className="bg-slate-950 text-white p-8 rounded-[2rem] flex flex-col items-center min-w-[280px] shadow-2xl">
              <p className="text-[9px] font-black uppercase tracking-[0.4em] opacity-40 mb-2">VALEUR TOTALE ACHAT</p>
              <div className="flex items-baseline">
                <span className="text-4xl font-black font-mono tracking-tighter leading-none">{purchase.totalAmount.toLocaleString()}</span>
                <span className="text-sm font-bold ml-2 uppercase text-purple-500">{config.currency}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Expenses;
