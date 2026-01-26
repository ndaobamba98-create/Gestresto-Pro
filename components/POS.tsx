
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Product, SaleOrder, ERPConfig, CashSession, PaymentMethod, Customer, UserRole, ViewType, User as AppUser } from '../types';
import { 
  Search, Plus, Minus, Trash2, ShoppingBag, Monitor, Banknote, ChevronLeft, 
  Package, History, X, Smartphone, Wallet, 
  CheckCircle2, Zap, LayoutGrid, Coins, Utensils, Coffee, Truck, User, Calculator, ArrowRight, AlertTriangle, ArrowRightLeft, MoveHorizontal, UserCheck, UserPlus, Phone, Lock, ShieldAlert
} from 'lucide-react';
import { APP_USERS, POS_LOCATIONS } from '../constants';

interface CartItem {
  product: Product;
  qty: number;
}

const DENOMINATIONS = [1000, 500, 200, 100, 50, 20, 10];

interface Props {
  products: Product[];
  customers: Customer[];
  onUpdateCustomers: (customers: Customer[]) => void;
  sales: SaleOrder[];
  onSaleComplete: (sale: Partial<SaleOrder>) => void;
  onRefundSale: (saleId: string) => void;
  config: ERPConfig;
  session: CashSession | null;
  onOpenSession: (openingBalance: number, cashierId: string) => void;
  onCloseSession: (closingBalance: number) => void;
  notify: (title: string, message: string, type?: 'success' | 'info' | 'warning') => void;
  userRole: UserRole;
  userPermissions: ViewType[];
  currentUser: AppUser;
}

const POS: React.FC<Props> = ({ products, customers, onUpdateCustomers, config, session, onOpenSession, onCloseSession, onSaleComplete, notify, sales, onRefundSale, userRole, userPermissions, currentUser }) => {
  const [pendingCarts, setPendingCarts] = useState<Record<string, CartItem[]>>(() => {
    const saved = localStorage.getItem('sama_pos_pending_carts');
    return saved ? JSON.parse(saved) : {};
  });

  const [activeLocation, setActiveLocation] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('Tous');
  const [receivedAmount, setReceivedAmount] = useState<string>('');

  const [sessionStep, setSessionStep] = useState<'cashier' | 'counting'>('cashier');
  const [selectedCashierId, setSelectedCashierId] = useState<string | null>(currentUser.role === 'cashier' ? currentUser.id : null);
  const [showClosingModal, setShowClosingModal] = useState(false);
  const [showSalesHistory, setShowSalesHistory] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [newCustomerData, setNewCustomerData] = useState({ name: '', phone: '' });
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  
  const [counts, setCounts] = useState<Record<number, number>>(
    DENOMINATIONS.reduce((acc, d) => ({ ...acc, [d]: 0 }), {})
  );

  const totalCounted = useMemo(() => 
    DENOMINATIONS.reduce((sum, d) => sum + (d * (counts[d] || 0)), 0)
  , [counts]);

  const canCloseSession = useMemo(() => 
    userPermissions.includes('manage_session_closing') || userRole === 'admin'
  , [userPermissions, userRole]);

  const isCorrectSession = useMemo(() => {
    if (!session) return false;
    if (userRole === 'admin' || userRole === 'manager') return true;
    return session.cashierId === currentUser.id;
  }, [session, currentUser, userRole]);

  const sessionSales = useMemo(() => {
    if (!session || !isCorrectSession) return [];
    return sales.filter(s => s.date >= session.openedAt && (userRole === 'admin' ? true : s.cashierId === currentUser.id));
  }, [sales, session, isCorrectSession, currentUser, userRole]);

  const sessionCashSalesTotal = useMemo(() => {
    if (!session || !isCorrectSession) return 0;
    return sessionSales
      .filter(s => s.paymentMethod === 'Especes' && s.status !== 'refunded')
      .reduce((sum, s) => sum + s.total, 0);
  }, [sessionSales, session, isCorrectSession]);

  const expectedClosingBalance = useMemo(() => 
    (session?.openingBalance || 0) + sessionCashSalesTotal
  , [session, sessionCashSalesTotal]);

  const cashDifference = totalCounted - expectedClosingBalance;

  useEffect(() => {
    localStorage.setItem('sama_pos_pending_carts', JSON.stringify(pendingCarts));
  }, [pendingCarts]);

  const categories = useMemo(() => {
    const sorted = [...config.categories].sort((a, b) => a.localeCompare(b));
    return ['Tous', ...sorted];
  }, [config.categories]);
  
  const filteredProducts = useMemo(() => {
    return products
      .filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = activeCategory === 'Tous' || p.category === activeCategory;
        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [products, search, activeCategory]);

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => 
      c.name.toLowerCase().includes(customerSearch.toLowerCase()) || 
      c.phone.includes(customerSearch)
    );
  }, [customers, customerSearch]);

  const currentCart = activeLocation ? (pendingCarts[activeLocation] || []) : [];
  
  const total = useMemo(() => 
    currentCart.reduce((acc, item) => acc + (item.product.price * item.qty), 0)
  , [currentCart]);

  const changeDue = useMemo(() => {
    const received = parseFloat(receivedAmount) || 0;
    return received > total ? received - total : 0;
  }, [receivedAmount, total]);

  const addToCart = (p: Product) => {
    if (!activeLocation) {
        notify("Action Requise", "Veuillez d'abord sélectionner un emplacement.", "warning");
        return;
    }
    const exists = currentCart.find(item => item.product.id === p.id);
    const newItems = exists 
      ? currentCart.map(item => item.product.id === p.id ? {...item, qty: item.qty + 1} : item)
      : [...currentCart, {product: p, qty: 1}];
    
    setPendingCarts(prev => ({ ...prev, [activeLocation]: newItems }));
  };

  const adjustQty = (productId: string, delta: number) => {
    if (!activeLocation) return;
    const items = pendingCarts[activeLocation] || [];
    const updatedItems = items.map(item => {
      if (item.product.id === productId) {
        return { ...item, qty: Math.max(0, item.qty + delta) };
      }
      return item;
    }).filter(item => item.qty > 0);
    
    setPendingCarts(prev => ({ ...prev, [activeLocation]: updatedItems }));
  };

  const handleTransferOrder = (target: string) => {
    if (!activeLocation || target === activeLocation) return;
    
    const sourceCart = pendingCarts[activeLocation] || [];
    if (sourceCart.length === 0) return;

    setPendingCarts(prev => {
      const newState = { ...prev };
      const targetCart = newState[target] || [];
      const mergedCart = [...targetCart];
      sourceCart.forEach(sourceItem => {
        const existingIdx = mergedCart.findIndex(ti => ti.product.id === sourceItem.product.id);
        if (existingIdx > -1) {
          mergedCart[existingIdx] = { ...mergedCart[existingIdx], qty: mergedCart[existingIdx].qty + sourceItem.qty };
        } else {
          mergedCart.push({ ...sourceItem });
        }
      });
      newState[target] = mergedCart;
      delete newState[activeLocation];
      return newState;
    });

    notify("Transfert Réussi", `Commande déplacée vers ${target}`, "success");
    setActiveLocation(target);
    setShowTransferModal(false);
  };

  const handleSimplePayment = useCallback((method: PaymentMethod) => {
    if (!activeLocation || currentCart.length === 0) return;

    if (method === 'Compte' && !selectedCustomer) {
      notify("Action Requise", "Veuillez sélectionner un client.", "warning");
      setShowCustomerModal(true);
      return;
    }

    const amountReceivedVal = parseFloat(receivedAmount) || total;
    
    onSaleComplete({
      id: `FAC-${Date.now()}`,
      total,
      customer: selectedCustomer ? selectedCustomer.name : ('Client ' + activeLocation),
      customerId: selectedCustomer?.id,
      cashierId: currentUser.id,
      items: currentCart.map(i => ({ productId: i.product.id, name: i.product.name, quantity: i.qty, price: i.product.price })),
      payments: [{ method, amount: total }],
      paymentMethod: method,
      amountReceived: amountReceivedVal,
      change: changeDue,
      orderLocation: activeLocation,
      status: 'confirmed',
      date: new Date().toISOString()
    });

    setPendingCarts(prev => {
      const newState = { ...prev };
      delete newState[activeLocation];
      return newState;
    });
    setReceivedAmount('');
    setActiveLocation(null);
    setSelectedCustomer(null);
  }, [activeLocation, currentCart, onSaleComplete, receivedAmount, total, changeDue, selectedCustomer, notify, currentUser]);

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerData.name || !newCustomerData.phone) return;

    const customer: Customer = {
      id: `C-${Date.now()}`,
      name: newCustomerData.name,
      phone: newCustomerData.phone,
      balance: 0
    };

    onUpdateCustomers([customer, ...customers]);
    setSelectedCustomer(customer);
    setShowAddCustomerModal(false);
    setNewCustomerData({ name: '', phone: '' });
    notify("Succès", `Client ${customer.name} créé.`, "success");
  };

  const CashCounter = () => (
    <div className="space-y-2">
      {DENOMINATIONS.map(val => (
        <div key={val} className="flex items-center bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
          <div className="w-14 h-8 bg-slate-900 text-white rounded-lg flex items-center justify-center font-black text-[11px] mr-4 shrink-0">
            {val}
          </div>
          <div className="flex-1 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button 
                type="button"
                onClick={() => setCounts(v => ({...v, [val]: Math.max(0, (v[val] || 0) - 1)}))} 
                className="w-8 h-8 rounded-lg bg-white dark:bg-slate-700 border flex items-center justify-center text-slate-400"
              >
                <Minus size={14}/>
              </button>
              <input 
                type="number" 
                value={counts[val] === 0 ? '' : counts[val]} 
                onChange={e => {
                  const rawValue = e.target.value;
                  const parsedValue = parseInt(rawValue);
                  setCounts(v => ({...v, [val]: isNaN(parsedValue) ? 0 : parsedValue}));
                }} 
                className="w-14 text-center bg-transparent font-black text-sm outline-none" 
                placeholder="0"
              />
              <button 
                type="button"
                onClick={() => setCounts(v => ({...v, [val]: (v[val] || 0) + 1}))} 
                className="w-8 h-8 rounded-lg bg-white dark:bg-slate-700 border flex items-center justify-center text-slate-400"
              >
                <Plus size={14}/>
              </button>
            </div>
            <div className="text-right ml-4">
              <span className="text-[10px] font-black text-slate-900 dark:text-white">
                {(val * (counts[val] || 0)).toLocaleString()} {config.currency}
              </span>
            </div>
          </div>
        </div>
      ))}
      <div className="mt-4 p-4 bg-slate-900 text-white rounded-2xl flex justify-between items-center">
        <span className="text-[10px] font-black uppercase tracking-widest text-accent">Total Compté</span>
        <span className="text-xl font-black">{totalCounted.toLocaleString()} {config.currency}</span>
      </div>
    </div>
  );

  if (!session || !isCorrectSession) {
    return (
      <div className="h-full flex items-center justify-center p-8 bg-slate-50 dark:bg-slate-950">
        <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full">
           {sessionStep === 'cashier' ? (
             <div className="space-y-8 animate-fadeIn text-center">
                <div className="w-16 h-16 bg-accent/10 text-accent rounded-2xl flex items-center justify-center mx-auto mb-6"><User size={32}/></div>
                <h2 className="text-xl font-black uppercase tracking-tighter">Ouverture Session</h2>
                <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-2 border-accent/20 flex flex-col items-center space-y-3">
                   <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${currentUser.color} flex items-center justify-center text-white font-black shadow-lg text-lg`}>{currentUser.initials}</div>
                   <span className="text-sm font-black uppercase tracking-widest">{currentUser.name}</span>
                </div>
                <button onClick={() => setSessionStep('counting')} className="w-full py-4 bg-slate-900 text-white rounded-xl font-black uppercase text-[10px] tracking-widest">Suivant <ArrowRight size={14} className="ml-2"/></button>
             </div>
           ) : (
             <div className="space-y-6 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <button onClick={() => setSessionStep('cashier')} className="text-slate-400 hover:text-slate-900 flex items-center text-[9px] font-black uppercase"><ChevronLeft size={14}/> Retour</button>
                  <span className="text-[9px] font-black text-accent uppercase tracking-widest">Fond de Caisse</span>
                </div>
                <CashCounter />
                <button onClick={() => onOpenSession(totalCounted, currentUser.id)} className="w-full py-4 bg-emerald-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest">Ouvrir avec {totalCounted.toLocaleString()} {config.currency}</button>
             </div>
           )}
        </div>
      </div>
    );
  }

  // Fix: Explicitly included 'key' in the props type for LocationBtn to avoid TS errors in .map() calls.
  const LocationBtn = ({ loc, icon: Icon, compact = false, onClick }: { loc: string, icon?: any, compact?: boolean, onClick?: () => void, key?: React.Key }) => {
    const itemCount = pendingCarts[loc]?.reduce((sum, i) => sum + i.qty, 0) || 0;
    const isOccupied = itemCount > 0;
    return (
      <button onClick={onClick ? onClick : () => setActiveLocation(loc)} className={`relative ${compact ? 'h-20 rounded-2xl' : 'h-32 rounded-[2rem]'} border-2 transition-all flex flex-col items-center justify-center space-y-2 group ${isOccupied ? 'bg-accent border-accent text-white' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-accent'}`}>
        {Icon ? <Icon size={compact ? 16 : 20}/> : <Utensils size={compact ? 14 : 18}/>}
        <span className={`font-black uppercase ${compact ? 'text-[8px]' : 'text-[10px]'} tracking-widest`}>{loc}</span>
        {isOccupied && <span className={`absolute -top-1.5 -right-1.5 ${compact ? 'w-5 h-5' : 'w-7 h-7'} bg-white text-accent rounded-full flex items-center justify-center font-black text-[9px] border-2 border-accent`}>{itemCount}</span>}
      </button>
    );
  };

  return (
    <div className="h-full flex flex-col space-y-4 overflow-hidden animate-fadeIn">
       <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-6">
             <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black"><ShoppingBag size={20}/></div>
             <div>
                <h2 className="text-sm font-black uppercase tracking-tighter">Caisse - {session.cashierName}</h2>
                <div className="flex items-center space-x-2 text-[8px] font-black uppercase tracking-widest mt-0.5">
                   <span className="text-emerald-500 flex items-center"><Zap size={10} className="mr-1"/> Session Active</span>
                </div>
             </div>
          </div>
          <div className="flex items-center space-x-3">
             <button onClick={() => setShowSalesHistory(true)} className="flex items-center space-x-2 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest"><History size={14}/><span>Ventes Session</span></button>
             {canCloseSession && <button onClick={() => { setCounts(DENOMINATIONS.reduce((acc, d) => ({ ...acc, [d]: 0 }), {})); setShowClosingModal(true); }} className="bg-rose-600 text-white px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg">Clôturer</button>}
          </div>
       </div>

       {!activeLocation ? (
         <div className="flex-1 bg-slate-50 dark:bg-slate-950/40 rounded-[3rem] p-10 border border-slate-200 dark:border-slate-800 overflow-y-auto space-y-12 scrollbar-hide">
            <div className="flex items-center justify-between">
               <h3 className="text-xl font-black uppercase tracking-tighter">Salles & Tables</h3>
               <button onClick={() => setActiveLocation('Comptoir')} className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center"><ShoppingBag size={18} className="mr-3"/> Vente Comptoir</button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
               {POS_LOCATIONS.tables.map(loc => <LocationBtn key={loc} loc={loc} />)}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
               <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">À Emporter</h4>
                  <div className="grid grid-cols-2 gap-6">
                     {POS_LOCATIONS.takeaway.map(loc => <LocationBtn key={loc} loc={loc} icon={Package} />)}
                  </div>
               </div>
               <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Livraisons</h4>
                  <div className="grid grid-cols-2 gap-6">
                     {POS_LOCATIONS.delivery.map(loc => <LocationBtn key={loc} loc={loc} icon={Truck} />)}
                  </div>
               </div>
            </div>
         </div>
       ) : (
         <div className="flex-1 grid grid-cols-12 gap-6 overflow-hidden">
            <div className="col-span-8 flex flex-col space-y-4 overflow-hidden">
               <div className="flex items-center space-x-3">
                  <button onClick={() => { setActiveLocation(null); setSelectedCustomer(null); }} className="p-4 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 transition-all flex items-center space-x-2">
                    <ChevronLeft size={18} />
                    <span className="text-[10px] font-black uppercase">Salles</span>
                  </button>
                  <div className="flex-1 relative">
                     <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                     <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Chercher un plat..." className="w-full pl-12 pr-6 py-4 bg-white dark:bg-slate-900 rounded-2xl text-xs font-bold shadow-sm focus:ring-2 focus:ring-accent outline-none border border-slate-100 dark:border-slate-800" />
                  </div>
               </div>
               <div className="flex space-x-2 overflow-x-auto scrollbar-hide pb-2">
                  {categories.map(cat => (
                    <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-6 py-3 rounded-xl text-[9px] font-black uppercase whitespace-nowrap transition-all border ${activeCategory === cat ? 'bg-accent border-accent text-white shadow-md' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-400'}`}>
                       {cat}
                    </button>
                  ))}
               </div>
               <div className="flex-1 overflow-y-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 scrollbar-hide pb-10">
                  {filteredProducts.map(p => (
                     <button key={p.id} onClick={() => addToCart(p)} className="bg-white dark:bg-slate-900 p-4 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm text-left flex flex-col justify-between hover:border-accent transition-all h-36">
                        <span className="text-[8px] font-black text-slate-300 uppercase">{p.category}</span>
                        <h4 className="text-[11px] font-black uppercase leading-tight text-slate-800 dark:text-slate-100">{p.name}</h4>
                        <div className="flex items-center justify-between mt-auto pt-2 border-t dark:border-slate-800">
                           <span className="text-sm font-black text-slate-900 dark:text-white">{p.price.toLocaleString()} <span className="text-[9px] opacity-40">{config.currency}</span></span>
                           <Plus size={14} className="text-slate-300" />
                        </div>
                     </button>
                  ))}
               </div>
            </div>

            <div className="col-span-4 flex flex-col overflow-hidden">
               <div className="bg-white dark:bg-slate-900 rounded-[3.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col flex-1 relative">
                  <div className="p-6 border-b dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between">
                     <h3 className="text-xs font-black uppercase tracking-widest">{activeLocation}</h3>
                     <div className="flex items-center space-x-2">
                        <button onClick={() => setShowTransferModal(true)} className="p-2 text-slate-300 hover:text-accent"><ArrowRightLeft size={18}/></button>
                        <button onClick={() => setPendingCarts(prev => ({ ...prev, [activeLocation!]: [] }))} className="p-2 text-slate-300 hover:text-rose-500"><Trash2 size={18}/></button>
                     </div>
                  </div>
                  <div className="p-4 border-b dark:border-slate-800">
                     <button onClick={() => setShowCustomerModal(true)} className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${selectedCustomer ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/10' : 'border-dashed border-slate-200'}`}>
                       <div className="flex items-center space-x-3 text-left">
                          <UserCheck size={16} className={selectedCustomer ? 'text-indigo-600' : 'text-slate-400'} />
                          <div>
                             <p className="text-[8px] font-black uppercase tracking-widest">Client</p>
                             <p className="text-xs font-bold truncate">{selectedCustomer ? selectedCustomer.name : 'Vente directe'}</p>
                          </div>
                       </div>
                       {selectedCustomer && <X size={14} onClick={(e) => { e.stopPropagation(); setSelectedCustomer(null); }} className="text-slate-400" />}
                     </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide">
                     {currentCart.map(item => (
                        <div key={item.product.id} className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl">
                           <div className="flex flex-col flex-1 min-w-0 pr-3">
                              <span className="text-[11px] font-black uppercase truncate">{item.product.name}</span>
                              <span className="text-[9px] font-bold text-slate-400">{(item.product.price * item.qty).toLocaleString()}</span>
                           </div>
                           <div className="flex items-center bg-white dark:bg-slate-900 rounded-xl p-1 shadow-sm">
                              <button onClick={() => adjustQty(item.product.id, -1)} className="p-1.5 text-slate-400"><Minus size={12}/></button>
                              <span className="px-3 text-xs font-black">{item.qty}</span>
                              <button onClick={() => addToCart(item.product)} className="p-1.5 text-slate-400"><Plus size={12}/></button>
                           </div>
                        </div>
                     ))}
                  </div>
                  <div className="p-6 bg-slate-900 text-white rounded-t-[3.5rem] space-y-6">
                     <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Total</span>
                        <span className="text-3xl font-black">{total.toLocaleString()} <span className="text-xs">{config.currency}</span></span>
                     </div>
                     <div className="grid grid-cols-3 gap-2">
                        <button disabled={total === 0} onClick={() => handleSimplePayment('Especes')} className="py-3 bg-emerald-600 rounded-xl font-black uppercase text-[7px] flex flex-col items-center"><Coins size={16} className="mb-1"/>Espèces</button>
                        <button disabled={total === 0} onClick={() => handleSimplePayment('Masrvi')} className="py-3 bg-blue-600 rounded-xl font-black uppercase text-[7px] flex flex-col items-center"><Wallet size={16} className="mb-1"/>Masrvi</button>
                        <button disabled={total === 0} onClick={() => handleSimplePayment('Bankily')} className="py-3 bg-orange-600 rounded-xl font-black uppercase text-[7px] flex flex-col items-center"><Smartphone size={16} className="mb-1"/>Bankily</button>
                     </div>
                  </div>
               </div>
            </div>
         </div>
       )}

       {showCustomerModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[250] flex items-center justify-center p-4 animate-fadeIn">
             <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                <div className="p-8 border-b dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                   <h3 className="text-lg font-black uppercase tracking-tighter">Choisir Client</h3>
                   <button onClick={() => setShowCustomerModal(false)}><X size={24}/></button>
                </div>
                <div className="p-6">
                   <div className="relative mb-6">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input value={customerSearch} onChange={e => setCustomerSearch(e.target.value)} placeholder="Nom ou téléphone..." className="w-full pl-12 pr-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl text-sm font-bold outline-none" />
                   </div>
                   <div className="space-y-2 overflow-y-auto max-h-[400px] scrollbar-hide">
                      {filteredCustomers.map(c => (
                        <div key={c.id} onClick={() => { setSelectedCustomer(c); setShowCustomerModal(false); }} className="w-full p-4 bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-50 dark:border-slate-700 flex items-center justify-between cursor-pointer hover:border-accent transition-all">
                           <div className="flex items-center space-x-4">
                              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-black text-xs">{c.name[0]}</div>
                              <div>
                                 <p className="text-xs font-black uppercase">{c.name}</p>
                                 <p className="text-[10px] font-bold text-slate-400">{c.phone}</p>
                              </div>
                           </div>
                           <span className={`text-[10px] font-black uppercase ${c.balance >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>Solde: {c.balance}</span>
                        </div>
                      ))}
                   </div>
                </div>
                <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t dark:border-slate-800 text-center">
                   <button onClick={() => setShowAddCustomerModal(true)} className="text-indigo-600 font-black uppercase text-[10px] tracking-widest">+ Nouveau Client</button>
                </div>
             </div>
          </div>
       )}

       {showAddCustomerModal && (
         <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm z-[300] flex items-center justify-center p-4 animate-fadeIn">
           <div className="bg-white dark:bg-slate-900 w-full max-sm rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/10">
              <div className="p-6 border-b bg-indigo-600 text-white flex justify-between items-center">
                 <h3 className="text-sm font-black uppercase tracking-tighter">Nouveau Client</h3>
                 <button onClick={() => setShowAddCustomerModal(false)}><X size={20}/></button>
              </div>
              <form onSubmit={handleCreateCustomer} className="p-8 space-y-6">
                 <input required value={newCustomerData.name} onChange={e => setNewCustomerData({...newCustomerData, name: e.target.value})} className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl font-bold" placeholder="Nom complet" />
                 <input required value={newCustomerData.phone} onChange={e => setNewCustomerData({...newCustomerData, phone: e.target.value})} className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl font-bold" placeholder="Téléphone" />
                 <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl">Créer et Sélectionner</button>
              </form>
           </div>
         </div>
       )}

       {showClosingModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[250] flex items-center justify-center p-4 animate-fadeIn">
             <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/10">
                <div className="p-6 border-b bg-rose-600 text-white flex justify-between items-center">
                   <div className="flex items-center space-x-3"><Calculator size={24} /> <h3 className="text-sm font-black uppercase tracking-tighter">Fermeture Session</h3></div>
                   <button onClick={() => setShowClosingModal(false)}><X size={24}/></button>
                </div>
                <div className="p-6 space-y-6">
                   <CashCounter />
                   <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl space-y-4">
                      <div className="flex justify-between text-[10px] font-bold"><span>Fond initial :</span><span>{session.openingBalance.toLocaleString()}</span></div>
                      <div className="flex justify-between text-[10px] font-bold"><span>Ventes Espèces :</span><span className="text-emerald-500">+{sessionCashSalesTotal.toLocaleString()}</span></div>
                      <div className="border-t pt-2 flex justify-between font-black uppercase"><span>Attendu :</span><span>{expectedClosingBalance.toLocaleString()}</span></div>
                   </div>
                   <button onClick={() => onCloseSession(totalCounted)} className="w-full py-4 bg-rose-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl">Valider la Clôture</button>
                </div>
             </div>
          </div>
       )}
    </div>
  );
};

export default POS;
