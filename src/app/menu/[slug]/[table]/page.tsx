'use client';

import { Suspense, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Star, Calendar, CheckCircle2, Plus, Minus, Send } from 'lucide-react';

function MenuContent() {
  const params = useParams();
  const slug = params.slug as string;
  const tableNumber = decodeURIComponent(params.table as string);

  const [restaurant, setRestaurant] = useState<any>(null);
  const [menu, setMenu] = useState<any[]>([]);
  const [cart, setCart] = useState<{ [id: string]: { item: any; qty: number; note: string } }>({});
  const [activeTab, setActiveTab] = useState<'menu' | 'book' | 'review'>('menu');
  const [orderSent, setOrderSent] = useState(false);
  const [loading, setLoading] = useState(true);

  const [bookName, setBookName] = useState('');
  const [bookPhone, setBookPhone] = useState('');
  const [bookGuests, setBookGuests] = useState(2);
  const [bookDate, setBookDate] = useState('');
  const [bookTime, setBookTime] = useState('20:30');
  const [bookSuccess, setBookSuccess] = useState(false);

  const [rating, setRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);

  useEffect(() => {
    async function loadData() {
      const { data: rest } = await supabase
        .from('restaurants')
        .select('*')
        .eq('slug', slug)
        .single();

      if (rest) {
        setRestaurant(rest);
        const { data: items } = await supabase
          .from('menu_items')
          .select('*')
          .eq('restaurant_id', rest.id)
          .eq('is_available', true);
        setMenu(items || []);
      }
      setLoading(false);
    }
    loadData();
  }, [slug]);

  const addToCart = (item: any) => {
    setCart((prev) => ({
      ...prev,
      [item.id]: {
        item,
        qty: (prev[item.id]?.qty || 0) + 1,
        note: prev[item.id]?.note || '',
      },
    }));
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => {
      const updated = { ...prev };
      if (!updated[itemId]) return prev;
      if (updated[itemId].qty <= 1) delete updated[itemId];
      else updated[itemId].qty -= 1;
      return updated;
    });
  };

  const updateNote = (itemId: string, note: string) => {
    setCart((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], note },
    }));
  };

  const totalAmount = Object.values(cart).reduce(
    (sum, entry) => sum + Number(entry.item.price) * entry.qty,
    0
  );

  const sendOrderToKitchen = async () => {
    if (!restaurant || Object.keys(cart).length === 0) return;

    const itemsPayload = Object.values(cart).map((entry) => ({
      name: entry.item.name,
      qty: entry.qty,
      note: entry.note,
      price: entry.item.price,
    }));

    const { error } = await supabase.from('orders').insert({
      restaurant_id: restaurant.id,
      table_number: tableNumber,
      status: 'pending',
      items: itemsPayload,
      total_amount: totalAmount,
    });

    if (!error) {
      setCart({});
      setOrderSent(true);
    } else {
      alert('Errore invio ordine: ' + error.message);
    }
  };

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurant) return;
    const { error } = await supabase.from('reservations').insert({
      restaurant_id: restaurant.id,
      customer_name: bookName,
      customer_phone: bookPhone,
      guests: bookGuests,
      reservation_date: bookDate,
      reservation_time: bookTime,
    });
    if (!error) setBookSuccess(true);
  };

  const handleRating = (stars: number) => {
    setRating(stars);
    if (stars >= 4 && restaurant?.google_review_url) {
      window.open(restaurant.google_review_url, '_blank');
    }
  };

  if (loading) return <div className="p-8 text-center text-white bg-zinc-950 min-h-screen font-bold">Caricamento menu...</div>;
  if (!restaurant) return <div className="p-8 text-center text-red-500 bg-zinc-950 min-h-screen font-bold">Locale non trovato.</div>;

  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-28">
      <div className="bg-zinc-900 border-b border-zinc-800 p-4 sticky top-0 z-10">
        <div className="flex justify-between items-center max-w-md mx-auto">
          <div>
            <h1 className="text-xl font-extrabold tracking-tight">{restaurant.name}</h1>
            <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full font-semibold">
              Tavolo: {tableNumber}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { setActiveTab('menu'); setOrderSent(false); }}
              className={`p-2 rounded-lg text-xs font-bold ${activeTab === 'menu' ? 'bg-amber-500 text-black' : 'bg-zinc-800'}`}
            >
              Menu
            </button>
            <button
              onClick={() => setActiveTab('book')}
              className={`p-2 rounded-lg text-xs font-bold flex items-center gap-1 ${activeTab === 'book' ? 'bg-amber-500 text-black' : 'bg-zinc-800'}`}
            >
              <Calendar size={14} /> Prenota
            </button>
            <button
              onClick={() => setActiveTab('review')}
              className={`p-2 rounded-lg text-xs font-bold flex items-center gap-1 ${activeTab === 'review' ? 'bg-amber-500 text-black' : 'bg-zinc-800'}`}
            >
              <Star size={14} /> Voto
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4">
        {activeTab === 'menu' && (
          <>
            {orderSent ? (
              <div className="bg-emerald-950/60 border border-emerald-500/40 rounded-2xl p-6 text-center my-6">
                <CheckCircle2 className="mx-auto text-emerald-400 mb-3" size={48} />
                <h2 className="text-xl font-bold text-emerald-300">Comanda inviata in cucina!</h2>
                <p className="text-sm text-zinc-300 mt-2">
                  Lo chef ha appena ricevuto il tuo ordine per il <strong>{tableNumber}</strong>.
                </p>
                <div className="mt-6 flex flex-col gap-3">
                  <button
                    onClick={() => setOrderSent(false)}
                    className="bg-zinc-800 hover:bg-zinc-700 py-3 rounded-xl font-bold text-sm"
                  >
                    Ordina qualcos&apos;altro
                  </button>
                  <button
                    onClick={() => setActiveTab('review')}
                    className="bg-amber-500 text-black py-3 rounded-xl font-bold text-sm"
                  >
                    Lascia una valutazione al locale
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {menu.map((item) => {
                  const inCart = cart[item.id];
                  return (
                    <div key={item.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
                      <div className="flex justify-between items-start gap-3">
                        <div>
                          <span className="text-[10px] uppercase tracking-wider text-amber-400 font-bold">
                            {item.category}
                          </span>
                          <h3 className="font-bold text-base">{item.name}</h3>
                          <p className="text-xs text-zinc-400 mt-1">{item.description}</p>
                          <p className="text-sm font-extrabold text-white mt-2">
                            € {Number(item.price).toFixed(2)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 bg-zinc-800 rounded-xl p-1">
                          {inCart ? (
                            <>
                              <button onClick={() => removeFromCart(item.id)} className="p-1.5 text-amber-400">
                                <Minus size={16} />
                              </button>
                              <span className="font-bold text-sm px-1">{inCart.qty}</span>
                              <button onClick={() => addToCart(item)} className="p-1.5 text-amber-400">
                                <Plus size={16} />
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => addToCart(item)}
                              className="bg-amber-500 text-black px-3 py-1.5 rounded-lg text-xs font-extrabold"
                            >
                              + Aggiungi
                            </button>
                          )}
                        </div>
                      </div>
                      {inCart && (
                        <input
                          type="text"
                          placeholder="Note per la cucina (es. senza cipolla, ben cotta)..."
                          value={inCart.note}
                          onChange={(e) => updateNote(item.id, e.target.value)}
                          className="mt-3 w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {activeTab === 'book' && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 mt-2">
            <h2 className="text-lg font-bold mb-1">Prenota un tavolo</h2>
            <p className="text-xs text-zinc-400 mb-4">Conferma immediata senza attese al telefono.</p>
            {bookSuccess ? (
              <div className="text-center py-6">
                <CheckCircle2 className="mx-auto text-emerald-400 mb-2" size={40} />
                <p className="font-bold text-emerald-300">Tavolo prenotato con successo!</p>
                <p className="text-xs text-zinc-400 mt-1">Ti aspettiamo il {bookDate} alle {bookTime}.</p>
              </div>
            ) : (
              <form onSubmit={handleBooking} className="space-y-3">
                <input
                  required
                  placeholder="Il tuo nome"
                  value={bookName}
                  onChange={(e) => setBookName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-3 text-sm"
                />
                <input
                  required
                  placeholder="Numero WhatsApp (es. 3331234567)"
                  value={bookPhone}
                  onChange={(e) => setBookPhone(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-3 text-sm"
                />
                <div className="grid grid-cols-3 gap-2">
                  <input
                    required
                    type="date"
                    value={bookDate}
                    onChange={(e) => setBookDate(e.target.value)}
                    className="bg-zinc-950 border border-zinc-700 rounded-xl p-3 text-xs"
                  />
                  <input
                    required
                    type="time"
                    value={bookTime}
                    onChange={(e) => setBookTime(e.target.value)}
                    className="bg-zinc-950 border border-zinc-700 rounded-xl p-3 text-xs"
                  />
                  <input
                    required
                    type="number"
                    min={1}
                    max={20}
                    value={bookGuests}
                    onChange={(e) => setBookGuests(Number(e.target.value))}
                    className="bg-zinc-950 border border-zinc-700 rounded-xl p-3 text-xs"
                    placeholder="Persone"
                  />
                </div>
                <button type="submit" className="w-full bg-amber-500 text-black font-extrabold py-3 rounded-xl text-sm">
                  Conferma Prenotazione
                </button>
              </form>
            )}
          </div>
        )}

        {activeTab === 'review' && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-center mt-2">
            <h2 className="text-lg font-bold">Com&apos;è stata la tua esperienza?</h2>
            <p className="text-xs text-zinc-400 mt-1">Tocca le stelle per valutare il servizio</p>
            <div className="flex justify-center gap-2 my-6">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} onClick={() => handleRating(star)}>
                  <Star
                    size={36}
                    className={star <= rating ? 'fill-amber-400 text-amber-400' : 'text-zinc-600'}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && rating <= 3 && !feedbackSent && (
              <div className="text-left space-y-3">
                <p className="text-xs text-amber-300">
                  Ci dispiace che qualcosa non sia andato al top. Scrivi direttamente al titolare per risolvere subito:
                </p>
                <textarea
                  rows={3}
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Raccontaci cosa possiamo migliorare..."
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-3 text-xs"
                />
                <button
                  onClick={() => setFeedbackSent(true)}
                  className="w-full bg-amber-500 text-black font-bold py-2.5 rounded-xl text-xs"
                >
                  Invia messaggio privato al Titolare
                </button>
              </div>
            )}
            {feedbackSent && (
              <p className="text-sm text-emerald-400 font-bold">
                Grazie! Il titolare ha ricevuto il tuo messaggio in privato.
              </p>
            )}
          </div>
        )}
      </div>

      {activeTab === 'menu' && !orderSent && Object.keys(cart).length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800 p-4">
          <div className="max-w-md mx-auto flex justify-between items-center">
            <div>
              <p className="text-xs text-zinc-400">Totale comanda</p>
              <p className="text-lg font-extrabold text-amber-400">€ {totalAmount.toFixed(2)}</p>
            </div>
            <button
              onClick={sendOrderToKitchen}
              className="bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold px-6 py-3 rounded-xl flex items-center gap-2 text-sm shadow-lg"
            >
              <Send size={16} /> Manda in Cucina
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CustomerMenuPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-white bg-zinc-950 min-h-screen font-bold">Caricamento...</div>}>
      <MenuContent />
    </Suspense>
  );
}