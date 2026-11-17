'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Tv, 
  Clock, 
  Volume2, 
  VolumeX, 
  Maximize, 
  ChefHat, 
  CheckCircle2, 
  UtensilsCrossed 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Order } from '@/types';
import { syncBus } from '@/lib/syncChannel';
import { playOrderReadyChime } from '@/lib/audioChime';

export default function PublicTvDisplayPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [audioEnabled, setAudioEnabled] = useState<boolean>(true);
  const [hasInteracted, setHasInteracted] = useState<boolean>(false);
  const prevReadyTokensRef = useRef<number[]>([]);

  // Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch Orders
  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch('/api/orders');
      const data = await res.json();
      if (data.success && Array.isArray(data.orders)) {
        const activeOrders = data.orders.filter((o: Order) => o.status !== 'collected');
        setOrders(activeOrders);

        // Detect newly ready tokens to chime
        const currentReadyTokens = activeOrders
          .filter((o: Order) => o.status === 'ready')
          .map((o: Order) => o.tokenNumber);

        // Check if there are new ready tokens that weren't ready before
        const newlyReady = currentReadyTokens.filter(
          (t: number) => !prevReadyTokensRef.current.includes(t)
        );

        if (newlyReady.length > 0 && prevReadyTokensRef.current.length > 0) {
          playOrderReadyChime();
          try {
            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.4 }
            });
          } catch (e) {}
        }

        prevReadyTokensRef.current = currentReadyTokens;
      }
    } catch (err) {
      console.error('Failed to fetch orders on TV display:', err);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 3000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  // Real-time bus listener for instant HDMI zero-lag sync
  useEffect(() => {
    const unsub = syncBus.subscribe((msg) => {
      if (msg.type === 'ORDER_CREATED' || msg.type === 'ORDER_STATUS_CHANGED') {
        fetchOrders();
      }
    });
    return () => unsub();
  }, [fetchOrders]);

  // Fullscreen toggle
  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error('Error attempting to enable fullscreen:', err);
      });
    } else {
      document.exitFullscreen().catch((err) => {
        console.error('Error attempting to exit fullscreen:', err);
      });
    }
  };

  const handleEnableAudio = () => {
    playOrderReadyChime();
    setHasInteracted(true);
    setAudioEnabled(true);
  };

  // Filter orders by status
  const preparingOrders = orders.filter(
    (o) => o.status === 'received' || o.status === 'preparing'
  );
  const readyOrders = orders.filter((o) => o.status === 'ready');

  return (
    <div 
      onClick={() => {
        if (!hasInteracted) handleEnableAudio();
      }}
      className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans select-none overflow-hidden"
    >
      {/* Top TV Bar */}
      <header className="bg-neutral-900 border-b border-neutral-800 px-6 py-4 flex items-center justify-between shrink-0 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
            <UtensilsCrossed className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-3">
              CAMPUSBITE TOKEN DISPLAY
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                LIVE BOARD
              </span>
            </h1>
            <p className="text-xs text-neutral-400">HDMI Extended Display / Canteen Hall Screen</p>
          </div>
        </div>

        {/* Right Info & Controls */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 font-mono text-xl font-black text-amber-400 bg-neutral-950 px-4 py-2 rounded-xl border border-neutral-800">
            <Clock className="w-5 h-5 text-neutral-500" />
            <span>{currentTime}</span>
          </div>

          <button
            onClick={handleEnableAudio}
            className={`p-2.5 rounded-xl border transition ${
              audioEnabled
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                : 'bg-neutral-800 border-neutral-700 text-neutral-400'
            }`}
            title="Toggle / Test Audio Chime"
          >
            {audioEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>

          <button
            onClick={toggleFullScreen}
            className="p-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 transition"
            title="Toggle Fullscreen Mode (F11)"
          >
            <Maximize className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Audio permission banner if needed */}
      {!hasInteracted && (
        <div className="bg-amber-500/10 border-b border-amber-500/30 py-1.5 px-4 text-center text-xs text-amber-300 font-medium">
          Click anywhere on this screen once to enable HDMI Audio Chimes for ready orders.
        </div>
      )}

      {/* Main Split Screen */}
      <main className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 p-6 overflow-hidden">
        {/* LEFT COLUMN: PREPARING (YELLOW / BLUE) */}
        <section className="bg-neutral-900/60 rounded-3xl border border-neutral-800/80 p-6 flex flex-col shadow-2xl">
          <div className="flex items-center justify-between pb-4 border-b border-neutral-800 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                <ChefHat className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h2 className="text-xl font-black text-amber-400 tracking-wide">
                  NOW PREPARING
                </h2>
                <p className="text-xs text-neutral-400">Orders currently cooking in the kitchen</p>
              </div>
            </div>

            <span className="font-mono text-2xl font-black text-neutral-400 bg-neutral-950 px-4 py-1 rounded-xl border border-neutral-800">
              {preparingOrders.length}
            </span>
          </div>

          {/* Tokens Grid */}
          <div className="flex-1 overflow-y-auto mt-6 pr-2">
            {preparingOrders.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-neutral-600 space-y-2">
                <ChefHat className="w-12 h-12 opacity-30" />
                <p className="text-sm font-semibold">All orders prepared!</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {preparingOrders.map((ord) => (
                  <div
                    key={ord.id}
                    className="bg-neutral-950/80 rounded-2xl border border-amber-500/30 p-5 text-center flex flex-col justify-between shadow-lg"
                  >
                    <div>
                      <span className="text-xs font-semibold text-neutral-400 block mb-1">
                        Token
                      </span>
                      <span className="text-5xl font-black text-amber-400 font-mono tracking-tight block">
                        #{ord.tokenNumber}
                      </span>
                    </div>

                    <div className="mt-4 pt-3 border-t border-neutral-800/80 flex items-center justify-between text-xs text-neutral-400">
                      <span className="font-mono text-[11px]">{ord.uniqueCode}</span>
                      <span className="text-amber-400/90 font-medium text-[11px] animate-pulse">
                        {ord.status === 'received' ? 'Queued' : 'Cooking'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* RIGHT COLUMN: READY FOR PICKUP (GLOWING GREEN) */}
        <section className="bg-emerald-950/20 rounded-3xl border border-emerald-500/40 p-6 flex flex-col shadow-2xl ring-1 ring-emerald-500/20">
          <div className="flex items-center justify-between pb-4 border-b border-emerald-500/30 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-black text-emerald-400 tracking-wide">
                  READY FOR COLLECTION
                </h2>
                <p className="text-xs text-emerald-400/70">Show your 4-digit PIN at Counter 1</p>
              </div>
            </div>

            <span className="font-mono text-2xl font-black text-emerald-400 bg-emerald-950/60 px-4 py-1 rounded-xl border border-emerald-500/30">
              {readyOrders.length}
            </span>
          </div>

          {/* Ready Tokens Grid */}
          <div className="flex-1 overflow-y-auto mt-6 pr-2">
            {readyOrders.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-neutral-600 space-y-2">
                <CheckCircle2 className="w-12 h-12 opacity-30" />
                <p className="text-sm font-semibold">No ready orders waiting right now</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {readyOrders.map((ord) => (
                  <div
                    key={ord.id}
                    className="bg-emerald-900/30 rounded-2xl border-2 border-emerald-500 p-5 text-center flex flex-col justify-between shadow-2xl shadow-emerald-950 animate-in fade-in zoom-in-95 duration-300"
                  >
                    <div>
                      <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider block mb-1">
                        Ready
                      </span>
                      <span className="text-5xl font-black text-white font-mono tracking-tight block drop-shadow-md">
                        #{ord.tokenNumber}
                      </span>
                    </div>

                    <div className="mt-4 pt-3 border-t border-emerald-500/30 flex items-center justify-between text-xs text-emerald-300">
                      <span className="font-mono font-bold">{ord.uniqueCode}</span>
                      <span className="text-[11px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-md font-semibold">
                        Counter 1
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Bottom Ticker */}
      <footer className="bg-neutral-900 border-t border-neutral-800 px-6 py-2.5 flex items-center justify-between text-xs text-neutral-400 shrink-0">
        <span className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
          When your token appears green, walk to the counter and show your 4-digit PIN
        </span>
        <span className="font-mono text-neutral-500 text-[11px]">
          CampusBite HDMI TV Engine • Zero Installation
        </span>
      </footer>
    </div>
  );
}
