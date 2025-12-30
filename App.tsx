
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  LayoutDashboard, ShoppingCart, Package, BarChart3, Monitor, Settings as SettingsIcon, Sun, Moon, IdCard, LogOut, Clock as ClockIcon, FileText, Menu, CheckCircle, Info, AlertCircle, Calendar, Search, ArrowRight, User as UserIcon, Wallet, Bell, Languages, X, Check, Eye, Trash2, BellOff
} from 'lucide-react';
import { ViewType, Product, SaleOrder, Employee, ERPConfig, AttendanceRecord, RolePermission, User, CashSession, Expense, Supplier, Purchase, Language } from './types';
import { INITIAL_PRODUCTS, INITIAL_EMPLOYEES, INITIAL_CONFIG, APP_USERS, INITIAL_EXPENSES, INITIAL_SUPPLIERS } from './constants';
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
import Expenses from './components/Expenses';

// Composant Logo stylisé
export const AppLogo = ({ className = "w-14 h-14", iconOnly = false }) => (
  <div className={`flex items-center ${iconOnly ? 'justify-center' : 'space-x-4'} ${className}`}>
    <div className="relative group shrink-0">
      <div className="absolute -inset-1.5 bg-gradient-to-r from-purple-600 to-blue-500 rounded-2xl blur opacity-25 group-hover:opacity-60 transition duration-1000 group-hover:duration-200"></div>
      <div className="relative w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center shadow-2xl border border-white/10 overflow-hidden">
        <svg viewBox="0 0 100 100" className="w-9/12 h-9/12" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M30 35C30 26.7157 36.7157 20 45 20H70V35H45C42.2386 35 40 37.2386 40 40C40 42.7614 42.2386 45 45 45H55C63.2843 45 70 51.7157 70 60C70 68.2843 63.2843 75 55 75H30V60H55C57.7614 60 60 57.7614 60 55C60 52.2386 57.7614 50 55 50H45C36.7157 50 30 43.2843 30 35Z" fill="white" className="fill-current"/>
          <circle cx="20" cy="20" r="10" fill="url(#grad1)" />
          <defs>
            <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{stopColor:'#a855f7', stopOpacity:1}} />
              <stop offset="100%" style={{stopColor:'#3b82f6', stopOpacity:1}} />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
    {!iconOnly && (
      <div className="flex flex-col">
        <span className="text-white font-black text-xl leading-none uppercase tracking-tighter">
          SamaCaisse
        </span>
        <span className="text-purple-500 font-black text-sm uppercase tracking-[0.2em] mt-0.5">
          Pro
        </span>
      </div>
    )}
  </div>
);

interface Toast {
  id: string;
  type: 'success' | 'info' | 'warning';
  title: string;
  message: string;
  timestamp: string;
  isRead?: boolean;
}

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewType>('pos');
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [notificationHistory, setNotificationHistory] = useState<Toast[]>(() => {
    const saved = localStorage.getItem('notificationHistory');
    return saved ? JSON.parse(saved) : [];
  });
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [isLocked, setIsLocked] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  const loadStored = <T extends unknown>(key: string, initial: T): T => {
    const saved = localStorage.getItem(key);
    try {
      return saved ? JSON.parse(saved) : initial;
    } catch {
      return initial;
    }
  };

  const [currentUser, setCurrentUser] = useState<User>(() => loadStored('currentUser', APP_USERS[0]));
  const [config, setConfig] = useState<ERPConfig>(() => loadStored('config', { ...INITIAL_CONFIG, language: 'fr' }));
  const [products, setProducts] = useState<Product[]>(() => loadStored('products', INITIAL_PRODUCTS));
  const [sales, setSales] = useState<SaleOrder[]>(() => loadStored('sales', []));
  const [expenses, setExpenses] = useState<Expense[]>(() => loadStored('expenses', INITIAL_EXPENSES));
  const [purchases, setPurchases] = useState<Purchase[]>(() => loadStored('purchases', []));
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => loadStored('suppliers', INITIAL_SUPPLIERS));
  const [employees, setEmployees] = useState<Employee[]>(() => loadStored('employees', INITIAL_EMPLOYEES));
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => loadStored('attendance', []));
  const [currentSession, setCurrentSession] = useState<CashSession | null>(() => loadStored('currentSession', null));
  
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>(() => loadStored('rolePermissions', [
    { role: 'admin', allowedViews: ['dashboard', 'pos', 'invoicing', 'sales', 'inventory', 'expenses', 'reports', 'hr', 'manage_hr', 'attendances', 'settings', 'logout', 'switch_account', 'manage_categories', 'manage_security', 'manage_inventory', 'manage_invoicing', 'manage_notifications'] },
    { role: 'cashier', allowedViews: ['pos', 'sales', 'attendances', 'logout'] },
    { role: 'manager', allowedViews: ['dashboard', 'pos', 'sales', 'inventory', 'expenses', 'reports', 'hr', 'manage_hr', 'attendances', 'logout', 'switch_account', 'manage_categories', 'manage_inventory', 'manage_invoicing', 'manage_notifications'] }
  ]));

  // Fonction utilitaire de traduction
  const t = useCallback((key: TranslationKey): string => {
    return (translations[config.language || 'fr'] as any)[key] || key;
  }, [config.language]);

  const notifyUser = useCallback((title: string, message: string, type: 'success' | 'info' | 'warning' = 'info') => {
    const id = Date.now().toString();
    const timestamp = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const newToast: Toast = { id, type, title, message, timestamp, isRead: false };
    
    setToasts(prev => [...prev, newToast]);
    setNotificationHistory(prev => {
      const updated = [newToast, ...prev].slice(0, 50);
      localStorage.setItem('notificationHistory', JSON.stringify(updated));
      return updated;
    });
    
    // Fermeture automatique après exactement 2 secondes
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 2000);
  }, []);

  const toggleNotificationRead = (id: string) => {
    setNotificationHistory(prev => {
      const updated = prev.map(n => n.id === id ? { ...n, isRead: !n.isRead } : n);
      localStorage.setItem('notificationHistory', JSON.stringify(updated));
      return updated;
    });
  };

  const markAllAsRead = () => {
    setNotificationHistory(prev => {
      const updated = prev.map(n => ({ ...n, isRead: true }));
      localStorage.setItem('notificationHistory', JSON.stringify(updated));
      return updated;
    });
    notifyUser("Notifications", "Tout est marqué comme lu", "success");
  };

  const clearNotifications = () => {
    if (window.confirm("Voulez-vous vider l'historique des notifications ?")) {
      setNotificationHistory([]);
      localStorage.removeItem('notificationHistory');
    }
  };

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);

  // Gérer le mode RTL pour l'Arabe
  useEffect(() => {
    const dir = config.language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.dir = dir;
    document.documentElement.lang = config.language;
  }, [config.language]);

  useEffect(() => { localStorage.setItem('currentUser', JSON.stringify(currentUser)); }, [currentUser]);
  useEffect(() => { localStorage.setItem('config', JSON.stringify(config)); }, [config]);
  useEffect(() => { localStorage.setItem('products', JSON.stringify(products)); }, [products]);
  useEffect(() => { localStorage.setItem('sales', JSON.stringify(sales)); }, [sales]);
  useEffect(() => { localStorage.setItem('expenses', JSON.stringify(expenses)); }, [expenses]);
  useEffect(() => { localStorage.setItem('purchases', JSON.stringify(purchases)); }, [purchases]);
  useEffect(() => { localStorage.setItem('suppliers', JSON.stringify(suppliers)); }, [suppliers]);
  useEffect(() => { localStorage.setItem('employees', JSON.stringify(employees)); }, [employees]);
  useEffect(() => { localStorage.setItem('attendance', JSON.stringify(attendance)); }, [attendance]);
  useEffect(() => { localStorage.setItem('currentSession', JSON.stringify(currentSession)); }, [currentSession]);
  useEffect(() => { localStorage.setItem('rolePermissions', JSON.stringify(rolePermissions)); }, [rolePermissions]);

  const changeLanguage = (lang: Language) => {
    setConfig(prev => ({ ...prev, language: lang }));
    setIsLanguageOpen(false);
    notifyUser(t('language'), lang.toUpperCase(), 'info');
  };

  const handleAddSale = (newSaleData: Partial<SaleOrder>) => {
    const saleItems = newSaleData.items || [];
    const isRefund = newSaleData.status === 'refunded';
    
    const updatedProducts = products.map(p => {
      const itemInSale = saleItems.find(item => item.productId === p.id);
      if (itemInSale) {
        const stockChange = isRefund ? itemInSale.quantity : -itemInSale.quantity;
        const newStock = p.stock + stockChange;
        return { ...p, stock: newStock };
      }
      return p;
    });
    setProducts(updatedProducts);

    const sale: SaleOrder = {
      id: `S-${Date.now()}`,
      customer: newSaleData.customer || 'Client',
      date: new Date().toLocaleString(),
      total: newSaleData.total || 0,
      status: newSaleData.status || 'confirmed',
      items: saleItems,
      paymentMethod: newSaleData.paymentMethod || 'Especes',
      invoiceStatus: isRefund ? 'refunded' : 'paid',
      orderLocation: newSaleData.orderLocation || 'Comptoir'
    };
    
    setSales(prev => [sale, ...prev]);
    // Notification unique de validation de commande (2 secondes)
    notifyUser(isRefund ? "Remboursement Effectué" : "Commande Validée", `${sale.total.toLocaleString()} ${config.currency} pour ${sale.customer}`, isRefund ? 'warning' : 'success');
  };

  const handleAddPurchase = (purchase: Purchase) => {
    setPurchases(prev => [purchase, ...prev]);
    const updatedProducts = products.map(p => 
      p.id === purchase.productId ? { ...p, stock: p.stock + purchase.quantity } : p
    );
    setProducts(updatedProducts);
    notifyUser("Stock Mis à Jour", `+${purchase.quantity} ${purchase.productName}`, "success");
  };

  const handleOpenSession = (openingBalance: number, cashierId: string) => {
    const cashier = APP_USERS.find(u => u.id === cashierId);
    const newSession: CashSession = {
      id: `SESS-${Date.now()}`,
      openedAt: new Date().toISOString(),
      openingBalance,
      expectedBalance: openingBalance,
      status: 'open',
      cashierName: cashier?.name || 'Inconnu',
      cashierId
    };
    setCurrentSession(newSession);
    notifyUser("Session Ouverte", `${newSession.cashierName}`, "success");
  };

  const handleCloseSession = (closingBalance: number) => {
    setCurrentSession(null);
    notifyUser("Session Clôturée", "Synthèse exportée", "info");
  };

  const userPermissions = useMemo(() => {
    return rolePermissions.find(p => p.role === currentUser.role)?.allowedViews || [];
  }, [rolePermissions, currentUser.role]);

  const canManageNotifications = userPermissions.includes('manage_notifications');
  const unreadCount = notificationHistory.filter(n => !n.isRead).length;

  if (isLocked) {
    return (
      <div className={`h-screen w-full flex flex-col items-center justify-center bg-slate-900 theme-${config.theme}`}>
        <div className="mb-12 text-center">
          <AppLogo className="w-32 h-32 mx-auto mb-6 scale-150" iconOnly />
          <h1 className="text-4xl font-black text-white uppercase mt-16 tracking-tighter">SamaCaisse <span className="text-purple-600">Pro</span></h1>
          <div className="mt-8 text-white/40 font-mono text-xl">{currentTime.toLocaleTimeString()}</div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {APP_USERS.map((user) => (
            <button key={user.id} onClick={() => { setCurrentUser(user); setIsLocked(false); }} className="bg-slate-800 p-6 rounded-3xl border border-slate-700 hover:border-purple-500 transition-all flex flex-col items-center space-y-4 w-40 hover:scale-105">
              <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${user.color} flex items-center justify-center text-white text-xl font-black shadow-lg`}>{user.initials}</div>
              <p className="text-white font-black uppercase text-xs">{user.name}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const renderContent = () => {
    const commonProps = { notify: notifyUser, userPermissions, t };
    switch (activeView) {
      case 'dashboard': return <Dashboard leads={[]} sales={sales} userRole={currentUser.role} config={config} products={products} t={t} />;
      case 'pos': return <POS products={products} sales={sales} onSaleComplete={handleAddSale} config={config} session={currentSession} onOpenSession={handleOpenSession} onCloseSession={handleCloseSession} {...commonProps} />;
      case 'sales': return <Sales sales={sales} onUpdate={setSales} config={config} products={products} userRole={currentUser.role} onAddSale={handleAddSale} {...commonProps} />;
      case 'inventory': return <Inventory products={products} onUpdate={setProducts} config={config} userRole={currentUser.role} t={t} userPermissions={userPermissions} />;
      case 'expenses': return (
        <Expenses 
          expenses={expenses} 
          setExpenses={setExpenses} 
          purchases={purchases}
          onAddPurchase={handleAddPurchase}
          onDeletePurchase={() => {}}
          suppliers={suppliers} 
          setSuppliers={setSuppliers} 
          products={products}
          config={config} 
          userRole={currentUser.role} 
          notify={notifyUser} 
          t={t}
        />
      );
      case 'hr': return <HR employees={employees} onUpdate={setEmployees} attendance={attendance} onUpdateAttendance={setAttendance} config={config} {...commonProps} />;
      case 'attendances': return <Attendances employees={employees} onUpdateEmployees={setEmployees} attendance={attendance} onUpdateAttendance={setAttendance} currentUser={currentUser} notify={notifyUser} t={t} />;
      case 'settings': return <Settings products={products} onUpdateProducts={setProducts} config={config} onUpdateConfig={setConfig} rolePermissions={rolePermissions} onUpdatePermissions={setRolePermissions} {...commonProps} />;
      case 'invoicing': return <Invoicing sales={sales} config={config} onUpdate={setSales} products={products} userRole={currentUser.role} onAddSale={handleAddSale} {...commonProps} />;
      case 'reports': return <Reports sales={sales} config={config} products={products} t={t} />;
      default: return null;
    }
  };

  return (
    <div className={`flex h-screen overflow-hidden theme-${config.theme} ${darkMode ? 'dark text-slate-100' : 'text-slate-900'} ${config.language === 'ar' ? 'font-ar' : ''}`}>
      {/* TOASTS EPHEMERES - HAUT DROITE - DUREE 2 SECONDES */}
      <div className={`fixed top-24 ${config.language === 'ar' ? 'left-6' : 'right-6'} z-[500] space-y-4 pointer-events-none`}>
        {toasts.map(toast => (
          <div key={toast.id} className={`w-80 rounded-2xl border backdrop-blur-xl shadow-2xl flex flex-col pointer-events-auto animate-slideInRight overflow-hidden ${
            toast.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600' :
            toast.type === 'warning' ? 'bg-orange-500/10 border-orange-500/20 text-orange-600' : 'bg-blue-500/10 border-blue-500/20 text-blue-600'
          }`}>
            <div className="p-4 flex items-start space-x-4">
              <div className="mt-1">{toast.type === 'success' ? <CheckCircle size={18} /> : toast.type === 'warning' ? <AlertCircle size={18} /> : <Info size={18} />}</div>
              <div className="flex-1">
                <h4 className="text-[10px] font-black uppercase tracking-widest">{toast.title}</h4>
                <p className="text-[11px] font-bold mt-1 leading-tight">{toast.message}</p>
              </div>
            </div>
            {/* Barre de progression visuelle de 2 secondes */}
            <div className="h-1 w-full bg-slate-200/20">
               <div className={`h-full transition-all ease-linear duration-[2000ms] animate-progressDecrease ${
                 toast.type === 'success' ? 'bg-emerald-500' : toast.type === 'warning' ? 'bg-orange-500' : 'bg-blue-500'
               }`} />
            </div>
          </div>
        ))}
      </div>

      {/* PANNEAU DE NOTIFICATIONS LATÉRAL */}
      {isNotificationOpen && (
        <div className="fixed inset-0 z-[300] flex justify-end animate-fadeIn">
          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" onClick={() => setIsNotificationOpen(false)}></div>
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-slideInRight">
            <div className="p-8 border-b flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
               <div>
                  <h3 className="text-xl font-black uppercase tracking-tighter flex items-center">
                    <Bell className="mr-3 text-purple-600" size={24} /> Centre d'Alertes
                  </h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{unreadCount} messages non-lus</p>
               </div>
               <button onClick={() => setIsNotificationOpen(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-all"><X size={28} /></button>
            </div>

            <div className="p-4 border-b flex items-center justify-between space-x-2 bg-white dark:bg-slate-900">
               <button onClick={markAllAsRead} disabled={unreadCount === 0} className="flex-1 py-2 bg-purple-50 dark:bg-purple-900/20 text-purple-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-purple-600 hover:text-white transition-all disabled:opacity-50">Tout marquer lu</button>
               <button onClick={clearNotifications} className="p-2.5 text-slate-400 hover:text-rose-500 rounded-xl hover:bg-rose-50 transition-all"><Trash2 size={18} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide">
               {notificationHistory.length > 0 ? notificationHistory.map(notif => (
                 <div key={notif.id} className={`p-5 rounded-2xl border transition-all relative group ${notif.isRead ? 'bg-slate-50 dark:bg-slate-800/30 border-slate-100 dark:border-slate-800 opacity-60' : 'bg-white dark:bg-slate-800 border-purple-100 dark:border-purple-900 shadow-sm'}`}>
                    <div className="flex items-start justify-between mb-3">
                       <div className={`p-2 rounded-lg ${notif.type === 'success' ? 'bg-emerald-100 text-emerald-600' : notif.type === 'warning' ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600'}`}>
                          {notif.type === 'success' ? <Check size={14} /> : notif.type === 'warning' ? <AlertCircle size={14} /> : <Info size={14} />}
                       </div>
                       <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{notif.timestamp}</span>
                    </div>
                    <h4 className={`text-xs font-black uppercase tracking-tight mb-1 ${notif.isRead ? 'text-slate-500' : 'text-slate-800 dark:text-white'}`}>{notif.title}</h4>
                    <p className={`text-[11px] font-bold leading-relaxed ${notif.isRead ? 'text-slate-400' : 'text-slate-600 dark:text-slate-300'}`}>{notif.message}</p>
                    
                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                       <button onClick={() => toggleNotificationRead(notif.id)} className="text-[9px] font-black uppercase tracking-widest text-purple-600 flex items-center hover:underline">
                          {notif.isRead ? <><Bell size={12} className="mr-1.5" /> Marquer non-lu</> : <><CheckCircle size={12} className="mr-1.5" /> Marquer comme lu</>}
                       </button>
                    </div>
                    {!notif.isRead && <div className="absolute top-4 right-4 w-2 h-2 bg-purple-600 rounded-full shadow-[0_0_8px_#9333ea]"></div>}
                 </div>
               )) : (
                 <div className="h-full flex flex-col items-center justify-center text-center opacity-20 py-20 space-y-4">
                    <BellOff size={64} />
                    <p className="font-black uppercase text-sm tracking-[0.2em]">Historique vide</p>
                 </div>
               )}
            </div>
          </div>
        </div>
      )}

      <aside className={`${isSidebarOpen ? 'w-72' : 'w-24'} bg-slate-900 transition-all duration-500 flex flex-col z-20 shadow-2xl ${config.language === 'ar' ? 'border-l border-slate-800' : ''}`}>
        <div className="p-6 h-28 flex items-center justify-between border-b border-slate-800">
          <AppLogo className={isSidebarOpen ? "w-full" : "w-12 h-12"} iconOnly={!isSidebarOpen} />
          <button onClick={() => setSidebarOpen(!isSidebarOpen)} className={`text-slate-400 hover:text-white ${config.language === 'ar' ? 'mr-2' : 'ml-2'} p-2 hover:bg-slate-800 rounded-xl transition-colors`}><Menu size={20}/></button>
        </div>
        <nav className="flex-1 mt-6 space-y-1.5 px-3 overflow-y-auto scrollbar-hide">
          {[
            { id: 'dashboard', icon: LayoutDashboard, label: t('dashboard') },
            { id: 'pos', icon: Monitor, label: t('pos') },
            { id: 'sales', icon: ShoppingCart, label: t('sales') },
            { id: 'invoicing', icon: FileText, label: t('invoicing') },
            { id: 'inventory', icon: Package, label: t('inventory') },
            { id: 'expenses', icon: Wallet, label: t('expenses') },
            { id: 'reports', icon: BarChart3, label: t('reports') },
            { id: 'attendances', icon: ClockIcon, label: t('attendances') },
            { id: 'hr', icon: IdCard, label: t('hr') },
            { id: 'settings', icon: SettingsIcon, label: t('settings') },
          ].filter(item => userPermissions.includes(item.id as ViewType)).map((item) => (
            <button key={item.id} onClick={() => setActiveView(item.id as ViewType)} className={`w-full flex items-center p-3.5 rounded-2xl transition-all duration-200 ${activeView === item.id ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
              <item.icon size={22} />
              {isSidebarOpen && <span className={`${config.language === 'ar' ? 'mr-4' : 'ml-4'} font-bold text-sm tracking-tight`}>{item.label}</span>}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-800">
           <button onClick={() => setIsLocked(true)} className="w-full flex items-center p-3.5 rounded-2xl text-rose-400 hover:bg-rose-500/10 transition-all font-bold text-sm">
             <LogOut size={22} />
             {isSidebarOpen && <span className={`${config.language === 'ar' ? 'mr-4' : 'ml-4'}`}>{t('logout')}</span>}
           </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950">
        <header className="h-24 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-8 z-[100] shrink-0">
          <div className="flex items-center space-x-10 rtl:space-x-reverse">
            <div className="flex flex-col">
              <span className="text-2xl font-black font-mono text-slate-800 dark:text-white tracking-tighter leading-none">
                {currentTime.toLocaleTimeString(config.language === 'ar' ? 'ar-SA' : 'fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
              <span className="text-[10px] font-black text-purple-600 uppercase tracking-widest mt-1">
                {currentTime.toLocaleDateString(config.language === 'ar' ? 'ar-SA' : 'fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </span>
            </div>
            <div className="h-10 w-px bg-slate-200 dark:bg-slate-700"></div>
            <span className="text-xs font-black uppercase text-slate-500 dark:text-slate-400 tracking-[0.2em]">{config.companyName}</span>
          </div>

          <div className="flex items-center space-x-4 rtl:space-x-reverse">
            {/* SÉLECTEUR DE LANGUE */}
            <div className="relative">
              <button onClick={() => setIsLanguageOpen(!isLanguageOpen)} className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-2xl transition-all hover:bg-slate-200 flex items-center space-x-2 rtl:space-x-reverse">
                <Languages size={20} />
                <span className="text-[10px] font-black uppercase">{config.language}</span>
              </button>
              {isLanguageOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsLanguageOpen(false)}></div>
                  <div className={`absolute ${config.language === 'ar' ? 'left-0' : 'right-0'} mt-4 w-40 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 z-20 overflow-hidden animate-scaleIn`}>
                    {[
                      { code: 'fr', label: 'Français' },
                      { code: 'en', label: 'English' },
                      { code: 'ar', label: 'العربية' }
                    ].map(lang => (
                      <button key={lang.code} onClick={() => changeLanguage(lang.code as Language)} className={`w-full px-5 py-3 text-left rtl:text-right text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${config.language === lang.code ? 'text-purple-600 bg-purple-50 dark:bg-purple-900/20' : 'text-slate-600 dark:text-slate-400'}`}>
                        {lang.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="relative">
              <button 
                onClick={() => {
                  if (canManageNotifications) setIsNotificationOpen(!isNotificationOpen);
                  else notifyUser("Accès Refusé", "Vous n'avez pas la permission de gérer les notifications.", "warning");
                }}
                className={`p-3 rounded-2xl transition-all relative ${isNotificationOpen ? 'bg-purple-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'} ${!canManageNotifications ? 'opacity-50' : ''}`}
              >
                <Bell size={22} />
                {unreadCount > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900">{unreadCount}</span>}
              </button>
            </div>

            <button onClick={() => setDarkMode(!darkMode)} className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-2xl transition-all hover:bg-slate-200">
              {darkMode ? <Sun size={22}/> : <Moon size={22}/>}
            </button>

            <div className={`flex items-center ${config.language === 'ar' ? 'mr-2 pl-4' : 'ml-2 pr-4'} space-x-3 rtl:space-x-reverse bg-slate-100 dark:bg-slate-800 rounded-2xl p-1.5`}>
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${currentUser.color} flex items-center justify-center text-white font-black shadow-lg text-sm`}>{currentUser.initials}</div>
              <div className="flex flex-col">
                <span className="text-xs font-black text-slate-800 dark:text-white uppercase leading-none">{currentUser.name}</span>
                <span className="text-[9px] font-black text-purple-600 uppercase tracking-widest mt-1">{currentUser.role}</span>
              </div>
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-8">{renderContent()}</div>
      </main>
    </div>
  );
};

export default App;
