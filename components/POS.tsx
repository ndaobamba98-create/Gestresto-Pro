
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Product, SaleOrder, ERPConfig, CashSession, PaymentMethod } from '../types';
import { 
  Search, Plus, Minus, Trash2, ShoppingBag, Monitor, Banknote, ChevronLeft, 
  Package, History, X, Smartphone, Wallet, 
  CheckCircle2, Zap, LayoutGrid, ChevronRight, Coins, Utensils, Coffee, Truck, User, Calculator, ArrowRight, AlertTriangle, RotateCcw, ArrowRightLeft, MoveHorizontal
} from 'lucide-react';
import { APP_USERS, POS_LOCATIONS } from '../constants';

interface CartItem {
  product: Product;
  qty: number;
}

// Classé du plus grand au plus petit pour une meilleure ergonomie de comptage
const DENOMINATIONS = [1000, 500, 200, 100, 50, 20, 10];

interface Props {
  products: Product[];
  sales: SaleOrder[];
  onSaleComplete: (sale: Partial<SaleOrder>) => void;
  onRefundSale: (saleId: string) => void;
  config: ERPConfig;
  session: CashSession | null;
  onOpenSession: (openingBalance: number, cashierId: string) => void;
  onCloseSession: (closingBalance: number) => void;
  notify: (title: string, message: string, type?: 'success' | 'info' | 'warning') => void;
}

const POS: React.FC<Props> = ({ products, config, session, onOpenSession, onCloseSession, onSaleComplete, notify, sales, onRefundSale }) => {
  const [pendingCarts, setPendingCarts] = useState<Record<string, CartItem[]>>(() => {
    const saved = localStorage.getItem('sama_pos_pending_carts');
    return saved ? JSON.parse(saved) : {};
  });

  const [activeLocation, setActiveLocation] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('Tous');
  const [receivedAmount, setReceivedAmount] = useState<string>('');

  const [sessionStep, setSessionStep] = useState<'cashier' | 'counting'>('cashier');
  const [selectedCashierId, setSelectedCashierId] = useState<string | null>(null);
  const [showClosingModal, setShowClosingModal] = useState(false);
  const [showSalesHistory, setShowSalesHistory] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  
  const [counts, setCounts] = useState<Record<number, number>>(
    DENOMINATIONS.reduce((acc, d) => ({ ...acc, [d]: 0 }), {})
  );

  const totalCounted = useMemo(() => 
    DENOMINATIONS.reduce((sum, d) => sum + (d * (counts[d] || 0)), 0)
  , [counts]);

  const sessionSales = useMemo(() => {
    if (!session) return [];
    return sales.filter(s => s.date >= session.openedAt && s.status !== 'refunded');
  }, [sales, session]);

  const sessionCashSales = useMemo(() => {
    return sessionSales
      .filter(s => s.paymentMethod === 'Especes')
      .reduce((sum, s) => sum + s.total, 0);
  }, [sessionSales]);

  const expectedClosingBalance = (session?.openingBalance || 0) + sessionCashSales;
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
      
      // Fusion intelligente : on combine les quantités si le produit existe déjà
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

    notify("Transfert Réussi", `Commande déplacée de ${activeLocation} vers ${target}`, "success");
    setActiveLocation(target);
    setShowTransferModal(false);
  };

  const handleSimplePayment = useCallback((method: PaymentMethod) => {
    if (!activeLocation || currentCart.length === 0) return;
    const amountReceivedVal = parseFloat(receivedAmount) || total;
    
    onSaleComplete({
      total,
      customer: 'Client ' + activeLocation,
      items: currentCart.map(i => ({ productId: i.product.id, name: i.product.name, quantity: i.qty, price: i.product.price })),
      payments: [{ method, amount: total }],
      paymentMethod: method,
      amountReceived: amountReceivedVal,
      change: changeDue,
      orderLocation: activeLocation,
      status: 'confirmed'
    });

    setPendingCarts(prev => {
      const newState = { ...prev };
      delete newState[activeLocation];
      return newState;
    });
    setReceivedAmount('');
    setActiveLocation(null);
  }, [activeLocation, currentCart, onSaleComplete, receivedAmount, total, changeDue]);

  // COMPOSANT COMPTEUR DE BILLETS OPTIMISÉ (TAILLE RÉDUITE)
  const CashCounter = () => (
    <div className="space-y-2">
      {DENOMINATIONS.map(val => (
        <div key={val} className="flex items-center bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 transition-all hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm">
          <div className="w-14 h-8 bg-slate-900 text-white rounded-lg flex items-center justify-center font-black text-[11px] shadow-sm mr-4 shrink-0">
            {val}
          </div>
          <div className="flex-1 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button 
                type="button"
                onClick={() => setCounts(v => ({...v, [val]: Math.max(0, (v[val] || 0) - 1)}))} 
                className="w-8 h-8 rounded-lg bg-white dark:bg-slate-700 border flex items-center justify-center text-slate-400 hover:text-rose-500 transition-all shadow-xs"
              >
                <Minus size={14}/>
              </button>
              <input 
                type="number" 
                value={counts[val] || ''} 
                onChange={e => setCounts(v => ({...v, [val]: parseInt(e.target.value) || 0}))} 
                className="w-14 text-center bg-transparent font-black text-sm outline-none border-b-2 border-slate-200 dark:border-slate-700 focus:border-purple-500" 
                placeholder="0"
              />
              <button 
                type="button"
                onClick={() => setCounts(v => ({...v, [val]: (v[val] || 0) + 1}))} 
                className="w-8 h-8 rounded-lg bg-white dark:bg-slate-700 border flex items-center justify-center text-slate-400 hover:text-emerald-500 transition-all shadow-xs"
              >
                <Plus size={14}/>
              </button>
            </div>
            <div className="text-right ml-4">
              <span className="text-[10px] font-black text-slate-900 dark:text-white">
                {(val * (counts[val] || 0)).toLocaleString()} <span className="text-[8px] opacity-40">{config.currency}</span>
              </span>
            </div>
          </div>
        </div>
      ))}
      <div className="mt-4 p-4 bg-slate-900 text-white rounded-2xl flex justify-between items-center shadow-lg">
        <span className="text-[10px] font-black uppercase tracking-widest text-purple-400">Total Compté</span>
        <span className="text-xl font-black">{totalCounted.toLocaleString()} <span className="text-xs opacity-40">{config.currency}</span></span>
      </div>
    </div>
  );

  if (!session) {
    return (
      <div className="h-full flex items-center justify-center p-8 bg-slate-50 dark:bg-slate-950">
        <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full">
           {sessionStep === 'cashier' ? (
             <div className="space-y-8 animate-fadeIn">
                <div className="text-center">
                   <div className="w-16 h-16 bg-purple-600/10 text-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-purple-900/10"><User size={32}/></div>
                   <h2 className="text-xl font-black uppercase tracking-tighter">Ouverture de Session</h2>
                   <p className="text-xs text-slate-500 font-medium">Sélectionnez votre profil</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {APP_USERS.filter(u => u.role === 'admin' || u.role === 'cashier').map(user => (
                    <button key={user.id} onClick={() => setSelectedCashierId(user.id)} className={`p-5 rounded-2xl border-2 transition-all flex flex-col items-center space-y-2 ${selectedCashierId === user.id ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/10' : 'border-slate-100 dark:border-slate-800 hover:border-purple-200'}`}>
                       <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${user.color} flex items-center justify-center text-white font-black shadow-md text-xs`}>{user.initials}</div>
                       <span className="text-[9px] font-black uppercase tracking-widest">{user.name}</span>
                    </button>
                  ))}
                </div>
                <button disabled={!selectedCashierId} onClick={() => setSessionStep('counting')} className="w-full py-4 bg-slate-900 text-white rounded-xl font-black uppercase text-[10px] tracking-widest disabled:opacity-20 transition-all shadow-xl hover:bg-black flex items-center justify-center">Suivant <ArrowRight size={14} className="ml-2"/></button>
             </div>
           ) : (
             <div className="space-y-6 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <button onClick={() => setSessionStep('cashier')} className="text-slate-400 hover:text-slate-900 flex items-center text-[9px] font-black uppercase"><ChevronLeft size={14}/> Retour</button>
                  <span className="text-[9px] font-black text-purple-600 uppercase tracking-widest">Initialisation Caisse</span>
                </div>
                <CashCounter />
                <button 
                  onClick={() => onOpenSession(totalCounted, selectedCashierId!)} 
                  className="w-full py-4 bg-emerald-600 text-white rounded-xl font-black uppercase text-[10px] tracking-[0.1em] shadow-xl shadow-emerald-900/20 active:scale-95 transition-all hover:bg-emerald-700"
                >
                  Ouvrir avec {totalCounted.toLocaleString()} {config.currency}
                </button>
             </div>
           )}
        </div>
      </div>
    );
  }

  const LocationBtn = ({ loc, icon: Icon, key: k, compact = false, onClick }: { loc: string, icon?: any, key?: any, compact?: boolean, onClick?: () => void }) => {
    const itemCount = pendingCarts[loc]?.reduce((sum, i) => sum + i.qty, 0) || 0;
    const isOccupied = itemCount > 0;
    
    return (
      <button 
        key={k}
        onClick={onClick ? onClick : () => setActiveLocation(loc)} 
        className={`relative ${compact ? 'h-20 rounded-2xl' : 'h-32 rounded-[2rem]'} border-2 transition-all flex flex-col items-center justify-center space-y-2 group ${isOccupied ? 'bg-purple-600 border-purple-600 text-white shadow-xl shadow-purple-900/20' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-purple-300'}`}
      >
        {Icon ? (
          <Icon size={compact ? 16 : 20} className={isOccupied ? 'text-white' : 'text-slate-300 group-hover:text-purple-400'} />
        ) : (
          <Utensils size={compact ? 14 : 18} className={isOccupied ? 'text-white/50' : 'text-slate-200'} />
        )}
        <span className={`font-black uppercase ${compact ? 'text-[8px]' : 'text-[10px]'} tracking-widest text-center px-2`}>{loc}</span>
        {isOccupied && (
          <span className={`absolute -top-1.5 -right-1.5 ${compact ? 'w-5 h-5' : 'w-7 h-7'} bg-white text-purple-600 rounded-full flex items-center justify-center font-black text-[9px] shadow-lg border-2 border-purple-600 ${compact ? '' : 'animate-bounce'}`}>
            {itemCount}
          </span>
        )}
      </button>
    );
  };

  return (
    <div className="h-full flex flex-col space-y-4 overflow-hidden animate-fadeIn">
       
       <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div className="flex items-center space-x-6">
             <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black shadow-lg"><ShoppingBag size={20}/></div>
             <div>
                <h2 className="text-sm font-black uppercase tracking-tighter">Caisse - {session.cashierName}</h2>
                <div className="flex items-center space-x-2 text-[8px] font-black uppercase tracking-widest mt-0.5">
                   <span className="text-emerald-500 flex items-center"><Zap size={10} className="mr-1"/> Session Active</span>
                   <span className="text-slate-400">| Fond: {session.openingBalance.toLocaleString()} {config.currency}</span>
                </div>
             </div>
          </div>

          <div className="flex items-center space-x-3">
             <div className="flex bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-2 border">
                <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">En cours : {Object.keys(pendingCarts).length}</span>
             </div>
             <button 
                onClick={() => setShowSalesHistory(true)} 
                className="flex items-center space-x-2 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm"
             >
                <History size={14} className="text-purple-600"/>
                <span>Ventes Session</span>
             </button>
             <button onClick={() => { setCounts(DENOMINATIONS.reduce((acc, d) => ({ ...acc, [d]: 0 }), {})); setShowClosingModal(true); }} className="bg-rose-600 text-white px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg hover:bg-rose-700 transition-all">Clôturer</button>
          </div>
       </div>

       {!activeLocation ? (
         <div className="flex-1 bg-white dark:bg-slate-900 rounded-[3rem] p-10 border border-slate-200 dark:border-slate-800 shadow-inner overflow-y-auto scrollbar-hide space-y-12">
            <div className="flex items-center justify-between">
               <div className="flex items-center space-x-4">
                  <LayoutGrid className="text-purple-600" />
                  <h3 className="text-xl font-black uppercase tracking-tighter">Plan de Salle</h3>
               </div>
               <button onClick={() => setActiveLocation('Comptoir')} className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center hover:bg-black transition-all">
                  <ShoppingBag size={18} className="mr-3"/> Vente Comptoir Directe
               </button>
            </div>
            
            <div className="space-y-4">
               <div className="flex items-center space-x-2 px-2">
                  <Utensils size={14} className="text-slate-400" />
                  <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Espace Salles</h4>
               </div>
               <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                  {POS_LOCATIONS.tables.map(loc => <LocationBtn key={loc} loc={loc} />)}
               </div>
            </div>

            <div className="space-y-4">
               <div className="flex items-center space-x-2 px-2">
                  <Coffee size={14} className="text-slate-400" />
                  <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Espace Tabourets</h4>
               </div>
               <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                  {POS_LOCATIONS.bar.map(loc => <LocationBtn key={loc} loc={loc} />)}
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
               <div className="space-y-4">
                  <div className="flex items-center space-x-2 px-2">
                     <Package size={14} className="text-slate-400" />
                     <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">À Emporter</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                     {POS_LOCATIONS.takeaway.map(loc => <LocationBtn key={loc} loc={loc} icon={Package} />)}
                  </div>
               </div>
               <div className="space-y-4">
                  <div className="flex items-center space-x-2 px-2">
                     <Truck size={14} className="text-slate-400" />
                     <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Livraisons</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                     {POS_LOCATIONS.delivery.map(loc => <LocationBtn key={loc} loc={loc} icon={Truck} />)}
                  </div>
               </div>
            </div>
         </div>
       ) : (
         <div className="flex-1 grid grid-cols-12 gap-6 overflow-hidden animate-fadeIn">
            <div className="col-span-8 flex flex-col space-y-4 overflow-hidden">
               <div className="flex items-center space-x-3">
                  <button onClick={() => setActiveLocation(null)} className="p-4 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 hover:text-purple-600 transition-all flex items-center space-x-2">
                    <ChevronLeft size={18} />
                    <span className="text-[10px] font-black uppercase">Plan Salles</span>
                  </button>
                  <div className="flex-1 relative">
                     <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                     <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Chercher un plat..." className="w-full pl-12 pr-6 py-4 bg-white dark:bg-slate-900 rounded-2xl text-xs font-bold shadow-sm focus:ring-2 focus:ring-purple-500 outline-none border border-slate-100 dark:border-slate-800" />
                  </div>
               </div>

               <div className="flex space-x-2 overflow-x-auto scrollbar-hide pb-2">
                  {categories.map(cat => (
                    <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-6 py-3 rounded-xl text-[9px] font-black uppercase whitespace-nowrap transition-all border ${activeCategory === cat ? 'bg-purple-600 border-purple-600 text-white shadow-md' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-400'}`}>
                       {cat}
                    </button>
                  ))}
               </div>

               <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 scrollbar-hide pb-10">
                  {filteredProducts.map(p => (
                     <button key={p.id} onClick={() => addToCart(p)} className="bg-white dark:bg-slate-900 p-4 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm text-left flex flex-col justify-between hover:border-purple-500 hover:shadow-xl transition-all h-36 group active:scale-95">
                        <div className="space-y-1">
                           <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">{p.category}</span>
                           <h4 className="text-[11px] font-black uppercase leading-tight text-slate-800 dark:text-slate-100 group-hover:text-purple-600">{p.name}</h4>
                        </div>
                        <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-50 dark:border-slate-800">
                           <span className="text-sm font-black text-slate-900 dark:text-white">{p.price.toLocaleString()} <span className="text-[9px] opacity-40">{config.currency}</span></span>
                           <div className="p-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-300 group-hover:bg-purple-50 group-hover:text-purple-600 transition-colors">
                              <Plus size={14}/>
                           </div>
                        </div>
                     </button>
                  ))}
               </div>
            </div>

            <div className="col-span-4 flex flex-col space-y-4 overflow-hidden">
               <div className="bg-white dark:bg-slate-900 rounded-[3.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col flex-1 relative text-slate-900 dark:text-white">
                  <div className="p-6 border-b dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between">
                     <div className="flex items-center space-x-3">
                        <div className="p-2 bg-purple-600 text-white rounded-xl shadow-lg"><ShoppingBag size={18}/></div>
                        <h3 className="text-xs font-black uppercase tracking-widest leading-none">{activeLocation}</h3>
                     </div>
                     <div className="flex items-center space-x-2">
                        <button onClick={() => setShowTransferModal(true)} className="p-2 text-slate-300 hover:text-purple-600 transition-all" title="Transférer commande">
                           <ArrowRightLeft size={18}/>
                        </button>
                        <button onClick={() => setPendingCarts(prev => ({ ...prev, [activeLocation!]: [] }))} className="p-2 text-slate-300 hover:text-rose-500 transition-all">
                           <Trash2 size={18}/>
                        </button>
                     </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide">
                     {currentCart.map(item => (
                        <div key={item.product.id} className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-transparent hover:border-purple-100 transition-all">
                           <div className="flex flex-col flex-1 min-w-0 pr-3">
                              <span className="text-[11px] font-black uppercase truncate">{item.product.name}</span>
                              <span className="text-[9px] font-bold text-slate-400">{(item.product.price * item.qty).toLocaleString()} {config.currency}</span>
                           </div>
                           <div className="flex items-center bg-white dark:bg-slate-900 rounded-xl p-1 shadow-sm border border-slate-100 dark:border-slate-700">
                              <button onClick={() => adjustQty(item.product.id, -1)} className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors"><Minus size={12}/></button>
                              <span className="px-3 text-xs font-black">{item.qty}</span>
                              <button onClick={() => addToCart(item.product)} className="p-1.5 text-slate-400 hover:text-emerald-500 transition-colors"><Plus size={12}/></button>
                           </div>
                        </div>
                     ))}
                  </div>

                  <div className="p-6 bg-slate-900 text-white rounded-t-[3.5rem] space-y-6 shadow-2xl">
                     <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">À Encaisser</span>
                        <div className="text-right">
                           <span className="text-3xl font-black tracking-tighter">{total.toLocaleString()}</span>
                           <span className="ml-2 text-xs font-bold text-purple-400 uppercase">{config.currency}</span>
                        </div>
                     </div>
                     <div className="grid grid-cols-3 gap-3">
                        <button disabled={total === 0} onClick={() => handleSimplePayment('Especes')} className="py-4 bg-emerald-600 hover:bg-emerald-700 rounded-2xl font-black uppercase text-[8px] flex flex-col items-center justify-center space-y-2 transition-all disabled:opacity-30 shadow-lg"><Coins size={20} /><span>Espèces</span></button>
                        <button disabled={total === 0} onClick={() => handleSimplePayment('Bankily')} className="py-4 bg-orange-600 hover:bg-orange-700 rounded-2xl font-black uppercase text-[8px] flex flex-col items-center justify-center space-y-2 transition-all disabled:opacity-30 shadow-lg"><Smartphone size={20} /><span>Bankily</span></button>
                        <button disabled={total === 0} onClick={() => handleSimplePayment('Masrvi')} className="py-4 bg-blue-600 hover:bg-blue-700 rounded-2xl font-black uppercase text-[8px] flex flex-col items-center justify-center space-y-2 transition-all disabled:opacity-30 shadow-lg"><Wallet size={20} /><span>Masrvi</span></button>
                     </div>
                  </div>
               </div>
            </div>
         </div>
       )}

       {/* MODAL TRANSFERT DE COMMANDE */}
       {showTransferModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[250] flex items-center justify-center p-4 animate-fadeIn">
             <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-[3rem] shadow-2xl border border-white/10 overflow-hidden animate-scaleIn flex flex-col max-h-[90vh]">
                <div className="p-8 border-b dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                   <div className="flex items-center space-x-4">
                      <div className="p-3 bg-purple-600 text-white rounded-2xl shadow-lg"><MoveHorizontal size={24}/></div>
                      <div>
                        <h3 className="text-lg font-black uppercase tracking-tighter text-slate-900 dark:text-white">Transférer la commande</h3>
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1">De : {activeLocation} → Vers destination</p>
                      </div>
                   </div>
                   <button onClick={() => setShowTransferModal(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-all text-slate-400"><X size={24}/></button>
                </div>
                
                <div className="p-8 overflow-y-auto space-y-8 scrollbar-hide">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                      <div className="space-y-4">
                         <div className="flex items-center space-x-2 px-2">
                            <Utensils size={14} className="text-slate-400" />
                            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Salles</h4>
                         </div>
                         <div className="grid grid-cols-2 gap-3">
                            {POS_LOCATIONS.tables.map(loc => <LocationBtn key={loc} loc={loc} compact onClick={() => handleTransferOrder(loc)} />)}
                         </div>
                      </div>
                      <div className="space-y-4">
                         <div className="flex items-center space-x-2 px-2">
                            <Coffee size={14} className="text-slate-400" />
                            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Tabourets</h4>
                         </div>
                         <div className="grid grid-cols-2 gap-3">
                            {POS_LOCATIONS.bar.map(loc => <LocationBtn key={loc} loc={loc} compact onClick={() => handleTransferOrder(loc)} />)}
                         </div>
                      </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                      <div className="space-y-4">
                         <div className="flex items-center space-x-2 px-2">
                            <Package size={14} className="text-slate-400" />
                            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">À Emporter</h4>
                         </div>
                         <div className="grid grid-cols-2 gap-3">
                            {POS_LOCATIONS.takeaway.map(loc => <LocationBtn key={loc} loc={loc} compact icon={Package} onClick={() => handleTransferOrder(loc)} />)}
                         </div>
                      </div>
                      <div className="space-y-4">
                         <div className="flex items-center space-x-2 px-2">
                            <Truck size={14} className="text-slate-400" />
                            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Livraisons</h4>
                         </div>
                         <div className="grid grid-cols-2 gap-3">
                            {POS_LOCATIONS.delivery.map(loc => <LocationBtn key={loc} loc={loc} compact icon={Truck} onClick={() => handleTransferOrder(loc)} />)}
                         </div>
                      </div>
                   </div>
                </div>
             </div>
          </div>
       )}

       {/* MODAL HISTORIQUE SESSION / ANNULATION */}
       {showSalesHistory && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[250] flex items-center justify-center p-4 animate-fadeIn">
             <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[3rem] shadow-2xl border border-white/10 overflow-hidden animate-scaleIn flex flex-col">
                <div className="p-6 border-b dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                   <div className="flex items-center space-x-3">
                      <div className="p-2 bg-purple-600 text-white rounded-xl shadow-lg"><History size={18}/></div>
                      <h3 className="text-sm font-black uppercase tracking-tighter text-slate-900 dark:text-white">Ventes de la Session</h3>
                   </div>
                   <button onClick={() => setShowSalesHistory(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-all text-slate-400"><X size={24}/></button>
                </div>
                <div className="p-6 max-h-[60vh] overflow-y-auto space-y-3 scrollbar-hide">
                   {sessionSales.length > 0 ? (
                      sessionSales.map(sale => (
                        <div key={sale.id} className="p-4 bg-white dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between group hover:border-purple-300 transition-all">
                           <div className="flex flex-col">
                              <span className="text-[10px] font-black uppercase text-purple-600">#{sale.id.slice(-8)}</span>
                              <span className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase mt-0.5">{sale.customer}</span>
                              <span className="text-[9px] font-bold text-slate-400 mt-0.5">{new Date(sale.date).toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'})} • {sale.paymentMethod}</span>
                           </div>
                           <div className="flex items-center space-x-6">
                              <div className="text-right">
                                 <span className="text-sm font-black text-slate-900 dark:text-white block">{sale.total.toLocaleString()} {config.currency}</span>
                              </div>
                              <button 
                                 onClick={() => { if(confirm("Voulez-vous vraiment annuler cette vente et réintégrer le stock ?")) { onRefundSale(sale.id); } }}
                                 className="p-3 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-xl hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                                 title="Annuler et Rembourser"
                              >
                                 <RotateCcw size={16} />
                              </button>
                           </div>
                        </div>
                      ))
                   ) : (
                      <div className="py-20 text-center flex flex-col items-center opacity-30">
                         <History size={48} className="mb-4" />
                         <p className="font-black uppercase text-xs tracking-widest">Aucune vente enregistrée dans cette session</p>
                      </div>
                   )}
                </div>
                <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t dark:border-slate-800 text-center">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Seules les ventes de la session actuelle sont modifiables ici</p>
                </div>
             </div>
          </div>
       )}

       {showClosingModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[250] flex items-center justify-center p-4 animate-fadeIn">
             <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] shadow-2xl border border-white/10 overflow-hidden animate-scaleIn">
                <div className="p-6 border-b dark:border-slate-800 flex justify-between items-center bg-rose-600 text-white">
                   <div className="flex items-center space-x-3">
                      <Calculator size={24} />
                      <div>
                         <h3 className="text-sm font-black uppercase tracking-tighter">Clôture Session</h3>
                         <p className="text-[9px] font-black uppercase opacity-60">{session.cashierName}</p>
                      </div>
                   </div>
                   <button onClick={() => setShowClosingModal(false)}><X size={24}/></button>
                </div>

                <div className="p-6 space-y-6 max-h-[85vh] overflow-y-auto scrollbar-hide">
                   <div className="space-y-4">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Décompte Final</h4>
                      <CashCounter />
                   </div>

                   <div className="space-y-6 bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <div className="space-y-2">
                         <div className="flex justify-between items-center text-[10px] font-bold">
                            <span className="text-slate-500 uppercase">Fond initial</span>
                            <span className="text-slate-900 dark:text-white">{session.openingBalance.toLocaleString()}</span>
                         </div>
                         <div className="flex justify-between items-center text-[10px] font-bold">
                            <span className="text-slate-500 uppercase">Ventes Espèces</span>
                            <span className="text-emerald-500">+{sessionCashSales.toLocaleString()}</span>
                         </div>
                         <div className="h-px bg-slate-200 dark:bg-slate-700"></div>
                         <div className="flex justify-between items-center">
                            <span className="text-[9px] font-black uppercase text-slate-400">Attendu</span>
                            <span className="text-md font-black text-slate-900 dark:text-white">{expectedClosingBalance.toLocaleString()} {config.currency}</span>
                         </div>
                      </div>

                      <div className={`p-4 rounded-xl border-2 flex flex-col items-center text-center space-y-1 ${cashDifference === 0 ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-rose-50 border-rose-200 text-rose-600'}`}>
                         <span className="text-[9px] font-black uppercase tracking-widest">Écart de Caisse</span>
                         <span className="text-xl font-black">{cashDifference > 0 ? '+' : ''}{cashDifference.toLocaleString()}</span>
                         <div className="flex items-center text-[8px] font-black uppercase">
                            {cashDifference === 0 ? <CheckCircle2 size={10} className="mr-1"/> : <AlertTriangle size={10} className="mr-1"/>}
                            {cashDifference === 0 ? 'Caisse juste' : cashDifference > 0 ? 'Excédent' : 'Manquant'}
                         </div>
                      </div>

                      <button 
                        onClick={() => onCloseSession(totalCounted)} 
                        className="w-full py-4 bg-rose-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-rose-700 active:scale-95 transition-all"
                      >
                        Valider Clôture
                      </button>
                   </div>
                </div>
             </div>
          </div>
       )}
    </div>
  );
};

export default POS;
