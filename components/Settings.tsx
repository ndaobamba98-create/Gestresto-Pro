
import React, { useState, useMemo } from 'react';
import { Product, ERPConfig, UserRole, ViewType, RolePermission, Language, AppTheme } from '../types';
import { 
  Save, Plus, Trash2, Edit3, Building2, Layers, ShieldCheck, Lock, ChevronUp, ChevronDown, Check, X, 
  FileText, Percent, Hash, Info, Printer, QrCode, CreditCard, Layout, Languages, DollarSign, Type, Bell, Sun, Moon, Palette, Fingerprint, EyeOff, Eye, Sparkles, Image as ImageIcon, AlignLeft, Phone, Mail, MapPin, BadgeCheck
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
  
  const [localPermissions, setLocalPermissions] = useState<RolePermission[]>(rolePermissions);

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateConfig(formConfig);
    notify(t('save'), "Configuration mise à jour avec succès.", 'success');
  };

  const themes: { id: AppTheme, label: string, color: string }[] = [
    { id: 'purple', label: 'Violet', color: 'bg-purple-600' },
    { id: 'emerald', label: 'Émeraude', color: 'bg-emerald-600' },
    { id: 'blue', label: 'Bleu Pro', color: 'bg-blue-600' },
    { id: 'rose', label: 'Rose Rubis', color: 'bg-rose-600' },
    { id: 'amber', label: 'Ambre Or', color: 'bg-amber-600' },
    { id: 'slate', label: 'Ardoise', color: 'bg-slate-600' },
  ];

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
      { id: 'categories', label: 'Menu', icon: Layers, permission: 'manage_categories' as ViewType },
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
    { id: 'manage_notifications', label: "Gérer Notifications (Bouton 'Tout lire' dans la cloche)" },
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
    <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">{t('settings')}</h1>
          <p className="text-sm text-slate-500 font-medium">Configuration globale de SamaCaisse Pro</p>
        </div>
        <div className="flex space-x-2 bg-white dark:bg-slate-900 p-1.5 rounded-[1.5rem] border border-slate-200 dark:border-slate-800 shadow-sm rtl:space-x-reverse">
          {availableTabs.map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)} 
              className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center ${activeTab === tab.id ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/20' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
            >
              <tab.icon size={14} className={`${config.language === 'ar' ? 'ml-2' : 'mr-2'}`} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden min-h-[650px]">
        {activeTab === 'general' && (
          <form onSubmit={handleSaveConfig} className="p-12 space-y-12 animate-fadeIn">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-purple-50 dark:bg-purple-900/20 text-purple-600 rounded-2xl"><Building2 size={24} /></div>
              <h2 className="text-xl font-black uppercase tracking-tight">Identité de l'établissement</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">{t('language')} par défaut</label>
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
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Nom de l'enseigne</label>
                <input value={formConfig.companyName} onChange={e => setFormConfig({...formConfig, companyName: e.target.value})} className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-purple-500 rounded-2xl font-bold outline-none transition-all" />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Email Officiel</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input type="email" value={formConfig.email} onChange={e => setFormConfig({...formConfig, email: e.target.value})} className="w-full pl-12 pr-6 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-purple-500 rounded-2xl font-bold outline-none transition-all" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Téléphone de Contact</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input value={formConfig.phone} onChange={e => setFormConfig({...formConfig, phone: e.target.value})} className="w-full pl-12 pr-6 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-purple-500 rounded-2xl font-bold outline-none transition-all" />
                </div>
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Adresse Physique</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-[24px] text-slate-400" size={20} />
                  <textarea value={formConfig.address} onChange={e => setFormConfig({...formConfig, address: e.target.value})} className="w-full pl-12 pr-6 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-purple-500 rounded-2xl font-bold outline-none transition-all h-24" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">NIF / Numéro RC</label>
                <div className="relative">
                  <BadgeCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input value={formConfig.registrationNumber} onChange={e => setFormConfig({...formConfig, registrationNumber: e.target.value})} className="w-full pl-12 pr-6 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-purple-500 rounded-2xl font-bold outline-none transition-all" />
                </div>
              </div>
            </div>

            <div className="pt-12 border-t space-y-8">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-2xl"><Palette size={24} /></div>
                <h2 className="text-xl font-black uppercase tracking-tight">Apparence & Thème</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Mode d'affichage</label>
                  <div className="flex space-x-4">
                    <button 
                      type="button"
                      onClick={() => document.documentElement.classList.remove('dark')}
                      className={`flex-1 flex items-center justify-center p-6 rounded-2xl border-2 transition-all space-x-3 ${!document.documentElement.classList.contains('dark') ? 'border-purple-600 bg-purple-50 text-purple-600' : 'border-slate-100 dark:border-slate-800 text-slate-400'}`}
                    >
                      <Sun size={20} />
                      <span className="font-black uppercase text-[10px] tracking-widest">Clair</span>
                    </button>
                    <button 
                      type="button"
                      onClick={() => document.documentElement.classList.add('dark')}
                      className={`flex-1 flex items-center justify-center p-6 rounded-2xl border-2 transition-all space-x-3 ${document.documentElement.classList.contains('dark') ? 'border-purple-600 bg-purple-900/10 text-purple-600' : 'border-slate-100 dark:border-slate-800 text-slate-400'}`}
                    >
                      <Moon size={20} />
                      <span className="font-black uppercase text-[10px] tracking-widest">Sombre</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Couleur d'accentuation</label>
                  <div className="grid grid-cols-3 gap-3">
                    {themes.map((t) => (
                      <button 
                        key={t.id}
                        type="button"
                        onClick={() => setFormConfig({...formConfig, theme: t.id})}
                        className={`group relative p-3 rounded-xl border-2 transition-all flex flex-col items-center space-y-2 ${formConfig.theme === t.id ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/10' : 'border-slate-100 dark:border-slate-800 hover:border-slate-200'}`}
                      >
                        <div className={`w-8 h-8 rounded-lg shadow-inner ${t.color}`} />
                        <span className="text-[9px] font-black uppercase tracking-tighter truncate w-full text-center">{t.label}</span>
                        {formConfig.theme === t.id && <div className="absolute -top-1 -right-1 bg-purple-600 text-white rounded-full p-0.5 shadow-md"><Check size={10} /></div>}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-8 border-t flex justify-end">
              <button type="submit" className="bg-purple-600 text-white px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl flex items-center hover:bg-purple-700 transition-all"><Save size={18} className="mr-3" /> {t('save')}</button>
            </div>
          </form>
        )}
        
        {activeTab === 'billing' && (
          <form onSubmit={handleSaveConfig} className="p-12 space-y-12 animate-fadeIn">
            <div className="flex items-center justify-between">
               <div className="flex items-center space-x-4">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-2xl"><FileText size={24} /></div>
                  <h2 className="text-xl font-black uppercase tracking-tight">Mise en page de la Facture</h2>
               </div>
               <button type="submit" className="bg-purple-600 text-white px-8 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center hover:bg-purple-700 transition-all"><Save size={16} className="mr-2" /> Publier les changements</button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
               <div className="space-y-8">
                  <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest border-b pb-4">Séquençage & Taxes</h3>
                  <div className="grid grid-cols-2 gap-6">
                     <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase text-slate-500 ml-1">Préfixe de Facture</label>
                        <div className="flex items-center bg-slate-50 dark:bg-slate-800 rounded-xl px-4 border border-slate-100 dark:border-slate-700">
                           <Type size={14} className="text-slate-400 mr-2" />
                           <input value={formConfig.invoicePrefix} onChange={e => setFormConfig({...formConfig, invoicePrefix: e.target.value})} className="w-full py-3 bg-transparent font-bold outline-none text-xs" />
                        </div>
                     </div>
                     <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase text-slate-500 ml-1">Prochain Numéro</label>
                        <div className="flex items-center bg-slate-50 dark:bg-slate-800 rounded-xl px-4 border border-slate-100 dark:border-slate-700">
                           <Hash size={14} className="text-slate-400 mr-2" />
                           <input type="number" value={formConfig.nextInvoiceNumber} onChange={e => setFormConfig({...formConfig, nextInvoiceNumber: parseInt(e.target.value) || 1})} className="w-full py-3 bg-transparent font-bold outline-none text-xs" />
                        </div>
                     </div>
                  </div>

                  <div className="space-y-2">
                     <label className="text-[9px] font-black uppercase text-slate-500 ml-1">Slogan de l'entreprise (Facture)</label>
                     <textarea value={formConfig.companySlogan} onChange={e => setFormConfig({...formConfig, companySlogan: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 font-bold text-xs outline-none focus:border-blue-500 h-24" placeholder="Votre slogan ici..." />
                  </div>

                  <div className="space-y-2">
                     <label className="text-[9px] font-black uppercase text-slate-500 ml-1">Pied de page (Reçu POS)</label>
                     <input value={formConfig.receiptFooter} onChange={e => setFormConfig({...formConfig, receiptFooter: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 font-bold text-xs outline-none focus:border-blue-500" />
                  </div>
               </div>

               <div className="space-y-6">
                  <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest border-b pb-4">Éléments à Afficher</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                     <ConfigToggle label="Afficher le Logo" icon={ImageIcon} value={formConfig.showLogoOnInvoice} onChange={v => setFormConfig({...formConfig, showLogoOnInvoice: v})} />
                     <ConfigToggle label="Afficher Slogan" icon={AlignLeft} value={formConfig.showSloganOnInvoice} onChange={v => setFormConfig({...formConfig, showSloganOnInvoice: v})} />
                     <ConfigToggle label="Afficher l'Adresse" icon={MapPin} value={formConfig.showAddressOnInvoice} onChange={v => setFormConfig({...formConfig, showAddressOnInvoice: v})} />
                     <ConfigToggle label="Afficher Téléphone" icon={Phone} value={formConfig.showPhoneOnInvoice} onChange={v => setFormConfig({...formConfig, showPhoneOnInvoice: v})} />
                     <ConfigToggle label="Afficher Email" icon={Mail} value={formConfig.showEmailOnInvoice} onChange={v => setFormConfig({...formConfig, showEmailOnInvoice: v})} />
                     <ConfigToggle label="Afficher RC/NIF" icon={BadgeCheck} value={formConfig.showRegNumberOnInvoice} onChange={v => setFormConfig({...formConfig, showRegNumberOnInvoice: v})} />
                     <ConfigToggle label="Afficher QR Code" icon={QrCode} value={formConfig.showQrCodeOnInvoice} onChange={v => setFormConfig({...formConfig, showQrCodeOnInvoice: v})} />
                     <ConfigToggle label="Impression Auto" icon={Printer} value={formConfig.autoPrintReceipt} onChange={v => setFormConfig({...formConfig, autoPrintReceipt: v})} />
                  </div>
               </div>
            </div>
          </form>
        )}
        
        {activeTab === 'security' && (
           <div className="p-12 space-y-12 animate-fadeIn">
            <div className="flex items-center justify-between rtl:flex-row-reverse">
              <div className="flex items-center space-x-4 rtl:space-x-reverse">
                <div className="p-3 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-2xl"><ShieldCheck size={24} /></div>
                <h2 className="text-xl font-black uppercase tracking-tight">Gestion des Droits & Rôles</h2>
              </div>
              <button onClick={handleSavePermissions} className="bg-purple-600 text-white px-8 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center hover:bg-purple-700 transition-all"><Save size={16} className="mr-2" /> Appliquer les Droits</button>
            </div>
            <div className="overflow-x-auto rounded-[2rem] border border-slate-100 dark:border-slate-800">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-900 text-white">
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest">Fonctionnalité / Permission</th>
                    {roles.map(role => <th key={role} className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-center">{role}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {availableViews.map(view => (
                    <tr key={view.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-8 py-5"><span className="text-xs font-black uppercase text-slate-700 dark:text-slate-200">{view.label}</span></td>
                      {roles.map(role => {
                        const isAllowed = localPermissions.find(p => p.role === role)?.allowedViews.includes(view.id);
                        const isLocked = role === 'admin' && (view.id === 'settings' || view.id === 'manage_security');
                        return (
                          <td key={role} className="px-8 py-5 text-center">
                            <button 
                              disabled={isLocked}
                              onClick={() => handleTogglePermission(role, view.id)}
                              className={`w-12 h-6 rounded-full relative transition-all ${isAllowed ? 'bg-purple-600' : 'bg-slate-200 dark:bg-slate-700'} ${isLocked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                            >
                              <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${isAllowed ? 'translate-x-6' : 'translate-x-0'}`} />
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

        {activeTab === 'categories' && (
          <div className="p-12 space-y-8 animate-fadeIn">
             <div className="flex items-center space-x-4 mb-8">
                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 text-purple-600 rounded-2xl"><Layers size={24} /></div>
                <h2 className="text-xl font-black uppercase tracking-tight">Organisation du Menu POS</h2>
             </div>
             <div className="bg-slate-50 dark:bg-slate-800/50 p-10 rounded-[2.5rem] border border-dashed border-slate-200 dark:border-slate-700">
                <p className="text-center text-slate-400 font-black uppercase text-[10px] tracking-widest">Configuration des catégories de vente</p>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
