'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Truck, RotateCcw, CreditCard, Package, MessageCircle } from 'lucide-react'
import Link from 'next/link'

interface FAQItem {
  q: string
  a: string
}

interface FAQSection {
  id: string
  icon: React.ElementType
  title: string
  color: string
  items: FAQItem[]
}

const sections: FAQSection[] = [
  {
    id: 'envios',
    icon: Truck,
    title: 'Envíos',
    color: 'text-blue-500',
    items: [
      {
        q: '¿Cuánto tarda en llegar mi pedido?',
        a: 'Los pedidos se preparan en 24-48 horas y la entrega suele realizarse en 5-12 días hábiles. En cuanto tu pedido salga recibirás un email con el número de seguimiento para que puedas ver dónde está en cada momento.',
      },
      {
        q: '¿El envío es gratuito?',
        a: 'Sí, todos los pedidos superiores a 40€ tienen envío completamente gratuito a España peninsular. Para pedidos inferiores aplicamos una tarifa plana de 3,99€.',
      },
      {
        q: '¿Enviáis a Baleares, Canarias y Ceuta/Melilla?',
        a: 'Enviamos a toda España peninsular e Islas Baleares sin coste adicional. Para Canarias, Ceuta y Melilla escríbenos a hola@zarpitas.es para confirmar disponibilidad.',
      },
      {
        q: '¿Puedo cambiar la dirección de entrega después de hacer el pedido?',
        a: 'Si tu pedido aún está en preparación, escríbenos cuanto antes a hola@zarpitas.es con tu número de pedido y la nueva dirección e intentaremos cambiarlo. Una vez enviado, no es posible modificar el destino.',
      },
    ],
  },
  {
    id: 'seguimiento',
    icon: Package,
    title: 'Seguimiento',
    color: 'text-orange',
    items: [
      {
        q: '¿Cómo puedo rastrear mi pedido?',
        a: 'En cuanto tu pedido salga te enviamos un email con el número de seguimiento. Con él puedes ver en tiempo real dónde está tu paquete y la fecha estimada de entrega.',
      },
      {
        q: '¿Cuándo recibo el número de seguimiento?',
        a: 'Lo recibirás por email en las 24-48 horas siguientes a la confirmación del pago, una vez que tu pedido esté preparado y listo para salir.',
      },
      {
        q: 'El seguimiento no muestra actualizaciones, ¿qué hago?',
        a: 'El seguimiento se actualiza cada vez que el paquete pasa por un punto de control. Si llevas más de 3 días sin nuevas actualizaciones, escríbenos a hola@zarpitas.es y lo comprobamos para ti.',
      },
      {
        q: '¿Qué pasa si mi pedido aparece como entregado pero no lo he recibido?',
        a: 'Comprueba primero si algún vecino o conserjería lo ha recogido. Si no lo encuentras, escríbenos a hola@zarpitas.es con tu número de pedido y lo solucionamos en menos de 24 horas.',
      },
    ],
  },
  {
    id: 'devoluciones',
    icon: RotateCcw,
    title: 'Devoluciones',
    color: 'text-green',
    items: [
      {
        q: '¿Cuál es la política de devoluciones?',
        a: 'Tienes 30 días desde la recepción del pedido para solicitar una devolución. El producto debe estar en su estado original, sin usar y con el embalaje intacto.',
      },
      {
        q: '¿Cómo inicio una devolución?',
        a: 'Escríbenos a hola@zarpitas.es con el asunto "Devolución" indicando tu número de pedido y el motivo. Te responderemos en menos de 24 horas con las instrucciones.',
      },
      {
        q: '¿Me devuelven el dinero si el producto está defectuoso?',
        a: 'Si el producto llega defectuoso o dañado, te reembolsamos el 100% incluidos los gastos de envío. Simplemente envíanos una foto del defecto y tu número de pedido.',
      },
      {
        q: '¿Cuánto tarda el reembolso?',
        a: 'Una vez aprobada la devolución, el reembolso se procesa en 5-7 días hábiles y aparecerá en tu método de pago original. A veces los bancos tardan unos días adicionales en reflejarlo.',
      },
    ],
  },
  {
    id: 'pagos',
    icon: CreditCard,
    title: 'Pagos',
    color: 'text-purple-500',
    items: [
      {
        q: '¿Qué métodos de pago aceptáis?',
        a: 'Aceptamos tarjeta de crédito/débito (Visa, Mastercard), PayPal y Bizum. Todos los pagos se procesan de forma segura a través de Stripe, con cifrado SSL de 256 bits.',
      },
      {
        q: '¿Es seguro pagar en Zarpitas.es?',
        a: 'Absolutamente. Nunca almacenamos los datos de tu tarjeta. Todos los pagos van directamente a través de Stripe, uno de los procesadores de pago más seguros del mundo, con certificación PCI DSS nivel 1.',
      },
      {
        q: '¿Cuándo se cobra el pago?',
        a: 'El pago se realiza en el momento de confirmar el pedido. No hacemos cargos previos ni reservas: solo se cobra cuando tú confirmas la compra.',
      },
      {
        q: 'He visto un cargo que no reconozco, ¿qué hago?',
        a: 'Escríbenos de inmediato a hola@zarpitas.es con los últimos 4 dígitos de la tarjeta y la fecha del cargo. Lo investigamos y resolvemos en menos de 24 horas.',
      },
    ],
  },
]

function AccordionItem({ item, isOpen, onToggle }: { item: FAQItem; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="border-b border-cream-deep last:border-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 py-5 text-left"
      >
        <span className="font-semibold text-text-primary text-sm leading-snug">{item.q}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.22 }}
          className="flex-shrink-0 w-6 h-6 rounded-full bg-cream-warm border border-cream-deep flex items-center justify-center"
        >
          <ChevronDown size={13} className="text-text-muted" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <p className="pb-5 text-text-secondary text-sm leading-relaxed">{item.a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function FAQPage() {
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({})

  const toggle = (key: string) => {
    setOpenItems((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <main className="min-h-screen bg-cream pt-24 pb-20">
      {/* Header */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-14">
        <p className="text-xs font-bold text-orange uppercase tracking-widest mb-3">Ayuda</p>
        <h1 className="font-display font-black text-4xl md:text-5xl text-text-primary mb-4">
          Preguntas frecuentes
        </h1>
        <p className="text-text-secondary text-lg">
          Encuentra respuesta a las dudas más comunes. Si no encuentras lo que buscas,{' '}
          <Link href="/contacto" className="text-orange font-semibold hover:underline">
            escríbenos
          </Link>
          .
        </p>
      </div>

      {/* FAQ sections */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {sections.map((section) => {
          const Icon = section.icon
          return (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.4 }}
              className="bg-white rounded-3xl border-2 border-cream-deep p-6 md:p-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-2xl bg-cream-warm border border-cream-deep flex items-center justify-center">
                  <Icon size={18} className={section.color} />
                </div>
                <h2 className="font-display font-black text-xl text-text-primary">{section.title}</h2>
              </div>
              <div>
                {section.items.map((item, i) => (
                  <AccordionItem
                    key={i}
                    item={item}
                    isOpen={!!openItems[`${section.id}-${i}`]}
                    onToggle={() => toggle(`${section.id}-${i}`)}
                  />
                ))}
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* CTA contact */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
        className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 mt-10"
      >
        <div className="bg-orange-50 border-2 border-orange/15 rounded-3xl p-8 text-center">
          <div className="w-12 h-12 rounded-2xl bg-orange/10 border border-orange/20 flex items-center justify-center mx-auto mb-4">
            <MessageCircle size={22} className="text-orange" />
          </div>
          <h3 className="font-display font-black text-xl text-text-primary mb-2">
            ¿No has encontrado tu respuesta?
          </h3>
          <p className="text-text-secondary text-sm mb-5">
            Nuestro equipo te responde en menos de 24 horas.
          </p>
          <Link
            href="/contacto"
            className="inline-flex items-center gap-2 bg-orange text-white font-bold px-6 py-3 rounded-full hover:bg-orange-dark transition-colors text-sm"
          >
            Contactar ahora
          </Link>
        </div>
      </motion.div>
    </main>
  )
}
