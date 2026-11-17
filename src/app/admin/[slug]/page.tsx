'use client';

import { Suspense, useEffect, useState } from 'react';
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
  Users,
  MessageCircle,
  Download,
  FileSpreadsheet,
} from 'lucide-react';

interface Restaurant {
  id: string;
  name: string;
  slug: string;
  admin_pin: string;
  google_review_url: string;
  table_count?: number;
  wifi_password?: string;
  welcome_promo?: string;
  whatsapp_number?: string;
  cover_charge?: number;
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

interface Customer {
  id: string;
  name: string;
  phone: string;
  table_number?: string;
  marketing_consent: boolean;
  created_at: string;
}

interface OrderRecord {
  id: string;
  total: number;
  created_at: string;
}

function AdminContent() {
  const params = useParams();
  const slug = decodeURIComponent(params.slug as string);

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [pinError, setPinError] = useState(false);

  const [activeTab, setActiveTab] = useState<'menu' | 'bookings' | 'customers' | 'reviews' | 'qr'>('menu');
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [ordersList, setOrdersList] = useState<OrderRecord[]>([]);
  const [revenueFilter, setRevenueFilter] = useState<'today' | 'week' | 'all'>('today');

  // Form nuovo piatto & Importazione massiva
  const [newName, setNewName] = useState('');
  const [newNameEn, setNewNameEn] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newCategory, setNewCategory] = useState('Primi Piatti');
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [bulkImporting, setBulkImporting] = useState(false);

  // Impostazioni & QR & Promo WhatsApp
  const [googleUrl, setGoogleUrl] = useState('');
  const [newPin, setNewPin] = useState('');
  const [wifiPassword, setWifiPassword] = useState('');
  const [welcomePromo, setWelcomePromo] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [coverCharge, setCoverCharge] = useState('0');
  const [promoBroadcastText, setPromoBroadcastText] = useState(
    'Ciao! Questo weekend ti aspettiamo con una sorpresa speciale riservata ai nostri clienti!'
  );
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
        setTableCount(data.table_count || 10);
        setWifiPassword(data.wifi_password || 'Ospiti2026');
        setWelcomePromo(data.welcome_promo || 'Mostra questa schermata al cameriere per un caffè o amaro offerto!');
        setWhatsappNumber(data.whatsapp_number || '');
        setCoverCharge(String(data.cover_charge || 0));
      }
    }
    fetchRestaurant();
  }, [slug]);

  const loadDashboardData = async (restId: string) => {
    const [{ data: menu }, { data: bks }, { data: revs }, { data: ords }, { data: custs }] = await Promise.all([
      supabase.from('menu_items').select('*').eq('restaurant_id', restId).order('category'),
      supabase.from('bookings').select('*').eq('restaurant_id', restId).order('booking_date', { ascending: true }),
      supabase.from('reviews').select('*').eq('restaurant_id', restId).order('created_at', { ascending: false }),
      supabase.from('orders').select('id, total, created_at').eq('restaurant_id', restId),
      supabase.from('customers').select('*').eq('restaurant_id', restId).order('created_at', { ascending: false }),
    ]);

    if (menu) setMenuItems(menu);
    if (bks) setBookings(bks);
    if (revs) setReviews(revs);
    if (custs) setCustomers(custs);
    if (ords) setOrdersList(ords);
  };

  useEffect(() => {
    if (!authenticated || !restaurant) return;

    const channel = supabase
      .channel(`admin-live-${restaurant.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `restaurant_id=eq.${restaurant.id}` },
        () => loadDashboardData(restaurant.id)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings', filter: `restaurant_id=eq.${restaurant.id}` },
        () => loadDashboardData(restaurant.id)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reviews', filter: `restaurant_id=eq.${restaurant.id}` },
        () => loadDashboardData(restaurant.id)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'customers', filter: `restaurant_id=eq.${restaurant.id}` },
        () => loadDashboardData(restaurant.id)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'menu_items', filter: `restaurant_id=eq.${restaurant.id}` },
        () => loadDashboardData(restaurant.id)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [authenticated, restaurant]);

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

  const handleBulkImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurant || !bulkText.trim()) return;
    setBulkImporting(true);

    const lines = bulkText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    const payload = lines
      .map((line) => {
        const parts = line.split('|').map((p) => p.trim());
        if (parts.length < 3) return null;
        const parsedPrice = parseFloat(parts[2].replace('€', '').replace(',', '.').trim());
        if (isNaN(parsedPrice)) return null;
        return {
          restaurant_id: restaurant.id,
          category: parts[0] || 'Menu',
          name: parts[1],
          price: parsedPrice,
          description: parts[3] || null,
          available: true,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    if (payload.length > 0) {
      const { data } = await supabase.from('menu_items').insert(payload).select();
      if (data) {
        setMenuItems((prev) => [...prev, ...data]);
        setBulkText('');
        setShowBulkImport(false);
      }
    }
    setBulkImporting(false);
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
    const parsedCover = parseFloat(coverCharge.replace(',', '.')) || 0;

    await supabase
      .from('restaurants')
      .update({
        google_review_url: googleUrl,
        admin_pin: newPin,
        wifi_password: wifiPassword,
        welcome_promo: welcomePromo,
        whatsapp_number: whatsappNumber,
        cover_charge: parsedCover,
      })
      .eq('id', restaurant.id);

    setRestaurant({
      ...restaurant,
      google_review_url: googleUrl,
      admin_pin: newPin,
      wifi_password: wifiPassword,
      welcome_promo: welcomePromo,
      whatsapp_number: whatsappNumber,
      cover_charge: parsedCover,
    });
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 3000);
  };

  const updateTableCount = async (count: number) => {
    const validCount = Math.max(1, Math.min(100, count || 1));
    setTableCount(validCount);
    if (!restaurant) return;
    await supabase
      .from('restaurants')
      .update({ table_count: validCount })
      .eq('id', restaurant.id);
  };

  const formatWaPhone = (raw: string) => {
    const digits = raw.replace(/\D/g, '');
    return digits.startsWith('39') ? digits : `39${digits}`;
  };

  const exportCustomersCsv = () => {
    const header = 'Nome,Telefono,Tavolo,Consenso,Data\n';
    const rows = customers
      .map((c) => `"${c.name}","${c.phone}","${c.table_number || ''}","${c.marketing_consent ? 'SI' : 'NO'}","${new Date(c.created_at).toLocaleDateString('it-IT')}"`)
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clienti-${slug}.csv`;
    a.click();
  };

  const handleResetDemo = async () => {
    if (slug !== 'trattoria-demo') return;
    await supabase.rpc('reset_demo_restaurant');
    if (restaurant) {
      await loadDashboardData(restaurant.id);
      setTableCount(10);
      setWifiPassword('Ospiti2026');
      setWelcomePromo('Mostra questa schermata al cameriere per un caffè o amaro offerto!');
      setCoverCharge('2');
      setNewPin('1234');
    }
  };

  // Calcolo Chiusura Cassa filtrata
  const now = new Date();
  const filteredOrders = ordersList.filter((o) => {
    const d = new Date(o.created_at);
    if (revenueFilter === 'today') {
      return d.toDateString() === now.toDateString();
    }
    if (revenueFilter === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(now.getDate() - 7);
      return d >= weekAgo;
    }
    return true;
  });
  const filteredRevenue = filteredOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);
  const avgOrderValue = filteredOrders.length > 0 ? filteredRevenue / filteredOrders.length : 0;

  if (!restaurant) {
    return <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center">Caricamento pannello...</div>;
  }

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
            <div className="flex flex-wrap gap-3 text-xs text-neutral-400 mt-1">
              <a
                href={`/kds/${slug}`}
                target="_blank"
                rel="noreferrer"
                className="hover:text-white flex items-center gap-1"
              >
                KDS Cucina <ExternalLink className="w-3 h-3" />
              </a>
              <a
                href={`/menu/${slug}/Tavolo%201`}
                target="_blank"
                rel="noreferrer"
                className="hover:text-white flex items-center gap-1"
              >
                Menu Tavolo <ExternalLink className="w-3 h-3" />
              </a>
              <a
                href={`/asporto/${slug}`}
                target="_blank"
                rel="noreferrer"
                className="text-purple-400 hover:text-purple-300 flex items-center gap-1 font-semibold"
              >
                Link Asporto <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5">
            {slug === 'trattoria-demo' && (
              <button
                onClick={handleResetDemo}
                className="bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-300 px-3 py-2 rounded-xl text-xs font-bold"
              >
                ↻ Azzera Demo
              </button>
            )}
            <div className="bg-neutral-800/80 border border-neutral-700 px-3 py-2 rounded-xl">
              <div className="flex items-center justify-between gap-2 text-[11px] text-neutral-400">
                <span className="flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-emerald-400" /> Incassi
                </span>
                <select
                  value={revenueFilter}
                  onChange={(e) => setRevenueFilter(e.target.value as 'today' | 'week' | 'all')}
                  className="bg-neutral-900 text-amber-400 font-bold rounded px-1 py-0.5 text-[10px]"
                >
                  <option value="today">Oggi</option>
                  <option value="week">7 Giorni</option>
                  <option value="all">Sempre</option>
                </select>
              </div>
              <p className="font-bold text-sm mt-0.5">
                {filteredOrders.length} ord. • € {filteredRevenue.toFixed(2)}{' '}
                <span className="text-[11px] font-normal text-neutral-400">(media € {avgOrderValue.toFixed(2)})</span>
              </p>
            </div>
            <div className="bg-neutral-800/80 border border-neutral-700 px-3 py-2 rounded-xl">
              <p className="text-[11px] text-neutral-400 flex items-center gap-1">
                <Users className="w-3 h-3 text-sky-400" /> Contatti WA
              </p>
              <p className="font-bold text-sm mt-0.5">{customers.length}</p>
            </div>
            <div className="bg-neutral-800/80 border border-neutral-700 px-3 py-2 rounded-xl">
              <p className="text-[11px] text-neutral-400 flex items-center gap-1">
                <ShieldAlert className="w-3 h-3 text-amber-400" /> Reclami Bloccati
              </p>
              <p className="font-bold text-sm mt-0.5">{reviews.length}</p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-5 gap-2 mt-4">
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
            onClick={() => setActiveTab('customers')}
            className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold ${
              activeTab === 'customers' ? 'bg-amber-500 text-neutral-950' : 'bg-neutral-800 text-neutral-300'
            }`}
          >
            <Users className="w-4 h-4" /> Clienti &amp; WA ({customers.length})
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold ${
              activeTab === 'reviews' ? 'bg-amber-500 text-neutral-950' : 'bg-neutral-800 text-neutral-300'
            }`}
          >
            <ShieldAlert className="w-4 h-4" /> Scudo &amp; Config
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
        {/* TAB 1: GESTIONE MENU + IMPORTAZIONE RAPIDA */}
        {activeTab === 'menu' && (
          <div className="space-y-6">
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-bold text-sm text-amber-400 flex items-center gap-1.5">
                  <Plus className="w-4 h-4" /> Aggiungi Piatti al Menu
                </h2>
                <button
                  type="button"
                  onClick={() => setShowBulkImport(!showBulkImport)}
                  className="flex items-center gap-1.5 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-xs font-bold px-3 py-1.5 rounded-lg text-amber-300"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  {showBulkImport ? 'Chiudi Importazione Rapida' : 'Importa Lista Veloce (Copia/Incolla)'}
                </button>
              </div>

              {showBulkImport ? (
                <form onSubmit={handleBulkImport} className="space-y-2.5 pt-2 border-t border-neutral-800">
                  <p className="text-xs text-neutral-400">
                    Inserisci un piatto per riga nel formato:{' '}
                    <code className="text-amber-300">Categoria | Nome Piatto | Prezzo | Descrizione (opzionale)</code>
                  </p>
                  <textarea
                    required
                    rows={5}
                    value={bulkText}
                    onChange={(e) => setBulkText(e.target.value)}
                    placeholder={`Pizze | Margherita | 6.50 | Pomodoro, mozzarella, basilico\nPizze | Diavola | 8.00 | Pomodoro, mozzarella, salame piccante\nBibite | Acqua Naturale 75cl | 2.50`}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3 text-xs font-mono text-white"
                  />
                  <button
                    type="submit"
                    disabled={bulkImporting}
                    className="bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold px-5 py-2 rounded-lg text-xs"
                  >
                    {bulkImporting ? 'Importazione in corso...' : 'Importa Tutti i Piatti Ora'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleAddDish} className="space-y-3">
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
              )}
            </div>

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

        {/* TAB 2: PRENOTAZIONI CON CONFERMA WHATSAPP */}
        {activeTab === 'bookings' && (
          <div className="space-y-3">
            {bookings.length === 0 ? (
              <p className="text-center text-neutral-500 py-12">Nessuna prenotazione ricevuta.</p>
            ) : (
              bookings.map((b) => {
                const waConfirmMsg = encodeURIComponent(
                  `Ciao ${b.customer_name}! La tua prenotazione per ${b.guests} persone il ${b.booking_date} alle ${b.booking_time} da ${restaurant.name} è confermata. Ti aspettiamo!`
                );

                return (
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

                    <div className="flex flex-wrap items-center gap-2">
                      <a
                        href={`https://wa.me/${formatWaPhone(b.customer_phone)}?text=${waConfirmMsg}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold px-3 py-2 rounded-lg"
                      >
                        <MessageCircle className="w-3.5 h-3.5" /> Rispondi su WA
                      </a>

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
                );
              })
            )}
          </div>
        )}

        {/* TAB 3: CLIENTI CRM & PROMOZIONI WHATSAPP */}
        {activeTab === 'customers' && (
          <div className="space-y-5">
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="font-bold text-sm text-amber-400">Messaggio Promozionale Rapido WhatsApp</h2>
                  <p className="text-xs text-neutral-400">
                    Personalizza il testo qui sotto e clicca &quot;Invia Promo WA&quot; accanto a qualsiasi cliente.
                  </p>
                </div>
                {customers.length > 0 && (
                  <button
                    onClick={exportCustomersCsv}
                    className="flex items-center gap-1.5 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-xs font-bold px-3 py-2 rounded-lg"
                  >
                    <Download className="w-3.5 h-3.5 text-amber-400" /> Esporta CSV ({customers.length})
                  </button>
                )}
              </div>
              <textarea
                rows={2}
                value={promoBroadcastText}
                onChange={(e) => setPromoBroadcastText(e.target.value)}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-2.5 text-xs text-white"
              />
            </div>

            {customers.length === 0 ? (
              <p className="text-center text-neutral-500 py-10 text-sm">
                Nessun contatto raccolto ancora. I clienti compaiono qui quando sbloccano WiFi &amp; Regalo al tavolo.
              </p>
            ) : (
              <div className="space-y-2.5">
                {customers.map((c) => {
                  const personalizedPromo = encodeURIComponent(`Ciao ${c.name}! ${promoBroadcastText} — ${restaurant.name}`);
                  return (
                    <div
                      key={c.id}
                      className="bg-neutral-900 border border-neutral-800 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3"
                    >
                      <div>
                        <p className="font-bold text-sm">
                          {c.name} <span className="text-xs text-neutral-400 font-normal">• {c.table_number}</span>
                        </p>
                        <p className="text-xs text-amber-400">{c.phone}</p>
                      </div>
                      <a
                        href={`https://wa.me/${formatWaPhone(c.phone)}?text=${personalizedPromo}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3.5 py-2 rounded-lg"
                      >
                        <MessageCircle className="w-3.5 h-3.5" /> Invia Promo WA
                      </a>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: SCUDO RECENSIONI & IMPOSTAZIONI */}
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
              className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 space-y-3.5 h-fit"
            >
              <h2 className="font-bold text-sm text-amber-400 flex items-center gap-1.5">
                <Settings className="w-4 h-4" /> Configurazione Scudo, WiFi, Coperto &amp; PIN
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
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs text-neutral-400 mb-1">Password WiFi Locale</label>
                  <input
                    type="text"
                    value={wifiPassword}
                    onChange={(e) => setWifiPassword(e.target.value)}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-neutral-400 mb-1">WhatsApp Locale (es. 39340...)</label>
                  <input
                    type="text"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    placeholder="393401234567"
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-neutral-400 mb-1">Messaggio Regalo Benvenuto al Tavolo</label>
                <input
                  type="text"
                  value={welcomePromo}
                  onChange={(e) => setWelcomePromo(e.target.value)}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs text-neutral-400 mb-1">Costo Coperto € (0 = disattivato)</label>
                  <input
                    type="text"
                    value={coverCharge}
                    onChange={(e) => setCoverCharge(e.target.value)}
                    placeholder="es. 2.00"
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-neutral-400 mb-1">PIN Accesso Dashboard</label>
                  <input
                    type="text"
                    required
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
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

        {/* TAB 5: GENERATORE QR TAVOLI */}
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
                  onChange={(e) => updateTableCount(Number(e.target.value))}
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

export default function AdminDashboard() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-neutral-950 text-white p-6">Caricamento pannello...</div>}>
      <AdminContent />
    </Suspense>
  );
}