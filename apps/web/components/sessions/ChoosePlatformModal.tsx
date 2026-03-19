'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Monitor, Globe, ChevronDown, ChevronUp, Check, Minus } from 'lucide-react'

const DESKTOP_SCHEME = process.env.NEXT_PUBLIC_DESKTOP_SCHEME ?? 'listnr'

interface ChoosePlatformModalProps {
  open: boolean
  sessionId: string
  onClose: () => void
}

export default function ChoosePlatformModal({
  open,
  sessionId,
  onClose,
}: ChoosePlatformModalProps) {
  const router = useRouter()
  const [showInfo, setShowInfo] = useState(false)

  function handleDesktop() {
    window.open(`${DESKTOP_SCHEME}://session/${sessionId}`, '_blank')
    onClose()
  }

  function handleBrowser() {
    router.push(`/sessions/${sessionId}`)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose() }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            Elegir plataforma
          </DialogTitle>
          <DialogDescription>
            ¿Cómo querés conectarte a tu sesión de entrevista?
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 py-2">
          {/* Opcion escritorio */}
          <div className="relative">
            <Badge
              className="absolute -top-2 right-3 z-10 bg-emerald-500 text-white text-[10px] px-2 py-0.5 hover:bg-emerald-500"
            >
              Recomendado
            </Badge>
            <button
              type="button"
              onClick={handleDesktop}
              className="w-full flex items-center gap-3 rounded-xl bg-gray-900 px-4 py-4 text-white transition-colors hover:bg-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2"
            >
              <Monitor className="h-5 w-5 shrink-0" />
              <span className="font-medium">App de escritorio</span>
            </button>
          </div>

          {/* Separador */}
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="text-xs text-gray-400">o</span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          {/* Opcion navegador */}
          <Button
            type="button"
            variant="outline"
            onClick={handleBrowser}
            className="w-full justify-start gap-3 rounded-xl px-4 py-4 h-auto font-medium"
          >
            <Globe className="h-5 w-5 shrink-0" />
            Abrir en el navegador
          </Button>

          {/* Toggle informativo */}
          <button
            type="button"
            onClick={() => setShowInfo((prev) => !prev)}
            className="flex items-center gap-1.5 self-start text-sm text-blue-600 hover:text-blue-700 focus-visible:outline-none focus-visible:underline"
          >
            <span>¿Escritorio vs Navegador?</span>
            {showInfo ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </button>

          {/* Panel informativo expandible */}
          {showInfo && (
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm">
              <div className="mb-3">
                <p className="mb-2 font-semibold text-gray-800 flex items-center gap-1.5">
                  <Monitor className="h-4 w-4" />
                  App de escritorio
                </p>
                <ul className="space-y-1.5">
                  <FeatureItem type="check" text="Completamente invisible durante screen share" />
                  <FeatureItem type="check" text="Captura audio del sistema sin extensión" />
                  <FeatureItem type="check" text="Funciona sin conexión a internet (modo offline)" />
                </ul>
              </div>

              <div className="mt-3 border-t border-gray-200 pt-3">
                <p className="mb-2 font-semibold text-gray-800 flex items-center gap-1.5">
                  <Globe className="h-4 w-4" />
                  Navegador
                </p>
                <ul className="space-y-1.5">
                  <FeatureItem type="check" text="No requiere instalación" />
                  <FeatureItem type="check" text="Disponible en cualquier dispositivo" />
                  <FeatureItem type="partial" text="Requiere extensión de Chrome para captura de audio" />
                </ul>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

interface FeatureItemProps {
  type: 'check' | 'partial'
  text: string
}

function FeatureItem({ type, text }: FeatureItemProps) {
  return (
    <li className="flex items-start gap-2 text-gray-600">
      {type === 'check' ? (
        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
      ) : (
        <Minus className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
      )}
      <span>{text}</span>
    </li>
  )
}
