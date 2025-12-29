
import React, { useState } from 'react';
import { Product, ERPConfig, UserRole, ViewType, RolePermission } from '../types';
import { Save, Plus, Trash2, Edit3, Building2, Phone, MapPin, List, Layers, ShieldCheck } from 'lucide-react';

interface Props {
  products: Product[];
  onUpdateProducts: (products: Product[]) => void;
  config: ERPConfig;
  onUpdateConfig: (config: ERPConfig) => void;
  rolePermissions: RolePermission[];
  onUpdatePermissions: (perms: RolePermission[]) => void;
  notify: (title: string, message: string, type?: 'success' | 'info' | 'warning') => void;
  userPermissions: ViewType[];
}

const Settings: React.FC<Props> = ({ products, config, onUpdateConfig, rolePermissions, onUpdatePermissions, notify }) => {
  const [activeTab, setActiveTab] = useState<'general' | 'categories' | 'security'>('general');
  const [formConfig, setFormConfig] = useState<ERPConfig>(config);
  const [newCat, setNewCat] = useState('');

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateConfig(formConfig);
    notify("Succès", "Paramètres enregistrés avec succès.", 'success');
  };

  const addCategory = () => {
    if (!newCat.trim()) return;
    if (formConfig.categories.includes(newCat)) {
      notify("Attention", "Cette catégorie existe déjà.", 'warning');
      return;
    }
    const updated = { ...formConfig, categories: [...formConfig.categories, newCat.trim()] };
    setFormConfig(updated);
    onUpdateConfig(updated);
    setNewCat('');
    notify("Succès", `Catégorie ${newCat} ajoutée.`, 'success');
  };

  const removeCategory = (cat: string) => {
    const updated = { ...formConfig, categories: formConfig.categories.filter(c => c !== cat) };
    setFormConfig(updated);
    onUpdateConfig(updated);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fadeIn pb-10">
      <div className="flex space-x-2 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 w-fit">
        <button onClick={() => setActiveTab('general')} className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'general' ? 'bg-slate-900 text-white' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>Entreprise</button>
        <button onClick={() => setActiveTab('categories')} className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'categories' ? 'bg-slate-900 text-white' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>Catégories</button>
        <button onClick={() => setActiveTab('security')} className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'security' ? 'bg-slate-900 text-white' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>Sécurité</button>
      </div>

      {activeTab === 'general' && (
        <form onSubmit={handleSaveConfig} className="bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm space-y-8 animate-fadeIn">
          <h2 className="text-xl font-black uppercase tracking-tighter">Profil de l'Établissement</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center"><Building2 size={12} className="mr-2"/> Nom Commercial</label>
              <input value={formConfig.companyName} onChange={e => setFormConfig({...formConfig, companyName: e.target.value})} className="w-full px-5 py-4 border-2 rounded-2xl dark:bg-slate-800 dark:border-slate-700 font-bold outline-none focus:border-purple-500" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center"><Phone size={12} className="mr-2"/> Téléphone</label>
              <input value={formConfig.phone} onChange={e => setFormConfig({...formConfig, phone: e.target.value})} className="w-full px-5 py-4 border-2 rounded-2xl dark:bg-slate-800 dark:border-slate-700 font-bold" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center"><MapPin size={12} className="mr-2"/> Adresse</label>
              <input value={formConfig.address} onChange={e => setFormConfig({...formConfig, address: e.target.value})} className="w-full px-5 py-4 border-2 rounded-2xl dark:bg-slate-800 dark:border-slate-700 font-bold" />
            </div>
          </div>
          <div className="pt-6 border-t border-slate-100 flex justify-end">
            <button type="submit" className="bg-purple-600 text-white px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl flex items-center hover:bg-purple-700 transition-all"><Save size={18} className="mr-3" /> Enregistrer</button>
          </div>
        </form>
      )}

      {activeTab === 'categories' && (
        <div className="bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm space-y-8 animate-fadeIn">
          <h2 className="text-xl font-black uppercase tracking-tighter">Master List des Catégories</h2>
          <div className="flex space-x-4">
            <input value={newCat} onChange={e => setNewCat(e.target.value)} placeholder="Nouvelle catégorie (ex: Pizza)..." className="flex-1 px-5 py-4 border-2 rounded-2xl dark:bg-slate-800 dark:border-slate-700 font-bold outline-none focus:border-purple-500" />
            <button onClick={addCategory} className="bg-slate-900 text-white px-8 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg flex items-center"><Plus size={18} className="mr-2"/> Ajouter</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {formConfig.categories.map(cat => (
              <div key={cat} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 group transition-all hover:border-purple-200">
                <span className="text-[10px] font-black uppercase text-slate-600 dark:text-slate-300 tracking-widest">{cat}</span>
                <button onClick={() => removeCategory(cat)} className="text-slate-300 hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100"><Trash2 size={14}/></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm space-y-8 animate-fadeIn">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black uppercase tracking-tighter">Permissions par Rôle</h2>
            <div className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[9px] font-black tracking-widest uppercase border border-emerald-100">Système Protégé</div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">
                  <th className="px-4 py-4">Module</th>
                  <th className="px-4 py-4 text-center">Admin</th>
                  <th className="px-4 py-4 text-center">Manager</th>
                  <th className="px-4 py-4 text-center">Caissier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {['pos', 'sales', 'inventory', 'hr', 'settings', 'reports'].map(view => (
                  <tr key={view} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    <td className="px-4 py-4 text-xs font-black uppercase text-slate-700 dark:text-slate-200">{view}</td>
                    {['admin', 'manager', 'cashier'].map(role => (
                      <td key={role} className="px-4 py-4 text-center">
                        <div className={`w-6 h-6 rounded-full mx-auto flex items-center justify-center ${role === 'admin' || (role === 'manager' && view !== 'settings') || (role === 'cashier' && (view === 'pos' || view === 'sales')) ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-300'}`}>
                          <ShieldCheck size={14} />
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
