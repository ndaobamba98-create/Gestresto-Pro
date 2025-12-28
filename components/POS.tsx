
import React, { useState, useMemo, useEffect } from 'react';
import { Product, SaleOrder, ERPConfig, SaleItem, CashSession, PaymentMethod } from '../types';
import { Search, Plus, Minus, Trash2, ShoppingBag, CheckCircle, Utensils, X, Printer, CheckCircle2, Clock, Calendar, Lock, Unlock, DollarSign, Wallet, CreditCard, Banknote, ChevronRight, ArrowLeft, Delete, Zap } from 'lucide-react';

interface Props {
  products: Product[];
  onSaleComplete: (sale: SaleOrder) => void;
  config: ERPConfig;
  session: CashSession | null;
  onOpenSession: (openingBalance: number) => void;
  onCloseSession: (closingBalance: number) => void;
}

interface CartItem extends Product {
  quantity: number;
}

const POS: React.FC<Props> = ({ products, onSaleComplete, config, session, onOpenSession, onCloseSession }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('Tous');
  const [lastSale, setLastSale] = useState<SaleOrder | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [receivedAmount, setReceivedAmount] = useState<string>('');
  
  // Session State
  const [openingBalance, setOpeningBalance] = useState<number>(0);
  const [closingBalance, setClosingBalance] = useState<number>(0);
  const [showClosingModal, setShowClosingModal] = useState(false);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(products.map(p => p.category))).sort((a: string, b: string) => a.localeCompare(b));
    return ['Tous', ...cats];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products
      .filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = activeCategory === 'Tous' || p.category === activeCategory;
        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [products, searchTerm, activeCategory]);

  const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const numericReceived = parseFloat(receivedAmount) || 0;
  const changeAmount = Math.max(0, numericReceived - total);

  // Reset payment state when modal closes
  useEffect(() => {
    if (!showPaymentModal) {
      setSelectedMethod(null);
      setReceivedAmount('');
    }
  }, [showPaymentModal]);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === productId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const handleFinalizeSale = (methodOverride?: PaymentMethod, amountOverride?: number) => {
    const finalMethod = methodOverride || selectedMethod;
    if (!finalMethod) return;

    const saleItems: SaleItem[] = cart.map(item => ({
      productId: item.id,
      name: item.name,
      quantity: item.quantity,
      price: item.price
    }));

    const now = new Date();
    const formattedDateTime = now.toLocaleDateString('fr-FR') + ' ' + now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    const finalReceived = amountOverride !== undefined ? amountOverride : (numericReceived || total);
    const finalChange = amountOverride !== undefined ? 0 : changeAmount;

    const newSale: SaleOrder = {
      id: `S${Date.now().toString().slice(-4)}`,
      customer: 'Vente Comptoir',
      date: formattedDateTime,
      total: total,
      status: 'confirmed',
      items: saleItems,
      paymentMethod: finalMethod,
      amountReceived: finalReceived,
      change: finalChange
    };

    onSaleComplete(newSale);
    setLastSale(newSale);
    setCart([]);
    setShowPaymentModal(false);
  };

  const handleQuickCashSale = () => {
    handleFinalizeSale('Especes', total);
  };

  // UI Modals
  const PaymentModal = () => (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-scaleIn">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-xl font-black text-slate-800 dark:text-white">Paiement</h3>
          <button onClick={() => setShowPaymentModal(false)} className="p-2 text-slate-400 hover:text-rose-500 transition-colors"><X size={24} /></button>
        </div>
        <div className="p-8 space-y-6">
          <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 text-center">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Total à régler</p>
            <h2 className="text-4xl font-black text-purple-600 dark:text-purple-400">{total.toLocaleString()} {config.currency}</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {(['Especes', 'Bankily', 'Masrvi', 'Sedad', 'Bimbank'] as PaymentMethod[]).map(method => (
              <button 
                key={method}
                onClick={() => setSelectedMethod(method)}
                className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center transition-all ${selectedMethod === method ? 'bg-purple-600 border-purple-600 text-white shadow-lg' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'}`}
              >
                {method === 'Especes' ? <Banknote size={24} /> : <CreditCard size={24} />}
                <span className="mt-2 text-xs font-black uppercase tracking-tight">{method}</span>
              </button>
            ))}
          </div>
          {selectedMethod === 'Especes' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Montant Reçu</label>
                <input 
                  type="number" 
                  value={receivedAmount}
                  autoFocus
                  onChange={(e) => setReceivedAmount(e.target.value)}
                  className="w-full px-4 py-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-2xl font-black text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="0"
                />
              </div>
              {changeAmount > 0 && (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-800 flex justify-between items-center">
                  <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">Rendu monnaie:</span>
                  <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">{changeAmount.toLocaleString()} {config.currency}</span>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="p-6 bg-slate-50 dark:bg-slate-800 border-t border-slate-100 dark:border-slate-800">
          <button 
            disabled={!selectedMethod || (selectedMethod === 'Especes' && numericReceived < total)}
            onClick={() => handleFinalizeSale()}
            className="w-full bg-purple-600 text-white py-4 rounded-2xl font-black text-lg hover:bg-purple-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed transition-all shadow-xl shadow-purple-900/20"
          >
            CONFIRMER LA VENTE
          </button>
        </div>
      </div>
    </div>
  );

  const ReceiptModal = ({ sale, onClose }: { sale: SaleOrder, onClose: () => void }) => (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden animate-scaleIn border border-slate-200 dark:border-slate-800 p-8 flex flex-col items-center">
        <h4 className="font-black text-slate-800 dark:text-white tracking-tighter uppercase text-sm mb-4 text-center">
          {config.companyName}
        </h4>
        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mb-4">
          <CheckCircle2 size={32} />
        </div>
        <h3 className="text-xl font-black text-slate-800 dark:text-white mb-1">Vente Terminée</h3>
        <p className="text-emerald-500 text-[10px] mb-6 font-black flex items-center uppercase bg-emerald-50 dark:bg-emerald-900/20 px-4 py-1.5 rounded-full">
          {sale.paymentMethod}
        </p>
        
        <div className="w-full border-t border-dashed border-slate-200 dark:border-slate-800 py-6 space-y-3">
          {sale.items?.map((item, idx) => (
            <div key={idx} className="flex justify-between text-xs">
              <span className="text-slate-600 dark:text-slate-300 font-bold">{item.quantity}x {item.name}</span>
              <span className="text-slate-800 dark:text-white font-black">{(item.quantity * item.price).toLocaleString()} {config.currency}</span>
            </div>
          ))}
          
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-black text-slate-500 uppercase">Total à payer</span>
              <span className="text-xl font-black text-purple-600 dark:text-purple-400">{sale.total.toLocaleString()} {config.currency}</span>
            </div>
            
            {(sale.amountReceived || 0) > 0 && (
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-400">Montant reçu</span>
                <span className="font-black text-slate-700 dark:text-slate-300">{(sale.amountReceived || 0).toLocaleString()} {config.currency}</span>
              </div>
            )}
            
            {(sale.change || 0) > 0 && (
              <div className="flex justify-between items-center py-2 px-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                <span className="text-[10px] font-black text-purple-600 uppercase">Monnaie à rendre</span>
                <span className="text-sm font-black text-purple-700 dark:text-purple-300">{(sale.change || 0).toLocaleString()} {config.currency}</span>
              </div>
            )}
          </div>
        </div>

        <div className="w-full grid grid-cols-2 gap-3 mt-4">
          <button onClick={onClose} className="py-4 px-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold rounded-2xl hover:bg-slate-200 transition-all text-sm uppercase tracking-widest">Suivant</button>
          <button className="py-4 px-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 shadow-lg flex items-center justify-center text-sm uppercase tracking-widest">
            <Printer size={18} className="mr-2" /> Ticket
          </button>
        </div>
      </div>
    </div>
  );

  const SessionModal = () => (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-scaleIn border border-slate-200 dark:border-slate-800">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-purple-600 text-white flex items-center space-x-3">
          <Lock size={20} />
          <h3 className="text-lg font-black uppercase tracking-tight">Ouverture de Caisse</h3>
        </div>
        <div className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Fond de caisse initial ({config.currency})</label>
            <input 
              type="number" 
              value={openingBalance}
              onChange={(e) => setOpeningBalance(parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-2xl font-black text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>
        <div className="p-6 bg-slate-50 dark:bg-slate-800">
          <button 
            onClick={() => onOpenSession(openingBalance)}
            className="w-full bg-purple-600 text-white py-4 rounded-2xl font-black text-lg hover:bg-purple-700 transition-all shadow-lg"
          >
            OUVRIR LA SESSION
          </button>
        </div>
      </div>
    </div>
  );

  const ClosingModal = () => (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-scaleIn border border-slate-200 dark:border-slate-800">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-rose-600 text-white flex items-center space-x-3">
          <Unlock size={20} />
          <h3 className="text-lg font-black uppercase tracking-tight">Clôture de Session</h3>
        </div>
        <div className="p-8 space-y-6">
          <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
             <div className="flex justify-between text-sm font-bold">
               <span className="text-slate-500">Chiffre d'affaires attendu:</span>
               <span className="text-slate-900 dark:text-white">{(session?.expectedBalance || 0).toLocaleString()} {config.currency}</span>
             </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Montant réel compté ({config.currency})</label>
            <input 
              type="number" 
              value={closingBalance}
              onChange={(e) => setClosingBalance(parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-2xl font-black text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>
        <div className="p-6 bg-slate-50 dark:bg-slate-800 flex space-x-3">
          <button onClick={() => setShowClosingModal(false)} className="flex-1 px-4 py-4 rounded-2xl font-black text-slate-500 hover:bg-slate-100 transition-all uppercase tracking-widest text-xs">Annuler</button>
          <button 
            onClick={() => onCloseSession(closingBalance)}
            className="flex-[2] bg-rose-600 text-white py-4 rounded-2xl font-black hover:bg-rose-700 transition-all shadow-lg"
          >
            VALIDER LA CLÔTURE
          </button>
        </div>
      </div>
    </div>
  );

  if (!session) return <SessionModal />;

  return (
    <div className="h-full flex flex-col md:flex-row gap-6 animate-fadeIn overflow-hidden pb-4">
      {lastSale && <ReceiptModal sale={lastSale} onClose={() => setLastSale(null)} />}
      {showPaymentModal && <PaymentModal />}
      {showClosingModal && <ClosingModal />}

      {/* Product List */}
      <div className="flex-1 flex flex-col min-w-0 space-y-6">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Rechercher par nom ou catégorie..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-purple-500 transition-all dark:text-white"
              />
            </div>
            <button onClick={() => setShowClosingModal(true)} className="flex-shrink-0 flex items-center px-4 py-3 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-black uppercase tracking-widest border border-rose-100 dark:border-rose-800 hover:bg-rose-600 hover:text-white transition-all">
              <Unlock size={14} className="mr-2" /> Fermer Caisse
            </button>
          </div>
          <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-6 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                  activeCategory === cat 
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/20' 
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredProducts.map(product => (
            <button
              key={product.id}
              onClick={() => addToCart(product)}
              className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-purple-300 dark:hover:border-purple-900 hover:-translate-y-1 transition-all group flex flex-col text-left h-fit"
            >
              <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/20 rounded-xl flex items-center justify-center text-purple-600 mb-4 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                <Utensils size={20} />
              </div>
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 leading-snug flex-1 mb-3">{product.name}</h3>
              <p className="text-lg font-black text-purple-600 dark:text-purple-400">{product.price.toLocaleString()} <span className="text-[10px] uppercase font-bold text-slate-400 tracking-tighter">{config.currency}</span></p>
            </button>
          ))}
        </div>
      </div>

      {/* Cart Sidebar */}
      <div className="w-full md:w-96 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
           <div className="flex items-center space-x-3">
             <div className="bg-purple-600 p-2 rounded-xl text-white shadow-lg">
               <ShoppingBag size={20} />
             </div>
             <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-tighter">Votre Panier</h3>
           </div>
           <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-3 py-1 rounded-full text-xs font-black">{cart.length} articles</span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4 opacity-40">
              <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                <Utensils size={32} className="text-slate-400" />
              </div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-widest leading-relaxed">Le panier est vide.<br/>Sélectionnez des articles.</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 animate-slideInRight">
                <div className="flex-1 mr-4">
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-tight mb-1">{item.name}</p>
                  <p className="text-xs font-black text-purple-600 dark:text-purple-400">{(item.price * item.quantity).toLocaleString()} {config.currency}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-1">
                    <button onClick={() => updateQuantity(item.id, -1)} className="p-1 text-slate-400 hover:text-rose-500"><Minus size={14} /></button>
                    <span className="w-8 text-center text-xs font-black dark:text-white">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)} className="p-1 text-slate-400 hover:text-purple-600"><Plus size={14} /></button>
                  </div>
                  <button onClick={() => removeFromCart(item.id)} className="p-2 text-slate-400 hover:text-rose-500 transition-colors"><Trash2 size={16} /></button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 space-y-3 transition-colors">
          <div className="space-y-1">
            <div className="flex justify-between text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest">
              <span>Sous-total</span>
              <span>{total.toLocaleString()} {config.currency}</span>
            </div>
            <div className="flex justify-between text-slate-900 dark:text-slate-100 font-black text-2xl pt-1 border-t border-slate-200 dark:border-slate-700">
              <span>TOTAL</span>
              <span>{total.toLocaleString()} {config.currency}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 pt-2">
            <button
              onClick={() => setShowPaymentModal(true)}
              disabled={cart.length === 0}
              className={`w-full py-4 rounded-2xl flex items-center justify-center space-x-2 font-black text-lg shadow-lg transition-all ${
                cart.length > 0
                  ? 'bg-purple-600 text-white hover:bg-purple-700 transform active:scale-95 shadow-purple-500/20' 
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
              }`}
            >
              <span>PAIEMENT</span>
              <ChevronRight size={20} />
            </button>
            
            <button
              onClick={handleQuickCashSale}
              disabled={cart.length === 0}
              className={`w-full py-3 rounded-2xl flex items-center justify-center space-x-2 font-black text-xs uppercase tracking-widest transition-all ${
                cart.length > 0
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700 transform active:scale-95 shadow-emerald-500/20' 
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-300 dark:text-slate-700 cursor-not-allowed'
              }`}
            >
              <Zap size={14} />
              <span>Espèces (Compte juste)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default POS;
