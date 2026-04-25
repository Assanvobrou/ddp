// ── Formulaire de contact fonctionnel ────────────────────────────────────────
function ContactForm() {
  const [form, setForm] = useState({ prenom: '', nom: '', telephone: '', motif: '' })
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handle = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const submit = async () => {
    if (!form.nom || !form.telephone) { setError('Nom et téléphone requis.'); return }
    setLoading(true); setError('')
    try {
      // ── FORMSPREE — décommenter et remplacer XXXXXXXX par votre ID Formspree ──
      // const res = await fetch('https://formspree.io/f/XXXXXXXX', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ nom: form.nom, prenom: form.prenom, telephone: form.telephone, motif: form.motif }),
      // })
      // if (!res.ok) throw new Error()

      // ── Backend Django (actif par défaut) ──
      await contactAPI.envoyer(form)
      setSent(true)
    } catch {
      setError('Erreur d\'envoi. Appelez-nous au 07 07 78 52 74.')
    } finally {
      setLoading(false)
    }
  }

  if (sent) return (
    <div className="text-center py-8">
      <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
        <CheckCircle size={24} className="text-green-600" strokeWidth={1.75} />
      </div>
      <p className="font-bold text-gray-900 mb-1">Demande envoyée !</p>
      <p className="text-sm text-gray-500">Nous vous rappelons sous 24h.</p>
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-600">Prénom</label>
          <input value={form.prenom} onChange={handle('prenom')}
            className="h-11 px-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-primary-500 bg-white" placeholder="Aminata" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-600">Nom *</label>
          <input value={form.nom} onChange={handle('nom')}
            className="h-11 px-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-primary-500 bg-white" placeholder="KONÉ" />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-gray-600">Téléphone *</label>
        <input value={form.telephone} onChange={handle('telephone')}
          className="h-11 px-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-primary-500 bg-white" placeholder="+225 07 XX XX XX" />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-gray-600">Motif</label>
        <select value={form.motif} onChange={handle('motif')}
          className="h-11 px-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-primary-500 bg-white text-gray-700">
          <option value="">Sélectionner un service</option>
          {SERVICES.map(s => <option key={s.nom} value={s.nom}>{s.nom}</option>)}
        </select>
      </div>
      {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
      <button onClick={submit} disabled={loading}
        className="w-full bg-primary-600 text-white py-3 rounded-xl font-semibold text-sm hover:bg-primary-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
        {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
        {loading ? 'Envoi...' : 'Envoyer la demande'}
      </button>
    </div>
  )
}

import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { contactAPI } from '@/services/api'
import {
  Baby, Heart, Syringe, Scan, FlaskConical,
  ShieldCheck, Ambulance, Phone, Mail,
  MapPin, Clock, LogIn, Users, CheckCircle, ChevronRight
} from 'lucide-react'

const SERVICES = [
  { icon: <Baby size={22} strokeWidth={1.5} />, nom: 'Suivi de grossesse', desc: 'Consultations prénatales, échographies, surveillance de la grossesse mois par mois.' },
  { icon: <Heart size={22} strokeWidth={1.5} />, nom: 'Accouchement', desc: 'Accouchement assisté par des sages-femmes qualifiées, césarienne si nécessaire.' },
  { icon: <ShieldCheck size={22} strokeWidth={1.5} />, nom: 'Consultations gynécologiques', desc: 'Examens gynécologiques, dépistage, traitement des pathologies féminines.' },
  { icon: <Scan size={22} strokeWidth={1.5} />, nom: 'Échographie obstétricale', desc: 'Échographies de datation, morphologiques et de suivi tout au long de la grossesse.' },
  { icon: <Syringe size={22} strokeWidth={1.5} />, nom: 'Vaccination mère & enfant', desc: 'Programme de vaccination complet pour les mamans et les nouveau-nés.' },
  { icon: <FlaskConical size={22} strokeWidth={1.5} />, nom: 'Analyses & Laboratoire', desc: 'Bilans sanguins, sérologies, analyses prénatales obligatoires.' },
  { icon: <CheckCircle size={22} strokeWidth={1.5} />, nom: 'Planification familiale', desc: 'Conseil et accompagnement en contraception et planification des naissances.' },
  { icon: <Ambulance size={22} strokeWidth={1.5} />, nom: 'Urgences obstétricales', desc: 'Prise en charge des urgences maternelles et néonatales 24h/24.' },
]

const ATOUTS = [
  { icon: <Users size={20} strokeWidth={1.5} />, titre: 'Sages-femmes qualifiées', desc: 'Une équipe dédiée à la santé de la mère et de l\'enfant.' },
  { icon: <Clock size={20} strokeWidth={1.5} />, titre: 'Disponibles 24h/24', desc: 'Urgences obstétricales ouvertes en continu, jour et nuit.' },
  { icon: <ShieldCheck size={20} strokeWidth={1.5} />, titre: 'Assurances acceptées', desc: 'CNPS, MUGEF, NSIA, SUNU, AXA et tous les grands organismes.' },
  { icon: <CheckCircle size={20} strokeWidth={1.5} />, titre: 'Cadre moderne', desc: 'Salles d\'accouchement équipées pour votre confort et votre sécurité.' },
]

export default function Landing() {
  const contactRef = useRef<HTMLElement>(null)

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* ── NAV ── */}
      <header className="fixed top-0 w-full bg-white/95 backdrop-blur border-b border-gray-100 z-50">
        <div className="max-w-6xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          {/* Logo + nom */}
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="Maternité Rahama" className="h-9 w-9 object-contain rounded-lg"
              onError={(e) => { (e.target as HTMLImageElement).style.display='none' }} />
            <div>
              <div className="font-black text-gray-900 text-[15px] leading-tight">Maternité Rahama</div>
              <div className="text-[9px] text-primary-600 font-bold uppercase tracking-wider">La vie commence ici</div>
            </div>
          </div>
          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-gray-500">
            <a href="#" className="hover:text-gray-900 transition-colors">Accueil</a>
            <a href="#" className="hover:text-gray-900 transition-colors">À propos</a>
            <a href="#services" className="hover:text-gray-900 transition-colors">Services</a>
            <button onClick={() => contactRef.current?.scrollIntoView({ behavior: 'smooth' })}
              className="hover:text-gray-900 transition-colors">Contact</button>
          </nav>
          <Link to="/connexion"
            className="flex items-center gap-1.5 bg-primary-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-primary-700 transition-colors">
            <LogIn size={14} strokeWidth={1.75} />
            <span className="hidden sm:inline">Espace personnel</span>
          </Link>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="pt-16 min-h-screen flex items-center" style={{ background: 'linear-gradient(135deg, #FDF2F8 0%, #FFFFFF 50%, #FDF2F8 100%)' }}>
        <div className="max-w-6xl mx-auto px-4 md:px-8 w-full grid md:grid-cols-2 gap-10 items-center py-16">
          {/* Illustration gauche */}
          <div className="flex justify-center order-2 md:order-1">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-primary-100/60" style={{ transform: 'scale(1.1)' }} />
              <img src="/logo.png" alt="Maternité Rahama"
                className="relative w-64 h-64 md:w-80 md:h-80 object-contain"
                style={{ filter: 'drop-shadow(0 8px 24px rgba(192,98,142,0.25))' }}
                onError={(e) => {
                  const el = e.target as HTMLImageElement
                  el.style.display = 'none'
                }} />
            </div>
          </div>
          {/* Texte droite */}
          <div className="order-1 md:order-2">
            <div className="inline-flex items-center gap-2 bg-white border border-primary-200 text-primary-700 text-xs font-bold px-3 py-1.5 rounded-full mb-5 shadow-sm">
              <MapPin size={11} strokeWidth={2} />
              Maternité — Gagnoa, Côte d'Ivoire
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 leading-[1.1] tracking-tight mb-5">
              La vie commence<br />
              <span className="text-primary-600">entre les meilleures mains.</span>
            </h1>
            <p className="text-base text-gray-500 leading-relaxed mb-8 max-w-lg">
              La Maternité Rahama vous accompagne de la grossesse à l'accouchement, avec une équipe de sages-femmes dévouées dans un cadre sûr et chaleureux.
            </p>
            <div className="flex flex-wrap gap-3">
              <button onClick={() => contactRef.current?.scrollIntoView({ behavior: 'smooth' })}
                className="flex items-center gap-2 bg-primary-600 text-white px-6 py-3.5 rounded-xl font-semibold text-sm hover:bg-primary-700 transition-colors shadow-md">
                <Phone size={16} strokeWidth={1.75} />
                Prendre rendez-vous
              </button>
              <a href="tel:+2250707785274" className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-6 py-3.5 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-colors">
                <ChevronRight size={16} strokeWidth={1.75} />
                Urgences 24h/24
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── ATOUTS ── */}
      <section className="py-14 border-y border-gray-100 bg-white">
        <div className="max-w-6xl mx-auto px-4 md:px-8 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {ATOUTS.map((a, i) => (
            <div key={i} className="flex flex-col gap-2 text-center">
              <div className="w-11 h-11 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center mx-auto mb-1">
                {a.icon}
              </div>
              <div className="font-bold text-sm text-gray-900">{a.titre}</div>
              <div className="text-xs text-gray-500 leading-relaxed">{a.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── ENGAGEMENT ── */}
      <section className="py-16 px-4 md:px-8 bg-gray-50">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          {/* Logo au-dessus du fond coloré */}
          <div className="rounded-2xl overflow-hidden shadow-lg bg-primary-100 aspect-video relative flex items-center justify-center">
            <img src="/logo.png" alt="Maternité Rahama"
              className="relative z-10 w-48 h-48 object-contain"
              style={{ filter: 'drop-shadow(0 4px 16px rgba(192,98,142,0.3))' }}
              onError={(e) => { (e.target as HTMLImageElement).style.display='none' }} />
          </div>
          <div>
            <div className="text-xs font-bold text-primary-600 uppercase tracking-widest mb-3">Notre engagement</div>
            <h2 className="text-3xl font-black text-gray-900 mb-4">
              Votre bien-être,<br />notre priorité <Heart size={24} className="inline text-primary-600" strokeWidth={1.75} />
            </h2>
            <p className="text-gray-500 leading-relaxed mb-6">
              Nous mettons tout en œuvre pour offrir un accompagnement humain, personnalisé et sécurisé à chaque étape de votre maternité.
            </p>
            <div className="space-y-3">
              {[
                'Suivi personnalisé de la grossesse',
                'Sages-femmes disponibles 24h/24',
                'Prise en charge assurance simplifiée',
                'Environnement chaleureux et sécurisé',
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-sm text-gray-700">
                  <div className="w-5 h-5 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                    <CheckCircle size={12} className="text-primary-600" strokeWidth={2} />
                  </div>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── SERVICES ── */}
      <section id="services" className="py-16 md:py-20 px-4 md:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="text-xs font-bold text-primary-600 uppercase tracking-widest mb-3">Nos services</div>
            <h2 className="text-3xl font-black text-gray-900 mb-3">Un accompagnement complet</h2>
            <p className="text-gray-500 max-w-lg mx-auto">Pour la maman et le bébé, de la conception aux premiers jours de vie.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {SERVICES.map((s, i) => (
              <div key={i} className="group flex flex-col gap-3 p-5 rounded-2xl border border-gray-100 hover:border-primary-200 hover:shadow-md transition-all bg-white">
                <div className="w-12 h-12 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center group-hover:bg-primary-600 group-hover:text-white transition-colors">
                  {s.icon}
                </div>
                <div>
                  <div className="font-bold text-gray-900 mb-1 text-sm">{s.nom}</div>
                  <div className="text-xs text-gray-500 leading-relaxed">{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ASSURANCES ── */}
      <section className="py-14 px-4 md:px-8 bg-primary-50">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-xl font-black text-gray-900 mb-2">Assurances partenaires</h2>
          <p className="text-gray-500 mb-8 text-sm">Nous acceptons les principaux organismes d'assurance maladie en Côte d'Ivoire.</p>
          <div className="flex flex-wrap justify-center gap-2 md:gap-3">
            {['CNPS', 'MUGEF-CI', 'NSIA', 'SUNU', 'AXA', 'ALLIANZ', 'ATLANTIQUE', 'SOHAM', 'COLINA', 'PRIMA'].map(a => (
              <div key={a} className="bg-white border border-gray-200 text-gray-700 px-3 md:px-4 py-2 rounded-xl text-xs md:text-sm font-bold shadow-sm">
                {a}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CONTACT ── */}
      <section ref={contactRef} className="py-16 md:py-20 px-4 md:px-8 bg-white">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-start">
          <div>
            <div className="text-xs font-bold text-primary-600 uppercase tracking-widest mb-3">Contact</div>
            <h2 className="text-3xl font-black text-gray-900 mb-4">Nous trouver</h2>
            <p className="text-gray-500 mb-8 leading-relaxed">Notre équipe est disponible pour répondre à toutes vos questions et vous accueillir.</p>
            <div className="space-y-4">
              {[
                { icon: <MapPin size={18} strokeWidth={1.75} />, label: 'Adresse', val: 'Gagnoa, Sokoura 2è carrefour, mosquée croisée' },
                { icon: <Phone size={18} strokeWidth={1.75} />, label: 'Téléphone', val: '07 07 78 52 74' },
                { icon: <Mail size={18} strokeWidth={1.75} />, label: 'Email', val: 'maaboritedinma@gmail.com' },
                { icon: <Clock size={18} strokeWidth={1.75} />, label: 'Urgences', val: '24h/24 · 7j/7' },
              ].map((c, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center flex-shrink-0 mt-0.5">{c.icon}</div>
                  <div>
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">{c.label}</div>
                    <div className="text-sm font-semibold text-gray-900 mt-0.5">{c.val}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-gray-50 rounded-2xl p-6 md:p-8 border border-gray-100">
            <h3 className="font-black text-gray-900 mb-1">Prendre rendez-vous</h3>
            <p className="text-sm text-gray-500 mb-6">Remplissez ce formulaire, nous vous rappelons sous 24h.</p>
            <ContactForm />
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-8 px-4 md:px-8 bg-gray-900">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2.5">
              <img src="/logo.png" alt="Logo" className="h-9 w-9 object-contain rounded-lg brightness-0 invert"
                onError={(e) => { (e.target as HTMLImageElement).style.display='none' }} />
              <div>
                <div className="font-black text-white text-sm">Maternité Rahama</div>
                <div className="text-xs text-gray-500">La vie commence ici</div>
              </div>
            </div>
            <div className="flex flex-col md:text-right gap-1 text-xs text-gray-500">
              <div>Gagnoa, Sokoura 2è carrefour, mosquée croisée</div>
              <div>Tél : 07 07 78 52 74 · maaboritedinma@gmail.com</div>
            </div>
          </div>
          <div className="pt-4 border-t border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <p className="text-xs text-gray-600">© 2026 Maternité Rahama · Gagnoa, Côte d'Ivoire — Tous droits réservés</p>
            <Link to="/connexion" className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-white transition-colors">
              <LogIn size={12} strokeWidth={1.75} />
              Espace personnel
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
