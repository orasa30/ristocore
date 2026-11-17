'use client';

import { Suspense, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Bell, CheckCircle, Clock, Flame, Volume2 } from 'lucide-react';

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  table_number: string;
  items: OrderItem[];
  total: number;
  notes?: string;
  status: string;
  created_at: string;
}

interface ServiceCall {
  id: string;
  table_number: string;
  call_type: string;
  status: string;
  created_at: string;
}

function KDSContent() {
  const params = useParams();
  const slug = decodeURIComponent(params.slug as string);

  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [restaurantName, setRestaurantName] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [calls, setCalls] = useState<ServiceCall[]>([]);
  const [audioEnabled, setAudioEnabled] = useState(false);

  const playDing = () => {
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch {
      // ignore audio block
    }
  };

  useEffect(() => {
    async function init() {
      const { data: rest } = await supabase
        .from('restaurants')
        .select('id, name')
        .eq('slug', slug)
        .single();

      if (!rest) return;
      setRestaurantId(rest.id);
      setRestaurantName(rest.name);

      const { data: initialOrders } = await supabase
        .from('orders')
        .select('*')
        .eq('restaurant_id', rest.id)
        .neq('status', 'completed')
        .order('created_at', { ascending: true });

      if (initialOrders) setOrders(initialOrders);

      const { data: initialCalls } = await supabase
        .from('service_calls')
        .select('*')
        .eq('restaurant_id', rest.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      if (initialCalls) setCalls(initialCalls);

      const channel = supabase
        .channel(`kds-${rest.id}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'orders', filter: `restaurant_id=eq.${rest.id}` },
          (payload) => {
            if (payload.eventType === 'INSERT') {
              setOrders((prev) => [...prev, payload.new as Order]);
              playDing();
            } else if (payload.eventType === 'UPDATE') {
              const updated = payload.new as Order;
              if (updated.status === 'completed') {
                setOrders((prev) => prev.filter((o) => o.id !== updated.id));
              } else {
                setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
              }
            }
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'service_calls', filter: `restaurant_id=eq.${rest.id}` },
          (payload) => {
            if (payload.eventType === 'INSERT') {
              setCalls((prev) => [...prev, payload.new as ServiceCall]);
              playDing();
            } else if (payload.eventType === 'UPDATE') {
              const updated = payload.new as ServiceCall;
              if (updated.status === 'resolved') {
                setCalls((prev) => prev.filter((c) => c.id !== updated.id));
              }
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
    init();
  }, [slug]);

  const updateOrderStatus = async (id: string, status: string) => {
    await supabase.from('orders').update({ status }).eq('id', id);
    if (status === 'completed') {
      setOrders((prev) => prev.filter((o) => o.id !== id));
    } else {
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    }
  };

  const resolveCall = async (id: string) => {
    await supabase.from('service_calls').update({ status: 'resolved' }).eq('id', id);
    setCalls((prev) => prev.filter((c) => c.id !== id));
  };

  const formatCallLabel = (type: string) => {
    if (type === 'bill_card') return 'Chiede il Conto (CARTA / POS)';
    if (type === 'bill_cash') return 'Chiede il Conto (CONTANTI)';
    return 'Chiama Cameriere al Tavolo';
  };

  if (!restaurantId) {
    return <div className="min-h-screen bg-neutral-950 text-white p-6">Connessione KDS...</div>;
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-4 sm:p-6">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-800 pb-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-amber-400">KDS Live • {restaurantName}</h1>
          <p className="text-xs text-neutral-400">Ordini attivi: {orders.length} • Avvisi sala: {calls.length}</p>
        </div>

        <button
          onClick={() => {
            setAudioEnabled(true);
            playDing();
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm ${
            audioEnabled ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-neutral-950'
          }`}
        >
          <Volume2 className="w-4 h-4" />
          {audioEnabled ? 'Audio Attivo' : 'Attiva Suono Comande'}
        </button>
      </div>

      {/* Avvisi Sala (Cameriere / Conto) */}
      {calls.length > 0 && (
        <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {calls.map((call) => (
            <div
              key={call.id}
              className="bg-sky-950/70 border border-sky-500 rounded-xl p-4 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                <Bell className="w-6 h-6 text-sky-400 shrink-0" />
                <div>
                  <p className="font-bold text-white">{call.table_number}</p>
                  <p className="text-xs text-sky-300">{formatCallLabel(call.call_type)}</p>
                </div>
              </div>
              <button
                onClick={() => resolveCall(call.id)}
                className="bg-sky-500 hover:bg-sky-400 text-neutral-950 font-bold text-xs px-3 py-2 rounded-lg"
              >
                Gestito
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Griglia Comande Cucina */}
      {orders.length === 0 ? (
        <div className="text-center text-neutral-500 py-20">Nessuna comanda in attesa.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className={`rounded-2xl border p-4 flex flex-col justify-between ${
                order.status === 'preparing'
                  ? 'bg-amber-950/20 border-amber-500/60'
                  : 'bg-neutral-900 border-neutral-800'
              }`}
            >
              <div>
                <div className="flex items-center justify-between border-b border-neutral-800 pb-2.5 mb-3">
                  <span className="text-lg font-extrabold text-amber-400">{order.table_number}</span>
                  <span className="text-xs text-neutral-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(order.created_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <ul className="space-y-2 mb-3">
                  {order.items?.map((item, idx) => (
                    <li key={idx} className="flex justify-between text-sm">
                      <span>
                        <strong className="text-amber-400">{item.quantity}x</strong> {item.name}
                      </span>
                    </li>
                  ))}
                </ul>

                {order.notes && (
                  <div className="bg-red-950/50 border border-red-500/40 text-red-200 text-xs p-2.5 rounded-lg mb-3">
                    <strong>Note:</strong> {order.notes}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-neutral-800">
                <button
                  onClick={() => updateOrderStatus(order.id, 'preparing')}
                  className="flex items-center justify-center gap-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold py-2.5 rounded-lg"
                >
                  <Flame className="w-4 h-4" />
                  In Preparazione
                </button>
                <button
                  onClick={() => updateOrderStatus(order.id, 'completed')}
                  className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2.5 rounded-lg"
                >
                  <CheckCircle className="w-4 h-4" />
                  Servito
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
export default function KDSPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-neutral-950 text-white p-6">Connessione KDS...</div>}>
      <KDSContent />
    </Suspense>
  );
}