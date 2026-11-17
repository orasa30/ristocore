'use client';

import { Suspense, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
  Star,
  Calendar,
  CheckCircle2,
  Plus,
  Minus,
  Send,
  Bell,
  CreditCard,
  Banknote,
  Globe,
  X,
  Wifi,
  Gift,
  MessageCircle,
  Copy,
} from 'lucide-react';

interface MenuItem {
  id: string;
  name: string;
  name_en?: string;
  description?: string;
  price: number;
  category: string;
  available?: boolean;
}

interface Restaurant {
  id: string;
  name: string;
  slug: string;
  google_review_url?: string;
  wifi_password?: string;
  welcome_promo?: string;
  whatsapp_number?: string;
}

function MenuContent() {
  const params = useParams();
  const slug = decodeURIComponent(params.slug as string);
  const table = decodeURIComponent(params.table as string);

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState('');
  const [lang, setLang] = useState<'it' | 'en'>('it');
  const [loading, setLoading] = useState(true);
  const [orderSent, setOrderSent] = useState(false);

  // Modali
  const [activeModal, setActiveModal] = useState<'service' | 'review' | 'booking' | 'wifi' | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  // Stato Scudo Recensioni
  const [rating, setRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewContact, setReviewContact] = useState('');

  // Stato Prenotazione
  const [bookingName, setBookingName] = useState('');
  const [bookingPhone, setBookingPhone] = useState('');
  const [bookingGuests, setBookingGuests] = useState(2);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('20:30');
  const [bookingNotes, setBookingNotes] = useState('');

  // Stato WiFi & Regalo Benvenuto (CRM)
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custConsent, setCustConsent] = useState(true);
  const [wifiUnlocked, setWifiUnlocked] = useState(false);

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

  const sendOrder = async () => {
    if (!restaurant || totalCount === 0) return;
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
      table_number: table,
      items: orderItems,
      total: totalAmount,
      notes,
      status: 'pending',
    });

    if (!error) {
      setCart({});
      setNotes('');
      setOrderSent(true);
      setTimeout(() => setOrderSent(false), 4000);
    }
  };

  const sendServiceCall = async (callType: 'waiter' | 'bill_card' | 'bill_cash') => {
    if (!restaurant) return;
    await supabase.from('service_calls').insert({
      restaurant_id: restaurant.id,
      table_number: table,
      call_type: callType,
      status: 'pending',
    });
    setActiveModal(null);
    triggerToast(
      lang === 'it'
        ? 'Richiesta inviata al personale di sala!'
        : 'Request sent to our staff!'
    );
  };

  const handleStarClick = (stars: number) => {
    setRating(stars);
    if (stars >= 4) {
      const targetUrl = restaurant?.google_review_url || 'https://www.google.com/maps';
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
      setActiveModal(null);
      setRating(0);
    }
  };

  const submitPrivateReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurant || rating === 0) return;
    await supabase.from('reviews').insert({
      restaurant_id: restaurant.id,
      table_number: table,
      rating,
      comment: reviewComment,
      customer_contact: reviewContact,
    });
    setRating(0);
    setReviewComment('');
    setReviewContact('');
    setActiveModal(null);
    triggerToast(
      lang === 'it'
        ? 'Grazie! Il tuo feedback privato è stato inviato direttamente al titolare.'
        : 'Thank you! Your private feedback was sent directly to the manager.'
    );
  };

  const submitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurant) return;
    await supabase.from('bookings').insert({
      restaurant_id: restaurant.id,
      customer_name: bookingName,
      customer_phone: bookingPhone,
      guests: bookingGuests,
      booking_date: bookingDate,
      booking_time: bookingTime,
      notes: bookingNotes,
      status: 'pending',
    });
    setBookingName('');
    setBookingPhone('');
    setBookingNotes('');
    setActiveModal(null);
    triggerToast(
      lang === 'it'
        ? 'Prenotazione inviata! Riceverai conferma a breve.'
        : 'Booking request sent! We will confirm shortly.'
    );
  };

  const submitWifiCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurant || !custName || !custPhone) return;
    await supabase.from('customers').insert({
      restaurant_id: restaurant.id,
      name: custName,
      phone: custPhone,
      table_number: table,
      marketing_consent: custConsent,
    });
    setWifiUnlocked(true);
  };

  const copyWifi = () => {
    if (!restaurant?.wifi_password) return;
    navigator.clipboard.writeText(restaurant.wifi_password);
    triggerToast(lang === 'it' ? 'Password WiFi copiata!' : 'WiFi password copied!');
  };

  const triggerToast = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(''), 4500);
  };

  if (loading) {
    return <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center">Caricamento menu...</div>;
  }

  if (!restaurant) {
    return <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center">Ristorante non trovato.</div>;
  }

  const categories = Array.from(new Set(items.map((i) => i.category)));
  const cleanRestWa = (restaurant.whatsapp_number || '').replace(/\D/g, '');
  const waWelcomeMsg = encodeURIComponent(
    `Ciao ${restaurant.name}! Sono ${custName} (${table}), ho appena attivato il mio buono benvenuto!`
  );

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 pb-32">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-neutral-900/95 backdrop-blur border-b border-neutral-800 px-4 py-3">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-amber-400">{restaurant.name}</h1>
            <p className="text-xs text-neutral-400">{table}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveModal('wifi')}
              className="flex items-center gap-1.5 text-xs bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 font-semibold px-3 py-1.5 rounded-full border border-amber-500/40"
            >
              <Wifi className="w-3.5 h-3.5" />
              {lang === 'it' ? 'WiFi & Regalo' : 'WiFi & Gift'}
            </button>
            <button
              onClick={() => setLang(lang === 'it' ? 'en' : 'it')}
              className="flex items-center gap-1 text-xs bg-neutral-800 hover:bg-neutral-700 px-2.5 py-1.5 rounded-full border border-neutral-700"
            >
              <Globe className="w-3.5 h-3.5 text-amber-400" />
              {lang === 'it' ? 'EN' : 'IT'}
            </button>
          </div>
        </div>

        {/* Barra Azioni Rapide Tavolo */}
        <div className="max-w-xl mx-auto grid grid-cols-3 gap-2 mt-3">
          <button
            onClick={() => setActiveModal('service')}
            className="flex items-center justify-center gap-1.5 bg-neutral-800 hover:bg-neutral-700 text-xs font-medium py-2 px-2 rounded-lg border border-neutral-700"
          >
            <Bell className="w-3.5 h-3.5 text-amber-400" />
            {lang === 'it' ? 'Cameriere / Conto' : 'Waiter / Bill'}
          </button>
          <button
            onClick={() => setActiveModal('review')}
            className="flex items-center justify-center gap-1.5 bg-neutral-800 hover:bg-neutral-700 text-xs font-medium py-2 px-2 rounded-lg border border-neutral-700"
          >
            <Star className="w-3.5 h-3.5 text-yellow-400" />
            {lang === 'it' ? 'Recensione' : 'Review'}
          </button>
          <button
            onClick={() => setActiveModal('booking')}
            className="flex items-center justify-center gap-1.5 bg-neutral-800 hover:bg-neutral-700 text-xs font-medium py-2 px-2 rounded-lg border border-neutral-700"
          >
            <Calendar className="w-3.5 h-3.5 text-emerald-400" />
            {lang === 'it' ? 'Prenota' : 'Book Table'}
          </button>
        </div>
      </header>

      {/* Notifiche Toast */}
      {(orderSent || feedbackMsg) && (
        <div className="fixed top-28 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 text-sm font-medium">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{feedbackMsg || (lang === 'it' ? 'Ordine inviato in cucina!' : 'Order sent to kitchen!')}</span>
        </div>
      )}

      {/* Lista Piatti */}
      <main className="max-w-xl mx-auto px-4 pt-5 space-y-6">
        {categories.map((cat) => (
          <section key={cat}>
            <h2 className="text-sm uppercase tracking-wider text-amber-400 font-semibold mb-3">{cat}</h2>
            <div className="space-y-3">
              {items
                .filter((i) => i.category === cat)
                .map((item) => {
                  const qty = cart[item.id] || 0;
                  const displayName = lang === 'en' && item.name_en ? item.name_en : item.name;
                  return (
                    <div
                      key={item.id}
                      className="bg-neutral-900 border border-neutral-800 rounded-xl p-3.5 flex items-center justify-between gap-3"
                    >
                      <div className="flex-1">
                        <h3 className="font-semibold text-neutral-100">{displayName}</h3>
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
                              onClick={() => removeItem(item.id)}
                              className="w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center text-neutral-200"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="w-5 text-center font-bold text-sm">{qty}</span>
                          </>
                        )}
                        <button
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
      </main>

      {/* Barra Carrello Fissa */}
      {totalCount > 0 && (
        <div className="fixed bottom-0 inset-x-0 bg-neutral-900 border-t border-neutral-800 p-4 z-30">
          <div className="max-w-xl mx-auto space-y-2.5">
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={lang === 'it' ? 'Note per la cucina (es. senza cipolla, ben cotto)...' : 'Kitchen notes...'}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white placeholder-neutral-400"
            />
            <button
              onClick={sendOrder}
              className="w-full bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold py-3 rounded-xl flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              {lang === 'it'
                ? `Invia Ordine (${totalCount}) • € ${totalAmount.toFixed(2)}`
                : `Send Order (${totalCount}) • € ${totalAmount.toFixed(2)}`}
            </button>
          </div>
        </div>
      )}

      {/* MODALE 1: Chiama Cameriere / Chiedi Conto */}
      {activeModal === 'service' && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg">
                {lang === 'it' ? 'Servizio al Tavolo' : 'Table Service'}
              </h3>
              <button onClick={() => setActiveModal(null)}><X className="w-5 h-5 text-neutral-400" /></button>
            </div>
            <div className="space-y-2.5">
              <button
                onClick={() => sendServiceCall('waiter')}
                className="w-full flex items-center gap-3 bg-neutral-800 hover:bg-neutral-700 p-3.5 rounded-xl font-medium"
              >
                <Bell className="w-5 h-5 text-amber-400" />
                {lang === 'it' ? 'Chiama Cameriere al Tavolo' : 'Call Waiter'}
              </button>
              <button
                onClick={() => sendServiceCall('bill_card')}
                className="w-full flex items-center gap-3 bg-neutral-800 hover:bg-neutral-700 p-3.5 rounded-xl font-medium"
              >
                <CreditCard className="w-5 h-5 text-sky-400" />
                {lang === 'it' ? 'Chiedi il Conto (Carta / POS)' : 'Ask for Bill (Card)'}
              </button>
              <button
                onClick={() => sendServiceCall('bill_cash')}
                className="w-full flex items-center gap-3 bg-neutral-800 hover:bg-neutral-700 p-3.5 rounded-xl font-medium"
              >
                <Banknote className="w-5 h-5 text-emerald-400" />
                {lang === 'it' ? 'Chiedi il Conto (Contanti)' : 'Ask for Bill (Cash)'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODALE 2: Scudo Recensioni Google */}
      {activeModal === 'review' && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg">
                {lang === 'it' ? 'Com’è stata la tua esperienza?' : 'How was your experience?'}
              </h3>
              <button onClick={() => { setActiveModal(null); setRating(0); }}><X className="w-5 h-5 text-neutral-400" /></button>
            </div>

            <div className="flex justify-center gap-2 py-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => handleStarClick(star)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-9 h-9 ${
                      star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-neutral-600'
                    }`}
                  />
                </button>
              ))}
            </div>

            {rating > 0 && rating <= 3 && (
              <form onSubmit={submitPrivateReview} className="space-y-3 pt-2 border-t border-neutral-800">
                <p className="text-xs text-neutral-300">
                  {lang === 'it'
                    ? 'Ci dispiace non aver raggiunto il massimo. Raccontaci cosa possiamo migliorare (messaggio privato per il titolare):'
                    : 'Tell us privately how we can improve:'}
                </p>
                <textarea
                  required
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  rows={3}
                  placeholder={lang === 'it' ? 'Scrivi qui il tuo feedback...' : 'Write your feedback...'}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-2.5 text-sm text-white"
                />
                <input
                  type="text"
                  value={reviewContact}
                  onChange={(e) => setReviewContact(e.target.value)}
                  placeholder={lang === 'it' ? 'Telefono o email (opzionale, per ricontattarti)' : 'Phone/email (optional)'}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-2.5 text-sm text-white"
                />
                <button
                  type="submit"
                  className="w-full bg-amber-500 text-neutral-950 font-bold py-2.5 rounded-xl"
                >
                  {lang === 'it' ? 'Invia al Titolare' : 'Send to Manager'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODALE 3: Prenotazione Tavolo */}
      {activeModal === 'booking' && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center p-4">
          <form
            onSubmit={submitBooking}
            className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md p-5 space-y-3"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg">
                {lang === 'it' ? 'Prenota un Tavolo' : 'Book a Table'}
              </h3>
              <button type="button" onClick={() => setActiveModal(null)}><X className="w-5 h-5 text-neutral-400" /></button>
            </div>
            <input
              required
              type="text"
              value={bookingName}
              onChange={(e) => setBookingName(e.target.value)}
              placeholder={lang === 'it' ? 'Nome e Cognome' : 'Full Name'}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-2.5 text-sm"
            />
            <input
              required
              type="tel"
              value={bookingPhone}
              onChange={(e) => setBookingPhone(e.target.value)}
              placeholder={lang === 'it' ? 'Numero di Telefono' : 'Phone Number'}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-2.5 text-sm"
            />
            <div className="grid grid-cols-3 gap-2">
              <input
                required
                type="date"
                value={bookingDate}
                onChange={(e) => setBookingDate(e.target.value)}
                className="bg-neutral-800 border border-neutral-700 rounded-lg p-2 text-xs"
              />
              <input
                required
                type="time"
                value={bookingTime}
                onChange={(e) => setBookingTime(e.target.value)}
                className="bg-neutral-800 border border-neutral-700 rounded-lg p-2 text-xs"
              />
              <input
                required
                type="number"
                min={1}
                max={30}
                value={bookingGuests}
                onChange={(e) => setBookingGuests(Number(e.target.value))}
                placeholder="Persone"
                className="bg-neutral-800 border border-neutral-700 rounded-lg p-2 text-xs"
              />
            </div>
            <input
              type="text"
              value={bookingNotes}
              onChange={(e) => setBookingNotes(e.target.value)}
              placeholder={lang === 'it' ? 'Note (es. seggiolone, allergie)' : 'Notes'}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-2.5 text-sm"
            />
            <button
              type="submit"
              className="w-full bg-emerald-500 text-neutral-950 font-bold py-2.5 rounded-xl"
            >
              {lang === 'it' ? 'Conferma Richiesta' : 'Request Booking'}
            </button>
          </form>
        </div>
      )}

      {/* MODALE 4: WiFi Gratis & Regalo Benvenuto (CRM WhatsApp) */}
      {activeModal === 'wifi' && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg flex items-center gap-2 text-amber-400">
                <Gift className="w-5 h-5" />
                {lang === 'it' ? 'WiFi & Regalo Benvenuto' : 'WiFi & Welcome Gift'}
              </h3>
              <button onClick={() => setActiveModal(null)}><X className="w-5 h-5 text-neutral-400" /></button>
            </div>

            {!wifiUnlocked ? (
              <form onSubmit={submitWifiCustomer} className="space-y-3">
                <p className="text-xs text-neutral-300">
                  {lang === 'it'
                    ? 'Inserisci il tuo nome e WhatsApp per sbloccare subito la password del WiFi e il buono benvenuto del locale:'
                    : 'Enter your name and WhatsApp to unlock free WiFi and your welcome gift:'}
                </p>
                <input
                  required
                  type="text"
                  value={custName}
                  onChange={(e) => setCustName(e.target.value)}
                  placeholder={lang === 'it' ? 'Il tuo Nome' : 'Your Name'}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-2.5 text-sm"
                />
                <input
                  required
                  type="tel"
                  value={custPhone}
                  onChange={(e) => setCustPhone(e.target.value)}
                  placeholder={lang === 'it' ? 'Numero WhatsApp (es. 3401234567)' : 'WhatsApp Number'}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-2.5 text-sm"
                />
                <label className="flex items-start gap-2 text-[11px] text-neutral-400 cursor-pointer">
                  <input
                    required
                    type="checkbox"
                    checked={custConsent}
                    onChange={(e) => setCustConsent(e.target.checked)}
                    className="mt-0.5 accent-amber-500"
                  />
                  <span>
                    {lang === 'it'
                      ? 'Acconsento a ricevere promozioni e novità esclusivi su WhatsApp dal ristorante (GDPR).'
                      : 'I agree to receive exclusive WhatsApp promotions from the restaurant.'}
                  </span>
                </label>
                <button
                  type="submit"
                  className="w-full bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold py-2.5 rounded-xl"
                >
                  {lang === 'it' ? 'Sblocca WiFi & Buono' : 'Unlock WiFi & Gift'}
                </button>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-3.5 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] text-neutral-400 uppercase">Password WiFi Locale</p>
                    <p className="text-lg font-extrabold text-white tracking-wide">
                      {restaurant.wifi_password || 'Ospiti2026'}
                    </p>
                  </div>
                  <button
                    onClick={copyWifi}
                    className="bg-neutral-700 hover:bg-neutral-600 px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5"
                  >
                    <Copy className="w-3.5 h-3.5" /> Copia
                  </button>
                </div>

                <div className="bg-emerald-950/50 border border-emerald-500/40 rounded-xl p-3.5 space-y-1">
                  <p className="text-xs font-bold text-emerald-400">🎁 Il tuo Buono Benvenuto:</p>
                  <p className="text-sm text-neutral-100">
                    {restaurant.welcome_promo || 'Mostra questa schermata al cameriere per un caffè o amaro offerto!'}
                  </p>
                </div>

                {cleanRestWa && (
                  <a
                    href={`https://wa.me/${cleanRestWa}?text=${waWelcomeMsg}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm"
                  >
                    <MessageCircle className="w-4 h-4" />
                    {lang === 'it' ? 'Salva Promo su WhatsApp' : 'Save Promo on WhatsApp'}
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function MenuPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-neutral-950 text-white p-6">Caricamento...</div>}>
      <MenuContent />
    </Suspense>
  );
}