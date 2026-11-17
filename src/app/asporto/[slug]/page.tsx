'use client';

import { Suspense, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ShoppingBag, Plus, Minus, Send, CheckCircle2, Clock, Phone, User } from 'lucide-react';

interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  available?: boolean;
}

interface Restaurant {
  id: string;
  name: string;
  slug: string;
  whatsapp_number?: string;
}

function TakeawayContent() {
  const params = useParams();
  const slug = decodeURIComponent(params.slug as string);

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [pickupTime, setPickupTime] = useState('20:30');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [orderSent, setOrderSent] = useState(false);

  useEffect(() => {
    async function loadData() {
      const { data: rest } = await supabase
        .from('restaurants')
        .select('*')
        .eq('slug', slug)
        .single();

      if (rest) {
        setRestaurant(rest);
        const { data: menu } = await supabase
          .from('menu_items')
          .select('*')
          .eq('restaurant_id', rest.id)
          .order('category', { ascending: true });

        if (menu) {
          setItems(menu.filter((m) => m.available !== false));
        }
      }
      setLoading(false);
    }
    loadData();
  }, [slug]);

  const addItem = (id: string) => setCart((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  const removeItem = (id: string) =>
    setCart((prev) => {
      const next = { ...prev };
      if ((next[id] || 0) <= 1) delete next[id];
      else next[id] -= 1;
      return next;
    });

  const totalAmount = items.reduce((sum, item) => sum + (cart[item.id] || 0) * Number(item.price), 0);
  const totalCount = Object.values(cart).reduce((a, b) => a + b, 0);

  const sendTakeawayOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurant || totalCount === 0 || !customerName || !customerPhone) return;

    const orderItems = items
      .filter((i) => cart[i.id] > 0)
      .map((i) => ({
        id: i.id,
        name: i.name,
        quantity: cart[i.id],
        price: Number(i.price),
      }));

    const { error } = await supabase.from('orders').insert({
      restaurant_id: restaurant.id,
      table_number: `ASPORTO (${pickupTime})`,
      order_type: 'takeaway',
      customer_name: customerName,
      customer_phone: customerPhone,
      pickup_time: pickupTime,
      items: orderItems,
      total: totalAmount,
      notes,
      status: 'pending',
    });

    if (!error) {
      setCart({});
      setNotes('');
      setOrderSent(true);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center">Caricamento menu asporto...</div>;
  }

  if (!restaurant) {
    return <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center">Locale non trovato.</div>;
  }

  const categories = Array.from(new Set(items.map((i) => i.category)));

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 pb-20">
      <header className="sticky top-0 z-20 bg-neutral-900/95 backdrop-blur border-b border-neutral-800 px-4 py-4">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full mb-1">
              <ShoppingBag className="w-3 h-3" /> Ordina d&apos;Asporto • Zero Commissioni
            </span>
            <h1 className="text-xl font-extrabold text-white">{restaurant.name}</h1>
          </div>
          {totalCount > 0 && (
            <a
              href="#checkout-asporto"
              className="bg-amber-500 text-neutral-950 font-extrabold text-xs px-3.5 py-2 rounded-xl"
            >
              Carrello ({totalCount}) • € {totalAmount.toFixed(2)}
            </a>
          )}
        </div>
      </header>

      {orderSent && (
        <div className="max-w-xl mx-auto px-4 pt-5">
          <div className="bg-emerald-950/70 border border-emerald-500/50 rounded-2xl p-4 flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h2 className="font-bold text-emerald-300">Ordine d&apos;Asporto Confermato!</h2>
              <p className="text-xs text-neutral-200 mt-1">
                La cucina ha ricevuto la tua comanda per le <strong>{pickupTime}</strong> a nome <strong>{customerName}</strong>.
              </p>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-xl mx-auto px-4 pt-5 space-y-6">
        {categories.map((cat) => (
          <section key={cat}>
            <h2 className="text-sm uppercase tracking-wider text-amber-400 font-semibold mb-3">{cat}</h2>
            <div className="space-y-3">
              {items
                .filter((i) => i.category === cat)
                .map((item) => {
                  const qty = cart[item.id] || 0;
                  return (
                    <div
                      key={item.id}
                      className="bg-neutral-900 border border-neutral-800 rounded-xl p-3.5 flex items-center justify-between gap-3"
                    >
                      <div className="flex-1">
                        <h3 className="font-semibold text-neutral-100">{item.name}</h3>
                        {item.description && (
                          <p className="text-xs text-neutral-400 mt-0.5">{item.description}</p>
                        )}
                        <p className="text-sm font-bold text-amber-400 mt-1.5">
                          € {Number(item.price).toFixed(2)}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {qty > 0 && (
                          <>
                            <button
                              type="button"
                              onClick={() => removeItem(item.id)}
                              className="w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center text-neutral-200"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="w-5 text-center font-bold text-sm">{qty}</span>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => addItem(item.id)}
                          className="w-8 h-8 rounded-lg bg-amber-500 text-neutral-950 flex items-center justify-center font-bold"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </section>
        ))}

        {/* Modulo Ritiro Asporto */}
        {totalCount > 0 && (
          <form
            id="checkout-asporto"
            onSubmit={sendTakeawayOrder}
            className="bg-neutral-900 border border-amber-500/40 rounded-2xl p-5 space-y-3.5"
          >
            <h2 className="font-extrabold text-base text-amber-400">Dettagli per il Ritiro in Sede</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-neutral-400 flex items-center gap-1 mb-1">
                  <User className="w-3.5 h-3.5" /> Nome e Cognome*
                </label>
                <input
                  required
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Es. Marco Rossi"
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-neutral-400 flex items-center gap-1 mb-1">
                  <Phone className="w-3.5 h-3.5" /> Telefono*
                </label>
                <input
                  required
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Es. 3401234567"
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-neutral-400 flex items-center gap-1 mb-1">
                <Clock className="w-3.5 h-3.5" /> Orario di Ritiro Desiderato*
              </label>
              <input
                required
                type="time"
                value={pickupTime}
                onChange={(e) => setPickupTime(e.target.value)}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm"
              />
            </div>

            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Note per la cucina (allergie, senza cipolla...)"
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm"
            />

            <button
              type="submit"
              className="w-full bg-amber-500 hover:bg-amber-400 text-neutral-950 font-extrabold py-3.5 rounded-xl flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              Invia Ordine Asporto • € {totalAmount.toFixed(2)}
            </button>
          </form>
        )}
      </main>
    </div>
  );
}

export default function TakeawayPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-neutral-950 text-white p-6">Caricamento...</div>}>
      <TakeawayContent />
    </Suspense>
  );
}