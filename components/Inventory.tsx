
import React, { useState, useMemo } from 'react';
import { Product, ERPConfig } from '../types';
import { Package, Search, Plus, Edit3, Trash2, AlertTriangle, X, Download, Save, Hash, Tag, DollarSign, UtensilsCrossed } from 'lucide-react';
import * as XLSX from 'xlsx';

interface Props {
  products: Product[];
  onUpdate: (products: Product[]) => void;
  config: ERPConfig;
  userRole: string;
}

const Inventory: React.FC<Props> = ({ products, onUpdate, config, userRole }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string, name: string } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);

  const canEdit = userRole === 'admin' || userRole === 'manager';

  const categories = useMemo(() => {
    return Array.from(new Set(products.map(p => p.category))).sort();
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products
      .filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p.sku.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [products, searchTerm]);

  const handleDelete = () => {
    if (deleteConfirm) {
      onUpdate(products.filter(p => p.id !== deleteConfirm.id));
      setDeleteConfirm(null);
    }
  };

  const handleOpenAddModal = () => {
    setEditingProduct({
      id: `P${Date.now()}`,
      name: '',
      sku: `SKU-${Date.now().toString().slice(-4)}`,
      category: categories[0] || 'Divers',
      price: 0,
      stock: 999
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || !editingProduct.name) return;

    const productToSave = editingProduct as Product;
    const exists = products.find(p => p.id === productToSave.id);

    if (exists) {
      onUpdate(products.map(p => p.id === productToSave.id ? productToSave : p));
    } else {
      onUpdate([...products, productToSave].sort((a, b) => a.name.localeCompare(b.name)));
    }
    
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleExportExcel = () => {
    const dataToExport = filteredProducts.map(p => ({
      'Désignation': p.name,
      'Code SKU': p.sku,
      'Catégorie': p.category,
      'Prix Unitaire': p.price,
      'Devise': config.currency,
      'Stock Actuel': p.stock
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Inventaire");

    const wscols = [{ wch: 40 }, { wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 10 }, { wch: 15 }];
    worksheet['!cols'] = wscols;

    const fileName = `Inventaire_MYA_DOR_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      {/* Modal CRUD Produit */}
      {isModalOpen && editingProduct && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-scaleIn border border-slate-200 dark:border-slate-800">
            <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-purple-600 text-white rounded-xl shadow-lg">
                  <Package size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">
                    {products.find(p => p.id === editingProduct.id) ? 'Modifier' : 'Nouveau'} Article
                  </h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fiche Stock & Menu</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-rose-500 transition-colors"><X size={24} /></button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Désignation du plat / article</label>
                  <input 
                    type="text" 
                    required 
                    autoFocus
                    value={editingProduct.name} 
                    onChange={e => setEditingProduct({...editingProduct, name: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                    placeholder="Ex: Tacos Mixte"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Prix de vente ({config.currency})</label>
                  <input 
                    type="number" 
                    required 
                    value={editingProduct.price || ''} 
                    onChange={e => setEditingProduct({...editingProduct, price: parseFloat(e.target.value) || 0})}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none transition-all font-black"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Catégorie</label>
                  <select 
                    value={editingProduct.category} 
                    onChange={e => setEditingProduct({...editingProduct, category: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none transition-all appearance-none"
                  >
                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    {!categories.includes(editingProduct.category || '') && <option value={editingProduct.category}>{editingProduct.category}</option>}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Code SKU / Interne</label>
                  <input 
                    type="text" 
                    required 
                    value={editingProduct.sku} 
                    onChange={e => setEditingProduct({...editingProduct, sku: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Stock Disponible</label>
                  <input 
                    type="number" 
                    required 
                    value={editingProduct.stock || ''} 
                    onChange={e => setEditingProduct({...editingProduct, stock: parseInt(e.target.value) || 0})}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex space-x-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all uppercase text-[10px] tracking-widest">Annuler</button>
                <button type="submit" className="flex-[2] bg-purple-600 text-white py-3 rounded-xl font-black shadow-lg shadow-purple-900/20 hover:bg-purple-700 transition-all uppercase text-[10px] tracking-widest flex items-center justify-center">
                  <Save size={16} className="mr-2" /> Enregistrer l'article
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden animate-scaleIn border border-slate-200 dark:border-slate-800 p-8 flex flex-col items-center">
            <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-full flex items-center justify-center mb-6">
              <AlertTriangle size={32} />
            </div>
            <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2 text-center">Confirmation</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm text-center mb-8">
              Voulez-vous vraiment supprimer <span className="font-bold text-slate-900 dark:text-slate-100">"{deleteConfirm.name}"</span> ? Cette action est irréversible.
            </p>
            <div className="grid grid-cols-2 gap-3 w-full">
              <button onClick={() => setDeleteConfirm(null)} className="py-3 px-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold rounded-2xl hover:bg-slate-200 transition-all text-xs uppercase tracking-widest">Annuler</button>
              <button onClick={handleDelete} className="py-3 px-4 bg-rose-600 text-white font-bold rounded-2xl hover:bg-rose-700 shadow-lg shadow-rose-900/20 transition-all text-xs uppercase tracking-widest">Supprimer</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Gestion des Stocks</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Menu, Ingrédients et Boissons</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Rechercher plat..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 dark:text-slate-100 transition-colors"
            />
          </div>
          <button 
            onClick={handleExportExcel}
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center shadow-sm transition-colors"
          >
            <Download size={18} className="mr-2" /> Exporter Excel
          </button>
          {canEdit && (
            <button 
              onClick={handleOpenAddModal}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 flex items-center shadow-sm transition-all active:scale-95"
            >
              <Plus size={18} className="mr-2" /> Ajouter Article
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-indigo-50 dark:bg-indigo-900/10 p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/30">
          <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1">Total Articles</p>
          <p className="text-2xl font-black text-indigo-900 dark:text-indigo-400">{products.length}</p>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-900/10 p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
          <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Valeur Stock</p>
          <p className="text-2xl font-black text-emerald-900 dark:text-emerald-400">
            {products.reduce((acc, p) => acc + (p.price * p.stock), 0).toLocaleString()} {config.currency}
          </p>
        </div>
        <div className="bg-rose-50 dark:bg-rose-900/10 p-4 rounded-xl border border-rose-100 dark:border-rose-900/30">
          <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-1">Rupture Proche</p>
          <p className="text-2xl font-black text-rose-900 dark:text-rose-400">{products.filter(p => p.stock < 20).length}</p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Catégories</p>
          <p className="text-2xl font-black text-slate-900 dark:text-slate-200">{new Set(products.map(p => p.category)).size}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                <th className="px-6 py-4 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Désignation</th>
                <th className="px-6 py-4 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Code SKU</th>
                <th className="px-6 py-4 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Catégorie</th>
                <th className="px-6 py-4 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Prix Unitaire</th>
                <th className="px-6 py-4 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Stock</th>
                {canEdit && <th className="px-6 py-4 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group">
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{product.name}</span>
                  </td>
                  <td className="px-6 py-4 text-xs font-mono text-slate-500 dark:text-slate-500">{product.sku}</td>
                  <td className="px-6 py-4">
                    <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-[10px] font-bold dark:text-slate-400 border border-slate-200 dark:border-slate-700">{product.category}</span>
                  </td>
                  <td className="px-6 py-4 text-sm font-black text-slate-900 dark:text-white">{product.price.toLocaleString()} {config.currency}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 w-24 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${product.stock < 20 ? 'bg-rose-500' : 'bg-emerald-500'}`} 
                          style={{width: `${Math.min((product.stock / 200) * 100, 100)}%`}}
                        ></div>
                      </div>
                      <span className={`text-[11px] font-bold ${product.stock < 20 ? 'text-rose-600' : 'text-slate-600 dark:text-slate-400'}`}>
                        {product.stock} u.
                      </span>
                    </div>
                  </td>
                  {canEdit && (
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleOpenEditModal(product)} className="p-1.5 text-slate-400 hover:text-purple-600 transition-colors"><Edit3 size={16} /></button>
                        <button 
                          onClick={() => setDeleteConfirm({ id: product.id, name: product.name })}
                          className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Inventory;
