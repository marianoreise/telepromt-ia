import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function KnowledgePage() {
  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Base de conocimiento</h1>
      <Card>
        <CardHeader>
          <CardTitle>CV / Resume</CardTitle>
          <CardDescription>Subí tu CV para que el asistente pueda responder con tu experiencia real</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed rounded-lg p-8 text-center text-gray-400">
            <p className="text-sm">Arrastrá tu CV aquí o</p>
            <Button variant="outline" className="mt-2" disabled>
              Seleccionar archivo (PDF, DOCX)
            </Button>
            <p className="text-xs mt-2">Disponible en Sprint 4-5</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
