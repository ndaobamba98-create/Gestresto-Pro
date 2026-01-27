
import React, { useState } from 'react';
import { Product, ERPConfig, UserRole, ViewType, RolePermission, User, POSLocations, POSLocationCategory, AppTheme } from '../types';
import { 
  Save, Plus, Trash2, Building2, Layers, ShieldCheck, X, 
  FileText, Hash, Info, Printer, DollarSign, BellRing, Users, UserPlus, 
  Mail, Phone, MapPin, Percent, Tag, Bell, Check, QrCode, PackageCheck, Shield, CheckSquare, Square, Edit3, Key, Utensils, Globe,
  ChevronDown, Palette
} from 'lucide-react';

interface Props {
  products: Product[];
  onUpdateProducts: (products: Product[]) => void;
  config: ERPConfig;
  onUpdateConfig: (config: ERPConfig) => void;
  posLocations: POSLocations;
  onUpdateLocations: (locations: POSLocations) => void;
  rolePermissions: RolePermission[];
  onUpdatePermissions: (perms: RolePermission[]) => void;
  notify: (title: string, message: string, type?: 'success' | 'info' | 'warning') => void;
  userPermissions: ViewType[];
  t: (key: any) => string;
  currentUser: User;
  allUsers: User[];
  onUpdateUsers: (users: User[]) => void;
}

const PROFILE_COLORS = [
  'from-slate-700 to-slate-900',
  'from-emerald-600 to-emerald-800',
  'from-purple-600 to-purple-800',
  'from-blue-600 to-blue-800',
  'from-rose-600 to-rose-800',
  'from-amber-600 to-amber-800'
];

const THEMES: { id: AppTheme; color: string; label: string }[] = [
  { id: 'purple', color: 'bg-purple-600', label: 'Améthyste' },
  { id: 'emerald', color: 'bg-emerald-600', label: 'Émeraude' },
  { id: 'blue', color: 'bg-blue-600', label: 'Océan' },
  { id: 'rose', color: 'bg-rose-600', label: 'Rubis' },
  { id: 'amber', color: 'bg-amber-500', label: 'Ambre' },
  { id: 'slate', color: 'bg-slate-600', label: 'Acier' },
];

const MODULES: { id: ViewType; label: string }[] = [
  { id: 'dashboard', label: 'Tableau de bord' },
  { id: 'pos', label: 'Caisse POS' },
  { id: 'sales', label: 'Journal des Ventes' },
  { id: 'inventory', label: 'Gestion Stocks' },
  { id: 'invoicing', label: 'Facturation' },
  { id: 'customers', label: 'Comptes Clients' },
  { id: 'reports', label: 'Analyses & Audits' },
  { id: 'attendances', label: 'Pointages' },
  { id: 'hr', label: 'Gestion RH' },
  { id: 'settings', label: 'Paramètres Système' },
  { id: 'manage_inventory', label: 'Modification Produits' },
  { id: 'manage_session_closing', label: 'Clôture de Caisse' },
  { id: 'manage_sales', label: 'Annulation Ventes' },
  { id: 'manage_hr', label: 'Recrutement / Paie' },
  { id: 'manage_customers', label: 'Gestion Crédits' },
];

const ROLES: UserRole[] = ['admin', 'manager', 'cashier', 'waiter'];

const Settings: React.FC<Props> = ({ config, onUpdateConfig, posLocations, onUpdateLocations, rolePermissions, onUpdatePermissions, notify, currentUser, allUsers, onUpdateUsers, t }) => {
  const [activeTab, setActiveTab] = useState<'general' | 'billing' | 'categories' | 'zones' | 'users' | 'access' | 'notifications'>('general');
  const [formConfig, setFormConfig] = useState<ERPConfig>(config);
  const [newCategory, setNewCategory] = useState('');
  
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [userForm, setUserForm] = useState<Partial<User>>({
    name: '',
    role: 'waiter',
    password: '',
    color: PROFILE_COLORS[1]
  });

  const [newItemName, setNewItemName] = useState<Record<string, string>>({});

  const handleSaveConfig = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onUpdateConfig(formConfig);
    notify(t('save'), "Configuration mise à jour.", 'success');
  };

  const handleTogglePermission = (role: UserRole, permission: ViewType) => {
    if (role === 'admin' && permission === 'settings') return;

    const updated = rolePermissions.map(rp => {
      if (rp.role === role) {
        const hasPerm = rp.permissions.includes(permission);
        const newPerms = hasPerm 
          ? rp.permissions.filter(p => p !== permission)
          : [...rp.permissions, permission];
        return { ...rp, permissions: newPerms };
      }
      return rp;
    });
    onUpdatePermissions(updated);
  };

  const handleAddCategory = () => {
    if (!newCategory.trim()) return;
    if (formConfig.categories.includes(newCategory.trim())) {
      notify("Attention", "Cette catégorie existe déjà.", "warning");
      return;
    }
    const updatedCats = [...formConfig.categories, newCategory.trim()];
    setFormConfig({ ...formConfig, categories: updatedCats });
    setNewCategory('');
  };

  const handleRemoveCategory = (cat: string) => {
    const updatedCats = formConfig.categories.filter(c => c !== cat);
    setFormConfig({ ...formConfig, categories: updatedCats });
  };

  const handleAddItemToZone = (categoryId: string) => {
    const name = newItemName[categoryId];
    if (!name?.trim()) return;
    
    const updated = {
      ...posLocations,
      categories: posLocations.categories.map(cat => {
        if (cat.id === categoryId) {
          return { ...cat, items: [...cat.items, name.trim()] };
        }
        return cat;
      })
    };
    onUpdateLocations(updated);
    setNewItemName({ ...newItemName, [categoryId]: '' });
    notify("Zones POS", `"${name}" ajouté.`, "success");
  };

  const handleRemoveItemFromZone = (categoryId: string, itemName: string) => {
    const updated = {
      ...posLocations,
      categories: posLocations.categories.map(cat => {
        if (cat.id === categoryId) {
          return { ...cat, items: cat.items.filter(i => i !== itemName) };
        }
        return cat;
      })
    };
    onUpdateLocations(updated);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userForm.name || !userForm.password) return;
    
    const initials = userForm.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    
    if (editingUserId) {
      const updatedUsers = allUsers.map(u => u.id === editingUserId ? {
        ...u,
        name: userForm.name!,
        role: userForm.role as UserRole,
        password: userForm.password,
        color: userForm.color!,
        initials
      } : u);
      onUpdateUsers(updatedUsers);
      notify(t('hr'), `Compte ${userForm.name} mis à jour.`, "success");
    } else {
      const newUser: User = {
        id: `U-${Date.now()}`,
        name: userForm.name,
        role: userForm.role as UserRole,
        password: userForm.password,
        color: userForm.color || PROFILE_COLORS[1],
        initials
      };
      onUpdateUsers([...allUsers, newUser]);
      notify(t('hr'), `Compte ${newUser.name} créé.`, "success");
    }
    
    closeUserModal();
  };

  const closeUserModal = () => {
    setIsUserModalOpen(false);
    setEditingUserId(null);
    setUserForm({ name: '', role: 'waiter', password: '', color: PROFILE_COLORS[1] });
  };

  const openEditUserModal = (user: User) => {
    setEditingUserId(user.id);
    setUserForm({
      name: user.name,
      role: user.role,
      password: user.password,
      color: user.color
    });
    setIsUserModalOpen(true);
  };

  const handleDeleteUser = (userId: string, userName: string) => {
    if (userId === currentUser.id) {
      notify("Action Interdite", "Vous ne pouvez pas supprimer votre propre compte administrateur.", "warning");
      return;
    }
    if (confirm(`Supprimer définitivement l'accès de ${userName} ?`)) {
      onUpdateUsers(allUsers.filter(u => u.id !== userId));
      notify("Utilisateur Supprimé", `Le compte de ${userName} a été retiré.`, "info");
    }
  };

  const isAdmin = currentUser.role === 'admin';

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn pb-24 pr-2">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">{t('settings')}</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Paramètres système TerraPOS+</p>
        </div>
        <div className={`flex items-center space-x-3 ${config.language === 'ar' ? 'space-x-reverse' : ''}`}>
          <div className="flex space-x-1 bg-white dark:bg-slate-900 p-1.5 rounded-[1.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-x-auto scrollbar-hide">
            {[
              { id: 'general', label: 'Entreprise', icon: Building2 },
              { id: 'billing', label: t('invoicing'), icon: FileText },
              { id: 'categories', label: t('inventory'), icon: Layers },
              { id: 'zones', label: 'Salles & Tables', icon: Utensils },
              { id: 'users', label: t('staff_active'), icon: Users },
              { id: 'access', label: t('settings'), icon: Shield, hidden: !isAdmin },
              { id: 'notifications', label: 'Alertes', icon: BellRing },
            ].filter(tab => !tab.hidden).map((tab) => (
              <button 
                key={tab.id} 
                onClick={() => setActiveTab(tab.id as any)} 
                className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center whitespace-nowrap ${activeTab === tab.id ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
              >
                <tab.icon size={14} className={config.language === 'ar' ? 'ml-2' : 'mr-2'} /> {tab.label}
              </button>
            ))}
          </div>
          <button onClick={handleSaveConfig} className="bg-emerald-600 text-white px-8 py-4 rounded-[1.5rem] font-black uppercase text-xs tracking-widest shadow-xl flex items-center hover:bg-emerald-700 transition-all">
            <Save size={18} className={config.language === 'ar' ? 'ml-2' : 'mr-2'}/> {t('save')}
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm min-h-[600px] overflow-hidden">
        
        {activeTab === 'general' && (
          <div className="p-12 space-y-12 animate-fadeIn">
            <section className="space-y-6">
              <h3 className="text-xs font-black uppercase text-purple-600 tracking-[0.2em] flex items-center"><Building2 size={16} className={config.language === 'ar' ? 'ml-2' : 'mr-2'}/> Établissement</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400">Nom</label>
                  <input value={formConfig.companyName} onChange={e => setFormConfig({...formConfig, companyName: e.target.value})} className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl font-bold border-none outline-none focus:ring-2 focus:ring-purple-500" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400">Slogan</label>
                  <input value={formConfig.companySlogan} onChange={e => setFormConfig({...formConfig, companySlogan: e.target.value})} className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl font-bold border-none outline-none focus:ring-2 focus:ring-purple-500" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400">NIF/RC</label>
                  <input value={formConfig.registrationNumber} onChange={e => setFormConfig({...formConfig, registrationNumber: e.target.value})} className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl font-bold border-none outline-none focus:ring-2 focus:ring-purple-500" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400">Devise</label>
                  <input value={formConfig.currency} onChange={e => setFormConfig({...formConfig, currency: e.target.value})} className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl font-bold border-none outline-none focus:ring-2 focus:ring-purple-500" />
                </div>
              </div>
            </section>

            <section className="space-y-8 pt-8 border-t dark:border-slate-800">
              <h3 className="text-xs font-black uppercase text-purple-600 tracking-[0.2em] flex items-center"><Palette size={16} className={config.language === 'ar' ? 'ml-2' : 'mr-2'}/> Identité Visuelle & Thèmes</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase text-slate-400">Couleur d'accentuation (Thème)</label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                    {THEMES.map(theme => (
                      <button 
                        key={theme.id}
                        type="button"
                        onClick={() => setFormConfig({...formConfig, theme: theme.id})}
                        className={`group relative h-12 rounded-2xl flex items-center justify-center transition-all ${theme.color} ${formConfig.theme === theme.id ? 'ring-4 ring-offset-4 ring-slate-200 dark:ring-slate-700 shadow-xl scale-110 z-10' : 'opacity-60 hover:opacity-100'}`}
                        title={theme.label}
                      >
                        {formConfig.theme === theme.id && <Check size={20} className="text-white animate-scaleIn" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase text-slate-400">{t('language')}</label>
                  <div className="relative">
                    <select 
                      value={formConfig.language} 
                      onChange={e => setFormConfig({...formConfig, language: e.target.value as any})} 
                      className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl font-bold border-none outline-none appearance-none focus:ring-2 focus:ring-purple-500 uppercase text-xs"
                    >
                      <option value="fr">Français</option>
                      <option value="ar">العربية (Arabe)</option>
                      <option value="en">English (Anglais)</option>
                    </select>
                    <ChevronDown size={18} className={`absolute ${config.language === 'ar' ? 'left-5' : 'right-5'} top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none`} />
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-6 pt-8 border-t dark:border-slate-800">
              <h3 className="text-xs font-black uppercase text-purple-600 tracking-[0.2em] flex items-center"><MapPin size={16} className={config.language === 'ar' ? 'ml-2' : 'mr-2'}/> Contact</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black uppercase text-slate-400">Adresse</label>
                  <input value={formConfig.address} onChange={e => setFormConfig({...formConfig, address: e.target.value})} className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl font-bold border-none outline-none focus:ring-2 focus:ring-purple-500" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400">Téléphone</label>
                  <input value={formConfig.phone} onChange={e => setFormConfig({...formConfig, phone: e.target.value})} className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl font-bold border-none outline-none focus:ring-2 focus:ring-purple-500" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400">Email</label>
                  <input value={formConfig.email} onChange={e => setFormConfig({...formConfig, email: e.target.value})} className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl font-bold border-none outline-none focus:ring-2 focus:ring-purple-500" />
                </div>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'access' && isAdmin && (
          <div className="p-12 space-y-8 animate-fadeIn">
            <div className="flex items-center space-x-4 mb-6">
              <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl"><Shield size={24}/></div>
              <div>
                <h3 className="text-sm font-black uppercase">Matrice des Droits d'Accès</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Contrôle granulaire par rôle utilisateur</p>
              </div>
            </div>

            <div className="overflow-x-auto rounded-[2rem] border border-slate-100 dark:border-slate-800">
              <table className="w-full text-left">
                <thead className="bg-slate-900 text-white">
                  <tr className="text-[10px] font-black uppercase tracking-widest">
                    <th className="px-8 py-5">Modules / Actions</th>
                    {ROLES.map(role => (
                      <th key={role} className="px-8 py-5 text-center uppercase">{role === 'waiter' ? 'Serveuse' : role}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {MODULES.map(module => (
                    <tr key={module.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-8 py-4 font-bold text-xs uppercase text-slate-600 dark:text-slate-300">{module.label}</td>
                      {ROLES.map(role => {
                        const rolePerm = rolePermissions.find(rp => rp.role === role);
                        const isGranted = rolePerm?.permissions.includes(module.id);
                        const isLocked = role === 'admin' && module.id === 'settings';
                        
                        return (
                          <td key={role} className="px-8 py-4 text-center">
                            <button 
                              disabled={isLocked}
                              onClick={() => handleTogglePermission(role, module.id)}
                              className={`p-2 rounded-xl transition-all ${isGranted ? 'text-emerald-500' : 'text-slate-300'} ${isLocked ? 'opacity-20 cursor-not-allowed' : 'hover:scale-125'}`}
                            >
                              {isGranted ? <CheckSquare size={24} /> : <Square size={24} />}
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

        {activeTab === 'users' && (
          <div className="p-12 space-y-8 animate-fadeIn">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                 <div className="p-4 bg-purple-50 text-purple-600 rounded-2xl"><Users size={24}/></div>
                 <div>
                    <h2 className="text-xl font-black uppercase">{t('staff_active')}</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Comptes et accès personnels</p>
                 </div>
              </div>
              {isAdmin && (
                <button onClick={() => { setEditingUserId(null); setIsUserModalOpen(true); }} className="bg-slate-900 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center shadow-xl hover:bg-black transition-all">
                  <UserPlus size={18} className={config.language === 'ar' ? 'ml-2' : 'mr-2'}/> Nouvel IDENTIFIANT
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allUsers.map(u => (
                <div key={u.id} className="group relative bg-slate-50 dark:bg-slate-800 p-8 rounded-[2.5rem] border-2 border-transparent hover:border-purple-500/30 transition-all flex flex-col items-center text-center">
                  {isAdmin && (
                    <div className={`absolute top-4 ${config.language === 'ar' ? 'left-4' : 'right-4'} flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity`}>
                      <button 
                        onClick={() => openEditUserModal(u)}
                        className="p-2 bg-white dark:bg-slate-700 text-blue-500 rounded-xl hover:bg-blue-500 hover:text-white transition-all shadow-sm"
                        title="Modifier l'utilisateur"
                      >
                        <Edit3 size={16} />
                      </button>
                      {u.id !== currentUser.id && (
                        <button 
                          onClick={() => handleDeleteUser(u.id, u.name)}
                          className="p-2 bg-white dark:bg-slate-700 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                          title="Supprimer l'utilisateur"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  )}
                  <div className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${u.color} flex items-center justify-center text-white text-2xl font-black shadow-xl mb-4 group-hover:rotate-6 transition-transform`}>
                    {u.initials}
                  </div>
                  <span className="font-black uppercase text-sm text-slate-800 dark:text-white">{u.name}</span>
                  <div className="mt-2 flex items-center space-x-2">
                    <span className="text-[9px] font-black bg-purple-100 dark:bg-purple-900/30 text-purple-600 px-3 py-1 rounded-lg uppercase tracking-widest">{u.role === 'waiter' ? 'Serveuse' : u.role}</span>
                    <Shield size={10} className="text-slate-400" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'zones' && (
          <div className="p-12 space-y-12 animate-fadeIn">
            <div className="flex items-center space-x-4 mb-4">
              <div className="p-4 bg-orange-50 text-orange-600 rounded-2xl"><Utensils size={24}/></div>
              <div>
                <h3 className="text-sm font-black uppercase">Gestion des Zones & Tables</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Configuration du plan de salle interactif</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              {posLocations.categories.map((zone) => (
                <div key={zone.id} className="bg-slate-50 dark:bg-slate-800/50 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 flex flex-col space-y-6">
                  <div className={`flex items-center justify-between ${config.language === 'ar' ? 'flex-row-reverse' : ''}`}>
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-white">{zone.name}</h4>
                    <span className="text-[10px] font-black px-2 py-1 bg-white dark:bg-slate-700 rounded-lg">{zone.items.length} items</span>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {zone.items.map((item) => (
                      <div key={item} className={`bg-white dark:bg-slate-900 p-3 rounded-xl border flex items-center justify-between group shadow-sm ${config.language === 'ar' ? 'flex-row-reverse' : ''}`}>
                        <span className="text-[10px] font-bold uppercase truncate">{item}</span>
                        <button onClick={() => handleRemoveItemFromZone(zone.id, item)} className="text-rose-500 opacity-0 group-hover:opacity-100 p-1"><X size={14}/></button>
                      </div>
                    ))}
                  </div>

                  <div className={`flex gap-2 pt-4 border-t dark:border-slate-700 ${config.language === 'ar' ? 'flex-row-reverse' : ''}`}>
                    <input 
                      value={newItemName[zone.id] || ''} 
                      onChange={e => setNewItemName({...newItemName, [zone.id]: e.target.value})} 
                      placeholder={`Nom (ex: Table ${zone.items.length + 1})`} 
                      className={`flex-1 px-4 py-3 bg-white dark:bg-slate-900 rounded-xl text-xs font-bold outline-none border-2 border-transparent focus:border-purple-500 ${config.language === 'ar' ? 'text-right' : ''}`}
                    />
                    <button 
                      onClick={() => handleAddItemToZone(zone.id)}
                      className="bg-slate-900 text-white p-3 rounded-xl hover:bg-black transition-all"
                    >
                      <Plus size={20}/>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'billing' && (
          <div className="p-12 space-y-12 animate-fadeIn">
            <section className="space-y-8">
              <div className="flex items-center space-x-4 mb-4">
                 <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl"><FileText size={24}/></div>
                 <div>
                    <h3 className="text-sm font-black uppercase">{t('invoicing')}</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Séquences et taxes</p>
                 </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400">Préfixe</label>
                  <input value={formConfig.invoicePrefix} onChange={e => setFormConfig({...formConfig, invoicePrefix: e.target.value})} className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl font-bold" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400">N° Suivant</label>
                  <input type="number" value={formConfig.nextInvoiceNumber} onChange={e => setFormConfig({...formConfig, nextInvoiceNumber: parseInt(e.target.value) || 1})} className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl font-bold" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400">Taux Taxe %</label>
                  <input type="number" value={formConfig.taxRate} onChange={e => setFormConfig({...formConfig, taxRate: parseFloat(e.target.value) || 0})} className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl font-bold" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black uppercase text-slate-400">Pied de ticket</label>
                  <textarea value={formConfig.receiptFooter} onChange={e => setFormConfig({...formConfig, receiptFooter: e.target.value})} className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl font-bold h-24" />
                </div>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'categories' && (
          <div className="p-12 space-y-8 animate-fadeIn">
            <div className="bg-slate-50 dark:bg-slate-800/50 p-8 rounded-[2.5rem] space-y-8">
               <div className={`flex gap-3 ${config.language === 'ar' ? 'flex-row-reverse' : ''}`}>
                  <input value={newCategory} onChange={e => setNewCategory(e.target.value)} placeholder="Nouvelle catégorie..." className={`flex-1 px-6 py-4 bg-white dark:bg-slate-900 rounded-2xl font-bold outline-none ${config.language === 'ar' ? 'text-right' : ''}`} />
                  <button onClick={handleAddCategory} className="bg-slate-900 text-white p-4 rounded-2xl"><Plus/></button>
               </div>
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {formConfig.categories.map(cat => (
                    <div key={cat} className={`bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm flex items-center justify-between group ${config.language === 'ar' ? 'flex-row-reverse' : ''}`}>
                       <span className="font-black uppercase text-[10px]">{cat}</span>
                       <button onClick={() => handleRemoveCategory(cat)} className="text-rose-500 opacity-0 group-hover:opacity-100"><Trash2 size={16}/></button>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="p-12 space-y-12 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="bg-slate-50 dark:bg-slate-800 p-8 rounded-[2.5rem] flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-4">
                     <h4 className="text-[11px] font-black uppercase">{t('low_stock_alert')}</h4>
                     <div className="w-12 h-6 bg-emerald-500 rounded-full p-1"><div className="w-4 h-4 bg-white rounded-full ml-auto"></div></div>
                  </div>
                  <p className="text-[10px] text-slate-500">Alertes automatiques sous 10 unités.</p>
               </div>
               <div className="bg-slate-50 dark:bg-slate-800 p-8 rounded-[2.5rem] flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-4">
                     <h4 className="text-[11px] font-black uppercase">{t('session_closure_alert')}</h4>
                     <div className="w-12 h-6 bg-emerald-500 rounded-full p-1"><div className="w-4 h-4 bg-white rounded-full ml-auto"></div></div>
                  </div>
                  <p className="text-[10px] text-slate-500">Rapport de clôture envoyé à {formConfig.email}.</p>
               </div>
            </div>
          </div>
        )}
      </div>

      {isUserModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[250] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden border border-white/10 animate-scaleIn">
            <div className={`p-8 border-b dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 ${config.language === 'ar' ? 'flex-row-reverse' : ''}`}>
               <div className={`flex items-center space-x-4 ${config.language === 'ar' ? 'space-x-reverse' : ''}`}>
                 <div className={`p-3 rounded-2xl ${editingUserId ? 'bg-blue-600' : 'bg-purple-600'} text-white shadow-lg`}>
                   {editingUserId ? <Edit3 size={24}/> : <UserPlus size={24}/>}
                 </div>
                 <div className={config.language === 'ar' ? 'text-right' : ''}>
                    <h3 className="text-lg font-black uppercase tracking-tighter">{editingUserId ? 'Modifier Collaborateur' : 'Nouveau Collaborateur'}</h3>
                    <p className="text-[10px] font-black uppercase opacity-60">Accès TerraPOS+</p>
                 </div>
               </div>
               <button onClick={closeUserModal}><X size={24}/></button>
            </div>
            <form onSubmit={handleSaveUser} className="p-10 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">IDENTIFIANT / NOM</label>
                <input required value={userForm.name} onChange={e => setUserForm({...userForm, name: e.target.value})} className={`w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-purple-500 rounded-2xl font-black outline-none transition-all uppercase ${config.language === 'ar' ? 'text-right' : ''}`} placeholder="NOM DE L'AGENT" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 flex items-center">
                  <Key size={10} className={config.language === 'ar' ? 'ml-2' : 'mr-2'}/> MOT DE PASSE
                </label>
                <input type="password" required value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} className={`w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-purple-500 rounded-2xl font-black tracking-[0.3em] outline-none transition-all ${config.language === 'ar' ? 'text-right' : ''}`} placeholder="••••" />
                {editingUserId && <p className="text-[8px] font-bold text-slate-400 mt-1 italic uppercase">Laissez tel quel pour ne pas changer</p>}
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">RÔLE / NIVEAU D'ACCÈS</label>
                <div className="relative">
                  <select 
                    value={userForm.role} 
                    onChange={e => setUserForm({...userForm, role: e.target.value as any})} 
                    className={`w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-purple-500 rounded-2xl font-black text-[10px] uppercase tracking-widest outline-none appearance-none transition-all ${config.language === 'ar' ? 'text-right' : ''}`}
                  >
                    <option value="admin">Administrateur (Accès Total)</option>
                    <option value="manager">Manager (Opérations)</option>
                    <option value="cashier">Caissier (Ventes)</option>
                    <option value="waiter">Serveuse (Prise de commande)</option>
                  </select>
                  <ChevronDown size={18} className={`absolute ${config.language === 'ar' ? 'left-5' : 'right-5'} top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none`} />
                </div>
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">COULEUR DE PROFIL</label>
                 <div className="flex justify-between p-2 bg-slate-50 dark:bg-slate-800 rounded-2xl border-2 border-transparent">
                    {PROFILE_COLORS.map(color => (
                      <button 
                        key={color} 
                        type="button" 
                        onClick={() => setUserForm({...userForm, color})} 
                        className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} transition-all ${userForm.color === color ? 'scale-110 shadow-lg ring-2 ring-white ring-offset-2' : 'opacity-40 hover:opacity-100'}`} 
                      />
                    ))}
                 </div>
              </div>
              <button type="submit" className={`w-full py-5 ${editingUserId ? 'bg-blue-600 hover:bg-blue-700' : 'bg-purple-600 hover:bg-purple-700'} text-white rounded-[1.5rem] font-black uppercase text-xs tracking-widest shadow-xl transition-all active:scale-95`}>
                {editingUserId ? 'Enregistrer les modifications' : 'Créer l\'identifiant'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
