'use client'
import { useState, useEffect } from 'react'
import { Package, RefreshCw } from 'lucide-react'
import type { TrackingEvent } from '@/lib/supabase/types'

interface Props {
  orderId: string
  initialEvents: TrackingEvent[]
}

export default function OrderTracker({ orderId, initialEvents }: Props) {
  const [events, setEvents] = useState<TrackingEvent[]>(initialEvents)
  const [carrier, setCarrier] = useState<string | null>(null)
  const [trackingNumber, setTrackingNumber] = useState<string | null>(null)
  const [loading, setLoading] = useState(initialEvents.length === 0)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  const fetchTracking = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/orders/tracking?order_id=${orderId}`)
      if (!res.ok) return
      const data = await res.json()
      if (data.events?.length) setEvents(data.events)
      if (data.carrier) setCarrier(data.carrier)
      if (data.tracking_number) setTrackingNumber(data.tracking_number)
      setLastRefresh(new Date())
    } catch {
      // silent — tracking is best-effort
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (initialEvents.length === 0) {
      fetchTracking()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId])

  return (
    <div className="bg-white border-2 border-cream-deep rounded-3xl p-6 mb-5 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Package size={16} className="text-orange" />
          <h2 className="font-bold text-text-primary text-sm uppercase tracking-wide">Seguimiento</h2>
        </div>
        <button
          onClick={fetchTracking}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs text-text-muted hover:text-orange transition-colors disabled:opacity-40"
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          Actualizar
        </button>
      </div>

      {trackingNumber && (
        <div className="mb-4 px-3 py-2 bg-cream-warm rounded-xl border border-cream-deep text-xs">
          <span className="text-text-muted">Número de seguimiento: </span>
          <span className="font-mono font-bold text-text-primary">{trackingNumber}</span>
          {carrier && <span className="text-text-muted ml-2">· {carrier}</span>}
        </div>
      )}

      {loading && events.length === 0 && (
        <div className="flex items-center gap-2 text-sm text-text-muted py-4">
          <RefreshCw size={14} className="animate-spin" />
          Obteniendo información de seguimiento...
        </div>
      )}

      {!loading && events.length === 0 && (
        <p className="text-sm text-text-muted py-2">
          El seguimiento estará disponible una vez que el paquete sea recogido por el transportista.
        </p>
      )}

      {events.length > 0 && (
        <div className="space-y-3">
          {events.map((event, i) => (
            <div key={i} className={`flex gap-3 ${i === 0 ? 'opacity-100' : 'opacity-60'}`}>
              <div className="flex flex-col items-center">
                <div className={`w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0 ${i === 0 ? 'bg-orange' : 'bg-cream-deep'}`} />
                {i < events.length - 1 && <div className="w-0.5 h-full bg-cream-deep mt-1" />}
              </div>
              <div className="pb-3">
                <p className="text-xs font-medium text-text-primary">{event.event_desc}</p>
                {event.address && <p className="text-xs text-text-muted mt-0.5">{event.address}</p>}
                <p className="text-xs text-text-muted mt-0.5">{event.event_date}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {lastRefresh && (
        <p className="text-[10px] text-text-muted mt-3">
          Actualizado: {lastRefresh.toLocaleTimeString('es-ES')}
        </p>
      )}
    </div>
  )
}
