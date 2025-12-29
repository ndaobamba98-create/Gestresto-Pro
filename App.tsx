
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  LayoutDashboard, ShoppingCart, Package, BarChart3, Bot, Search, Menu, Monitor, Settings as SettingsIcon, Sun, Moon, IdCard, Lock, Bell, X, CheckCircle, Info, AlertCircle, LogOut, ChevronDown, Palette, Clock, ShoppingBag, FileText
} from 'lucide-react';
import { ViewType, Lead, Product, SaleOrder, Employee, UserRole, ERPConfig, AttendanceRecord, CashSession, RolePermission, User, AppTheme } from './types';
import { INITIAL_PRODUCTS, INITIAL_EMPLOYEES, INITIAL_CONFIG, APP_USERS } from './constants';
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

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewType>('pos');
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [showAI, setShowAI] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showThemeDropdown, setShowThemeDropdown] = useState(false);
  const [isLocked, setIsLocked] = useState(true);
  
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
  const [config, setConfig] = useState<ERPConfig>(() => loadStored('config', INITIAL_CONFIG));
  const [products, setProducts] = useState<Product[]>(() => loadStored('products', INITIAL_PRODUCTS));
  const [sales, setSales] = useState<SaleOrder[]>(() => loadStored('sales', []));
  const [employees, setEmployees] = useState<Employee[]>(() => loadStored('employees', INITIAL_EMPLOYEES));
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => loadStored('attendance', []));
  const [currentSession, setCurrentSession] = useState<CashSession | null>(() => loadStored('currentSession', null));
  
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>(() => loadStored('rolePermissions', [
    { role: 'admin', allowedViews: ['dashboard', 'pos', 'invoicing', 'sales', 'inventory', 'reports', 'hr', 'settings', 'logout', 'switch_account', 'manage_categories'] },
    { role: 'cashier', allowedViews: ['pos', 'sales', 'logout'] },
    { role: 'manager', allowedViews: ['dashboard', 'pos', 'sales', 'inventory', 'reports', 'hr', 'logout', 'switch_account', 'manage_categories'] }
  ]));

  const notifyUser = useCallback((title: string, message: string, type: 'success' | 'info' | 'warning' = 'info') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, type, title, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  }, []);

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);

  useEffect(() => { localStorage.setItem('currentUser', JSON.stringify(currentUser)); }, [currentUser]);
  useEffect(() => { localStorage.setItem('config', JSON.stringify(config)); }, [config]);
  useEffect(() => { localStorage.setItem('products', JSON.stringify(products)); }, [products]);
  useEffect(() => { localStorage.setItem('sales', JSON.stringify(sales)); }, [sales]);
  useEffect(() => { localStorage.setItem('employees', JSON.stringify(employees)); }, [employees]);
  useEffect(() => { localStorage.setItem('currentSession', JSON.stringify(currentSession)); }, [currentSession]);
  useEffect(() => { localStorage.setItem('rolePermissions', JSON.stringify(rolePermissions)); }, [rolePermissions]);

  const handleAddSale = (newSaleData: Partial<SaleOrder>) => {
    const sale: SaleOrder = {
      id: `S-${Date.now()}`,
      customer: newSaleData.customer || 'Client',
      date: new Date().toLocaleString(),
      total: newSaleData.total || 0,
      status: 'confirmed',
      items: newSaleData.items || [],
      paymentMethod: newSaleData.paymentMethod || 'Especes',
      invoiceStatus: 'paid'
    };

    setSales(prev => [sale, ...prev]);
    if (currentSession) {
      setCurrentSession({ ...currentSession, expectedBalance: currentSession.expectedBalance + sale.total });
    }
    notifyUser("Vente Encaissée", `${sale.total} ${config.currency} reçus.`, 'success');
  };

  const handleOpenSession = (openingBalance: number, cashierId: string) => {
    const cashier = APP_USERS.find(u => u.id === cashierId) || currentUser;
    setCurrentSession({
      id: `SESS-${Date.now()}`,
      openedAt: new Date().toLocaleString(),
      openingBalance,
      expectedBalance: openingBalance,
      status: 'open',
      cashierName: cashier.name,
      cashierId: cashier.id
    });
    notifyUser("Caisse Ouverte", `Service démarré par ${cashier.name}`, 'success');
  };

  const handleCloseSession = (closingBalance: number) => {
    if (!currentSession) return;
    setCurrentSession({ ...currentSession, closedAt: new Date().toLocaleString(), closingBalance, status: 'closed' });
    notifyUser("Caisse Fermée", "Session terminée.", 'warning');
    setTimeout(() => setCurrentSession(null), 2000);
  };

  const userPermissions = useMemo(() => {
    return rolePermissions.find(p => p.role === currentUser.role)?.allowedViews || [];
  }, [rolePermissions, currentUser.role]);

  if (isLocked) {
    return (
      <div className={`h-screen w-full flex flex-col items-center justify-center bg-slate-900 theme-${config.theme}`}>
        <div className="mb-12 text-center">
          <div className="w-20 h-20 bg-purple-600 rounded-2xl flex items-center justify-center shadow-2xl mx-auto mb-6">
            <Monitor className="text-white w-10 h-10" />
          </div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Gestresto<span className="text-purple-600">Pro</span></h1>
          <p className="text-slate-400 font-bold uppercase tracking-widest mt-2 text-[10px]">Choisissez votre profil</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {APP_USERS.map((user) => (
            <button key={user.id} onClick={() => { setCurrentUser(user); setIsLocked(false); }} className="bg-slate-800 p-6 rounded-3xl border border-slate-700 hover:border-purple-500 transition-all flex flex-col items-center space-y-4 w-40">
              <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${user.color} flex items-center justify-center text-white text-xl font-black shadow-lg`}>{user.initials}</div>
              <div className="text-center">
                <p className="text-white font-black uppercase text-xs">{user.name}</p>
                <p className="text-slate-500 font-bold uppercase text-[8px] tracking-widest">{user.role}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const renderContent = () => {
    const commonProps = { notify: notifyUser, userPermissions };
    switch (activeView) {
      case 'dashboard': return <Dashboard leads={[]} sales={sales} userRole={currentUser.role} config={config} />;
      case 'pos': return <POS products={products} onSaleComplete={handleAddSale} config={config} session={currentSession} onOpenSession={handleOpenSession} onCloseSession={handleCloseSession} {...commonProps} />;
      case 'sales': return <Sales sales={sales} onUpdate={setSales} config={config} products={products} userRole={currentUser.role} onAddSale={handleAddSale} {...commonProps} />;
      case 'inventory': return <Inventory products={products} onUpdate={setProducts} config={config} userRole={currentUser.role} />;
      case 'hr': return <HR employees={employees} onUpdate={setEmployees} attendance={attendance} onUpdateAttendance={setAttendance} config={config} userRole={currentUser.role} {...commonProps} />;
      case 'settings': return <Settings products={products} onUpdateProducts={setProducts} config={config} onUpdateConfig={setConfig} rolePermissions={rolePermissions} onUpdatePermissions={setRolePermissions} {...commonProps} />;
      case 'invoicing': return <Invoicing sales={sales} config={config} onUpdate={setSales} products={products} userRole={currentUser.role} onAddSale={handleAddSale} {...commonProps} />;
      case 'reports': return <Reports sales={sales} config={config} products={products} />;
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
            <div className="mt-1">{toast.type === 'success' ? <CheckCircle size={18} /> : toast.type === 'warning' ? <AlertCircle size={18} /> : <Info size={18} />}</div>
            <div className="flex-1">
              <h4 className="text-xs font-black uppercase">{toast.title}</h4>
              <p className="text-[10px] font-medium mt-1">{toast.message}</p>
            </div>
          </div>
        ))}
      </div>

      <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-slate-900 transition-all flex flex-col z-20 shadow-2xl`}>
        <div className="p-6 flex items-center justify-between border-b border-slate-800">
          {isSidebarOpen && <span className="text-white font-black text-xl uppercase tracking-tighter">Gestresto<span className="text-purple-600">Pro</span></span>}
          <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="text-slate-400 hover:text-white"><Menu size={20}/></button>
        </div>
        <nav className="flex-1 mt-6 space-y-1 px-2">
          {[
            { id: 'dashboard', icon: LayoutDashboard, label: 'Bilan' },
            { id: 'pos', icon: Monitor, label: 'Caisse POS' },
            { id: 'sales', icon: ShoppingCart, label: 'Ventes' },
            { id: 'invoicing', icon: FileText, label: 'Facturation' },
            { id: 'inventory', icon: Package, label: 'Inventaire' },
            { id: 'reports', icon: BarChart3, label: 'Analyses' },
            { id: 'hr', icon: IdCard, label: 'RH' },
            { id: 'settings', icon: SettingsIcon, label: 'Paramètres' },
          ].filter(item => userPermissions.includes(item.id as ViewType)).map((item) => (
            <button key={item.id} onClick={() => setActiveView(item.id as ViewType)} className={`w-full flex items-center p-3 rounded-xl transition-all ${activeView === item.id ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
              <item.icon size={20} />
              {isSidebarOpen && <span className="ml-4 font-bold text-sm">{item.label}</span>}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-800">
           <button onClick={() => setIsLocked(true)} className="w-full flex items-center p-3 rounded-xl text-rose-400 hover:bg-rose-500/10 transition-all">
             <LogOut size={20} />
             {isSidebarOpen && <span className="ml-4 font-bold text-sm">Quitter</span>}
           </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950">
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-8 z-10">
          <div className="text-sm font-black uppercase text-slate-800 dark:text-white tracking-widest">{config.companyName}</div>
          <div className="flex items-center space-x-6">
            {currentSession && (
              <div className="hidden md:flex items-center bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                <Clock size={12} className="mr-2" /> Session en cours
              </div>
            )}
            <button onClick={() => setDarkMode(!darkMode)} className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">{darkMode ? <Sun size={20}/> : <Moon size={20}/>}</button>
            <div className="flex items-center space-x-3">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-black dark:text-white">{currentUser.name}</p>
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">{currentUser.role}</p>
              </div>
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${currentUser.color} flex items-center justify-center text-white font-black shadow-md`}>{currentUser.initials}</div>
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-8">{renderContent()}</div>
      </main>
    </div>
  );
};

export default App;
