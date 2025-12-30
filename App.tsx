
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  LayoutDashboard, ShoppingCart, Package, BarChart3, Monitor, Settings as SettingsIcon, Sun, Moon, IdCard, LogOut, Clock as ClockIcon, FileText, Menu, CheckCircle, Info, AlertCircle, Calendar, Search, ArrowRight, User as UserIcon
} from 'lucide-react';
import { ViewType, Product, SaleOrder, Employee, ERPConfig, AttendanceRecord, RolePermission, User, CashSession } from './types';
import { INITIAL_PRODUCTS, INITIAL_EMPLOYEES, INITIAL_CONFIG, APP_USERS } from './constants';
import Dashboard from './components/Dashboard';
import Invoicing from './components/Invoicing';
import Sales from './components/Sales';
import Inventory from './components/Inventory';
import Reports from './components/Reports';
import POS from './components/POS';
import Settings from './components/Settings';
import HR from './components/HR';
import Attendances from './components/Attendances';

// Composant Logo stylisé agrandi
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
}

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewType>('pos');
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isLocked, setIsLocked] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [globalSearch, setGlobalSearch] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  // Mise à jour de l'heure
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fermer la recherche au clic à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
    { role: 'admin', allowedViews: ['dashboard', 'pos', 'invoicing', 'sales', 'inventory', 'reports', 'hr', 'attendances', 'settings', 'logout', 'switch_account', 'manage_categories'] },
    { role: 'cashier', allowedViews: ['pos', 'sales', 'attendances', 'logout'] },
    { role: 'manager', allowedViews: ['dashboard', 'pos', 'sales', 'inventory', 'reports', 'hr', 'attendances', 'logout', 'switch_account', 'manage_categories'] }
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
  useEffect(() => { localStorage.setItem('attendance', JSON.stringify(attendance)); }, [attendance]);
  useEffect(() => { localStorage.setItem('currentSession', JSON.stringify(currentSession)); }, [currentSession]);
  useEffect(() => { localStorage.setItem('rolePermissions', JSON.stringify(rolePermissions)); }, [rolePermissions]);

  const handleAddSale = (newSaleData: Partial<SaleOrder>) => {
    const saleItems = newSaleData.items || [];
    const isRefund = newSaleData.status === 'refunded';
    
    // Mettre à jour le stock
    const updatedProducts = products.map(p => {
      const itemInSale = saleItems.find(item => item.productId === p.id);
      if (itemInSale) {
        // Si c'est un remboursement, le stock revient (+)
        // Si c'est une vente, le stock diminue (-)
        const stockChange = isRefund ? itemInSale.quantity : -itemInSale.quantity;
        const newStock = p.stock + stockChange;
        
        // Alerte si stock bas (uniquement sur vente)
        if (!isRefund && newStock <= (p.lowStockThreshold || 10)) {
          notifyUser("Alerte Stock Bas", `${p.name} ne possède plus que ${newStock} unités !`, "warning");
        }
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

    if (currentSession && currentSession.status === 'open') {
      // Ajuster le solde attendu
      // Si remboursement : diminue le solde
      // Si vente : augmente le solde
      const balanceChange = isRefund ? -(sale.total) : (sale.total);
      setCurrentSession({
        ...currentSession,
        expectedBalance: currentSession.expectedBalance + balanceChange
      });
    }

    const typeMsg = isRefund ? "Remboursement Effectué" : "Vente Encaissée";
    const amountMsg = `${sale.total} ${config.currency} ${isRefund ? 'remboursés' : 'reçus'}.`;
    notifyUser(typeMsg, amountMsg, isRefund ? 'warning' : 'success');
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
    notifyUser("Session Ouverte", `Service démarré par ${newSession.cashierName}`, "success");
  };

  const handleCloseSession = (closingBalance: number) => {
    if (!currentSession) return;
    
    const difference = closingBalance - currentSession.expectedBalance;
    const msg = difference === 0 ? "Caisse équilibrée." : `Écart de caisse : ${difference} ${config.currency}`;
    
    notifyUser("Session Clôturée", msg, difference === 0 ? "success" : "warning");
    setCurrentSession(null);
  };

  const userPermissions = useMemo(() => {
    return rolePermissions.find(p => p.role === currentUser.role)?.allowedViews || [];
  }, [rolePermissions, currentUser.role]);

  // Logique de recherche globale
  const searchResults = useMemo(() => {
    if (!globalSearch || globalSearch.length < 2) return null;

    const term = globalSearch.toLowerCase();
    
    const matchedProducts = products.filter(p => 
      p.name.toLowerCase().includes(term) || p.sku.toLowerCase().includes(term)
    ).slice(0, 4);

    const matchedSales = sales.filter(s => 
      s.customer.toLowerCase().includes(term) || s.id.toLowerCase().includes(term)
    ).slice(0, 4);

    const matchedEmployees = employees.filter(e => 
      e.name.toLowerCase().includes(term) || e.role.toLowerCase().includes(term)
    ).slice(0, 4);

    const hasResults = matchedProducts.length > 0 || matchedSales.length > 0 || matchedEmployees.length > 0;
    
    if (!hasResults) return null;

    return { products: matchedProducts, sales: matchedSales, employees: matchedEmployees };
  }, [globalSearch, products, sales, employees]);

  const handleSearchResultClick = (view: ViewType) => {
    if (userPermissions.includes(view)) {
      setActiveView(view);
      setGlobalSearch('');
      setShowSearchResults(false);
    } else {
      notifyUser("Accès Refusé", "Vous n'avez pas les droits pour accéder à ce module.", "warning");
    }
  };

  if (isLocked) {
    return (
      <div className={`h-screen w-full flex flex-col items-center justify-center bg-slate-900 theme-${config.theme}`}>
        <div className="mb-12 text-center">
          <AppLogo className="w-32 h-32 mx-auto mb-6 scale-150" iconOnly />
          <h1 className="text-4xl font-black text-white uppercase tracking-tighter mt-16">SamaCaisse <span className="text-purple-600">Pro</span></h1>
          <p className="text-slate-400 font-bold uppercase tracking-widest mt-4 text-[10px] opacity-60">Gestion de point de vente & ERP</p>
          <div className="mt-8 text-white/40 font-mono text-xl">
            {currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {APP_USERS.map((user) => (
            <button key={user.id} onClick={() => { setCurrentUser(user); setIsLocked(false); }} className="bg-slate-800 p-6 rounded-3xl border border-slate-700 hover:border-purple-500 transition-all flex flex-col items-center space-y-4 w-40 hover:scale-105">
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
      case 'dashboard': return <Dashboard leads={[]} sales={sales} userRole={currentUser.role} config={config} products={products} />;
      case 'pos': return (
        <POS 
          products={products} 
          sales={sales}
          onSaleComplete={handleAddSale} 
          config={config} 
          session={currentSession} 
          onOpenSession={handleOpenSession} 
          onCloseSession={handleCloseSession} 
          {...commonProps} 
        />
      );
      case 'sales': return <Sales sales={sales} onUpdate={setSales} config={config} products={products} userRole={currentUser.role} onAddSale={handleAddSale} {...commonProps} />;
      case 'inventory': return <Inventory products={products} onUpdate={setProducts} config={config} userRole={currentUser.role} />;
      case 'hr': return <HR employees={employees} onUpdate={setEmployees} attendance={attendance} onUpdateAttendance={setAttendance} config={config} userRole={currentUser.role} {...commonProps} />;
      case 'attendances': return <Attendances employees={employees} onUpdateEmployees={setEmployees} attendance={attendance} onUpdateAttendance={setAttendance} currentUser={currentUser} notify={notifyUser} />;
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

      <aside className={`${isSidebarOpen ? 'w-72' : 'w-24'} bg-slate-900 transition-all duration-500 flex flex-col z-20 shadow-2xl`}>
        <div className="p-6 h-28 flex items-center justify-between border-b border-slate-800">
          <AppLogo className={isSidebarOpen ? "w-full" : "w-12 h-12"} iconOnly={!isSidebarOpen} />
          <button 
            onClick={() => setSidebarOpen(!isSidebarOpen)} 
            className="text-slate-400 hover:text-white ml-2 p-2 hover:bg-slate-800 rounded-xl transition-colors"
          >
            <Menu size={20}/>
          </button>
        </div>
        <nav className="flex-1 mt-6 space-y-1.5 px-3 overflow-y-auto scrollbar-hide">
          {[
            { id: 'dashboard', icon: LayoutDashboard, label: 'Bilan' },
            { id: 'pos', icon: Monitor, label: 'Caisse POS' },
            { id: 'sales', icon: ShoppingCart, label: 'Ventes' },
            { id: 'invoicing', icon: FileText, label: 'Facturation' },
            { id: 'inventory', icon: Package, label: 'Inventaire' },
            { id: 'reports', icon: BarChart3, label: 'Analyses' },
            { id: 'attendances', icon: ClockIcon, label: 'Pointages' },
            { id: 'hr', icon: IdCard, label: 'RH' },
            { id: 'settings', icon: SettingsIcon, label: 'Paramètres' },
          ].filter(item => userPermissions.includes(item.id as ViewType)).map((item) => (
            <button key={item.id} onClick={() => setActiveView(item.id as ViewType)} className={`w-full flex items-center p-3.5 rounded-2xl transition-all duration-200 ${activeView === item.id ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
              <item.icon size={22} />
              {isSidebarOpen && <span className="ml-4 font-bold text-sm tracking-tight">{item.label}</span>}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
           <button onClick={() => setIsLocked(true)} className="w-full flex items-center p-3.5 rounded-2xl text-rose-400 hover:bg-rose-500/10 transition-all font-bold text-sm">
             <LogOut size={22} />
             {isSidebarOpen && <span className="ml-4">Quitter</span>}
           </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950">
        <header className="h-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-8 z-[100] shrink-0">
          <div className="flex items-center space-x-6 flex-1 min-w-0">
            <div className="hidden lg:flex flex-col shrink-0">
               <span className="text-sm font-black uppercase text-slate-800 dark:text-white tracking-widest leading-none">{config.companyName}</span>
               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-1">Terminal Actif</span>
            </div>
            
            {/* GLOBAL SEARCH */}
            <div className="relative flex-1 max-w-md mx-4" ref={searchRef}>
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-purple-600 transition-colors" size={18} />
                <input 
                  type="text" 
                  placeholder="Recherche globale (Clients, Plats, Staff...)" 
                  value={globalSearch}
                  onChange={(e) => {
                    setGlobalSearch(e.target.value);
                    setShowSearchResults(true);
                  }}
                  onFocus={() => setShowSearchResults(true)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-100 dark:bg-slate-800/50 border-2 border-transparent focus:border-purple-600/30 rounded-2xl outline-none text-sm font-bold transition-all placeholder:text-slate-400 dark:text-white"
                />
              </div>

              {/* SEARCH RESULTS DROPDOWN */}
              {showSearchResults && searchResults && (
                <div className="absolute top-full left-0 w-full mt-3 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-scaleIn z-[110]">
                  <div className="p-2 space-y-1 max-h-[70vh] overflow-y-auto scrollbar-hide">
                    
                    {searchResults.products.length > 0 && (
                      <div className="p-2">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">Produits / Menu</p>
                        {searchResults.products.map(p => (
                          <button key={p.id} onClick={() => handleSearchResultClick('inventory')} className="w-full flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-all text-left group">
                            <div className="flex items-center space-x-3">
                              <div className="p-2 bg-purple-50 dark:bg-purple-900/20 text-purple-600 rounded-xl group-hover:scale-110 transition-transform"><Package size={16}/></div>
                              <div>
                                <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{p.name}</p>
                                <p className="text-[10px] text-slate-400">{p.category}</p>
                              </div>
                            </div>
                            <span className="text-xs font-black text-purple-600">{p.price} {config.currency}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {searchResults.sales.length > 0 && (
                      <div className="p-2 border-t border-slate-100 dark:border-slate-800">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">Commandes / Factures</p>
                        {searchResults.sales.map(s => (
                          <button key={s.id} onClick={() => handleSearchResultClick('sales')} className="w-full flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-all text-left group">
                            <div className="flex items-center space-x-3">
                              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-xl group-hover:scale-110 transition-transform"><ShoppingCart size={16}/></div>
                              <div>
                                <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{s.customer}</p>
                                <p className="text-[10px] text-slate-400 font-mono">Ref: #{s.id.slice(-6)}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-black text-slate-900 dark:text-white">{s.total} {config.currency}</p>
                              <p className="text-[9px] font-bold text-slate-400 uppercase">{s.status}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {searchResults.employees.length > 0 && (
                      <div className="p-2 border-t border-slate-100 dark:border-slate-800">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">Équipe / Staff</p>
                        {searchResults.employees.map(e => (
                          <button key={e.id} onClick={() => handleSearchResultClick('hr')} className="w-full flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-all text-left group">
                            <div className="flex items-center space-x-3">
                              <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-xl group-hover:scale-110 transition-transform"><UserIcon size={16}/></div>
                              <div>
                                <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{e.name}</p>
                                <p className="text-[10px] text-slate-400">{e.role}</p>
                              </div>
                            </div>
                            <div className="flex items-center text-emerald-500 font-black text-[10px] uppercase">
                              Voir fiche <ArrowRight size={12} className="ml-1" />
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* HORLOGE MODERNE TYPE STATUS BAR */}
            <div className="hidden xl:flex items-center bg-slate-900 dark:bg-slate-950 px-5 py-2 rounded-2xl border border-white/10 shadow-xl ml-4">
              <div className="flex items-center text-slate-400 mr-4">
                <div className="w-2 h-2 bg-emerald-500 rounded-full mr-3 animate-pulse shadow-[0_0_10px_#10b981]"></div>
                <span className="text-[11px] font-black uppercase tracking-[0.15em] whitespace-nowrap">
                  {currentTime.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                </span>
              </div>
              <div className="w-px h-3 bg-slate-700 mx-1"></div>
              <div className="flex items-center text-white font-mono font-black text-base tabular-nums ml-4">
                {currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                <span className="text-[10px] text-slate-500 ml-1.5 opacity-70">
                  :{currentTime.toLocaleTimeString('fr-FR', { second: '2-digit' })}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-6 shrink-0">
            <button onClick={() => setDarkMode(!darkMode)} className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-purple-600 rounded-xl transition-all">
              {darkMode ? <Sun size={20}/> : <Moon size={20}/>}
            </button>
            <div className="flex items-center space-x-4 pl-4 border-l border-slate-200 dark:border-slate-700">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-black dark:text-white">{currentUser.name}</p>
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">{currentUser.role}</p>
              </div>
              <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${currentUser.color} flex items-center justify-center text-white font-black shadow-lg border border-white/10 transition-transform hover:scale-105 cursor-pointer`}>{currentUser.initials}</div>
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-4 sm:p-8 scrollbar-hide">{renderContent()}</div>
      </main>
    </div>
  );
};

export default App;
