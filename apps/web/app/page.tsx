import Link from 'next/link'
import Image from 'next/image'
import { Mic, Sparkles, Eye, BookOpen, ArrowRight, Check } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900 antialiased">

      {/* ── Navbar ──────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="listnr.io" width={32} height={32} className="rounded-lg" />
            <span className="text-xl font-bold tracking-tight">
              listnr<span style={{ color: '#F5A623' }}>.io</span>
            </span>
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
        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-xs font-medium px-3 py-1.5 rounded-full mb-8 border border-blue-100">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
          Asistente IA en tiempo real · gratuito para empezar
        </div>

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

      {/* ── Cómo funciona ──────────────────────────────────��─────────────── */}
      <section className="bg-gray-50 py-24">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight mb-3">Cómo funciona</h2>
            <p className="text-gray-500">Listo en menos de 2 minutos. Sin instalación.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Subí tu CV',
                description: 'Cargá tu CV o resume. La IA lo usa como contexto para darte respuestas personalizadas y relevantes.',
                icon: BookOpen,
              },
              {
                step: '02',
                title: 'Activá la escucha',
                description: 'listnr.io captura el audio de tu entrevista desde el navegador. Nada se instala, nada se almacena.',
                icon: Mic,
              },
              {
                step: '03',
                title: 'Recibí respuestas en tiempo real',
                description: 'La IA detecta las preguntas automáticamente y te muestra respuestas claras en pantalla. Solo vos las ves.',
                icon: Sparkles,
              },
            ].map(({ step, title, description, icon: Icon }) => (
              <div key={step} className="relative bg-white rounded-2xl p-7 border border-gray-100 shadow-sm">
                <span className="text-xs font-bold text-gray-300 tracking-widest mb-4 block">{step}</span>
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: 'linear-gradient(135deg, #1B6CA8 0%, #7B35A2 100%)' }}
                >
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────────── */}
      <section className="py-24">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight mb-3">Todo lo que necesitás en una entrevista</h2>
            <p className="text-gray-500">Diseñado para que puedas enfocarte en la conversación.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {[
              {
                icon: Sparkles,
                title: 'Respuestas IA con contexto de tu CV',
                description: 'La IA conoce tu experiencia y la usa para generar respuestas auténticas y personalizadas, no genéricas.',
              },
              {
                icon: Mic,
                title: 'Transcripción automática en tiempo real',
                description: 'Capturamos el audio con Deepgram Nova-2. No hay delays, no hay errores de interpretación.',
              },
              {
                icon: Eye,
                title: 'Invisible para el entrevistador',
                description: 'Las respuestas solo las ves vos. listnr.io no aparece en ningún screen share ni grabación.',
              },
              {
                icon: BookOpen,
                title: 'Funciona en cualquier plataforma',
                description: 'Zoom, Meet, Teams, Webex. Si la entrevista es por video, listnr.io funciona.',
              },
            ].map(({ icon: Icon, title, description }) => (
              <div key={title} className="flex gap-4 p-6 rounded-2xl border border-gray-100 hover:border-gray-200 transition-colors">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: 'linear-gradient(135deg, #1B6CA8 0%, #7B35A2 100%)' }}
                >
                  <Icon className="w-5 h-5 text-white" />
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

      {/* ── CTA Final ────────────────────────────────────────────────────── */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold tracking-tight mb-4">
            Empezá gratis hoy
          </h2>
          <p className="text-gray-500 text-lg mb-2">
            10 minutos por sesión sin costo. Sin tarjeta de crédito.
          </p>
          <p className="text-gray-400 text-sm mb-10">
            Cuando estés listo para más, los créditos adicionales son accesibles.
          </p>

          <div className="flex flex-col items-center gap-4">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 text-white font-medium px-8 py-4 rounded-xl text-base transition-opacity hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #1B6CA8 0%, #7B35A2 100%)' }}
            >
              Crear cuenta gratis
              <ArrowRight className="w-4 h-4" />
            </Link>

            <ul className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6 text-sm text-gray-500">
              {['Sin tarjeta de crédito', 'Registro en 30 segundos', 'Cancelá cuando quieras'].map(item => (
                <li key={item} className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-green-500" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-gray-100 py-8">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="listnr.io" width={24} height={24} className="rounded-md" />
            <span className="text-sm font-semibold">
              listnr<span style={{ color: '#F5A623' }}>.io</span>
            </span>
          </div>
          <p className="text-xs text-gray-400">© 2026 listnr.io · Todos los derechos reservados</p>
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <Link href="/login" className="hover:text-gray-600 transition-colors">Ingresar</Link>
            <Link href="/register" className="hover:text-gray-600 transition-colors">Registrarse</Link>
          </div>
        </div>
      </footer>

    </div>
  )
}
