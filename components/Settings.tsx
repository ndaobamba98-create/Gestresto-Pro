
import React, { useState, useMemo } from 'react';
import { Product, ERPConfig, UserRole, ViewType, RolePermission, Language, AppTheme } from '../types';
import { 
  Save, Plus, Trash2, Edit3, Building2, Layers, ShieldCheck, Lock, ChevronUp, ChevronDown, Check, X, 
  FileText, Percent, Hash, Info, Printer, QrCode, CreditCard, Layout, Languages, DollarSign, Type, Bell, Sun, Moon, Palette, Fingerprint, EyeOff, Eye
} from 'lucide-react';
import { AppLogoDoc } from './Invoicing';

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

const Settings: React.FC<Props> = ({ products, onUpdateProducts, config, onUpdateConfig, rolePermissions, onUpdatePermissions, notify, t, userPermissions }) => {
  const [activeTab, setActiveTab] = useState<'general' | 'billing' | 'categories' | 'security'>('general');
  const [formConfig, setFormConfig] = useState<ERPConfig>(config);
  const [newCat, setNewCat] = useState('');
  
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

  const moveCategory = (index: number, direction: 'up' | 'down') => {
    const newCategories = [...formConfig.categories];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex >= 0 && targetIndex < newCategories.length) {
      [newCategories[index], newCategories[targetIndex]] = [newCategories[targetIndex], newCategories[index]];
      setFormConfig({ ...formConfig, categories: newCategories });
    }
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
    { id: 'manage_notifications', label: 'Gérer Notifications (Cloche)' },
  ];

  const roles: UserRole[] = ['admin', 'manager', 'cashier'];

  const nextInvoicePreview = useMemo(() => {
    const prefix = formConfig.invoicePrefix || '';
    const num = formConfig.nextInvoiceNumber || 1;
    const paddedNum = num.toString().padStart(4, '0');
    return `${prefix}${paddedNum}`;
  }, [formConfig.invoicePrefix, formConfig.nextInvoiceNumber]);

  const toggleConfigField = (field: keyof ERPConfig) => {
    setFormConfig(prev => ({ ...prev, [field]: !prev[field] }));
  };

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
            <div className="flex items-center space-x-4 rtl:space-x-reverse">
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
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Slogan publicitaire</label>
                <input value={formConfig.companySlogan} onChange={e => setFormConfig({...formConfig, companySlogan: e.target.value})} className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-purple-500 rounded-2xl font-bold outline-none transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Numéro de Registre (RC/NIF)</label>
                <input value={formConfig.registrationNumber} onChange={e => setFormConfig({...formConfig, registrationNumber: e.target.value})} className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-purple-500 rounded-2xl font-bold outline-none transition-all" />
              </div>
            </div>

            <div className="pt-12 border-t space-y-8">
              <div className="flex items-center space-x-4 rtl:space-x-reverse">
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
              <button type="submit" className="bg-purple-600 text-white px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl flex items-center hover:bg-purple-700 transition-all"><Save size={18} className="mr-3 rtl:ml-3" /> {t('save')}</button>
            </div>
          </form>
        )}

        {activeTab === 'billing' && (
          <form onSubmit={handleSaveConfig} className="p-12 space-y-12 animate-fadeIn">
            <div className="flex items-center space-x-4 rtl:space-x-reverse">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-2xl"><FileText size={24} /></div>
              <h2 className="text-xl font-black uppercase tracking-tight">Personnalisation de la Facture</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              <div className="lg:col-span-2 space-y-10">
                
                {/* SECTION SEQUENCE DE NUMEROTATION */}
                <div className="p-8 bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] border border-slate-100 dark:border-slate-800 space-y-6">
                   <div className="flex items-center space-x-3 mb-2">
                     <Fingerprint className="text-blue-500" size={20} />
                     <h3 className="text-xs font-black uppercase tracking-widest">Séquence de Numérotation (Référence)</h3>
                   </div>
                   
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Préfixe de la référence</label>
                        <div className="relative">
                          <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                          <input value={formConfig.invoicePrefix} onChange={e => setFormConfig({...formConfig, invoicePrefix: e.target.value})} className="w-full pl-12 pr-6 py-3.5 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 focus:border-blue-500 rounded-xl font-bold outline-none" placeholder="ex: FAC/2025/" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Numéro de départ</label>
                        <input type="number" value={formConfig.nextInvoiceNumber} onChange={e => setFormConfig({...formConfig, nextInvoiceNumber: parseInt(e.target.value) || 1})} className="w-full px-6 py-3.5 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 focus:border-blue-500 rounded-xl font-bold outline-none" />
                      </div>
                   </div>

                   <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-blue-100 dark:border-blue-900/30 flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest">Aperçu de la prochaine facture :</p>
                        <p className="text-2xl font-mono font-black text-slate-900 dark:text-white tracking-tighter">{nextInvoicePreview}</p>
                      </div>
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-xl">
                        <Check size={20} />
                      </div>
                   </div>
                </div>

                {/* OPTIONS D'AFFICHAGE (PERSONNALISATION CONTENU) */}
                <div className="p-8 bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] border border-slate-100 dark:border-slate-800 space-y-6">
                   <div className="flex items-center space-x-3 mb-2">
                     <Layout className="text-purple-500" size={20} />
                     <h3 className="text-xs font-black uppercase tracking-widest">Contenu & Visibilité</h3>
                   </div>
                   
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        { label: 'Logo de l\'entreprise', field: 'showLogoOnInvoice' as keyof ERPConfig },
                        { label: 'Slogan publicitaire', field: 'showSloganOnInvoice' as keyof ERPConfig },
                        { label: 'Adresse physique', field: 'showAddressOnInvoice' as keyof ERPConfig },
                        { label: 'Numéro de téléphone', field: 'showPhoneOnInvoice' as keyof ERPConfig },
                        { label: 'Adresse Email', field: 'showEmailOnInvoice' as keyof ERPConfig },
                        { label: 'Registre Commerce (RC/NIF)', field: 'showRegNumberOnInvoice' as keyof ERPConfig },
                        { label: 'Code QR de validation', field: 'showQrCodeOnInvoice' as keyof ERPConfig },
                      ].map((item) => (
                        <button 
                          key={item.field}
                          type="button"
                          onClick={() => toggleConfigField(item.field)}
                          className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${formConfig[item.field] ? 'bg-white dark:bg-slate-900 border-purple-200 dark:border-purple-900/50 text-purple-600' : 'bg-slate-100 dark:bg-slate-800 border-transparent text-slate-400'}`}
                        >
                          <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
                          {formConfig[item.field] ? <Eye size={16} /> : <EyeOff size={16} />}
                        </button>
                      ))}
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Devise affichée</label>
                    <div className="relative">
                      <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input value={formConfig.currency} onChange={e => setFormConfig({...formConfig, currency: e.target.value})} className="w-full pl-12 pr-6 py-3.5 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-blue-500 rounded-xl font-bold outline-none" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Taux de Taxe (%)</label>
                    <div className="relative">
                      <Percent className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input type="number" value={formConfig.taxRate} onChange={e => setFormConfig({...formConfig, taxRate: parseFloat(e.target.value) || 0})} className="w-full pl-12 pr-6 py-3.5 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-blue-500 rounded-xl font-bold outline-none" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Bas de page / Mentions Légales</label>
                  <textarea 
                    rows={3} 
                    value={formConfig.receiptFooter} 
                    onChange={e => setFormConfig({...formConfig, receiptFooter: e.target.value})} 
                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-blue-500 rounded-2xl font-medium outline-none resize-none"
                    placeholder="Message de remerciement ou conditions de retour..."
                  />
                </div>

                <div className="flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-white dark:bg-slate-700 rounded-xl shadow-sm text-blue-600"><Printer size={20} /></div>
                    <div>
                      <p className="text-sm font-black uppercase tracking-tight">Impression Automatique</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase">Lancer l'impression dès la validation</p>
                    </div>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setFormConfig({...formConfig, autoPrintReceipt: !formConfig.autoPrintReceipt})}
                    className={`w-14 h-8 rounded-full relative transition-all ${formConfig.autoPrintReceipt ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                  >
                    <div className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-white shadow-md transition-transform ${formConfig.autoPrintReceipt ? 'translate-x-6' : 'translate-x-0'}`} />
                  </button>
                </div>
              </div>

              {/* APERÇU MINI FACTURE DYNAMIQUE */}
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 sticky top-0">Aperçu en temps réel</label>
                <div className="bg-slate-100 dark:bg-slate-800/30 p-8 rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center sticky top-8">
                   <div className="w-full bg-white dark:bg-slate-900 rounded-xl shadow-2xl p-6 space-y-4 text-[10px] font-mono text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-800 scale-90 origin-top">
                      <div className="text-center border-b pb-4 border-dashed">
                        {formConfig.showLogoOnInvoice && (
                          <div className="flex justify-center mb-3">
                             <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center text-white scale-75"><QrCode size={20} /></div>
                          </div>
                        )}
                        <p className="font-black text-slate-900 dark:text-white uppercase">{formConfig.companyName}</p>
                        {formConfig.showSloganOnInvoice && <p className="text-[8px]">{formConfig.companySlogan}</p>}
                        
                        <div className="mt-2 text-[7px] space-y-0.5 opacity-70">
                          {formConfig.showAddressOnInvoice && <p>{formConfig.address}</p>}
                          {formConfig.showPhoneOnInvoice && <p>Tel: {formConfig.phone}</p>}
                          {formConfig.showEmailOnInvoice && <p>{formConfig.email}</p>}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between"><span>Plat du jour</span><span>45.00</span></div>
                        <div className="flex justify-between"><span>Boisson</span><span>10.00</span></div>
                      </div>
                      <div className="border-t border-dashed pt-2 space-y-1">
                        <div className="flex justify-between font-black text-slate-900 dark:text-white text-xs"><span>TOTAL</span><span>55.00 {formConfig.currency}</span></div>
                        {formConfig.taxRate > 0 && <p className="text-[7px] italic text-right">Incluant {formConfig.taxRate}% TVA</p>}
                      </div>
                      <div className="text-center pt-4 border-t border-dashed mt-4 space-y-2">
                        <p className="italic leading-tight whitespace-pre-wrap">{formConfig.receiptFooter || "Merci de votre visite !"}</p>
                        {formConfig.showQrCodeOnInvoice && <div className="flex justify-center py-2 opacity-50"><QrCode size={30} /></div>}
                        <p className="text-[7px] uppercase font-black">Numéro: {nextInvoicePreview}</p>
                        {formConfig.showRegNumberOnInvoice && <p className="text-[6px] opacity-40">RC: {formConfig.registrationNumber}</p>}
                      </div>
                   </div>
                   <p className="text-[9px] font-black text-slate-400 uppercase mt-4 text-center">Simulation du rendu final</p>
                </div>
              </div>
            </div>

            <div className="pt-8 border-t flex justify-end">
              <button type="submit" className="bg-purple-600 text-white px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl flex items-center hover:bg-purple-700 transition-all active:scale-95"><Save size={18} className="mr-3" /> Enregistrer les changements</button>
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
              <button onClick={handleSavePermissions} className="bg-purple-600 text-white px-8 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center hover:bg-purple-700 transition-all"><Save size={16} className="mr-2 rtl:ml-2" /> Appliquer les Droits</button>
            </div>
            <div className="overflow-x-auto rounded-[2rem] border border-slate-100 dark:border-slate-800">
              <table className="w-full text-left rtl:text-right">
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
                              <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${isAllowed ? (config.language === 'ar' ? '-translate-x-6' : 'translate-x-6') : 'translate-x-0'}`} />
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
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-2xl"><Layers size={24} /></div>
              <h2 className="text-xl font-black uppercase tracking-tight">Configuration du Menu</h2>
            </div>
            <div className="space-y-4">
               {formConfig.categories.map((cat, i) => (
                 <div key={i} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 hover:border-purple-200 transition-all">
                    <div className="flex items-center">
                       <span className="w-8 h-8 rounded-lg bg-white dark:bg-slate-700 flex items-center justify-center text-[10px] font-black text-slate-400 mr-4 border">{i + 1}</span>
                       <span className="font-bold uppercase text-sm">{cat}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                       <button type="button" onClick={() => moveCategory(i, 'up')} className="p-2 text-slate-400 hover:text-purple-600 disabled:opacity-30" disabled={i === 0}><ChevronUp size={18}/></button>
                       <button type="button" onClick={() => moveCategory(i, 'down')} className="p-2 text-slate-400 hover:text-purple-600 disabled:opacity-30" disabled={i === formConfig.categories.length - 1}><ChevronDown size={18}/></button>
                       <button type="button" onClick={() => setFormConfig({...formConfig, categories: formConfig.categories.filter((_, idx) => idx !== i)})} className="p-2 text-slate-400 hover:text-rose-600 ml-4"><Trash2 size={18}/></button>
                    </div>
                 </div>
               ))}
               <div className="flex space-x-2 pt-4">
                  <div className="relative flex-1">
                    <Type className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input value={newCat} onChange={e => setNewCat(e.target.value)} placeholder="Nom de la nouvelle catégorie..." className="w-full pl-12 pr-6 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl font-bold outline-none focus:border-purple-500" />
                  </div>
                  <button type="button" onClick={() => { if(newCat) { setFormConfig({...formConfig, categories: [...formConfig.categories, newCat]}); setNewCat(''); } }} className="bg-purple-600 text-white px-8 py-4 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-purple-700 transition-all shadow-lg">Ajouter</button>
               </div>
            </div>
            <div className="pt-8 border-t flex justify-end">
              <button type="button" onClick={handleSaveConfig} className="bg-purple-600 text-white px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl flex items-center hover:bg-purple-700 transition-all active:scale-95"><Save size={18} className="mr-3 rtl:ml-3" /> {t('save')}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
