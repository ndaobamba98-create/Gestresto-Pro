import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Product, SaleOrder, ERPConfig, CashSession, PaymentMethod } from '../types';
import { 
  Search, Plus, Minus, Trash2, ShoppingBag, Utensils, Monitor, Banknote, ChevronLeft, 
  Coffee, Package, Truck, History, X, Smartphone, Wallet, 
  CheckCircle2, Calculator, AlertCircle, Coins, Zap, MousePointer2, Layers, ArrowLeftRight
} from 'lucide-react';
import { APP_USERS, POS_LOCATIONS } from '../constants';
import { AppLogo } from '../App';

interface CartItem {
  product: Product;
  qty: number;
}

const DENOMINATIONS = [1000, 500, 200, 100, 50, 20, 10];

interface BillCounterProps {
  counts: Record<number, number>;
  onChange: (counts: Record<number, number>) => void;
  currency: string;
}

const BillCounter: React.FC<BillCounterProps> = ({ counts, onChange, currency }) => {
  const handleUpdate = (denom: number, val: number) => {
    onChange({ ...counts, [denom]: Math.max(0, val) });
  };

  const total = useMemo(() => 
    Object.entries(counts).reduce((acc, [denom, qty]) => acc + (parseInt(denom) * (qty as number)), 0)
  , [counts]);

  return (
    <div className="space-y-4 w-full">
      <div className="grid grid-cols-1 gap-2 max-h-[250px] overflow-y-auto pr-2 force-scrollbar">
        {DENOMINATIONS.map(denom => (
          <div key={denom} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-6 bg-emerald-500 rounded flex items-center justify-center text-[10px] font-black text-white shadow-sm">{denom}</div>
              <span className="text-[10px] font-black uppercase text-slate-400">Billet {denom}</span>
            </div>
            <div className="flex items-center space-x-3">
              <button type="button" onClick={() => handleUpdate(denom, (counts[denom] || 0) - 1)} className="p-1.5 bg-white dark:bg-slate-700 rounded-lg shadow-sm hover:text-rose-500 transition-all"><Minus size={14}/></button>
              <input 
                type="number" 
                value={counts[denom] || 0} 
                onChange={e => handleUpdate(denom, parseInt(e.target.value) || 0)}
                className="w-12 text-center bg-transparent font-black text-sm outline-none"
              />
              <button type="button" onClick={() => handleUpdate(denom, (counts[denom] || 0) + 1)} className="p-1.5 bg-white dark:bg-slate-700 rounded-lg shadow-sm hover:text-emerald-500 transition-all"><Plus size={14}/></button>
            </div>
          </div>
        ))}
      </div>
      <div className="p-4 bg-slate-900 text-white rounded-2xl flex justify-between items-center shadow-lg">
        <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Total Compté</span>
        <span className="text-xl font-black">{total.toLocaleString()} {currency}</span>
      </div>
    </div>
  );
};

interface Props {
  products: Product[];
  sales: SaleOrder[];
  onSaleComplete: (sale: Partial<SaleOrder>) => void;
  config: ERPConfig;
  session: CashSession | null;
  // Fixed duplicate onOpenSession identifier in Props interface
  onOpenSession: (openingBalance: number, cashierId: string) => void;
  onCloseSession: (closingBalance: number) => void;
  notify: (title: string, message: string, type?: 'success' | 'info' | 'warning') => void;
}

// Fixed duplicate onOpenSession identifier in component props destructuring
const POS: React.FC<Props> = ({ products, sales, onSaleComplete, config, session, onOpenSession, onCloseSession, notify }) => {
  const [pendingCarts, setPendingCarts] = useState<Record<string, CartItem[]>>({});
  const [activeLocation, setActiveLocation] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('Tous');
  const [receivedAmount, setReceivedAmount] = useState<string>('');

  const [sessionStep, setSessionStep] = useState<'cashier' | 'balance'>('cashier');
  const [openingBillCounts, setOpeningBillCounts] = useState<Record<number, number>>({});
  const [selectedCashierId, setSelectedCashierId] = useState<string | null>(null);
  const [showClosingModal, setShowClosingModal] = useState(false);
  const [closingBillCounts, setClosingBillCounts] = useState<Record<number, number>>({});
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);

  const [bumpedProductId, setBumpedProductId] = useState<string | null>(null);
  const [isCartBouncing, setIsCartBouncing] = useState(false);

  // Liste des tables avec des commandes actives
  // Fixed: explicitly typed entries to avoid 'unknown' length error on line 96
  const activeTables = useMemo(() => {
    return (Object.entries(pendingCarts) as [string, CartItem[]][])
      .filter(([_, items]) => items.length > 0)
      .map(([loc, _]) => loc);
  }, [pendingCarts]);

  const calculatedOpeningBalance = useMemo(() => 
    Object.entries(openingBillCounts).reduce((acc, [denom, qty]) => acc + (parseInt(denom) * (qty as number)), 0)
  , [openingBillCounts]);

  const calculatedClosingBalance = useMemo(() => 
    Object.entries(closingBillCounts).reduce((acc, [denom, qty]) => acc + (parseInt(denom) * (qty as number)), 0)
  , [closingBillCounts]);

  const sessionSales = useMemo(() => {
    if (!session) return [];
    const openTime = new Date(session.openedAt).getTime();
    return sales.filter(s => {
      const saleTime = new Date(s.date).getTime();
      return !isNaN(saleTime) && saleTime >= openTime;
    });
  }, [sales, session]);

  const currentExpectedBalance = useMemo(() => {
    if (!session) return 0;
    const revenue = sessionSales.reduce((acc, curr) => 
      curr.status === 'refunded' ? acc - curr.total : acc + curr.total, 0
    );
    return session.openingBalance + revenue;
  }, [session, sessionSales]);

  const allLocations = useMemo(() => [
    { category: 'Tables', items: POS_LOCATIONS.tables.map(l => ({ id: l, icon: Utensils, label: l })) },
    { category: 'Bar', items: POS_LOCATIONS.bar.map(l => ({ id: l, icon: Coffee, label: l })) },
    { category: 'Vente Rapide', items: [
      { id: 'Comptoir', icon: MousePointer2, label: 'Comptoir' },
      ...POS_LOCATIONS.takeaway.map(l => ({ id: l, icon: Package, label: l })),
      ...POS_LOCATIONS.delivery.map(l => ({ id: l, icon: Truck, label: l }))
    ]}
  ], []);

  const groupedProducts = useMemo(() => {
    const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
    const catsToDisplay = activeCategory === 'Tous' ? config.categories : config.categories.filter(c => c === activeCategory);
    
    return catsToDisplay.map(cat => ({
      name: cat,
      items: filtered.filter(p => p.category === cat).sort((a, b) => a.name.localeCompare(b.name))
    })).filter(group => group.items.length > 0);
  }, [products, search, activeCategory, config.categories]);

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
        notify("Action Recluse", "Veuillez d'abord sélectionner une table.", "warning");
        return;
    }
    const exists = currentCart.find(item => item.product.id === p.id);
    const newItems = exists 
      ? currentCart.map(item => item.product.id === p.id ? {...item, qty: item.qty + 1} : item)
      : [...currentCart, {product: p, qty: 1}];
    
    setPendingCarts(prev => ({ ...prev, [activeLocation]: newItems }));
    setBumpedProductId(p.id);
    setIsCartBouncing(true);
    setTimeout(() => { setBumpedProductId(null); setIsCartBouncing(false); }, 200);
  };

  const adjustQty = (productId: string, delta: number) => {
    if (!activeLocation) return;
    const newItems = currentCart.map(item => 
      item.product.id === productId ? { ...item, qty: Math.max(1, item.qty + delta) } : item
    );
    setPendingCarts(prev => ({ ...prev, [activeLocation]: newItems }));
  };

  const handleSimplePayment = useCallback((method: PaymentMethod) => {
    if (!activeLocation || currentCart.length === 0) return;
    
    const amountReceivedVal = parseFloat(receivedAmount) || total;
    
    onSaleComplete({
      total,
      items: currentCart.map(i => ({ productId: i.product.id, name: i.product.name, quantity: i.qty, price: i.product.price })),
      payments: [{ method, amount: total }],
      paymentMethod: method,
      amountReceived: amountReceivedVal,
      change: changeDue,
      orderLocation: activeLocation,
      status: 'confirmed'
    });

    setPendingCarts(prev => {
      const next = { ...prev };
      if (activeLocation) next[activeLocation] = [];
      return next;
    });
    setReceivedAmount('');
    setActiveLocation(null);
    notify("Vente Validée", `Réglé par ${method}. Monnaie : ${changeDue.toLocaleString()}`, "success");
  }, [activeLocation, currentCart, onSaleComplete, receivedAmount, total, changeDue, notify]);

  const transferOrder = (targetLocation: string) => {
    if (!activeLocation || targetLocation === activeLocation) return;
    
    setPendingCarts(prev => {
      const next = { ...prev };
      const currentItems = next[activeLocation] || [];
      next[targetLocation] = [...(next[targetLocation] || []), ...currentItems];
      next[activeLocation] = [];
      return next;
    });
    
    setActiveLocation(targetLocation);
    setShowTransferModal(false);
    notify("Transfert réussi", `Commande déplacée vers ${targetLocation}`, "info");
  };

  // Écouteur global pour la touche Entrée
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && currentCart.length > 0 && activeLocation) {
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' || target.classList.contains('payment-input')) {
          handleSimplePayment('Especes');
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [currentCart, activeLocation, handleSimplePayment]);

  if (!session) {
    return (
      <div className="h-full flex items-center justify-center p-8 bg-slate-50 dark:bg-slate-950">
        <div className="bg-white dark:bg-slate-900 p-12 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-2xl max-w-xl w-full">
           {sessionStep === 'cashier' ? (
             <div className="space-y-8 animate-fadeIn">
                <div className="text-center">
                   <div className="w-20 h-20 bg-purple-600/10 text-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-purple-900/10"><Monitor size={40}/></div>
                   <h2 className="text-2xl font-black uppercase tracking-tighter">Ouverture de Session</h2>
                   <p className="text-sm text-slate-500 font-medium">Sélectionnez votre profil caissier</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {APP_USERS.filter(u => u.role === 'admin' || u.role === 'cashier').map(user => (
                    <button key={user.id} onClick={() => setSelectedCashierId(user.id)} className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center space-y-3 ${selectedCashierId === user.id ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/10' : 'border-slate-100 dark:border-slate-800 hover:border-purple-200'}`}>
                       <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${user.color} flex items-center justify-center text-white font-black shadow-md`}>{user.initials}</div>
                       <span className="text-[10px] font-black uppercase tracking-widest">{user.name}</span>
                    </button>
                  ))}
                </div>
                <button disabled={!selectedCashierId} onClick={() => setSessionStep('balance')} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest disabled:opacity-20 transition-all shadow-xl hover:bg-black">Suivant</button>
             </div>
           ) : (
             <div className="space-y-8 animate-fadeIn">
                <button onClick={() => setSessionStep('cashier')} className="text-slate-400 hover:text-slate-900 flex items-center text-[10px] font-black uppercase"><ChevronLeft size={16}/> Retour</button>
                <div className="text-center">
                   <h2 className="text-2xl font-black uppercase tracking-tighter">Fonds de Caisse</h2>
                   <p className="text-sm text-slate-500 font-medium">Comptez les billets à l'ouverture</p>
                </div>
                <BillCounter counts={openingBillCounts} onChange={setOpeningBillCounts} currency={config.currency} />
                <button onClick={() => onOpenSession(calculatedOpeningBalance, selectedCashierId!)} className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-emerald-900/20 active:scale-95 transition-all hover:bg-emerald-700">Démarrer le Service</button>
             </div>
           )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-6 overflow-hidden animate-fadeIn">
       
       {/* HEADER POS */}
       <div className="bg-white dark:bg-slate-900 p-4 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between no-print">
          <div className="flex items-center space-x-6">
             <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black shadow-lg"><ShoppingBag size={20}/></div>
             <div>
                <h2 className="text-sm font-black uppercase tracking-tighter">Terminal {session.cashierName}</h2>
                <div className="flex items-center space-x-2 text-[8px] font-black uppercase tracking-widest mt-0.5">
                   <span className="text-emerald-500 flex items-center"><Zap size={10} className="mr-1"/> Prêt</span>
                   <span className="text-slate-300">|</span>
                   <span className="text-slate-400">{activeTables.length} Tables Actives</span>
                </div>
             </div>
          </div>

          {/* BARRE D'ONGLETS MULTI-COMMANDES */}
          {activeTables.length > 0 && (
            <div className="flex-1 px-8 flex items-center space-x-2 overflow-x-auto scrollbar-hide">
               {activeTables.map(tableName => {
                 const cart = pendingCarts[tableName] || [];
                 const tableTotal = cart.reduce((acc, i) => acc + (i.product.price * i.qty), 0);
                 return (
                   <button 
                     key={tableName} 
                     onClick={() => setActiveLocation(tableName)}
                     className={`px-4 py-2 rounded-xl border-2 transition-all flex items-center space-x-3 whitespace-nowrap ${activeLocation === tableName ? 'bg-purple-600 border-purple-400 text-white shadow-lg' : 'bg-slate-50 dark:bg-slate-800 border-transparent text-slate-400 hover:bg-slate-100'}`}
                   >
                     <span className="text-[9px] font-black uppercase">{tableName}</span>
                     <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${activeLocation === tableName ? 'bg-white/20' : 'bg-slate-200 dark:bg-slate-700'}`}>{tableTotal.toLocaleString()}</span>
                   </button>
                 );
               })}
            </div>
          )}

          <div className="flex items-center space-x-2">
             <button onClick={() => setShowHistoryModal(true)} className="p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-400 rounded-xl hover:bg-slate-100 transition-all"><History size={18}/></button>
             <button onClick={() => setShowClosingModal(true)} className="bg-rose-600 text-white px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-rose-900/20 hover:bg-rose-700 transition-all">Clôturer</button>
          </div>
       </div>

       {!activeLocation ? (
         /* PLAN DE SALLE / SÉLECTION DE TABLE */
         <div className="flex-1 overflow-y-auto scrollbar-hide space-y-12 pb-10">
           {allLocations.map((group) => (
             <div key={group.category} className="space-y-6">
               <div className="flex items-center space-x-4 ml-2">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">{group.category}</h3>
                  <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800"></div>
               </div>
               <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                 {group.items.map((loc) => {
                   const cart = pendingCarts[loc.id] || [];
                   const isOccupied = cart.length > 0;
                   const cartTotal = cart.reduce((acc, curr) => acc + (curr.product.price * curr.qty), 0);
                   const itemsCount = cart.reduce((acc, curr) => acc + curr.qty, 0);
                   
                   return (
                     <button 
                       key={loc.id} 
                       onClick={() => setActiveLocation(loc.id)} 
                       className={`relative h-40 rounded-[2.5rem] border-2 transition-all flex flex-col items-center justify-center p-6 group hover:-translate-y-1 hover:shadow-2xl ${isOccupied ? 'bg-purple-600 border-purple-400 text-white shadow-xl shadow-purple-900/20 animate-pulse' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-400 hover:border-purple-200'}`}
                     >
                       <loc.icon size={28} className={`mb-3 transition-transform group-hover:scale-110 ${isOccupied ? 'text-white' : 'text-slate-300'}`} />
                       <span className="text-[10px] font-black uppercase tracking-widest leading-none">{loc.label}</span>
                       
                       {isOccupied && (
                         <div className="mt-3 flex flex-col items-center">
                           <span className="text-lg font-black">{cartTotal.toLocaleString()}</span>
                           <span className="text-[8px] font-bold uppercase opacity-60">{itemsCount} Articles</span>
                         </div>
                       )}

                       {!isOccupied && (
                         <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Plus size={24} className="text-purple-600" />
                         </div>
                       )}
                     </button>
                   );
                 })}
               </div>
             </div>
           ))}
         </div>
       ) : (
         /* INTERFACE DE VENTE ACTIVE */
         <div className="flex-1 grid grid-cols-12 gap-8 overflow-hidden animate-fadeIn">
            {/* ZONE ARTICLES */}
            <div className="col-span-8 flex flex-col space-y-6 overflow-hidden">
               <div className="flex items-center space-x-4">
                  <button onClick={() => setActiveLocation(null)} className="p-4 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 hover:text-purple-600 transition-all flex items-center space-x-2">
                    <Layers size={18} />
                    <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Plan Salle</span>
                  </button>
                  <div className="flex-1 relative">
                     <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                     <input 
                       value={search} 
                       onChange={e => setSearch(e.target.value)} 
                       placeholder="Chercher un article..." 
                       className="w-full pl-12 pr-6 py-4 bg-white dark:bg-slate-900 border-none rounded-2xl text-xs font-bold shadow-sm focus:ring-2 focus:ring-purple-500 outline-none" 
                     />
                  </div>
                  <div className="flex bg-white dark:bg-slate-900 p-1.5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-x-auto scrollbar-hide">
                     <button onClick={() => setActiveCategory('Tous')} className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeCategory === 'Tous' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400'}`}>Tous</button>
                     {config.categories.map(cat => (
                       <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeCategory === cat ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400'}`}>{cat}</button>
                     ))}
                  </div>
               </div>

               <div className="flex-1 overflow-y-auto pr-2 space-y-8 scrollbar-hide pb-10">
                  {groupedProducts.map(group => (
                     <div key={group.name} className="space-y-4">
                        <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] ml-2">{group.name}</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                           {group.items.map(p => (
                              <button 
                                key={p.id} 
                                onClick={() => addToCart(p)} 
                                className={`bg-white dark:bg-slate-900 p-5 rounded-[2rem] border-2 shadow-sm transition-all text-left flex flex-col justify-between group hover:-translate-y-1 hover:shadow-xl relative overflow-hidden h-40 ${bumpedProductId === p.id ? 'border-purple-600 scale-95' : 'border-transparent hover:border-purple-500/30'}`}
                              >
                                 <div className="space-y-1">
                                    <p className="text-xs font-black uppercase text-slate-800 dark:text-slate-100 leading-tight group-hover:text-purple-600 transition-colors">{p.name}</p>
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{p.category}</p>
                                 </div>
                                 <div className="mt-4 flex items-center justify-between">
                                    <span className="text-sm font-black text-slate-900 dark:text-white">{p.price.toLocaleString()} <span className="text-[9px] opacity-40 uppercase">{config.currency}</span></span>
                                    <div className="p-2 bg-purple-50 dark:bg-purple-900/20 text-purple-600 rounded-xl opacity-0 group-hover:opacity-100 transition-all"><Plus size={14}/></div>
                                 </div>
                              </button>
                           ))}
                        </div>
                     </div>
                  ))}
               </div>
            </div>

            {/* ZONE PANIER / COMMANDE ACTIVE */}
            <div className="col-span-4 flex flex-col space-y-6 overflow-hidden">
               <div className={`bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col flex-1 transition-all ${isCartBouncing ? 'scale-[1.02]' : ''}`}>
                  <div className="p-6 border-b dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between">
                     <div className="flex items-center space-x-3">
                        <div className="p-2 bg-purple-600 text-white rounded-xl shadow-lg shadow-purple-500/20"><ShoppingBag size={18}/></div>
                        <div>
                           <h3 className="text-xs font-black uppercase tracking-widest leading-none">{activeLocation}</h3>
                           <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Commande en cours</span>
                        </div>
                     </div>
                     <div className="flex items-center space-x-1">
                        <button onClick={() => setShowTransferModal(true)} className="p-2 text-slate-400 hover:text-blue-500 transition-all" title="Transférer Table"><ArrowLeftRight size={18}/></button>
                        <button onClick={() => setPendingCarts(prev => {
                          const next = { ...prev };
                          if (activeLocation) next[activeLocation] = [];
                          return next;
                        })} className="p-2 text-slate-300 hover:text-rose-500 transition-all"><Trash2 size={18}/></button>
                     </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 space-y-4 force-scrollbar">
                     {currentCart.map(item => (
                        <div key={item.product.id} className="flex items-center justify-between group animate-fadeIn bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-transparent hover:border-purple-100 transition-all">
                           <div className="flex flex-col flex-1 min-w-0 pr-3">
                              <span className="text-xs font-black uppercase text-slate-800 dark:text-slate-100 truncate">{item.product.name}</span>
                              <span className="text-[9px] font-bold text-slate-400">{(item.product.price).toLocaleString()} {config.currency} / u</span>
                           </div>
                           <div className="flex items-center space-x-3">
                              <div className="flex items-center bg-white dark:bg-slate-900 rounded-xl p-1 shadow-sm border border-slate-100 dark:border-slate-700">
                                 <button onClick={() => adjustQty(item.product.id, -1)} className="p-1 text-slate-400 hover:text-rose-500 transition-colors"><Minus size={12}/></button>
                                 <span className="px-3 text-xs font-black">{item.qty}</span>
                                 <button onClick={() => addToCart(item.product)} className="p-1 text-slate-400 hover:text-emerald-500 transition-colors"><Plus size={12}/></button>
                              </div>
                           </div>
                        </div>
                     ))}
                     {currentCart.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center space-y-4 opacity-20 py-20 text-center">
                           <Utensils size={64} className="mb-2" />
                           <p className="font-black uppercase text-[10px] tracking-widest leading-loose text-slate-400">Table vide.<br/>Sélectionnez des articles.</p>
                        </div>
                     )}
                  </div>

                  <div className="p-6 bg-slate-900 text-white rounded-t-[3rem] space-y-6 shadow-inner">
                     <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50">Total Net</span>
                        <span className="text-3xl font-black tracking-tighter">{total.toLocaleString()} <span className="text-sm opacity-40 font-normal uppercase">{config.currency}</span></span>
                     </div>
                     
                     <div className="space-y-3">
                        <div className="relative">
                           <Banknote className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={20} />
                           <input 
                             type="number" 
                             value={receivedAmount} 
                             onChange={e => setReceivedAmount(e.target.value)} 
                             placeholder="Montant Reçu" 
                             className="payment-input w-full pl-12 pr-6 py-4 bg-white/10 border-2 border-white/5 focus:border-purple-500 rounded-2xl font-black text-lg outline-none placeholder:text-white/10 transition-all" 
                           />
                        </div>
                        {changeDue > 0 && (
                          <div className="flex justify-between items-center px-5 py-4 bg-emerald-500/20 border border-emerald-500/30 rounded-2xl animate-slideUp">
                             <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">Rendu</span>
                             <span className="text-xl font-black text-emerald-400">{changeDue.toLocaleString()}</span>
                          </div>
                        )}
                     </div>

                     <div className="grid grid-cols-3 gap-2 pt-2">
                        <button disabled={total === 0} onClick={() => handleSimplePayment('Especes')} className="py-4 bg-emerald-600 hover:bg-emerald-700 rounded-2xl font-black uppercase text-[8px] tracking-widest transition-all shadow-xl disabled:opacity-20 flex flex-col items-center group active:scale-95">
                           <Banknote size={20} className="mb-1 group-hover:scale-110" />
                           Espèces
                        </button>
                        <button disabled={total === 0} onClick={() => handleSimplePayment('Bankily')} className="py-4 bg-orange-600 hover:bg-orange-700 rounded-2xl font-black uppercase text-[8px] tracking-widest transition-all shadow-xl disabled:opacity-20 flex flex-col items-center group active:scale-95">
                           <Smartphone size={20} className="mb-1 group-hover:scale-110" />
                           Bankily
                        </button>
                        <button disabled={total === 0} onClick={() => handleSimplePayment('Masrvi')} className="py-4 bg-blue-600 hover:bg-blue-700 rounded-2xl font-black uppercase text-[8px] tracking-widest transition-all shadow-xl disabled:opacity-20 flex flex-col items-center group active:scale-95">
                           <Wallet size={20} className="mb-1 group-hover:scale-110" />
                           Masrvi
                        </button>
                     </div>
                  </div>
               </div>
            </div>
         </div>
       )}

       {/* MODAL TRANSFERT TABLE */}
       {showTransferModal && (
          <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[210] flex items-center justify-center p-6 animate-fadeIn">
             <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-[3rem] shadow-2xl border border-white/10 overflow-hidden animate-scaleIn">
                <div className="p-8 border-b dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                   <div>
                      <h3 className="text-xl font-black uppercase tracking-tighter">Transférer la Commande</h3>
                      <p className="text-[10px] font-black uppercase text-slate-400 mt-1">De : {activeLocation} vers une nouvelle destination</p>
                   </div>
                   <button onClick={() => setShowTransferModal(false)} className="p-2 hover:bg-rose-50 hover:text-rose-600 rounded-full transition-all"><X size={28}/></button>
                </div>
                <div className="p-10 grid grid-cols-3 gap-4 max-h-[70vh] overflow-y-auto scrollbar-hide">
                   {allLocations.flatMap(g => g.items).filter(loc => loc.id !== activeLocation).map(loc => {
                     const isTargetOccupied = (pendingCarts[loc.id] || []).length > 0;
                     return (
                        <button 
                          key={loc.id} 
                          onClick={() => transferOrder(loc.id)}
                          className={`p-6 rounded-3xl border-2 flex flex-col items-center transition-all ${isTargetOccupied ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/10' : 'border-slate-100 dark:border-slate-800 hover:border-blue-500'}`}
                        >
                           <loc.icon size={24} className={isTargetOccupied ? 'text-orange-500' : 'text-slate-300'} />
                           <span className="text-[10px] font-black uppercase mt-3">{loc.label}</span>
                           {isTargetOccupied && <span className="text-[8px] font-black text-orange-600 uppercase mt-1">Fusionner</span>}
                        </button>
                     );
                   })}
                </div>
             </div>
          </div>
       )}

       {/* MODAL CLÔTURE */}
       {showClosingModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[200] flex items-center justify-center p-4 animate-fadeIn">
             <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-[3rem] shadow-2xl border border-white/10 overflow-hidden animate-scaleIn">
                <div className="p-10 border-b dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/30">
                   <div>
                      <h3 className="text-xl font-black uppercase tracking-tighter text-rose-600">Fermeture de Session</h3>
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1">Audit final avant déconnexion</p>
                   </div>
                   <button onClick={() => setShowClosingModal(false)} className="p-2 hover:bg-rose-50 hover:text-rose-600 rounded-full transition-all"><X size={28}/></button>
                </div>
                <div className="p-10 space-y-8 max-h-[70vh] overflow-y-auto scrollbar-hide">
                   {activeTables.length > 0 && (
                     <div className="p-6 bg-orange-50 border-2 border-orange-200 rounded-3xl flex items-center space-x-4">
                        <AlertCircle className="text-orange-500" size={32}/>
                        <div>
                           <p className="text-xs font-black text-orange-800 uppercase">Attention</p>
                           <p className="text-[10px] font-bold text-orange-700">Il reste {activeTables.length} commande(s) non encaissée(s) !</p>
                        </div>
                     </div>
                   )}
                   <div className="grid grid-cols-2 gap-6">
                      <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-3xl space-y-2 border border-slate-100 dark:border-slate-700 shadow-sm">
                         <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Recettes encaissées</span>
                         <p className="text-2xl font-black">{(currentExpectedBalance - session.openingBalance).toLocaleString()} <span className="text-xs opacity-40 uppercase">{config.currency}</span></p>
                      </div>
                      <div className="p-6 bg-slate-900 text-white rounded-3xl space-y-2 border border-white/10 shadow-lg">
                         <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Fonds Théoriques</span>
                         <p className="text-2xl font-black text-emerald-400">{currentExpectedBalance.toLocaleString()} <span className="text-xs opacity-40 text-white uppercase">{config.currency}</span></p>
                      </div>
                   </div>
                   <div className="space-y-4">
                      <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Comptage Espèces</h4>
                      <BillCounter counts={closingBillCounts} onChange={setClosingBillCounts} currency={config.currency} />
                   </div>
                   
                   <button 
                     onClick={() => { onCloseSession(calculatedClosingBalance); setShowClosingModal(false); }} 
                     className="w-full py-6 bg-rose-600 text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl hover:bg-rose-700 active:scale-95 transition-all"
                   >
                     Valider & Fermer le Terminal
                   </button>
                </div>
             </div>
          </div>
       )}

       {/* MODAL HISTORIQUE SESSION */}
       {showHistoryModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[200] flex items-center justify-center p-4 animate-fadeIn">
             <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-[3rem] shadow-2xl border border-white/10 overflow-hidden animate-scaleIn">
                <div className="p-8 border-b dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                   <h3 className="text-xl font-black uppercase tracking-tighter">Flux de Session</h3>
                   <button onClick={() => setShowHistoryModal(false)} className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-full hover:bg-rose-50 hover:text-rose-600 transition-all shadow-sm"><X size={24}/></button>
                </div>
                <div className="p-8 max-h-[60vh] overflow-y-auto space-y-4 scrollbar-hide">
                   {sessionSales.length > 0 ? sessionSales.map((sale) => (
                      <div key={sale.id} className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 flex items-center justify-between transition-all hover:border-purple-400 group">
                         <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform"><CheckCircle2 size={24} className="text-emerald-500"/></div>
                            <div>
                               <p className="text-xs font-black uppercase text-slate-800 dark:text-slate-100">{sale.customer}</p>
                               <p className="text-[9px] font-bold text-slate-400 mt-0.5">{new Date(sale.date).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})} • #{sale.id.slice(-6)}</p>
                            </div>
                         </div>
                         <div className="text-right">
                            <span className="text-sm font-black text-slate-900 dark:text-white">{sale.total.toLocaleString()} {config.currency}</span>
                            <div className="flex items-center justify-end space-x-1 mt-1 opacity-60">
                               <Smartphone size={10} className="text-slate-400"/>
                               <span className="text-[8px] font-black uppercase">{sale.paymentMethod}</span>
                            </div>
                         </div>
                      </div>
                   )) : (
                      <div className="py-20 text-center opacity-20">
                         <History size={64} className="mx-auto mb-4" />
                         <p className="font-black uppercase text-xs tracking-widest">Aucune vente enregistrée</p>
                      </div>
                   )}
                </div>
             </div>
          </div>
       )}
    </div>
  );
};

export default POS;