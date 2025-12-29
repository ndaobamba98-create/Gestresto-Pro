
import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  BarChart3, 
  Bot, 
  Search, 
  Menu,
  Monitor,
  Settings as SettingsIcon,
  Sun,
  Moon,
  IdCard,
  ShieldCheck,
  UserCircle,
  FileText,
  Unlock,
  Key,
  Wifi,
  WifiOff,
  CloudCheck
} from 'lucide-react';
import { ViewType, Lead, Product, Task, SaleOrder, Employee, UserRole, ERPConfig, AttendanceRecord, CashSession, RolePermission } from './types';
import { INITIAL_LEADS, INITIAL_PRODUCTS, INITIAL_TASKS, INITIAL_SALES, INITIAL_EMPLOYEES, INITIAL_CONFIG } from './constants';
import Dashboard from './components/Dashboard';
import Invoicing from './components/Invoicing';
import Sales from './components/Sales';
import Inventory from './components/Inventory';
import Reports from './components/Reports';
import POS from './components/POS';
import Settings from './components/Settings';
import HR from './components/HR';
import AIAssistant from './components/AIAssistant';

const LogoG = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.5" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    {/* Le Cercle extérieur */}
    <circle cx="12" cy="12" r="10" />
    {/* La lettre G simplifiée */}
    <path d="M16 8.5C15.1 7.6 13.8 7 12.3 7 9.4 7 7 9.2 7 12s2.4 5 5.3 5c2.4 0 4.4-1.5 5.1-3.5H12" />
  </svg>
);

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewType>('pos');
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [showAI, setShowAI] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
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

  const [userRole, setUserRole] = useState<UserRole>(() => loadStored('userRole', 'admin' as UserRole));
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>(() => loadStored('rolePermissions', [
    { role: 'admin', allowedViews: ['dashboard', 'pos', 'invoicing', 'sales', 'inventory', 'reports', 'hr', 'settings'] },
    { role: 'cashier', allowedViews: ['pos', 'sales'] },
    { role: 'manager', allowedViews: ['dashboard', 'pos', 'sales', 'inventory', 'reports'] }
  ]));
  
  const [leads, setLeads] = useState<Lead[]>(() => loadStored('leads', INITIAL_LEADS));
  const [products, setProducts] = useState<Product[]>(() => loadStored('products', INITIAL_PRODUCTS));
  const [tasks, setTasks] = useState<Task[]>(() => loadStored('tasks', INITIAL_TASKS));
  const [sales, setSales] = useState<SaleOrder[]>(() => loadStored('sales', INITIAL_SALES));
  const [employees, setEmployees] = useState<Employee[]>(() => loadStored('employees', INITIAL_EMPLOYEES));
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => loadStored('attendance', []));
  const [config, setConfig] = useState<ERPConfig>(() => loadStored('config', INITIAL_CONFIG));
  const [currentSession, setCurrentSession] = useState<CashSession | null>(() => loadStored('currentSession', null));

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

  useEffect(() => { localStorage.setItem('userRole', userRole); }, [userRole]);
  useEffect(() => { localStorage.setItem('rolePermissions', JSON.stringify(rolePermissions)); }, [rolePermissions]);
  useEffect(() => { localStorage.setItem('leads', JSON.stringify(leads)); }, [leads]);
  useEffect(() => { localStorage.setItem('products', JSON.stringify(products)); }, [products]);
  useEffect(() => { localStorage.setItem('sales', JSON.stringify(sales)); }, [sales]);
  useEffect(() => { localStorage.setItem('employees', JSON.stringify(employees)); }, [employees]);
  useEffect(() => { localStorage.setItem('attendance', JSON.stringify(attendance)); }, [attendance]);
  useEffect(() => { localStorage.setItem('config', JSON.stringify(config)); }, [config]);
  useEffect(() => { localStorage.setItem('currentSession', JSON.stringify(currentSession)); }, [currentSession]);

  const allNavItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Tableau de bord' },
    { id: 'pos', icon: Monitor, label: 'Caisse POS' },
    { id: 'invoicing', icon: FileText, label: 'Facturation' },
    { id: 'sales', icon: ShoppingCart, label: 'Ventes' },
    { id: 'inventory', icon: Package, label: 'Inventaire' },
    { id: 'reports', icon: BarChart3, label: 'Rapports' },
    { id: 'hr', icon: IdCard, label: 'RH' },
    { id: 'settings', icon: SettingsIcon, label: 'Paramètres' },
  ];

  const filteredNavItems = useMemo(() => {
    const perms = rolePermissions.find(p => p.role === userRole);
    if (!perms) return [];
    return allNavItems.filter(item => perms.allowedViews.includes(item.id as ViewType));
  }, [userRole, rolePermissions]);

  const handleOpenSession = (openingBalance: number) => {
    const now = new Date();
    const newSession: CashSession = {
      id: `SESS-${Date.now()}`,
      openedAt: now.toLocaleDateString() + ' ' + now.toLocaleTimeString(),
      openingBalance,
      expectedBalance: openingBalance,
      status: 'open',
      cashierName: userRole === 'admin' ? 'Bamba Ndao' : 'Caissier 01'
    };
    setCurrentSession(newSession);
  };

  const handleCloseSession = (closingBalance: number) => {
    if (!currentSession) return;
    setCurrentSession({
      ...currentSession,
      closedAt: new Date().toLocaleTimeString(),
      closingBalance,
      status: 'closed'
    });
    setTimeout(() => setCurrentSession(null), 3000);
  };

  const handleAddSale = (newSale: SaleOrder) => {
    setSales(prev => [{ ...newSale, invoiceStatus: 'paid' }, ...prev]);
    if (currentSession) {
      setCurrentSession({
        ...currentSession,
        expectedBalance: currentSession.expectedBalance + newSale.total
      });
    }
  };

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard': return <Dashboard leads={leads} sales={sales} userRole={userRole} config={config} />;
      case 'pos': return (
        <POS 
          products={products} 
          onSaleComplete={handleAddSale} 
          config={config} 
          session={currentSession}
          onOpenSession={handleOpenSession}
          onCloseSession={handleCloseSession}
        />
      );
      case 'invoicing': return <Invoicing sales={sales} config={config} onUpdate={setSales} />;
      case 'sales': return <Sales sales={sales} onUpdate={setSales} config={config} />;
      case 'inventory': return <Inventory products={products} onUpdate={setProducts} config={config} />;
      case 'reports': return <Reports sales={sales} config={config} products={products} />;
      case 'hr': return (
        <HR 
          employees={employees} 
          onUpdate={setEmployees} 
          attendance={attendance} 
          onUpdateAttendance={setAttendance}
          config={config} 
        />
      );
      case 'settings': return (
        <Settings 
          products={products} 
          onUpdateProducts={setProducts} 
          config={config} 
          onUpdateConfig={setConfig}
          rolePermissions={rolePermissions}
          onUpdatePermissions={setRolePermissions}
        />
      );
      default: return <POS products={products} onSaleComplete={handleAddSale} config={config} session={currentSession} onOpenSession={handleOpenSession} onCloseSession={handleCloseSession} />;
    }
  };

  return (
    <div className={`flex h-screen overflow-hidden ${darkMode ? 'dark text-slate-100' : 'text-slate-900'}`}>
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-slate-900 dark:bg-slate-950 transition-all duration-300 flex flex-col z-20 shadow-2xl border-r border-slate-800`}>
        <div className="p-4 flex items-center border-b border-slate-800">
          <div className="flex items-center w-full overflow-hidden">
            <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-900/20">
              <LogoG className="text-white w-6 h-6" />
            </div>
            {isSidebarOpen && (
              <div className="ml-3 flex flex-col leading-tight animate-fadeIn">
                <span className="text-white font-black text-base tracking-tighter uppercase">
                  Gestresto<span className="text-purple-500">Pro</span>
                </span>
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">
                  MYA D'OR FAST-FOOD
                </span>
              </div>
            )}
          </div>
          {isSidebarOpen && (
            <button onClick={() => setSidebarOpen(false)} className="text-slate-500 hover:text-white transition-colors ml-auto">
              <Menu size={18} />
            </button>
          )}
        </div>
        
        {!isSidebarOpen && (
          <div className="p-4 flex justify-center border-b border-slate-800">
            <button onClick={() => setSidebarOpen(true)} className="text-slate-500 hover:text-white transition-colors">
              <Menu size={20} />
            </button>
          </div>
        )}

        <nav className="flex-1 mt-4 px-2 space-y-1 overflow-y-auto scrollbar-hide">
          {filteredNavItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id as ViewType)}
              className={`w-full flex items-center p-3 rounded-lg transition-all ${
                activeView === item.id 
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/40' 
                  : 'text-slate-400 hover:bg-slate-800 dark:hover:bg-slate-900 hover:text-white'
              }`}
            >
              <item.icon size={20} className="flex-shrink-0" />
              {isSidebarOpen && <span className="ml-3 font-medium whitespace-nowrap">{item.label}</span>}
            </button>
          ))}
        </nav>

        {currentSession && isSidebarOpen && (
          <div className="mx-4 mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
             <div className="flex items-center justify-between mb-1">
               <span className="text-[10px] font-black text-emerald-500 uppercase">Session active</span>
               <Unlock size={10} className="text-emerald-500" />
             </div>
             <p className="text-xs font-bold text-slate-300">{currentSession.expectedBalance.toLocaleString()} {config.currency}</p>
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
              <input type="text" placeholder="Rechercher partout..." className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-full text-sm focus:ring-2 focus:ring-purple-500 dark:text-slate-100 transition-colors" />
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className={`flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${isOnline ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' : 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400'}`}>
               {isOnline ? <Wifi size={12} className="mr-1.5" /> : <WifiOff size={12} className="mr-1.5" />}
               {isOnline ? 'Synchro OK' : 'Hors-ligne'}
            </div>

            <div className="hidden lg:flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
              <button onClick={() => setUserRole('admin')} className={`px-3 py-1 rounded-md text-xs font-bold transition-all flex items-center ${userRole === 'admin' ? 'bg-white dark:bg-slate-700 shadow-sm text-purple-600 dark:text-purple-400' : 'text-slate-500'}`}><ShieldCheck size={14} className="mr-1.5" /> Admin</button>
              <button onClick={() => setUserRole('manager')} className={`px-3 py-1 rounded-md text-xs font-bold transition-all flex items-center ${userRole === 'manager' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-slate-500'}`}><Key size={14} className="mr-1.5" /> Manager</button>
              <button onClick={() => setUserRole('cashier')} className={`px-3 py-1 rounded-md text-xs font-bold transition-all flex items-center ${userRole === 'cashier' ? 'bg-white dark:bg-slate-700 shadow-sm text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}`}><UserCircle size={14} className="mr-1.5" /> Caissier</button>
            </div>
            <button onClick={() => setDarkMode(!darkMode)} className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all">{darkMode ? <Sun size={20} /> : <Moon size={20} />}</button>
            <div className="flex items-center space-x-2 pl-4 border-l border-slate-200 dark:border-slate-700">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 dark:from-slate-800 dark:to-slate-950 flex items-center justify-center text-white text-xs font-bold border-2 border-white dark:border-slate-800 shadow-md">
                {userRole === 'admin' ? 'BN' : userRole === 'cashier' ? 'CS' : 'MN'}
              </div>
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-hidden p-4 sm:p-6 relative">{renderContent()}</div>
        {showAI && userRole === 'admin' && <AIAssistant onClose={() => setShowAI(false)} context={{ leads, products, tasks, sales, employees, config, attendance }} />}
      </main>
    </div>
  );
};

export default App;
