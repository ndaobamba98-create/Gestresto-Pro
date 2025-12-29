
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  LayoutDashboard, ShoppingCart, Package, BarChart3, Bot, Search, Menu, Monitor, Settings as SettingsIcon, Sun, Moon, IdCard, ShieldCheck, UserCircle, FileText, Unlock, Key, Wifi, WifiOff, Bell, X, CheckCircle, Info, AlertCircle, LogOut, ChevronDown, Palette
} from 'lucide-react';
import { ViewType, Lead, Product, Task, SaleOrder, Employee, UserRole, ERPConfig, AttendanceRecord, CashSession, RolePermission, User, AppTheme } from './types';
import { INITIAL_LEADS, INITIAL_PRODUCTS, INITIAL_TASKS, INITIAL_SALES, INITIAL_EMPLOYEES, INITIAL_CONFIG, APP_USERS } from './constants';
import Dashboard from './components/Dashboard';
import Invoicing from './components/Invoicing';
import Sales from './components/Sales';
import Inventory from './components/Inventory';
import Reports from './components/Reports';
import POS from './components/POS';
import Settings from './components/Settings';
import HR from './components/HR';
import AIAssistant from './components/AIAssistant';

interface Toast {
  id: string;
  type: 'success' | 'info' | 'warning';
  title: string;
  message: string;
}

const LogoG = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10" />
    <path d="M16 8.5C15.1 7.6 13.8 7 12.3 7 9.4 7 7 9.2 7 12s2.4 5 5.3 5c2.4 0 4.4-1.5 5.1-3.5H12" />
  </svg>
);

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewType>('pos');
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [showAI, setShowAI] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showThemeDropdown, setShowThemeDropdown] = useState(false);
  
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
  const userRole = currentUser.role;

  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>(() => loadStored('rolePermissions', [
    { role: 'admin', allowedViews: ['dashboard', 'pos', 'invoicing', 'sales', 'inventory', 'reports', 'hr', 'settings'] },
    { role: 'cashier', allowedViews: ['pos', 'sales'] },
    { role: 'manager', allowedViews: ['dashboard', 'pos', 'sales', 'inventory', 'reports', 'hr'] }
  ]));
  
  const [leads, setLeads] = useState<Lead[]>(() => loadStored('leads', INITIAL_LEADS));
  const [products, setProducts] = useState<Product[]>(() => loadStored('products', INITIAL_PRODUCTS));
  const [tasks, setTasks] = useState<Task[]>(() => loadStored('tasks', INITIAL_TASKS));
  const [sales, setSales] = useState<SaleOrder[]>(() => loadStored('sales', INITIAL_SALES));
  const [employees, setEmployees] = useState<Employee[]>(() => loadStored('employees', INITIAL_EMPLOYEES));
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => loadStored('attendance', []));
  const [config, setConfig] = useState<ERPConfig>(() => loadStored('config', INITIAL_CONFIG));
  const [currentSession, setCurrentSession] = useState<CashSession | null>(() => loadStored('currentSession', null));

  // Notification Utility
  const notifyUser = useCallback((title: string, message: string, type: 'success' | 'info' | 'warning' = 'info') => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(`Gestresto Pro: ${title}`, { body: message, icon: 'https://cdn-icons-png.flaticon.com/512/1147/1147805.png' });
    }
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, type, title, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  }, []);

  useEffect(() => {
    if ("Notification" in window && Notification.permission !== "granted" && Notification.permission !== "denied") {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);

  useEffect(() => { localStorage.setItem('currentUser', JSON.stringify(currentUser)); }, [currentUser]);
  useEffect(() => { localStorage.setItem('rolePermissions', JSON.stringify(rolePermissions)); }, [rolePermissions]);
  useEffect(() => { localStorage.setItem('leads', JSON.stringify(leads)); }, [leads]);
  useEffect(() => { localStorage.setItem('products', JSON.stringify(products)); }, [products]);
  useEffect(() => { localStorage.setItem('sales', JSON.stringify(sales)); }, [sales]);
  useEffect(() => { localStorage.setItem('employees', JSON.stringify(employees)); }, [employees]);
  useEffect(() => { localStorage.setItem('attendance', JSON.stringify(attendance)); }, [attendance]);
  useEffect(() => { localStorage.setItem('config', JSON.stringify(config)); }, [config]);
  useEffect(() => { localStorage.setItem('currentSession', JSON.stringify(currentSession)); }, [currentSession]);

  const generateNextInvoiceId = useCallback(() => {
    const padded = String(config.nextInvoiceNumber).padStart(5, '0');
    return `${config.invoicePrefix}${padded}`;
  }, [config.invoicePrefix, config.nextInvoiceNumber]);

  const handleAddSale = (newSaleData: Partial<SaleOrder>) => {
    const nextId = generateNextInvoiceId();
    const finalSale: SaleOrder = {
      ...newSaleData,
      id: nextId,
      invoiceStatus: newSaleData.invoiceStatus || 'paid',
      status: newSaleData.status || 'confirmed'
    } as SaleOrder;

    setSales(prev => [finalSale, ...prev]);
    
    // Update config sequence
    setConfig(prev => ({ ...prev, nextInvoiceNumber: prev.nextInvoiceNumber + 1 }));

    if (currentSession && finalSale.total) {
      setCurrentSession({ ...currentSession, expectedBalance: currentSession.expectedBalance + finalSale.total });
    }
    notifyUser("Nouvelle Commande", `Facture ${nextId} - ${finalSale.total} ${config.currency}`, 'success');
  };

  const handleOpenSession = (openingBalance: number) => {
    const now = new Date();
    const newSession: CashSession = {
      id: `SESS-${Date.now()}`,
      openedAt: now.toLocaleDateString() + ' ' + now.toLocaleTimeString(),
      openingBalance,
      expectedBalance: openingBalance,
      status: 'open',
      cashierName: currentUser.name
    };
    setCurrentSession(newSession);
    notifyUser("Caisse ouverte", `Session ouverte par ${currentUser.name} avec ${openingBalance} ${config.currency}`, 'success');
  };

  const handleCloseSession = (closingBalance: number) => {
    if (!currentSession) return;
    setCurrentSession({ ...currentSession, closedAt: new Date().toLocaleTimeString(), closingBalance, status: 'closed' });
    notifyUser("Caisse clôturée", "La session a été fermée avec succès.", 'warning');
    setTimeout(() => setCurrentSession(null), 3000);
  };

  const handleUserChange = (user: User) => {
    setCurrentUser(user);
    setShowUserDropdown(false);
    notifyUser("Utilisateur changé", `Session active : ${user.name} (${user.role.toUpperCase()})`, 'info');
    
    // Check permissions for current view
    const perms = rolePermissions.find(p => p.role === user.role);
    if (perms && !perms.allowedViews.includes(activeView)) {
      setActiveView(perms.allowedViews[0]);
    }
  };

  const handleThemeChange = (newTheme: AppTheme) => {
    setConfig(prev => ({ ...prev, theme: newTheme }));
    setShowThemeDropdown(false);
    notifyUser("Thème mis à jour", `L'interface utilise désormais le thème ${newTheme}.`, 'success');
  };

  const filteredNavItems = useMemo(() => {
    const perms = rolePermissions.find(p => p.role === userRole);
    if (!perms) return [];
    return [
      { id: 'dashboard', icon: LayoutDashboard, label: 'Tableau de bord' },
      { id: 'pos', icon: Monitor, label: 'Caisse POS' },
      { id: 'invoicing', icon: FileText, label: 'Facturation' },
      { id: 'sales', icon: ShoppingCart, label: 'Ventes' },
      { id: 'inventory', icon: Package, label: 'Inventaire' },
      { id: 'reports', icon: BarChart3, label: 'Rapports' },
      { id: 'hr', icon: IdCard, label: 'RH' },
      { id: 'settings', icon: SettingsIcon, label: 'Paramètres' },
    ].filter(item => perms.allowedViews.includes(item.id as ViewType));
  }, [userRole, rolePermissions]);

  const themes: { id: AppTheme; label: string; color: string }[] = [
    { id: 'purple', label: 'Violet (Défaut)', color: 'bg-purple-600' },
    { id: 'emerald', label: 'Émeraude', color: 'bg-emerald-600' },
    { id: 'blue', label: 'Bleu Royal', color: 'bg-blue-600' },
    { id: 'rose', label: 'Passion Rose', color: 'bg-rose-600' },
    { id: 'amber', label: 'Soleil Ambre', color: 'bg-amber-600' },
    { id: 'slate', label: 'Ardoise Pro', color: 'bg-slate-600' },
  ];

  const renderContent = () => {
    const commonProps = { notify: notifyUser };
    switch (activeView) {
      case 'dashboard': return <Dashboard leads={leads} sales={sales} userRole={userRole} config={config} />;
      case 'pos': return <POS products={products} onSaleComplete={handleAddSale} config={config} session={currentSession} onOpenSession={handleOpenSession} onCloseSession={handleCloseSession} {...commonProps} />;
      case 'invoicing': return <Invoicing sales={sales} config={config} onUpdate={setSales} products={products} userRole={userRole} onAddSale={handleAddSale} {...commonProps} />;
      case 'sales': return <Sales sales={sales} onUpdate={setSales} config={config} products={products} userRole={userRole} onAddSale={handleAddSale} {...commonProps} />;
      case 'inventory': return <Inventory products={products} onUpdate={setProducts} config={config} userRole={userRole} {...commonProps} />;
      case 'reports': return <Reports sales={sales} config={config} products={products} />;
      case 'hr': return <HR employees={employees} onUpdate={setEmployees} attendance={attendance} onUpdateAttendance={setAttendance} config={config} userRole={userRole} {...commonProps} />;
      case 'settings': return <Settings products={products} onUpdateProducts={setProducts} config={config} onUpdateConfig={setConfig} rolePermissions={rolePermissions} onUpdatePermissions={setRolePermissions} {...commonProps} />;
      default: return null;
    }
  };

  return (
    <div className={`flex h-screen overflow-hidden theme-${config.theme} ${darkMode ? 'dark text-slate-100' : 'text-slate-900'}`}>
      <div className="fixed top-6 right-6 z-[100] space-y-3 pointer-events-none">
        {toasts.map(toast => (
          <div key={toast.id} className={`w-80 p-4 rounded-2xl border backdrop-blur-md shadow-2xl flex items-start space-x-4 pointer-events-auto animate-slideInRight ${
            toast.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600' :
            toast.type === 'warning' ? 'bg-orange-500/10 border-orange-500/20 text-orange-600' : 'bg-blue-500/10 border-blue-500/20 text-blue-600'
          }`}>
            <div className="mt-1">{toast.type === 'success' ? <CheckCircle size={20} /> : toast.type === 'warning' ? <AlertCircle size={20} /> : <Info size={20} />}</div>
            <div className="flex-1">
              <h4 className="text-sm font-black uppercase tracking-tight">{toast.title}</h4>
              <p className="text-xs font-medium opacity-80 mt-1">{toast.message}</p>
            </div>
            <button onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))} className="opacity-40 hover:opacity-100 transition-opacity"><X size={16} /></button>
          </div>
        ))}
      </div>

      <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-slate-900 dark:bg-slate-950 transition-all duration-300 flex flex-col z-20 shadow-2xl border-r border-slate-800`}>
        <div className="p-4 flex items-center border-b border-slate-800">
          <div className="flex items-center w-full overflow-hidden">
            <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg transition-all duration-500">
              <LogoG className="text-white w-6 h-6" />
            </div>
            {isSidebarOpen && (
              <div className="ml-3 flex flex-col leading-tight animate-fadeIn">
                <span className="text-white font-black text-base tracking-tighter uppercase">Gestresto<span className="text-purple-600">Pro</span></span>
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">MYA D'OR FAST-FOOD</span>
              </div>
            )}
          </div>
          {isSidebarOpen && <button onClick={() => setSidebarOpen(false)} className="text-slate-500 hover:text-white ml-auto"><Menu size={18} /></button>}
        </div>
        {!isSidebarOpen && <div className="p-4 flex justify-center border-b border-slate-800"><button onClick={() => setSidebarOpen(true)} className="text-slate-500 hover:text-white"><Menu size={20} /></button></div>}
        <nav className="flex-1 mt-4 px-2 space-y-1 overflow-y-auto scrollbar-hide">
          {filteredNavItems.map((item) => (
            <button key={item.id} onClick={() => setActiveView(item.id as ViewType)} className={`w-full flex items-center p-3 rounded-lg transition-all ${activeView === item.id ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
              <item.icon size={20} className="flex-shrink-0" />
              {isSidebarOpen && <span className="ml-3 font-medium whitespace-nowrap">{item.label}</span>}
            </button>
          ))}
        </nav>
        {currentSession && isSidebarOpen && (
          <div className="mx-4 mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
             <div className="flex items-center justify-between mb-1">
               <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Session active</span>
               <Unlock size={10} className="text-emerald-500" />
             </div>
             <p className="text-xs font-bold text-slate-300">{currentSession.expectedBalance.toLocaleString()} {config.currency}</p>
             <p className="text-[8px] text-emerald-400 mt-1 uppercase font-bold italic tracking-wider">{currentSession.cashierName}</p>
          </div>
        )}
        {userRole === 'admin' && isOnline && (
          <div className="p-4 border-t border-slate-800">
            <button onClick={() => setShowAI(true)} className="w-full flex items-center p-3 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white transition-all group">
              <Bot size={20} className="group-hover:animate-pulse flex-shrink-0" />
              {isSidebarOpen && <span className="ml-3 font-medium">Assistant IA</span>}
            </button>
          </div>
        )}
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden relative bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 shrink-0 z-10 shadow-sm transition-colors duration-300">
          <div className="flex items-center flex-1">
            <div className="relative w-full max-w-md hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input type="text" placeholder="Rechercher partout..." className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-full text-sm focus:ring-2 focus:ring-purple-500 dark:text-slate-100" />
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className={`flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${isOnline ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
               {isOnline ? <Wifi size={12} className="mr-1.5" /> : <WifiOff size={12} className="mr-1.5" />}
               {isOnline ? 'Synchro OK' : 'Hors-ligne'}
            </div>

            <div className="relative">
              <button 
                onClick={() => setShowThemeDropdown(!showThemeDropdown)}
                className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all flex items-center"
                title="Changer de thème"
              >
                <Palette size={20} />
              </button>

              {showThemeDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden animate-fadeIn">
                  <div className="p-3 border-b border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Ambiance Couleur</p>
                  </div>
                  <div className="p-1 max-h-60 overflow-y-auto">
                    {themes.map((theme) => (
                      <button
                        key={theme.id}
                        onClick={() => handleThemeChange(theme.id)}
                        className={`w-full flex items-center space-x-3 p-2.5 rounded-xl transition-all ${config.theme === theme.id ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                      >
                        <div className={`w-4 h-4 rounded-full ${theme.color} border border-white/20 shadow-sm`}></div>
                        <span className="text-xs font-bold">{theme.label}</span>
                        {config.theme === theme.id && <CheckCircle size={12} className="ml-auto text-purple-600" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="relative">
              <button 
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center space-x-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-3 py-1.5 rounded-xl transition-all border border-slate-200 dark:border-slate-700"
              >
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-white text-xs font-black shadow-md`}>
                  {currentUser.initials}
                </div>
                <div className="hidden lg:block text-left">
                  <p className="text-xs font-black text-slate-900 dark:text-white leading-tight uppercase tracking-tight">{currentUser.name}</p>
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em]">{currentUser.role}</p>
                </div>
                <ChevronDown size={14} className={`text-slate-400 transition-transform ${showUserDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showUserDropdown && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden animate-fadeIn">
                  <div className="p-3 border-b border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 italic">Changer d'utilisateur</p>
                  </div>
                  <div className="p-1">
                    {APP_USERS.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => handleUserChange(user)}
                        className={`w-full flex items-center space-x-3 p-3 rounded-xl transition-all ${currentUser.id === user.id ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-600' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-purple-600'}`}
                      >
                        <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${user.color} flex items-center justify-center text-white text-xs font-black shadow-sm`}>
                          {user.initials}
                        </div>
                        <div className="text-left flex-1 overflow-hidden">
                          <p className="text-xs font-black truncate">{user.name}</p>
                          <p className="text-[8px] font-black uppercase tracking-widest opacity-60">{user.role}</p>
                        </div>
                        {currentUser.id === user.id && <CheckCircle size={14} className="ml-auto text-purple-600" />}
                      </button>
                    ))}
                  </div>
                  <div className="p-2 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800">
                    <button className="w-full flex items-center justify-center space-x-2 p-3 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all text-[10px] font-black uppercase tracking-[0.2em]">
                      <LogOut size={16} />
                      <span>Se déconnecter</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button onClick={() => setDarkMode(!darkMode)} className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all">
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </header>
        <div className="flex-1 overflow-hidden p-4 sm:p-6 relative">{renderContent()}</div>
        {showAI && userRole === 'admin' && <AIAssistant onClose={() => setShowAI(false)} context={{ leads, products, tasks, sales, employees, config, attendance }} />}
      </main>
    </div>
  );
};

export default App;
