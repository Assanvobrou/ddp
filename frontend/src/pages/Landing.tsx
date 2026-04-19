import { useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  Stethoscope, Heart, Baby, Bone, Brain, Eye,
  FlaskConical, Scan, Syringe, Ambulance,
  Phone, Mail, MapPin, Clock, LogIn,
  ShieldCheck, Users, CheckCircle, ChevronRight
} from 'lucide-react'

const SPECIALITES = [
  { icon: <Stethoscope size={24} strokeWidth={1.5} />, nom: 'Médecine générale', desc: 'Consultations, bilans de santé, suivi des maladies chroniques.' },
  { icon: <Heart size={24} strokeWidth={1.5} />, nom: 'Cardiologie', desc: 'Électrocardiogramme, échocardiographie, suivi cardiovasculaire.' },
  { icon: <Baby size={24} strokeWidth={1.5} />, nom: 'Gynécologie & Maternité', desc: 'Suivi de grossesse, accouchement, consultations gynécologiques.' },
  { icon: <Brain size={24} strokeWidth={1.5} />, nom: 'Neurologie', desc: 'Diagnostic et prise en charge des affections du système nerveux.' },
  { icon: <Bone size={24} strokeWidth={1.5} />, nom: 'Orthopédie', desc: 'Traumatologie, chirurgie osseuse, rééducation fonctionnelle.' },
  { icon: <Eye size={24} strokeWidth={1.5} />, nom: 'Ophtalmologie', desc: 'Examen de la vue, traitement des pathologies oculaires.' },
  { icon: <FlaskConical size={24} strokeWidth={1.5} />, nom: 'Laboratoire d\'analyses', desc: 'Analyses biologiques, sérologies, bilan sanguin complet.' },
  { icon: <Scan size={24} strokeWidth={1.5} />, nom: 'Imagerie médicale', desc: 'Échographie, radiologie, scanner sur demande médicale.' },
  { icon: <Syringe size={24} strokeWidth={1.5} />, nom: 'Vaccination & Prévention', desc: 'Vaccinations adultes et enfants, médecine préventive.' },
  { icon: <Ambulance size={24} strokeWidth={1.5} />, nom: 'Urgences', desc: 'Prise en charge des urgences médicales 24h/24.' },
]

const ATOUTS = [
  { icon: <Users size={20} strokeWidth={1.5} />, titre: 'Équipe pluridisciplinaire', desc: 'Des spécialistes expérimentés dans chaque domaine médical.' },
  { icon: <Clock size={20} strokeWidth={1.5} />, titre: 'Disponibles 7j/7', desc: 'Urgences ouvertes en continu pour vous accompagner à tout moment.' },
  { icon: <ShieldCheck size={20} strokeWidth={1.5} />, titre: 'Assurances acceptées', desc: 'CNPS, MUGEF, NSIA, SUNU, AXA et tous les grands organismes ivoiriens.' },
  { icon: <CheckCircle size={20} strokeWidth={1.5} />, titre: 'Équipements modernes', desc: 'Plateau technique complet pour un diagnostic précis et rapide.' },
]

export default function Landing() {
  const contactRef = useRef<HTMLElement>(null)

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* NAV */}
      <header className="fixed top-0 w-full bg-white/95 backdrop-blur border-b border-gray-100 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center">
              <Stethoscope size={18} strokeWidth={1.75} className="text-white" />
            </div>
            <div>
              <div className="font-black text-gray-900 text-[15px] leading-tight">Notre Clinique</div>
              <div className="text-[9px] text-gray-400 font-semibold uppercase tracking-wider">Votre santé, notre priorité</div>
            </div>
          </div>
          <nav className="flex items-center gap-6">
            <button onClick={() => contactRef.current?.scrollIntoView({ behavior: 'smooth' })}
              className="hidden md:block text-sm text-gray-500 font-medium hover:text-gray-900 transition-colors">
              Contact
            </button>
            <Link to="/connexion"
              className="flex items-center gap-1.5 bg-primary-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-primary-700 transition-colors">
              <LogIn size={14} strokeWidth={1.75} />
              Espace personnel
            </Link>
          </nav>
        </div>
      </header>

      {/* HERO */}
      <section className="pt-28 pb-20 px-6" style={{ background: 'linear-gradient(135deg, #f0f7ff 0%, #ffffff 60%, #f0fdf4 100%)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white border border-primary-200 text-primary-700 text-xs font-bold px-3 py-1.5 rounded-full mb-6 shadow-sm">
              <Heart size={11} strokeWidth={2.5} className="text-red-500" />
              Clinique multidisciplinaire — Abidjan, Côte d'Ivoire
            </div>
            <h1 className="text-5xl font-black text-gray-900 leading-[1.1] tracking-tight mb-5">
              Votre santé entre<br />
              <span className="text-primary-600">les meilleures mains.</span>
            </h1>
            <p className="text-xl text-gray-500 leading-relaxed mb-10 max-w-xl">
              Notre Clinique réunit des spécialistes expérimentés pour vous offrir des soins de qualité, dans un environnement moderne et humain.
            </p>
            <div className="flex flex-wrap gap-3">
              <button onClick={() => contactRef.current?.scrollIntoView({ behavior: 'smooth' })}
                className="flex items-center gap-2 bg-primary-600 text-white px-6 py-3.5 rounded-xl font-semibold text-sm hover:bg-primary-700 transition-colors shadow-md">
                <Phone size={16} strokeWidth={1.75} />
                Prendre rendez-vous
              </button>
              <a href="tel:" className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-6 py-3.5 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-colors">
                <ChevronRight size={16} strokeWidth={1.75} />
                Urgences 24h/24
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ATOUTS */}
      <section className="py-12 border-y border-gray-100 bg-white">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          {ATOUTS.map((a, i) => (
            <div key={i} className="flex flex-col gap-2">
              <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center mb-1">
                {a.icon}
              </div>
              <div className="font-bold text-sm text-gray-900">{a.titre}</div>
              <div className="text-xs text-gray-500 leading-relaxed">{a.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* SPÉCIALITÉS */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12">
            <h2 className="text-3xl font-black text-gray-900 mb-3">Nos spécialités</h2>
            <p className="text-gray-500 max-w-lg">Une prise en charge complète pour chaque membre de votre famille, de la prévention au traitement.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {SPECIALITES.map((s, i) => (
              <div key={i} className="group flex gap-4 p-5 rounded-2xl border border-gray-100 hover:border-primary-200 hover:shadow-md transition-all bg-white cursor-default">
                <div className="w-12 h-12 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center flex-shrink-0 group-hover:bg-primary-600 group-hover:text-white transition-colors">
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

      {/* ASSURANCES */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-2xl font-black text-gray-900 mb-3">Assurances partenaires</h2>
          <p className="text-gray-500 mb-8 text-sm">Nous acceptons les principaux organismes d'assurance maladie en Côte d'Ivoire.</p>
          <div className="flex flex-wrap justify-center gap-3">
            {['CNPS', 'MUGEF-CI', 'NSIA', 'SUNU', 'AXA', 'ALLIANZ', 'ATLANTIQUE', 'SOHAM', 'COLINA', 'PRIMA'].map(a => (
              <div key={a} className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm font-bold shadow-sm">
                {a}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section ref={contactRef} className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-start">
          <div>
            <h2 className="text-3xl font-black text-gray-900 mb-4">Nous trouver</h2>
            <p className="text-gray-500 mb-8 leading-relaxed">Notre équipe est disponible pour répondre à toutes vos questions et vous orienter vers le bon spécialiste.</p>
            <div className="space-y-4">
              {[
                { icon: <MapPin size={18} strokeWidth={1.75} />, label: 'Adresse', val: 'Abidjan, Côte d\'Ivoire' },
                { icon: <Phone size={18} strokeWidth={1.75} />, label: 'Téléphone', val: '+225 — —' },
                { icon: <Mail size={18} strokeWidth={1.75} />, label: 'Email', val: 'contact@notreclinique.ci' },
                { icon: <Clock size={18} strokeWidth={1.75} />, label: 'Urgences', val: '24h/24 · 7j/7' },
              ].map((c, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    {c.icon}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">{c.label}</div>
                    <div className="text-sm font-semibold text-gray-900 mt-0.5">{c.val}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100">
            <h3 className="font-black text-gray-900 mb-1">Prendre rendez-vous</h3>
            <p className="text-sm text-gray-500 mb-6">Remplissez ce formulaire, nous vous rappelons sous 24h.</p>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-600">Prénom</label>
                  <input className="h-11 px-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-primary-500 bg-white" placeholder="Aminata" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-600">Nom</label>
                  <input className="h-11 px-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-primary-500 bg-white" placeholder="KONÉ" />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-600">Téléphone</label>
                <input className="h-11 px-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-primary-500 bg-white" placeholder="+225 07 XX XX XX" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-600">Motif</label>
                <select className="h-11 px-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-primary-500 bg-white">
                  <option value="">Sélectionner une spécialité</option>
                  {SPECIALITES.map(s => <option key={s.nom} value={s.nom}>{s.nom}</option>)}
                </select>
              </div>
              <button className="w-full bg-primary-600 text-white py-3 rounded-xl font-semibold text-sm hover:bg-primary-700 transition-colors">
                Envoyer la demande
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-8 px-6 bg-gray-900">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
              <Stethoscope size={14} strokeWidth={1.75} className="text-white" />
            </div>
            <div>
              <div className="font-black text-white text-sm">Notre Clinique</div>
              <div className="text-xs text-gray-500">Votre santé, notre priorité</div>
            </div>
          </div>
          <div className="text-xs text-gray-600">© 2026 Notre Clinique · Abidjan, Côte d'Ivoire</div>
          <Link to="/connexion" className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-white transition-colors">
            <LogIn size={12} strokeWidth={1.75} />
            Espace personnel
          </Link>
        </div>
      </footer>
    </div>
  )
}