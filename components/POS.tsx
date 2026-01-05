
import React, { useState, useMemo, useEffect } from 'react';
import { Product, SaleOrder, ERPConfig, CashSession, PaymentMethod, SalePayment } from '../types';
// Added ChevronRight to imports from lucide-react
import { Search, Plus, Minus, Trash2, ShoppingBag, Utensils, Monitor, Banknote, ChevronLeft, ChevronRight, Layers, MapPin, Coffee, Package, Truck, History, RotateCcw, X, FileText, CreditCard, Smartphone, Wallet, LayoutGrid, PauseCircle, Users, Printer, QrCode, AlertCircle, ChevronDown, ChevronUp, Calculator, Delete, CheckCircle2, Split } from 'lucide-react';
import { APP_USERS, POS_LOCATIONS, PAYMENT_METHODS_LIST } from '../constants';
import * as XLSX from 'xlsx';
import { AppLogoDoc } from './Invoicing';
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
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-2 force-scrollbar">
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
            <div className="w-20 text-right">
              <span className="text-[10px] font-black text-slate-500">{(counts[denom] || 0) * denom} {currency}</span>
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
  onOpenSession: (openingBalance: number, cashierId: string) => void;
  onCloseSession: (closingBalance: number) => void;
  notify: (title: string, message: string, type?: 'success' | 'info' | 'warning') => void;
  userPermissions: any;
}

const POS: React.FC<Props> = ({ products, sales, onSaleComplete, config, session, onOpenSession, onCloseSession, notify }) => {
  const [pendingCarts, setPendingCarts] = useState<Record<string, CartItem[]>>({});
  const [activeLocation, setActiveLocation] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('Tous');

  // Multi-paiement state
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [currentPayments, setCurrentPayments] = useState<SalePayment[]>([]);
  const [activePaymentMethod, setActivePaymentMethod] = useState<PaymentMethod>('Especes');
  const [numpadValue, setNumpadValue] = useState('');

  const [sessionStep, setSessionStep] = useState<'cashier' | 'balance'>('cashier');
  const [openingBillCounts, setOpeningBillCounts] = useState<Record<number, number>>({});
  const [selectedCashierId, setSelectedCashierId] = useState<string | null>(null);
  const [showClosingModal, setShowClosingModal] = useState(false);
  const [closingBillCounts, setClosingBillCounts] = useState<Record<number, number>>({});
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // States pour animations visuelles
  const [bumpedProductId, setBumpedProductId] = useState<string | null>(null);
  const [isCartBouncing, setIsCartBouncing] = useState(false);

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
      let saleTime;
      if (s.date.includes('-')) {
        saleTime = new Date(s.date).getTime();
      } else {
        const parts = s.date.split(',')[0].split('/');
        const timePart = s.date.split(',')[1].trim();
        saleTime = new Date(`${parts[2]}-${parts[1]}-${parts[0]}T${timePart}`).getTime();
      }
      return saleTime >= openTime;
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
      ...POS_LOCATIONS.takeaway.map(l => ({ id: l, icon: Package, label: l })),
      ...POS_LOCATIONS.delivery.map(l => ({ id: l, icon: Truck, label: l }))
    ]}
  ], []);

  const groupedProducts = useMemo(() => {
    const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
    const cats = config.categories;
    const catsToDisplay = activeCategory === 'Tous' ? cats : cats.filter(c => c === activeCategory);
    
    return catsToDisplay.map(cat => ({
      name: cat,
      items: filtered.filter(p => p.category === cat).sort((a, b) => a.name.localeCompare(b.name))
    })).filter(group => group.items.length > 0);
  }, [products, search, activeCategory, config.categories]);

  const currentCart = activeLocation ? (pendingCarts[activeLocation] || []) : [];
  
  const total = useMemo(() => 
    currentCart.reduce((acc, item) => acc + (item.product.price * item.qty), 0)
  , [currentCart]);

  const totalPaid = useMemo(() => 
    currentPayments.reduce((acc, p) => acc + p.amount, 0)
  , [currentPayments]);

  const remainingToPay = Math.max(0, total - totalPaid);
  const changeDue = Math.max(0, totalPaid - total);

  const updateCartForActiveLocation = (items: CartItem[]) => {
    if (!activeLocation) return;
    setPendingCarts(prev => ({ ...prev, [activeLocation]: items }));
  };

  const addToCart = (p: Product) => {
    const exists = currentCart.find(item => item.product.id === p.id);
    const newItems = exists 
      ? currentCart.map(item => item.product.id === p.id ? {...item, qty: item.qty + 1} : item)
      : [...currentCart, {product: p, qty: 1}];
    updateCartForActiveLocation(newItems);

    setBumpedProductId(p.id);
    setIsCartBouncing(true);
    setTimeout(() => {
      setBumpedProductId(null);
      setIsCartBouncing(false);
    }, 300);
  };

  const adjustQty = (productId: string, delta: number) => {
    const newItems = currentCart.map(item => 
      item.product.id === productId ? { ...item, qty: Math.max(1, item.qty + delta) } : item
    );
    updateCartForActiveLocation(newItems);
  };

  const handleRefund = (sale: SaleOrder) => {
    onSaleComplete({
      total: sale.total,
      items: sale.items,
      paymentMethod: sale.paymentMethod,
      orderLocation: sale.orderLocation,
      customer: `REF: ${sale.customer}`,
      status: 'refunded'
    });
    notify("Annulation", `La vente #${sale.id.slice(-8)} a été annulée.`, 'warning');
  };

  const startCheckout = () => {
    if (!activeLocation || currentCart.length === 0) return;
    setCurrentPayments([]);
    setNumpadValue(remainingToPay.toString());
    setIsPaymentModalOpen(true);
  };

  const addPaymentLine = () => {
    const amount = parseFloat(numpadValue) || 0;
    if (amount <= 0) return;

    setCurrentPayments(prev => [...prev, { method: activePaymentMethod, amount }]);
    setNumpadValue('');
  };

  const removePaymentLine = (index: number) => {
    setCurrentPayments(prev => prev.filter((_, i) => i !== index));
  };

  const handleFinalValidation = () => {
    if (totalPaid < total) {
      notify("Montant insuffisant", `Il reste ${remainingToPay} ${config.currency} à encaisser.`, "warning");
      return;
    }

    onSaleComplete({
      total,
      items: currentCart.map(i => ({ productId: i.product.id, name: i.product.name, quantity: i.qty, price: i.product.price })),
      payments: currentPayments,
      paymentMethod: currentPayments[currentPayments.length - 1]?.method || 'Especes',
      amountReceived: totalPaid,
      change: changeDue,
      orderLocation: activeLocation,
      status: 'confirmed'
    });

    const updatedCarts = { ...pendingCarts };
    delete updatedCarts[activeLocation!];
    setPendingCarts(updatedCarts);
    setActiveLocation(null);
    setIsPaymentModalOpen(false);
  };

  const handleNumpad = (val: string) => {
    if (val === 'C') setNumpadValue('');
    else if (val === 'back') setNumpadValue(prev => prev.slice(0, -1));
    else setNumpadValue(prev => prev + val);
  };

  if (!session) {
    return (
      <div className="h-full flex items-center justify-center animate-fadeIn no-print">
        <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
          <div className="p-8 text-center space-y-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700">
            <div className="w-16 h-16 bg-purple-600 text-white rounded-2xl flex items-center justify-center mx-auto shadow-xl mb-4"><Monitor size={32} /></div>
            <h2 className="text-2xl font-black uppercase tracking-tighter text-slate-900 dark:text-white">Démarrage Session</h2>
            <p className="text-slate-500 text-xs font-medium">Initialisation du terminal de vente.</p>
          </div>
          <div className="p-10">
            {sessionStep === 'cashier' ? (
              <div className="space-y-6">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Sélectionnez votre profil</p>
                <div className="grid grid-cols-2 gap-4">
                  {APP_USERS.filter(u => u.role === 'cashier' || u.role === 'admin').map(u => (
                    <button key={u.id} onClick={() => { setSelectedCashierId(u.id); setSessionStep('balance'); }} className="p-5 bg-slate-50 dark:bg-slate-800 hover:bg-purple-600 hover:text-white rounded-[2rem] transition-all flex flex-col items-center space-y-4 border-2 border-transparent group">
                      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${u.color} text-white font-black flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>{u.initials}</div>
                      <span className="font-black text-[10px] uppercase tracking-widest">{u.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <button onClick={() => setSessionStep('cashier')} className="text-[10px] font-black text-purple-600 uppercase flex items-center hover:bg-purple-50 px-3 py-1 rounded-lg transition-all"><ChevronLeft size={14} className="mr-1"/> Retour</button>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fond de caisse</span>
                </div>
                
                <BillCounter counts={openingBillCounts} onChange={setOpeningBillCounts} currency={config.currency} />

                <button onClick={() => selectedCashierId && onOpenSession(calculatedOpeningBalance, selectedCashierId)} className="w-full py-5 bg-purple-600 text-white rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-2xl shadow-purple-900/40 hover:bg-purple-700 active:scale-95 transition-all flex items-center justify-center">
                  <Calculator size={16} className="mr-3" /> Confirmer & Lancer
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between no-print">
        <div className="flex items-center space-x-6">
           <AppLogo iconOnly className="w-12 h-12" />
           <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Terminal de Caisse</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Opéré par {session.cashierName}</p>
           </div>
        </div>
        <div className="flex items-center space-x-3">
           <button onClick={() => setShowHistoryModal(true)} className="px-5 py-2.5 bg-white dark:bg-slate-900 border rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center hover:bg-slate-50 transition-all shadow-sm"><History size={14} className="mr-2"/> Session</button>
           <button onClick={() => { setClosingBillCounts({}); setShowClosingModal(true); }} className="px-5 py-2.5 bg-rose-600 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest shadow-lg hover:bg-rose-700 transition-all">Fermer Caisse</button>
        </div>
      </div>

      {!activeLocation ? (
        <div className="flex-1 overflow-y-auto pr-2 scrollbar-hide space-y-12">
          {allLocations.map((group) => (
            <div key={group.category} className="space-y-6">
              <div className="flex items-center space-x-4">
                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] whitespace-nowrap">{group.category}</h3>
                <div className="h-px w-full bg-slate-200 dark:bg-slate-800 opacity-50"></div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                {group.items.map((loc) => {
                  const cart = pendingCarts[loc.id] || [];
                  const isOccupied = cart.length > 0;
                  const cartTotal = cart.reduce((acc, curr) => acc + (curr.product.price * curr.qty), 0);
                  return (
                    <button key={loc.id} onClick={() => setActiveLocation(loc.id)} className={`relative h-40 rounded-[2rem] border-2 transition-all flex flex-col items-center justify-center p-6 group hover:-translate-y-2 hover:shadow-xl ${isOccupied ? 'bg-purple-600 border-purple-400 text-white shadow-xl shadow-purple-900/20' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-400 hover:border-purple-200'}`}>
                      <loc.icon size={28} className={`mb-3 transition-transform group-hover:scale-110 ${isOccupied ? 'text-white' : 'text-slate-300'}`} />
                      <span className={`text-[10px] font-black uppercase tracking-widest ${isOccupied ? 'text-white' : 'text-slate-500'}`}>{loc.label}</span>
                      {isOccupied && <div className="mt-2 flex flex-col items-center"><span className="text-base font-black leading-none">{cartTotal.toLocaleString()}</span><span className="text-[7px] font-black uppercase opacity-60 mt-1">{config.currency}</span></div>}
                      {isOccupied && <div className="absolute top-3 right-3 w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_#34d399]"></div>}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-1 gap-6 overflow-hidden animate-fadeIn">
          <div className="flex-1 flex flex-col space-y-4 min-w-0">
            <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                <div className="flex items-center space-x-3">
                   <button onClick={() => setActiveLocation(null)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-purple-600 hover:text-white transition-all"><ChevronLeft size={18}/></button>
                   <div className="flex flex-col">
                      <span className="text-[11px] font-black uppercase tracking-tighter leading-none">{activeLocation}</span>
                      <span className="text-[8px] font-bold text-slate-400 uppercase">Commande en cours</span>
                   </div>
                </div>
                <div className="relative w-64">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                   <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..." className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-[10px] font-bold outline-none" />
                </div>
            </div>
            
            <div className="flex items-center space-x-2 overflow-x-auto scrollbar-hide py-1">
                <button onClick={() => setActiveCategory('Tous')} className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeCategory === 'Tous' ? 'bg-accent text-white shadow-md' : 'bg-white dark:bg-slate-900 text-slate-500'}`}>Tous</button>
                {config.categories.map(cat => (
                  <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeCategory === cat ? 'bg-accent text-white shadow-md' : 'bg-white dark:bg-slate-900 text-slate-500'}`}>{cat}</button>
                ))}
            </div>

            <div className="flex-1 overflow-y-auto pr-2 scrollbar-hide space-y-10">
              {groupedProducts.map(group => (
                <div key={group.name} className="space-y-4">
                  <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">{group.name}</h3>
                  <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {group.items.map(p => (
                      <button 
                        key={p.id} 
                        onClick={() => addToCart(p)} 
                        className={`bg-white dark:bg-slate-900 p-4 rounded-[1.5rem] border text-left hover:border-accent hover:shadow-lg transition-all group flex flex-col justify-between h-40 ${bumpedProductId === p.id ? 'scale-95 bg-accent/5 border-accent' : 'border-slate-100 dark:border-slate-800'}`}
                      >
                        <div className="space-y-1">
                          <span className="text-[11px] font-black uppercase text-slate-800 dark:text-white leading-tight">{p.name}</span>
                          <p className="text-[8px] font-bold text-slate-400 tracking-wider uppercase opacity-60">REF-{p.sku.slice(-4)}</p>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-black text-accent">{p.price}</span>
                          <div className={`p-2 rounded-lg transition-all shadow-sm ${bumpedProductId === p.id ? 'bg-accent text-white rotate-90 scale-110' : 'bg-slate-50 dark:bg-slate-800 group-hover:bg-accent group-hover:text-white'}`}><Plus size={16}/></div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="w-[380px] bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden shrink-0">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/30">
              <div className="flex items-center">
                <div className={`relative transition-transform duration-300 ${isCartBouncing ? 'scale-125' : ''}`}>
                   <ShoppingBag size={18} className="text-accent" />
                   {currentCart.length > 0 && (
                     <span className={`absolute -top-1 -right-1 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center transition-all duration-300 ${isCartBouncing ? 'bg-rose-600 scale-110 shadow-lg' : 'bg-rose-500'}`}>
                       {currentCart.length}
                     </span>
                   )}
                </div>
                <h3 className="ml-3 text-xs font-black uppercase tracking-tight">Panier Actif</h3>
              </div>
              <button onClick={() => updateCartForActiveLocation([])} className="p-1.5 text-slate-300 hover:text-rose-500 transition-colors" title="Vider le panier"><Trash2 size={16} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-2 relative group/cart force-scrollbar">
              {currentCart.length > 0 ? (
                <>
                  <div className="sticky top-0 left-0 right-0 h-4 bg-gradient-to-b from-white dark:from-slate-900 to-transparent z-10 pointer-events-none opacity-0 group-hover/cart:opacity-100 transition-opacity"></div>
                  
                  {currentCart.map(item => (
                    <div key={item.product.id} className="flex items-center justify-between bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:border-accent transition-all animate-slideInRight">
                      <div className="flex-1 mr-3 min-w-0">
                        <p className="text-[10px] font-black uppercase truncate text-slate-800 dark:text-slate-200">{item.product.name}</p>
                        <p className="text-[9px] font-bold text-slate-400 mt-0.5">{(item.product.price * item.qty).toLocaleString()} {config.currency}</p>
                      </div>
                      <div className="flex items-center space-x-2 shrink-0">
                        <button onClick={() => adjustQty(item.product.id, -1)} className="p-1.5 bg-slate-50 dark:bg-slate-700 rounded-lg shadow-sm hover:bg-rose-50 hover:text-rose-600 transition-all"><Minus size={12}/></button>
                        <span className="text-[10px] font-black w-5 text-center">{item.qty}</span>
                        <button onClick={() => addToCart(item.product)} className="p-1.5 bg-slate-50 dark:bg-slate-700 rounded-lg shadow-sm hover:bg-emerald-50 hover:text-emerald-600 transition-all"><Plus size={12}/></button>
                      </div>
                    </div>
                  ))}
                  
                  <div className="sticky bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white dark:from-slate-900 to-transparent z-10 pointer-events-none flex justify-center items-end pb-1">
                    {currentCart.length > 5 && <ChevronDown size={14} className="text-slate-300 animate-bounce" />}
                  </div>
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center opacity-20 text-center py-20 space-y-4">
                   <ShoppingBag size={48} />
                   <p className="text-[10px] font-black uppercase tracking-widest">Le panier est vide</p>
                </div>
              )}
            </div>

            <div className="p-6 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800 space-y-6 shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
              <div className="flex justify-between items-baseline pt-4">
                <span className="text-slate-400 uppercase text-[9px] font-black tracking-widest">Total Commande</span>
                <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{total.toLocaleString()} <span className="text-xs font-bold">{config.currency}</span></span>
              </div>
              <button onClick={startCheckout} disabled={currentCart.length === 0} className="w-full py-5 bg-accent text-white rounded-[1.5rem] font-black uppercase tracking-widest shadow-xl shadow-accent/20 hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center text-[11px]">
                 <Split size={18} className="mr-2" /> Procéder au paiement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE PAIEMENT MULTI-MODES */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl z-[200] flex items-center justify-center p-4">
           <div className="bg-white dark:bg-slate-900 w-full max-w-5xl h-[85vh] rounded-[3rem] shadow-2xl flex overflow-hidden animate-scaleIn border border-white/10">
              {/* PANNEAU GAUCHE: MODES ET SAISIE */}
              <div className="flex-1 flex flex-col border-r dark:border-slate-800">
                 <div className="p-8 border-b dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex justify-between items-center">
                    <div>
                       <h3 className="text-xl font-black uppercase tracking-tighter">Réception Paiement</h3>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Répartition des encaissements</p>
                    </div>
                    <button onClick={() => setIsPaymentModalOpen(false)} className="p-2 hover:bg-rose-50 hover:text-rose-500 rounded-full transition-all"><X size={24} /></button>
                 </div>

                 <div className="flex-1 grid grid-cols-2 gap-0 overflow-hidden">
                    {/* CLAVIER NUMÉRIQUE */}
                    <div className="p-8 space-y-6 border-r dark:border-slate-800">
                       <div className="relative">
                          <input 
                            readOnly 
                            value={numpadValue} 
                            className="w-full p-6 bg-slate-100 dark:bg-slate-800 rounded-2xl text-4xl font-black text-right outline-none tracking-tighter text-accent"
                            placeholder="0"
                          />
                          <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 font-black text-xl">{config.currency}</span>
                       </div>

                       <div className="grid grid-cols-3 gap-3">
                          {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', 'back'].map(key => (
                             <button 
                                key={key}
                                onClick={() => handleNumpad(key)}
                                className={`h-16 rounded-2xl text-xl font-black transition-all active:scale-95 ${
                                   key === 'C' ? 'bg-rose-100 text-rose-600' : 
                                   key === 'back' ? 'bg-slate-100 text-slate-400' : 
                                   'bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:border-accent'
                                }`}
                             >
                                {key === 'back' ? <Delete className="mx-auto" /> : key}
                             </button>
                          ))}
                       </div>
                       
                       <button 
                         onClick={addPaymentLine}
                         disabled={!numpadValue || parseFloat(numpadValue) <= 0}
                         className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-black transition-all disabled:opacity-50"
                       >
                          Valider ce montant
                       </button>
                    </div>

                    {/* SELECTION MODES */}
                    <div className="p-8 space-y-6 overflow-y-auto scrollbar-hide bg-slate-50/30">
                       <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Choisir le mode de règlement</h4>
                       <div className="grid grid-cols-1 gap-3">
                          {PAYMENT_METHODS_LIST.filter(m => ['Especes', 'Bankily', 'Masrvi', 'Sedad', 'Bimbank'].includes(m.id)).map(method => (
                             <button 
                                key={method.id}
                                onClick={() => setActivePaymentMethod(method.id)}
                                className={`p-5 rounded-2xl border-2 transition-all flex items-center justify-between group ${
                                   activePaymentMethod === method.id 
                                   ? 'bg-accent border-accent text-white shadow-xl shadow-accent/20' 
                                   : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-accent/30'
                                }`}
                             >
                                <span className="font-black uppercase text-xs tracking-widest">{method.label}</span>
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${activePaymentMethod === method.id ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-700'}`}>
                                   <ChevronRight size={18} />
                                </div>
                             </button>
                          ))}
                       </div>
                    </div>
                 </div>
              </div>

              {/* PANNEAU DROIT: RÉSUMÉ ET VALIDATION */}
              <div className="w-[400px] bg-slate-50 dark:bg-slate-950 p-10 flex flex-col justify-between">
                 <div className="space-y-8">
                    <div className="space-y-1">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">À percevoir</p>
                       <h4 className="text-5xl font-black tracking-tighter text-slate-900 dark:text-white">{total.toLocaleString()} <span className="text-xl font-bold opacity-30">{config.currency}</span></h4>
                    </div>

                    <div className="space-y-4">
                       <h5 className="text-[9px] font-black uppercase text-slate-400 tracking-widest border-b pb-2">Lignes de règlement</h5>
                       <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 force-scrollbar">
                          {currentPayments.map((p, idx) => (
                             <div key={idx} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-between items-center animate-slideInRight">
                                <div>
                                   <p className="text-[8px] font-black text-accent uppercase tracking-widest">{p.method}</p>
                                   <p className="text-sm font-black">{p.amount.toLocaleString()} {config.currency}</p>
                                </div>
                                <button onClick={() => removePaymentLine(idx)} className="p-2 text-slate-300 hover:text-rose-500 transition-all"><Trash2 size={14}/></button>
                             </div>
                          ))}
                          {currentPayments.length === 0 && (
                             <div className="py-10 text-center opacity-30 space-y-2">
                                <Split size={32} className="mx-auto" />
                                <p className="text-[10px] font-black uppercase tracking-widest">Aucun paiement ajouté</p>
                             </div>
                          )}
                       </div>
                    </div>
                 </div>

                 <div className="space-y-6">
                    <div className="space-y-3 bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
                       <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                          <span className="text-slate-400">Déjà réglé</span>
                          <span className="text-emerald-500">{totalPaid.toLocaleString()} {config.currency}</span>
                       </div>
                       <div className="flex justify-between items-center border-t pt-3">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{changeDue > 0 ? 'Monnaie à rendre' : 'Reste à percevoir'}</span>
                          <span className={`text-xl font-black ${changeDue > 0 ? 'text-amber-500' : remainingToPay === 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                             {changeDue > 0 ? changeDue.toLocaleString() : remainingToPay.toLocaleString()} {config.currency}
                          </span>
                       </div>
                    </div>

                    <button 
                      onClick={handleFinalValidation}
                      disabled={totalPaid < total}
                      className={`w-full py-6 rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs shadow-2xl transition-all flex items-center justify-center space-x-3 ${
                        totalPaid >= total 
                        ? 'bg-emerald-600 text-white shadow-emerald-900/20 hover:brightness-110 active:scale-95' 
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                       <CheckCircle2 size={20} />
                       <span>Valider l'encaissement</span>
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {showHistoryModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[2rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-scaleIn">
            <div className="p-6 border-b flex items-center justify-between"><h3 className="text-lg font-black uppercase">Ventes du service</h3><button onClick={() => setShowHistoryModal(false)}><X size={24}/></button></div>
            <div className="p-6 max-h-[60vh] overflow-y-auto space-y-3 force-scrollbar">
              {sessionSales.map((sale) => (
                <div key={sale.id} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl flex justify-between items-center">
                  <div>
                    <p className="text-[10px] font-black uppercase">{sale.customer}</p>
                    <p className="text-[8px] text-slate-400 uppercase">{sale.date}</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm font-black">{sale.total.toLocaleString()}</span>
                    {sale.status !== 'refunded' && <button onClick={() => handleRefund(sale)} className="text-[8px] font-black uppercase text-rose-500 border border-rose-200 px-2 py-1 rounded hover:bg-rose-50 transition-colors">Annuler</button>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showClosingModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[110] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl animate-scaleIn flex flex-col items-center border border-white/10">
            <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg"><Monitor size={32} /></div>
            <h3 className="text-xl font-black uppercase tracking-tighter text-center">Clôturer la Caisse</h3>
            <p className="text-slate-500 text-[10px] font-black uppercase text-center mb-6">Fin de service & Arrêté journalier</p>

            <div className="w-full space-y-6 mb-8">
              <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 flex justify-between items-center">
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Théorique Attendu</p>
                  <p className="text-xl font-black text-accent tracking-tighter">{currentExpectedBalance.toLocaleString()} {config.currency}</p>
                </div>
                {calculatedClosingBalance !== currentExpectedBalance && calculatedClosingBalance !== 0 && (
                   <div className="flex items-center text-rose-500 font-black text-xs">
                     <AlertCircle size={14} className="mr-1" />
                     Ecart: {(calculatedClosingBalance - currentExpectedBalance).toLocaleString()}
                   </div>
                )}
              </div>
              
              <BillCounter counts={closingBillCounts} onChange={setClosingBillCounts} currency={config.currency} />
            </div>

            <div className="w-full space-y-3">
              <button onClick={() => { onCloseSession(calculatedClosingBalance); setShowClosingModal(false); }} className="w-full py-5 bg-rose-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-rose-700 active:scale-95 transition-all flex items-center justify-center">
                <Calculator size={16} className="mr-3" /> Valider la fermeture
              </button>
              <button onClick={() => setShowClosingModal(false)} className="w-full py-3 text-slate-400 font-black uppercase text-[9px] tracking-widest hover:text-slate-600">Annuler</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default POS;
