import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const PLANES = [
  { nombre: 'Starter', creditos: 10, precio: '$5 USD', minutos: 300 },
  { nombre: 'Pro', creditos: 25, precio: '$10 USD', minutos: 750, popular: true },
  { nombre: 'Max', creditos: 60, precio: '$20 USD', minutos: 1800 },
]

export default function BillingPage() {
  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold">Créditos</h1>
      <p className="text-gray-500">1 crédito = 30 minutos de sesión activa. Los créditos no vencen.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PLANES.map(plan => (
          <Card key={plan.nombre} className={plan.popular ? 'border-blue-500 border-2' : ''}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{plan.nombre}</CardTitle>
                {plan.popular && <Badge>Popular</Badge>}
              </div>
              <CardDescription>{plan.creditos} créditos · {plan.minutos} min</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-2xl font-bold">{plan.precio}</p>
              <Button className="w-full" disabled>
                Pagar con Mercado Pago
              </Button>
              <p className="text-xs text-gray-400 text-center">Disponible en Sprint 6</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
