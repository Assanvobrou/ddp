import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'

interface FormState {
  nom: string
  email: string
  message: string
}

export default function Landing() {
  const [form, setForm] = useState<FormState>({ nom: '', email: '', message: '' })
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)
  const contactRef = useRef<HTMLElement>(null)

  const scrollToContact = () => contactRef.current?.scrollIntoView({ behavior: 'smooth' })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    // Simulation envoi — brancher sur /api/v1/contact/ en production
    await new Promise(r => setTimeout(r, 1200))
    setSent(true)
    setSending(false)
  }

  const services = [
    { emoji: '💰', titre: 'Gestion de caisse', desc: 'Ouverture, fermeture et suivi des sessions de caisse avec workflow de validation comptable.' },
    { emoji: '🗂️', titre: 'Dossiers patients', desc: 'Enregistrement complet : identité, assurance, prestation, génération automatique du numéro de dossier.' },
    { emoji: '🩺', titre: 'Prestations médicales', desc: 'Catalogue configurable des actes avec gestion de la prise en charge assurance par prestation.' },
    { emoji: '📊', titre: 'Tableau de bord', desc: 'Recettes en temps réel, filtres par date et prestation, exports PDF et CSV pour les comptables.' },
    { emoji: '🛡️', titre: 'Assurances intégrées', desc: 'Gestion des organismes partenaires et calcul automatique des parts patient / assurance.' },
    { emoji: '👔', titre: 'Multi-utilisateurs', desc: 'Rôles et permissions granulaires : Caissière, Comptable, Directrice — accès selon les attributions.' },
  ]

  return (
    <div className="min-h-screen font-sans" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>

      {/* NAV */}
      <nav className="bg-[#07111F] sticky top-0 z-20 px-6 py-4 flex items-center justify-between border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-[10px] bg-gradient-to-br from-[#00A899] to-[#00C4B4] flex items-center justify-center text-lg">🗂️</div>
          <div>
            <div className="text-white text-[15px] font-black">Dossier Du Patient</div>
            <div className="text-white/30 text-[9px] font-semibold uppercase tracking-widest">DDP</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={scrollToContact}
            className="text-white/60 hover:text-white text-sm font-semibold transition-colors">
            Contact
          </button>
          <Link to="/connexion"
            className="bg-gradient-to-r from-[#00A899] to-[#00C4B4] text-white text-sm font-bold px-4 py-2 rounded-xl hover:shadow-lg hover:-translate-y-px transition-all">
            Se connecter →
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="bg-[#07111F] relative overflow-hidden">
        <div className="absolute inset-0"
          style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.03) 1px,transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className="absolute w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,rgba(0,196,180,0.08)_0%,transparent_65%)] top-[-100px] right-[-100px]" />
        <div className="absolute w-[300px] h-[300px] rounded-full bg-[radial-gradient(circle,rgba(240,165,0,0.05)_0%,transparent_70%)] bottom-0 left-0" />

        <div className="relative z-10 max-w-4xl mx-auto px-6 py-24 text-center">
          <div className="inline-flex items-center gap-2 bg-[rgba(0,196,180,0.12)] border border-[rgba(0,196,180,0.2)] text-[#00C4B4] text-xs font-bold px-4 py-1.5 rounded-full mb-8 tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00C4B4] animate-pulse" />
            Système de gestion clinique v1.0
          </div>
          <h1 className="text-[48px] lg:text-[64px] font-black text-white leading-[1.05] tracking-[-2px] mb-6">
            Gérez votre clinique<br />
            <span className="text-[#00C4B4]">sans friction.</span>
          </h1>
          <p className="text-white/50 text-lg leading-relaxed max-w-2xl mx-auto mb-10">
            DDP centralise la caisse, les dossiers patients, les paiements et le suivi des recettes
            dans une interface sécurisée, accessible selon les rôles de votre équipe.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/connexion"
              className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#00A899] to-[#00C4B4] text-white font-bold px-7 py-3.5 rounded-xl text-[15px] hover:shadow-[0_6px_24px_rgba(0,196,180,0.35)] hover:-translate-y-px transition-all">
              🔑 Accéder à l'application
            </Link>
            <button onClick={scrollToContact}
              className="inline-flex items-center justify-center gap-2 bg-white/[0.07] border border-white/[0.1] text-white font-semibold px-7 py-3.5 rounded-xl text-[15px] hover:bg-white/[0.1] transition-all">
              📩 Nous contacter
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="relative z-10 border-t border-white/[0.07]">
          <div className="max-w-4xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              ['🗂️', 'Dossiers patients', 'Centralisés'],
              ['🔐', 'Accès sécurisé', 'JWT + Argon2'],
              ['📊', 'Tableaux de bord', 'Temps réel'],
              ['👥', 'Multi-rôles', '4 rôles distincts'],
            ].map(([emoji, label, sub]) => (
              <div key={label} className="text-center">
                <div className="text-2xl mb-1">{emoji}</div>
                <div className="text-white font-bold text-sm">{label}</div>
                <div className="text-white/35 text-xs mt-0.5">{sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section className="bg-[#EDF1F7] py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-[34px] font-black text-gray-900 tracking-tight mb-3">
              Tout ce dont votre clinique a besoin
            </h2>
            <p className="text-gray-500 text-base max-w-xl mx-auto">
              Une plateforme complète, pensée pour les équipes médicales et administratives.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {services.map((s) => (
              <div key={s.titre}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md hover:-translate-y-0.5 transition-all">
                <div className="w-12 h-12 rounded-xl bg-[#E6FAF7] flex items-center justify-center text-2xl mb-4">{s.emoji}</div>
                <h3 className="text-[15px] font-extrabold text-gray-900 mb-2">{s.titre}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WORKFLOW */}
      <section className="bg-white py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-[34px] font-black text-gray-900 tracking-tight mb-3">
              Workflow de caisse sécurisé
            </h2>
            <p className="text-gray-500 text-base">De l'ouverture à la validation comptable — chaque étape tracée.</p>
          </div>
          <div className="relative">
            <div className="absolute left-[19px] top-0 bottom-0 w-[2px] bg-gradient-to-b from-[#00C4B4] to-[#E6FAF7] hidden md:block" />
            <div className="space-y-6">
              {[
                { emoji: '🔓', titre: 'Ouverture de caisse', desc: 'Tout utilisateur avec le module Caisse ouvre la session du jour.', role: 'Caissière / Directrice' },
                { emoji: '👤', titre: 'Enregistrement des patients', desc: 'Saisie complète : identité, assurance, prestation, calcul automatique des montants.', role: 'Caissière' },
                { emoji: '🔒', titre: 'Fermeture et décompte', desc: 'La caissière saisit le montant compté physiquement. L\'écart est calculé automatiquement avec justificatif.', role: 'Caissière' },
                { emoji: '📬', titre: 'Versement au comptable', desc: 'Le versement apparaît automatiquement chez le comptable en attente de validation.', role: 'Comptable' },
                { emoji: '✅', titre: 'Validation comptable', desc: 'Le comptable confirme la réception — la ligne de la caissière passe en "Validé". Tout est archivé.', role: 'Comptable' },
              ].map((step, i) => (
                <div key={i} className="flex gap-5 md:ml-10">
                  <div className="w-10 h-10 rounded-xl bg-[#E6FAF7] flex items-center justify-center text-xl flex-shrink-0 border-2 border-white shadow-sm relative z-10">{step.emoji}</div>
                  <div className="bg-[#F8FAFB] rounded-xl p-4 flex-1 border border-gray-100">
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-extrabold text-gray-900 text-sm">{step.titre}</div>
                      <span className="text-[10px] font-bold text-[#00A899] bg-[#E6FAF7] px-2 py-0.5 rounded-full flex-shrink-0">{step.role}</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section ref={contactRef} className="bg-[#EDF1F7] py-20 px-6">
        <div className="max-w-xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-[34px] font-black text-gray-900 tracking-tight mb-3">
              📩 Nous contacter
            </h2>
            <p className="text-gray-500 text-base">Une question ? Un besoin spécifique ? On vous répond rapidement.</p>
          </div>

          {sent ? (
            <div className="bg-white rounded-2xl border border-green-200 shadow-sm p-10 text-center">
              <div className="text-5xl mb-4">✅</div>
              <h3 className="text-xl font-black text-gray-900 mb-2">Message envoyé !</h3>
              <p className="text-gray-500 text-sm">Nous vous répondrons dans les plus brefs délais.</p>
              <button onClick={() => setSent(false)}
                className="mt-6 text-sm font-bold text-[#00A899] hover:underline">
                Envoyer un autre message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-7 space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-600 tracking-wide block mb-1.5">Nom complet *</label>
                <input
                  required value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))}
                  placeholder="Dr. Aminata Koné"
                  className="w-full h-11 px-3 bg-gray-50 border-[1.5px] border-gray-200 rounded-xl text-sm font-medium text-gray-900 outline-none transition-all focus:border-[#00A899] focus:bg-white focus:ring-2 focus:ring-[#00A899]/10"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 tracking-wide block mb-1.5">Email *</label>
                <input
                  required type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="contact@clinique.ci"
                  className="w-full h-11 px-3 bg-gray-50 border-[1.5px] border-gray-200 rounded-xl text-sm font-medium text-gray-900 outline-none transition-all focus:border-[#00A899] focus:bg-white focus:ring-2 focus:ring-[#00A899]/10"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 tracking-wide block mb-1.5">Message *</label>
                <textarea
                  required rows={4} value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                  placeholder="Décrivez votre besoin..."
                  className="w-full px-3 py-2.5 bg-gray-50 border-[1.5px] border-gray-200 rounded-xl text-sm font-medium text-gray-900 outline-none transition-all resize-none focus:border-[#00A899] focus:bg-white focus:ring-2 focus:ring-[#00A899]/10"
                />
              </div>
              <button
                type="submit"
                disabled={sending}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#00A899] to-[#00C4B4] text-white font-bold py-3 rounded-xl text-sm hover:shadow-md hover:-translate-y-px transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {sending ? (
                  <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25"/>
                    <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" className="opacity-75"/>
                  </svg>
                ) : '📩 Envoyer le message'}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#07111F] py-10 px-6">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[9px] bg-gradient-to-br from-[#00A899] to-[#00C4B4] flex items-center justify-center text-base">🗂️</div>
            <span className="text-white font-black text-sm">Dossier Du Patient</span>
          </div>
          <div className="text-white/25 text-xs">© 2026 DDP — Tous droits réservés</div>
          <Link to="/connexion" className="text-[#00C4B4] text-sm font-bold hover:underline">
            Connexion →
          </Link>
        </div>
      </footer>
    </div>
  )
}
