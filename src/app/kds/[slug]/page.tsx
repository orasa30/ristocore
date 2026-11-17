'use client';

import { Suspense, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ChefHat, Bell, CheckCircle2, Volume2, Clock, Printer, ShoppingBag } from 'lucide-react';

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  table_number: string;
  order_type?: string;
  customer_name?: string;
  customer_phone?: string;
  pickup_time?: string;
  items: OrderItem[];
  total: number;
  notes?: string;
  status: string;
  created_at: string;
}

interface ServiceCall {
  id: string;
  table_number: string;
  call_type: 'waiter' | 'bill_card' | 'bill_cash';
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

  const playAlertSound = () => {
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.28);
    } catch {
      // Audio non ancora sbloccato
    }
  };

  useEffect(() => {
    async function initKDS() {
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
        .in('status', ['pending', 'preparing'])
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
          { event: 'INSERT', schema: 'public', table: 'orders', filter: `restaurant_id=eq.${rest.id}` },
          (payload) => {
            setOrders((prev) => [...prev, payload.new as Order]);
            playAlertSound();
          }
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'orders', filter: `restaurant_id=eq.${rest.id}` },
          (payload) => {
            const updated = payload.new as Order;
            if (updated.status === 'completed') {
              setOrders((prev) => prev.filter((o) => o.id !== updated.id));
            } else {
              setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
            }
          }
        )
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'service_calls', filter: `restaurant_id=eq.${rest.id}` },
          (payload) => {
            setCalls((prev) => [...prev, payload.new as ServiceCall]);
            playAlertSound();
          }
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'service_calls', filter: `restaurant_id=eq.${rest.id}` },
          (payload) => {
            const updated = payload.new as ServiceCall;
            if (updated.status === 'resolved') {
              setCalls((prev) => prev.filter((c) => c.id !== updated.id));
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }

    initKDS();
  }, [slug]);

  const advanceOrder = async (order: Order) => {
    const nextStatus = order.status === 'pending' ? 'preparing' : 'completed';
    await supabase.from('orders').update({ status: nextStatus }).eq('id', order.id);
    if (nextStatus === 'completed') {
      setOrders((prev) => prev.filter((o) => o.id !== order.id));
    } else {
      setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status: nextStatus } : o)));
    }
  };

  const resolveCall = async (id: string) => {
    await supabase.from('service_calls').update({ status: 'resolved' }).eq('id', id);
    setCalls((prev) => prev.filter((c) => c.id !== id));
  };

  // Stampa Comanda / Pre-conto su stampante termica 80mm
  const printReceipt80mm = (order: Order) => {
    const printWin = window.open('', '_blank', 'width=340,height=600');
    if (!printWin) return;

    const rowsHtml = (order.items || [])
      .map(
        (it) =>
          `<div style="display:flex;justify-content:space-between;margin:4px 0;font-size:14px;">
            <span><strong>${it.quantity}x</strong> ${it.name}</span>
            <span>€ ${(Number(it.price) * it.quantity).toFixed(2)}</span>
          </div>`
      )
      .join('');

    printWin.document.write(`
      <html>
        <head>
          <title>Comanda ${order.table_number}</title>
          <style>
            @page { margin: 4mm; size: 80mm auto; }
            body { font-family: monospace; width: 72mm; margin: 0 auto; color: #000; }
            hr { border: none; border-top: 1px dashed #000; margin: 8px 0; }
          </style>
        </head>
        <body>
          <h2 style="text-align:center;margin:4px 0;font-size:16px;">${restaurantName}</h2>
          <p style="text-align:center;margin:2px 0;font-size:14px;"><strong>${order.table_number}</strong></p>
          ${order.customer_name ? `<p style="text-align:center;margin:2px 0;font-size:12px;">Cliente: ${order.customer_name} (${order.customer_phone || ''})</p>` : ''}
          <p style="text-align:center;margin:2px 0;font-size:11px;">${new Date(order.created_at).toLocaleString('it-IT')}</p>
          <hr />
          ${rowsHtml}
          ${order.notes ? `<hr /><p style="font-size:13px;"><strong>NOTE:</strong> ${order.notes}</p>` : ''}
          <hr />
          <div style="display:flex;justify-content:space-between;font-size:16px;font-weight:bold;">
            <span>TOTALE</span>
            <span>€ ${Number(order.total).toFixed(2)}</span>
          </div>
          <script>window.onload = function() { window.print(); window.close(); };</script>
        </body>
      </html>
    `);
    printWin.document.close();
  };

  const formatCallLabel = (type: ServiceCall['call_type']) => {
    if (type === 'waiter') return 'Chiama Cameriere';
    if (type === 'bill_card') return 'Chiede il Conto (CARTA / POS)';
    return 'Chiede il Conto (CONTANTI)';
  };

  if (!restaurantId) {
    return <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center">Connessione KDS...</div>;
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-4 sm:p-6">
      {/* Top Bar */}
      <header className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-neutral-800">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-amber-500 text-neutral-950 flex items-center justify-center">
            <ChefHat className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold">{restaurantName} • KDS Cucina &amp; Sala</h1>
            <p className="text-xs text-emerald-400">● Sincronizzazione in tempo reale attiva</p>
          </div>
        </div>

        <button
          onClick={() => {
            setAudioEnabled(true);
            playAlertSound();
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold ${
            audioEnabled
              ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40'
              : 'bg-amber-500 text-neutral-950 animate-pulse'
          }`}
        >
          <Volume2 className="w-4 h-4" />
          {audioEnabled ? 'Avviso Sonoro Attivo' : 'Attiva Suono Comande'}
        </button>
      </header>

      {/* Banner Chiamate Sala / Richieste Conto */}
      {calls.length > 0 && (
        <section className="max-w-7xl mx-auto mt-6">
          <h2 className="text-xs uppercase tracking-wider text-sky-400 font-bold mb-3 flex items-center gap-1.5">
            <Bell className="w-4 h-4" /> Richieste dai Tavoli ({calls.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {calls.map((call) => (
              <div
                key={call.id}
                className="bg-sky-950/60 border border-sky-500/50 rounded-xl p-4 flex items-center justify-between gap-3"
              >
                <div>
                  <span className="text-lg font-extrabold text-white">{call.table_number}</span>
                  <p className="text-sm font-semibold text-sky-300">{formatCallLabel(call.call_type)}</p>
                </div>
                <button
                  onClick={() => resolveCall(call.id)}
                  className="bg-sky-500 hover:bg-sky-400 text-neutral-950 font-bold text-xs px-3.5 py-2 rounded-lg"
                >
                  Gestito
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Griglia Comande Attive */}
      <main className="max-w-7xl mx-auto mt-6">
        <h2 className="text-xs uppercase tracking-wider text-neutral-400 font-bold mb-4">
          Comande in Corso ({orders.length})
        </h2>

        {orders.length === 0 ? (
          <div className="text-center py-20 text-neutral-500 border border-dashed border-neutral-800 rounded-2xl">
            Nessuna comanda in attesa. I nuovi ordini appariranno qui automaticamente.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {orders.map((order) => {
              const isTakeaway = order.order_type === 'takeaway';
              return (
                <div
                  key={order.id}
                  className={`rounded-2xl border p-4 flex flex-col justify-between space-y-4 ${
                    isTakeaway
                      ? 'bg-purple-950/20 border-purple-500/50'
                      : order.status === 'pending'
                      ? 'bg-neutral-900 border-amber-500/60'
                      : 'bg-neutral-900 border-emerald-500/50'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                      <div>
                        <span className="text-lg font-extrabold text-white flex items-center gap-1.5">
                          {isTakeaway && <ShoppingBag className="w-4 h-4 text-purple-400" />}
                          {order.table_number}
                        </span>
                        {order.customer_name && (
                          <p className="text-xs text-purple-300 font-semibold">
                            {order.customer_name} • {order.customer_phone}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => printReceipt80mm(order)}
                          title="Stampa Comanda 80mm"
                          className="p-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-neutral-300"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <span
                          className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                            order.status === 'pending'
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-emerald-500/20 text-emerald-300'
                          }`}
                        >
                          {order.status === 'pending' ? 'Nuovo' : 'In Preparazione'}
                        </span>
                      </div>
                    </div>

                    <ul className="mt-3 space-y-2">
                      {(order.items || []).map((item, idx) => (
                        <li key={idx} className="flex justify-between text-sm">
                          <span>
                            <strong className="text-amber-400">{item.quantity}x</strong> {item.name}
                          </span>
                          <span className="text-neutral-400">€ {(item.price * item.quantity).toFixed(2)}</span>
                        </li>
                      ))}
                    </ul>

                    {order.notes && (
                      <div className="mt-3 bg-red-950/50 border border-red-500/40 rounded-lg p-2.5 text-xs text-red-200">
                        <strong>Note:</strong> {order.notes}
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-neutral-800 space-y-2.5">
                    <div className="flex items-center justify-between text-xs text-neutral-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(order.created_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="font-bold text-neutral-200">Totale: € {Number(order.total).toFixed(2)}</span>
                    </div>

                    <button
                      onClick={() => advanceOrder(order)}
                      className={`w-full py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 ${
                        order.status === 'pending'
                          ? 'bg-amber-500 hover:bg-amber-400 text-neutral-950'
                          : 'bg-emerald-500 hover:bg-emerald-400 text-neutral-950'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      {order.status === 'pending' ? 'Inizia Preparazione' : 'Segna Pronto / Consegnato'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
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