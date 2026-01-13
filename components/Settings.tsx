
import React, { useState, useMemo } from 'react';
import { Product, ERPConfig, UserRole, ViewType, RolePermission, Language, AppTheme, User } from '../types';
import { 
  Save, Plus, Trash2, Edit3, Building2, Layers, ShieldCheck, Lock, ChevronUp, ChevronDown, Check, X, 
  FileText, Percent, Hash, Info, Printer, QrCode, CreditCard, Layout, Languages, DollarSign, Type, Bell, Sun, Moon, Palette, Fingerprint, EyeOff, Eye, Sparkles, Image as ImageIcon, AlignLeft, Phone, Mail, MapPin, BadgeCheck, UtensilsCrossed, Search, ArrowUp, ArrowDown, Receipt, ListOrdered, Calculator, User as UserIcon, Shield, Key, Users
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
  currentUser: User;
  allUsers: User[];
  onUpdateUsers: (users: User[]) => void;
}

const THEMES: { id: AppTheme, label: string, color: string }[] = [
  { id: 'purple', label: 'Améthyste', color: 'bg-purple-600' },
  { id: 'emerald', label: 'Émeraude', color: 'bg-emerald-600' },
  { id: 'blue', label: 'Océan', color: 'bg-blue-600' },
  { id: 'rose', label: 'Rubis', color: 'bg-rose-600' },
  { id: 'amber', label: 'Ambre', color: 'bg-amber-500' },
  { id: 'slate', label: 'Ardoise', color: 'bg-slate-600' },
];

const PROFILE_COLORS = [
  'from-slate-700 to-slate-900',
  'from-emerald-600 to-emerald-800',
  'from-purple-600 to-purple-800',
  'from-blue-600 to-blue-800',
  'from-rose-600 to-rose-800',
  'from-amber-600 to-amber-800'
];

const Settings: React.FC<Props> = ({ config, onUpdateConfig, rolePermissions, onUpdatePermissions, notify, t, userPermissions, currentUser, allUsers, onUpdateUsers }) => {
  const [activeTab, setActiveTab] = useState<'general' | 'billing' | 'categories' | 'security' | 'account' | 'users'>('general');
  const [formConfig, setFormConfig] = useState<ERPConfig>(config);
  
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategoryIdx, setEditingCategoryIdx] = useState<number | null>(null);
  const [editCategoryName, setEditCategoryName] = useState('');

  const [localPermissions, setLocalPermissions] = useState<RolePermission[]>(rolePermissions);

  // New User Form State
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [newUserForm, setNewUserForm] = useState<Partial<User>>({
    name: '',
    role: 'cashier',
    password: '',
    color: PROFILE_COLORS[1]
  });

  // Password Change State
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPass, setShowPass] = useState(false);

  const handleSaveConfig = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onUpdateConfig(formConfig);
    notify("Configuration", "Modifications enregistrées avec succès.", 'success');
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.oldPassword !== currentUser.password) {
      notify("Sécurité", "L'ancien mot de passe est incorrect.", "warning");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      notify("Sécurité", "Les nouveaux mots de passe ne correspondent pas.", "warning");
      return;
    }
    if (passwordForm.newPassword.length < 4) {
      notify("Sécurité", "Le mot de passe doit faire au moins 4 caractères.", "warning");
      return;
    }

    const updatedUsers = allUsers.map(u => 
      u.id === currentUser.id ? { ...u, password: passwordForm.newPassword } : u
    );
    onUpdateUsers(updatedUsers);
    setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    notify("Sécurité", "Votre mot de passe a été mis à jour avec succès.", "success");
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserForm.name || !newUserForm.password) return;

    const initials = newUserForm.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    const user: User = {
      id: `U-${Date.now()}`,
      name: newUserForm.name,
      role: newUserForm.role as UserRole,
      password: newUserForm.password,
      color: newUserForm.color || PROFILE_COLORS[1],
      initials
    };

    onUpdateUsers([...allUsers, user]);
    setIsAddUserModalOpen(false);
    setNewUserForm({ name: '', role: 'cashier', password: '', color: PROFILE_COLORS[1] });
    notify("Utilisateurs", `Compte pour ${user.name} créé.`, "success");
  };

  const handleDeleteUser = (id: string, name: string) => {
    if (id === currentUser.id) {
      notify("Action interdite", "Vous ne pouvez pas supprimer votre propre compte.", "warning");
      return;
    }
    if (confirm(`Voulez-vous vraiment supprimer le compte de ${name} ?`)) {
      onUpdateUsers(allUsers.filter(u => u.id !== id));
      notify("Utilisateurs", "Compte supprimé.", "info");
    }
  };

  const handleAddCategory = () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;
    if (formConfig.categories.includes(trimmed)) {
      notify("Attention", "Cette catégorie existe déjà.", "warning");
      return;
    }
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
    setFormConfig({ ...formConfig, categories: updated });
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
      { id: 'users', label: 'Utilisateurs', icon: Users, permission: 'manage_users' as ViewType },
      { id: 'account', label: 'Mon Compte', icon: Lock, permission: 'dashboard' as ViewType },
    ];
    return tabs.filter(tab => userPermissions.includes(tab.permission) || (tab.id === 'users' && currentUser.role === 'admin'));
  }, [userPermissions, currentUser.role]);

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
    { id: 'customers', label: 'Comptes Clients (Consultation)' },
    { id: 'manage_customers', label: 'Gestion Clients (Ajout/Suppression)' },
    { id: 'expenses', label: t('expenses') },
    { id: 'reports', label: t('reports') },
    { id: 'hr', label: t('hr') },
    { id: 'manage_hr', label: 'Modif. RH' },
    { id: 'attendances', label: t('attendances') },
    { id: 'settings', label: t('settings') },
    { id: 'manage_security', label: 'Gérer Accès/Rôles' },
    { id: 'manage_notifications', label: "Gérer Notifications" },
    { id: 'manage_users', label: "Gérer Utilisateurs" },
  ];

  const roles: UserRole[] = ['admin', 'manager', 'cashier'];

  const ConfigToggle = ({ label, icon: Icon, value, onChange }: { label: string, icon: any, value: boolean, onChange: (v: boolean) => void }) => (
    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-accent/30 transition-all">
      <div className="flex items-center space-x-3">
        <div className={`p-2 rounded-lg ${value ? 'bg-accent/10 text-accent' : 'bg-slate-200 text-slate-400'}`}>
          <Icon size={16} />
        </div>
        <span className="text-[10px] font-black uppercase text-slate-700 dark:text-slate-300 tracking-widest">{label}</span>
      </div>
      <button 
        type="button"
        onClick={() => onChange(!value)}
        className={`w-10 h-5 rounded-full relative transition-all ${value ? 'bg-accent' : 'bg-slate-300 dark:bg-slate-700'}`}
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
              className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center whitespace-nowrap ${activeTab === tab.id ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
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
              <div className="p-3 bg-accent/10 text-accent rounded-2xl"><Building2 size={24} /></div>
              <h2 className="text-xl font-black uppercase tracking-tight">Identité & Apparence</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">{t('language')}</label>
                  <div className="relative">
                    <Languages className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <select 
                      value={formConfig.language} 
                      onChange={e => setFormConfig({...formConfig, language: e.target.value as Language})}
                      className="w-full pl-12 pr-6 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-accent rounded-2xl font-bold outline-none appearance-none"
                    >
                      <option value="fr">Français (FR)</option>
                      <option value="en">English (EN)</option>
                      <option value="ar">العربية (AR)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 flex items-center">
                    <Palette size={14} className="mr-2" /> Thème Visuel du Système
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                    {THEMES.map((theme) => (
                      <button
                        key={theme.id}
                        type="button"
                        onClick={() => setFormConfig({...formConfig, theme: theme.id})}
                        className={`group relative flex flex-col items-center space-y-2 p-3 rounded-2xl border-2 transition-all ${formConfig.theme === theme.id ? 'border-accent bg-accent/5 dark:bg-accent/10' : 'border-slate-100 dark:border-slate-800 hover:border-slate-200'}`}
                      >
                        <div className={`w-8 h-8 rounded-full ${theme.color} shadow-lg group-hover:scale-110 transition-transform flex items-center justify-center`}>
                          {formConfig.theme === theme.id && <Check size={16} className="text-white" />}
                        </div>
                        <span className="text-[8px] font-black uppercase tracking-tighter text-slate-500">{theme.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Nom de l'établissement</label>
                  <input value={formConfig.companyName} onChange={e => setFormConfig({...formConfig, companyName: e.target.value})} className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-accent rounded-2xl font-bold outline-none transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Immatriculation (NIF/RC)</label>
                  <input value={formConfig.registrationNumber} onChange={e => setFormConfig({...formConfig, registrationNumber: e.target.value})} className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-accent rounded-2xl font-bold outline-none transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Adresse Siège</label>
                  <input value={formConfig.address} onChange={e => setFormConfig({...formConfig, address: e.target.value})} className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-accent rounded-2xl font-bold outline-none transition-all" />
                </div>
              </div>
            </div>

            <div className="pt-8 border-t flex justify-end">
              <button type="submit" className="bg-accent text-white px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl flex items-center hover:opacity-90 transition-all"><Save size={18} className="mr-3" /> {t('save')}</button>
            </div>
          </form>
        )}

        {activeTab === 'billing' && (
          <form onSubmit={handleSaveConfig} className="p-12 space-y-12 animate-fadeIn">
            <div className="flex items-center justify-between">
               <div className="flex items-center space-x-4">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-2xl"><Receipt size={24} /></div>
                  <h2 className="text-xl font-black uppercase tracking-tight">Facturation</h2>
               </div>
               <button type="submit" className="bg-accent text-white px-8 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center hover:opacity-90 transition-all"><Save size={16} className="mr-2" /> Enregistrer</button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
               <div className="space-y-10">
                  <div className="space-y-4">
                    <h3 className="text-[11px] font-black uppercase text-slate-400 tracking-[0.2em] border-b pb-2">Numérotation</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 flex items-center"><ListOrdered size={12} className="mr-2" /> Préfixe</label>
                        <input value={formConfig.invoicePrefix} onChange={e => setFormConfig({...formConfig, invoicePrefix: e.target.value})} className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-accent rounded-xl font-black text-xs" placeholder="ex: FAC/2025/" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 flex items-center"><Hash size={12} className="mr-2" /> Prochain Numéro</label>
                        <input type="number" value={formConfig.nextInvoiceNumber} onChange={e => setFormConfig({...formConfig, nextInvoiceNumber: parseInt(e.target.value) || 1})} className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-accent rounded-xl font-black text-xs" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-[11px] font-black uppercase text-slate-400 tracking-[0.2em] border-b pb-2">Fiscalité</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 flex items-center"><Calculator size={12} className="mr-2" /> Taux TVA (%)</label>
                        <input type="number" value={formConfig.taxRate} onChange={e => setFormConfig({...formConfig, taxRate: parseFloat(e.target.value) || 0})} className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-accent rounded-xl font-black text-xs" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 flex items-center"><DollarSign size={12} className="mr-2" /> Devise</label>
                        <input value={formConfig.currency} onChange={e => setFormConfig({...formConfig, currency: e.target.value})} className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-accent rounded-xl font-black text-xs" />
                      </div>
                    </div>
                  </div>
               </div>

               <div className="space-y-4">
                  <h3 className="text-[11px] font-black uppercase text-slate-400 tracking-[0.2em] border-b pb-2">Options Document</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <ConfigToggle label="Logo" icon={ImageIcon} value={formConfig.showLogoOnInvoice} onChange={v => setFormConfig({...formConfig, showLogoOnInvoice: v})} />
                    <ConfigToggle label="QR Code" icon={QrCode} value={formConfig.showQrCodeOnInvoice} onChange={v => setFormConfig({...formConfig, showQrCodeOnInvoice: v})} />
                    <ConfigToggle label="Slogan" icon={AlignLeft} value={formConfig.showSloganOnInvoice} onChange={v => setFormConfig({...formConfig, showSloganOnInvoice: v})} />
                    <ConfigToggle label="Adresse" icon={MapPin} value={formConfig.showAddressOnInvoice} onChange={v => setFormConfig({...formConfig, showAddressOnInvoice: v})} />
                    <ConfigToggle label="Téléphone" icon={Phone} value={formConfig.showPhoneOnInvoice} onChange={v => setFormConfig({...formConfig, showPhoneOnInvoice: v})} />
                    <ConfigToggle label="Email" icon={Mail} value={formConfig.showEmailOnInvoice} onChange={v => setFormConfig({...formConfig, showEmailOnInvoice: v})} />
                    <ConfigToggle label="NIF/RC" icon={BadgeCheck} value={formConfig.showRegNumberOnInvoice} onChange={v => setFormConfig({...formConfig, showRegNumberOnInvoice: v})} />
                    <ConfigToggle label="Impression Auto" icon={Printer} value={formConfig.autoPrintReceipt} onChange={v => setFormConfig({...formConfig, autoPrintReceipt: v})} />
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
               <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 flex items-center"><Sparkles size={12} className="mr-2" /> Slogan</label>
                  <input value={formConfig.companySlogan} onChange={e => setFormConfig({...formConfig, companySlogan: e.target.value})} className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl font-bold text-xs" />
               </div>
               <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 flex items-center"><AlignLeft size={12} className="mr-2" /> Pied de page</label>
                  <textarea value={formConfig.receiptFooter} onChange={e => setFormConfig({...formConfig, receiptFooter: e.target.value})} className="w-full p-5 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none outline-none focus:ring-2 focus:ring-accent font-bold text-xs h-24" />
               </div>
            </div>
          </form>
        )}

        {activeTab === 'categories' && (
          <div className="p-12 space-y-10 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
               <div className="flex items-center space-x-4">
                  <div className="p-3 bg-accent/10 text-accent rounded-2xl"><Layers size={24} /></div>
                  <div>
                    <h2 className="text-xl font-black uppercase tracking-tight">Configuration du Menu</h2>
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1">Gérez vos catégories de produits</p>
                  </div>
               </div>
               <button onClick={() => handleSaveConfig()} className="bg-slate-900 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg flex items-center hover:bg-black transition-all">
                 <Save size={16} className="mr-2" /> Appliquer
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
                      placeholder="Nouvelle catégorie..." 
                      className="w-full pl-12 pr-6 py-4 bg-white dark:bg-slate-900 border-2 border-transparent focus:border-accent rounded-2xl font-bold outline-none transition-all shadow-sm" 
                    />
                  </div>
                  <button onClick={handleAddCategory} className="bg-accent text-white p-4 rounded-2xl shadow-lg hover:opacity-90 transition-all">
                    <Plus size={24} />
                  </button>
               </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
               {formConfig.categories.map((cat, idx) => (
                 <div key={idx} className="bg-white dark:bg-slate-900 p-4 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between group hover:border-accent/30 transition-all">
                    {editingCategoryIdx === idx ? (
                      <div className="flex items-center space-x-2 w-full">
                        <input 
                          autoFocus
                          value={editCategoryName}
                          onChange={e => setEditCategoryName(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && saveEditedCategory()}
                          className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl font-bold text-xs outline-none border border-accent"
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
                                className={`p-1 rounded-md transition-all ${idx === 0 ? 'text-slate-100 dark:text-slate-800' : 'text-slate-300 hover:text-accent hover:bg-accent/5'}`}
                              >
                                <ChevronUp size={14}/>
                              </button>
                              <button 
                                onClick={() => moveCategory(idx, 'down')} 
                                disabled={idx === formConfig.categories.length - 1}
                                className={`p-1 rounded-md transition-all ${idx === formConfig.categories.length - 1 ? 'text-slate-100 dark:text-slate-800' : 'text-slate-300 hover:text-accent hover:bg-accent/5'}`}
                              >
                                <ChevronDown size={14}/>
                              </button>
                           </div>
                           <div className="flex items-center space-x-2 min-w-0">
                              <div className="w-8 h-8 rounded-xl bg-accent/10 text-accent flex items-center justify-center font-black text-[10px] shrink-0">{idx + 1}</div>
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
          </div>
        )}

        {activeTab === 'security' && (
           <div className="p-12 space-y-12 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-2xl"><ShieldCheck size={24} /></div>
                <h2 className="text-xl font-black uppercase tracking-tight">Contrôle des Accès</h2>
              </div>
              <button onClick={handleSavePermissions} className="bg-accent text-white px-8 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center hover:opacity-90 transition-all"><Save size={16} className="mr-2" /> Appliquer</button>
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
                              className={`w-10 h-5 rounded-full relative transition-all ${isAllowed ? 'bg-accent' : 'bg-slate-200 dark:bg-slate-700'}`}
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

        {activeTab === 'users' && currentUser.role === 'admin' && (
          <div className="p-12 space-y-12 animate-fadeIn flex flex-col h-full">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 text-purple-600 rounded-2xl"><Users size={24} /></div>
                <h2 className="text-xl font-black uppercase tracking-tight">Utilisateurs Système</h2>
              </div>
              <button 
                onClick={() => setIsAddUserModalOpen(true)}
                className="bg-accent text-white px-8 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center hover:opacity-90 transition-all"
              >
                <Plus size={16} className="mr-2" /> Créer Utilisateur
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {allUsers.map((user) => (
                 <div key={user.id} className="bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] border-2 border-slate-50 dark:border-slate-700 flex flex-col items-center text-center group hover:border-accent transition-all relative">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${user.color} flex items-center justify-center text-white text-xl font-black shadow-lg mb-4`}>
                      {user.initials}
                    </div>
                    <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tight">{user.name}</h3>
                    <p className="text-[10px] font-black text-accent uppercase tracking-widest mt-1">{user.role}</p>
                    
                    <div className="mt-6 w-full flex items-center justify-center space-x-3 opacity-0 group-hover:opacity-100 transition-opacity">
                       {user.id !== currentUser.id && (
                         <button 
                           onClick={() => handleDeleteUser(user.id, user.name)}
                           className="p-3 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                           title="Supprimer"
                         >
                           <Trash2 size={18} />
                         </button>
                       )}
                       <button 
                         className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-accent hover:text-white transition-all shadow-sm"
                         title="Modifier (bientôt disponible)"
                       >
                         <Edit3 size={18} />
                       </button>
                    </div>
                 </div>
               ))}
            </div>

            {/* MODAL AJOUT UTILISATEUR */}
            {isAddUserModalOpen && (
              <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[250] flex items-center justify-center p-4">
                <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[3rem] shadow-2xl border border-white/10 overflow-hidden animate-scaleIn">
                  <div className="p-8 border-b dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-accent text-white rounded-2xl"><UserPlus size={24}/></div>
                      <h3 className="text-xl font-black uppercase tracking-tighter">Nouvel Utilisateur</h3>
                    </div>
                    <button onClick={() => setIsAddUserModalOpen(false)}><X size={28} className="text-slate-400"/></button>
                  </div>
                  
                  <form onSubmit={handleCreateUser} className="p-10 space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Nom Complet</label>
                      <input 
                        required 
                        autoFocus
                        value={newUserForm.name}
                        onChange={e => setNewUserForm({...newUserForm, name: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-accent rounded-2xl py-4 px-6 font-bold outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Rôle</label>
                        <select 
                          value={newUserForm.role}
                          onChange={e => setNewUserForm({...newUserForm, role: e.target.value as any})}
                          className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-accent rounded-2xl py-4 px-4 font-bold outline-none text-[10px] uppercase tracking-widest"
                        >
                          <option value="admin">Administrateur</option>
                          <option value="manager">Gestionnaire</option>
                          <option value="cashier">Caissier</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Mot de Passe</label>
                        <input 
                          type="password"
                          required
                          value={newUserForm.password}
                          onChange={e => setNewUserForm({...newUserForm, password: e.target.value})}
                          className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-accent rounded-2xl py-4 px-6 font-bold outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Couleur du profil</label>
                      <div className="flex space-x-3">
                        {PROFILE_COLORS.map((c) => (
                          <button 
                            key={c}
                            type="button"
                            onClick={() => setNewUserForm({...newUserForm, color: c})}
                            className={`w-10 h-10 rounded-xl bg-gradient-to-br ${c} border-4 transition-all ${newUserForm.color === c ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-50'}`}
                          />
                        ))}
                      </div>
                    </div>

                    <button type="submit" className="w-full py-5 bg-accent text-white rounded-3xl font-black uppercase text-xs tracking-widest shadow-xl active:scale-95 transition-all">
                      Finaliser la création
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'account' && (
           <div className="p-12 space-y-12 animate-fadeIn max-w-2xl mx-auto w-full">
              <div className="text-center space-y-4">
                 <div className={`w-24 h-24 rounded-3xl bg-gradient-to-br ${currentUser.color} flex items-center justify-center text-white text-3xl font-black shadow-2xl mx-auto`}>
                    {currentUser.initials}
                 </div>
                 <div>
                    <h2 className="text-2xl font-black uppercase tracking-tight">{currentUser.name}</h2>
                    <p className="text-accent font-black text-[10px] uppercase tracking-widest mt-1">{currentUser.role}</p>
                 </div>
              </div>

              <form onSubmit={handleUpdatePassword} className="bg-slate-50 dark:bg-slate-800/50 p-10 rounded-[3rem] border border-slate-100 dark:border-slate-800 space-y-6 shadow-sm">
                 <div className="flex items-center space-x-3 mb-4">
                    <Shield size={20} className="text-accent" />
                    <h3 className="text-sm font-black uppercase tracking-widest">Modifier le Mot de Passe</h3>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Ancien Mot de Passe</label>
                    <div className="relative">
                       <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                       <input 
                          type={showPass ? "text" : "password"}
                          required
                          value={passwordForm.oldPassword}
                          onChange={e => setPasswordForm({...passwordForm, oldPassword: e.target.value})}
                          className="w-full bg-white dark:bg-slate-900 border-2 border-transparent focus:border-accent rounded-2xl py-4 pl-12 pr-12 font-bold outline-none transition-all"
                       />
                    </div>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Nouveau Mot de Passe</label>
                    <div className="relative">
                       <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                       <input 
                          type={showPass ? "text" : "password"}
                          required
                          value={passwordForm.newPassword}
                          onChange={e => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                          className="w-full bg-white dark:bg-slate-900 border-2 border-transparent focus:border-accent rounded-2xl py-4 pl-12 pr-12 font-bold outline-none transition-all"
                       />
                       <button 
                          type="button" 
                          onClick={() => setShowPass(!showPass)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-accent"
                       >
                          {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                       </button>
                    </div>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Confirmer le Nouveau Mot de Passe</label>
                    <div className="relative">
                       <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                       <input 
                          type={showPass ? "text" : "password"}
                          required
                          value={passwordForm.confirmPassword}
                          onChange={e => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                          className="w-full bg-white dark:bg-slate-900 border-2 border-transparent focus:border-accent rounded-2xl py-4 pl-12 pr-12 font-bold outline-none transition-all"
                       />
                    </div>
                 </div>

                 <button type="submit" className="w-full py-4 bg-accent text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-accent/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center">
                    <Save size={18} className="mr-3" /> Mettre à jour les accès
                 </button>
              </form>

              <div className="bg-slate-900 text-white p-6 rounded-[2rem] border border-white/10 flex items-center space-x-4">
                 <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl"><Info size={24}/></div>
                 <p className="text-[10px] font-bold text-slate-400 uppercase leading-relaxed">
                   Conseil : Utilisez un code unique que vous ne partagez pas. La sécurité de la caisse dépend de la confidentialité de vos accès.
                 </p>
              </div>
           </div>
        )}
      </div>
    </div>
  );
};

// Internal Sub-component for Icon
const UserPlus = ({ size, className }: any) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <line x1="19" y1="8" x2="19" y2="14" />
    <line x1="22" y1="11" x2="16" y2="11" />
  </svg>
);

export default Settings;
