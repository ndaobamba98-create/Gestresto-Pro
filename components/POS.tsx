
import React, { useState, useMemo } from 'react';
import { Product, SaleOrder, ERPConfig, CashSession } from '../types';
import { Search, Plus, Minus, Trash2, ShoppingBag, Utensils, Monitor, Banknote, ChevronLeft, Layers, MapPin, Coffee, Package, Truck } from 'lucide-react';
import { APP_USERS, POS_LOCATIONS } from '../constants';

interface CartItem {
  product: Product;
  qty: number;
}

interface Props {
  products: Product[];
  onSaleComplete: (sale: Partial<SaleOrder>) => void;
  config: ERPConfig;
  session: CashSession | null;
  onOpenSession: (openingBalance: number, cashierId: string) => void;
  onCloseSession: (closingBalance: number) => void;
  notify: (title: string, message: string, type?: 'success' | 'info' | 'warning') => void;
  userPermissions: any;
}

const POS: React.FC<Props> = ({ products, onSaleComplete, config, session, onOpenSession, onCloseSession, notify }) => {
  // Gestion Multi-Paniers : { [emplacement]: items[] }
  const [pendingCarts, setPendingCarts] = useState<Record<string, CartItem[]>>({});
  
  const [activeLocation, setActiveLocation] = useState<string>(POS_LOCATIONS.tables[0]);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('Tous');

  // Session state
  const [sessionStep, setSessionStep] = useState<'cashier' | 'balance'>('cashier');
  const [openingBalance, setOpeningBalance] = useState<number>(0);
  const [selectedCashierId, setSelectedCashierId] = useState<string | null>(null);
  const [showClosingModal, setShowClosingModal] = useState(false);
  const [closingInput, setClosingInput] = useState<number>(0);

  // Liste ordonnée de tous les emplacements
  const allLocations = useMemo(() => [
    ...POS_LOCATIONS.tables.map(l => ({ id: l, icon: Utensils, label: l })),
    ...POS_LOCATIONS.bar.map(l => ({ id: l, icon: Coffee, label: l })),
    ...POS_LOCATIONS.takeaway.map(l => ({ id: l, icon: Package, label: l })),
    ...POS_LOCATIONS.delivery.map(l => ({ id: l, icon: Truck, label: l }))
  ], []);

  // Tri alphabétique des catégories et des produits
  const sortedCategories = useMemo(() => [...config.categories].sort((a, b) => a.localeCompare(b)), [config.categories]);

  const groupedProducts = useMemo(() => {
    const filtered = products.filter(p => 
      p.name.toLowerCase().includes(search.toLowerCase())
    );

    const categoriesToDisplay = activeCategory === 'Tous' 
      ? sortedCategories 
      : sortedCategories.filter(c => c === activeCategory);

    return categoriesToDisplay.map(cat => ({
      name: cat,
      items: filtered
        .filter(p => p.category === cat)
        .sort((a, b) => a.name.localeCompare(b.name)) // Tri alphabétique des plats de A à Z
    })).filter(group => group.items.length > 0);
  }, [products, search, activeCategory, sortedCategories]);

  const currentCart = pendingCarts[activeLocation] || [];

  const updateCartForActiveLocation = (items: CartItem[]) => {
    setPendingCarts(prev => ({
      ...prev,
      [activeLocation]: items
    }));
  };

  const addToCart = (p: Product) => {
    const exists = currentCart.find(item => item.product.id === p.id);
    let newItems;
    if (exists) {
      newItems = currentCart.map(item => item.product.id === p.id ? {...item, qty: item.qty + 1} : item);
    } else {
      newItems = [...currentCart, {product: p, qty: 1}];
    }
    updateCartForActiveLocation(newItems);
  };

  const removeFromCart = (productId: string) => {
    const newItems = currentCart.filter(i => i.product.id !== productId);
    updateCartForActiveLocation(newItems);
  };

  const adjustQty = (productId: string, delta: number) => {
    const newItems = currentCart.map(item => {
      if (item.product.id === productId) {
        return { ...item, qty: Math.max(1, item.qty + delta) };
      }
      return item;
    });
    updateCartForActiveLocation(newItems);
  };

  const total = currentCart.reduce((acc, curr) => acc + (curr.product.price * curr.qty), 0);

  const handleCheckout = () => {
    if (currentCart.length === 0) return;
    onSaleComplete({
      total,
      items: currentCart.map(i => ({ productId: i.product.id, name: i.product.name, quantity: i.qty, price: i.product.price })),
      paymentMethod: 'Especes',
      orderLocation: activeLocation
    });
    
    // Vider le panier de l'emplacement actif après paiement
    const updatedCarts = { ...pendingCarts };
    delete updatedCarts[activeLocation];
    setPendingCarts(updatedCarts);

    notify("Succès", `Commande encaissée pour ${activeLocation}`, "success");
  };

  if (!session) {
    return (
      <div className="h-full flex items-center justify-center animate-fadeIn">
        <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
          <div className="p-10 text-center space-y-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700">
            <div className="w-16 h-16 bg-purple-600 text-white rounded-2xl flex items-center justify-center mx-auto shadow-xl mb-4">
              <Monitor size={32} />
            </div>
            <h2 className="text-2xl font-black uppercase tracking-tighter">Ouverture de Session</h2>
            <p className="text-slate-500 text-sm font-medium">Veuillez préparer la caisse pour le service.</p>
          </div>
          <div className="p-10">
            {sessionStep === 'cashier' ? (
              <div className="space-y-6">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Sélectionnez le caissier responsable</p>
                <div className="grid grid-cols-2 gap-4">
                  {APP_USERS.filter(u => u.role === 'cashier' || u.role === 'admin').map(u => (
                    <button key={u.id} onClick={() => { setSelectedCashierId(u.id); setSessionStep('balance'); }} className="p-6 bg-slate-50 dark:bg-slate-800 hover:bg-purple-600 hover:text-white rounded-3xl transition-all flex flex-col items-center space-y-3 border-2 border-transparent hover:border-purple-400 group">
                      <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-700 text-purple-600 font-black flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">{u.initials}</div>
                      <span className="font-black text-[10px] uppercase tracking-widest">{u.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <button onClick={() => setSessionStep('cashier')} className="text-[10px] font-black text-purple-600 uppercase flex items-center"><ChevronLeft size={14} className="mr-1"/> Retour</button>
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fonds de caisse initial ({config.currency})</label>
                  <div className="relative">
                    <Banknote className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input type="number" value={openingBalance || ''} onChange={e => setOpeningBalance(parseFloat(e.target.value) || 0)} className="w-full pl-12 pr-6 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl text-2xl font-black focus:border-purple-500 outline-none transition-all" />
                  </div>
                </div>
                <button onClick={() => selectedCashierId && onOpenSession(openingBalance, selectedCashierId)} className="w-full py-4 bg-purple-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-purple-700 active:scale-95 transition-all">Démarrer le service</button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-4 overflow-hidden">
      {/* BARRE DES EMPLACEMENTS (Multi-Commandes) */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center space-x-3 overflow-x-auto scrollbar-hide shrink-0">
        <div className="flex items-center space-x-2 border-r pr-4 mr-2 border-slate-100 dark:border-slate-800">
           <MapPin size={16} className="text-purple-600" />
           <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest whitespace-nowrap">Service</span>
        </div>
        <div className="flex items-center space-x-2">
          {allLocations.map((loc) => {
            const hasItems = pendingCarts[loc.id] && pendingCarts[loc.id].length > 0;
            return (
              <button 
                key={loc.id} 
                onClick={() => setActiveLocation(loc.id)}
                className={`relative px-4 py-3 rounded-2xl flex flex-col items-center min-w-[90px] transition-all border-2 ${
                  activeLocation === loc.id 
                    ? 'bg-purple-600 border-purple-400 text-white shadow-lg' 
                    : 'bg-slate-50 dark:bg-slate-800 border-transparent text-slate-500 hover:bg-slate-100'
                }`}
              >
                <loc.icon size={16} className="mb-1" />
                <span className="text-[9px] font-black uppercase tracking-tight">{loc.label}</span>
                {hasItems && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900">
                    {pendingCarts[loc.id].length}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-1 gap-6 overflow-hidden">
        {/* CATALOGUE PRODUITS */}
        <div className="flex-1 flex flex-col space-y-4 min-w-0">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center space-x-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Chercher un plat (Ex: Omelette)..." className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none text-sm font-bold" />
              </div>
              <button onClick={() => setShowClosingModal(true)} className="px-4 py-2 bg-rose-50 text-rose-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all">Fermer Caisse</button>
            </div>

            <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-hide">
              <button 
                onClick={() => setActiveCategory('Tous')}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeCategory === 'Tous' ? 'bg-purple-600 text-white shadow-lg' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 hover:bg-slate-100'}`}
              >
                Tous
              </button>
              {sortedCategories.map(cat => (
                <button 
                  key={cat} 
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeCategory === cat ? 'bg-purple-600 text-white shadow-lg' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 hover:bg-slate-100'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 scrollbar-hide space-y-10">
            {groupedProducts.length > 0 ? (
              groupedProducts.map(group => (
                <div key={group.name} className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="p-1.5 bg-purple-50 dark:bg-purple-900/20 text-purple-600 rounded-lg">
                      <Layers size={14} />
                    </div>
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] whitespace-nowrap">{group.name}</h3>
                    <div className="h-px w-full bg-slate-200 dark:bg-slate-800"></div>
                  </div>
                  
                  <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {group.items.map(p => (
                      <button key={p.id} onClick={() => addToCart(p)} className="bg-white dark:bg-slate-900 p-5 rounded-[2rem] border border-slate-100 dark:border-slate-800 text-left hover:border-purple-500 hover:shadow-xl hover:-translate-y-1 transition-all group flex flex-col justify-between h-40">
                        <div className="space-y-1">
                          <span className="text-xs font-black uppercase text-slate-800 dark:text-white leading-tight group-hover:text-purple-600 transition-colors">{p.name}</span>
                          <p className="text-[9px] font-bold text-slate-400 tracking-wider uppercase opacity-60">{p.sku}</p>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-black text-purple-600">{p.price} <span className="text-[10px] font-bold uppercase opacity-60">{config.currency}</span></span>
                          <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl group-hover:bg-purple-600 group-hover:text-white transition-all"><Plus size={16}/></div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center opacity-30 text-center space-y-4 py-20">
                <Utensils size={48} />
                <p className="text-sm font-black uppercase tracking-widest">Aucun résultat trouvé</p>
              </div>
            )}
          </div>
        </div>

        {/* PANIER ACTIF */}
        <div className="w-96 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden shadow-2xl shrink-0">
          <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between">
            <div className="flex flex-col">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-600 text-white rounded-lg shadow-lg"><ShoppingBag size={18} /></div>
                <h3 className="text-sm font-black uppercase tracking-tight">{activeLocation}</h3>
              </div>
              <span className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Commande active</span>
            </div>
            <button onClick={() => updateCartForActiveLocation([])} className="text-slate-300 hover:text-rose-500 transition-colors"><Trash2 size={18} /></button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-3 scrollbar-hide">
            {currentCart.map(item => (
              <div key={item.product.id} className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 animate-slideInRight group">
                <div className="flex-1 mr-4">
                  <p className="text-[10px] font-black uppercase truncate text-slate-800 dark:text-slate-200">{item.product.name}</p>
                  <p className="text-[9px] font-bold text-slate-400">{(item.product.price * item.qty)} {config.currency}</p>
                </div>
                <div className="flex items-center space-x-3">
                  <button onClick={() => adjustQty(item.product.id, -1)} className="p-1.5 bg-white dark:bg-slate-700 rounded-lg shadow-sm hover:text-purple-600 transition-all"><Minus size={12}/></button>
                  <span className="text-xs font-black w-4 text-center">{item.qty}</span>
                  <button onClick={() => adjustQty(item.product.id, 1)} className="p-1.5 bg-white dark:bg-slate-700 rounded-lg shadow-sm hover:text-purple-600 transition-all"><Plus size={12}/></button>
                  <button onClick={() => removeFromCart(item.product.id)} className="ml-2 p-1 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
            {currentCart.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center opacity-20 text-center space-y-4 py-20">
                <Utensils size={48} />
                <p className="text-[10px] font-black uppercase tracking-widest">Le panier pour {activeLocation} est vide</p>
              </div>
            )}
          </div>

          <div className="p-8 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 space-y-6">
            <div className="flex justify-between items-center pt-2">
              <span className="text-slate-400 uppercase text-[10px] font-black tracking-widest">Net à Payer</span>
              <span className="text-3xl font-black text-slate-900 dark:text-white">{total.toLocaleString()} <span className="text-sm font-bold">{config.currency}</span></span>
            </div>
            
            <button onClick={handleCheckout} disabled={currentCart.length === 0} className="w-full py-5 bg-purple-600 text-white rounded-[2rem] font-black uppercase tracking-widest shadow-2xl shadow-purple-900/20 active:scale-95 disabled:opacity-50 transition-all">Encaisser {activeLocation}</button>
          </div>
        </div>
      </div>

      {showClosingModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-md rounded-[2.5rem] p-10 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-xl font-black uppercase text-center mb-6">Clôture de Caisse</h3>
            <div className="space-y-4 mb-8">
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-800">
                <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Total Attendu</p>
                <p className="text-2xl font-black">{session.expectedBalance.toLocaleString()} {config.currency}</p>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Comptage Réel</label>
                <input type="number" value={closingInput || ''} onChange={e => setClosingInput(parseFloat(e.target.value) || 0)} className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-2 border-slate-100 dark:border-slate-700 focus:border-rose-500 outline-none font-black text-xl transition-all" />
              </div>
            </div>
            <div className="flex flex-col space-y-3">
              <button onClick={() => onCloseSession(closingInput)} className="w-full py-4 bg-rose-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl active:scale-95 transition-all">Fermer la Caisse</button>
              <button onClick={() => setShowClosingModal(false)} className="w-full py-3 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-2xl font-black uppercase text-[10px] transition-all">Annuler</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default POS;
