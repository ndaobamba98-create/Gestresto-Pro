
import React, { useState, useMemo } from 'react';
import { Product, ERPConfig, UserRole, ViewType, RolePermission } from '../types';
import { Save, Plus, Trash2, Edit3, Building2, Layers, ShieldCheck, Lock, ChevronUp, ChevronDown, Check, X } from 'lucide-react';

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

const Settings: React.FC<Props> = ({ products, onUpdateProducts, config, onUpdateConfig, rolePermissions, onUpdatePermissions, notify }) => {
  const [activeTab, setActiveTab] = useState<'general' | 'categories' | 'security'>('general');
  const [formConfig, setFormConfig] = useState<ERPConfig>(config);
  const [newCat, setNewCat] = useState('');
  const [editingCatIndex, setEditingCatIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState('');
  
  const [localPermissions, setLocalPermissions] = useState<RolePermission[]>(rolePermissions);

  // Tri alphabétique dynamique pour l'affichage
  const sortedCategories = useMemo(() => 
    [...formConfig.categories].sort((a, b) => a.localeCompare(b))
  , [formConfig.categories]);

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateConfig(formConfig);
    notify("Succès", "Paramètres entreprise enregistrés.", 'success');
  };

  const handleTogglePermission = (role: UserRole, view: ViewType) => {
    if (role === 'admin' && view === 'settings') {
      notify("Action interdite", "L'administrateur doit garder l'accès aux paramètres.", 'warning');
      return;
    }

    const updatedPermissions = localPermissions.map(rp => {
      if (rp.role === role) {
        const hasPermission = rp.allowedViews.includes(view);
        return {
          ...rp,
          allowedViews: hasPermission 
            ? rp.allowedViews.filter(v => v !== view)
            : [...rp.allowedViews, view]
        };
      }
      return rp;
    });
    setLocalPermissions(updatedPermissions);
  };

  const handleSavePermissions = () => {
    onUpdatePermissions(localPermissions);
    notify("Sécurité mise à jour", "Les droits d'accès ont été modifiés avec succès.", 'success');
  };

  // --- LOGIQUE CATÉGORIES ---

  const addCategory = () => {
    if (!newCat.trim()) return;
    if (formConfig.categories.includes(newCat.trim())) {
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
    notify("Catégorie supprimée", cat, "info");
  };

  const startEditCategory = (catName: string) => {
    const realIndex = formConfig.categories.indexOf(catName);
    setEditingCatIndex(realIndex);
    setEditingValue(catName);
  };

  const saveEditedCategory = (index: number) => {
    const oldValue = formConfig.categories[index];
    const newValue = editingValue.trim();

    if (!newValue || newValue === oldValue) {
      setEditingCatIndex(null);
      return;
    }

    // Mettre à jour les produits associés pour ne pas perdre leur lien
    const updatedProducts = products.map(p => 
      p.category === oldValue ? { ...p, category: newValue } : p
    );
    onUpdateProducts(updatedProducts);

    const newCategories = [...formConfig.categories];
    newCategories[index] = newValue;

    const updated = { ...formConfig, categories: newCategories };
    setFormConfig(updated);
    onUpdateConfig(updated);
    setEditingCatIndex(null);
    notify("Catégorie modifiée", `"${oldValue}" est devenu "${newValue}".`, 'success');
  };

  const availableViews: { id: ViewType, label: string }[] = [
    { id: 'dashboard', label: 'Tableau de Bord / Bilan' },
    { id: 'pos', label: 'Caisse POS' },
    { id: 'sales', label: 'Gestion des Ventes' },
    { id: 'invoicing', label: 'Facturation & Avoirs' },
    { id: 'inventory', label: 'Inventaire & Menu' },
    { id: 'reports', label: 'Analyses & Rapports' },
    { id: 'attendances', label: 'Pointages (Présences)' },
    { id: 'hr', label: 'Ressources Humaines' },
    { id: 'settings', label: 'Paramètres Système' },
  ];

  const roles: UserRole[] = ['admin', 'manager', 'cashier'];

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fadeIn pb-10">
      <div className="flex space-x-2 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 w-fit shadow-sm">
        <button onClick={() => setActiveTab('general')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'general' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>Entreprise</button>
        <button onClick={() => setActiveTab('categories')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'categories' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>Catégories</button>
        <button onClick={() => setActiveTab('security')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'security' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>Sécurité & Accès</button>
      </div>

      {activeTab === 'general' && (
        <form onSubmit={handleSaveConfig} className="bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm space-y-8 animate-fadeIn">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black uppercase tracking-tighter">Profil de l'Établissement</h2>
            <Building2 className="text-purple-600" size={24} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center">Nom du Restaurant</label>
              <input value={formConfig.companyName} onChange={e => setFormConfig({...formConfig, companyName: e.target.value})} className="w-full px-5 py-4 border-2 rounded-2xl dark:bg-slate-800 border-slate-100 dark:border-slate-700 font-bold outline-none focus:border-purple-500 transition-all" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center">Slogan / Devise</label>
              <input value={formConfig.companySlogan} onChange={e => setFormConfig({...formConfig, companySlogan: e.target.value})} className="w-full px-5 py-4 border-2 rounded-2xl dark:bg-slate-800 border-slate-100 dark:border-slate-700 font-bold outline-none focus:border-purple-500 transition-all" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center">Contact Téléphonique</label>
              <input value={formConfig.phone} onChange={e => setFormConfig({...formConfig, phone: e.target.value})} className="w-full px-5 py-4 border-2 rounded-2xl dark:bg-slate-800 border-slate-100 dark:border-slate-700 font-bold outline-none focus:border-purple-500 transition-all" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center">Email Professionnel</label>
              <input value={formConfig.email} onChange={e => setFormConfig({...formConfig, email: e.target.value})} className="w-full px-5 py-4 border-2 rounded-2xl dark:bg-slate-800 border-slate-100 dark:border-slate-700 font-bold outline-none focus:border-purple-500 transition-all" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center">Adresse Géographique</label>
              <input value={formConfig.address} onChange={e => setFormConfig({...formConfig, address: e.target.value})} className="w-full px-5 py-4 border-2 rounded-2xl dark:bg-slate-800 border-slate-100 dark:border-slate-700 font-bold outline-none focus:border-purple-500 transition-all" />
            </div>
          </div>
          <div className="pt-6 border-t border-slate-50 dark:border-slate-800 flex justify-end">
            <button type="submit" className="bg-purple-600 text-white px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl flex items-center hover:bg-purple-700 active:scale-95 transition-all"><Save size={18} className="mr-3" /> Appliquer les Changements</button>
          </div>
        </form>
      )}

      {activeTab === 'categories' && (
        <div className="bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm space-y-8 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <h2 className="text-xl font-black uppercase tracking-tighter">Organisation du Menu (A-Z)</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Le système trie automatiquement les catégories par ordre alphabétique</p>
            </div>
            <Layers className="text-purple-600" size={24} />
          </div>
          <div className="flex space-x-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-3xl border border-slate-100 dark:border-slate-800">
            <input 
              value={newCat} 
              onChange={e => setNewCat(e.target.value)} 
              onKeyDown={e => e.key === 'Enter' && addCategory()} 
              placeholder="Nom de la nouvelle catégorie..." 
              className="flex-1 px-5 py-3 border-2 rounded-2xl dark:bg-slate-900 border-slate-100 dark:border-slate-700 font-bold outline-none focus:border-purple-500 transition-all" 
            />
            <button onClick={addCategory} className="bg-purple-600 text-white px-8 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg flex items-center hover:bg-purple-700 active:scale-95 transition-all"><Plus size={18} className="mr-2"/> Ajouter</button>
          </div>
          
          <div className="space-y-3">
            {sortedCategories.map((cat) => {
              const realIndex = formConfig.categories.indexOf(cat);
              const isEditing = editingCatIndex === realIndex;
              
              return (
                <div key={cat} className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-50 dark:border-slate-800 group hover:border-purple-200 dark:hover:border-purple-900/50 transition-all">
                  <div className="flex items-center space-x-4">
                    {isEditing ? (
                      <div className="flex items-center space-x-2 animate-fadeIn">
                        <input 
                          autoFocus
                          value={editingValue}
                          onChange={e => setEditingValue(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && saveEditedCategory(realIndex)}
                          className="px-3 py-1 bg-slate-100 dark:bg-slate-800 border rounded-lg font-bold text-sm outline-none border-purple-500"
                        />
                        <button onClick={() => saveEditedCategory(realIndex)} className="text-emerald-500 p-1 hover:bg-emerald-50 rounded-lg"><Check size={16}/></button>
                        <button onClick={() => setEditingCatIndex(null)} className="text-rose-500 p-1 hover:bg-rose-50 rounded-lg"><X size={16}/></button>
                      </div>
                    ) : (
                      <span className="text-sm font-black uppercase text-slate-700 dark:text-slate-200 tracking-wider ml-4">{cat}</span>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-all">
                    {!isEditing && (
                      <button 
                        onClick={() => startEditCategory(cat)} 
                        className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-xl transition-all"
                      >
                        <Edit3 size={16}/>
                      </button>
                    )}
                    <button 
                      onClick={() => removeCategory(cat)} 
                      className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all"
                    >
                      <Trash2 size={16}/>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="p-6 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/30">
            <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest leading-relaxed">
              Astuce : Les catégories et les plats sont maintenant triés automatiquement par ordre alphabétique de A à Z dans toute l'application. Le renommage d'une catégorie mettra également à jour les produits déjà enregistrés.
            </p>
          </div>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm space-y-8 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h2 className="text-xl font-black uppercase tracking-tighter">Gestion des Accès</h2>
              <div className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 px-3 py-1 rounded-full text-[9px] font-black tracking-widest uppercase border border-emerald-100 dark:border-emerald-800">Système de Rôles Odoo-Style</div>
            </div>
            <button 
              onClick={handleSavePermissions}
              className="bg-purple-600 text-white px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg hover:bg-purple-700 active:scale-95 transition-all flex items-center"
            >
              <Save size={16} className="mr-2" /> Enregistrer les Droits
            </button>
          </div>

          <div className="overflow-x-auto rounded-3xl border border-slate-100 dark:border-slate-800 shadow-inner">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white">
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest">Module / Vue</th>
                  {roles.map(role => (
                    <th key={role} className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-center">{role}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {availableViews.map(view => (
                  <tr key={view.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className="text-xs font-black uppercase text-slate-700 dark:text-slate-200 group-hover:text-purple-600 transition-colors">{view.label}</span>
                        <span className="text-[9px] font-bold text-slate-400 mt-0.5 font-mono">{view.id}</span>
                      </div>
                    </td>
                    {roles.map(role => {
                      const permissionsForRole = localPermissions.find(p => p.role === role);
                      const isAllowed = permissionsForRole?.allowedViews.includes(view.id);
                      const isLocked = role === 'admin' && view.id === 'settings';

                      return (
                        <td key={role} className="px-8 py-5 text-center">
                          <button 
                            disabled={isLocked}
                            onClick={() => handleTogglePermission(role, view.id)}
                            className={`w-12 h-6 rounded-full relative transition-all duration-300 ${
                              isAllowed 
                                ? 'bg-purple-600' 
                                : 'bg-slate-200 dark:bg-slate-700'
                            } ${isLocked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                          >
                            <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-300 ${isAllowed ? 'translate-x-6' : 'translate-x-0'}`}>
                              {isLocked && <Lock size={8} className="m-auto mt-1 text-slate-400" />}
                            </div>
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl flex items-start space-x-4 border border-slate-100 dark:border-slate-700">
             <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-lg">
                <ShieldCheck size={20} />
             </div>
             <div>
                <h4 className="text-xs font-black uppercase text-slate-700 dark:text-slate-200">Conseil de Sécurité</h4>
                <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Soyez prudent lors de la modification des permissions. L'Administrateur a des droits protégés sur les paramètres pour garantir qu'il puisse toujours restaurer les accès. Les modifications sont appliquées dès l'enregistrement et impactent instantanément les menus de tous les utilisateurs connectés.
                </p>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
