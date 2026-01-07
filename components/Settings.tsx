
import React, { useState, useMemo } from 'react';
import { Product, ERPConfig, UserRole, ViewType, RolePermission, Language, AppTheme } from '../types';
import { 
  Save, Plus, Trash2, Edit3, Building2, Layers, ShieldCheck, Lock, ChevronUp, ChevronDown, Check, X, 
  FileText, Percent, Hash, Info, Printer, QrCode, CreditCard, Layout, Languages, DollarSign, Type, Bell, Sun, Moon, Palette, Fingerprint, EyeOff, Eye, Sparkles, Image as ImageIcon, AlignLeft, Phone, Mail, MapPin, BadgeCheck, UtensilsCrossed, Search, ArrowUp, ArrowDown
} from 'lucide-react';

interface Props {
  products: Product[];
  onUpdateProducts: (products: Product[]) => void;
  config: ERPConfig;
  onUpdateConfig: (config: ERPConfig) => void;
  rolePermissions: RolePermission[];
  onUpdatePermissions: (perms: RolePermission[]) => void;
  notify: (title: string, message: string, type?: 'success' | 'info' | 'warning') => void;
  userPermissions: ViewType[];
  t: (key: any) => string;
}

const Settings: React.FC<Props> = ({ config, onUpdateConfig, rolePermissions, onUpdatePermissions, notify, t, userPermissions }) => {
  const [activeTab, setActiveTab] = useState<'general' | 'billing' | 'categories' | 'security'>('general');
  const [formConfig, setFormConfig] = useState<ERPConfig>(config);
  
  // États pour la gestion des catégories
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategoryIdx, setEditingCategoryIdx] = useState<number | null>(null);
  const [editCategoryName, setEditCategoryName] = useState('');

  const [localPermissions, setLocalPermissions] = useState<RolePermission[]>(rolePermissions);

  const handleSaveConfig = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onUpdateConfig(formConfig);
    notify("Configuration", "Modifications enregistrées avec succès.", 'success');
  };

  // LOGIQUE CATÉGORIES
  const handleAddCategory = () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;
    if (formConfig.categories.includes(trimmed)) {
      notify("Attention", "Cette catégorie existe déjà.", "warning");
      return;
    }
    // On ajoute à la fin sans trier pour respecter l'ordre manuel
    const updated = [...formConfig.categories, trimmed];
    setFormConfig({ ...formConfig, categories: updated });
    setNewCategoryName('');
    notify("Menu", `Catégorie "${trimmed}" ajoutée.`, "success");
  };

  const handleDeleteCategory = (cat: string) => {
    if (confirm(`Supprimer la catégorie "${cat}" ? Cela ne supprimera pas les produits associés.`)) {
      const updated = formConfig.categories.filter(c => c !== cat);
      setFormConfig({ ...formConfig, categories: updated });
      notify("Menu", "Catégorie supprimée.", "info");
    }
  };

  const startEditCategory = (index: number, currentName: string) => {
    setEditingCategoryIdx(index);
    setEditCategoryName(currentName);
  };

  const saveEditedCategory = () => {
    if (!editCategoryName.trim() || editingCategoryIdx === null) return;
    const updated = [...formConfig.categories];
    updated[editingCategoryIdx] = editCategoryName.trim();
    setFormConfig({ ...formConfig, categories: updated }); // Plus de tri auto ici
    setEditingCategoryIdx(null);
    notify("Menu", "Catégorie renommée.", "success");
  };

  const moveCategory = (index: number, direction: 'up' | 'down') => {
    const newIdx = direction === 'up' ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= formConfig.categories.length) return;

    const updated = [...formConfig.categories];
    const temp = updated[index];
    updated[index] = updated[newIdx];
    updated[newIdx] = temp;

    setFormConfig({ ...formConfig, categories: updated });
  };

  const handleTogglePermission = (role: UserRole, view: ViewType) => {
    if (role === 'admin' && view === 'settings') return;
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
    notify("Sécurité", "Droits d'accès mis à jour.", 'success');
  };

  const availableTabs = useMemo(() => {
    const tabs = [
      { id: 'general', label: 'Entreprise', icon: Building2, permission: 'settings' as ViewType },
      { id: 'billing', label: 'Facturation', icon: FileText, permission: 'invoicing' as ViewType },
      { id: 'categories', label: 'Menu POS', icon: Layers, permission: 'manage_categories' as ViewType },
      { id: 'security', label: 'Accès', icon: ShieldCheck, permission: 'manage_security' as ViewType },
    ];
    return tabs.filter(tab => userPermissions.includes(tab.permission));
  }, [userPermissions]);

  const availableViews: { id: ViewType, label: string }[] = [
    { id: 'dashboard', label: t('dashboard') },
    { id: 'pos', label: t('pos') },
    { id: 'sales', label: t('sales') + " (Consultation)" },
    { id: 'manage_sales', label: t('sales') + " (Exportation/Journal)" },
    { id: 'invoicing', label: t('invoicing') },
    { id: 'manage_invoicing', label: 'Création Factures' },
    { id: 'inventory', label: t('inventory') },
    { id: 'manage_inventory', label: 'Modif. Produits' },
    { id: 'manage_categories', label: 'Modif. Menu/Catégories' },
    { id: 'expenses', label: t('expenses') },
    { id: 'reports', label: t('reports') },
    { id: 'hr', label: t('hr') },
    { id: 'manage_hr', label: 'Modif. RH' },
    { id: 'attendances', label: t('attendances') },
    { id: 'settings', label: t('settings') },
    { id: 'manage_security', label: 'Gérer Accès/Rôles' },
    { id: 'manage_notifications', label: "Gérer Notifications" },
  ];

  const roles: UserRole[] = ['admin', 'manager', 'cashier'];

  const ConfigToggle = ({ label, icon: Icon, value, onChange }: { label: string, icon: any, value: boolean, onChange: (v: boolean) => void }) => (
    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
      <div className="flex items-center space-x-3">
        <div className={`p-2 rounded-lg ${value ? 'bg-purple-100 text-purple-600' : 'bg-slate-200 text-slate-400'}`}>
          <Icon size={16} />
        </div>
        <span className="text-[10px] font-black uppercase text-slate-700 dark:text-slate-300 tracking-widest">{label}</span>
      </div>
      <button 
        type="button"
        onClick={() => onChange(!value)}
        className={`w-10 h-5 rounded-full relative transition-all ${value ? 'bg-purple-600' : 'bg-slate-300 dark:bg-slate-700'}`}
      >
        <div className={`absolute top-1 left-1 w-3 h-3 rounded-full bg-white transition-transform ${value ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn pb-20 pr-2">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">{t('settings')}</h1>
          <p className="text-sm text-slate-500 font-medium">Configuration globale Sama Pos +</p>
        </div>
        <div className="flex space-x-2 bg-white dark:bg-slate-900 p-1.5 rounded-[1.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-x-auto scrollbar-hide">
          {availableTabs.map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)} 
              className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center whitespace-nowrap ${activeTab === tab.id ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/20' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
            >
              <tab.icon size={14} className="mr-2" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden min-h-[600px] flex flex-col">
        
        {activeTab === 'general' && (
          <form onSubmit={handleSaveConfig} className="p-12 space-y-12 animate-fadeIn">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-purple-50 dark:bg-purple-900/20 text-purple-600 rounded-2xl"><Building2 size={24} /></div>
              <h2 className="text-xl font-black uppercase tracking-tight">Identité de l'établissement</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">{t('language')}</label>
                <div className="relative">
                  <Languages className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <select 
                    value={formConfig.language} 
                    onChange={e => setFormConfig({...formConfig, language: e.target.value as Language})}
                    className="w-full pl-12 pr-6 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-purple-500 rounded-2xl font-bold outline-none appearance-none"
                  >
                    <option value="fr">Français (FR)</option>
                    <option value="en">English (EN)</option>
                    <option value="ar">العربية (AR)</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Nom de l'établissement</label>
                <input value={formConfig.companyName} onChange={e => setFormConfig({...formConfig, companyName: e.target.value})} className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-purple-500 rounded-2xl font-bold outline-none transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Email</label>
                <input type="email" value={formConfig.email} onChange={e => setFormConfig({...formConfig, email: e.target.value})} className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-purple-500 rounded-2xl font-bold outline-none transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Téléphone</label>
                <input value={formConfig.phone} onChange={e => setFormConfig({...formConfig, phone: e.target.value})} className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-purple-500 rounded-2xl font-bold outline-none transition-all" />
              </div>
            </div>

            <div className="pt-8 border-t flex justify-end">
              <button type="submit" className="bg-purple-600 text-white px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl flex items-center hover:bg-purple-700 transition-all"><Save size={18} className="mr-3" /> {t('save')}</button>
            </div>
          </form>
        )}

        {activeTab === 'categories' && (
          <div className="p-12 space-y-10 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
               <div className="flex items-center space-x-4">
                  <div className="p-3 bg-purple-50 dark:bg-purple-900/20 text-purple-600 rounded-2xl"><Layers size={24} /></div>
                  <div>
                    <h2 className="text-xl font-black uppercase tracking-tight">Configuration du Menu</h2>
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1">L'ordre ici sera celui de vos onglets en caisse</p>
                  </div>
               </div>
               <button onClick={() => handleSaveConfig()} className="bg-slate-900 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg flex items-center hover:bg-black transition-all">
                 <Save size={16} className="mr-2" /> Appliquer l'ordre
               </button>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800">
               <div className="flex items-center space-x-4">
                  <div className="relative flex-1">
                    <UtensilsCrossed className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      value={newCategoryName} 
                      onChange={e => setNewCategoryName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
                      placeholder="Nom de la nouvelle catégorie..." 
                      className="w-full pl-12 pr-6 py-4 bg-white dark:bg-slate-900 border-2 border-transparent focus:border-purple-500 rounded-2xl font-bold outline-none transition-all shadow-sm" 
                    />
                  </div>
                  <button onClick={handleAddCategory} className="bg-purple-600 text-white p-4 rounded-2xl shadow-lg hover:bg-purple-700 active:scale-95 transition-all">
                    <Plus size={24} />
                  </button>
               </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
               {formConfig.categories.map((cat, idx) => (
                 <div key={idx} className="bg-white dark:bg-slate-900 p-4 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between group hover:border-purple-200 transition-all">
                    {editingCategoryIdx === idx ? (
                      <div className="flex items-center space-x-2 w-full">
                        <input 
                          autoFocus
                          value={editCategoryName}
                          onChange={e => setEditCategoryName(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && saveEditedCategory()}
                          className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl font-bold text-xs outline-none border border-purple-500"
                        />
                        <button onClick={saveEditedCategory} className="p-2 text-emerald-500"><Check size={18}/></button>
                        <button onClick={() => setEditingCategoryIdx(null)} className="p-2 text-rose-500"><X size={18}/></button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center space-x-3 min-w-0 flex-1">
                           <div className="flex flex-col space-y-1">
                              <button 
                                onClick={() => moveCategory(idx, 'up')} 
                                disabled={idx === 0}
                                className={`p-1 rounded-md transition-all ${idx === 0 ? 'text-slate-100 dark:text-slate-800' : 'text-slate-300 hover:text-purple-600 hover:bg-purple-50'}`}
                              >
                                <ChevronUp size={14}/>
                              </button>
                              <button 
                                onClick={() => moveCategory(idx, 'down')} 
                                disabled={idx === formConfig.categories.length - 1}
                                className={`p-1 rounded-md transition-all ${idx === formConfig.categories.length - 1 ? 'text-slate-100 dark:text-slate-800' : 'text-slate-300 hover:text-purple-600 hover:bg-purple-50'}`}
                              >
                                <ChevronDown size={14}/>
                              </button>
                           </div>
                           <div className="flex items-center space-x-2 min-w-0">
                              <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-600 flex items-center justify-center font-black text-[10px] shrink-0">{idx + 1}</div>
                              <span className="text-xs font-black uppercase text-slate-700 dark:text-slate-200 truncate">{cat}</span>
                           </div>
                        </div>
                        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                           <button onClick={() => startEditCategory(idx, cat)} className="p-2 text-slate-400 hover:text-blue-500 transition-all"><Edit3 size={16}/></button>
                           <button onClick={() => handleDeleteCategory(cat)} className="p-2 text-slate-400 hover:text-rose-500 transition-all"><Trash2 size={16}/></button>
                        </div>
                      </>
                    )}
                 </div>
               ))}
            </div>

            {formConfig.categories.length === 0 && (
              <div className="py-20 text-center opacity-30 flex flex-col items-center">
                 <Layers size={48} className="mb-4" />
                 <p className="font-black uppercase text-xs tracking-widest">Le menu est vide</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'billing' && (
          <form onSubmit={handleSaveConfig} className="p-12 space-y-12 animate-fadeIn">
            <div className="flex items-center justify-between">
               <div className="flex items-center space-x-4">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-2xl"><FileText size={24} /></div>
                  <h2 className="text-xl font-black uppercase tracking-tight">Facturation</h2>
               </div>
               <button type="submit" className="bg-purple-600 text-white px-8 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center hover:bg-purple-700 transition-all"><Save size={16} className="mr-2" /> Enregistrer</button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
               <div className="space-y-6">
                  <ConfigToggle label="Afficher le Logo" icon={ImageIcon} value={formConfig.showLogoOnInvoice} onChange={v => setFormConfig({...formConfig, showLogoOnInvoice: v})} />
                  <ConfigToggle label="Afficher QR Code" icon={QrCode} value={formConfig.showQrCodeOnInvoice} onChange={v => setFormConfig({...formConfig, showQrCodeOnInvoice: v})} />
                  <ConfigToggle label="Impression Auto" icon={Printer} value={formConfig.autoPrintReceipt} onChange={v => setFormConfig({...formConfig, autoPrintReceipt: v})} />
               </div>
               <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Slogan (Pied de facture)</label>
                  <textarea value={formConfig.companySlogan} onChange={e => setFormConfig({...formConfig, companySlogan: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none outline-none focus:ring-2 focus:ring-blue-500 font-bold text-xs h-32" />
               </div>
            </div>
          </form>
        )}

        {activeTab === 'security' && (
           <div className="p-12 space-y-12 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-2xl"><ShieldCheck size={24} /></div>
                <h2 className="text-xl font-black uppercase tracking-tight">Droits d'Accès</h2>
              </div>
              <button onClick={handleSavePermissions} className="bg-purple-600 text-white px-8 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center hover:bg-purple-700 transition-all"><Save size={16} className="mr-2" /> Appliquer</button>
            </div>
            <div className="overflow-x-auto rounded-[2rem] border border-slate-100 dark:border-slate-800">
              <table className="w-full text-left">
                <thead className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest">
                  <tr><th className="px-8 py-5">Fonctionnalité</th>{roles.map(role => <th key={role} className="px-8 py-5 text-center">{role}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {availableViews.map(view => (
                    <tr key={view.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                      <td className="px-8 py-5"><span className="text-xs font-black uppercase">{view.label}</span></td>
                      {roles.map(role => {
                        const isAllowed = localPermissions.find(p => p.role === role)?.allowedViews.includes(view.id);
                        return (
                          <td key={role} className="px-8 py-5 text-center">
                            <button 
                              onClick={() => handleTogglePermission(role, view.id)}
                              className={`w-10 h-5 rounded-full relative transition-all ${isAllowed ? 'bg-purple-600' : 'bg-slate-200 dark:bg-slate-700'}`}
                            >
                              <div className={`absolute top-1 left-1 w-3 h-3 rounded-full bg-white transition-transform ${isAllowed ? 'translate-x-5' : 'translate-x-0'}`} />
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
