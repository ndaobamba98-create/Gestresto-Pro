
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  LayoutDashboard, ShoppingCart, Package, BarChart3, Settings as SettingsIcon, Sun, Moon, IdCard, LogOut, Clock as ClockIcon, FileText, Search, ArrowRight, Users, ChevronLeft, ChevronRight, UserPlus, LogIn, Key, ShieldCheck, ChevronDown, ArrowRightLeft, Bell, X, Check, Trash2, BellOff, Info, AlertTriangle, CheckCircle, Maximize, Minimize, Calendar as CalendarIcon, Shield, UtensilsCrossed, ChefHat, Wifi, Sparkles, Wallet
} from 'lucide-react';
import { ViewType, Product, SaleOrder, Employee, ERPConfig, AttendanceRecord, User, CashSession, Expense, Customer, UserRole, AppNotification, RolePermission, POSLocations } from './types';
import { INITIAL_PRODUCTS, INITIAL_EMPLOYEES, INITIAL_CONFIG, APP_USERS, INITIAL_CUSTOMERS, POS_LOCATIONS as INITIAL_LOCATIONS } from './constants';
import { translations, TranslationKey } from './translations';
import Dashboard from './components/Dashboard';
import Invoicing from './components/Invoicing';
import Sales from './components/Sales';
import Inventory from './components/Inventory';
import Reports from './components/Reports';
import POS from './components/POS';
import Settings from './components/Settings';
import HR from './components/HR';
import Attendances from './components/Attendances';
import Customers from './components/Customers';
import Kitchen from './components/Kitchen';
import Expenses from './components/Expenses';

const loadStored = <T extends unknown>(key: string, initial: T): T => {
  const saved = localStorage.getItem(key);
  if (!saved) return initial;
  try { return JSON.parse(saved); } catch { return initial; }
};

const DEFAULT_PERMISSIONS: RolePermission[] = [
  { role: 'admin', permissions: ['dashboard', 'pos', 'preparation', 'sales', 'inventory', 'expenses', 'invoicing', 'customers', 'reports', 'attendances', 'hr', 'settings', 'manage_inventory', 'manage_session_closing', 'manage_sales', 'manage_hr', 'manage_customers'] },
  { role: 'manager', permissions: ['dashboard', 'pos', 'preparation', 'sales', 'inventory', 'expenses', 'customers', 'reports', 'attendances', 'manage_inventory'] },
  { role: 'cashier', permissions: ['dashboard', 'pos', 'preparation', 'attendances'] },
  { role: 'waiter', permissions: ['pos', 'preparation', 'attendances'] }
];

const PROFILE_COLORS = [
  'from-slate-700 to-slate-900',
  'from-emerald-600 to-emerald-800',
  'from-purple-600 to-purple-800',
  'from-blue-600 to-blue-800',
  'from-rose-600 to-rose-800',
  'from-amber-600 to-amber-800'
];

export const AppLogo = ({ className = "w-14 h-14", iconOnly = false, light = false, customLogo = undefined }) => (
  <div className={`flex items-center ${iconOnly ? 'justify-center' : 'space-x-4'} ${className}`}>
    <div className="relative group shrink-0">
      <div className={`relative w-12 h-12 ${light ? 'bg-white' : 'bg-slate-900'} rounded-2xl flex items-center justify-center shadow-2xl border border-white/10 overflow-hidden transform group-hover:rotate-6 transition-transform duration-500`}>
        {customLogo ? (
          <img src={customLogo} alt="Logo" className="w-full h-full object-cover" />
        ) : (
          <svg viewBox="0 0 100 100" className="w-9/12 h-9/12" fill="none" xmlns="http://www.w3.org/2000/svg">
            <text x="50%" y="55%" dominantBaseline="central" textAnchor="middle" fill={light ? "#0f172a" : "white"} fontSize="38" fontWeight="900" letterSpacing="-2">
              TP+
            </text>
            <circle cx="20" cy="20" r="10" className="fill-purple-500 opacity-80" />
          </svg>
        )}
      </div>
    </div>
    {!iconOnly && (
      <div className="flex flex-col">
        <span className={`${light ? 'text-slate-900' : 'text-white'} font-black text-xl leading-none uppercase tracking-tighter`}>TerraPOS+</span>
        <span className="text-purple-500 font-black text-[10px] uppercase tracking-[0.4em] mt-0.5">SYSTEM</span>
      </div>
    )}
  </div>
);

const WelcomeSplash = ({ user, theme }: { user: User, theme: string }) => (
  <div className="fixed inset-0 z-[1000] flex items-center justify-center overflow-hidden">
    <div className="absolute inset-0 bg-slate-950">
      <div className="absolute top-1/4 left-1/4 w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[120px] animate-float"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[120px] animate-float" style={{ animationDelay: '2s' }}></div>
    </div>
    <div className="relative z-10 text-center space-y-8 animate-welcomeScale">
       <div className={`w-32 h-32 mx-auto rounded-[3rem] bg-gradient-to-br ${user.color} flex items-center justify-center text-white text-4xl font-black shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-2 border-white/20 relative`}>
          {user.initials}
          <div className="absolute -top-2 -right-2 bg-white text-slate-900 p-2 rounded-2xl shadow-xl animate-bounce">
            <Sparkles size={20} className="text-purple-600" />
          </div>
       </div>
       <div className="space-y-4">
          <h1 className="text-6xl font-black text-white uppercase tracking-tighter">
            BIENVENUE <span className="text-shimmer italic">{user.name.split(' ')[0]}</span>
          </h1>
          <p className="text-slate-400 font-black uppercase text-xs tracking-[0.5em]">Initialisation TerraPOS+</p>
       </div>
    </div>
  </div>
);

const App: React.FC = () => {
  const [isLocked, setIsLocked] = useState(true);
  const [isEntering, setIsEntering] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState(false);
  const [isUserListOpen, setIsUserListOpen] = useState(false);

  const [signupName, setSignupName] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupRole, setSignupRole] = useState<UserRole>('waiter');

  const [activeView, setActiveView] = useState<ViewType>('dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(() => loadStored('darkMode', false));

  const [allUsers, setAllUsers] = useState<User[]>(() => loadStored('allUsers', APP_USERS));
  const [config, setConfig] = useState<ERPConfig>(() => loadStored('config', INITIAL_CONFIG));
  const [posLocations, setPosLocations] = useState<POSLocations>(() => loadStored('pos_locations', INITIAL_LOCATIONS));
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>(() => loadStored('rolePermissions', DEFAULT_PERMISSIONS));
  const [products, setProducts] = useState<Product[]>(() => loadStored('products', INITIAL_PRODUCTS));
  const [customers, setCustomers] = useState<Customer[]>(() => loadStored('customers', INITIAL_CUSTOMERS));
  const [sales, setSales] = useState<SaleOrder[]>(() => loadStored('sales', []));
  const [expenses, setExpenses] = useState<Expense[]>(() => loadStored('expenses', []));
  const [sessionHistory, setSessionHistory] = useState<CashSession[]>(() => loadStored('sessionHistory', []));
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => loadStored('attendance', []));
  const [employees, setEmployees] = useState<Employee[]>(() => loadStored('employees', INITIAL_EMPLOYEES));
  const [notifications, setNotifications] = useState<AppNotification[]>(() => loadStored('notifications', []));
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const [currentUser, setCurrentUser] = useState<User | null>(() => loadStored('currentUser', null));

  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

  const userPermissions = useMemo(() => {
    if (!currentUser) return [];
    const rolePerms = rolePermissions.find(rp => rp.role === currentUser.role);
    return rolePerms ? rolePerms.permissions : [];
  }, [currentUser, rolePermissions]);

  const t = useCallback((key: TranslationKey): string => {
    return (translations[config.language || 'fr'] as any)[key] || key;
  }, [config.language]);

  const sidebarItems = useMemo(() => {
    const allItems = [
      { id: 'dashboard', icon: LayoutDashboard, label: t('dashboard') },
      { id: 'pos', icon: UtensilsCrossed, label: currentUser?.role === 'waiter' ? 'Prise de Commande' : t('pos') },
      { id: 'preparation', icon: ChefHat, label: 'Suivi Cuisine' },
      { id: 'sales', icon: ShoppingCart, label: t('sales') },
      { id: 'inventory', icon: Package, label: t('inventory') },
      { id: 'expenses', icon: Wallet, label: t('expenses') },
      { id: 'invoicing', icon: FileText, label: t('invoicing') },
      { id: 'customers', icon: Users, label: t('customer') + 's' },
      { id: 'reports', icon: BarChart3, label: t('reports') },
      { id: 'attendances', icon: ClockIcon, label: t('attendances') },
      { id: 'hr', icon: IdCard, label: t('hr') },
      { id: 'settings', icon: SettingsIcon, label: t('settings') },
    ];
    return allItems.filter(item => userPermissions.includes(item.id as ViewType));
  }, [userPermissions, currentUser, t]);

  useEffect(() => {
    if (!isLocked && !userPermissions.includes(activeView)) {
      setActiveView(currentUser?.role === 'waiter' ? 'pos' : 'dashboard');
    }
  }, [userPermissions, activeView, isLocked, currentUser]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
    }
  };

  useEffect(() => { localStorage.setItem('allUsers', JSON.stringify(allUsers)); }, [allUsers]);
  useEffect(() => { localStorage.setItem('config', JSON.stringify(config)); }, [config]);
  useEffect(() => { localStorage.setItem('pos_locations', JSON.stringify(posLocations)); }, [posLocations]);
  useEffect(() => { localStorage.setItem('rolePermissions', JSON.stringify(rolePermissions)); }, [rolePermissions]);
  useEffect(() => { localStorage.setItem('products', JSON.stringify(products)); }, [products]);
  useEffect(() => { localStorage.setItem('customers', JSON.stringify(customers)); }, [customers]);
  useEffect(() => { localStorage.setItem('sales', JSON.stringify(sales)); }, [sales]);
  useEffect(() => { localStorage.setItem('expenses', JSON.stringify(expenses)); }, [expenses]);
  useEffect(() => { localStorage.setItem('sessionHistory', JSON.stringify(sessionHistory)); }, [sessionHistory]);
  useEffect(() => { localStorage.setItem('attendance', JSON.stringify(attendance)); }, [attendance]);
  useEffect(() => { localStorage.setItem('employees', JSON.stringify(employees)); }, [employees]);
  useEffect(() => { localStorage.setItem('currentUser', JSON.stringify(currentUser)); }, [currentUser]);
  useEffect(() => { localStorage.setItem('darkMode', JSON.stringify(darkMode)); }, [darkMode]);
  useEffect(() => { localStorage.setItem('notifications', JSON.stringify(notifications)); }, [notifications]);

  const notifyUser = useCallback((title: string, message: string, type: 'success' | 'info' | 'warning' = 'info') => {
    const newNotif: AppNotification = { id: `notif-${Date.now()}`, title, message, timestamp: new Date().toISOString(), type: type === 'warning' ? 'warning' : type === 'success' ? 'success' : 'info', read: false };
    setNotifications(prev => [newNotif, ...prev]);
  }, []);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setIsEntering(true);
    if (user.role === 'waiter') setActiveView('pos');
    setTimeout(() => {
      setIsEntering(false);
      setIsLocked(false);
    }, 2800);
  };

  const handleSaleComplete = (s: Partial<SaleOrder>) => {
    if (s.status === 'confirmed' && !s.id?.startsWith(config.invoicePrefix)) {
      const seqStr = String(config.nextInvoiceNumber).padStart(4, '0');
      const newId = `${config.invoicePrefix}${seqStr}`;
      const completeSale = { ...s, id: newId } as SaleOrder;
      setSales([completeSale, ...sales]);
      setConfig({ ...config, nextInvoiceNumber: config.nextInvoiceNumber + 1 });
      if (currentUser?.role === 'admin' || currentUser?.role === 'cashier') {
        notifyUser("Facture émise", `Commande ${newId} enregistrée.`, 'success');
      }
    } else {
      const finalSale = { ...s, id: s.id || `TMP-${Date.now()}` } as SaleOrder;
      const exists = sales.find(prev => prev.id === finalSale.id);
      if (exists) {
        setSales(sales.map(prev => prev.id === finalSale.id ? finalSale : prev));
      } else {
        setSales([finalSale, ...sales]);
      }
    }
  };

  const handleRefundSale = (id: string) => {
    setSales(prev => prev.map(s => s.id === id ? { ...s, status: 'refunded', invoiceStatus: 'refunded' } as SaleOrder : s));
    notifyUser("Opération annulée", `La commande #${id.slice(-6)} a été annulée.`, "warning");
  };

  const handleDeleteDraft = (id: string) => {
    setSales(prev => prev.filter(s => s.id !== id));
    notifyUser("Brouillon supprimé", "La table a été libérée.", "info");
  };

  const logoutAction = () => {
    setIsLocked(true);
    setCurrentUser(null);
    setIsNotifOpen(false);
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  };

  const currentSession = useMemo(() => sessionHistory.find(s => s.status === 'open' && (currentUser?.role === 'admin' ? true : s.cashierId === currentUser?.id || currentUser?.role === 'waiter')), [sessionHistory, currentUser]);

  const renderContent = () => {
    const commonProps = { 
      notify: notifyUser, 
      userPermissions: userPermissions, 
      t, 
      currentUser: currentUser! 
    };
    
    switch (activeView) {
      case 'dashboard': return <Dashboard leads={[]} sales={sales} expenses={expenses} userRole={currentUser!.role} config={config} products={products} t={t} onNavigate={setActiveView} />;
      case 'pos': return <POS products={products} customers={customers} onUpdateCustomers={setCustomers} sales={sales} onSaleComplete={handleSaleComplete} onRefundSale={handleRefundSale} onDeleteDraft={handleDeleteDraft} config={config} session={currentSession || null} onOpenSession={(bal, cid) => setSessionHistory([{id:`S-${Date.now()}`, openedAt: new Date().toISOString(), openingBalance: bal, expectedBalance: bal, totalCashSales: 0, status: 'open', cashierName: currentUser!.name, cashierId: cid} as CashSession, ...sessionHistory])} onCloseSession={bal => setSessionHistory(sessionHistory.map(s => s.id === currentSession?.id ? {...s, status: 'closed', closingBalance: bal} as CashSession : s))} userRole={currentUser!.role} userPermissions={commonProps.userPermissions} onUpdateSales={setSales} posLocations={posLocations} onUpdateLocations={setPosLocations} {...commonProps} />;
      case 'preparation': return <Kitchen sales={sales} onUpdateSales={setSales} config={config} notify={notifyUser} />;
      case 'inventory': return <Inventory products={products} onUpdate={setProducts} config={config} userRole={currentUser!.role} t={t} userPermissions={commonProps.userPermissions} />;
      case 'expenses': return <Expenses expenses={expenses} setExpenses={setExpenses} purchases={[]} onAddPurchase={()=>{}} onDeletePurchase={()=>{}} suppliers={[]} setSuppliers={()=>{}} products={products} config={config} userRole={currentUser!.role} {...commonProps} />;
      case 'sales': return <Sales sales={sales} expenses={expenses} onUpdate={setSales} onRefundSale={handleRefundSale} config={config} products={products} userRole={currentUser!.role} currentUser={currentUser!} onAddSale={handleSaleComplete} {...commonProps} />;
      case 'invoicing': return <Invoicing sales={sales} config={config} onUpdate={setSales} products={products} userRole={currentUser!.role} onAddSale={() => {}} {...commonProps} />;
      case 'reports': return <Reports sales={sales} expenses={expenses} config={config} products={products} t={t} notify={notifyUser} sessions={sessionHistory} />;
      case 'hr': return <HR employees={employees} onUpdate={setEmployees} attendance={attendance} onUpdateAttendance={setAttendance} config={config} expenses={expenses} onAddExpense={(exp) => setExpenses([exp, ...expenses])} {...commonProps} />;
      case 'attendances': return <Attendances employees={employees} onUpdateEmployees={setEmployees} attendance={attendance} onUpdateAttendance={setAttendance} currentUser={currentUser!} notify={notifyUser} />;
      case 'customers': return <Customers customers={customers} onUpdate={setCustomers} config={config} userRole={currentUser!.role} t={t} userPermissions={commonProps.userPermissions} notify={notifyUser} />;
      case 'settings': return <Settings products={products} onUpdateProducts={setProducts} config={config} onUpdateConfig={setConfig} posLocations={posLocations} onUpdateLocations={setPosLocations} rolePermissions={rolePermissions} onUpdatePermissions={setRolePermissions} currentUser={currentUser!} allUsers={allUsers} onUpdateUsers={setAllUsers} userPermissions={commonProps.userPermissions} t={t} notify={notifyUser} />;
      default: return <Dashboard leads={[]} sales={sales} expenses={expenses} userRole={currentUser!.role} config={config} products={products} t={t} onNavigate={setActiveView} />;
    }
  };

  if (isEntering && currentUser) {
    return <WelcomeSplash user={currentUser} theme={config.theme} />;
  }

  if (isLocked) {
     return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-950 overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600 rounded-full blur-[120px]"></div>
        </div>
        <div className="mb-8 text-center animate-fadeIn relative z-10">
          <AppLogo className="mx-auto mb-4 scale-[1.3]" iconOnly />
          <h1 className="text-3xl font-black text-white uppercase mt-2 tracking-tighter">TerraPOS+</h1>
          <p className="text-slate-500 font-bold uppercase text-[9px] tracking-[0.4em] mt-1">Gestion Unifiée MYA D'OR</p>
        </div>
        <div className="w-full max-w-lg px-6 relative z-10">
          <div className={`bg-slate-900/40 backdrop-blur-3xl p-8 md:p-12 rounded-[3.5rem] border-2 border-white/5 shadow-2xl animate-scaleIn ${loginError ? 'animate-shake' : ''}`}>
            {authMode === 'login' ? (
              <form onSubmit={(e) => {
                e.preventDefault();
                const user = allUsers.find(u => u.id === selectedUserId && u.password === passwordInput);
                if (user) {
                  handleLoginSuccess(user);
                } else {
                  setLoginError(true);
                  setTimeout(() => setLoginError(false), 500);
                }
              }} className="space-y-8">
                <div className="text-center space-y-2 mb-4">
                  <h2 className="text-xl font-black text-white uppercase tracking-tight">Accès Session</h2>
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Connectez-vous pour commencer</p>
                </div>
                <div className="space-y-6">
                  <div className="space-y-2 relative">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2 flex items-center"><Users size={12} className="mr-2" /> IDENTIFIANT</label>
                    <button type="button" onClick={() => setIsUserListOpen(!isUserListOpen)} className="w-full bg-black/40 border-2 border-white/5 hover:border-purple-500 rounded-2xl py-4 px-6 text-white flex items-center justify-between transition-all group">
                      {selectedUserId ? (
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${allUsers.find(u => u.id === selectedUserId)?.color} flex items-center justify-center text-white font-black text-[10px]`}>{allUsers.find(u => u.id === selectedUserId)?.initials}</div>
                          <span className="font-bold text-sm uppercase">{allUsers.find(u => u.id === selectedUserId)?.name}</span>
                        </div>
                      ) : (
                        <span className="text-slate-500 font-black uppercase text-[10px] tracking-widest">SÉLECTIONNER IDENTIFIANT</span>
                      )}
                      <ChevronDown size={20} className={`text-slate-500 transition-transform ${isUserListOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isUserListOpen && (
                      <div className="absolute top-full left-0 w-full mt-2 bg-slate-900 border-2 border-white/10 rounded-[1.5rem] shadow-2xl overflow-hidden z-50 animate-scaleIn origin-top">
                        <div className="max-h-60 overflow-y-auto scrollbar-hide py-2">
                          {allUsers.map(user => (
                            <button key={user.id} type="button" onClick={() => { setSelectedUserId(user.id); setIsUserListOpen(false); }} className="w-full p-4 hover:bg-white/5 flex items-center justify-between text-left transition-all group">
                              <div className="flex items-center space-x-4">
                                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${user.color} flex items-center justify-center text-white font-black text-xs`}>{user.initials}</div>
                                <div><p className="font-black text-white text-[11px] uppercase">{user.name}</p><p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{user.role}</p></div>
                              </div>
                              {selectedUserId === user.id && <ShieldCheck size={18} className="text-purple-500" />}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className={`space-y-2 transition-all duration-500 ${selectedUserId ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2 flex items-center"><Key size={12} className="mr-2" /> MOT DE PASSE</label>
                    <input type="password" value={passwordInput} onChange={e => setPasswordInput(e.target.value)} className="w-full bg-black/40 border-2 border-transparent focus:border-purple-500 rounded-2xl py-4 px-6 text-white font-black tracking-[0.5em] outline-none transition-all text-center" placeholder="••••" />
                  </div>
                </div>
                <button type="submit" disabled={!selectedUserId || !passwordInput} className="w-full py-5 bg-purple-600 text-white rounded-3xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-purple-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-3">
                  <span>Ouvrir la session</span>
                  <ArrowRight size={18} />
                </button>
                <div className="text-center pt-4">
                  <button type="button" onClick={() => setAuthMode('signup')} className="text-[10px] font-black uppercase text-slate-500 hover:text-purple-400 transition-colors flex items-center justify-center mx-auto">
                    <UserPlus size={14} className="mr-2"/> Créer un IDENTIFIANT
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={(e) => {
                e.preventDefault();
                if (!signupName || !signupPassword) return;
                const initials = signupName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
                const newUser: User = {
                  id: `U-${Date.now()}`,
                  name: signupName,
                  role: signupRole,
                  password: signupPassword,
                  color: PROFILE_COLORS[Math.floor(Math.random() * PROFILE_COLORS.length)],
                  initials
                };
                setAllUsers([...allUsers, newUser]);
                handleLoginSuccess(newUser);
                setSignupName('');
                setSignupPassword('');
                notifyUser("Compte créé", `Bienvenue ${newUser.name} !`, "success");
              }} className="space-y-6">
                <div className="text-center space-y-2 mb-4">
                  <h2 className="text-xl font-black text-white uppercase tracking-tight">Inscription</h2>
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Nouveau collaborateur</p>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">IDENTIFIANT</label>
                    <input required value={signupName} onChange={e => setSignupName(e.target.value)} className="w-full bg-black/40 border-2 border-transparent focus:border-emerald-500 rounded-2xl py-4 px-6 text-white font-bold outline-none transition-all uppercase" placeholder="IDENTIFIANT" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">MOT DE PASSE</label>
                    <input type="password" required value={signupPassword} onChange={e => setSignupPassword(e.target.value)} className="w-full bg-black/40 border-2 border-transparent focus:border-emerald-500 rounded-2xl py-4 px-6 text-white font-black tracking-[0.5em] outline-none transition-all" placeholder="••••" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">ACCÈS</label>
                    <div className="grid grid-cols-2 gap-3">
                       <button type="button" onClick={() => setSignupRole('waiter')} className={`p-4 rounded-2xl border-2 font-black uppercase text-[10px] transition-all ${signupRole === 'waiter' ? 'bg-emerald-600 border-emerald-400 text-white shadow-lg' : 'bg-black/20 border-white/5 text-slate-500'}`}>Serveuse</button>
                       <button type="button" onClick={() => setSignupRole('cashier')} className={`p-4 rounded-2xl border-2 font-black uppercase text-[10px] transition-all ${signupRole === 'cashier' ? 'bg-emerald-600 border-emerald-400 text-white shadow-lg' : 'bg-black/20 border-white/5 text-slate-500'}`}>Caissier</button>
                       <button type="button" onClick={() => setSignupRole('manager')} className={`p-4 rounded-2xl border-2 font-black uppercase text-[10px] transition-all ${signupRole === 'manager' ? 'bg-emerald-600 border-emerald-400 text-white shadow-lg' : 'bg-black/20 border-white/5 text-slate-500'}`}>Manager</button>
                    </div>
                  </div>
                </div>
                <button type="submit" className="w-full py-5 bg-emerald-600 text-white rounded-3xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-emerald-700 transition-all flex items-center justify-center space-x-3 mt-4">
                  <span>Enregistrer</span>
                  <ShieldCheck size={18} />
                </button>
                <div className="text-center pt-2">
                  <button type="button" onClick={() => setAuthMode('login')} className="text-[10px] font-black uppercase text-slate-500 hover:text-emerald-400 transition-colors flex items-center justify-center mx-auto">
                    <LogIn size={14} className="mr-2"/> Se connecter
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-screen overflow-hidden theme-${config.theme} ${darkMode ? 'dark text-slate-100' : 'text-slate-900'}`}>
      <aside className={`${isSidebarOpen ? 'w-72' : 'w-24'} bg-slate-900 transition-all duration-500 ease-in-out flex flex-col z-20 shadow-2xl relative animate-entrySidebar`}>
        <div className="p-6 h-28 flex items-center justify-between border-b border-slate-800">
          <AppLogo className={isSidebarOpen ? "w-full" : "w-10 h-10"} iconOnly={!isSidebarOpen} customLogo={config.companyLogo} />
        </div>
        <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="absolute -right-3 top-32 w-7 h-7 bg-purple-600 text-white rounded-full flex items-center justify-center shadow-xl z-30 hover:scale-110 active:scale-90 transition-all border-4 border-slate-950">
          {isSidebarOpen ? <ChevronLeft size={16}/> : <ChevronRight size={16}/>}
        </button>
        <nav className="flex-1 mt-6 space-y-1 px-3 overflow-y-auto scrollbar-hide">
          {sidebarItems.map((item, idx) => (
            <button 
              key={item.id} 
              onClick={() => setActiveView(item.id as ViewType)} 
              style={{ animationDelay: `${0.1 * idx}s` }}
              className={`w-full flex items-center p-4 rounded-2xl transition-all animate-fadeIn ${activeView === item.id ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              <item.icon size={22} className={!isSidebarOpen ? 'mx-auto' : ''} />
              {isSidebarOpen && <span className="ml-4 font-bold text-sm">{item.label}</span>}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-800">
           <button onClick={logoutAction} className={`w-full flex items-center p-4 rounded-2xl text-rose-500 hover:bg-rose-500/10 transition-all font-bold text-sm ${!isSidebarOpen ? 'justify-center' : ''}`}>
             <LogOut size={20} className={isSidebarOpen ? "mr-3" : ""} /> {isSidebarOpen && 'Déconnexion'}
           </button>
        </div>
      </aside>
      <main className="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950 relative">
        <header className="h-24 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-8 z-10 animate-entryHeader">
          <div className="flex items-center space-x-6">
            <div className="flex flex-col">
              <h2 className="text-xl font-black uppercase tracking-tight text-slate-800 dark:text-white leading-none">{config.companyName}</h2>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">{config.companySlogan}</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button onClick={toggleFullscreen} className="p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl transition-all text-slate-500 hover:text-purple-600 shadow-sm"><Maximize size={20}/></button>
            <button onClick={() => setDarkMode(!darkMode)} className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl transition-colors text-slate-600 dark:text-slate-400 hover:text-purple-600">{darkMode ? <Sun size={20}/> : <Moon size={20}/>}</button>
            <div className="flex items-center space-x-1">
              <div className="flex items-center space-x-3 bg-white dark:bg-slate-800 p-2 pr-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                 <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${currentUser?.color} flex items-center justify-center text-white font-black shadow-lg text-xs`}>{currentUser?.initials}</div>
                 <div className="flex flex-col"><span className="text-xs font-black dark:text-white leading-tight">{currentUser?.name}</span><span className="text-[8px] font-bold text-purple-600 uppercase tracking-widest">{currentUser?.role}</span></div>
              </div>
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-8 scrollbar-hide animate-entryMain">{renderContent()}</div>
      </main>
    </div>
  );
};

export default App;
