
import React, { useState, useMemo } from 'react';
import { Product, ERPConfig } from '../types';
import { Package, Search, Plus, Edit3, Trash2 } from 'lucide-react';

interface Props {
  products: Product[];
  onUpdate: (products: Product[]) => void;
  config: ERPConfig;
}

const Inventory: React.FC<Props> = ({ products, onUpdate, config }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProducts = useMemo(() => {
    return products
      .filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p.sku.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [products, searchTerm]);

  return (
    <div className="space-y-6 animate-fadeIn pb-10">
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
          <button className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 flex items-center shadow-sm">
            <Plus size={18} className="mr-2" /> Ajouter Article
          </button>
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
                <th className="px-6 py-4 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Actions</th>
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
                    <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-[10px] font-bold dark:text-slate-400">{product.category}</span>
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
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1.5 text-slate-400 hover:text-purple-600 transition-colors"><Edit3 size={16} /></button>
                      <button className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"><Trash2 size={16} /></button>
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

export default Inventory;
