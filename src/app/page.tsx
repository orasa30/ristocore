'use client';

import { useState } from 'react';
import {
  Smartphone,
  ChefHat,
  LayoutDashboard,
  ShieldCheck,
  Zap,
  QrCode,
  ArrowRight,
  CheckCircle2,
  Calculator,
  MessageCircle,
} from 'lucide-react';

export default function HomePage() {
  const [dailyCovers, setDailyCovers] = useState(60);
  const [avgTicket, setAvgTicket] = useState(22);

  // Calcolo conservativo: +12% scontrino medio da riordini rapidi/dessert/bevande + risparmio tempo sala
  const monthlyRevenue = dailyCovers * avgTicket * 26;
  const extraUpsell = Math.round(monthlyRevenue * 0.12);
  const savedHours = Math.round((dailyCovers * 3 * 26) / 60);

  // Sostituisci con il tuo numero WhatsApp (es. 393201234567)
  const whatsappNumber = '393464972612';
  const whatsappText = encodeURIComponent(
    'Ciao! Ho visto la demo di RistoCore e vorrei attivarlo per il mio locale.'
  );

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      {/* Navbar */}
      <nav className="sticky top-0 z-30 bg-neutral-950/90 backdrop-blur border-b border-neutral-800 px-4 py-3.5">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-neutral-950 font-black flex items-center justify-center">
              R
            </div>
            <span className="font-extrabold text-lg tracking-tight">
              Risto<span className="text-amber-400">Core</span>
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <a
              href="#demo"
              className="text-xs font-semibold text-neutral-300 hover:text-white px-3 py-2"
            >
              Prova Demo
            </a>
            <a
              href={`https://wa.me/${whatsappNumber}?text=${whatsappText}`}
              target="_blank"
              rel="noreferrer"
              className="bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5"
            >
              <MessageCircle className="w-3.5 h-3.5" /> Attiva in 24h
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-5xl mx-auto px-4 pt-12 pb-10 text-center space-y-6">
        <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold px-3.5 py-1.5 rounded-full">
          <Zap className="w-3.5 h-3.5" /> Zero tablet da comprare • Zero commissioni sugli ordini
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight max-w-3xl mx-auto">
          Trasforma i tavoli del tuo locale in un sistema di{' '}
          <span className="text-amber-400">comande live e recensioni 5 stelle</span>.
        </h1>

        <p className="text-sm sm:text-base text-neutral-400 max-w-2xl mx-auto">
          I clienti ordinano e chiamano il cameriere dal QR sul tavolo, la cucina riceve la comanda in tempo reale su qualsiasi schermo già presente nel locale, e lo Scudo Recensioni protegge la tua reputazione su Google.
        </p>

        {/* Box Demo Live Interattiva */}
        <div id="demo" className="pt-4">
          <p className="text-xs uppercase tracking-wider text-neutral-400 font-semibold mb-3">
            Testa il sistema dal vivo in 10 secondi (Locale Demo)
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-3xl mx-auto">
            <a
              href="/menu/trattoria-demo/Tavolo%204"
              target="_blank"
              rel="noreferrer"
              className="bg-amber-500 hover:bg-amber-400 text-neutral-950 p-4 rounded-2xl flex flex-col items-center text-center transition-transform hover:-translate-y-0.5"
            >
              <Smartphone className="w-6 h-6 mb-1.5" />
              <span className="font-extrabold text-sm">1. Menu al Tavolo 4</span>
              <span className="text-[11px] opacity-85 mt-0.5">Ordina, chiama cameriere, vota</span>
            </a>

            <a
              href="/kds/trattoria-demo"
              target="_blank"
              rel="noreferrer"
              className="bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 p-4 rounded-2xl flex flex-col items-center text-center transition-transform hover:-translate-y-0.5"
            >
              <ChefHat className="w-6 h-6 text-amber-400 mb-1.5" />
              <span className="font-extrabold text-sm">2. Schermo Cucina (KDS)</span>
              <span className="text-[11px] text-neutral-400 mt-0.5">Comande live con avviso sonoro</span>
            </a>

            <a
              href="/admin/trattoria-demo"
              target="_blank"
              rel="noreferrer"
              className="bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 p-4 rounded-2xl flex flex-col items-center text-center transition-transform hover:-translate-y-0.5"
            >
              <LayoutDashboard className="w-6 h-6 text-emerald-400 mb-1.5" />
              <span className="font-extrabold text-sm">3. Pannello Titolare</span>
              <span className="text-[11px] text-neutral-400 mt-0.5">PIN Demo: 1234 • Menu & QR</span>
            </a>
          </div>
        </div>
      </section>

      {/* 4 Vantaggi Chiave */}
      <section className="max-w-5xl mx-auto px-4 py-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-2">
          <ChefHat className="w-6 h-6 text-amber-400" />
          <h3 className="font-bold text-base">Zero Hardware</h3>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Funziona su qualsiasi telefono, tablet o PC che hai già in cucina o al bancone. Nessun palmare da 1.500€.
          </p>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-2">
          <ShieldCheck className="w-6 h-6 text-emerald-400" />
          <h3 className="font-bold text-base">Scudo Recensioni</h3>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Chi vota 4-5 stelle va dritto su Google Maps. Chi vota 1-3 stelle lascia un reclamo privato solo per te.
          </p>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-2">
          <QrCode className="w-6 h-6 text-sky-400" />
          <h3 className="font-bold text-base">QR & Lingue Auto</h3>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Menu istantaneo in Italiano e Inglese per i turisti, con QRCode dedicati per ogni singolo tavolo.
          </p>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-2">
          <Zap className="w-6 h-6 text-yellow-400" />
          <h3 className="font-bold text-base">Controllo Totale</h3>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Segna un piatto come esaurito con un tap, gestisci prenotazioni e controlla gli incassi dal telefono.
          </p>
        </div>
      </section>

      {/* Calcolatore Impatto Economico */}
      <section className="max-w-3xl mx-auto px-4 py-10">
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-2 text-amber-400">
            <Calculator className="w-5 h-5" />
            <h2 className="font-extrabold text-lg">Calcola l&apos;impatto sul tuo locale</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <div className="flex justify-between text-xs mb-2">
                <span className="text-neutral-400">Coperti medi al giorno</span>
                <span className="font-bold text-amber-400">{dailyCovers} coperti</span>
              </div>
              <input
                type="range"
                min={15}
                max={250}
                step={5}
                value={dailyCovers}
                onChange={(e) => setDailyCovers(Number(e.target.value))}
                className="w-full accent-amber-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-2">
                <span className="text-neutral-400">Scontrino medio</span>
                <span className="font-bold text-amber-400">€ {avgTicket}</span>
              </div>
              <input
                type="range"
                min={10}
                max={70}
                step={1}
                value={avgTicket}
                onChange={(e) => setAvgTicket(Number(e.target.value))}
                className="w-full accent-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-neutral-800">
            <div className="bg-neutral-950 rounded-2xl p-4">
              <p className="text-xs text-neutral-400">Incasso extra stimato (+12% riordini)</p>
              <p className="text-2xl font-extrabold text-emerald-400 mt-1">+ € {extraUpsell.toLocaleString('it-IT')}/mese</p>
            </div>
            <div className="bg-neutral-950 rounded-2xl p-4">
              <p className="text-xs text-neutral-400">Tempo sala risparmiato</p>
              <p className="text-2xl font-extrabold text-amber-400 mt-1">{savedHours} ore/mese</p>
            </div>
          </div>
        </div>
      </section>

      {/* Offerta Chiavi in Mano */}
      <section className="max-w-3xl mx-auto px-4 py-10 text-center space-y-6">
        <div className="bg-gradient-to-b from-neutral-900 to-neutral-950 border border-amber-500/40 rounded-3xl p-6 sm:p-8 space-y-5">
          <h2 className="text-2xl font-extrabold">Attivazione Chiavi in Mano in 24 Ore</h2>
          <p className="text-xs sm:text-sm text-neutral-400 max-w-lg mx-auto">
            Carichiamo noi il tuo intero menu (anche in Inglese), configuriamo lo Scudo Recensioni Google e ti consegniamo i QR prontissimi per i tuoi tavoli.
          </p>

          <ul className="text-left max-w-md mx-auto space-y-2 text-xs sm:text-sm text-neutral-200">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Caricamento completo menu e allergeni
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Schermo Cucina KDS + Chiamata Cameriere/Conto
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Scudo Recensioni Google + Prenotazioni Tavoli
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Nessun vincolo annuale e zero commissioni
            </li>
          </ul>

          <a
            href={`https://wa.me/${whatsappNumber}?text=${whatsappText}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-extrabold px-6 py-3.5 rounded-2xl text-sm"
          >
            Richiedi Attivazione per il tuo Locale <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </section>

      <footer className="border-t border-neutral-900 py-6 text-center text-xs text-neutral-500">
        RistoCore • Sistema Digitale per Ristoranti, Pizzerie e Lounge Bar
      </footer>
    </div>
  );
}