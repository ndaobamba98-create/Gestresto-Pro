
import React, { useState } from 'react';
import { Product, ERPConfig, RolePermission, UserRole, ViewType } from '../types';
import { 
  Settings as SettingsIcon, 
  Plus, 
  Edit3, 
  Trash2, 
  UtensilsCrossed, 
  Save, 
  X,
  ChefHat,
  Building2,
  Globe,
  Receipt,
  Mail,
  Phone,
  MapPin,
  DollarSign,
  Percent,
  Check,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  LayoutDashboard, 
  Monitor, 
  FileText, 
  ShoppingCart, 
  Package, 
  BarChart3, 
  IdCard
} from 'lucide-react';

interface Props {
  products: Product[];
  onUpdateProducts: (products: Product[]) => void;
  config: ERPConfig;
  onUpdateConfig: (config: ERPConfig) => void;
  rolePermissions: RolePermission[];
  onUpdatePermissions: (perms: RolePermission[]) => void;
}

type SubView = 'menu' | 'general' | 'security';

const Settings: React.FC<Props> = ({ products, onUpdateProducts, config, onUpdateConfig, rolePermissions, onUpdatePermissions }) => {
  const [subView, setSubView] = useState<SubView>('menu');
  const [isEditing, setIsEditing] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Partial<Product> | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string, name: string } | null>(null);
  
  const [formConfig, setFormConfig] = useState<ERPConfig>(config);
  const [saveStatus, setSaveStatus] = useState(false);

  const categories = Array.from(new Set(products.map(p => p.category))).sort();

  const handleEdit = (product: Product) => {
    setCurrentProduct(product);
    setIsEditing(true);
  };

  const handleAddNew = () => {
    setCurrentProduct({
      id: `P${Date.now()}`,
      name: '',
      price: 0,
      category: categories[0] || 'Fast Food & Snacks',
      stock: 100,
      sku: `SKU-${Date.now().toString().slice(-4)}`
    });
    setIsEditing(true);
  };

  const handleDelete = () => {
    if (deleteConfirm) {
      onUpdateProducts(products.filter(p => p.id !== deleteConfirm.id));
      setDeleteConfirm(null);
    }
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProduct) return;
    if (products.find(p => p.id === currentProduct.id)) {
      onUpdateProducts(products.map(p => p.id === currentProduct.id ? (currentProduct as Product) : p));
    } else {
      onUpdateProducts([...products, currentProduct as Product].sort((a, b) => a.name.localeCompare(b.name)));
    }
    setIsEditing(false);
    setCurrentProduct(null);
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateConfig(formConfig);
    setSaveStatus(true);
    setTimeout(() => setSaveStatus(false), 3000);
  };

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
  };

  const renderSecuritySettings = () => (
    <div className="max-w-5xl mx-auto space-y-8 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-white">Accès & Sécurité</h1>
          <p className="text-slate-500 dark:text-slate-400">Gérez les permissions de vos collaborateurs par rôle.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Module / Vue</th>
                {(['admin', 'manager', 'cashier'] as UserRole[]).map(role => (
                  <th key={role} className="px-6 py-4 text-center">
                    <span className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest">{role}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {(['dashboard', 'pos', 'invoicing', 'sales', 'inventory', 'reports', 'hr', 'settings'] as ViewType[]).map(view => (
                <tr key={view} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500">
                        {view === 'dashboard' && <LayoutDashboard size={14} />}
                        {view === 'pos' && <Monitor size={14} />}
                        {view === 'invoicing' && <FileText size={14} />}
                        {view === 'sales' && <ShoppingCart size={14} />}
                        {view === 'inventory' && <Package size={14} />}
                        {view === 'reports' && <BarChart3 size={14} />}
                        {view === 'hr' && <IdCard size={14} />}
                        {view === 'settings' && <SettingsIcon size={14} />}
                      </div>
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300 capitalize">{view === 'hr' ? 'Ressources Humaines' : view}</span>
                    </div>
                  </td>
                  {(['admin', 'manager', 'cashier'] as UserRole[]).map(role => {
                    const isAllowed = rolePermissions.find(rp => rp.role === role)?.allowedViews.includes(view);
                    const isAdmin = role === 'admin';
                    
                    return (
                      <td key={role} className="px-6 py-4 text-center">
                        <button 
                          disabled={isAdmin}
                          onClick={() => togglePermission(role, view)}
                          className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
                            isAllowed 
                              ? 'bg-purple-600 border-purple-600 text-white' 
                              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                          } ${isAdmin ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110'}`}
                        >
                          {isAllowed && <Check size={14} strokeWidth={4} />}
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

      <div className="p-6 bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-200 dark:border-amber-900/30 flex items-start space-x-4">
        <ShieldAlert className="text-amber-500 flex-shrink-0" size={24} />
        <div>
          <h4 className="text-sm font-black text-amber-800 dark:text-amber-300 uppercase tracking-tight">Note de sécurité</h4>
          <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">Le rôle <strong>Admin</strong> dispose par défaut de tous les accès et ne peut pas être modifié pour garantir la gestion du système.</p>
        </div>
      </div>
    </div>
  );

  const renderGeneralSettings = () => (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-white">Paramètres Généraux</h1>
          <p className="text-slate-500 dark:text-slate-400">Identité et préférences globales de MYA D'OR.</p>
        </div>
        {saveStatus && (
          <div className="flex items-center text-emerald-600 font-bold animate-bounce">
            <CheckCircle2 size={18} className="mr-2" /> Mis à jour !
          </div>
        )}
      </div>

      <form onSubmit={handleSaveConfig} className="space-y-8">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-purple-50 dark:bg-purple-900/20 text-purple-600 rounded-lg"><Building2 size={20} /></div>
            <h3 className="font-black text-lg text-slate-800 dark:text-white uppercase tracking-tight">Entreprise</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Enseigne commerciale</label>
              <input type="text" value={formConfig.companyName} onChange={(e) => setFormConfig({...formConfig, companyName: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none transition-all" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Slogan de marque</label>
              <input type="text" value={formConfig.companySlogan} onChange={(e) => setFormConfig({...formConfig, companySlogan: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none transition-all" />
            </div>
          </div>
        </div>
        <div className="flex justify-end pt-4">
          <button type="submit" className="bg-purple-600 text-white px-12 py-4 rounded-2xl font-black text-lg hover:bg-purple-700 shadow-xl transition-all flex items-center transform active:scale-95"><Save size={20} className="mr-2" /> Enregistrer</button>
        </div>
      </form>
    </div>
  );

  return (
    <div className="h-full flex flex-col md:flex-row bg-slate-50 dark:bg-slate-950 animate-fadeIn transition-colors pb-10">
      {/* Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden animate-scaleIn border border-slate-200 dark:border-slate-800 p-8 flex flex-col items-center">
            <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-full flex items-center justify-center mb-6">
              <AlertTriangle size={32} />
            </div>
            <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2 text-center">Confirmation</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm text-center mb-8">
              Voulez-vous vraiment supprimer le plat <span className="font-bold text-slate-900 dark:text-slate-100">"{deleteConfirm.name}"</span> ? Cette action est irréversible.
            </p>
            <div className="grid grid-cols-2 gap-3 w-full">
              <button onClick={() => setDeleteConfirm(null)} className="py-3 px-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold rounded-2xl hover:bg-slate-200 transition-all text-xs uppercase tracking-widest">Annuler</button>
              <button onClick={handleDelete} className="py-3 px-4 bg-rose-600 text-white font-bold rounded-2xl hover:bg-rose-700 shadow-lg shadow-rose-900/20 transition-all text-xs uppercase tracking-widest">Supprimer</button>
            </div>
          </div>
        </div>
      )}

      <div className="w-full md:w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-6 space-y-2 flex flex-col">
        <h2 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-6 px-3">Configuration</h2>
        
        <button onClick={() => {setSubView('menu'); setIsEditing(false);}} className={`w-full flex items-center space-x-3 p-3 rounded-xl font-bold transition-all ${subView === 'menu' ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}><ChefHat size={18} /><span>Gestion Menu</span></button>
        <button onClick={() => setSubView('security')} className={`w-full flex items-center space-x-3 p-3 rounded-xl font-bold transition-all ${subView === 'security' ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}><ShieldCheck size={18} /><span>Rôles & Accès</span></button>
        <button onClick={() => setSubView('general')} className={`w-full flex items-center space-x-3 p-3 rounded-xl font-bold transition-all ${subView === 'general' ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}><SettingsIcon size={18} /><span>Paramètres</span></button>
      </div>

      <div className="flex-1 p-8 overflow-y-auto">
        {subView === 'security' ? renderSecuritySettings() : subView === 'general' ? renderGeneralSettings() : (
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Gestion du Menu</h1>
                <p className="text-slate-500 dark:text-slate-400">Éditez les plats et boissons de votre carte.</p>
              </div>
              {!isEditing && <button onClick={handleAddNew} className="bg-purple-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-purple-700 shadow-lg flex items-center transition-all"><Plus size={20} className="mr-2" /> Nouveau Plat</button>}
            </div>

            {isEditing && currentProduct ? (
              <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-purple-100 dark:border-slate-800 shadow-xl animate-scaleIn">
                <form onSubmit={handleSaveProduct} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-2"><label className="text-xs font-black text-slate-400 uppercase tracking-widest">Nom</label><input type="text" required value={currentProduct.name} onChange={(e) => setCurrentProduct({...currentProduct, name: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white" /></div>
                   <div className="space-y-2"><label className="text-xs font-black text-slate-400 uppercase tracking-widest">Catégorie</label><select value={currentProduct.category} onChange={(e) => setCurrentProduct({...currentProduct, category: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white">{categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}</select></div>
                   <div className="md:col-span-2 flex justify-end space-x-3 pt-4"><button type="button" onClick={() => setIsEditing(false)} className="px-6 py-3 rounded-xl font-bold text-slate-500">Annuler</button><button type="submit" className="bg-purple-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg">Enregistrer</button></div>
                </form>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800"><th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Plat</th><th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Prix</th><th className="px-6 py-4 text-right px-6">Actions</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800">{products.map((product) => (<tr key={product.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group"><td className="px-6 py-4 flex items-center space-x-3"><div className="w-8 h-8 bg-purple-50 dark:bg-purple-900/20 rounded-lg flex items-center justify-center text-purple-600"><UtensilsCrossed size={14} /></div><span className="font-bold text-sm text-slate-700 dark:text-slate-200">{product.name}</span></td><td className="px-6 py-4 font-black text-slate-900 dark:text-white">{product.price} {config.currency}</td><td className="px-6 py-4 text-right"><button onClick={() => handleEdit(product)} className="p-2 text-slate-400 hover:text-purple-600"><Edit3 size={16} /></button><button onClick={() => setDeleteConfirm({ id: product.id, name: product.name })} className="p-2 text-slate-400 hover:text-rose-600"><Trash2 size={16} /></button></td></tr>))}</tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
