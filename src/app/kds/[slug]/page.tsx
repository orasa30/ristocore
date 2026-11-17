'use client';

import { Suspense, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Bell, CheckCircle, Clock, Flame, Wifi } from 'lucide-react';

function KitchenContent() {
  const params = useParams();
  const slug = params.slug as string;

  const [restaurant, setRestaurant] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [audioEnabled, setAudioEnabled] = useState(false);

  const playAlertSound = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.5, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    let channel: any;
    let isMounted = true;

    async function initKDS() {
      const { data: rest } = await supabase
        .from('restaurants')
        .select('*')
        .eq('slug', slug)
        .single();

      if (!rest || !isMounted) return;
      setRestaurant(rest);

      const { data: existingOrders } = await supabase
        .from('orders')
        .select('*')
        .eq('restaurant_id', rest.id)
        .neq('status', 'completed')
        .order('created_at', { ascending: true });

      if (!isMounted) return;
      setOrders(existingOrders || []);

      const uniqueChannelName = `kitchen-orders-${rest.id}-${Date.now()}`;
      channel = supabase
        .channel(uniqueChannelName)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'orders',
            filter: `restaurant_id=eq.${rest.id}`,
          },
          (payload) => {
            setOrders((prev) => [...prev, payload.new]);
            playAlertSound();
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'orders',
            filter: `restaurant_id=eq.${rest.id}`,
          },
          (payload) => {
            setOrders((prev) =>
              prev
                .map((o) => (o.id === payload.new.id ? payload.new : o))
                .filter((o) => o.status !== 'completed')
            );
          }
        )
        .subscribe();
    }

    initKDS();

    return () => {
      isMounted = false;
      if (channel) supabase.removeChannel(channel);
    };
  }, [slug]);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
    if (newStatus === 'completed') {
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
    } else {
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)));
    }
  };

  if (!restaurant) return <div className="p-10 text-white bg-black min-h-screen">Connessione cucina...</div>;

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6">
      <div className="flex flex-wrap justify-between items-center border-b border-zinc-800 pb-4 mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <Flame className="text-amber-500" /> KDS CUCINA — {restaurant.name}
          </h1>
          <p className="text-xs text-emerald-400 flex items-center gap-1 mt-1 font-semibold">
            <Wifi size={14} /> Sistema Live Connesso H24 • Ordini attivi: {orders.length}
          </p>
        </div>

        <button
          onClick={() => {
            setAudioEnabled(true);
            playAlertSound();
          }}
          className={`px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 ${
            audioEnabled ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-black animate-pulse'
          }`}
        >
          <Bell size={18} />
          {audioEnabled ? 'Audio Comande Attivo' : 'Clicca per Attivare Suono Comande'}
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-24 text-zinc-500">
          <p className="text-xl font-bold">Nessuna comanda in coda</p>
          <p className="text-sm mt-1">Appena un tavolo ordina dal QR, la comanda apparirà qui con segnale acustico.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {orders.map((order) => (
            <div
              key={order.id}
              className={`rounded-2xl border-2 p-5 flex flex-col justify-between ${
                order.status === 'pending'
                  ? 'bg-zinc-900 border-amber-500 shadow-lg shadow-amber-500/10'
                  : 'bg-zinc-900 border-blue-500'
              }`}
            >
              <div>
                <div className="flex justify-between items-center border-b border-zinc-800 pb-3 mb-3">
                  <span className="text-xl font-black text-amber-400">{order.table_number}</span>
                  <span className="text-xs bg-zinc-800 px-2.5 py-1 rounded-lg flex items-center gap-1 text-zinc-300">
                    <Clock size={12} />
                    {new Date(order.created_at).toLocaleTimeString('it-IT', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                <ul className="space-y-3 my-4">
                  {order.items?.map((item: any, idx: number) => (
                    <li key={idx} className="border-b border-zinc-800/60 pb-2">
                      <div className="flex justify-between font-bold text-base">
                        <span>
                          <span className="text-amber-400 mr-2">{item.qty}x</span>
                          {item.name}
                        </span>
                      </div>
                      {item.note && (
                        <p className="text-xs bg-red-500/20 text-red-300 px-2 py-1 rounded mt-1 font-semibold">
                          NOTA: {item.note}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-3 flex flex-col gap-2">
                {order.status === 'pending' && (
                  <button
                    onClick={() => updateOrderStatus(order.id, 'preparing')}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-extrabold py-3 rounded-xl text-sm"
                  >
                    Inizia Preparazione
                  </button>
                )}
                <button
                  onClick={() => updateOrderStatus(order.id, 'completed')}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold py-3 rounded-xl text-sm flex items-center justify-center gap-2"
                >
                  <CheckCircle size={18} /> Segna Pronto / Consegnato
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function KitchenDisplayPage() {
  return (
    <Suspense fallback={<div className="p-10 text-white bg-black min-h-screen">Caricamento KDS...</div>}>
      <KitchenContent />
    </Suspense>
  );
}