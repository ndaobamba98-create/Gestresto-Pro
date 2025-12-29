
import React, { useState } from 'react';
import { Product, ERPConfig, RolePermission, UserRole, ViewType, AppTheme } from '../types';
import { 
  Settings as SettingsIcon, 
  Plus, 
  Edit3, 
  Trash2, 
  Save, 
  X,
  ChefHat,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ListOrdered,
  Palette,
  Eye,
  Lock,
  Unlock,
  Building2,
  Mail,
  Phone,
  MapPin,
  Globe,
  Check,
  Hash,
  LayoutDashboard,
  Monitor,
  FileText,
  ShoppingCart,
  Package,
  BarChart3,
  IdCard,
  LogOut,
  Users
} from 'lucide-react';

interface Props {
  products: Product[];
  onUpdateProducts: (products: Product[]) => void;
  config: ERPConfig;
  onUpdateConfig: (config: ERPConfig) => void;
  rolePermissions: RolePermission[];
  onUpdatePermissions: (perms: RolePermission[]) => void;
  notify: (title: string, message: string, type?: 'success' | 'info' | 'warning') => void;
}

type SubView = 'menu' | 'general' | 'security' | 'sequence';

const viewLabels: Record<ViewType, string> = {
  dashboard: 'Tableau de Bord',
  pos: 'Caisse POS',
  invoicing: 'Facturation',
  sales: 'Ventes & Commandes',
  inventory: 'Stock & Menu',
  reports: 'Analyses',
  hr: 'Employés (RH)',
  settings: 'Paramètres',
  logout: 'Se déconnecter',
  switch_account: 'Changer de compte'
};

const Settings: React.FC<Props> = ({ products, onUpdateProducts, config, onUpdateConfig, rolePermissions, onUpdatePermissions, notify }) => {
  const [subView, setSubView] = useState<SubView>('menu');
  const [isEditing, setIsEditing] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Partial<Product> | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string, name: string } | null>(null);
  
  const [formConfig, setFormConfig] = useState<ERPConfig>(config);

  const categories = Array.from(new Set(products.map(p => p.category))).sort();

  const themes: { id: AppTheme; label: string; color: string }[] = [
    { id: 'purple', label: 'Violet', color: 'bg-purple-600' },
    { id: 'emerald', label: 'Émeraude', color: 'bg-emerald-600' },
    { id: 'blue', label: 'Bleu Royal', color: 'bg-blue-600' },
    { id: 'rose', label: 'Passion Rose', color: 'bg-rose-600' },
    { id: 'amber', label: 'Ambre', color: 'bg-amber-600' },
    { id: 'slate', label: 'Ardoise Pro', color: 'bg-slate-600' },
  ];

  const togglePermission = (role: UserRole, view: ViewType) => {
    const updated = rolePermissions.map(rp => {
      if (rp.role === role) {
        const hasView = rp.allowedViews.includes(view);
        return {
          ...rp,
          allowedViews: hasView 
            ? rp.allowedViews.filter(v => v !== view) 
            : [...rp.allowedViews, view]
        };
      }
      return rp;
    });
    onUpdatePermissions(updated);
    notify("Permissions mises à jour", `Accès ${viewLabels[view]} modifié pour ${role}.`, 'info');
  };

  const handleEdit = (product: Product) => {
    setCurrentProduct(product);
    setIsEditing(true);
  };

  const handleAddNew = () => {
    setCurrentProduct({
      id: `P${Date.now()}`,
      name: '',
      price: 0,
      category: categories[0] || 'Boissons',
      stock: 999,
      sku: `SKU-${Date.now().toString().slice(-4)}`
    });
    setIsEditing(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProduct || !currentProduct.name) return;
    const productToSave = currentProduct as Product;
    if (products.find(p => p.id === productToSave.id)) {
      onUpdateProducts(products.map(p => p.id === productToSave.id ? productToSave : p));
      notify("Mis à jour", `${productToSave.name} a été modifié.`, 'success');
    } else {
      onUpdateProducts([...products, productToSave].sort((a, b) => a.name.localeCompare(b.name)));
      notify("Nouveau produit", `${productToSave.name} ajouté au menu.`, 'success');
    }
    setIsEditing(false);
    setCurrentProduct(null);
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateConfig(formConfig);
    notify("Paramètres enregistrés", "Les modifications ont été appliquées.", 'success');
  };

  const renderSequenceSettings = () => (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Identifiants Séquences</h1>
        <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Gérez le format de numérotation automatique de vos pièces comptables.</p>
      </div>
      
      <form onSubmit={handleSaveConfig} className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 border border-slate-200 dark:border-slate-800 shadow-sm space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center">
              <ListOrdered size={14} className="mr-2 text-purple-600" /> Préfixe des Factures
            </label>
            <input 
              type="text" 
              value={formConfig.invoicePrefix} 
              onChange={(e) => setFormConfig({...formConfig, invoicePrefix: e.target.value})} 
              className="w-full px-5 py-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 dark:bg-slate-800 focus:border-purple-500 outline-none font-black text-slate-900 dark:text-white transition-all" 
              placeholder="ex: FAC/2025/" 
            />
            <p className="text-[9px] text-slate-400 font-bold uppercase">S'affiche avant le numéro (ex: {formConfig.invoicePrefix}00001)</p>
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center">
              <Hash size={14} className="mr-2 text-purple-600" /> Prochain Numéro
            </label>
            <input 
              type="number" 
              min="1" 
              value={formConfig.nextInvoiceNumber} 
              onChange={(e) => setFormConfig({...formConfig, nextInvoiceNumber: parseInt(e.target.value) || 1})} 
              className="w-full px-5 py-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 dark:bg-slate-800 focus:border-purple-500 outline-none font-black text-slate-900 dark:text-white transition-all" 
            />
            <p className="text-[9px] text-slate-400 font-bold uppercase">Incrémenté automatiquement après chaque validation.</p>
          </div>
        </div>

        <div className="p-8 bg-slate-50 dark:bg-slate-800 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center text-center">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Aperçu du prochain document :</p>
           <div className="px-8 py-4 bg-white dark:bg-slate-950 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800">
             <p className="text-4xl font-mono font-black text-purple-600 tracking-tighter">
               {formConfig.invoicePrefix}{String(formConfig.nextInvoiceNumber).padStart(5, '0')}
             </p>
           </div>
        </div>

        <div className="flex justify-end pt-4">
          <button type="submit" className="bg-purple-600 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-purple-900/20 active:scale-95 transition-all flex items-center">
            <Save size={18} className="mr-3" /> Appliquer les Séquences
          </button>
        </div>
      </form>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="max-w-5xl mx-auto space-y-8 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Rôles & Accès</h1>
        <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Définissez quels modules et actions sont autorisés pour chaque type d'utilisateur.</p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
              <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Module / Action</th>
              {(['admin', 'manager', 'cashier'] as UserRole[]).map(role => (
                <th key={role} className="px-8 py-6 text-center text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest">
                  {role === 'admin' ? 'Administrateur' : role === 'manager' ? 'Manager' : 'Caissier'}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {(Object.keys(viewLabels) as ViewType[]).map(viewKey => (
              <tr key={viewKey} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <td className="px-8 py-6">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-lg">
                       {viewKey === 'dashboard' && <LayoutDashboard size={18} />}
                       {viewKey === 'pos' && <Monitor size={18} />}
                       {viewKey === 'invoicing' && <FileText size={18} />}
                       {viewKey === 'sales' && <ShoppingCart size={18} />}
                       {viewKey === 'inventory' && <Package size={18} />}
                       {viewKey === 'reports' && <BarChart3 size={18} />}
                       {viewKey === 'hr' && <IdCard size={18} />}
                       {viewKey === 'settings' && <SettingsIcon size={18} />}
                       {viewKey === 'logout' && <LogOut size={18} />}
                       {viewKey === 'switch_account' && <Users size={18} />}
                    </div>
                    <span className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">{viewLabels[viewKey]}</span>
                  </div>
                </td>
                {(['admin', 'manager', 'cashier'] as UserRole[]).map(role => {
                  const hasAccess = rolePermissions.find(rp => rp.role === role)?.allowedViews.includes(viewKey);
                  return (
                    <td key={role} className="px-8 py-6 text-center">
                      <button 
                        onClick={() => togglePermission(role, viewKey)}
                        disabled={role === 'admin' && (viewKey === 'settings' || viewKey === 'logout' || viewKey === 'switch_account')} 
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                          hasAccess 
                            ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-900/20 scale-110' 
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600 grayscale'
                        }`}
                      >
                        {hasAccess ? <Unlock size={18} /> : <Lock size={18} />}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="p-6 bg-purple-50 dark:bg-purple-900/10 rounded-2xl border border-purple-100 dark:border-purple-800/50 flex items-start space-x-4">
        <div className="p-2 bg-purple-600 text-white rounded-lg mt-1"><ShieldCheck size={18} /></div>
        <div>
          <h4 className="text-xs font-black text-purple-800 dark:text-purple-400 uppercase tracking-widest mb-1">Traçabilité Active</h4>
          <p className="text-[10px] font-bold text-purple-600 dark:text-purple-500 uppercase leading-relaxed">
            Chaque modification des permissions est enregistrée dans le journal d'audit du système pour garantir une sécurité maximale.
          </p>
        </div>
      </div>
    </div>
  );

  const renderGeneralSettings = () => (
    <form onSubmit={handleSaveConfig} className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Paramètres Généraux</h1>
        <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Identité légale et apparence visuelle de votre établissement.</p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-10 shadow-sm space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center">
              <Building2 size={14} className="mr-2 text-purple-600" /> Nom de l'établissement
            </label>
            <input 
              value={formConfig.companyName} 
              onChange={e => setFormConfig({...formConfig, companyName: e.target.value})} 
              className="w-full px-5 py-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 dark:bg-slate-800 focus:border-purple-500 outline-none font-black text-slate-900 dark:text-white" 
            />
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center">
              <Globe size={14} className="mr-2 text-purple-600" /> Registre de Commerce (RC)
            </label>
            <input 
              value={formConfig.registrationNumber} 
              onChange={e => setFormConfig({...formConfig, registrationNumber: e.target.value})} 
              className="w-full px-5 py-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 dark:bg-slate-800 focus:border-purple-500 outline-none font-black text-slate-900 dark:text-white" 
              placeholder="RC-NKC-2025-..." 
            />
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center">
              <Mail size={14} className="mr-2 text-purple-600" /> Email Support
            </label>
            <input 
              value={formConfig.email} 
              onChange={e => setFormConfig({...formConfig, email: e.target.value})} 
              className="w-full px-5 py-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 dark:bg-slate-800 focus:border-purple-500 outline-none font-bold text-slate-900 dark:text-white" 
            />
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center">
              <Phone size={14} className="mr-2 text-purple-600" /> Téléphone Service Client
            </label>
            <input 
              value={formConfig.phone} 
              onChange={e => setFormConfig({...formConfig, phone: e.target.value})} 
              className="w-full px-5 py-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 dark:bg-slate-800 focus:border-purple-500 outline-none font-bold text-slate-900 dark:text-white" 
            />
          </div>
          <div className="space-y-3 md:col-span-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center">
              <MapPin size={14} className="mr-2 text-purple-600" /> Adresse Géographique
            </label>
            <input 
              value={formConfig.address} 
              onChange={e => setFormConfig({...formConfig, address: e.target.value})} 
              className="w-full px-5 py-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 dark:bg-slate-800 focus:border-purple-500 outline-none font-bold text-slate-900 dark:text-white" 
            />
          </div>
        </div>

        <div className="pt-10 border-t border-slate-100 dark:border-slate-800">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 block flex items-center">
            <Palette size={16} className="mr-3 text-purple-600" /> Personnalisation de l'Apparence
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {themes.map((theme) => (
              <button
                key={theme.id}
                type="button"
                onClick={() => setFormConfig({...formConfig, theme: theme.id})}
                className={`p-5 rounded-[1.5rem] border-2 transition-all flex flex-col items-center space-y-3 shadow-sm ${formConfig.theme === theme.id ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/30 scale-105' : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-200'}`}
              >
                <div className={`w-10 h-10 rounded-full ${theme.color} shadow-lg border-2 border-white`}></div>
                <span className={`text-[10px] font-black uppercase tracking-widest ${formConfig.theme === theme.id ? 'text-purple-600' : 'text-slate-400'}`}>{theme.label}</span>
                {formConfig.theme === theme.id && <div className="bg-purple-600 text-white p-1 rounded-full"><Check size={10} /></div>}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-8 border-t border-slate-100 dark:border-slate-800">
          <button type="submit" className="bg-purple-600 text-white px-12 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-purple-900/20 active:scale-95 transition-all flex items-center">
            <Save size={20} className="mr-3" /> Mettre à jour l'identité
          </button>
        </div>
      </div>
    </form>
  );

  return (
    <div className="h-full flex flex-col md:flex-row bg-slate-50 dark:bg-slate-950 animate-fadeIn transition-colors pb-10">
      {/* Sidebar de Navigation interne */}
      <div className="w-full md:w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-8 space-y-2 flex flex-col shrink-0">
        <h2 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] mb-8 px-4">Paramètres ERP</h2>
        <button onClick={() => setSubView('menu')} className={`w-full flex items-center space-x-4 p-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${subView === 'menu' ? 'bg-purple-600 text-white shadow-xl shadow-purple-900/20' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
          <ChefHat size={18} /><span>Carte & Prix</span>
        </button>
        <button onClick={() => setSubView('sequence')} className={`w-full flex items-center space-x-4 p-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${subView === 'sequence' ? 'bg-purple-600 text-white shadow-xl shadow-purple-900/20' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
          <ListOrdered size={18} /><span>Séquences ID</span>
        </button>
        <button onClick={() => setSubView('security')} className={`w-full flex items-center space-x-4 p-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${subView === 'security' ? 'bg-purple-600 text-white shadow-xl shadow-purple-900/20' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
          <ShieldCheck size={18} /><span>Rôles & Accès</span>
        </button>
        <button onClick={() => setSubView('general')} className={`w-full flex items-center space-x-4 p-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${subView === 'general' ? 'bg-purple-600 text-white shadow-xl shadow-purple-900/20' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
          <SettingsIcon size={18} /><span>Entreprise</span>
        </button>
      </div>

      {/* Contenu de la sous-vue */}
      <div className="flex-1 p-10 overflow-y-auto">
        {subView === 'sequence' ? renderSequenceSettings() : 
         subView === 'security' ? renderSecuritySettings() : 
         subView === 'general' ? renderGeneralSettings() : (
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h1 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Gestion du Menu</h1>
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Modifiez votre carte, vos prix et vos stocks en temps réel.</p>
              </div>
              <button onClick={handleAddNew} className="bg-purple-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-purple-900/20 active:scale-95 transition-all flex items-center">
                <Plus size={20} className="mr-3" /> Nouveau Plat
              </button>
            </div>
            
            {isEditing && currentProduct ? (
              <div className="bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] border-2 border-purple-500 shadow-2xl animate-scaleIn">
                <form onSubmit={handleSaveProduct} className="space-y-8">
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Désignation du plat</label>
                      <input required value={currentProduct.name} onChange={e => setCurrentProduct({...currentProduct, name: e.target.value})} className="w-full px-5 py-4 border-2 border-slate-100 dark:border-slate-800 dark:bg-slate-800 dark:text-white rounded-2xl font-black focus:border-purple-500 outline-none transition-all" />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Prix ({config.currency})</label>
                      <input type="number" required value={currentProduct.price || ''} onChange={e => setCurrentProduct({...currentProduct, price: parseFloat(e.target.value) || 0})} className="w-full px-5 py-4 border-2 border-slate-100 dark:border-slate-800 dark:bg-slate-800 dark:text-white rounded-2xl font-black focus:border-purple-500 outline-none transition-all" />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-4 pt-8 border-t border-slate-50 dark:border-slate-800">
                    <button type="button" onClick={() => setIsEditing(false)} className="px-8 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest text-slate-500 dark:text-slate-400">Annuler</button>
                    <button type="submit" className="bg-purple-600 text-white px-12 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl">Enregistrer l'Article</button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                      <th className="px-8 py-5 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Désignation</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest text-center">Catégorie</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest text-right">Tarif</th>
                      <th className="px-8 py-5 text-right text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {products.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 group transition-colors">
                        <td className="px-8 py-6">
                          <p className="font-black text-sm text-slate-800 dark:text-white uppercase tracking-tight">{p.name}</p>
                          <p className="text-[10px] font-bold text-slate-400 font-mono tracking-widest">{p.sku}</p>
                        </td>
                        <td className="px-8 py-6 text-center">
                          <span className="text-[9px] font-black uppercase tracking-widest px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg border border-slate-200 dark:border-slate-700">{p.category}</span>
                        </td>
                        <td className="px-8 py-6 text-right font-black text-purple-600 dark:text-purple-400 text-lg">
                          {p.price.toLocaleString()} {config.currency}
                        </td>
                        <td className="px-8 py-6 text-right opacity-0 group-hover:opacity-100 transition-all flex items-center justify-end space-x-2">
                          <button onClick={() => handleEdit(p)} className="p-3 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-xl transition-all hover:scale-110">
                            <Edit3 size={18}/>
                          </button>
                          <button onClick={() => setDeleteConfirm({id: p.id, name: p.name})} className="p-3 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-xl transition-all hover:scale-110">
                            <Trash2 size={18}/>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {deleteConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 w-full max-sm rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 p-10 flex flex-col items-center">
            <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-2xl flex items-center justify-center mb-6 transform rotate-6">
              <AlertTriangle size={32} />
            </div>
            <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2 text-center uppercase tracking-tight">Supprimer ?</h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-bold text-center mb-10 uppercase leading-relaxed tracking-wider">
              Voulez-vous vraiment retirer <span className="text-slate-900 dark:text-white font-black">"{deleteConfirm.name}"</span> de votre base de données ?
            </p>
            <div className="grid grid-cols-2 gap-4 w-full">
              <button onClick={() => setDeleteConfirm(null)} className="py-4 px-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black rounded-2xl text-[10px] uppercase tracking-widest">Annuler</button>
              <button onClick={() => {
                onUpdateProducts(products.filter(p => p.id !== deleteConfirm.id));
                setDeleteConfirm(null);
                notify("Article supprimé", "Le menu a été mis à jour.", 'info');
              }} className="py-4 px-4 bg-rose-600 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest shadow-xl shadow-rose-900/20">Confirmer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
