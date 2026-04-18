import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  Banknote, FolderOpen, Stethoscope, BarChart2, Shield,
  Users, LogIn, Unlock, UserPlus, Lock, ArrowRight,
  CheckCircle, Mail, MessageSquare, Building2, Phone,
  FileText, TrendingUp, ShieldCheck
} from 'lucide-react'

const SERVICES = [
  { icon: <Banknote size={22} strokeWidth={1.5} />, titre: 'Gestion de caisse', desc: 'Ouverture, fermeture et suivi des sessions de caisse avec workflow de validation comptable.' },
  { icon: <FolderOpen size={22} strokeWidth={1.5} />, titre: 'Dossiers patients', desc: 'Enregistrement complet : identité, assurance, prestation, génération automatique du numéro de dossier.' },
  { icon: <Stethoscope size={22} strokeWidth={1.5} />, titre: 'Prestations médicales', desc: 'Catalogue configurable des actes avec gestion de la prise en charge assurance par prestation.' },
  { icon: <BarChart2 size={22} strokeWidth={1.5} />, titre: 'Tableau de bord', desc: 'Recettes en temps réel, filtres par date et prestation, exports PDF et CSV pour les comptables.' },
  { icon: <Shield size={22} strokeWidth={1.5} />, titre: 'Assurances intégrées', desc: 'Gestion des organismes partenaires et calcul automatique des parts patient / assurance.' },
  { icon: <Users size={22} strokeWidth={1.5} />, titre: 'Multi-utilisateurs', desc: 'Rôles et permissions granulaires : Caissière, Comptable, Directrice — accès selon les attributions.' },
]

const STEPS = [
  { icon: <Unlock size={18} strokeWidth={1.75} />, titre: 'Ouverture de caisse', desc: 'Tout utilisateur avec le module Caisse ouvre la session du jour.', role: 'Caissière / Directrice' },
  { icon: <UserPlus size={18} strokeWidth={1.75} />, titre: 'Enregistrement des patients', desc: 'Saisie complète : identité, assurance, prestation, calcul automatique des montants.', role: 'Caissière' },
  { icon: <Lock size={18} strokeWidth={1.75} />, titre: 'Fermeture et décompte', desc: "La caissière saisit le montant compté physiquement. L'écart est calculé automatiquement avec justificatif.", role: 'Caissière' },
  { icon: <ArrowRight size={18} strokeWidth={1.75} />, titre: 'Versement au comptable', desc: 'Le versement apparaît automatiquement chez le comptable en attente de validation.', role: 'Comptable' },
  { icon: <CheckCircle size={18} strokeWidth={1.75} />, titre: 'Validation comptable', desc: 'Le comptable confirme la réception — la ligne de la caissière passe en "Validé". Tout est archivé.', role: 'Comptable' },
]

interface FormState { nom: string; email: string; message: string }

export default function Landing() {
  const [form, setForm] = useState<FormState>({ nom: '', email: '', message: '' })
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)
  const contactRef = useRef<HTMLElement>(null)

  const scrollToContact = () => contactRef.current?.scrollIntoView({ behavior: 'smooth' })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    await new Promise(r => setTimeout(r, 1200))
    setSent(true)
    setSending(false)
  }

  return (
    <div className="min-h-screen bg-white font-sans">

      {/* NAV */}
      <header className="fixed top-0 w-full bg-white/90 backdrop-blur border-b border-gray-100 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
              <Stethoscope size={16} strokeWidth={1.75} className="text-white" />
            </div>
            <span className="font-black text-gray-900 text-[15px]">Dossier Du Patient</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-gray-500 font-medium">
            <button onClick={scrollToContact} className="hover:text-gray-900 transition-colors">Contact</button>
            <Link to="/connexion"
              className="flex items-center gap-1.5 bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary-700 transition-colors">
              <LogIn size={14} strokeWidth={1.75} />
              Connexion
            </Link>
          </nav>
        </div>
      </header>

      {/* HERO */}
      <section className="pt-32 pb-20 px-6 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-primary-50 text-primary-700 text-xs font-bold px-3 py-1.5 rounded-full border border-primary-200 mb-6">
            <ShieldCheck size={12} strokeWidth={2} />
            Gestion clinique sécurisée
          </div>
          <h1 className="text-5xl font-black text-gray-900 tracking-tight leading-[1.1] mb-5">
            La gestion de votre clinique,<br />
            <span className="text-primary-600">enfin centralisée.</span>
          </h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            Patients, caisse, assurances, personnel — tout dans une seule application, accessible selon les rôles de chacun.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link to="/connexion"
              className="flex items-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-primary-700 transition-colors shadow-md">
              <LogIn size={16} strokeWidth={1.75} />
              Accéder à l'application
            </Link>
            <button onClick={scrollToContact}
              className="flex items-center gap-2 border border-gray-200 text-gray-700 px-6 py-3 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-colors">
              <Mail size={16} strokeWidth={1.75} />
              Nous contacter
            </button>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="py-10 border-y border-gray-100 bg-white">
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { icon: <FolderOpen size={20} strokeWidth={1.5} />, label: 'Dossiers patients', sub: 'Centralisés' },
            { icon: <ShieldCheck size={20} strokeWidth={1.5} />, label: 'Accès sécurisé', sub: 'JWT + Argon2' },
            { icon: <BarChart2 size={20} strokeWidth={1.5} />, label: 'Tableaux de bord', sub: 'Temps réel' },
            { icon: <Users size={20} strokeWidth={1.5} />, label: 'Multi-rôles', sub: 'Permissions granulaires' },
          ].map((s, i) => (
            <div key={i} className="text-center">
              <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center mx-auto mb-2">
                {s.icon}
              </div>
              <div className="font-bold text-sm text-gray-900">{s.label}</div>
              <div className="text-xs text-gray-400">{s.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* SERVICES */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-gray-900 mb-3">Ce que couvre l'application</h2>
            <p className="text-gray-500 max-w-xl mx-auto">Chaque module répond à un besoin précis de la clinique.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {SERVICES.map((s, i) => (
              <div key={i} className="p-6 rounded-2xl border border-gray-100 hover:border-primary-200 hover:shadow-md transition-all bg-white">
                <div className="w-12 h-12 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center mb-4">
                  {s.icon}
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{s.titre}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WORKFLOW */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-gray-900 mb-3">Workflow de caisse</h2>
            <p className="text-gray-500">Du début de journée à la validation comptable.</p>
          </div>
          <div className="relative">
            <div className="absolute left-5 top-0 bottom-0 w-px bg-primary-200" />
            <div className="space-y-6">
              {STEPS.map((step, i) => (
                <div key={i} className="flex gap-4 relative">
                  <div className="w-10 h-10 rounded-xl bg-primary-600 text-white flex items-center justify-center flex-shrink-0 relative z-10 shadow-sm">
                    {step.icon}
                  </div>
                  <div className="bg-white rounded-xl border border-gray-100 p-4 flex-1 shadow-sm">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="font-bold text-sm text-gray-900">{step.titre}</span>
                      <span className="text-[10px] bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full font-semibold flex-shrink-0">{step.role}</span>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-primary-600">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-5">
            <CheckCircle size={28} strokeWidth={1.5} className="text-white" />
          </div>
          <h2 className="text-3xl font-black text-white mb-4">Prêt à démarrer ?</h2>
          <p className="text-white/70 mb-8">Connectez-vous avec vos identifiants pour accéder à votre espace.</p>
          <Link to="/connexion"
            className="inline-flex items-center gap-2 bg-white text-primary-600 px-8 py-3.5 rounded-xl font-bold text-sm hover:bg-gray-50 transition-colors shadow-lg">
            <LogIn size={16} strokeWidth={1.75} />
            Accéder à l'application
          </Link>
        </div>
      </section>

      {/* CONTACT */}
      <section ref={contactRef} className="py-20 px-6 bg-white">
        <div className="max-w-xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-black text-gray-900 mb-3">Nous contacter</h2>
            <p className="text-gray-500">Une question sur l'application ou une demande d'accès ?</p>
          </div>
          {sent ? (
            <div className="text-center py-12">
              <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={24} strokeWidth={1.75} className="text-green-600" />
              </div>
              <p className="font-bold text-gray-900 mb-1">Message envoyé</p>
              <p className="text-sm text-gray-500">Nous vous répondrons dans les meilleurs délais.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-600">Nom</label>
                  <input value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} required
                    className="h-11 px-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-50"
                    placeholder="Votre nom" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-600">Email</label>
                  <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required
                    className="h-11 px-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-50"
                    placeholder="contact@clinique.ci" />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-600">Message</label>
                <textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} required rows={4}
                  className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-50 resize-none"
                  placeholder="Votre message..." />
              </div>
              <button type="submit" disabled={sending}
                className="w-full flex items-center justify-center gap-2 bg-primary-600 text-white py-3 rounded-xl font-semibold text-sm hover:bg-primary-700 transition-colors disabled:opacity-60">
                {sending ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <><Mail size={15} strokeWidth={1.75} />Envoyer le message</>
                )}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-8 px-6 border-t border-gray-100 bg-white">
        <div className="max-w-6xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary-600 flex items-center justify-center">
              <Stethoscope size={13} strokeWidth={1.75} className="text-white" />
            </div>
            <span className="font-black text-gray-900 text-sm">Dossier Du Patient</span>
          </div>
          <span className="text-xs text-gray-400">© 2026 DDP — Tous droits réservés</span>
        </div>
      </footer>
    </div>
  )
}
