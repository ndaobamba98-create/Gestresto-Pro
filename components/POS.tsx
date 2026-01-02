import React, { useState, useMemo } from 'react';
import { Product, SaleOrder, ERPConfig, CashSession, PaymentMethod } from '../types';
import { Search, Plus, Minus, Trash2, ShoppingBag, Utensils, Monitor, Banknote, ChevronLeft, Layers, MapPin, Coffee, Package, Truck, History, RotateCcw, X, FileText, CreditCard, Smartphone, Wallet, LayoutGrid, PauseCircle, Users, Printer, QrCode, AlertCircle } from 'lucide-react';
import { APP_USERS, POS_LOCATIONS, PAYMENT_METHODS_LIST } from '../constants';
import * as XLSX from 'xlsx';
import { AppLogoDoc } from './Invoicing';

interface CartItem {
  product: Product;
  qty: number;
}

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
  const [locationPaymentMethods, setLocationPaymentMethods] = useState<Record<string, PaymentMethod>>({});

  const [sessionStep, setSessionStep] = useState<'cashier' | 'balance'>('cashier');
  const [openingBalance, setOpeningBalance] = useState<number>(0);
  const [selectedCashierId, setSelectedCashierId] = useState<string | null>(null);
  const [showClosingModal, setShowClosingModal] = useState(false);
  const [closingInput, setClosingInput] = useState<number>(0);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // --- LOGIQUE DE SESSION AMÉLIORÉE ---
  
  // Calculer les ventes de la session actuelle uniquement
  const sessionSales = useMemo(() => {
    if (!session) return [];
    const openTime = new Date(session.openedAt).getTime();
    return sales.filter(s => {
      // Extraction de la date (compatible format ISO ou local)
      const saleTimeStr = s.date.includes(',') ? s.date.split(',')[1].trim() : s.date.split(' ')[1];
      const saleDateStr = s.date.includes(',') ? s.date.split(',')[0].trim() : s.date.split(' ')[0];
      
      // On convertit la date de vente en timestamp pour comparaison
      let parts = saleDateStr.split(saleDateStr.includes('/') ? '/' : '-');
      const d = parts.length === 3 ? (saleDateStr.includes('/') ? new Date(`${parts[2]}-${parts[1]}-${parts[0]}T${saleTimeStr}`) : new Date(s.date)) : new Date();
      
      return d.getTime() >= openTime;
    });
  }, [sales, session]);

  // Solde théorique actualisé : Fonds initial + Somme des ventes (hors remboursements)
  const currentExpectedBalance = useMemo(() => {
    if (!session) return 0;
    const revenue = sessionSales.reduce((acc, curr) => 
      curr.status === 'refunded' ? acc - curr.total : acc + curr.total, 0
    );
    return session.openingBalance + revenue;
  }, [session, sessionSales]);

  const salesBreakdown = useMemo(() => {
    const breakdown: Record<string, number> = {};
    sessionSales.forEach(s => {
      const m = s.paymentMethod || 'Especes';
      breakdown[m] = (breakdown[m] || 0) + (s.status === 'refunded' ? -s.total : s.total);
    });
    return Object.entries(breakdown);
  }, [sessionSales]);

  // --- FIN LOGIQUE DE SESSION ---

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
  const currentPaymentMethod = activeLocation ? (locationPaymentMethods[activeLocation] || 'Especes') : 'Especes';

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
  };

  const adjustQty = (productId: string, delta: number) => {
    const newItems = currentCart.map(item => 
      item.product.id === productId ? { ...item, qty: Math.max(1, item.qty + delta) } : item
    );
    updateCartForActiveLocation(newItems);
  };

  const total = currentCart.reduce((acc, curr) => acc + (curr.product.price * curr.qty), 0);

  // Added handleRefund function to fix the "Cannot find name 'handleRefund'" error.
  const handleRefund = (sale: SaleOrder) => {
    onSaleComplete({
      total: sale.total,
      items: sale.items,
      paymentMethod: sale.paymentMethod,
      orderLocation: sale.orderLocation,
      customer: `REF: ${sale.customer}`,
      status: 'refunded'
    });
    notify("Annulation", `La vente #${sale.id.slice(-8)} a été créditée au journal.`, 'warning');
  };

  const handleCheckout = () => {
    if (!activeLocation || currentCart.length === 0) return;
    onSaleComplete({
      total,
      items: currentCart.map(i => ({ productId: i.product.id, name: i.product.name, quantity: i.qty, price: i.product.price })),
      paymentMethod: currentPaymentMethod,
      orderLocation: activeLocation,
      status: 'confirmed'
    });
    const updatedCarts = { ...pendingCarts };
    delete updatedCarts[activeLocation];
    setPendingCarts(updatedCarts);
    setActiveLocation(null);
  };

  const handleCloseSessionWithReport = () => {
    // Imprimer le rapport de session avant de fermer
    window.print();
    onCloseSession(closingInput);
    setShowClosingModal(false);
  };

  if (!session) {
    return (
      <div className="h-full flex items-center justify-center animate-fadeIn no-print">
        <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
          <div className="p-10 text-center space-y-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700">
            <div className="w-20 h-20 bg-purple-600 text-white rounded-3xl flex items-center justify-center mx-auto shadow-xl mb-6 scale-110"><Monitor size={40} /></div>
            <h2 className="text-3xl font-black uppercase tracking-tighter text-slate-900 dark:text-white">Démarrage Session</h2>
            <p className="text-slate-500 text-sm font-medium">Initialisation du terminal de vente MYA D'OR.</p>
          </div>
          <div className="p-10">
            {sessionStep === 'cashier' ? (
              <div className="space-y-8">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Sélectionnez votre profil utilisateur</p>
                <div className="grid grid-cols-2 gap-4">
                  {APP_USERS.filter(u => u.role === 'cashier' || u.role === 'admin').map(u => (
                    <button key={u.id} onClick={() => { setSelectedCashierId(u.id); setSessionStep('balance'); }} className="p-6 bg-slate-50 dark:bg-slate-800 hover:bg-purple-600 hover:text-white rounded-[2rem] transition-all flex flex-col items-center space-y-4 border-2 border-transparent group">
                      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${u.color} text-white font-black flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>{u.initials}</div>
                      <span className="font-black text-xs uppercase tracking-widest">{u.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                <button onClick={() => setSessionStep('cashier')} className="text-[10px] font-black text-purple-600 uppercase flex items-center hover:bg-purple-50 px-3 py-1 rounded-lg transition-all w-fit"><ChevronLeft size={14} className="mr-1"/> Changer de caissier</button>
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Fonds de caisse initial ({config.currency})</label>
                  <div className="relative">
                    <Banknote className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={24} />
                    <input autoFocus type="number" value={openingBalance || ''} onChange={e => setOpeningBalance(parseFloat(e.target.value) || 0)} className="w-full pl-16 pr-8 py-6 bg-slate-100 dark:bg-slate-800 border-none rounded-[2rem] text-3xl font-black focus:ring-4 focus:ring-purple-500/20 outline-none transition-all" placeholder="0.00" />
                  </div>
                </div>
                <button onClick={() => selectedCashierId && onOpenSession(openingBalance, selectedCashierId)} className="w-full py-6 bg-purple-600 text-white rounded-[2rem] font-black uppercase text-sm tracking-widest shadow-2xl shadow-purple-900/40 hover:bg-purple-700 active:scale-95 transition-all">Lancer le service</button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!activeLocation) {
    return (
      <div className="h-full flex flex-col space-y-8 animate-fadeIn no-print">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Gestion de Salle</h1>
            <p className="text-sm text-slate-500 font-medium">Session de <span className="text-purple-600 font-black">{session.cashierName}</span> • En cours depuis {new Date(session.openedAt).toLocaleTimeString()}</p>
          </div>
          <div className="flex items-center space-x-3">
             <button onClick={() => setShowHistoryModal(true)} className="px-6 py-3 bg-white dark:bg-slate-900 border rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center hover:bg-slate-50 transition-all shadow-sm"><History size={16} className="mr-2"/> Journal de Session</button>
             <button onClick={() => setShowClosingModal(true)} className="px-6 py-3 bg-rose-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-rose-900/20 hover:bg-rose-700 transition-all">Fermer la Caisse</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 scrollbar-hide space-y-12">
          {allLocations.map((group) => (
            <div key={group.category} className="space-y-6">
              <div className="flex items-center space-x-4">
                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] whitespace-nowrap">{group.category}</h3>
                <div className="h-px w-full bg-slate-200 dark:bg-slate-800"></div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                {group.items.map((loc) => {
                  const cart = pendingCarts[loc.id] || [];
                  const isOccupied = cart.length > 0;
                  const cartTotal = cart.reduce((acc, curr) => acc + (curr.product.price * curr.qty), 0);
                  return (
                    <button key={loc.id} onClick={() => setActiveLocation(loc.id)} className={`relative h-44 rounded-[2.5rem] border-2 transition-all flex flex-col items-center justify-center p-6 group hover:-translate-y-2 hover:shadow-2xl ${isOccupied ? 'bg-purple-600 border-purple-400 text-white shadow-xl shadow-purple-900/20' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-400 hover:border-purple-200'}`}>
                      <loc.icon size={32} className={`mb-4 transition-transform group-hover:scale-110 ${isOccupied ? 'text-white' : 'text-slate-300'}`} />
                      <span className={`text-[11px] font-black uppercase tracking-widest ${isOccupied ? 'text-white' : 'text-slate-500'}`}>{loc.label}</span>
                      {isOccupied && <div className="mt-3 flex flex-col items-center"><span className="text-lg font-black leading-none">{cartTotal.toLocaleString()}</span><span className="text-[8px] font-black uppercase opacity-60 mt-1">{config.currency}</span></div>}
                      {!isOccupied && <span className="mt-3 text-[9px] font-bold uppercase opacity-40">Disponible</span>}
                      {isOccupied && <div className="absolute top-4 right-4 w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_#34d399]"></div>}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-4 overflow-hidden animate-fadeIn">
      {/* RENDER D'IMPRESSION RAPPORT Z-REPORT (Caché écran) */}
      <div id="report-print-area" className="hidden print:block p-12 bg-white text-slate-950 font-mono text-[10px] w-80 mx-auto border border-dashed">
         <div className="text-center mb-6">
            <AppLogoDoc className="w-12 h-12 mx-auto mb-2" />
            <h1 className="text-sm font-black uppercase">{config.companyName}</h1>
            <p className="text-[8px] uppercase">{config.address}</p>
            <div className="border-b border-black border-dashed my-4"></div>
            <h2 className="text-xs font-black uppercase">ARRÊTÉ DE CAISSE (Z)</h2>
            <p className="mt-1">Session #{session.id.slice(-6)}</p>
         </div>

         <div className="space-y-1 mb-6">
            <div className="flex justify-between"><span>OUVERTURE :</span><span>{new Date(session.openedAt).toLocaleString()}</span></div>
            <div className="flex justify-between"><span>CLÔTURE :</span><span>{new Date().toLocaleString()}</span></div>
            <div className="flex justify-between"><span>RESPONSABLE :</span><span className="font-black uppercase">{session.cashierName}</span></div>
         </div>

         <div className="border-b border-black border-dashed my-4"></div>

         <div className="space-y-2 mb-6">
            <div className="flex justify-between"><span>FONDS INITIAL :</span><span className="font-bold">{session.openingBalance.toLocaleString()} {config.currency}</span></div>
            {salesBreakdown.map(([method, val]) => (
               <div key={method} className="flex justify-between pl-4"><span>• {method.toUpperCase()} :</span><span>{val.toLocaleString()} {config.currency}</span></div>
            ))}
            <div className="flex justify-between font-black border-t pt-2"><span>ATTENDU TOTAL :</span><span>{currentExpectedBalance.toLocaleString()} {config.currency}</span></div>
            <div className="flex justify-between font-black"><span>COMPTÉ RÉEL :</span><span>{closingInput.toLocaleString()} {config.currency}</span></div>
            <div className={`flex justify-between font-black border-t pt-2 ${closingInput - currentExpectedBalance < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
               <span>ÉCART :</span><span>{(closingInput - currentExpectedBalance).toLocaleString()} {config.currency}</span>
            </div>
         </div>

         <div className="text-center mt-10 space-y-6">
            <div className="flex justify-between opacity-50 px-4">
               <span>Signature Caisse</span>
               <span>Visa Manager</span>
            </div>
            <div className="h-10"></div>
            <p className="text-[8px] uppercase italic">Généré par Sama Pos + Cloud System</p>
            <QrCode size={40} className="mx-auto opacity-20" />
         </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between shrink-0 no-print">
        <div className="flex items-center space-x-6">
           <button onClick={() => setActiveLocation(null)} className="flex items-center space-x-3 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-purple-600 hover:text-white transition-all group">
             <LayoutGrid size={18} className="group-hover:rotate-90 transition-transform duration-500" />
             <span className="text-[10px] font-black uppercase tracking-widest">Salles</span>
           </button>
           <div className="h-8 w-px bg-slate-100 dark:bg-slate-800"></div>
           <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-600 text-white rounded-lg shadow-lg"><Utensils size={16} /></div>
              <div className="flex flex-col">
                <h2 className="text-sm font-black uppercase tracking-tight leading-none">{activeLocation}</h2>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Prise de commande</span>
              </div>
           </div>
        </div>
        <div className="flex items-center space-x-3">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Chercher un plat..." className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none text-[11px] font-bold" />
          </div>
          <button onClick={() => setActiveLocation(null)} className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl">Mettre en attente</button>
        </div>
      </div>

      <div className="flex flex-1 gap-6 overflow-hidden no-print">
        <div className="flex-1 flex flex-col space-y-4 min-w-0">
          <div className="bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-x-auto scrollbar-hide flex items-center space-x-2">
              <button onClick={() => setActiveCategory('Tous')} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeCategory === 'Tous' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-100'}`}>Tous</button>
              {config.categories.map(cat => (
                <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeCategory === cat ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-100'}`}>{cat}</button>
              ))}
          </div>
          <div className="flex-1 overflow-y-auto pr-2 scrollbar-hide space-y-10">
            {groupedProducts.map(group => (
              <div key={group.name} className="space-y-4">
                <div className="flex items-center space-x-4"><h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] whitespace-nowrap">{group.name}</h3><div className="h-px w-full bg-slate-200 dark:bg-slate-800 opacity-50"></div></div>
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {group.items.map(p => (
                    <button key={p.id} onClick={() => addToCart(p)} className="bg-white dark:bg-slate-900 p-5 rounded-[2rem] border border-slate-100 dark:border-slate-800 text-left hover:border-purple-500 hover:shadow-xl hover:-translate-y-1 transition-all group flex flex-col justify-between h-44">
                      <div className="space-y-1">
                        <span className="text-xs font-black uppercase text-slate-800 dark:text-white leading-tight group-hover:text-purple-600 transition-colors">{p.name}</span>
                        <p className="text-[9px] font-bold text-slate-400 tracking-wider uppercase opacity-60">{p.sku}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xl font-black text-purple-600">{p.price} <span className="text-[10px] font-bold uppercase opacity-60">{config.currency}</span></span>
                        <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl group-hover:bg-purple-600 group-hover:text-white transition-all shadow-sm"><Plus size={18}/></div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="w-[420px] bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden shrink-0">
          <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between">
            <h3 className="text-sm font-black uppercase tracking-tight flex items-center"><ShoppingBag size={18} className="mr-3 text-purple-600" /> Panier {activeLocation}</h3>
            <button onClick={() => updateCartForActiveLocation([])} className="p-2 text-slate-300 hover:text-rose-500 transition-colors"><Trash2 size={20} /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-8 space-y-4 scrollbar-hide">
            {currentCart.map(item => (
              <div key={item.product.id} className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 animate-slideInRight">
                <div className="flex-1 mr-4">
                  <p className="text-[11px] font-black uppercase truncate text-slate-800 dark:text-slate-200">{item.product.name}</p>
                  <p className="text-[10px] font-bold text-slate-400">{(item.product.price * item.qty).toLocaleString()} {config.currency}</p>
                </div>
                <div className="flex items-center space-x-3">
                  <button onClick={() => adjustQty(item.product.id, -1)} className="p-2 bg-white dark:bg-slate-700 rounded-xl shadow-sm"><Minus size={14}/></button>
                  <span className="text-xs font-black w-6 text-center">{item.qty}</span>
                  <button onClick={() => addToCart(item.product)} className="p-2 bg-white dark:bg-slate-700 rounded-xl shadow-sm"><Plus size={14}/></button>
                </div>
              </div>
            ))}
          </div>
          <div className="p-10 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 space-y-8">
            <div className="space-y-4">
               <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Mode de Règlement</p>
               <div className="grid grid-cols-2 gap-3">
                  {PAYMENT_METHODS_LIST.filter(m => ['Especes', 'Bankily', 'Masrvi', 'Sedad'].includes(m.id)).map((method) => (
                    <button key={method.id} onClick={() => setLocationPaymentMethods({...locationPaymentMethods, [activeLocation!]: method.id})} className={`py-3.5 rounded-2xl flex items-center justify-center space-x-2 border-2 transition-all ${currentPaymentMethod === method.id ? 'bg-purple-600 border-purple-400 text-white shadow-xl shadow-purple-900/20' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-500'}`}>
                      <span className="text-[10px] font-black uppercase tracking-tighter">{method.label}</span>
                    </button>
                  ))}
               </div>
            </div>
            <div className="flex justify-between items-baseline pt-4 border-t border-dashed border-slate-200 dark:border-slate-700">
              <span className="text-slate-400 uppercase text-[10px] font-black tracking-[0.3em]">Total</span>
              <span className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">{total.toLocaleString()} <span className="text-sm font-bold ml-1">{config.currency}</span></span>
            </div>
            <button onClick={handleCheckout} disabled={currentCart.length === 0} className="w-full py-6 bg-purple-600 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-2xl shadow-purple-900/40 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center text-sm">Valider le paiement</button>
          </div>
        </div>
      </div>

      {showHistoryModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4 no-print">
          <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[85vh] animate-scaleIn">
            <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-xl font-black uppercase tracking-tighter">Historique des ventes du service</h3>
              <button onClick={() => setShowHistoryModal(false)} className="p-2 text-slate-400 hover:text-rose-500"><X size={28}/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 scrollbar-hide">
              <div className="space-y-4">
                {sessionSales.length > 0 ? sessionSales.map((sale) => (
                  <div key={sale.id} className={`flex items-center justify-between p-6 rounded-[2rem] border transition-all ${sale.status === 'refunded' ? 'bg-rose-50/50 border-rose-100' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700'}`}>
                    <div>
                      <p className="text-xs font-black uppercase text-slate-800 dark:text-slate-100">{sale.customer}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">{sale.date} • {sale.orderLocation}</p>
                    </div>
                    <div className="flex items-center space-x-6">
                      <p className={`text-xl font-black ${sale.status === 'refunded' ? 'text-rose-600' : 'text-slate-900 dark:text-white'}`}>{sale.total.toLocaleString()} {config.currency}</p>
                      {sale.status !== 'refunded' && <button onClick={() => handleRefund(sale)} className="bg-rose-600 text-white px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl">Annuler vente</button>}
                    </div>
                  </div>
                )) : <p className="text-center py-10 opacity-30 uppercase font-black tracking-widest">Aucune vente effectuée durant cette session</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      {showClosingModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[110] flex items-center justify-center p-4 no-print">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[3.5rem] p-12 shadow-2xl border border-slate-200 dark:border-slate-800 animate-scaleIn flex flex-col items-center">
            <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-rose-900/10">
              <Monitor size={32} />
            </div>
            <h3 className="text-2xl font-black uppercase tracking-tighter text-center mb-2 text-slate-900 dark:text-white">Clôture de Caisse</h3>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-8">Fin de service & Comptage physique</p>

            <div className="w-full space-y-6 mb-10">
              <div className="grid grid-cols-2 gap-4">
                 <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 text-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Solde Théorique</p>
                    <div className="flex items-baseline justify-center">
                      <span className="text-2xl font-black text-purple-600 tracking-tighter">{currentExpectedBalance.toLocaleString()}</span>
                      <span className="text-[10px] font-bold text-purple-400 ml-1">{config.currency}</span>
                    </div>
                 </div>
                 <div className="p-6 bg-purple-50 dark:bg-purple-900/20 rounded-3xl border border-purple-100 dark:border-purple-800 text-center">
                    <p className="text-[10px] font-black text-purple-400 uppercase mb-2">Ventes Nettes</p>
                    <div className="flex items-baseline justify-center">
                      <span className="text-2xl font-black text-purple-600 tracking-tighter">{(currentExpectedBalance - session.openingBalance).toLocaleString()}</span>
                    </div>
                 </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Montant physique compté</label>
                <div className="relative">
                  <Banknote className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input type="number" autoFocus value={closingInput || ''} onChange={e => setClosingInput(parseFloat(e.target.value) || 0)} className="w-full px-16 py-6 bg-slate-100 dark:bg-slate-800 rounded-[2.5rem] border-none focus:ring-4 focus:ring-rose-500/20 outline-none font-black text-3xl text-center transition-all" placeholder="0.00" />
                </div>
              </div>
              
              {Math.abs(closingInput - currentExpectedBalance) > 0 && (
                <div className={`p-4 rounded-2xl border flex items-center space-x-3 ${closingInput - currentExpectedBalance < 0 ? 'bg-rose-50 border-rose-100 text-rose-600' : 'bg-emerald-50 border-emerald-100 text-emerald-600'}`}>
                  <AlertCircle size={18} />
                  <p className="text-[10px] font-black uppercase">Écart de caisse : {(closingInput - currentExpectedBalance).toLocaleString()} {config.currency}</p>
                </div>
              )}
            </div>

            <div className="w-full grid grid-cols-1 gap-3">
              <button onClick={handleCloseSessionWithReport} className="w-full py-6 bg-rose-600 text-white rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-xl shadow-rose-900/20 hover:bg-rose-700 active:scale-95 transition-all flex items-center justify-center">
                <Printer size={18} className="mr-3" /> Imprimer Rapport & Fermer
              </button>
              <button onClick={() => setShowClosingModal(false)} className="w-full py-3 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-slate-600 transition-colors">
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default POS;