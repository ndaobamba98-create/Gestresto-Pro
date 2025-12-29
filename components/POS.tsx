
import React, { useState, useMemo, useEffect } from 'react';
import { Product, SaleOrder, ERPConfig, SaleItem, CashSession, PaymentMethod } from '../types';
import { 
  Search, Plus, Minus, Trash2, ShoppingBag, CheckCircle, Utensils, X, Printer, 
  CheckCircle2, Clock, Calendar, Lock, Unlock, DollarSign, Wallet, CreditCard, 
  Banknote, ChevronRight, ArrowLeft, Delete, Zap, Calculator, UtensilsCrossed, 
  Coffee, Sun, Moon, Star, AlertCircle, TrendingDown, TrendingUp, Mail, 
  MapPin, GlassWater, Bike, LayoutGrid, ChevronLeft
} from 'lucide-react';
import { POS_LOCATIONS } from '../constants';

interface Props {
  products: Product[];
  onSaleComplete: (sale: Partial<SaleOrder>) => void;
  config: ERPConfig;
  session: CashSession | null;
  onOpenSession: (openingBalance: number) => void;
  onCloseSession: (closingBalance: number) => void;
  notify: (title: string, message: string, type?: 'success' | 'info' | 'warning') => void;
}

interface CartItem extends Product {
  quantity: number;
}

type ActiveOrders = Record<string, CartItem[]>;

const LogoG = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10" />
    <path d="M16 8.5C15.1 7.6 13.8 7 12.3 7 9.4 7 7 9.2 7 12s2.4 5 5.3 5c2.4 0 4.4-1.5 5.1-3.5H12" />
  </svg>
);

const DENOMINATIONS = [1000, 500, 200, 100, 50, 20, 10];

const POS: React.FC<Props> = ({ products, onSaleComplete, config, session, onOpenSession, onCloseSession, notify }) => {
  const [activeOrders, setActiveOrders] = useState<ActiveOrders>(() => {
    const saved = localStorage.getItem('activeOrders');
    return saved ? JSON.parse(saved) : {};
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('Tous');
  const [lastSale, setLastSale] = useState<SaleOrder | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [receivedAmount, setReceivedAmount] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  
  const [openingBalance, setOpeningBalance] = useState<number>(0);
  const [counts, setCounts] = useState<Record<number, number>>({
    1000: 0, 500: 0, 200: 0, 100: 0, 50: 0, 20: 0, 10: 0
  });
  const [showCounter, setShowCounter] = useState(false);
  
  const [closingBalance, setClosingBalance] = useState<number>(0);
  const [showClosingModal, setShowClosingModal] = useState(false);

  useEffect(() => {
    localStorage.setItem('activeOrders', JSON.stringify(activeOrders));
  }, [activeOrders]);

  const currentCart = selectedLocation ? (activeOrders[selectedLocation] || []) : [];

  const getCategoryIcon = (cat: string) => {
    switch(cat) {
      case 'Tous': return <Utensils size={14} />;
      case '🍽️ Nos Repas': return <Coffee size={14} />;
      case 'Petit Déjeuner': return <Sun size={14} />;
      case 'Déjeuner': return <UtensilsCrossed size={14} />;
      case 'Dîner': return <Moon size={14} />;
      default: return <Star size={14} />;
    }
  };

  const categories = useMemo(() => {
    const rawCats = (Array.from(new Set(products.map(p => p.category))) as string[]).sort((a, b) => a.localeCompare(b));
    const filteredCats = rawCats.filter(c => !['Petit Déjeuner', 'Déjeuner', 'Dîner'].includes(c));
    return ['Tous', '🍽️ Nos Repas', ...filteredCats];
  }, [products]);

  const filteredProductsGrouped = useMemo(() => {
    let list = [...products];
    if (searchTerm) {
      list = list.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    if (activeCategory === '🍽️ Nos Repas') {
      list = list.filter(p => ['Petit Déjeuner', 'Déjeuner', 'Dîner'].includes(p.category));
    } else if (activeCategory !== 'Tous') {
      list = list.filter(p => p.category === activeCategory);
    }
    const groups: Record<string, Product[]> = {};
    list.forEach(p => {
      if (!groups[p.category]) groups[p.category] = [];
      groups[p.category].push(p);
    });
    return Object.keys(groups).sort((a, b) => a.localeCompare(b)).map(cat => ({
      name: cat,
      products: groups[cat].sort((a, b) => a.name.localeCompare(b.name))
    }));
  }, [products, searchTerm, activeCategory]);

  const total = currentCart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const numericReceived = parseFloat(receivedAmount) || 0;
  const changeAmount = Math.max(0, numericReceived - total);

  useEffect(() => {
    if (showCounter) {
      const newTotal = DENOMINATIONS.reduce((acc, val) => acc + (val * (counts[val] || 0)), 0);
      setOpeningBalance(newTotal);
    }
  }, [counts, showCounter]);

  const handleCountChange = (val: number, qtyStr: string) => {
    const qty = Math.max(0, parseInt(qtyStr) || 0);
    setCounts(prev => ({ ...prev, [val]: qty }));
  };

  const addToCart = (product: Product) => {
    if (!selectedLocation) return;
    setActiveOrders(prev => {
      const cart = prev[selectedLocation] || [];
      const existing = cart.find(item => item.id === product.id);
      let newCart;
      if (existing) {
        newCart = cart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      } else {
        newCart = [...cart, { ...product, quantity: 1 }];
      }
      return { ...prev, [selectedLocation]: newCart };
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    if (!selectedLocation) return;
    setActiveOrders(prev => {
      const cart = prev[selectedLocation] || [];
      const newCart = cart.map(item => {
        if (item.id === productId) {
          const newQty = Math.max(1, item.quantity + delta);
          return { ...item, quantity: newQty };
        }
        return item;
      });
      return { ...prev, [selectedLocation]: newCart };
    });
  };

  const removeFromCart = (productId: string) => {
    if (!selectedLocation) return;
    setActiveOrders(prev => {
      const cart = (prev[selectedLocation] || []).filter(item => item.id !== productId);
      const newOrders = { ...prev };
      if (cart.length === 0) {
        delete newOrders[selectedLocation];
      } else {
        newOrders[selectedLocation] = cart;
      }
      return newOrders;
    });
  };

  const handleFinalizeSale = (methodOverride?: PaymentMethod, amountOverride?: number) => {
    const finalMethod = methodOverride || selectedMethod;
    if (!finalMethod || !selectedLocation) return;
    const saleItems: SaleItem[] = currentCart.map(item => ({ productId: item.id, name: item.name, quantity: item.quantity, price: item.price }));
    const now = new Date();
    const formattedDateTime = now.toLocaleDateString('fr-FR') + ' ' + now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const finalReceived = amountOverride !== undefined ? amountOverride : (numericReceived || total);
    const finalChange = amountOverride !== undefined ? 0 : Math.max(0, finalReceived - total);
    const newSaleData: Partial<SaleOrder> = {
      customer: selectedLocation === POS_LOCATIONS.default ? 'Vente Comptoir' : `Vente - ${selectedLocation}`,
      date: formattedDateTime,
      total: total,
      status: 'confirmed',
      items: saleItems,
      paymentMethod: finalMethod,
      amountReceived: finalReceived,
      change: finalChange,
      invoiceStatus: 'paid',
      orderLocation: selectedLocation
    };
    onSaleComplete(newSaleData);
    const tempPadded = String(config.nextInvoiceNumber).padStart(5, '0');
    setLastSale({ ...newSaleData, id: `${config.invoicePrefix}${tempPadded}` } as SaleOrder);
    
    // Nettoyer la commande active pour cet emplacement mais RESTER sur le même emplacement
    setActiveOrders(prev => {
      const newOrders = { ...prev };
      delete newOrders[selectedLocation];
      return newOrders;
    });
    
    setShowPaymentModal(false);
    // OPTIMISATION: On ne remet plus selectedLocation à null pour rester sur les catégories
  };

  const handleQuickCashSale = () => handleFinalizeSale('Especes', total);

  const FloorPlan = () => {
    const renderLocationButton = (loc: string, icon: any, activeColor: string) => {
      const cartItemsCount = activeOrders[loc]?.length || 0;
      const isOccupied = cartItemsCount > 0;
      return (
        <button 
          key={loc}
          onClick={() => setSelectedLocation(loc)}
          className={`relative group p-6 rounded-[2rem] border-2 transition-all flex flex-col items-center justify-center space-y-3 ${
            isOccupied 
            ? `${activeColor} border-transparent text-white shadow-xl scale-105 z-10` 
            : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-400 hover:border-purple-200 hover:scale-[1.02]'
          }`}
        >
          {React.createElement(icon, { size: 32, className: isOccupied ? 'animate-pulse' : 'opacity-40 group-hover:opacity-100 transition-opacity' })}
          <span className={`text-[11px] font-black uppercase tracking-widest ${isOccupied ? 'text-white' : 'text-slate-500'}`}>{loc}</span>
          {isOccupied && <div className="absolute -top-2 -right-2 bg-white text-slate-900 w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shadow-lg">{cartItemsCount}</div>}
          {isOccupied && <p className="text-[8px] font-bold opacity-80 uppercase">En cours...</p>}
        </button>
      );
    };

    return (
      <div className="h-full flex flex-col space-y-8 animate-fadeIn max-w-6xl mx-auto w-full px-4 overflow-y-auto pb-10 scrollbar-hide">
        <div className="flex flex-col items-center text-center space-y-2 mt-8">
          <div className="w-16 h-16 bg-purple-600 text-white rounded-3xl flex items-center justify-center shadow-2xl shadow-purple-500/20 mb-2"><LayoutGrid size={32} /></div>
          <h2 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Plan de Salle</h2>
          <p className="text-slate-500 font-medium max-w-md">Sélectionnez une table, le bar ou un service extérieur pour commencer une commande.</p>
        </div>
        <div className="grid grid-cols-1 gap-12">
          <div className="space-y-4">
            <div className="flex items-center space-x-4"><h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Tables Salle</h3><div className="h-px flex-1 bg-slate-200 dark:bg-slate-800"></div></div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">{POS_LOCATIONS.tables.map(loc => renderLocationButton(loc, Utensils, 'bg-purple-600'))}</div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center space-x-4"><h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Zone Bar</h3><div className="h-px flex-1 bg-slate-200 dark:bg-slate-800"></div></div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">{POS_LOCATIONS.bar.map(loc => renderLocationButton(loc, GlassWater, 'bg-blue-600'))}</div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
             <div className="space-y-4">
                <div className="flex items-center space-x-4"><h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">À Emporter</h3><div className="h-px flex-1 bg-slate-200 dark:bg-slate-800"></div></div>
                <div className="grid grid-cols-3 gap-4">{POS_LOCATIONS.takeaway.map(loc => renderLocationButton(loc, ShoppingBag, 'bg-emerald-600'))}</div>
             </div>
             <div className="space-y-4">
                <div className="flex items-center space-x-4"><h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Livraisons</h3><div className="h-px flex-1 bg-slate-200 dark:bg-slate-800"></div></div>
                <div className="grid grid-cols-2 gap-4">{POS_LOCATIONS.delivery.map(loc => renderLocationButton(loc, Bike, 'bg-rose-600'))}</div>
             </div>
          </div>
          <div className="flex justify-center pt-8"><button onClick={() => setSelectedLocation(POS_LOCATIONS.default)} className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] hover:bg-black transition-all shadow-xl shadow-slate-900/20 active:scale-95">Accès Vente Comptoir Rapide</button></div>
        </div>
        <div className="flex justify-center mt-12 pb-10"><button onClick={() => setShowClosingModal(true)} className="flex items-center px-6 py-3 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-2xl text-xs font-black uppercase tracking-widest border border-rose-100 dark:border-rose-800 hover:bg-rose-600 hover:text-white transition-all"><Unlock size={14} className="mr-2" /> Fermer la caisse pour aujourd'hui</button></div>
      </div>
    );
  };

  const renderLocationQuickSwitch = () => {
    const zones = [
      { name: 'Comptoir', locs: [POS_LOCATIONS.default], icon: LayoutGrid, color: 'purple' },
      { name: 'Tables', locs: POS_LOCATIONS.tables, icon: Utensils, color: 'purple' },
      { name: 'Bar', locs: POS_LOCATIONS.bar, icon: GlassWater, color: 'blue' },
      { name: 'Emporter', locs: POS_LOCATIONS.takeaway, icon: ShoppingBag, color: 'emerald' },
      { name: 'Livraison', locs: POS_LOCATIONS.delivery, icon: Bike, color: 'rose' }
    ];

    return (
      <div className="flex flex-col space-y-3">
        <div className="flex items-center space-x-4 overflow-x-auto pb-2 scrollbar-hide">
          {zones.map(zone => (
            <div key={zone.name} className="flex flex-col space-y-1">
              <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest px-1">{zone.name}</span>
              <div className="flex items-center space-x-1">
                {zone.locs.map(loc => {
                  const cartCount = activeOrders[loc]?.length || 0;
                  const isSelected = selectedLocation === loc;
                  const isOccupied = cartCount > 0;
                  const colorClass = `bg-${zone.color}-600`;
                  const borderClass = `border-${zone.color}-600`;
                  const textClass = `text-${zone.color}-600`;

                  return (
                    <button
                      key={loc}
                      onClick={() => setSelectedLocation(loc)}
                      className={`relative flex items-center justify-center min-w-[60px] px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-tighter transition-all border-2 shrink-0 ${
                        isSelected 
                          ? `${colorClass} text-white border-transparent shadow-md scale-105 z-10` 
                          : isOccupied 
                            ? `bg-white dark:bg-slate-900 border-2 border-dashed ${borderClass} ${textClass} opacity-80`
                            : 'bg-white dark:bg-slate-900 text-slate-400 border-slate-100 dark:border-slate-800 hover:border-slate-200'
                      }`}
                    >
                      {isSelected && <zone.icon size={10} className="mr-1.5" />}
                      <span>{loc.includes(' ') ? loc.split(' ')[1] : loc}</span>
                      {isOccupied && !isSelected && (
                        <span className={`absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center text-[8px] text-white shadow-sm ${colorClass}`}>
                          {cartCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const ReceiptModal = ({ sale, onClose }: { sale: SaleOrder, onClose: () => void }) => {
    const [date, time] = sale.date.includes(' ') ? sale.date.split(' ') : [sale.date, '--:--'];
    const taxRate = config.taxRate || 0;
    const totalTTC = sale.total;
    const totalHT = totalTTC / (1 + taxRate / 100);
    const taxAmount = totalTTC - totalHT;
    return (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
        <div className="bg-white dark:bg-slate-900 w-full max-w-[320px] rounded-[1.5rem] shadow-2xl overflow-hidden animate-scaleIn border border-slate-200 dark:border-slate-800 p-6 flex flex-col">
          <div className="flex flex-col items-center border-b border-dashed border-slate-200 dark:border-slate-800 pb-4 mb-4 text-center">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md mb-2"><LogoG className="text-white w-6 h-6" /></div>
            <h4 className="font-black text-slate-800 dark:text-white uppercase text-xs">FAST FOOD MYA D'OR</h4>
            <p className="text-[8px] text-slate-400 font-bold mt-1 uppercase">{config.address}</p>
            {sale.orderLocation && <div className="mt-2 px-3 py-1 bg-purple-50 dark:bg-purple-900/30 rounded-full"><span className="text-[9px] font-black text-purple-600 uppercase tracking-widest">{sale.orderLocation}</span></div>}
            <div className="flex flex-col items-center mt-2 text-[10px] text-slate-500 font-bold"><span><Calendar size={10} className="inline mr-1" /> {date}</span><span><Clock size={10} className="inline mr-1" /> {time}</span></div>
          </div>
          <div className="text-center mb-4"><h3 className="text-sm font-black text-slate-800 dark:text-white uppercase">Ticket #{sale.id}</h3></div>
          <div className="space-y-2 mb-4">{sale.items?.map((item, idx) => (<div key={idx} className="flex justify-between text-[11px] leading-tight"><span className="text-slate-600 dark:text-slate-300 font-medium max-w-[180px]">{item.quantity}x {item.name}</span><span className="text-slate-800 dark:text-white font-black">{(item.quantity * item.price).toLocaleString()}</span></div>))}</div>
          <div className="border-t border-dashed border-slate-200 dark:border-slate-800 pt-3 space-y-1.5 mb-4 text-xs">
            <div className="flex justify-between items-center text-slate-500 font-bold"><span className="text-[9px] uppercase">Total HT</span><span className="font-mono">{totalHT.toLocaleString(undefined, {minimumFractionDigits: 2})}</span></div>
            <div className="flex justify-between items-center text-slate-500 font-bold"><span className="text-[9px] uppercase">TVA ({taxRate}%)</span><span className="font-mono">{taxAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}</span></div>
            <div className="flex justify-between items-center pt-1 border-t border-slate-100 dark:border-slate-800"><span className="text-[10px] font-black text-slate-500 uppercase">Total {config.currency}</span><span className="text-xl font-black text-slate-900 dark:text-white">{sale.total.toLocaleString()}</span></div>
          </div>
          <p className="text-[9px] text-center text-slate-400 italic mb-6">"{config.receiptFooter}"</p>
          <div className="grid grid-cols-2 gap-2"><button onClick={onClose} className="py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-black rounded-xl hover:bg-slate-200 text-[10px] uppercase tracking-widest">Fermer</button><button className="py-2.5 bg-slate-900 text-white font-black rounded-xl hover:bg-slate-800 shadow-md flex items-center justify-center text-[10px] uppercase tracking-widest"><Printer size={14} className="mr-1.5" /> Imprimer</button></div>
        </div>
      </div>
    );
  };

  const SessionModal = () => (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-scaleIn border border-slate-200 dark:border-slate-800">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-purple-600 text-white flex items-center justify-between"><div className="flex items-center space-x-3"><Lock size={20} /><h3 className="text-lg font-black uppercase tracking-tight">Ouverture de Caisse</h3></div></div>
        <div className="p-8 space-y-6"><label className="text-xs font-black text-slate-400 uppercase tracking-widest">Fond de caisse initial ({config.currency})</label><input type="number" value={openingBalance || ''} onChange={(e) => setOpeningBalance(parseFloat(e.target.value) || 0)} className="w-full px-4 py-6 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-4xl font-black text-center text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500" placeholder="0.00" /></div>
        <div className="p-6 bg-slate-50 dark:bg-slate-800 border-t border-slate-100 dark:border-slate-800"><button onClick={() => onOpenSession(openingBalance)} className="w-full bg-purple-600 text-white py-4 rounded-2xl font-black text-lg hover:bg-purple-700 transition-all shadow-xl shadow-purple-900/20 active:scale-[0.98]">OUVRIR LA SESSION</button></div>
      </div>
    </div>
  );

  const PaymentModal = () => (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-scaleIn border border-slate-200 dark:border-slate-800">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
           <div className="flex items-center space-x-3"><div className="p-2 bg-purple-600 text-white rounded-xl shadow-lg"><Wallet size={20} /></div><h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">Finaliser la vente</h3></div>
           <button onClick={() => setShowPaymentModal(false)} className="p-2 text-slate-400 hover:text-rose-500 transition-colors"><X size={24} /></button>
        </div>
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
           <div className="space-y-6">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Mode de règlement</p>
                <div className="grid grid-cols-2 gap-3">
                  {(['Especes', 'Bankily', 'Masrvi', 'Sedad', 'Bimbank'] as PaymentMethod[]).map(method => (
                    <button key={method} onClick={() => setSelectedMethod(method)} className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center space-y-2 transition-all ${selectedMethod === method ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20 text-purple-600' : 'border-slate-100 dark:border-slate-800 text-slate-400 hover:border-slate-200'}`}>{method === 'Especes' ? <Banknote size={24} /> : <CreditCard size={24} />}<span className="text-[10px] font-black uppercase">{method}</span></button>
                  ))}
                </div>
              </div>
           </div>
           <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex justify-between items-center text-slate-500 font-bold text-xs uppercase"><span>Total à payer</span><span className="text-lg text-slate-800 dark:text-white">{total.toLocaleString()} {config.currency}</span></div>
                <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Montant reçu</label><input type="number" value={receivedAmount} onChange={e => setReceivedAmount(e.target.value)} className="w-full px-6 py-4 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 text-2xl font-black text-center outline-none focus:border-purple-500" placeholder="0" /></div>
                {changeAmount > 0 && <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-800 flex justify-between items-center"><span className="text-[10px] font-black text-emerald-600 uppercase">Rendu</span><span className="text-xl font-black text-emerald-700 dark:text-emerald-400">{changeAmount.toLocaleString()} {config.currency}</span></div>}
              </div>
              <button onClick={() => handleFinalizeSale()} disabled={!selectedMethod || numericReceived < total} className={`w-full py-4 mt-6 rounded-2xl font-black text-sm uppercase tracking-widest transition-all ${selectedMethod && numericReceived >= total ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-xl shadow-emerald-900/20' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>Valider l'encaissement</button>
           </div>
        </div>
      </div>
    </div>
  );

  const ClosingModal = () => {
    const expected = session?.expectedBalance || 0;
    const difference = closingBalance - expected;
    return (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-scaleIn border border-slate-200 dark:border-slate-800">
          <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex flex-col items-center text-center"><div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl shadow-purple-500/20 mb-4 transition-transform duration-500"><LogoG className="text-white w-9 h-9" /></div><h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Clôture de Session</h3></div>
          <div className="p-8 space-y-6"><div className="grid grid-cols-2 gap-3"><div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/50"><p className="text-[9px] font-black text-slate-400 uppercase mb-1">Théorique</p><p className="text-sm font-black text-slate-700 dark:text-slate-300">{expected.toLocaleString()} {config.currency}</p></div><div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/50"><p className="text-[9px] font-black text-slate-400 uppercase mb-1">Ouverture</p><p className="text-sm font-black text-slate-700 dark:text-slate-300">{session?.openingBalance.toLocaleString()} {config.currency}</p></div></div><div className="space-y-3"><label className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center"><Banknote size={14} className="mr-2 text-purple-600" /> Montant réel compté</label><input type="number" autoFocus value={closingBalance || ''} onChange={(e) => setClosingBalance(parseFloat(e.target.value) || 0)} className="w-full px-6 py-5 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-3xl font-black text-slate-900 dark:text-white outline-none focus:border-purple-500 text-center" placeholder="0" /></div><div className={`p-4 rounded-2xl border flex items-center justify-between transition-colors ${difference === 0 ? 'bg-slate-50 border-slate-100 text-slate-500' : difference > 0 ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-rose-50 border-rose-100 text-rose-600'}`}><span className="text-[10px] font-black uppercase tracking-widest">Écart</span><span className="text-lg font-black font-mono">{difference > 0 ? '+' : ''}{difference.toLocaleString()} {config.currency}</span></div></div>
          <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex space-x-3"><button onClick={() => setShowClosingModal(false)} className="flex-1 px-4 py-4 rounded-2xl font-black text-slate-500 hover:bg-slate-100 uppercase tracking-widest text-[10px]">Annuler</button><button onClick={() => onCloseSession(closingBalance)} className="flex-[2] bg-slate-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs">Valider</button></div>
        </div>
      </div>
    );
  };

  if (!session) return <SessionModal />;
  if (!selectedLocation) return <FloorPlan />;

  return (
    <div className="h-full flex flex-col md:flex-row gap-6 animate-fadeIn overflow-hidden pb-4">
      {lastSale && <ReceiptModal sale={lastSale} onClose={() => setLastSale(null)} />}
      {showPaymentModal && <PaymentModal />}
      {showClosingModal && <ClosingModal />}
      <div className="flex-1 flex flex-col min-w-0 space-y-4">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-sm border border-slate-200 dark:border-slate-800 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-800 pb-4">
            <button onClick={() => setSelectedLocation(null)} className="flex items-center space-x-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"><ArrowLeft size={14} /><span>Plan de Salle</span></button>
            <div className="flex-1 max-w-md mx-6"><div className="relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} /><input type="text" placeholder="Rechercher plat..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-purple-500 dark:text-white" /></div></div>
            <button onClick={() => setShowClosingModal(true)} className="px-4 py-2 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-lg text-[10px] font-black uppercase tracking-widest border border-rose-100 dark:border-rose-800">Clôture</button>
          </div>

          {/* SÉLECTEUR DE TABLES GROUPÉ (Au-dessus des catégories) */}
          {renderLocationQuickSwitch()}

          {/* CATÉGORIES (En dessous des tables) */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-hide pt-2 border-t border-slate-50 dark:border-slate-800">
            {categories.map(cat => (
              <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-6 py-2 rounded-full text-[10px] uppercase tracking-widest font-black whitespace-nowrap transition-all ${activeCategory === cat ? 'bg-purple-600 text-white shadow-lg' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200'}`}>{getCategoryIcon(cat)}<span className="ml-2">{cat}</span></button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto pr-2 space-y-8 scrollbar-hide">
          {filteredProductsGrouped.map((group, gIdx) => (
            <div key={gIdx} className="space-y-4">
              <div className="flex items-center space-x-4"><h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] whitespace-nowrap bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700">{group.name}</h2><div className="h-px flex-1 bg-slate-100 dark:bg-slate-800"></div></div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">{group.products.map(product => (<button key={product.id} onClick={() => addToCart(product)} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group flex flex-col text-left h-fit"><div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/20 rounded-xl flex items-center justify-center text-purple-600 mb-4 group-hover:bg-purple-600 group-hover:text-white transition-colors"><Utensils size={20} /></div><h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 leading-snug flex-1 mb-3">{product.name}</h3><p className="text-lg font-black text-purple-600 dark:text-purple-400">{product.price.toLocaleString()} <span className="text-[10px] uppercase font-bold text-slate-400 tracking-tighter">{config.currency}</span></p></button>))}</div>
            </div>
          ))}
          {filteredProductsGrouped.length === 0 && <div className="flex flex-col items-center justify-center h-64 text-slate-400 opacity-50"><Search size={48} className="mb-4" /><p className="text-sm font-black uppercase tracking-widest">Aucun plat trouvé</p></div>}
        </div>
      </div>
      <div className="w-full md:w-96 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col space-y-4 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3"><div className="bg-purple-600 p-2 rounded-xl text-white shadow-lg"><ShoppingBag size={20} /></div><h3 className="font-black text-slate-800 dark:text-white uppercase tracking-tighter">Panier : {selectedLocation}</h3></div>
            <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-3 py-1 rounded-full text-xs font-black">{currentCart.length} plats</span>
          </div>
          <div className="flex items-center justify-between bg-white dark:bg-slate-900 px-4 py-3 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">État Table</span><span className={`text-xs font-black uppercase tracking-widest px-2 py-1 rounded-md ${currentCart.length > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>{currentCart.length > 0 ? 'Active' : 'Libre'}</span></div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">{currentCart.length === 0 ? (<div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4 opacity-40"><div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center"><Utensils size={32} className="text-slate-400" /></div><p className="text-sm font-bold text-slate-500 uppercase tracking-widest leading-relaxed">Le panier est vide.</p></div>) : (currentCart.map(item => (<div key={item.id} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 animate-slideInRight"><div className="flex-1 mr-4"><p className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-tight mb-1">{item.name}</p><p className="text-xs font-black text-purple-600 dark:text-purple-400">{(item.price * item.quantity).toLocaleString()} {config.currency}</p></div><div className="flex items-center space-x-2"><div className="flex items-center bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-1"><button onClick={() => updateQuantity(item.id, -1)} className="p-1 text-slate-400 hover:text-rose-500"><Minus size={14} /></button><span className="w-8 text-center text-xs font-black dark:text-white">{item.quantity}</span><button onClick={() => updateQuantity(item.id, 1)} className="p-1 text-slate-400 hover:text-purple-600"><Plus size={14} /></button></div><button onClick={() => removeFromCart(item.id)} className="p-2 text-slate-400 hover:text-rose-500 transition-colors"><Trash2 size={16} /></button></div></div>)))}</div>
        <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 space-y-3 transition-colors"><div className="space-y-1"><div className="flex justify-between text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest"><span>Sous-total</span><span>{total.toLocaleString()} {config.currency}</span></div><div className="flex justify-between text-slate-900 dark:text-slate-100 font-black text-2xl pt-1 border-t border-slate-200 dark:border-slate-700"><span>TOTAL</span><span>{total.toLocaleString()} {config.currency}</span></div></div><div className="grid grid-cols-1 gap-2 pt-2"><button onClick={() => setShowPaymentModal(true)} disabled={currentCart.length === 0} className={`w-full py-4 rounded-2xl flex items-center justify-center space-x-2 font-black text-lg shadow-lg transition-all ${currentCart.length > 0 ? 'bg-purple-600 text-white hover:bg-purple-700 transform active:scale-95 shadow-purple-500/20' : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'}`}><span>ENCAISSER</span><ChevronRight size={20} /></button><button onClick={handleQuickCashSale} disabled={currentCart.length === 0} className={`w-full py-3 rounded-2xl flex items-center justify-center space-x-2 font-black text-xs uppercase tracking-widest transition-all ${currentCart.length > 0 ? 'bg-emerald-600 text-white hover:bg-emerald-700 transform active:scale-95 shadow-emerald-500/20' : 'bg-slate-200 dark:bg-slate-800 text-slate-300 dark:text-slate-700 cursor-not-allowed'}`}><Zap size={14} /><span>Espèces (Paiement direct)</span></button></div></div>
      </div>
    </div>
  );
};

export default POS;
