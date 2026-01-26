
import React, { useState } from 'react';
import { Product, ERPConfig, UserRole, ViewType, RolePermission, User } from '../types';
import { 
  Save, Plus, Trash2, Building2, Layers, ShieldCheck, X, 
  FileText, Hash, Info, Printer, DollarSign, BellRing, Users, UserPlus, 
  Mail, Phone, MapPin, Percent, Tag, Bell, Check, QrCode, PackageCheck
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

const PROFILE_COLORS = [
  'from-slate-700 to-slate-900',
  'from-emerald-600 to-emerald-800',
  'from-purple-600 to-purple-800',
  'from-blue-600 to-blue-800',
  'from-rose-600 to-rose-800',
  'from-amber-600 to-amber-800'
];

const Settings: React.FC<Props> = ({ config, onUpdateConfig, notify, t, currentUser, allUsers, onUpdateUsers }) => {
  const [activeTab, setActiveTab] = useState<'general' | 'billing' | 'categories' | 'users' | 'notifications'>('general');
  const [formConfig, setFormConfig] = useState<ERPConfig>(config);
  const [newCategory, setNewCategory] = useState('');
  
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [userForm, setUserForm] = useState<Partial<User>>({
    name: '',
    role: 'cashier',
    password: '',
    color: PROFILE_COLORS[1]
  });

  const handleSaveConfig = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onUpdateConfig(formConfig);
    notify("Succès", "Configuration mise à jour.", 'success');
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

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userForm.name || !userForm.password) return;

    const initials = userForm.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    const newUser: User = {
      id: `U-${Date.now()}`,
      name: userForm.name,
      role: userForm.role as UserRole,
      password: userForm.password,
      color: userForm.color || PROFILE_COLORS[1],
      initials
    };
    onUpdateUsers([...allUsers, newUser]);
    setIsUserModalOpen(false);
    notify("Utilisateurs", `Compte ${newUser.name} créé.`, "success");
    setUserForm({ name: '', role: 'cashier', password: '', color: PROFILE_COLORS[1] });
  };

  const handleDeleteUser = (userId: string, userName: string) => {
    if (userId === currentUser.id) {
      notify("Action Interdite", "Vous ne pouvez pas supprimer votre propre compte administrateur.", "warning");
      return;
    }
    if (confirm(`Êtes-vous sûr de vouloir supprimer définitivement l'accès de ${userName} ?`)) {
      onUpdateUsers(allUsers.filter(u => u.id !== userId));
      notify("Utilisateur Supprimé", `Le compte de ${userName} a été retiré.`, "info");
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn pb-24 pr-2">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Configuration</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Paramètres système TerraPOS+</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex space-x-1 bg-white dark:bg-slate-900 p-1.5 rounded-[1.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-x-auto scrollbar-hide">
            {[
              { id: 'general', label: 'Entreprise', icon: Building2 },
              { id: 'billing', label: 'Facturation', icon: FileText },
              { id: 'categories', label: 'Menu POS', icon: Layers },
              { id: 'users', label: 'Personnel', icon: Users },
              { id: 'notifications', label: 'Alertes', icon: BellRing },
            ].map((tab) => (
              <button 
                key={tab.id} 
                onClick={() => setActiveTab(tab.id as any)} 
                className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center whitespace-nowrap ${activeTab === tab.id ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
              >
                <tab.icon size={14} className="mr-2" /> {tab.label}
              </button>
            ))}
          </div>
          <button onClick={handleSaveConfig} className="bg-emerald-600 text-white px-8 py-4 rounded-[1.5rem] font-black uppercase text-xs tracking-widest shadow-xl flex items-center hover:bg-emerald-700 transition-all">
            <Save size={18} className="mr-2"/> Sauvegarder
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm min-h-[600px] overflow-hidden">
        
        {/* TAB: GENERAL */}
        {activeTab === 'general' && (
          <div className="p-12 space-y-12 animate-fadeIn">
            <section className="space-y-6">
              <h3 className="text-xs font-black uppercase text-purple-600 tracking-[0.2em] flex items-center"><Building2 size={16} className="mr-2"/> Informations de l'établissement</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Nom Commercial</label>
                  <input value={formConfig.companyName} onChange={e => setFormConfig({...formConfig, companyName: e.target.value})} className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl font-bold border-none outline-none focus:ring-2 focus:ring-purple-500" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Slogan / Signature</label>
                  <input value={formConfig.companySlogan} onChange={e => setFormConfig({...formConfig, companySlogan: e.target.value})} className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl font-bold border-none outline-none focus:ring-2 focus:ring-purple-500" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Numéro d'Identification (NIF/RC)</label>
                  <input value={formConfig.registrationNumber} onChange={e => setFormConfig({...formConfig, registrationNumber: e.target.value})} className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl font-bold border-none outline-none focus:ring-2 focus:ring-purple-500" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Devise Locale</label>
                  <input value={formConfig.currency} onChange={e => setFormConfig({...formConfig, currency: e.target.value})} className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl font-bold border-none outline-none focus:ring-2 focus:ring-purple-500" />
                </div>
              </div>
            </section>

            <section className="space-y-6 pt-8 border-t dark:border-slate-800">
              <h3 className="text-xs font-black uppercase text-purple-600 tracking-[0.2em] flex items-center"><MapPin size={16} className="mr-2"/> Coordonnées & Contact</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Adresse Physique</label>
                  <input value={formConfig.address} onChange={e => setFormConfig({...formConfig, address: e.target.value})} className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl font-bold border-none outline-none focus:ring-2 focus:ring-purple-500" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Téléphone de contact</label>
                  <div className="flex">
                    <div className="p-4 bg-slate-200 dark:bg-slate-700 rounded-l-2xl flex items-center"><Phone size={16}/></div>
                    <input value={formConfig.phone} onChange={e => setFormConfig({...formConfig, phone: e.target.value})} className="flex-1 px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-r-2xl font-bold border-none outline-none focus:ring-2 focus:ring-purple-500" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Email Professionnel</label>
                  <div className="flex">
                    <div className="p-4 bg-slate-200 dark:bg-slate-700 rounded-l-2xl flex items-center"><Mail size={16}/></div>
                    <input value={formConfig.email} onChange={e => setFormConfig({...formConfig, email: e.target.value})} className="flex-1 px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-r-2xl font-bold border-none outline-none focus:ring-2 focus:ring-purple-500" />
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* TAB: BILLING */}
        {activeTab === 'billing' && (
          <div className="p-12 space-y-12 animate-fadeIn">
            <section className="space-y-8">
              <div className="flex items-center space-x-4 mb-4">
                 <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl"><FileText size={24}/></div>
                 <div>
                    <h3 className="text-sm font-black uppercase">Paramètres de Facturation</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Contrôle des séquences et taxes</p>
                 </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Préfixe des Factures</label>
                  <input value={formConfig.invoicePrefix} onChange={e => setFormConfig({...formConfig, invoicePrefix: e.target.value})} className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-500 rounded-2xl font-bold border-none outline-none focus:ring-2 focus:ring-indigo-500" placeholder="ex: FAC/2025/" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Prochain Numéro de Séquence</label>
                  <input type="number" value={formConfig.nextInvoiceNumber} onChange={e => setFormConfig({...formConfig, nextInvoiceNumber: parseInt(e.target.value) || 1})} className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl font-bold border-none outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Taux de Taxe (TVA %)</label>
                  <div className="flex">
                    <input type="number" value={formConfig.taxRate} onChange={e => setFormConfig({...formConfig, taxRate: parseFloat(e.target.value) || 0})} className="flex-1 px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-l-2xl font-bold border-none outline-none focus:ring-2 focus:ring-indigo-500" />
                    <div className="p-4 bg-slate-200 dark:bg-slate-700 rounded-r-2xl flex items-center"><Percent size={16}/></div>
                  </div>
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Options de Document</label>
                   <div className="flex items-center space-x-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                      {/* Fixed: QrCode is now correctly imported */}
                      <button type="button" onClick={() => setFormConfig({...formConfig, showQrCodeOnInvoice: !formConfig.showQrCodeOnInvoice})} className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${formConfig.showQrCodeOnInvoice ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-400'}`}>
                        <QrCode size={14}/> <span>QR Code</span>
                      </button>
                      <button type="button" onClick={() => setFormConfig({...formConfig, autoPrintReceipt: !formConfig.autoPrintReceipt})} className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${formConfig.autoPrintReceipt ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-400'}`}>
                        <Printer size={14}/> <span>Auto-Print</span>
                      </button>
                   </div>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Texte Pied de Page (Ticket de Caisse)</label>
                  <textarea value={formConfig.receiptFooter} onChange={e => setFormConfig({...formConfig, receiptFooter: e.target.value})} className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl font-bold border-none outline-none focus:ring-2 focus:ring-indigo-500 h-24" placeholder="Merci de votre visite..." />
                </div>
              </div>
            </section>
          </div>
        )}

        {/* TAB: CATEGORIES */}
        {activeTab === 'categories' && (
          <div className="p-12 space-y-8 animate-fadeIn">
            <div className="flex items-center space-x-4 mb-6">
               <div className="p-4 bg-orange-50 text-orange-600 rounded-2xl"><Layers size={24}/></div>
               <div>
                  <h3 className="text-sm font-black uppercase">Catégories du Menu POS</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Organisez vos articles pour la caisse</p>
               </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 p-8 rounded-[2.5rem] space-y-8 border-2 border-dashed border-slate-200 dark:border-slate-800">
               <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                     <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                     <input value={newCategory} onChange={e => setNewCategory(e.target.value)} placeholder="Nom de la nouvelle catégorie..." className="w-full pl-12 pr-6 py-4 bg-white dark:bg-slate-900 border-2 border-transparent focus:border-orange-500 rounded-2xl font-bold outline-none shadow-sm" onKeyDown={e => e.key === 'Enter' && handleAddCategory()} />
                  </div>
                  <button type="button" onClick={handleAddCategory} className="bg-slate-900 text-white p-4 rounded-2xl shadow-lg hover:bg-black transition-all">
                    <Plus size={24}/>
                  </button>
               </div>

               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {formConfig.categories.map(cat => (
                    <div key={cat} className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-between group">
                       <span className="font-black uppercase text-[10px] tracking-widest text-slate-700 dark:text-white">{cat}</span>
                       <button type="button" onClick={() => handleRemoveCategory(cat)} className="p-2 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all">
                         <Trash2 size={16}/>
                       </button>
                    </div>
                  ))}
               </div>
            </div>
            <div className="p-6 bg-blue-50 dark:bg-blue-900/10 rounded-2xl flex items-center space-x-4">
               <Info className="text-blue-500" size={20}/>
               <p className="text-[10px] font-bold text-blue-700 dark:text-blue-300 uppercase leading-relaxed">Ces catégories s'afficheront sous forme d'onglets de filtrage dans votre interface de vente POS.</p>
            </div>
          </div>
        )}

        {/* TAB: USERS */}
        {activeTab === 'users' && (
          <div className="p-12 space-y-8 animate-fadeIn">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                 <div className="p-4 bg-purple-50 text-purple-600 rounded-2xl"><Users size={24}/></div>
                 <div>
                    <h2 className="text-xl font-black uppercase">Gestion du Personnel</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Identifiants et niveaux d'accès</p>
                 </div>
              </div>
              <button onClick={() => setIsUserModalOpen(true)} className="bg-slate-900 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center shadow-xl hover:bg-black transition-all">
                <UserPlus size={18} className="mr-2"/> Nouvel IDENTIFIANT
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allUsers.map(u => (
                <div key={u.id} className="group relative bg-slate-50 dark:bg-slate-800 p-8 rounded-[2.5rem] border-2 border-transparent hover:border-purple-500/30 transition-all flex flex-col items-center text-center">
                  {u.id !== currentUser.id && (
                    <button 
                      onClick={() => handleDeleteUser(u.id, u.name)}
                      className="absolute top-4 right-4 p-2 bg-rose-500/10 text-rose-500 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-500 hover:text-white"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                  <div className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${u.color} flex items-center justify-center text-white text-2xl font-black shadow-xl mb-4 group-hover:rotate-6 transition-transform`}>
                    {u.initials}
                  </div>
                  <span className="font-black uppercase text-sm text-slate-800 dark:text-white">{u.name}</span>
                  <div className="mt-2">
                    <span className="text-[9px] font-black bg-purple-100 dark:bg-purple-900/30 text-purple-600 px-3 py-1 rounded-lg uppercase tracking-widest">{u.role}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: NOTIFICATIONS */}
        {activeTab === 'notifications' && (
          <div className="p-12 space-y-12 animate-fadeIn">
            <div className="flex items-center space-x-4 mb-6">
               <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl"><BellRing size={24}/></div>
               <div>
                  <h3 className="text-sm font-black uppercase">Centre d'Alertes Système</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Configuration des notifications automatiques</p>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="bg-slate-50 dark:bg-slate-800/50 p-8 rounded-[2.5rem] border-2 border-slate-100 dark:border-slate-700 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-4">
                     <div className="flex items-center space-x-3">
                        {/* Fixed: PackageCheck is now correctly imported */}
                        <PackageCheck className="text-rose-500" size={20}/>
                        <h4 className="text-[11px] font-black uppercase">Alerte Stock Faible</h4>
                     </div>
                     <div className="w-12 h-6 bg-emerald-500 rounded-full relative p-1 cursor-pointer">
                        <div className="w-4 h-4 bg-white rounded-full ml-auto shadow-sm"></div>
                     </div>
                  </div>
                  <p className="text-[10px] font-medium text-slate-500 leading-relaxed mb-6">Génère une notification immédiate lorsqu'un article du menu descend sous son seuil de sécurité.</p>
                  <div className="flex items-center justify-between pt-4 border-t dark:border-slate-700">
                     <span className="text-[9px] font-black text-slate-400 uppercase">Seuil Global</span>
                     <span className="text-xs font-black">10 unités</span>
                  </div>
               </div>

               <div className="bg-slate-50 dark:bg-slate-800/50 p-8 rounded-[2.5rem] border-2 border-slate-100 dark:border-slate-700 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-4">
                     <div className="flex items-center space-x-3">
                        <Check className="text-emerald-500" size={20}/>
                        <h4 className="text-[11px] font-black uppercase">Rapport de Fin de Session</h4>
                     </div>
                     <div className="w-12 h-6 bg-emerald-500 rounded-full relative p-1 cursor-pointer">
                        <div className="w-4 h-4 bg-white rounded-full ml-auto shadow-sm"></div>
                     </div>
                  </div>
                  <p className="text-[10px] font-medium text-slate-500 leading-relaxed mb-6">Envoie un bilan complet des ventes et des écarts de caisse à l'administrateur lors de chaque clôture.</p>
                  <div className="flex items-center justify-between pt-4 border-t dark:border-slate-700">
                     <span className="text-[9px] font-black text-slate-400 uppercase">Cible</span>
                     <span className="text-xs font-black truncate max-w-[150px]">{formConfig.email}</span>
                  </div>
               </div>
            </div>
          </div>
        )}
      </div>

      {/* User Modal (Maintain "IDENTIFIANT" request) */}
      {isUserModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[250] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden border border-white/10 animate-scaleIn">
            <div className="p-8 border-b dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
               <h3 className="text-lg font-black uppercase tracking-tighter">Nouvel Utilisateur</h3>
               <button onClick={() => setIsUserModalOpen(false)}><X size={24}/></button>
            </div>
            <form onSubmit={handleSaveUser} className="p-10 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">IDENTIFIANT</label>
                <input required value={userForm.name} onChange={e => setUserForm({...userForm, name: e.target.value})} className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl font-bold border-none outline-none focus:ring-2 focus:ring-purple-500 transition-all uppercase" placeholder="Saisir IDENTIFIANT" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Mot de passe</label>
                <input type="password" required value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl font-black tracking-[0.3em] border-none outline-none focus:ring-2 focus:ring-purple-500 transition-all" placeholder="••••" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Rôle / Accès</label>
                <select value={userForm.role} onChange={e => setUserForm({...userForm, role: e.target.value as any})} className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl font-black text-[10px] uppercase tracking-widest border-none outline-none appearance-none">
                  <option value="admin">Administrateur</option>
                  <option value="manager">Manager</option>
                  <option value="cashier">Caissier</option>
                </select>
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Couleur</label>
                 <div className="flex justify-between p-2 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                    {PROFILE_COLORS.map(color => (
                      <button 
                        key={color} 
                        type="button" 
                        onClick={() => setUserForm({...userForm, color})}
                        className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} transition-all ${userForm.color === color ? 'scale-110 shadow-lg ring-2 ring-white ring-offset-2' : 'opacity-60 hover:opacity-100'}`}
                      />
                    ))}
                 </div>
              </div>
              <button type="submit" className="w-full py-5 bg-purple-600 text-white rounded-[1.5rem] font-black uppercase text-xs tracking-widest shadow-xl hover:bg-purple-700 transition-all">Créer le compte</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
