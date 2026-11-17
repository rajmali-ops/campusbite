'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  ChefHat, 
  UtensilsCrossed, 
  Tv, 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Layers, 
  ExternalLink,
  UserCheck,
  Check,
  PackagePlus,
  ArrowRight,
  Lock,
  Unlock,
  KeyRound,
  Delete,
  Settings,
  RotateCcw,
  Pencil,
  PlusCircle,
  X,
  AlertCircle
} from 'lucide-react';
import { User, MenuItem, Order, OrderStatus } from '@/types';
import { syncBus } from '@/lib/syncChannel';
import { playOrderReadyChime } from '@/lib/audioChime';

export default function StaffDashboardPage() {
  // Staff Authentication Lock State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [staffPinInput, setStaffPinInput] = useState<string>('');
  const [authError, setAuthError] = useState<string>('');
  const [isVerifyingAuth, setIsVerifyingAuth] = useState<boolean>(false);

  // Change PIN State
  const [showPinChangeModal, setShowPinChangeModal] = useState<boolean>(false);
  const [currentPinInput, setCurrentPinInput] = useState<string>('');
  const [newPinInput, setNewPinInput] = useState<string>('');
  const [pinChangeMsg, setPinChangeMsg] = useState<{ text: string; isError: boolean } | null>(null);

  // Daily Token Reset State
  const [showResetModal, setShowResetModal] = useState<boolean>(false);
  const [isResettingTokens, setIsResettingTokens] = useState<boolean>(false);
  const [resetSuccessMsg, setResetSuccessMsg] = useState<string>('');

  // Add Item State
  const [showAddItemModal, setShowAddItemModal] = useState<boolean>(false);
  const [newItemName, setNewItemName] = useState<string>('');
  const [newItemCategory, setNewItemCategory] = useState<'Snacks' | 'Quick Meals' | 'Beverages' | 'Combos'>('Snacks');
  const [newItemPrice, setNewItemPrice] = useState<string>('');
  const [newItemStock, setNewItemStock] = useState<string>('');
  const [newItemPrepTime, setNewItemPrepTime] = useState<string>('5');
  const [newItemDesc, setNewItemDesc] = useState<string>('');
  const [addItemError, setAddItemError] = useState<string>('');

  // Edit / Modify Item State
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [editItemName, setEditItemName] = useState<string>('');
  const [editItemCategory, setEditItemCategory] = useState<'Snacks' | 'Quick Meals' | 'Beverages' | 'Combos'>('Snacks');
  const [editItemPrice, setEditItemPrice] = useState<string>('');
  const [editItemStock, setEditItemStock] = useState<string>('');
  const [editItemPrepTime, setEditItemPrepTime] = useState<string>('5');
  const [editItemDesc, setEditItemDesc] = useState<string>('');
  const [editItemAvailable, setEditItemAvailable] = useState<boolean>(true);
  const [editItemError, setEditItemError] = useState<string>('');

  // Tab State
  const [activeTab, setActiveTab] = useState<'pos' | 'kitchen' | 'inventory'>('pos');
  
  // Data states
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  
  // POS State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [cart, setCart] = useState<{ item: MenuItem; quantity: number }[]>([]);
  const [isPlacingOrder, setIsPlacingOrder] = useState<boolean>(false);
  const [posError, setPosError] = useState<string>('');
  const [lastPlacedOrder, setLastPlacedOrder] = useState<Order | null>(null);
  const [selectedPosCategory, setSelectedPosCategory] = useState<string>('All');

  // Kitchen PIN verification state
  const [verifyingOrderId, setVerifyingOrderId] = useState<string | null>(null);
  const [inputPin, setInputPin] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');

  // Check existing session
  useEffect(() => {
    const savedAuth = sessionStorage.getItem('campusbite_staff_auth');
    if (savedAuth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  // Handle Staff PIN Submission
  const handlePinSubmit = async (pinToVerify?: string) => {
    const pin = pinToVerify || staffPinInput;
    if (!pin) {
      setAuthError('Please enter the Staff PIN.');
      return;
    }

    setAuthError('');
    setIsVerifyingAuth(true);

    try {
      const res = await fetch('/api/staff/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin })
      });
      const data = await res.json();
      if (data.success) {
        setIsAuthenticated(true);
        sessionStorage.setItem('campusbite_staff_auth', 'true');
        setStaffPinInput('');
      } else {
        setAuthError(data.error || 'Incorrect Staff PIN');
        setStaffPinInput('');
      }
    } catch (err: any) {
      setAuthError(err.message || 'Verification error');
    } finally {
      setIsVerifyingAuth(false);
    }
  };

  const handleNumpadPress = (num: string) => {
    if (staffPinInput.length < 8) {
      const updated = staffPinInput + num;
      setStaffPinInput(updated);
      setAuthError('');
      if (updated.length === 4) {
        handlePinSubmit(updated);
      }
    }
  };

  const handleNumpadDelete = () => {
    setStaffPinInput((prev) => prev.slice(0, -1));
  };

  const handleLockTerminal = () => {
    sessionStorage.removeItem('campusbite_staff_auth');
    setIsAuthenticated(false);
    setStaffPinInput('');
    setAuthError('');
  };

  // Change PIN handler
  const handleChangePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinChangeMsg(null);

    try {
      const res = await fetch('/api/staff/auth', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPin: currentPinInput, newPin: newPinInput })
      });
      const data = await res.json();
      if (data.success) {
        setPinChangeMsg({ text: 'Staff PIN updated successfully!', isError: false });
        setCurrentPinInput('');
        setNewPinInput('');
        setTimeout(() => setShowPinChangeModal(false), 1500);
      } else {
        setPinChangeMsg({ text: data.error || 'Failed to update PIN', isError: true });
      }
    } catch (err: any) {
      setPinChangeMsg({ text: err.message || 'Network error', isError: true });
    }
  };

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

  // Fetch Orders
  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch('/api/orders');
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders);
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    }
  }, []);

  // Fetch Users
  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      if (data.success) {
        setUsers(data.users);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchMenu();
      fetchOrders();
      fetchUsers();

      const interval = setInterval(() => {
        fetchOrders();
      }, 4000);

      return () => clearInterval(interval);
    }
  }, [isAuthenticated, fetchMenu, fetchOrders, fetchUsers]);

  // Sync bus listener
  useEffect(() => {
    if (!isAuthenticated) return;
    const unsub = syncBus.subscribe((msg) => {
      if (msg.type === 'ORDER_CREATED' || msg.type === 'ORDER_STATUS_CHANGED') {
        fetchOrders();
        fetchMenu();
      }
      if (msg.type === 'INVENTORY_UPDATED') {
        fetchMenu();
      }
    });
    return () => unsub();
  }, [isAuthenticated, fetchOrders, fetchMenu]);

  // Handle Search for Student
  const handleStudentSearch = (query: string) => {
    setSearchQuery(query);
    const clean = query.trim().toUpperCase();
    if (!clean) {
      setSelectedUser(null);
      return;
    }
    const found = users.find(
      (u) =>
        u.uniqueCode.toUpperCase() === clean ||
        u.phone === clean ||
        u.name.toUpperCase().includes(clean)
    );
    setSelectedUser(found || null);
  };

  // Add Item to POS Cart
  const addToCart = (item: MenuItem) => {
    if (item.stockQuantity <= 0 || !item.isAvailable) return;

    setCart((prev) => {
      const existing = prev.find((i) => i.item.id === item.id);
      if (existing) {
        if (existing.quantity >= item.stockQuantity) {
          alert(`Cannot add more. Only ${item.stockQuantity} in stock!`);
          return prev;
        }
        return prev.map((i) =>
          i.item.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      } else {
        return [...prev, { item, quantity: 1 }];
      }
    });
  };

  const updateCartQty = (itemId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((i) => {
          if (i.item.id === itemId) {
            const newQty = i.quantity + delta;
            if (newQty > i.item.stockQuantity) {
              alert(`Only ${i.item.stockQuantity} in stock!`);
              return i;
            }
            return { ...i, quantity: newQty };
          }
          return i;
        })
        .filter((i) => i.quantity > 0);
    });
  };

  const cartTotal = cart.reduce((acc, curr) => acc + curr.item.price * curr.quantity, 0);

  // Place Order from POS
  const handlePlaceOrder = async () => {
    if (!selectedUser) {
      setPosError('Please select or look up a student first!');
      return;
    }
    if (cart.length === 0) {
      setPosError('Cart is empty. Tap items to add.');
      return;
    }

    setPosError('');
    setIsPlacingOrder(true);

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.id,
          items: cart.map((c) => ({ id: c.item.id, quantity: c.quantity }))
        })
      });

      const data = await res.json();
      if (data.success && data.order) {
        setLastPlacedOrder(data.order);
        setCart([]);
        fetchMenu();
        fetchOrders();
        syncBus.publish('ORDER_CREATED', data.order);
      } else {
        setPosError(data.error || 'Failed to place order');
      }
    } catch (err: any) {
      setPosError(err.message || 'Network error');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  // Kitchen Status Update
  const updateStatus = async (orderId: string, status: OrderStatus) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (data.success) {
        fetchOrders();
        syncBus.publish('ORDER_STATUS_CHANGED', data.order);
        if (status === 'ready') {
          playOrderReadyChime();
        }
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  // Verify PIN & Collect
  const handleVerifyPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyingOrderId || !inputPin) return;

    setPinError('');
    try {
      const res = await fetch(`/api/orders/${verifyingOrderId}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: inputPin })
      });
      const data = await res.json();
      if (data.success) {
        setVerifyingOrderId(null);
        setInputPin('');
        fetchOrders();
        syncBus.publish('ORDER_STATUS_CHANGED', data.order);
      } else {
        setPinError(data.error || 'Invalid PIN');
      }
    } catch (err: any) {
      setPinError(err.message || 'Network error');
    }
  };

  // Restock Item Quick
  const handleRestock = async (itemId: string, addQty: number) => {
    try {
      const res = await fetch('/api/menu/restock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, addQty })
      });
      const data = await res.json();
      if (data.success) {
        fetchMenu();
        syncBus.publish('INVENTORY_UPDATED', data.item);
      }
    } catch (err) {
      console.error('Failed to restock:', err);
    }
  };

  // ==============================================================
  // DAILY TOKEN RESET HANDLER
  // ==============================================================
  const handleResetDailyTokens = async () => {
    setIsResettingTokens(true);
    try {
      const res = await fetch('/api/orders/reset', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setResetSuccessMsg('Daily tokens reset to #1. Board cleared for fresh day!');
        fetchOrders();
        fetchMenu();
        syncBus.publish('ORDER_STATUS_CHANGED');
        setTimeout(() => {
          setShowResetModal(false);
          setResetSuccessMsg('');
        }, 1500);
      } else {
        alert(data.error || 'Failed to reset tokens');
      }
    } catch (err: any) {
      alert(err.message || 'Network error');
    } finally {
      setIsResettingTokens(false);
    }
  };

  // ==============================================================
  // ADD NEW MENU ITEM HANDLER
  // ==============================================================
  const handleCreateMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddItemError('');

    if (!newItemName.trim() || !newItemPrice || !newItemStock) {
      setAddItemError('Please fill in Name, Price, and Initial Stock.');
      return;
    }

    try {
      const res = await fetch('/api/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newItemName,
          category: newItemCategory,
          price: Number(newItemPrice),
          stockQuantity: Number(newItemStock),
          prepTimeMins: Number(newItemPrepTime) || 5,
          description: newItemDesc,
        }),
      });

      const data = await res.json();
      if (data.success) {
        fetchMenu();
        syncBus.publish('INVENTORY_UPDATED', data.item);
        setShowAddItemModal(false);
        // Reset form
        setNewItemName('');
        setNewItemPrice('');
        setNewItemStock('');
        setNewItemDesc('');
        setNewItemPrepTime('5');
      } else {
        setAddItemError(data.error || 'Failed to create menu item');
      }
    } catch (err: any) {
      setAddItemError(err.message || 'Network error');
    }
  };

  // ==============================================================
  // EDIT / MODIFY MENU ITEM HANDLER
  // ==============================================================
  const openEditModal = (item: MenuItem) => {
    setEditingItem(item);
    setEditItemName(item.name);
    setEditItemCategory(item.category);
    setEditItemPrice(item.price.toString());
    setEditItemStock(item.stockQuantity.toString());
    setEditItemPrepTime(item.prepTimeMins.toString());
    setEditItemDesc(item.description || '');
    setEditItemAvailable(item.isAvailable);
    setEditItemError('');
  };

  const handleUpdateMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    setEditItemError('');

    try {
      const res = await fetch(`/api/menu/${editingItem.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editItemName,
          category: editItemCategory,
          price: Number(editItemPrice),
          stockQuantity: Number(editItemStock),
          prepTimeMins: Number(editItemPrepTime) || 5,
          description: editItemDesc,
          isAvailable: editItemAvailable,
        }),
      });

      const data = await res.json();
      if (data.success) {
        fetchMenu();
        syncBus.publish('INVENTORY_UPDATED', data.item);
        setEditingItem(null);
      } else {
        setEditItemError(data.error || 'Failed to update item');
      }
    } catch (err: any) {
      setEditItemError(err.message || 'Network error');
    }
  };

  // ==============================================================
  // DELETE MENU ITEM HANDLER
  // ==============================================================
  const handleDeleteMenuItem = async (itemId: string, itemName: string) => {
    if (!confirm(`Are you sure you want to permanently delete "${itemName}" from the canteen menu?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/menu/${itemId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchMenu();
        syncBus.publish('INVENTORY_UPDATED');
      } else {
        alert(data.error || 'Failed to delete item');
      }
    } catch (err: any) {
      alert(err.message || 'Network error');
    }
  };

  // Launch TV display in a separate window (for HDMI monitor)
  const openHdmiTvDisplay = () => {
    window.open('/tv', 'CampusBiteTVDisplay', 'width=1920,height=1080,menubar=no,toolbar=no,location=no');
  };

  // Filter menu for POS
  const posCategories = ['All', 'Snacks', 'Quick Meals', 'Beverages', 'Combos'];
  const filteredPosMenu = menuItems.filter((i) =>
    selectedPosCategory === 'All' ? true : i.category === selectedPosCategory
  );

  // ==============================================================
  // SECURITY LOCK SCREEN (WHEN NOT AUTHENTICATED)
  // ==============================================================
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col justify-center items-center p-4 font-sans select-none">
        <div className="max-w-sm w-full bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 mx-auto flex items-center justify-center shadow-lg shadow-amber-500/10">
              <Lock className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-black text-white tracking-tight">Staff Terminal Lock</h2>
            <p className="text-xs text-neutral-400">
              Authorized canteen personnel only. Enter Master PIN to access POS & Kitchen.
            </p>
          </div>

          {/* PIN Display Indicator */}
          <div className="flex flex-col items-center space-y-2">
            <div className="flex justify-center gap-3 py-2">
              {[0, 1, 2, 3].map((idx) => {
                const isFilled = staffPinInput.length > idx;
                return (
                  <div
                    key={idx}
                    className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                      isFilled
                        ? 'bg-amber-400 border-amber-400 scale-110 shadow-md shadow-amber-400/30'
                        : 'border-neutral-700 bg-neutral-950'
                    }`}
                  />
                );
              })}
            </div>

            <input
              type="password"
              maxLength={8}
              autoFocus
              value={staffPinInput}
              onChange={(e) => {
                setStaffPinInput(e.target.value);
                setAuthError('');
                if (e.target.value.length === 4) {
                  handlePinSubmit(e.target.value);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handlePinSubmit();
              }}
              className="w-full text-center tracking-widest font-mono text-xs text-neutral-500 bg-transparent focus:outline-none"
              placeholder="(or type PIN and press Enter)"
            />
          </div>

          {authError && (
            <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center font-medium">
              {authError}
            </div>
          )}

          {/* Touch Numpad */}
          <div className="grid grid-cols-3 gap-2.5 pt-1">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
              <button
                key={digit}
                type="button"
                onClick={() => handleNumpadPress(digit)}
                className="py-3.5 rounded-2xl bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-white font-mono font-bold text-lg active:scale-95 transition shadow-sm"
              >
                {digit}
              </button>
            ))}

            <button
              type="button"
              onClick={() => setStaffPinInput('')}
              className="py-3.5 rounded-2xl bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 text-xs font-semibold active:scale-95 transition"
            >
              Clear
            </button>

            <button
              type="button"
              onClick={() => handleNumpadPress('0')}
              className="py-3.5 rounded-2xl bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-white font-mono font-bold text-lg active:scale-95 transition shadow-sm"
            >
              0
            </button>

            <button
              type="button"
              onClick={handleNumpadDelete}
              className="py-3.5 rounded-2xl bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 flex items-center justify-center active:scale-95 transition"
            >
              <Delete className="w-5 h-5" />
            </button>
          </div>

          <button
            onClick={() => handlePinSubmit()}
            disabled={isVerifyingAuth || staffPinInput.length === 0}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-neutral-950 font-bold text-sm shadow-lg shadow-orange-500/20 transition disabled:opacity-40"
          >
            {isVerifyingAuth ? 'Verifying PIN...' : 'Unlock POS Terminal'}
          </button>

          <div className="pt-2 text-center flex flex-col items-center gap-1.5 text-xs text-neutral-500">
            <span>Default Master PIN: <strong className="text-amber-400 font-mono">1234</strong></span>
            <Link href="/" className="text-neutral-400 hover:text-white underline text-[11px]">
              ← Return to Student Portal
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ==============================================================
  // AUTHENTICATED STAFF DASHBOARD
  // ==============================================================
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans">
      {/* Top Staff Navbar */}
      <header className="bg-neutral-900 border-b border-neutral-800 px-5 py-3 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center text-neutral-950 font-bold shadow-md shadow-amber-500/20">
            <ChefHat className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white flex items-center gap-2">
              CampusBite POS & Kitchen
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Staff Verified
              </span>
            </h1>
            <p className="text-xs text-neutral-400">Counter Order Entry & Dispatch System</p>
          </div>
        </div>

        {/* Action Buttons: Reset Tokens, TV Display, Lock */}
        <div className="flex items-center gap-2.5">
          {/* Daily Token Reset Button */}
          <button
            onClick={() => setShowResetModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold transition"
            title="Reset Daily Tokens to #1 for a fresh day"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset Day (#1)</span>
          </button>

          {/* HDMI TV Screen Pop-out */}
          <button
            onClick={openHdmiTvDisplay}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/20 transition cursor-pointer"
            title="Launch Fullscreen Public TV Board for connected HDMI Monitor"
          >
            <Tv className="w-4 h-4" />
            <span className="hidden sm:inline">Launch Public TV (HDMI)</span>
            <ExternalLink className="w-3 h-3 opacity-70" />
          </button>

          <Link
            href="/"
            className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium transition hidden sm:inline"
          >
            Student View
          </Link>

          {/* Quick Lock Terminal Button */}
          <button
            onClick={handleLockTerminal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-semibold transition"
            title="Lock POS Terminal"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Lock</span>
          </button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-neutral-900/60 border-b border-neutral-800/80 px-5 py-2 flex items-center gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('pos')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'pos'
              ? 'bg-amber-500 text-neutral-950 shadow-sm shadow-amber-500/20'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
          }`}
        >
          <UtensilsCrossed className="w-4 h-4" />
          1. Counter POS (Walk-in Orders)
        </button>

        <button
          onClick={() => setActiveTab('kitchen')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition relative whitespace-nowrap ${
            activeTab === 'kitchen'
              ? 'bg-amber-500 text-neutral-950 shadow-sm shadow-amber-500/20'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          2. Kitchen Queue & Verification
          {orders.filter((o) => o.status !== 'collected').length > 0 && (
            <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-mono">
              {orders.filter((o) => o.status !== 'collected').length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('inventory')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'inventory'
              ? 'bg-amber-500 text-neutral-950 shadow-sm shadow-amber-500/20'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
          }`}
        >
          <PackagePlus className="w-4 h-4" />
          3. Inventory & Menu Manager
        </button>
      </div>

      {/* Main Tab Views */}
      <main className="flex-1 p-5 max-w-7xl w-full mx-auto">
        {/* ============================================================== */}
        {/* TAB 1: COUNTER POS VIEW                                         */}
        {/* ============================================================== */}
        {activeTab === 'pos' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Student Lookup + Touch Item Grid */}
            <div className="lg:col-span-2 space-y-5">
              {/* Customer ID Lookup Bar */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 shadow-lg">
                <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider block mb-2">
                  Step 1: Ask Student for ID Code or Phone
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-neutral-500" />
                    <input
                      type="text"
                      placeholder="Type Student ID (e.g. CB-1042) or Phone number..."
                      value={searchQuery}
                      onChange={(e) => handleStudentSearch(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>

                  {/* Fast demo student buttons */}
                  <div className="hidden sm:flex items-center gap-1">
                    {users.slice(0, 3).map((u) => (
                      <button
                        key={u.id}
                        onClick={() => {
                          setSelectedUser(u);
                          setSearchQuery(u.uniqueCode);
                        }}
                        className={`text-[11px] px-2.5 py-2 rounded-xl border transition ${
                          selectedUser?.id === u.id
                            ? 'bg-amber-500 text-neutral-950 border-amber-500 font-bold'
                            : 'bg-neutral-800 text-neutral-300 border-neutral-700 hover:bg-neutral-700'
                        }`}
                      >
                        {u.name.split(' ')[0]} ({u.uniqueCode})
                      </button>
                    ))}
                  </div>
                </div>

                {/* Selected Student Banner */}
                {selectedUser ? (
                  <div className="mt-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                        <UserCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white flex items-center gap-2">
                          {selectedUser.name}
                          <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 font-mono text-xs">
                            {selectedUser.uniqueCode}
                          </span>
                        </p>
                        <p className="text-xs text-neutral-400">Phone: {selectedUser.phone}</p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> ID Verified
                    </span>
                  </div>
                ) : (
                  <p className="text-xs text-amber-400/80 mt-2">
                    Tip: Ask the student for their 4-digit code (e.g. CB-1042). If not registered, click Student View to register them.
                  </p>
                )}
              </div>

              {/* Step 2: Food Items Touch Grid */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                    Step 2: Tap Items to Add (Stock Auto-Deducts on Confirm)
                  </h3>
                  
                  {/* Category Filter */}
                  <div className="flex gap-1">
                    {posCategories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedPosCategory(cat)}
                        className={`text-xs px-2.5 py-1 rounded-lg transition ${
                          selectedPosCategory === cat
                            ? 'bg-amber-500 text-neutral-950 font-bold'
                            : 'bg-neutral-900 text-neutral-400 hover:text-white'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {filteredPosMenu.map((item) => {
                    const isSoldOut = item.stockQuantity <= 0 || !item.isAvailable;
                    const inCart = cart.find((c) => c.item.id === item.id);

                    return (
                      <button
                        key={item.id}
                        disabled={isSoldOut}
                        onClick={() => addToCart(item)}
                        className={`p-3.5 rounded-xl border text-left transition-all relative flex flex-col justify-between h-28 ${
                          isSoldOut
                            ? 'bg-neutral-900/30 border-neutral-800/40 opacity-40 cursor-not-allowed'
                            : inCart
                            ? 'bg-neutral-900 border-amber-500 shadow-md shadow-amber-500/10'
                            : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700'
                        }`}
                      >
                        {inCart && (
                          <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-amber-500 text-neutral-950 font-bold text-xs flex items-center justify-center shadow">
                            {inCart.quantity}
                          </span>
                        )}

                        <div>
                          <h4 className="text-xs font-bold text-white line-clamp-1">{item.name}</h4>
                          <span className="text-sm font-black text-amber-400 font-mono mt-0.5 block">
                            ₹{item.price}
                          </span>
                        </div>

                        <div className="pt-2 border-t border-neutral-800/60 flex items-center justify-between text-[11px]">
                          <span className="text-neutral-500">~{item.prepTimeMins}m</span>
                          {isSoldOut ? (
                            <span className="font-bold text-red-400">Sold Out</span>
                          ) : (
                            <span className="font-semibold text-emerald-400">
                              {item.stockQuantity} left
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right 1 Col: Current Order Cart & Confirmation */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 flex flex-col justify-between shadow-xl">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    Current Order Summary
                  </h3>
                  {cart.length > 0 && (
                    <button
                      onClick={() => setCart([])}
                      className="text-xs text-neutral-500 hover:text-red-400 transition"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Customer Info in Cart */}
                <div className="my-3 p-2.5 rounded-xl bg-neutral-950 border border-neutral-800/80 text-xs">
                  <span className="text-neutral-400 block text-[10px] uppercase font-semibold">
                    Ordering Customer:
                  </span>
                  {selectedUser ? (
                    <span className="font-bold text-white flex items-center justify-between mt-0.5">
                      {selectedUser.name}
                      <span className="text-amber-400 font-mono">{selectedUser.uniqueCode}</span>
                    </span>
                  ) : (
                    <span className="text-neutral-500 italic">No student selected yet</span>
                  )}
                </div>

                {/* Cart Items List */}
                <div className="space-y-2 mt-4 max-h-64 overflow-y-auto pr-1">
                  {cart.length === 0 ? (
                    <div className="text-center py-10 text-neutral-500 text-xs">
                      Tap items on the left to add to order
                    </div>
                  ) : (
                    cart.map(({ item, quantity }) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-2 rounded-xl bg-neutral-950/70 border border-neutral-800/60 text-xs"
                      >
                        <div className="flex-1 pr-2">
                          <p className="font-semibold text-white line-clamp-1">{item.name}</p>
                          <p className="text-[11px] text-neutral-400 font-mono">
                            ₹{item.price} x {quantity} = ₹{item.price * quantity}
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => updateCartQty(item.id, -1)}
                            className="w-6 h-6 rounded-lg bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center text-white"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-5 text-center font-mono font-bold text-white">
                            {quantity}
                          </span>
                          <button
                            onClick={() => updateCartQty(item.id, 1)}
                            className="w-6 h-6 rounded-lg bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center text-white"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Bill Details & Order Confirm */}
              <div className="mt-5 pt-4 border-t border-neutral-800 space-y-3">
                {posError && (
                  <p className="text-xs text-red-400 bg-red-500/10 p-2 rounded-lg border border-red-500/20">
                    {posError}
                  </p>
                )}

                <div className="flex items-center justify-between text-base font-bold text-white">
                  <span>Total Due (Offline Paid):</span>
                  <span className="text-xl font-mono text-amber-400">₹{cartTotal}</span>
                </div>

                <button
                  disabled={isPlacingOrder || cart.length === 0 || !selectedUser}
                  onClick={handlePlaceOrder}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-neutral-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isPlacingOrder ? (
                    'Punching Order...'
                  ) : (
                    <>
                      <span>Confirm & Place Order (₹{cartTotal})</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {/* Last Order Generated Popup */}
                {lastPlacedOrder && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
                    <p className="font-bold flex items-center justify-between">
                      <span>Order Punched!</span>
                      <span className="font-mono text-sm text-white">Token #{lastPlacedOrder.tokenNumber}</span>
                    </p>
                    <p className="text-[11px] text-neutral-300 mt-1">
                      Customer: {lastPlacedOrder.userName} ({lastPlacedOrder.uniqueCode})
                    </p>
                    <p className="text-[11px] text-emerald-400 font-mono mt-0.5">
                      Pickup PIN: <strong>{lastPlacedOrder.pickupPin}</strong> (Shown on their phone)
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: KITCHEN QUEUE & PICKUP VERIFICATION                     */}
        {/* ============================================================== */}
        {activeTab === 'kitchen' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Live Kitchen Order Queue</h3>
                <p className="text-xs text-neutral-400">
                  Advance preparation stages and verify 4-digit PINs before handover
                </p>
              </div>
              <button
                onClick={fetchOrders}
                className="flex items-center gap-1 text-xs text-neutral-400 hover:text-white p-2 rounded-lg bg-neutral-900 border border-neutral-800"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Refresh Queue
              </button>
            </div>

            {/* 3 Status Columns */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Column 1: Order Received */}
              <div className="space-y-3">
                <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                  <span className="text-xs font-bold uppercase tracking-wider">1. Received Orders</span>
                  <span className="font-mono text-xs">
                    {orders.filter((o) => o.status === 'received').length}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {orders.filter((o) => o.status === 'received').length === 0 ? (
                    <div className="p-8 text-center text-xs text-neutral-500 border border-neutral-900 rounded-xl">
                      No incoming orders
                    </div>
                  ) : (
                    orders
                      .filter((o) => o.status === 'received')
                      .map((ord) => (
                        <div
                          key={ord.id}
                          className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 space-y-2.5 shadow-md"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-2xl font-black font-mono text-amber-400">
                              #{ord.tokenNumber}
                            </span>
                            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 font-mono">
                              {ord.uniqueCode}
                            </span>
                          </div>

                          <p className="text-xs font-semibold text-white">{ord.userName}</p>

                          <div className="pt-2 border-t border-neutral-800/80 space-y-1">
                            {ord.items.map((it, i) => (
                              <div key={i} className="flex justify-between text-xs text-neutral-300">
                                <span>{it.quantity}x {it.name}</span>
                              </div>
                            ))}
                          </div>

                          <button
                            onClick={() => updateStatus(ord.id, 'preparing')}
                            className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition"
                          >
                            Start Preparing
                          </button>
                        </div>
                      ))
                  )}
                </div>
              </div>

              {/* Column 2: Currently Preparing */}
              <div className="space-y-3">
                <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                  <span className="text-xs font-bold uppercase tracking-wider">2. Cooking in Kitchen</span>
                  <span className="font-mono text-xs">
                    {orders.filter((o) => o.status === 'preparing').length}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {orders.filter((o) => o.status === 'preparing').length === 0 ? (
                    <div className="p-8 text-center text-xs text-neutral-500 border border-neutral-900 rounded-xl">
                      Kitchen is clear
                    </div>
                  ) : (
                    orders
                      .filter((o) => o.status === 'preparing')
                      .map((ord) => (
                        <div
                          key={ord.id}
                          className="bg-neutral-900 border border-blue-500/30 rounded-xl p-4 space-y-2.5 shadow-md"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-2xl font-black font-mono text-blue-400">
                              #{ord.tokenNumber}
                            </span>
                            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 font-mono">
                              {ord.uniqueCode}
                            </span>
                          </div>

                          <p className="text-xs font-semibold text-white">{ord.userName}</p>

                          <div className="pt-2 border-t border-neutral-800/80 space-y-1">
                            {ord.items.map((it, i) => (
                              <div key={i} className="flex justify-between text-xs text-neutral-300">
                                <span>{it.quantity}x {it.name}</span>
                              </div>
                            ))}
                          </div>

                          <button
                            onClick={() => updateStatus(ord.id, 'ready')}
                            className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center justify-center gap-1.5"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Mark Ready for Pickup
                          </button>
                        </div>
                      ))
                  )}
                </div>
              </div>

              {/* Column 3: Ready for Pickup (Requires PIN Handover) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <span className="text-xs font-bold uppercase tracking-wider">3. Ready for Collection</span>
                  <span className="font-mono text-xs">
                    {orders.filter((o) => o.status === 'ready').length}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {orders.filter((o) => o.status === 'ready').length === 0 ? (
                    <div className="p-8 text-center text-xs text-neutral-500 border border-neutral-900 rounded-xl">
                      No ready orders waiting
                    </div>
                  ) : (
                    orders
                      .filter((o) => o.status === 'ready')
                      .map((ord) => (
                        <div
                          key={ord.id}
                          className="bg-emerald-950/30 border border-emerald-500/40 rounded-xl p-4 space-y-2.5 shadow-lg"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-2xl font-black font-mono text-emerald-400">
                              #{ord.tokenNumber}
                            </span>
                            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                              Waiting at counter
                            </span>
                          </div>

                          <p className="text-xs font-semibold text-white">
                            {ord.userName} ({ord.uniqueCode})
                          </p>

                          <div className="pt-2 border-t border-neutral-800/80 space-y-1 text-xs text-neutral-300">
                            {ord.items.map((it, i) => (
                              <div key={i}>{it.quantity}x {it.name}</div>
                            ))}
                          </div>

                          {/* Anti-Theft Handover Verification */}
                          <button
                            onClick={() => {
                              setVerifyingOrderId(ord.id);
                              setInputPin('');
                              setPinError('');
                            }}
                            className="w-full py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs transition flex items-center justify-center gap-1.5 shadow"
                          >
                            <ShieldCheck className="w-4 h-4" />
                            Verify PIN & Hand Over
                          </button>
                        </div>
                      ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: INVENTORY RESTOCK & MENU MANAGEMENT                     */}
        {/* ============================================================== */}
        {activeTab === 'inventory' && (
          <div className="space-y-6">
            {/* Top Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  Inventory & Menu Management
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono">
                    {menuItems.length} Items
                  </span>
                </h3>
                <p className="text-xs text-neutral-400">
                  Add new dishes, modify prices & stock, or delete items. Updates sync live across all screens.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Add New Item Button */}
                <button
                  onClick={() => setShowAddItemModal(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-xs font-bold transition shadow-md shadow-emerald-500/20"
                >
                  <PlusCircle className="w-4 h-4" />
                  + Add Food Item
                </button>

                {/* Change PIN Button */}
                <button
                  onClick={() => setShowPinChangeModal(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold border border-neutral-700 transition"
                >
                  <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                  Change Master PIN
                </button>

                {/* Reset Daily Tokens Button */}
                <button
                  onClick={() => setShowResetModal(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset Day (#1)
                </button>
              </div>
            </div>

            {/* Menu Items Table */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-950/80 text-neutral-400 font-semibold border-b border-neutral-800">
                  <tr>
                    <th className="py-3 px-4">Item Name</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Price</th>
                    <th className="py-3 px-4">Stock</th>
                    <th className="py-3 px-4">Prep Time</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-center">Batch Restock</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/60">
                  {menuItems.map((item) => {
                    const isSoldOut = item.stockQuantity <= 0 || !item.isAvailable;
                    return (
                      <tr key={item.id} className="hover:bg-neutral-800/30 transition">
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-white block">{item.name}</span>
                          {item.description && (
                            <span className="text-[11px] text-neutral-500 line-clamp-1">
                              {item.description}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-neutral-300 font-medium">
                          <span className="px-2 py-0.5 rounded-md bg-neutral-800 text-neutral-300 text-[11px]">
                            {item.category}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-amber-400 text-sm">
                          ₹{item.price}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`font-mono font-bold px-2.5 py-1 rounded-md text-xs ${
                            isSoldOut
                              ? 'bg-red-500/20 text-red-400'
                              : item.stockQuantity <= 5
                              ? 'bg-orange-500/20 text-orange-400'
                              : 'bg-emerald-500/20 text-emerald-400'
                          }`}>
                            {item.stockQuantity} units
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-neutral-400">
                          ~{item.prepTimeMins} mins
                        </td>
                        <td className="py-3.5 px-4">
                          {isSoldOut ? (
                            <span className="text-red-400 font-semibold bg-red-500/10 px-2 py-0.5 rounded">
                              Sold Out
                            </span>
                          ) : (
                            <span className="text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded">
                              Active
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center space-x-1">
                          <button
                            onClick={() => handleRestock(item.id, 10)}
                            className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-[11px] font-semibold transition"
                            title="Add +10 stock"
                          >
                            +10
                          </button>
                          <button
                            onClick={() => handleRestock(item.id, 25)}
                            className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-[11px] font-semibold transition"
                            title="Add +25 stock"
                          >
                            +25
                          </button>
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-1">
                          {/* Modify / Edit Button */}
                          <button
                            onClick={() => openEditModal(item)}
                            className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-blue-400 transition"
                            title="Edit / Modify Item"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          {/* Delete Button */}
                          <button
                            onClick={() => handleDeleteMenuItem(item.id, item.name)}
                            className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-red-400 transition"
                            title="Delete Item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* ============================================================== */}
      {/* MODAL 1: ADD NEW MENU ITEM                                     */}
      {/* ============================================================== */}
      {showAddItemModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-emerald-400" />
                Add New Food Item
              </h3>
              <button
                onClick={() => setShowAddItemModal(false)}
                className="p-1 rounded-lg hover:bg-neutral-800 text-neutral-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {addItemError && (
              <p className="text-xs p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
                {addItemError}
              </p>
            )}

            <form onSubmit={handleCreateMenuItem} className="space-y-3">
              <div>
                <label className="text-xs text-neutral-300 font-semibold block mb-1">
                  Item Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Masala Dosa"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-neutral-300 font-semibold block mb-1">
                    Category *
                  </label>
                  <select
                    value={newItemCategory}
                    onChange={(e: any) => setNewItemCategory(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Snacks">Snacks</option>
                    <option value="Quick Meals">Quick Meals</option>
                    <option value="Beverages">Beverages</option>
                    <option value="Combos">Combos</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-neutral-300 font-semibold block mb-1">
                    Price (₹) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="e.g. 40"
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-neutral-300 font-semibold block mb-1">
                    Initial Stock (Qty) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="e.g. 20"
                    value={newItemStock}
                    onChange={(e) => setNewItemStock(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-neutral-300 font-semibold block mb-1">
                    Prep Time (Mins)
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 5"
                    value={newItemPrepTime}
                    onChange={(e) => setNewItemPrepTime(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-neutral-300 font-semibold block mb-1">
                  Description (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Crispy rice crepe served with sambar and coconut chutney"
                  value={newItemDesc}
                  onChange={(e) => setNewItemDesc(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddItemModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-semibold text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs transition shadow-md shadow-emerald-500/20"
                >
                  Add Item to Menu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: EDIT / MODIFY MENU ITEM                              */}
      {/* ============================================================== */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Pencil className="w-5 h-5 text-blue-400" />
                Modify Food Item
              </h3>
              <button
                onClick={() => setEditingItem(null)}
                className="p-1 rounded-lg hover:bg-neutral-800 text-neutral-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {editItemError && (
              <p className="text-xs p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
                {editItemError}
              </p>
            )}

            <form onSubmit={handleUpdateMenuItem} className="space-y-3">
              <div>
                <label className="text-xs text-neutral-300 font-semibold block mb-1">
                  Item Name
                </label>
                <input
                  type="text"
                  required
                  value={editItemName}
                  onChange={(e) => setEditItemName(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-neutral-300 font-semibold block mb-1">
                    Category
                  </label>
                  <select
                    value={editItemCategory}
                    onChange={(e: any) => setEditItemCategory(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="Snacks">Snacks</option>
                    <option value="Quick Meals">Quick Meals</option>
                    <option value="Beverages">Beverages</option>
                    <option value="Combos">Combos</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-neutral-300 font-semibold block mb-1">
                    Price (₹)
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={editItemPrice}
                    onChange={(e) => setEditItemPrice(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-neutral-300 font-semibold block mb-1">
                    Remaining Stock (Units)
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={editItemStock}
                    onChange={(e) => setEditItemStock(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-neutral-300 font-semibold block mb-1">
                    Prep Time (Mins)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={editItemPrepTime}
                    onChange={(e) => setEditItemPrepTime(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-neutral-300 font-semibold block mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={editItemDesc}
                  onChange={(e) => setEditItemDesc(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-1 flex items-center justify-between p-2.5 rounded-xl bg-neutral-950 border border-neutral-800">
                <span className="text-xs text-neutral-300 font-semibold">Available for Ordering</span>
                <input
                  type="checkbox"
                  checked={editItemAvailable}
                  onChange={(e) => setEditItemAvailable(e.target.checked)}
                  className="w-4 h-4 accent-emerald-500 cursor-pointer"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="flex-1 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-semibold text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition shadow-md shadow-blue-600/20"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 3: DAILY TOKEN RESET CONFIRMATION                        */}
      {/* ============================================================== */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mx-auto flex items-center justify-center">
                <RotateCcw className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">Start Fresh Day & Reset Tokens?</h3>
              <p className="text-xs text-neutral-400">
                This will reset the daily token counter back to <strong className="text-amber-400 font-mono">#1</strong> and clear today's active orders from the TV Display and Kitchen Queue.
              </p>
            </div>

            {resetSuccessMsg ? (
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs text-center font-bold">
                {resetSuccessMsg}
              </div>
            ) : (
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-semibold text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isResettingTokens}
                  onClick={handleResetDailyTokens}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-neutral-950 font-bold text-xs transition shadow-md shadow-amber-500/20"
                >
                  {isResettingTokens ? 'Resetting...' : 'Yes, Reset to #1'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 4: CHANGE STAFF PIN                                      */}
      {/* ============================================================== */}
      {showPinChangeModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 mx-auto flex items-center justify-center mb-2">
                <KeyRound className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">Change Staff Master PIN</h3>
              <p className="text-xs text-neutral-400">
                Update the PIN required to unlock the POS terminal.
              </p>
            </div>

            {pinChangeMsg && (
              <p className={`text-xs p-2.5 rounded-lg border text-center ${
                pinChangeMsg.isError
                  ? 'bg-red-500/10 border-red-500/20 text-red-400'
                  : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              }`}>
                {pinChangeMsg.text}
              </p>
            )}

            <form onSubmit={handleChangePin} className="space-y-3">
              <div>
                <label className="text-xs text-neutral-300 font-semibold block mb-1">
                  Current PIN
                </label>
                <input
                  type="password"
                  required
                  placeholder="e.g. 1234"
                  value={currentPinInput}
                  onChange={(e) => setCurrentPinInput(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="text-xs text-neutral-300 font-semibold block mb-1">
                  New PIN (at least 4 digits)
                </label>
                <input
                  type="password"
                  required
                  placeholder="e.g. 5678"
                  value={newPinInput}
                  onChange={(e) => setNewPinInput(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPinChangeModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-semibold text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs transition shadow-md shadow-amber-500/20"
                >
                  Update PIN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 5: PIN VERIFICATION MODAL ON HANDOVER                    */}
      {/* ============================================================== */}
      {verifyingOrderId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 mx-auto flex items-center justify-center mb-2">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">Food Handover Verification</h3>
              <p className="text-xs text-neutral-400">
                Ask student for the 4-digit PIN displayed on their phone screen.
              </p>
            </div>

            {pinError && (
              <p className="text-xs text-red-400 bg-red-500/10 p-2.5 rounded-lg border border-red-500/20 text-center">
                {pinError}
              </p>
            )}

            <form onSubmit={handleVerifyPin} className="space-y-4">
              <div>
                <input
                  type="text"
                  maxLength={4}
                  autoFocus
                  placeholder="e.g. 4821"
                  value={inputPin}
                  onChange={(e) => setInputPin(e.target.value)}
                  className="w-full text-center tracking-widest text-3xl font-mono font-black bg-neutral-950 border border-neutral-800 rounded-xl py-3 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setVerifyingOrderId(null)}
                  className="flex-1 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-semibold text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs transition shadow-md shadow-emerald-500/20"
                >
                  Confirm Handover
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
