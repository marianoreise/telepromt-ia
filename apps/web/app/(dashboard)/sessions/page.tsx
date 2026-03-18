import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function SessionsPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Sesiones</h1>
      <Card>
        <CardHeader>
          <CardTitle>Historial de sesiones</CardTitle>
          <CardDescription>Tus sesiones activas aparecerán aquí una vez que uses la app desktop</CardDescription>
        </CardHeader>
      </Card>
    </div>
  )
}
