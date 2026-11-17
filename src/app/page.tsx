'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  UtensilsCrossed, 
  User as UserIcon, 
  QrCode, 
  Clock, 
  ShieldCheck, 
  Bell, 
  Volume2, 
  CheckCircle2, 
  AlertCircle,
  Search,
  Sparkles,
  ArrowRight,
  LogOut,
  Tv,
  ChefHat
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { User, MenuItem, Order } from '@/types';
import { syncBus } from '@/lib/syncChannel';
import { playOrderReadyChime } from '@/lib/audioChime';

export default function StudentPortalPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Registration / Login Form State
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [authName, setAuthName] = useState<string>('');
  const [authPhone, setAuthPhone] = useState<string>('');
  const [authPassword, setAuthPassword] = useState<string>('');
  const [authError, setAuthError] = useState<string>('');
  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(false);

  // Audio permission / notification prompt
  const [audioEnabled, setAudioEnabled] = useState<boolean>(true);
  const [previousStatus, setPreviousStatus] = useState<string | null>(null);

  // Load user from localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem('campusbite_student_user');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (e) {
        console.error('Failed to parse saved user:', e);
      }
    } else {
      setShowAuthModal(true);
    }
  }, []);

  // Fetch Menu
  const fetchMenu = useCallback(async () => {
    try {
      const res = await fetch('/api/menu');
      const data = await res.json();
      if (data.success) {
        setMenuItems(data.items);
      }
    } catch (err) {
      console.error('Failed to fetch menu:', err);
    }
  }, []);

  // Fetch Active Order for current user
  const fetchActiveOrder = useCallback(async (userId: string) => {
    try {
      const res = await fetch(`/api/orders?userId=${userId}&active=true`);
      const data = await res.json();
      if (data.success && data.order) {
        setActiveOrder(data.order);

        // Check if status changed to 'ready' -> trigger sound & celebration
        if (data.order.status === 'ready' && previousStatus !== 'ready') {
          playOrderReadyChime();
          try {
            confetti({
              particleCount: 80,
              spread: 60,
              origin: { y: 0.6 }
            });
          } catch (e) {}
        }
        setPreviousStatus(data.order.status);
      } else {
        setActiveOrder(null);
        setPreviousStatus(null);
      }
    } catch (err) {
      console.error('Failed to fetch active order:', err);
    }
  }, [previousStatus]);

  // Initial load & Polling backup
  useEffect(() => {
    fetchMenu();
  }, [fetchMenu]);

  useEffect(() => {
    if (currentUser?.id) {
      fetchActiveOrder(currentUser.id);
      const interval = setInterval(() => {
        fetchActiveOrder(currentUser.id);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [currentUser?.id, fetchActiveOrder]);

  // Subscribe to real-time events via syncBus
  useEffect(() => {
    const unsubscribe = syncBus.subscribe((msg) => {
      if (msg.type === 'INVENTORY_UPDATED' || msg.type === 'ORDER_CREATED') {
        fetchMenu();
      }
      if (currentUser?.id && (msg.type === 'ORDER_CREATED' || msg.type === 'ORDER_STATUS_CHANGED')) {
        fetchActiveOrder(currentUser.id);
      }
    });
    return () => unsubscribe();
  }, [currentUser?.id, fetchActiveOrder, fetchMenu]);

  // Handle Registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (!authName.trim() || !authPhone.trim()) {
      setAuthError('Please fill in your name and phone number.');
      return;
    }

    setIsLoadingAuth(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: authName,
          phone: authPhone,
          password: authPassword || '123456'
        })
      });
      const data = await res.json();
      if (data.success && data.user) {
        setCurrentUser(data.user);
        localStorage.setItem('campusbite_student_user', JSON.stringify(data.user));
        setShowAuthModal(false);
        // Play welcome sound test
        playOrderReadyChime();
      } else {
        setAuthError(data.error || 'Failed to register');
      }
    } catch (err: any) {
      setAuthError(err.message || 'Network error');
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('campusbite_student_user');
    setCurrentUser(null);
    setActiveOrder(null);
    setShowAuthModal(true);
  };

  // Categories
  const categories = ['All', 'Snacks', 'Quick Meals', 'Beverages'];
  const filteredMenu = menuItems.filter((item) => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans pb-16">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 bg-neutral-900/90 backdrop-blur-md border-b border-neutral-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
            <UtensilsCrossed className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              CampusBite
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            </h1>
            <p className="text-xs text-neutral-400">Smart College Canteen</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {currentUser ? (
            <div className="flex items-center gap-2">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-semibold text-white">{currentUser.name}</p>
                <p className="text-[11px] font-mono text-amber-400">{currentUser.uniqueCode}</p>
              </div>
              <button
                onClick={handleLogout}
                title="Switch User / Logout"
                className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowAuthModal(true)}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white transition shadow-sm"
            >
              Sign In
            </button>
          )}

          {/* Quick link to staff POS & TV for demonstration */}
          <Link
            href="/staff"
            className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-amber-400 transition"
            title="Go to Staff POS"
          >
            <ChefHat className="w-4 h-4" />
          </Link>
          <Link
            href="/tv"
            className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-blue-400 transition"
            title="Public TV Screen (HDMI)"
          >
            <Tv className="w-4 h-4" />
          </Link>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 pt-4 space-y-5">
        
        {/* STUDENT DIGITAL MEMBER CARD */}
        {currentUser && (
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-800 border border-neutral-800 p-5 shadow-xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>
            
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-wider font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  Student Digital ID
                </span>
                <h2 className="text-xl font-bold text-white mt-1.5">{currentUser.name}</h2>
                <p className="text-xs text-neutral-400">{currentUser.phone}</p>
              </div>

              {/* Unique ID Badge */}
              <div className="text-right">
                <span className="text-[10px] text-neutral-400 block mb-0.5">Your Counter Code</span>
                <div className="px-3.5 py-1.5 rounded-xl bg-amber-500 text-neutral-950 font-black font-mono text-xl tracking-wider shadow-md shadow-amber-500/20">
                  {currentUser.uniqueCode}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-neutral-800/80 flex items-center justify-between text-xs text-neutral-400">
              <span className="flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-amber-400" /> Quote this ID to canteen staff to order
              </span>
              <span className="font-mono text-[11px] text-neutral-500">Zero App Install</span>
            </div>
          </div>
        )}

        {/* ACTIVE ORDER CARD (AUTO-SYNCS IN REAL-TIME) */}
        {activeOrder ? (
          <div className={`rounded-2xl border p-5 shadow-2xl transition-all duration-300 ${
            activeOrder.status === 'ready'
              ? 'bg-gradient-to-b from-emerald-950/70 to-neutral-900 border-emerald-500/50 shadow-emerald-900/30 ring-2 ring-emerald-500/30'
              : 'bg-neutral-900/90 border-neutral-800 shadow-neutral-950'
          }`}>
            {/* Header info */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    activeOrder.status === 'ready' ? 'bg-emerald-400' : 'bg-amber-400'
                  }`}></span>
                  <span className={`relative inline-flex rounded-full h-3 w-3 ${
                    activeOrder.status === 'ready' ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}></span>
                </span>
                <span className="text-xs font-semibold uppercase tracking-wider text-neutral-300">
                  Live Active Order
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-neutral-400">
                <Clock className="w-3.5 h-3.5 text-neutral-400" />
                <span>{activeOrder.estimatedReadyAt}</span>
              </div>
            </div>

            {/* Token & PIN Row */}
            <div className="grid grid-cols-2 gap-3 mt-4">
              {/* Token Number */}
              <div className="bg-neutral-950/70 rounded-xl p-3.5 border border-neutral-800/80 text-center">
                <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block">
                  Token Number
                </span>
                <span className="text-4xl font-black text-amber-400 font-mono tracking-tight block mt-0.5">
                  #{activeOrder.tokenNumber}
                </span>
                <span className="text-[10px] text-neutral-500">Watch on TV Screen</span>
              </div>

              {/* Secret Pickup PIN */}
              <div className="bg-neutral-950/70 rounded-xl p-3.5 border border-neutral-800/80 text-center">
                <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider block flex items-center justify-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Pickup PIN
                </span>
                <span className="text-4xl font-black text-white font-mono tracking-widest block mt-0.5">
                  {activeOrder.pickupPin}
                </span>
                <span className="text-[10px] text-neutral-400">Show to staff to collect</span>
              </div>
            </div>

            {/* Status Stepper */}
            <div className="mt-5 pt-4 border-t border-neutral-800/80">
              <div className="flex items-center justify-between text-xs font-medium">
                <div className={`flex items-center gap-1.5 ${
                  activeOrder.status === 'received' || activeOrder.status === 'preparing' || activeOrder.status === 'ready'
                    ? 'text-amber-400'
                    : 'text-neutral-500'
                }`}>
                  <div className="w-2 h-2 rounded-full bg-current"></div>
                  <span>Received</span>
                </div>

                <div className="h-0.5 flex-1 mx-2 bg-neutral-800 relative">
                  <div className={`h-full transition-all duration-500 ${
                    activeOrder.status === 'preparing' || activeOrder.status === 'ready'
                      ? 'w-full bg-blue-500'
                      : 'w-0'
                  }`}></div>
                </div>

                <div className={`flex items-center gap-1.5 ${
                  activeOrder.status === 'preparing' || activeOrder.status === 'ready'
                    ? 'text-blue-400'
                    : 'text-neutral-500'
                }`}>
                  <div className="w-2 h-2 rounded-full bg-current"></div>
                  <span>In Kitchen</span>
                </div>

                <div className="h-0.5 flex-1 mx-2 bg-neutral-800 relative">
                  <div className={`h-full transition-all duration-500 ${
                    activeOrder.status === 'ready' ? 'w-full bg-emerald-500' : 'w-0'
                  }`}></div>
                </div>

                <div className={`flex items-center gap-1.5 ${
                  activeOrder.status === 'ready' ? 'text-emerald-400 font-bold' : 'text-neutral-500'
                }`}>
                  <div className="w-2 h-2 rounded-full bg-current"></div>
                  <span>Ready!</span>
                </div>
              </div>

              {/* Big banner if READY */}
              {activeOrder.status === 'ready' && (
                <div className="mt-4 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 animate-bounce" />
                    <div>
                      <p className="text-sm font-bold">Food is Ready at the Counter!</p>
                      <p className="text-xs text-emerald-400/80">Give PIN {activeOrder.pickupPin} to claim your order.</p>
                    </div>
                  </div>
                  <button 
                    onClick={playOrderReadyChime}
                    className="p-2 rounded-lg bg-emerald-500 text-neutral-950 hover:bg-emerald-400 transition"
                    title="Play Alert Chime"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Items summary */}
            <div className="mt-4 pt-3 border-t border-neutral-800/60">
              <div className="text-xs text-neutral-400 mb-1.5 font-medium">Items in this order:</div>
              <div className="space-y-1">
                {activeOrder.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between text-xs text-neutral-300">
                    <span>{it.quantity}x {it.name}</span>
                    <span className="font-mono text-neutral-400">₹{it.price * it.quantity}</span>
                  </div>
                ))}
              </div>
              <div className="mt-2 pt-2 border-t border-neutral-800/60 flex justify-between text-xs font-bold text-white">
                <span>Total Paid:</span>
                <span className="font-mono text-amber-400">₹{activeOrder.totalAmount}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-neutral-800/80 bg-neutral-900/40 p-4 text-center">
            <p className="text-xs text-neutral-400">
              No active order right now. Walk up to the counter and quote code <strong className="text-amber-400 font-mono">{currentUser?.uniqueCode || 'CB-XXXX'}</strong> to place an order!
            </p>
          </div>
        )}

        {/* LIVE MENU & REMAINING STOCK VIEWER */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Live Canteen Menu
                <span className="text-[10px] font-normal text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  Real-time Stock
                </span>
              </h3>
              <p className="text-xs text-neutral-400">Check remaining quantities before ordering at counter</p>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-neutral-500" />
              <input
                type="text"
                placeholder="Search food or drinks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500 transition"
              />
            </div>
            
            <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`text-xs px-3 py-1.5 rounded-xl whitespace-nowrap transition font-medium ${
                    selectedCategory === cat
                      ? 'bg-amber-500 text-neutral-950 font-semibold shadow-sm shadow-amber-500/20'
                      : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Menu Items Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredMenu.map((item) => {
              const isSoldOut = item.stockQuantity <= 0 || !item.isAvailable;
              return (
                <div
                  key={item.id}
                  className={`rounded-xl border p-3.5 transition-all flex flex-col justify-between ${
                    isSoldOut
                      ? 'bg-neutral-900/40 border-neutral-800/50 opacity-60'
                      : 'bg-neutral-900/80 border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-semibold text-white">{item.name}</h4>
                      <p className="text-[11px] text-neutral-400 line-clamp-1 mt-0.5">{item.description}</p>
                    </div>
                    <span className="text-sm font-bold font-mono text-amber-400">
                      ₹{item.price}
                    </span>
                  </div>

                  <div className="mt-3 pt-2 border-t border-neutral-800/60 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-neutral-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> ~{item.prepTimeMins}m prep
                    </span>

                    {/* Stock Status Badge */}
                    {isSoldOut ? (
                      <span className="text-[11px] font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-md border border-red-500/20">
                        Sold Out
                      </span>
                    ) : (
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${
                        item.stockQuantity <= 5
                          ? 'text-orange-400 bg-orange-500/10 border-orange-500/20'
                          : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                      }`}>
                        {item.stockQuantity} left in stock
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* REGISTRATION / ONBOARDING MODAL (FOR FIRST-TIME USERS) */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 mx-auto flex items-center justify-center mb-2">
                <UtensilsCrossed className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Welcome to CampusBite</h3>
              <p className="text-xs text-neutral-400">
                Register once to get your permanent Canteen ID for rapid offline counter ordering.
              </p>
            </div>

            {authError && (
              <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={authName}
                  onChange={(e) => setAuthName(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">
                  Mobile Number
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 9876543210"
                  value={authPhone}
                  onChange={(e) => setAuthPhone(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">
                  Create PIN / Password
                </label>
                <input
                  type="password"
                  placeholder="4 to 6 digit PIN (optional)"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-amber-500"
                />
              </div>

              <button
                type="submit"
                disabled={isLoadingAuth}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-neutral-950 font-bold text-sm tracking-wide shadow-lg shadow-orange-500/20 transition disabled:opacity-50"
              >
                {isLoadingAuth ? 'Generating Your ID...' : 'Get My Canteen ID'}
              </button>
            </form>

            <div className="pt-2 text-center">
              <span className="text-[11px] text-neutral-500">
                Already registered? Entering your phone number will log you back in!
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
