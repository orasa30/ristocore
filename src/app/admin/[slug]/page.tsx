'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
  Lock,
  UtensilsCrossed,
  Calendar,
  ShieldAlert,
  QrCode,
  Plus,
  Trash2,
  Check,
  X,
  TrendingUp,
  Settings,
  ExternalLink,
} from 'lucide-react';

interface Restaurant {
  id: string;
  name: string;
  slug: string;
  admin_pin: string;
  google_review_url: string;
}

interface MenuItem {
  id: string;
  name: string;
  name_en?: string;
  description?: string;
  price: number;
  category: string;
  available: boolean;
}

interface Booking {
  id: string;
  customer_name: string;
  customer_phone: string;
  guests: number;
  booking_date: string;
  booking_time: string;
  notes?: string;
  status: string;
}

interface Review {
  id: string;
  table_number?: string;
  rating: number;
  comment: string;
  customer_contact?: string;
  created_at: string;
}

export default function AdminDashboard() {
  const params = useParams();
  const slug = decodeURIComponent(params.slug as string);

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [pinError, setPinError] = useState(false);

  const [activeTab, setActiveTab] = useState<'menu' | 'bookings' | 'reviews' | 'qr'>('menu');
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalOrdersCount, setTotalOrdersCount] = useState(0);

  // Form nuovo piatto
  const [newName, setNewName] = useState('');
  const [newNameEn, setNewNameEn] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newCategory, setNewCategory] = useState('Primi Piatti');

  // Impostazioni & QR
  const [googleUrl, setGoogleUrl] = useState('');
  const [newPin, setNewPin] = useState('');
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [tableCount, setTableCount] = useState(10);

  useEffect(() => {
    async function fetchRestaurant() {
      const { data } = await supabase
        .from('restaurants')
        .select('*')
        .eq('slug', slug)
        .single();

      if (data) {
        setRestaurant(data);
        setGoogleUrl(data.google_review_url || '');
        setNewPin(data.admin_pin || '1234');
      }
    }
    fetchRestaurant();
  }, [slug]);

  const loadDashboardData = async (restId: string) => {
    const [{ data: menu }, { data: bks }, { data: revs }, { data: ords }] = await Promise.all([
      supabase.from('menu_items').select('*').eq('restaurant_id', restId).order('category'),
      supabase.from('bookings').select('*').eq('restaurant_id', restId).order('booking_date', { ascending: true }),
      supabase.from('reviews').select('*').eq('restaurant_id', restId).order('created_at', { ascending: false }),
      supabase.from('orders').select('total').eq('restaurant_id', restId),
    ]);

    if (menu) setMenuItems(menu);
    if (bks) setBookings(bks);
    if (revs) setReviews(revs);
    if (ords) {
      setTotalOrdersCount(ords.length);
      setTotalRevenue(ords.reduce((sum, o) => sum + Number(o.total || 0), 0));
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurant) return;
    if (pinInput === (restaurant.admin_pin || '1234')) {
      setAuthenticated(true);
      setPinError(false);
      loadDashboardData(restaurant.id);
    } else {
      setPinError(true);
    }
  };

  const handleAddDish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurant || !newName || !newPrice) return;

    const { data, error } = await supabase
      .from('menu_items')
      .insert({
        restaurant_id: restaurant.id,
        name: newName,
        name_en: newNameEn || null,
        description: newDesc || null,
        price: parseFloat(newPrice.replace(',', '.')),
        category: newCategory,
        available: true,
      })
      .select()
      .single();

    if (!error && data) {
      setMenuItems((prev) => [...prev, data]);
      setNewName('');
      setNewNameEn('');
      setNewDesc('');
      setNewPrice('');
    }
  };

  const toggleAvailability = async (item: MenuItem) => {
    const nextStatus = !item.available;
    await supabase.from('menu_items').update({ available: nextStatus }).eq('id', item.id);
    setMenuItems((prev) => prev.map((m) => (m.id === item.id ? { ...m, available: nextStatus } : m)));
  };

  const deleteDish = async (id: string) => {
    await supabase.from('menu_items').delete().eq('id', id);
    setMenuItems((prev) => prev.filter((m) => m.id !== id));
  };

  const updateBookingStatus = async (id: string, status: 'confirmed' | 'cancelled') => {
    await supabase.from('bookings').update({ status }).eq('id', id);
    setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status } : b)));
  };

  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurant) return;
    await supabase
      .from('restaurants')
      .update({ google_review_url: googleUrl, admin_pin: newPin })
      .eq('id', restaurant.id);
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 3000);
  };

  if (!restaurant) {
    return <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center">Caricamento pannello...</div>;
  }

  // Schermata Login PIN
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center p-4">
        <form
          onSubmit={handleLogin}
          className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 w-full max-w-sm space-y-4 text-center"
        >
          <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold">{restaurant.name}</h1>
            <p className="text-xs text-neutral-400 mt-1">Area Riservata Titolare • Inserisci PIN</p>
          </div>
          <input
            type="password"
            inputMode="numeric"
            value={pinInput}
            onChange={(e) => setPinInput(e.target.value)}
            placeholder="PIN (es. 1234)"
            className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 text-center text-lg tracking-widest"
          />
          {pinError && <p className="text-xs text-red-400">PIN errato. Riprova.</p>}
          <button
            type="submit"
            className="w-full bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold py-3 rounded-xl"
          >
            Accedi alla Dashboard
          </button>
        </form>
      </div>
    );
  }

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://ristocore-three.vercel.app';

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 pb-16">
      {/* Header + KPI */}
      <header className="bg-neutral-900 border-b border-neutral-800 px-4 py-4">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-amber-400">Admin • {restaurant.name}</h1>
            <div className="flex gap-3 text-xs text-neutral-400 mt-1">
              <a
                href={`/kds/${slug}`}
                target="_blank"
                rel="noreferrer"
                className="hover:text-white flex items-center gap-1"
              >
                Apri KDS Cucina <ExternalLink className="w-3 h-3" />
              </a>
              <a
                href={`/menu/${slug}/Tavolo%201`}
                target="_blank"
                rel="noreferrer"
                className="hover:text-white flex items-center gap-1"
              >
                Anteprima Menu <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="bg-neutral-800/80 border border-neutral-700 px-3.5 py-2 rounded-xl">
              <p className="text-[11px] text-neutral-400 flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-emerald-400" /> Ordini Totali
              </p>
              <p className="font-bold text-sm">{totalOrdersCount} • € {totalRevenue.toFixed(2)}</p>
            </div>
            <div className="bg-neutral-800/80 border border-neutral-700 px-3.5 py-2 rounded-xl">
              <p className="text-[11px] text-neutral-400 flex items-center gap-1">
                <ShieldAlert className="w-3 h-3 text-amber-400" /> Reclami Bloccati
              </p>
              <p className="font-bold text-sm">{reviews.length}</p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="max-w-5xl mx-auto grid grid-cols-4 gap-2 mt-4">
          <button
            onClick={() => setActiveTab('menu')}
            className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold ${
              activeTab === 'menu' ? 'bg-amber-500 text-neutral-950' : 'bg-neutral-800 text-neutral-300'
            }`}
          >
            <UtensilsCrossed className="w-4 h-4" /> Menu ({menuItems.length})
          </button>
          <button
            onClick={() => setActiveTab('bookings')}
            className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold ${
              activeTab === 'bookings' ? 'bg-amber-500 text-neutral-950' : 'bg-neutral-800 text-neutral-300'
            }`}
          >
            <Calendar className="w-4 h-4" /> Prenotazioni ({bookings.length})
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold ${
              activeTab === 'reviews' ? 'bg-amber-500 text-neutral-950' : 'bg-neutral-800 text-neutral-300'
            }`}
          >
            <ShieldAlert className="w-4 h-4" /> Scudo & Config
          </button>
          <button
            onClick={() => setActiveTab('qr')}
            className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold ${
              activeTab === 'qr' ? 'bg-amber-500 text-neutral-950' : 'bg-neutral-800 text-neutral-300'
            }`}
          >
            <QrCode className="w-4 h-4" /> QR Tavoli
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 pt-6">
        {/* TAB 1: GESTIONE MENU */}
        {activeTab === 'menu' && (
          <div className="space-y-6">
            <form
              onSubmit={handleAddDish}
              className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 space-y-3"
            >
              <h2 className="font-bold text-sm text-amber-400 flex items-center gap-1.5">
                <Plus className="w-4 h-4" /> Aggiungi Nuovo Piatto
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                <input
                  required
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Nome piatto (IT)*"
                  className="bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm"
                />
                <input
                  type="text"
                  value={newNameEn}
                  onChange={(e) => setNewNameEn(e.target.value)}
                  placeholder="Nome inglese (opzionale)"
                  className="bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm"
                />
                <input
                  required
                  type="text"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  placeholder="Prezzo € (es. 12.50)*"
                  className="bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm"
                />
                <input
                  required
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="Categoria (es. Primi, Pizze)"
                  className="bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-2.5">
                <input
                  type="text"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Descrizione / Ingredienti (opzionale)"
                  className="flex-1 bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm"
                />
                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold px-5 py-2 rounded-lg text-sm"
                >
                  Aggiungi al Menu
                </button>
              </div>
            </form>

            <div className="space-y-2.5">
              {menuItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-neutral-900 border border-neutral-800 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3"
                >
                  <div>
                    <span className="text-[11px] uppercase text-amber-400 font-semibold">{item.category}</span>
                    <h3 className="font-bold text-sm">
                      {item.name} {item.name_en && <span className="text-neutral-400 font-normal">/ {item.name_en}</span>}
                    </h3>
                    <p className="text-xs text-neutral-400">€ {Number(item.price).toFixed(2)}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleAvailability(item)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                        item.available
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-red-500/20 text-red-300 border border-red-500/40'
                      }`}
                    >
                      {item.available ? 'Disponibile' : 'Esaurito'}
                    </button>
                    <button
                      onClick={() => deleteDish(item.id)}
                      className="p-2 text-neutral-400 hover:text-red-400 bg-neutral-800 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: PRENOTAZIONI */}
        {activeTab === 'bookings' && (
          <div className="space-y-3">
            {bookings.length === 0 ? (
              <p className="text-center text-neutral-500 py-12">Nessuna prenotazione ricevuta.</p>
            ) : (
              bookings.map((b) => (
                <div
                  key={b.id}
                  className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{b.customer_name}</span>
                      <span className="text-xs bg-neutral-800 px-2 py-0.5 rounded text-amber-400">
                        {b.guests} persone
                      </span>
                    </div>
                    <p className="text-xs text-neutral-300 mt-1">
                      📅 {b.booking_date} alle <strong>{b.booking_time}</strong> • 📞 {b.customer_phone}
                    </p>
                    {b.notes && <p className="text-xs text-neutral-400 mt-1">Note: {b.notes}</p>}
                  </div>

                  <div className="flex items-center gap-2">
                    {b.status === 'pending' ? (
                      <>
                        <button
                          onClick={() => updateBookingStatus(b.id, 'confirmed')}
                          className="flex items-center gap-1 bg-emerald-600 text-white text-xs font-bold px-3 py-2 rounded-lg"
                        >
                          <Check className="w-3.5 h-3.5" /> Conferma
                        </button>
                        <button
                          onClick={() => updateBookingStatus(b.id, 'cancelled')}
                          className="flex items-center gap-1 bg-red-600/80 text-white text-xs font-bold px-3 py-2 rounded-lg"
                        >
                          <X className="w-3.5 h-3.5" /> Rifiuta
                        </button>
                      </>
                    ) : (
                      <span
                        className={`text-xs font-bold px-3 py-1 rounded-full ${
                          b.status === 'confirmed' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
                        }`}
                      >
                        {b.status === 'confirmed' ? 'Confermata' : 'Annullata'}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 3: SCUDO RECENSIONI & IMPOSTAZIONI */}
        {activeTab === 'reviews' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h2 className="font-bold text-amber-400 text-sm">Feedback Negativi Intercettati (1-3 Stelle)</h2>
              {reviews.length === 0 ? (
                <p className="text-xs text-neutral-500 bg-neutral-900 p-4 rounded-xl border border-neutral-800">
                  Nessun feedback negativo registrato.
                </p>
              ) : (
                reviews.map((r) => (
                  <div key={r.id} className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-bold text-red-400">{'★'.repeat(r.rating)} ({r.rating}/5)</span>
                      <span className="text-neutral-400">{r.table_number}</span>
                    </div>
                    <p className="text-sm text-neutral-200">{r.comment}</p>
                    {r.customer_contact && (
                      <p className="text-xs text-amber-400">Contatto cliente: {r.customer_contact}</p>
                    )}
                  </div>
                ))
              )}
            </div>

            <form
              onSubmit={saveSettings}
              className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 space-y-4 h-fit"
            >
              <h2 className="font-bold text-sm text-amber-400 flex items-center gap-1.5">
                <Settings className="w-4 h-4" /> Configurazione Scudo Google & PIN
              </h2>
              <div>
                <label className="block text-xs text-neutral-400 mb-1">
                  Link Diretto Recensione Google Maps (per voti 4-5 stelle)
                </label>
                <input
                  type="url"
                  required
                  value={googleUrl}
                  onChange={(e) => setGoogleUrl(e.target.value)}
                  placeholder="https://g.page/r/..."
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-400 mb-1">PIN Accesso Dashboard Titolare</label>
                <input
                  type="text"
                  required
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold py-2.5 rounded-xl text-sm"
              >
                {settingsSaved ? 'Impostazioni Salvate!' : 'Salva Configurazione'}
              </button>
            </form>
          </div>
        )}

        {/* TAB 4: GENERATORE QR TAVOLI */}
        {activeTab === 'qr' && (
          <div className="space-y-5">
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="font-bold text-sm text-amber-400">Generatore QR Code Tavoli</h2>
                <p className="text-xs text-neutral-400">
                  Ogni QR apre direttamente il menu collegato al numero di tavolo.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-neutral-300">Numero Tavoli:</label>
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={tableCount}
                  onChange={(e) => setTableCount(Number(e.target.value))}
                  className="w-20 bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-1.5 text-sm text-center"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {Array.from({ length: tableCount }, (_, i) => i + 1).map((num) => {
                const tableLabel = `Tavolo ${num}`;
                const targetUrl = `${baseUrl}/menu/${slug}/${encodeURIComponent(tableLabel)}`;
                const qrImg = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(targetUrl)}`;

                return (
                  <div
                    key={num}
                    className="bg-white text-neutral-950 rounded-2xl p-3.5 flex flex-col items-center text-center shadow"
                  >
                    <p className="font-extrabold text-sm mb-2">{tableLabel}</p>
                    <img src={qrImg} alt={tableLabel} className="w-32 h-32 mb-2" />
                    <p className="text-[10px] text-neutral-500 break-all">{restaurant.name}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}