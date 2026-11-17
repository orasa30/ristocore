import Link from 'next/link';
import {
  ShieldCheck,
  QrCode,
  ShoppingBag,
  MessageCircle,
  ChefHat,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

export default function HomePage() {
  const whatsappDemoUrl = `https://wa.me/393464972612?text=${encodeURIComponent(
    'Ciao! Vorrei attivare RistoCore o prenotare una demo gratuita per il mio locale.'
  )}`;

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      {/* Navbar */}
      <header className="sticky top-0 z-30 bg-neutral-950/90 backdrop-blur border-b border-neutral-800 px-4 py-3.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-neutral-950 font-black flex items-center justify-center text-sm">
              RC
            </div>
            <span className="font-extrabold text-lg tracking-tight">
              Risto<span className="text-amber-400">Core</span>
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/menu/trattoria-demo/Tavolo%201"
              className="hidden sm:inline-flex text-xs font-bold text-neutral-300 hover:text-white px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-800"
            >
              Prova Demo
            </Link>
            <a
              href={whatsappDemoUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-extrabold text-xs px-4 py-2 rounded-lg"
            >
              <MessageCircle className="w-3.5 h-3.5" /> Attiva Ora
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-5xl mx-auto px-4 pt-14 pb-16 text-center space-y-6">
        <div className="inline-flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold px-3.5 py-1.5 rounded-full">
          <Sparkles className="w-3.5 h-3.5" /> Zero App da Scaricare • Tutto dal Telefono del Cliente
        </div>

        <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight max-w-3xl mx-auto">
          Più Recensioni a 5 Stelle, Zero Commissioni sull&apos;Asporto e{' '}
          <span className="text-amber-400">Sala Sempre Sotto Controllo.</span>
        </h1>

        <p className="text-sm sm:text-base text-neutral-400 max-w-2xl mx-auto leading-relaxed">
          La suite digitale completa per ristoranti, pizzerie e lounge bar: menu QR/NFC multilingua, comande istantanee in cucina,
          scudo anti-recensioni negative e raccolta contatti WhatsApp automatica.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/menu/trattoria-demo/Tavolo%201"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-extrabold text-sm px-6 py-3.5 rounded-xl"
          >
            Prova il Menu al Tavolo <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/kds/trattoria-demo"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-white font-bold text-sm px-6 py-3.5 rounded-xl"
          >
            <ChefHat className="w-4 h-4 text-amber-400" /> Apri Schermo Cucina (KDS)
          </Link>
        </div>

        {/* Link rapidi demo completa */}
        <div className="pt-3 flex flex-wrap items-center justify-center gap-4 text-xs text-neutral-400">
          <span>Oppure testa subito:</span>
          <Link href="/asporto/trattoria-demo" className="text-purple-400 hover:underline font-semibold">
            Pagina Asporto 0% Commissioni →
          </Link>
          <Link href="/admin/trattoria-demo" className="text-emerald-400 hover:underline font-semibold">
            Dashboard Titolare (PIN: 1234) →
          </Link>
        </div>
      </section>

      {/* 4 Pilastri */}
      <section className="max-w-6xl mx-auto px-4 py-12 border-t border-neutral-900">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-5 space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-base">Scudo Recensioni Google</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Chi vota 4 o 5 stelle va dritto su Google Maps. Chi vota 1-3 stelle lascia un feedback privato al titolare invece di rovinare la media pubblica.
            </p>
          </div>

          <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-5 space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
              <QrCode className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-base">Ordini &amp; Chiamata Sala</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Menu IT/EN al tavolo con invio diretto in cucina, stampa comanda 80mm e tasti rapidi per chiamare il cameriere o chiedere il conto (Carta/Contanti).
            </p>
          </div>

          <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-5 space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-base">Asporto Zero Commissioni</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Link dedicato da mettere su Instagram e WhatsApp: i clienti ordinano da casa scegliendo l&apos;orario di ritiro, senza regalare il 30% alle app di delivery.
            </p>
          </div>

          <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-5 space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-sky-500/15 text-sky-400 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-base">WiFi &amp; CRM WhatsApp</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Il cliente lascia il numero WhatsApp (con consenso GDPR) per sbloccare la password WiFi e un buono benvenuto: tu crei la tua lista clienti per inviare promo.
            </p>
          </div>
        </div>
      </section>

      {/* Piani Chiavi in Mano */}
      <section className="max-w-5xl mx-auto px-4 py-12 border-t border-neutral-900 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black">Attivazione Chiavi in Mano in 24 Ore</h2>
          <p className="text-xs sm:text-sm text-neutral-400">
            Carichiamo noi il tuo menu, configuriamo i tavoli e ti consegniamo i supporti QR + NFC pronti da poggiare.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-4">
            <div>
              <span className="text-xs font-bold uppercase text-neutral-400">Piano Start</span>
              <h3 className="text-xl font-extrabold mt-1">Menu Smart + Scudo Recensioni</h3>
            </div>
            <ul className="space-y-2.5 text-xs text-neutral-300">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" /> Menu Digitale IT/EN modificabile dal telefono
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" /> Scudo Recensioni Google + Prenotazioni Tavolo
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" /> QR Code Tavoli + Supporti NFC inclusi nel setup
              </li>
            </ul>
            <a
              href={whatsappDemoUrl}
              target="_blank"
              rel="noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs py-3 rounded-xl"
            >
              Richiedi Info Piano Start
            </a>
          </div>

          <div className="bg-neutral-900 border-2 border-amber-500 rounded-2xl p-6 space-y-4 relative">
            <span className="absolute -top-3 right-5 bg-amber-500 text-neutral-950 text-[10px] font-black uppercase px-3 py-1 rounded-full">
              Più Scelto
            </span>
            <div>
              <span className="text-xs font-bold uppercase text-amber-400">Piano Full Suite</span>
              <h3 className="text-xl font-extrabold mt-1">Sala + Cucina KDS + Asporto &amp; CRM</h3>
            </div>
            <ul className="space-y-2.5 text-xs text-neutral-300">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" /> Tutto il Piano Start + Ordini dal Tavolo in Cucina (KDS)
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" /> Stampa Comande Termiche 80mm &amp; Chiusura Cassa
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" /> Link Asporto Zero Commissioni + CRM WiFi &amp; Promo WhatsApp
              </li>
            </ul>
            <a
              href={whatsappDemoUrl}
              target="_blank"
              rel="noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-extrabold text-xs py-3 rounded-xl"
            >
              <MessageCircle className="w-4 h-4" /> Prenota Demo Gratuita nel Tuo Locale
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-900 py-8 px-4 text-center text-xs text-neutral-500">
        RistoCore • Soluzioni Digitali per la Ristorazione • WhatsApp +39 346 497 2612
      </footer>
    </div>
  );
}