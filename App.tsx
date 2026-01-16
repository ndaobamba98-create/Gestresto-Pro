
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  LayoutDashboard, ShoppingCart, Package, BarChart3, Monitor, Settings as SettingsIcon, Sun, Moon, IdCard, LogOut, Clock as ClockIcon, FileText, Menu, CheckCircle, Info, AlertCircle, Search, ArrowRight, User as UserIcon, Wallet, Bell, X, Check, Trash2, BellOff, AlertTriangle, Inbox, CheckCheck, History, BellRing, Circle, Volume2, Loader2, Play, Filter, Users, Eye, EyeOff, ArrowLeft, Key, Calendar as CalendarIcon
} from 'lucide-react';
import { ViewType, Product, SaleOrder, Employee, ERPConfig, AttendanceRecord, RolePermission, User, CashSession, Expense, Purchase, Supplier, Customer } from './types';
import { INITIAL_PRODUCTS, INITIAL_EMPLOYEES, INITIAL_CONFIG, APP_USERS, INITIAL_EXPENSES, INITIAL_SUPPLIERS, INITIAL_CUSTOMERS } from './constants';
import { translations, TranslationKey } from './translations';
import { GoogleGenAI, Modality } from "@google/genai";
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
import Customers from './components/Customers';
import CalendarView from './components/CalendarView';

const decodeAudioData = async (data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> => {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
};

const decodeBase64 = (base64: string) => {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

export const AppLogo = ({ className = "w-14 h-14", iconOnly = false, light = false, customLogo = undefined }) => (
  <div className={`flex items-center ${iconOnly ? 'justify-center' : 'space-x-4'} ${className}`}>
    <div className="relative group shrink-0">
      <div className="absolute -inset-2 bg-accent rounded-2xl blur-lg opacity-20 group-hover:opacity-50 transition duration-1000"></div>
      <div className={`relative w-12 h-12 ${light ? 'bg-white' : 'bg-slate-900'} rounded-2xl flex items-center justify-center shadow-2xl border border-white/10 overflow-hidden transform group-hover:rotate-6 transition-transform duration-500`}>
        {customLogo ? (
          <img src={customLogo} alt="Logo" className="w-full h-full object-cover" />
        ) : (
          <svg viewBox="0 0 100 100" className="w-8/12 h-8/12" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M30 35C30 26.7157 36.7157 20 45 20H70V35H45C42.2386 35 40 37.2386 40 40C40 42.7614 42.2386 45 45 45H55C63.2843 45 70 51.7157 70 60C70 68.2843 63.2843 75 55 75H30V60H55C57.7614 60 60 57.7157 60 55C60 52.2386 57.7157 50 55 50H45C36.7157 50 30 43.2843 30 35Z" fill={light ? "#0f172a" : "white"} />
            <circle cx="20" cy="20" r="12" className="fill-accent" />
          </svg>
        )}
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
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [notifFilter, setNotifFilter] = useState<'all' | 'unread'>('unread');
  
  // Login State
  const [isLocked, setIsLocked] = useState(true);
  const [loginStep, setLoginStep] = useState<'select' | 'password'>('select');
  const [selectedLoginUser, setSelectedLoginUser] = useState<User | null>(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState(false);

  const [currentTime, setCurrentTime] = useState(new Date());
  const [darkMode, setDarkMode] = useState(() => loadStored('darkMode', false));
  const [isSpeaking, setIsSpeaking] = useState<string | null>(null);

  const [allUsers, setAllUsers] = useState<User[]>(() => loadStored('allUsers', APP_USERS));
  const [currentUser, setCurrentUser] = useState<User>(() => loadStored('currentUser', allUsers[0]));
  const [config, setConfig] = useState<ERPConfig>(() => loadStored('config', { ...INITIAL_CONFIG, language: 'fr' }));
  const [products, setProducts] = useState<Product[]>(() => loadStored('products', INITIAL_PRODUCTS));
  const [customers, setCustomers] = useState<Customer[]>(() => loadStored('customers', INITIAL_CUSTOMERS));
  const [sales, setSales] = useState<SaleOrder[]>(() => loadStored('sales', []));
  const [expenses, setExpenses] = useState<Expense[]>(() => loadStored('expenses', INITIAL_EXPENSES));
  const [purchases, setPurchases] = useState<Purchase[]>(() => loadStored('purchases', []));
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => loadStored('suppliers', INITIAL_SUPPLIERS));
  const [employees, setEmployees] = useState<Employee[]>(() => loadStored('employees', INITIAL_EMPLOYEES));
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => loadStored('attendance', []));
  const [currentSession, setCurrentSession] = useState<CashSession | null>(() => loadStored('currentSession', null));
  const [sessionHistory, setSessionHistory] = useState<CashSession[]>(() => loadStored('sessionHistory', []));
  
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>(() => loadStored('rolePermissions', [
    { role: 'admin', allowedViews: ['dashboard', 'pos', 'invoicing', 'sales', 'inventory', 'expenses', 'reports', 'hr', 'manage_hr', 'attendances', 'settings', 'logout', 'switch_account', 'manage_categories', 'manage_security', 'manage_inventory', 'manage_invoicing', 'manage_notifications', 'manage_sales', 'customers', 'manage_customers', 'manage_users', 'calendar'] },
    { role: 'cashier', allowedViews: ['pos', 'attendances', 'logout', 'customers', 'calendar'] },
    { role: 'manager', allowedViews: ['dashboard', 'pos', 'sales', 'inventory', 'expenses', 'reports', 'hr', 'manage_hr', 'attendances', 'logout', 'switch_account', 'manage_categories', 'manage_security', 'manage_inventory', 'manage_invoicing', 'manage_notifications', 'manage_sales', 'customers', 'manage_customers', 'calendar'] }
  ]));

  const userPermissions = useMemo(() => {
    return rolePermissions.find(p => p.role === currentUser.role)?.allowedViews || [];
  }, [currentUser, rolePermissions]);

  const unreadNotificationsCount = useMemo(() => 
    notificationHistory.filter(n => !n.isRead).length
  , [notificationHistory]);

  const displayedNotifications = useMemo(() => {
    if (notifFilter === 'unread') return notificationHistory.filter(n => !n.isRead);
    return notificationHistory;
  }, [notificationHistory, notifFilter]);

  const canManageNotifications = useMemo(() => 
    userPermissions.includes('manage_notifications') || currentUser.role === 'admin'
  , [userPermissions, currentUser.role]);

  // Persistance
  useEffect(() => { localStorage.setItem('notificationHistory', JSON.stringify(notificationHistory)); }, [notificationHistory]);
  useEffect(() => { localStorage.setItem('customers', JSON.stringify(customers)); }, [customers]);
  useEffect(() => { localStorage.setItem('currentUser', JSON.stringify(currentUser)); }, [currentUser]);
  useEffect(() => { localStorage.setItem('allUsers', JSON.stringify(allUsers)); }, [allUsers]);
  useEffect(() => { localStorage.setItem('config', JSON.stringify(config)); }, [config]);
  useEffect(() => { localStorage.setItem('products', JSON.stringify(products)); }, [products]);
  useEffect(() => { localStorage.setItem('sales', JSON.stringify(sales)); }, [sales]);
  useEffect(() => { localStorage.setItem('expenses', JSON.stringify(expenses)); }, [expenses]);
  useEffect(() => { localStorage.setItem('purchases', JSON.stringify(purchases)); }, [purchases]);
  useEffect(() => { localStorage.setItem('suppliers', JSON.stringify(suppliers)); }, [suppliers]);
  useEffect(() => { localStorage.setItem('employees', JSON.stringify(employees)); }, [employees]);
  useEffect(() => { localStorage.setItem('attendance', JSON.stringify(attendance)); }, [attendance]);
  useEffect(() => { localStorage.setItem('currentSession', JSON.stringify(currentSession)); }, [currentSession]);
  useEffect(() => { localStorage.setItem('sessionHistory', JSON.stringify(sessionHistory)); }, [sessionHistory]);
  useEffect(() => { localStorage.setItem('rolePermissions', JSON.stringify(rolePermissions)); }, [rolePermissions]);

  const speakNotification = async (notification: Toast) => {
    if (isSpeaking) return;
    setIsSpeaking(notification.id);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Lis ce message de notification ERP de manière professionnelle et concise : ${notification.title}. ${notification.message}`;
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts[0]?.inlineData?.data;
      if (base64Audio) {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        const audioBuffer = await decodeAudioData(decodeBase64(base64Audio), audioCtx, 24000, 1);
        const source = audioCtx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioCtx.destination);
        source.onended = () => setIsSpeaking(null);
        source.start();
      }
    } catch (error) {
      console.error("Erreur TTS:", error);
      setIsSpeaking(null);
    }
  };

  const markNotificationAsRead = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setNotificationHistory(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const markAllNotificationsAsRead = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setNotificationHistory(prev => prev.map(n => ({ ...n, isRead: true })));
    notifyUser("Notifications", "Tout a été marqué comme lu.", "info");
  };

  const deleteAllNotifications = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (confirm("Vider l'historique complet ?")) {
      setNotificationHistory([]);
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
      return updated;
    });

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  }, []);

  const handleRefundSale = useCallback((saleId: string) => {
    const saleToRefund = sales.find(s => s.id === saleId);
    if (!saleToRefund || saleToRefund.status === 'refunded') return;

    setProducts(prevProds => prevProds.map(p => {
      const item = saleToRefund.items?.find(i => i.productId === p.id);
      if (item) return { ...p, stock: p.stock + item.quantity };
      return p;
    }));

    if (saleToRefund.paymentMethod === 'Compte' && saleToRefund.customerId) {
      setCustomers(prev => prev.map(c => 
        c.id === saleToRefund.customerId ? { ...c, balance: c.balance + saleToRefund.total } : c
      ));
    }

    setSales(prevSales => prevSales.map(s => 
      s.id === saleId ? { ...s, status: 'refunded', invoiceStatus: 'refunded' } : s
    ));

    notifyUser("Vente Annulée", `La commande #${saleId.slice(-6)} a été annulée.`, "warning");
  }, [sales, notifyUser]);

  const handleAddSale = (newSaleData: Partial<SaleOrder>) => {
    const saleItems = newSaleData.items || [];
    const isRefund = newSaleData.status === 'refunded';
    const isAccountOrder = newSaleData.paymentMethod === 'Compte';
    const generatedReference = `${config.invoicePrefix || 'FAC/'}${config.nextInvoiceNumber.toString().padStart(4, '0')}`;

    setProducts(prev => prev.map(p => {
      const item = saleItems.find(i => i.productId === p.id);
      if (item) {
        const newStock = Math.max(0, p.stock + (isRefund ? item.quantity : -item.quantity));
        if (!isRefund && newStock <= (p.lowStockThreshold || 10)) {
          notifyUser("Alerte Stock", `${p.name} est presque épuisé !`, "warning");
        }
        return { ...p, stock: newStock };
      }
      return p;
    }));

    if (isAccountOrder && newSaleData.customerId) {
      setCustomers(prev => prev.map(c => 
        c.id === newSaleData.customerId ? { ...c, balance: c.balance - (newSaleData.total || 0) } : c
      ));
    }

    const sale: SaleOrder = {
      id: generatedReference,
      customer: newSaleData.customer || 'Client Comptoir',
      customerId: newSaleData.customerId,
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
    
    const notifMsg = isRefund 
      ? `Avoir de ${sale.total} ${config.currency} généré.` 
      : isAccountOrder 
        ? `Vente de ${sale.total} ${config.currency} mise sur le compte de ${sale.customer}.`
        : `Vente de ${sale.total} ${config.currency} encaissée pour ${sale.customer}.`;
      
    notifyUser(isRefund ? "Avoir Validé" : "Vente Validée", notifMsg, isRefund ? 'warning' : 'success');
  };

  const handleOpenSession = useCallback((openingBalance: number, cashierId: string) => {
    const user = allUsers.find(u => u.id === cashierId);
    if (!user) return;
    
    const newSession: CashSession = {
      id: `S-${Date.now()}`,
      openedAt: new Date().toISOString(),
      openingBalance: openingBalance,
      expectedBalance: openingBalance,
      totalCashSales: 0,
      status: 'open',
      cashierName: user.name,
      cashierId: user.id
    };
    setCurrentSession(newSession);
    notifyUser("Session Ouverte", `Caisse initialisée avec ${openingBalance} ${config.currency}.`, "success");
  }, [config.currency, notifyUser, allUsers]);

  const handleCloseSession = useCallback((closingBalance: number) => {
    if (!currentSession) return;
    
    // Calcul précis du montant attendu réel au moment du clic sur 'Valider'
    const cashSalesInSession = sales
      .filter(s => s.date >= currentSession.openedAt && s.paymentMethod === 'Especes' && s.status !== 'refunded')
      .reduce((sum, s) => sum + s.total, 0);

    const actualExpectedBalance = currentSession.openingBalance + cashSalesInSession;
    const difference = closingBalance - actualExpectedBalance;
    
    const closedSession: CashSession = {
      ...currentSession,
      closedAt: new Date().toISOString(),
      expectedBalance: actualExpectedBalance,
      closingBalance,
      difference,
      totalCashSales: cashSalesInSession,
      status: 'closed'
    };

    setSessionHistory(prev => [closedSession, ...prev]);
    setCurrentSession(null);
    
    const statusType = difference === 0 ? 'success' : 'warning';
    const msg = difference === 0 
      ? `La caisse a été fermée avec succès.` 
      : `Caisse fermée. Écart de ${difference} ${config.currency} constaté.`;
    
    notifyUser("Session Clôturée", msg, statusType);
  }, [currentSession, sales, config.currency, notifyUser]);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoginUser) return;

    if (passwordInput === selectedLoginUser.password) {
      setCurrentUser(selectedLoginUser);
      setIsLocked(false);
      setPasswordInput('');
      setSelectedLoginUser(null);
      setLoginStep('select');
      setLoginError(false);
      notifyUser("Bienvenue", `Bonjour ${selectedLoginUser.name}, session ouverte.`, "success");
    } else {
      setLoginError(true);
      setTimeout(() => setLoginError(false), 500);
    }
  };

  const renderContent = () => {
    const commonProps = { notify: notifyUser, userPermissions, t };
    switch (activeView) {
      case 'dashboard': return <Dashboard leads={[]} sales={sales} expenses={expenses} userRole={currentUser.role} config={config} products={products} t={t} onNavigate={setActiveView} />;
      case 'pos': return (
        <POS 
          products={products} 
          customers={customers} 
          onUpdateCustomers={setCustomers} 
          sales={sales} 
          onSaleComplete={handleAddSale} 
          onRefundSale={handleRefundSale} 
          config={config} 
          session={currentSession} 
          onOpenSession={handleOpenSession} 
          onCloseSession={handleCloseSession} 
          {...commonProps} 
        />
      );
      case 'sales': return <Sales sales={sales} expenses={expenses} onUpdate={setSales} onRefundSale={handleRefundSale} config={config} products={products} userRole={currentUser.role} currentUser={currentUser} onAddSale={handleAddSale} {...commonProps} />;
      case 'inventory': return <Inventory products={products} onUpdate={setProducts} config={config} userRole={currentUser.role} t={t} userPermissions={userPermissions} />;
      case 'customers': return <Customers customers={customers} onUpdate={setCustomers} config={config} userRole={currentUser.role} t={t} userPermissions={userPermissions} notify={notifyUser} />;
      case 'expenses': return <Expenses expenses={expenses} setExpenses={setExpenses} purchases={purchases} onAddPurchase={p => setPurchases(v => [p, ...v])} onDeletePurchase={() => {}} suppliers={suppliers} setSuppliers={setSuppliers} products={products} config={config} userRole={currentUser.role} notify={notifyUser} t={t} />;
      case 'hr': return <HR employees={employees} onUpdate={setEmployees} attendance={attendance} onUpdateAttendance={setAttendance} config={config} {...commonProps} />;
      case 'attendances': return <Attendances employees={employees} onUpdateEmployees={setEmployees} attendance={attendance} onUpdateAttendance={setAttendance} currentUser={currentUser} notify={notifyUser} t={t} />;
      case 'calendar': return <CalendarView config={config} t={t} notify={notifyUser} />;
      case 'settings': return (
        <Settings 
          products={products} 
          onUpdateProducts={setProducts} 
          config={config} 
          onUpdateConfig={setConfig} 
          rolePermissions={rolePermissions} 
          onUpdatePermissions={setRolePermissions} 
          currentUser={currentUser}
          allUsers={allUsers}
          onUpdateUsers={setAllUsers}
          {...commonProps} 
        />
      );
      case 'invoicing': return <Invoicing sales={sales} config={config} onUpdate={setSales} products={products} userRole={currentUser.role} onAddSale={handleAddSale} {...commonProps} />;
      case 'reports': return <Reports sales={sales} expenses={expenses} config={config} products={products} t={t} notify={notifyUser} sessions={sessionHistory} />;
      default: return null;
    }
  };

  if (isLocked) {
    return (
      <div className={`h-screen w-full flex flex-col items-center justify-center bg-slate-950 theme-${config.theme}`}>
        <div className="mb-12 text-center animate-fadeIn">
          <AppLogo className="mx-auto mb-6 scale-[1.8]" iconOnly customLogo={config.companyLogo} />
          <h1 className="text-4xl font-black text-white uppercase mt-16 tracking-tighter">Sama Pos <span className="text-accent">+</span></h1>
          <div className="mt-8 text-accent font-mono text-3xl font-black tracking-tighter drop-shadow-[0_0_15px_var(--accent-glow)]">
            {currentTime.toLocaleTimeString()}
          </div>
        </div>

        {loginStep === 'select' ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 animate-slideUp">
            {allUsers.map((user) => (
              <button 
                key={user.id} 
                onClick={() => { setSelectedLoginUser(user); setLoginStep('password'); }} 
                className="bg-slate-900/50 backdrop-blur-md p-6 rounded-3xl border border-slate-800 hover:border-accent transition-all flex flex-col items-center space-y-4 w-40 hover:scale-105 group"
              >
                <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${user.color} flex items-center justify-center text-white text-xl font-black shadow-lg group-hover:scale-110 transition-transform`}>{user.initials}</div>
                <p className="text-white font-black uppercase text-[10px] tracking-widest">{user.name}</p>
              </button>
            ))}
          </div>
        ) : (
          <div className={`bg-slate-900/80 backdrop-blur-xl p-10 rounded-[3rem] border-2 border-white/10 w-full max-w-sm animate-scaleIn ${loginError ? 'animate-shake' : ''}`}>
             <button onClick={() => { setLoginStep('select'); setPasswordInput(''); setLoginError(false); }} className="mb-6 flex items-center text-slate-400 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest">
               <ArrowLeft size={16} className="mr-2" /> Retour
             </button>
             
             <div className="flex flex-col items-center mb-8">
               <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${selectedLoginUser?.color} flex items-center justify-center text-white text-2xl font-black shadow-2xl mb-4`}>
                 {selectedLoginUser?.initials}
               </div>
               <h2 className="text-white font-black uppercase tracking-tight text-xl">{selectedLoginUser?.name}</h2>
               <p className="text-accent font-black text-[10px] uppercase tracking-widest mt-1">{selectedLoginUser?.role}</p>
             </div>

             <form onSubmit={handleLoginSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mot de Passe</label>
                  <div className="relative">
                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input 
                      autoFocus
                      type={showPassword ? "text" : "password"}
                      value={passwordInput}
                      onChange={e => { setPasswordInput(e.target.value); setLoginError(false); }}
                      placeholder="••••••••"
                      className={`w-full bg-slate-800/50 border-2 ${loginError ? 'border-rose-500' : 'border-transparent focus:border-accent'} rounded-2xl py-4 pl-12 pr-12 text-white font-black outline-none transition-all`}
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <button type="submit" className="w-full py-4 bg-accent text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-accent/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                  Se Connecter
                </button>
             </form>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`flex h-screen overflow-hidden theme-${config.theme} ${darkMode ? 'dark text-slate-100' : 'text-slate-900'} ${config.language === 'ar' ? 'font-ar' : ''}`}>
      {isNotificationOpen && <div className="fixed inset-0 z-[110]" onClick={() => setIsNotificationOpen(false)} />}
      <aside className={`${isSidebarOpen ? 'w-72' : 'w-24'} bg-slate-900 transition-all duration-500 flex flex-col z-20 shadow-2xl`}>
        <div className="p-6 h-28 flex items-center justify-between border-b border-slate-800">
          <AppLogo className={isSidebarOpen ? "w-full" : "w-12 h-12"} iconOnly={!isSidebarOpen} customLogo={config.companyLogo} />
          <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="text-slate-400 hover:text-white p-2 hover:bg-slate-800 rounded-xl transition-colors"><Menu size={20}/></button>
        </div>
        <nav className="flex-1 mt-6 space-y-1.5 px-3 overflow-y-auto scrollbar-hide">
          {[
            { id: 'dashboard', icon: LayoutDashboard, label: t('dashboard') },
            { id: 'pos', icon: Monitor, label: t('pos') },
            { id: 'sales', icon: ShoppingCart, label: t('sales') },
            { id: 'invoicing', icon: FileText, label: t('invoicing') },
            { id: 'inventory', icon: Package, label: t('inventory') },
            { id: 'customers', icon: Users, label: 'Comptes Clients' },
            { id: 'expenses', icon: Wallet, label: t('expenses') },
            { id: 'reports', icon: BarChart3, label: t('reports') },
            { id: 'calendar', icon: CalendarIcon, label: 'Agenda' },
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
           <button onClick={() => { setIsLocked(true); setLoginStep('select'); setPasswordInput(''); }} className="w-full flex items-center p-3.5 rounded-2xl text-rose-400 hover:bg-rose-500/10 transition-all font-bold text-sm">
             <LogOut size={22} />
             {isSidebarOpen && <span className="ml-4">{t('logout')}</span>}
           </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950">
        <header className="h-24 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-8 z-[100]">
          <button 
            onClick={() => setIsCalendarOpen(true)}
            className="flex flex-col items-start group hover:bg-accent/5 p-2 rounded-2xl transition-all"
          >
            <span className="text-2xl font-black font-mono tracking-tighter leading-none text-accent transition-colors">
              {currentTime.toLocaleTimeString()}
            </span>
            <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1 flex items-center group-hover:text-accent transition-colors">
              <CalendarIcon size={10} className="mr-1" />
              {currentTime.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </span>
          </button>

          <div className="flex items-center space-x-4">
            <div className="relative">
               <button 
                 onClick={(e) => { e.stopPropagation(); setIsNotificationOpen(!isNotificationOpen); }}
                 className={`p-3 rounded-2xl transition-all relative z-[120] ${unreadNotificationsCount > 0 ? 'bg-accent/10 text-accent' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'}`}
               >
                 {unreadNotificationsCount > 0 ? <BellRing size={22} className="animate-bounce" /> : <Bell size={22} />}
                 {unreadNotificationsCount > 0 && <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[9px] font-black w-5 h-5 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center shadow-lg">{unreadNotificationsCount}</span>}
               </button>

               {isNotificationOpen && (
                 <div className="absolute right-0 mt-3 w-[420px] bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 z-[130] flex flex-col overflow-hidden animate-slideUp">
                    <div className="p-6 border-b dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                       <div className="flex items-center justify-between mb-4">
                          <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Centre de Notifications</h4>
                          <div className="flex items-center space-x-1">
                             <button 
                                onClick={(e) => markAllNotificationsAsRead(e)} 
                                disabled={unreadNotificationsCount === 0}
                                className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 ${unreadNotificationsCount > 0 ? 'bg-accent text-white shadow-lg cursor-pointer' : 'bg-slate-100 text-slate-300 opacity-50 cursor-not-allowed'}`}
                                title="Tout marquer comme lu"
                             >
                                <CheckCheck size={14} />
                                <span className="text-[8px] font-black uppercase">Tout lire</span>
                             </button>
                             {canManageNotifications && (
                               <button onClick={(e) => deleteAllNotifications(e)} className="p-2 text-slate-400 hover:text-rose-500 transition-all cursor-pointer" title="Vider l'historique">
                                 <Trash2 size={16} />
                               </button>
                             )}
                          </div>
                       </div>
                       
                       <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                          <button 
                             onClick={() => setNotifFilter('all')} 
                             className={`flex-1 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all cursor-pointer ${notifFilter === 'all' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-400'}`}
                          >
                             Toutes
                          </button>
                          <button 
                             onClick={() => setNotifFilter('unread')} 
                             className={`flex-1 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all cursor-pointer ${notifFilter === 'unread' ? 'bg-white dark:bg-slate-700 shadow-sm text-accent' : 'text-slate-400'}`}
                          >
                             Non lues ({unreadNotificationsCount})
                          </button>
                       </div>
                    </div>

                    <div className="flex-1 max-h-[400px] overflow-y-auto scrollbar-hide px-4 py-2">
                       {displayedNotifications.length > 0 ? displayedNotifications.map((notif) => (
                         <div key={notif.id} className="relative group mb-2">
                            <div 
                              onClick={(e) => { if(!notif.isRead) markNotificationAsRead(notif.id, e); }}
                              className={`w-full text-left p-4 rounded-2xl flex items-start space-x-4 transition-all relative overflow-hidden cursor-pointer ${notif.isRead ? 'opacity-50 bg-transparent border-transparent grayscale-[0.5]' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 shadow-sm ring-1 ring-slate-100 dark:ring-slate-700 hover:border-accent/30'}`}
                            >
                               {!notif.isRead && <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent"></div>}
                               <div className={`mt-1 p-2 rounded-xl shrink-0 ${notif.type === 'success' ? 'bg-emerald-500/10 text-emerald-500' : notif.type === 'warning' ? 'bg-orange-500/10 text-orange-500' : 'bg-blue-500/10 text-blue-500'}`}>
                                  {notif.type === 'success' ? <CheckCircle size={14}/> : notif.type === 'warning' ? <AlertCircle size={14}/> : <Info size={14}/>}
                               </div>
                               <div className="flex-1 min-w-0">
                                  <div className="flex justify-between items-start">
                                     <div className="flex items-center space-x-2 truncate">
                                        {!notif.isRead && <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse shrink-0"></div>}
                                        <h5 className={`text-[10px] font-black uppercase truncate pr-2 ${notif.isRead ? 'text-slate-400' : 'text-slate-900 dark:text-white'}`}>{notif.title}</h5>
                                     </div>
                                     <span className="text-[8px] font-bold text-slate-400 whitespace-nowrap">{notif.timestamp}</span>
                                  </div>
                                  <p className="text-[10px] font-medium leading-tight mt-1 line-clamp-2 text-slate-500">{notif.message}</p>
                                  <div className="mt-3 flex items-center justify-between">
                                     <div className="flex items-center space-x-2">
                                       {!notif.isRead && (
                                         <button 
                                           onClick={(e) => markNotificationAsRead(notif.id, e)} 
                                           className="flex items-center space-x-1.5 text-[8px] font-black uppercase text-accent hover:bg-accent hover:text-white px-3 py-1.5 rounded-lg transition-all border border-accent/20 bg-accent/5 shadow-sm cursor-pointer"
                                         >
                                           <Check size={12} />
                                           <span>Lu</span>
                                         </button>
                                       )}
                                       {notif.isRead && (
                                         <span className="text-[7px] font-black uppercase text-slate-300 flex items-center px-2 py-1 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                                           <CheckCheck size={10} className="mr-1.5 text-emerald-500" /> Consultée
                                         </span>
                                       )}
                                       <button 
                                         onClick={(e) => { e.stopPropagation(); speakNotification(notif); }} 
                                         className={`flex items-center space-x-1.5 p-1.5 rounded-lg transition-all cursor-pointer ${isSpeaking === notif.id ? 'bg-accent text-white scale-110' : 'text-slate-400 hover:text-accent hover:bg-accent/10'}`}
                                       >
                                          {isSpeaking === notif.id ? <Loader2 size={12} className="animate-spin" /> : <Volume2 size={12} />}
                                          <span className="text-[8px] font-black uppercase">{isSpeaking === notif.id ? 'Lecture...' : 'Écouter'}</span>
                                       </button>
                                     </div>
                                     {notif.isRead && canManageNotifications && (
                                       <button 
                                         onClick={(e) => { e.stopPropagation(); setNotificationHistory(prev => prev.filter(n => n.id !== notif.id)); }} 
                                         className="p-1.5 text-slate-300 hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                                       >
                                         <Trash2 size={12} />
                                       </button>
                                     )}
                                  </div>
                               </div>
                            </div>
                         </div>
                       )) : (
                         <div className="py-20 flex flex-col items-center justify-center opacity-20 text-center">
                            <BellOff size={40} className="mb-4 text-slate-300"/>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em]">{notifFilter === 'unread' ? 'Aucune notification non lue' : 'Centre de notifications vide'}</p>
                         </div>
                       )}
                    </div>
                 </div>
               )}
            </div>

            <button onClick={() => setDarkMode(!darkMode)} className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-2xl hover:bg-slate-200 transition-all cursor-pointer">{darkMode ? <Sun size={22}/> : <Moon size={22}/>}</button>
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

      {/* CALENDRIER MODAL (APPELÉ PAR CLIC SUR LA DATE) */}
      {isCalendarOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl z-[500] flex items-center justify-center p-6 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 w-full max-w-5xl h-[85vh] rounded-[3rem] shadow-2xl border border-white/10 overflow-hidden animate-scaleIn flex flex-col">
             <div className="p-8 border-b dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-accent text-white rounded-2xl shadow-lg">
                    {config.companyLogo ? (
                      <img src={config.companyLogo} alt="Logo" className="w-8 h-8 object-cover rounded-lg" />
                    ) : (
                      <CalendarIcon size={24}/>
                    )}
                  </div>
                  <div>
                    <h3 className="text-2xl font-black uppercase tracking-tighter">Agenda de l'établissement</h3>
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1">Planning consolidé & Événements</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsCalendarOpen(false)}
                  className="p-4 hover:bg-rose-50 dark:hover:bg-rose-900/20 text-slate-400 hover:text-rose-600 rounded-2xl transition-all"
                >
                  <X size={32} />
                </button>
             </div>
             <div className="flex-1 overflow-auto p-8">
                <CalendarView config={config} t={t} notify={notifyUser} />
             </div>
          </div>
        </div>
      )}

      <div className="fixed top-28 right-8 z-[300] flex flex-col items-end space-y-4 pointer-events-none w-full max-sm px-4 sm:max-w-sm">
        {toasts.map((toast) => (
          <div key={toast.id} className={`w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border p-5 rounded-[2rem] shadow-2xl flex items-start space-x-4 pointer-events-auto animate-slideInRight overflow-hidden relative group`}>
            <div className={`mt-1 p-2.5 rounded-2xl shrink-0 ${toast.type === 'success' ? 'bg-emerald-500/10 text-emerald-500' : toast.type === 'warning' ? 'bg-orange-500/10 text-orange-500' : 'bg-blue-500/10 text-blue-500'}`}>
               {toast.type === 'success' ? <CheckCircle size={20}/> : toast.type === 'warning' ? <AlertTriangle size={20}/> : <Info size={20}/>}
            </div>
            <div className="flex-1 min-w-0">
               <h5 className="text-[11px] font-black uppercase tracking-widest text-slate-900 dark:text-white mb-1">{toast.title}</h5>
               <p className="text-[11px] font-medium text-slate-500 leading-tight">{toast.message}</p>
            </div>
            <div className={`absolute bottom-0 left-0 h-1 ${toast.type === 'success' ? 'bg-emerald-500' : toast.type === 'warning' ? 'bg-orange-500' : 'bg-blue-500'} animate-progressDecrease`}></div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default App;
