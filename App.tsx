
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  LayoutDashboard, ShoppingCart, Package, BarChart3, Monitor, Settings as SettingsIcon, Sun, Moon, IdCard, LogOut, Clock as ClockIcon, FileText, Menu, CheckCircle, Info, AlertCircle, Search, ArrowRight, User as UserIcon, Wallet, Bell, X, Check, Trash2, BellOff, AlertTriangle, Inbox, CheckCheck, History, BellRing, Circle
} from 'lucide-react';
import { ViewType, Product, SaleOrder, Employee, ERPConfig, AttendanceRecord, RolePermission, User, CashSession, Expense, Purchase, Supplier } from './types';
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

// Logo Premium
export const AppLogo = ({ className = "w-14 h-14", iconOnly = false, light = false }) => (
  <div className={`flex items-center ${iconOnly ? 'justify-center' : 'space-x-4'} ${className}`}>
    <div className="relative group shrink-0">
      <div className="absolute -inset-2 bg-accent rounded-2xl blur-lg opacity-20 group-hover:opacity-50 transition duration-1000"></div>
      <div className={`relative w-12 h-12 ${light ? 'bg-white' : 'bg-slate-900'} rounded-2xl flex items-center justify-center shadow-2xl border border-white/10 overflow-hidden transform group-hover:rotate-6 transition-transform duration-500`}>
        <svg viewBox="0 0 100 100" className="w-8/12 h-8/12" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M30 35C30 26.7157 36.7157 20 45 20H70V35H45C42.2386 35 40 37.2386 40 40C40 42.7614 42.2386 45 45 45H55C63.2843 45 70 51.7157 70 60C70 68.2843 63.2843 75 55 75H30V60H55C57.7614 60 60 57.7614 60 55C60 52.2386 57.7614 50 55 50H45C36.7157 50 30 43.2843 30 35Z" fill={light ? "#0f172a" : "white"} />
          <circle cx="20" cy="20" r="12" className="fill-accent" />
        </svg>
      </div>
    </div>
    {!iconOnly && (
      <div className="flex flex-col">
        <div className="flex items-center">
          <span className={`${light ? 'text-slate-900' : 'text-white'} font-black text-xl leading-none uppercase tracking-tighter`}>
            Sama Pos
          </span>
          <div className="ml-2 flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </div>
        </div>
        <span className="text-accent font-black text-xs uppercase tracking-[0.4em] mt-0.5 opacity-80">
          SYSTEM +
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

const loadStored = <T extends unknown>(key: string, initial: T): T => {
  const saved = localStorage.getItem(key);
  if (!saved) return initial;
  try {
    return JSON.parse(saved);
  } catch {
    return initial;
  }
};

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewType>('dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [notificationHistory, setNotificationHistory] = useState<Toast[]>(() => loadStored('notificationHistory', []));
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isLocked, setIsLocked] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [darkMode, setDarkMode] = useState(() => loadStored('darkMode', false));

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
    { role: 'admin', allowedViews: ['dashboard', 'pos', 'invoicing', 'sales', 'inventory', 'expenses', 'reports', 'hr', 'manage_hr', 'attendances', 'settings', 'logout', 'switch_account', 'manage_categories', 'manage_security', 'manage_inventory', 'manage_invoicing', 'manage_notifications', 'manage_sales'] },
    { role: 'cashier', allowedViews: ['pos', 'attendances', 'logout'] },
    { role: 'manager', allowedViews: ['dashboard', 'pos', 'sales', 'inventory', 'expenses', 'reports', 'hr', 'manage_hr', 'attendances', 'logout', 'switch_account', 'manage_categories', 'manage_security', 'manage_inventory', 'manage_invoicing', 'manage_notifications', 'manage_sales'] }
  ]));

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);

  // Synchronisation Persistence
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
    
    // Durée de 5 secondes avant de disparaître
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  }, []);

  const unreadNotificationsCount = useMemo(() => notificationHistory.filter(n => !n.isRead).length, [notificationHistory]);

  const userPermissions = useMemo(() => rolePermissions.find(p => p.role === currentUser.role)?.allowedViews || [], [rolePermissions, currentUser.role]);
  const canManageNotifications = useMemo(() => userPermissions.includes('manage_notifications'), [userPermissions]);

  const markAllNotificationsAsRead = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    
    if (!canManageNotifications) {
      notifyUser("Accès Refusé", "Vous n'avez pas la permission de tout lire.", "warning");
      return;
    }
    
    setNotificationHistory(prev => prev.map(n => ({ ...n, isRead: true })));
    setToasts([]);
    notifyUser("Workspace", "Toutes les activités sont marquées comme lues.", "success");
  };

  const markNotificationAsRead = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setNotificationHistory(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const deleteNotification = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!canManageNotifications) {
      notifyUser("Accès Refusé", "Suppression interdite.", "warning");
      return;
    }
    setNotificationHistory(prev => prev.filter(n => n.id !== id));
  };

  const deleteAllNotifications = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!canManageNotifications) return;
    setNotificationHistory([]);
    notifyUser("Notifications", "Historique vidé.", "info");
  };

  const handleAddSale = (newSaleData: Partial<SaleOrder>) => {
    const saleItems = newSaleData.items || [];
    const isRefund = newSaleData.status === 'refunded';
    const generatedReference = `${config.invoicePrefix || 'FAC/'}${config.nextInvoiceNumber.toString().padStart(4, '0')}`;

    setProducts(prev => prev.map(p => {
      const item = saleItems.find(i => i.productId === p.id);
      if (item) {
        const newStock = Math.max(0, p.stock + (isRefund ? item.quantity : -item.quantity));
        if (!isRefund && newStock <= (p.lowStockThreshold || 10)) {
          notifyUser("Alerte Stock", `${p.name} est épuisé !`, "warning");
        }
        return { ...p, stock: newStock };
      }
      return p;
    }));

    const sale: SaleOrder = {
      id: generatedReference,
      customer: newSaleData.customer || 'Client Comptoir',
      date: new Date().toISOString(),
      total: newSaleData.total || 0,
      status: newSaleData.status || 'confirmed',
      items: saleItems,
      paymentMethod: newSaleData.paymentMethod || 'Especes',
      payments: newSaleData.payments || [],
      amountReceived: newSaleData.amountReceived || newSaleData.total || 0,
      change: newSaleData.change || 0,
      orderLocation: newSaleData.orderLocation || 'Comptoir',
      invoiceStatus: isRefund ? 'refunded' : 'paid',
    };
    
    setSales(prev => [sale, ...prev]);
    if (!isRefund) setConfig(prev => ({ ...prev, nextInvoiceNumber: prev.nextInvoiceNumber + 1 }));
    notifyUser(isRefund ? "Avoir" : "Vente", `${generatedReference} validée.`, isRefund ? 'warning' : 'success');
  };

  const renderContent = () => {
    const commonProps = { notify: notifyUser, userPermissions, t };
    switch (activeView) {
      case 'dashboard': return <Dashboard leads={[]} sales={sales} expenses={expenses} userRole={currentUser.role} config={config} products={products} t={t} onNavigate={setActiveView} />;
      case 'pos': return <POS products={products} sales={sales} onSaleComplete={handleAddSale} config={config} session={currentSession} onOpenSession={(bal, id) => setCurrentSession({id: `S-${Date.now()}`, openedAt: new Date().toISOString(), openingBalance: bal, expectedBalance: bal, status: 'open', cashierName: APP_USERS.find(u=>u.id===id)?.name||'', cashierId: id})} onCloseSession={() => setCurrentSession(null)} {...commonProps} />;
      case 'sales': return <Sales sales={sales} expenses={expenses} onUpdate={setSales} config={config} products={products} userRole={currentUser.role} onAddSale={handleAddSale} {...commonProps} />;
      case 'inventory': return <Inventory products={products} onUpdate={setProducts} config={config} userRole={currentUser.role} t={t} userPermissions={userPermissions} />;
      case 'expenses': return <Expenses expenses={expenses} setExpenses={setExpenses} purchases={purchases} onAddPurchase={p => setPurchases(v => [p, ...v])} onDeletePurchase={() => {}} suppliers={suppliers} setSuppliers={setSuppliers} products={products} config={config} userRole={currentUser.role} notify={notifyUser} t={t} />;
      case 'hr': return <HR employees={employees} onUpdate={setEmployees} attendance={attendance} onUpdateAttendance={setAttendance} config={config} {...commonProps} />;
      case 'attendances': return <Attendances employees={employees} onUpdateEmployees={setEmployees} attendance={attendance} onUpdateAttendance={setAttendance} currentUser={currentUser} notify={notifyUser} t={t} />;
      case 'settings': return <Settings products={products} onUpdateProducts={setProducts} config={config} onUpdateConfig={setConfig} rolePermissions={rolePermissions} onUpdatePermissions={setRolePermissions} {...commonProps} />;
      case 'invoicing': return <Invoicing sales={sales} config={config} onUpdate={setSales} products={products} userRole={currentUser.role} onAddSale={handleAddSale} {...commonProps} />;
      case 'reports': return <Reports sales={sales} expenses={expenses} config={config} products={products} t={t} notify={notifyUser} />;
      default: return null;
    }
  };

  if (isLocked) {
    return (
      <div className={`h-screen w-full flex flex-col items-center justify-center bg-slate-950 theme-${config.theme}`}>
        <div className="mb-12 text-center animate-fadeIn">
          <AppLogo className="mx-auto mb-6 scale-[1.8]" iconOnly />
          <h1 className="text-4xl font-black text-white uppercase mt-16 tracking-tighter">Sama Pos <span className="text-accent">+</span></h1>
          <div className="mt-8 text-white/40 font-mono text-xl">{currentTime.toLocaleTimeString()}</div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 animate-slideUp">
          {APP_USERS.map((user) => (
            <button key={user.id} onClick={() => { setCurrentUser(user); setIsLocked(false); }} className="bg-slate-900/50 backdrop-blur-md p-6 rounded-3xl border border-slate-800 hover:border-accent transition-all flex flex-col items-center space-y-4 w-40 hover:scale-105 group">
              <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${user.color} flex items-center justify-center text-white text-xl font-black shadow-lg group-hover:scale-110 transition-transform`}>{user.initials}</div>
              <p className="text-white font-black uppercase text-[10px] tracking-widest">{user.name}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-screen overflow-hidden theme-${config.theme} ${darkMode ? 'dark text-slate-100' : 'text-slate-900'} ${config.language === 'ar' ? 'font-ar' : ''}`}>
      
      {isNotificationOpen && <div className="fixed inset-0 z-[110]" onClick={() => setIsNotificationOpen(false)} />}

      <aside className={`${isSidebarOpen ? 'w-72' : 'w-24'} bg-slate-900 transition-all duration-500 flex flex-col z-20 shadow-2xl`}>
        <div className="p-6 h-28 flex items-center justify-between border-b border-slate-800">
          <AppLogo className={isSidebarOpen ? "w-full" : "w-12 h-12"} iconOnly={!isSidebarOpen} />
          <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="text-slate-400 hover:text-white p-2 hover:bg-slate-800 rounded-xl transition-colors"><Menu size={20}/></button>
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
            <button key={item.id} onClick={() => setActiveView(item.id as ViewType)} className={`w-full flex items-center p-3.5 rounded-2xl transition-all duration-200 ${activeView === item.id ? 'bg-accent text-white shadow-lg shadow-accent' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
              <item.icon size={22} />
              {isSidebarOpen && <span className="ml-4 font-bold text-sm tracking-tight">{item.label}</span>}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-800">
           <button onClick={() => setIsLocked(true)} className="w-full flex items-center p-3.5 rounded-2xl text-rose-400 hover:bg-rose-500/10 transition-all font-bold text-sm">
             <LogOut size={22} />
             {isSidebarOpen && <span className="ml-4">{t('logout')}</span>}
           </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950">
        <header className="h-24 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-8 z-[100]">
          <div className="flex flex-col">
            <span className="text-2xl font-black font-mono tracking-tighter leading-none">{currentTime.toLocaleTimeString()}</span>
            <span className="text-[10px] font-black text-accent uppercase tracking-widest mt-1">{currentTime.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
          </div>

          <div className="flex items-center space-x-4">
            <div className="relative">
               <button 
                 onClick={(e) => { e.stopPropagation(); setIsNotificationOpen(!isNotificationOpen); }}
                 className={`p-3 rounded-2xl transition-all relative z-[120] ${unreadNotificationsCount > 0 ? 'bg-accent/10 text-accent' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-slate-200'}`}
               >
                 {unreadNotificationsCount > 0 ? <BellRing size={22} className="animate-bounce" /> : <Bell size={22} />}
                 {unreadNotificationsCount > 0 && <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[9px] font-black w-5 h-5 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center shadow-lg">{unreadNotificationsCount}</span>}
               </button>

               {isNotificationOpen && (
                 <div className="absolute right-0 mt-3 w-[400px] bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 z-[130] flex flex-col overflow-hidden animate-slideUp">
                    <div className="p-6 border-b dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
                       <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Activités Récentes</h4>
                       <div className="flex space-x-2">
                          <button 
                            onClick={(e) => markAllNotificationsAsRead(e)} 
                            disabled={!canManageNotifications}
                            title={canManageNotifications ? "Tout marquer comme lu" : "Permission requise pour cette action"} 
                            className={`p-2 transition-all flex items-center space-x-1 ${canManageNotifications ? 'text-slate-400 hover:text-emerald-500' : 'text-slate-200 cursor-not-allowed opacity-50'}`}
                          >
                            <CheckCheck size={18} />
                            <span className="text-[8px] font-black uppercase">Tout lire</span>
                          </button>
                          {canManageNotifications && (
                            <button onClick={(e) => deleteAllNotifications(e)} title="Tout effacer" className="p-2 text-slate-400 hover:text-rose-500 transition-all">
                              <Trash2 size={16} />
                            </button>
                          )}
                       </div>
                    </div>
                    <div className="flex-1 max-h-[450px] overflow-y-auto scrollbar-hide px-4 py-2">
                       {notificationHistory.length > 0 ? notificationHistory.map((notif) => (
                         <div key={notif.id} className="relative group mb-2">
                            <div 
                               className={`w-full text-left p-4 rounded-2xl flex items-start space-x-4 transition-all relative overflow-hidden ${notif.isRead ? 'opacity-50 bg-transparent border-transparent' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 shadow-sm ring-1 ring-slate-100 dark:ring-slate-700'}`}
                            >
                               {!notif.isRead && <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent"></div>}
                               
                               <div className={`mt-1 p-2 rounded-xl shrink-0 ${notif.type === 'success' ? 'bg-emerald-500/10 text-emerald-500' : notif.type === 'warning' ? 'bg-orange-500/10 text-orange-500' : 'bg-blue-500/10 text-blue-500'}`}>
                                  {notif.type === 'success' ? <CheckCircle size={14}/> : notif.type === 'warning' ? <AlertCircle size={14}/> : <Info size={14}/>}
                               </div>
                               
                               <div className="flex-1 min-w-0" onClick={(e) => { if(!notif.isRead) markNotificationAsRead(notif.id, e); }}>
                                  <div className="flex justify-between items-start">
                                     <div className="flex items-center">
                                       <h5 className={`text-[10px] font-black uppercase truncate pr-2 ${notif.isRead ? 'text-slate-400' : 'text-slate-900 dark:text-white'}`}>{notif.title}</h5>
                                       {!notif.isRead && <div className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse mr-2"></div>}
                                     </div>
                                     <span className="text-[8px] font-bold text-slate-400 whitespace-nowrap">{notif.timestamp}</span>
                                  </div>
                                  <p className="text-[10px] font-medium leading-tight mt-1 line-clamp-2 text-slate-500">{notif.message}</p>
                               </div>

                               {!notif.isRead && (
                                 <button 
                                   onClick={(e) => markNotificationAsRead(notif.id, e)}
                                   className="mt-1 p-2 bg-slate-50 dark:bg-slate-700 rounded-lg text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 transition-all opacity-0 group-hover:opacity-100"
                                   title="Marquer comme lu"
                                 >
                                   <Check size={14} />
                                 </button>
                               )}
                               {canManageNotifications && (
                                 <button 
                                   onClick={(e) => deleteNotification(notif.id, e)}
                                   className="mt-1 p-2 text-slate-300 hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100"
                                 >
                                   <X size={14} />
                                 </button>
                               )}
                            </div>
                         </div>
                       )) : (
                         <div className="py-20 flex flex-col items-center justify-center opacity-20 text-center"><BellOff size={40} className="mb-4"/><p className="text-[10px] font-black uppercase tracking-[0.2em]">Rien à signaler</p></div>
                       )}
                    </div>
                 </div>
               )}
            </div>

            <button onClick={() => setDarkMode(!darkMode)} className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-2xl hover:bg-slate-200 transition-all">{darkMode ? <Sun size={22}/> : <Moon size={22}/>}</button>
            
            <div className="flex items-center ml-2 pr-4 space-x-3 bg-slate-100 dark:bg-slate-800 rounded-2xl p-1.5 border border-slate-200 dark:border-slate-700">
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

      {/* ZONE NOTIFICATIONS TOAST - AFFICHÉE EN HAUT À DROITE */}
      <div className="fixed top-28 right-8 z-[300] flex flex-col items-end space-y-4 pointer-events-none w-full max-w-sm">
        {toasts.map((toast) => (
          <div 
            key={toast.id} 
            className={`w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border p-5 rounded-[2rem] shadow-2xl flex items-start space-x-4 pointer-events-auto animate-slideInRight overflow-hidden relative group`}
          >
            <div className={`mt-1 p-2.5 rounded-2xl shrink-0 ${toast.type === 'success' ? 'bg-emerald-500/10 text-emerald-500' : toast.type === 'warning' ? 'bg-orange-500/10 text-orange-500' : 'bg-blue-500/10 text-blue-500'}`}>
               {toast.type === 'success' ? <CheckCircle size={20}/> : toast.type === 'warning' ? <AlertTriangle size={20}/> : <Info size={20}/>}
            </div>
            <div className="flex-1 min-w-0">
               <h5 className="text-[11px] font-black uppercase tracking-widest text-slate-900 dark:text-white mb-1">{toast.title}</h5>
               <p className="text-[11px] font-medium text-slate-500 leading-tight">{toast.message}</p>
            </div>
            <button 
              onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
              className="p-1 text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all"
            >
              <X size={16}/>
            </button>
            <div className={`absolute bottom-0 left-0 h-1 ${toast.type === 'success' ? 'bg-emerald-500' : toast.type === 'warning' ? 'bg-orange-500' : 'bg-blue-500'} animate-progressDecrease`}></div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default App;
