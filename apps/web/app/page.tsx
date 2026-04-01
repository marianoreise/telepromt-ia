import Link from 'next/link'
import Image from 'next/image'
import { Mic, Sparkles, EyeOff, BookOpen, ArrowRight, Check, Zap, Brain, Globe, FileText, Shield, Lock, Clock } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen text-gray-900 antialiased" style={{ background: '#ffffff' }}>

      {/* ── Navbar ──────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="listnr.io" width={140} height={48} style={{ height: 'auto' }} className="" priority />
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              Ingresar
            </Link>
            <Link
              href="/register"
              className="text-sm font-medium text-white px-4 py-2 rounded-lg transition-opacity hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #1B6CA8 0%, #7B35A2 100%)' }}
            >
              Registrarse gratis
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────���────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 pt-24 pb-20 text-center">
        {/* Logo prominente en hero */}
        <div className="flex justify-center mb-8" style={{ background: '#ffffff' }}>
          <Image src="/logo.png" alt="listnr.io" width={280} height={93} style={{ height: 'auto' }} className="" priority />
        </div>

        <p className="text-5xl sm:text-6xl font-bold tracking-tight leading-tight text-[#1B6CA8] mb-6">
          Asistente IA en tiempo real
        </p>

        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight leading-tight text-gray-900 mb-6">
          No más miedo a las<br />
          <span
            className="bg-clip-text text-transparent"
            style={{ backgroundImage: 'linear-gradient(135deg, #1B6CA8 0%, #7B35A2 100%)' }}
          >
            entrevistas en línea
          </span>
        </h1>

        <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
          listnr.io escucha tu entrevista, detecta las preguntas y te muestra
          las respuestas en pantalla — en tiempo real, invisible para los demás.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 text-white font-medium px-6 py-3 rounded-xl text-sm transition-opacity hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #1B6CA8 0%, #7B35A2 100%)' }}
          >
            Empezar gratis
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-gray-600 font-medium px-6 py-3 rounded-xl text-sm border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            Ya tengo cuenta
          </Link>
        </div>

        <p className="text-xs text-gray-400 mt-4">Sin tarjeta de crédito · 10 minutos gratis por sesión</p>

        {/* Mockup UI */}
        <div className="mt-16 relative mx-auto max-w-3xl">
          <div className="rounded-2xl border border-gray-200 shadow-2xl shadow-gray-100 overflow-hidden">
            {/* Mock browser bar */}
            <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-gray-300" />
                <div className="w-3 h-3 rounded-full bg-gray-300" />
                <div className="w-3 h-3 rounded-full bg-gray-300" />
              </div>
              <div className="flex-1 mx-4 bg-white rounded-md border border-gray-200 px-3 py-1 text-xs text-gray-400">
                app.listnr.io/sessions/live
              </div>
            </div>
            {/* Mock session UI */}
            <div className="bg-white p-6 grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    EN VIVO
                  </span>
                  <span className="text-xs text-gray-400">09:12</span>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 text-left space-y-2">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Transcripción</p>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    "...contanos sobre tu experiencia con proyectos de alta presión y cómo manejaste los plazos ajustados."
                  </p>
                  <p className="text-xs text-gray-400 italic animate-pulse">Escuchando...</p>
                </div>
              </div>
              <div className="space-y-3">
                <div
                  className="rounded-xl p-4 text-left text-white"
                  style={{ background: 'linear-gradient(135deg, #1B6CA8 0%, #7B35A2 100%)' }}
                >
                  <div className="flex items-center gap-1.5 mb-2">
                    <Sparkles className="w-3.5 h-3.5 text-white/80" />
                    <p className="text-xs font-medium text-white/80 uppercase tracking-wide">Respuesta IA</p>
                  </div>
                  <p className="text-sm leading-relaxed">
                    En mi último rol lideré una migración crítica con 3 semanas de plazo. Organicé sprints diarios, prioricé por impacto y el equipo entregó a tiempo con cero incidentes en producción.
                  </p>
                </div>
              </div>
            </div>
          </div>
          {/* Glow effect */}
          <div
            className="absolute -inset-px rounded-2xl opacity-20 blur-xl -z-10"
            style={{ background: 'linear-gradient(135deg, #1B6CA8 0%, #7B35A2 100%)' }}
          />
        </div>
      </section>

      {/* ── Cómo funciona ────────────────────────────────────────────────── */}
      <section id="como-funciona" className="bg-gray-50 py-24">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-[#1B6CA8] uppercase tracking-wider mb-3">Cómo funciona</p>
            <h2 className="text-3xl font-bold tracking-tight mb-3">Tres pasos. Ningún esfuerzo extra.</h2>
            <p className="text-gray-500">Listo en menos de 2 minutos. Sin instalación.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Conectá el audio',
                description: 'listnr.io captura el audio de tu entrevista directamente desde el navegador. Sin extensiones, sin instalaciones.',
                icon: Mic,
              },
              {
                step: '02',
                title: 'Se transcribe solo',
                description: 'Deepgram transcribe en tiempo real cada palabra. Detecta automáticamente las preguntas del entrevistador.',
                icon: FileText,
              },
              {
                step: '03',
                title: 'La IA te guía',
                description: 'Claude genera respuestas contextualizadas con tu CV y experiencia. Las ves vos. Nadie más.',
                icon: Sparkles,
              },
            ].map(({ step, title, description, icon: Icon }) => (
              <div key={step} className="relative bg-white rounded-2xl p-7 border border-gray-100 shadow-sm">
                <span className="text-5xl font-black text-gray-100 leading-none mb-4 block">{step}</span>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 bg-white border border-gray-200 shadow-sm">
                  <Icon className="w-5 h-5 text-[#1B6CA8]" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────────── */}
      <section id="caracteristicas" className="py-24">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-[#7B35A2] uppercase tracking-wider mb-3">Características</p>
            <h2 className="text-3xl font-bold tracking-tight mb-3">Todo lo que necesitás para brillar</h2>
            <p className="text-gray-500">Diseñado para que puedas enfocarte en la conversación.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {[
              {
                icon: EyeOff,
                iconBg: 'bg-blue-50',
                iconColor: 'text-[#1B6CA8]',
                title: 'Completamente invisible',
                description: 'El overlay no aparece en screen share, OBS ni ninguna herramienta de grabación. Solo vos lo ves.',
              },
              {
                icon: Zap,
                iconBg: 'bg-violet-50',
                iconColor: 'text-[#7B35A2]',
                title: 'Transcripción instantánea',
                description: 'Latencia menor a 1.5 segundos con Deepgram Nova-2. Nunca más perdés una pregunta.',
              },
              {
                icon: Brain,
                iconBg: 'bg-blue-50',
                iconColor: 'text-[#1B6CA8]',
                title: 'IA entrenada con tu perfil',
                description: 'Subí tu CV una vez. Las respuestas incluyen tus proyectos, habilidades y experiencia real.',
              },
              {
                icon: Globe,
                iconBg: 'bg-violet-50',
                iconColor: 'text-[#7B35A2]',
                title: 'Castellano, Inglés o mixto',
                description: 'Ideal para entrevistas con empresas extranjeras. Cambiás el idioma en un click antes de empezar.',
              },
            ].map(({ icon: Icon, iconBg, iconColor, title, description }) => (
              <div key={title} className="flex gap-4 p-6 rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all duration-200 bg-white">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
                  <Icon className={`w-5 h-5 ${iconColor}`} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Plataformas compatibles ──────────────────────────────────────── */}
      <section className="py-24">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight mb-2">
              <span
                className="bg-clip-text text-transparent"
                style={{ backgroundImage: 'linear-gradient(135deg, #1B6CA8 0%, #7B35A2 100%)' }}
              >
                #1 Asistente de Entrevistas
              </span>
              <span className="text-gray-900"> del mercado</span>
            </h2>
            <p className="text-gray-500">Conectate a cualquier plataforma y recibí asistencia IA invisible para los demás.</p>
          </div>

          {/* Banner principal */}
          <div
            className="rounded-2xl overflow-hidden mb-5 flex items-center justify-between p-8 gap-8"
            style={{ background: 'linear-gradient(135deg, #1B6CA8 0%, #7B35A2 100%)' }}
          >
            <div className="flex-1 min-w-0 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-white/60">Compatible con</p>
              <h3 className="text-2xl font-bold text-white leading-snug">
                Funciona con cualquier plataforma de entrevistas
              </h3>
              <p className="text-sm text-white/75 leading-relaxed max-w-sm">
                Google Meet, Zoom, Teams y más. El overlay es completamente invisible para los otros participantes.
              </p>
            </div>
            <div className="shrink-0 grid grid-cols-3 gap-4">
              {[
                { emoji: '🟢', label: 'Google Meet' },
                { emoji: '🔵', label: 'Zoom' },
                { emoji: '🟣', label: 'Teams' },
                { emoji: '🌐', label: 'WebEx' },
                { emoji: '💬', label: 'Slack' },
                { emoji: '💻', label: 'HackerRank' },
              ].map(({ emoji, label }) => (
                <div key={label} className="flex flex-col items-center gap-1.5 w-16">
                  <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center text-xl border border-white/20">
                    {emoji}
                  </div>
                  <span className="text-[10px] font-medium text-white/70 text-center leading-tight">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Cards inferiores */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div
              className="rounded-2xl p-7 space-y-3"
              style={{ background: 'linear-gradient(135deg, #1B6CA8 0%, #7B35A2 100%)' }}
            >
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/20 text-white border border-white/30 tracking-wide uppercase">
                En tiempo real
              </span>
              <h3 className="text-lg font-bold text-white leading-snug">Transcripción automática</h3>
              <p className="text-sm text-white/75 leading-relaxed">
                Captura el audio del sistema y transcribe cada pregunta al instante con Deepgram Nova-2. Latencia menor a 1.5 segundos.
              </p>
            </div>

            <div
              className="rounded-2xl p-7 space-y-3"
              style={{ background: 'linear-gradient(135deg, #1B6CA8 0%, #7B35A2 100%)' }}
            >
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/20 text-white border border-white/30 tracking-wide uppercase">
                IA generativa
              </span>
              <h3 className="text-lg font-bold text-white leading-snug">Respuestas personalizadas</h3>
              <p className="text-sm text-white/75 leading-relaxed">
                Claude genera respuestas usando tu CV y perfil. Aparecen como teleprompter invisible — solo vos las ves.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA Final ────────────────────────────────────────────────────── */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-md mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold tracking-tight mb-4">Empezá sin costo</h2>
          <p className="text-gray-500 mb-12">Sin tarjeta de crédito. Sin compromisos.</p>

          {/* Pricing card */}
          <div className="relative bg-white rounded-2xl border border-gray-200 shadow-lg p-8 text-center overflow-hidden">
            <div
              className="absolute top-0 inset-x-0 h-1"
              style={{ background: 'linear-gradient(135deg, #1B6CA8 0%, #7B35A2 100%)' }}
            />
            <span className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 border border-green-200 text-xs font-medium px-3 py-1 rounded-full mb-6">
              <Check className="w-3 h-3" /> Gratis para siempre
            </span>
            <p className="text-6xl font-black text-gray-900 mb-2">$0</p>
            <p className="text-sm text-gray-500 mb-8">10 minutos por sesión · Sesiones ilimitadas</p>
            <ul className="space-y-3 mb-8 text-left">
              {[
                'Transcripción en tiempo real',
                'Respuestas IA con tu CV',
                'Overlay invisible',
                'Sin instalación en el navegador',
              ].map(item => (
                <li key={item} className="flex items-center gap-3 text-sm text-gray-600">
                  <Check className="w-4 h-4 text-green-500 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="/register"
              className="flex items-center justify-center gap-2 w-full text-white font-semibold py-3 rounded-xl text-base transition-opacity hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #1B6CA8 0%, #7B35A2 100%)' }}
            >
              Crear cuenta gratis
              <ArrowRight className="w-4 h-4" />
            </Link>
            <p className="text-xs text-gray-400 mt-3">¿Necesitás más tiempo? Créditos desde $5</p>
          </div>

          {/* Trust bar */}
          <div className="flex items-center justify-center gap-6 mt-10 flex-wrap">
            {[
              { icon: Shield, text: 'Sin tarjeta de crédito' },
              { icon: Lock, text: 'Datos encriptados' },
              { icon: Clock, text: 'Activo en 30 segundos' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-1.5 text-xs text-gray-400">
                <Icon className="w-3.5 h-3.5" />
                {text}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="bg-gray-900 py-12">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <Image src="/logo.png" alt="listnr.io" width={100} height={33} style={{ height: 'auto' }} className="" />
              <span className="text-lg font-bold text-white">
                listnr<span style={{ color: '#F5A623' }}>.io</span>
              </span>
            </div>
            <div className="flex items-center gap-6">
              {['Ingresar', 'Registrarse'].map((label, i) => (
                <Link
                  key={label}
                  href={i === 0 ? '/login' : '/register'}
                  className="text-sm text-gray-400 hover:text-gray-200 transition-colors"
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-xs text-gray-500">© 2026 listnr.io · Todos los derechos reservados</p>
            <p className="text-xs text-gray-600">Hecho con ♥ para personas que buscan trabajo</p>
          </div>
        </div>
      </footer>

    </div>
  )
}
