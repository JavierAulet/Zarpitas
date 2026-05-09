import type { Metadata } from 'next'
import LegalPage, { Section, P, UL, LI, Table, InfoBox } from '@/components/legal/LegalPage'

export const metadata: Metadata = {
  title: 'Política de Cookies | Zarpitas.es',
  description: 'Información sobre el uso de cookies en Zarpitas.es conforme a la LSSI-CE y el RGPD.',
}

const sections = [
  { id: 'que-son', title: '1. ¿Qué son las cookies?' },
  { id: 'tipos', title: '2. Tipos de cookies que usamos' },
  { id: 'tabla', title: '3. Tabla de cookies' },
  { id: 'terceros', title: '4. Cookies de terceros' },
  { id: 'gestion', title: '5. Gestionar tus preferencias' },
  { id: 'navegador', title: '6. Configuración del navegador' },
]

export default function PoliticaCookiesPage() {
  return (
    <LegalPage
      title="Política de Cookies"
      subtitle="Información sobre las cookies utilizadas en zarpitas.es conforme a la LSSI-CE y el RGPD."
      updated="9 de mayo de 2026"
      sections={sections}
    >
      <Section id="que-son" title="1. ¿Qué son las cookies?">
        <P>Las cookies son pequeños archivos de texto que los sitios web almacenan en tu dispositivo cuando los visitas. Se utilizan ampliamente para hacer que los sitios web funcionen de manera más eficiente, así como para proporcionar información a los propietarios del sitio.</P>
        <P>Conforme al artículo 22.2 de la LSSI-CE, las cookies que no sean estrictamente necesarias para la prestación del servicio requieren tu consentimiento previo.</P>
      </Section>

      <Section id="tipos" title="2. Tipos de cookies que utilizamos">
        <div className="space-y-4">
          {[
            {
              name: '🔧 Cookies técnicas (necesarias)',
              color: 'bg-green-50 border-green/20',
              text: 'text-green',
              desc: 'Son imprescindibles para el funcionamiento del sitio. Sin ellas, servicios como el carrito de la compra o la sesión de usuario no funcionarían. No requieren consentimiento.',
            },
            {
              name: '📊 Cookies analíticas',
              color: 'bg-blue-50 border-blue-100',
              text: 'text-blue-600',
              desc: 'Nos permiten conocer cómo los usuarios navegan por el Sitio para mejorar su funcionamiento. Solo se activan si aceptas las cookies analíticas.',
            },
            {
              name: '🔄 Cookies de terceros',
              color: 'bg-orange-50 border-orange/20',
              text: 'text-orange',
              desc: 'Instaladas por servicios externos (Stripe para pagos). Están sujetas a las políticas de privacidad de dichos terceros.',
            },
          ].map((item) => (
            <div key={item.name} className={`rounded-2xl border-2 p-4 ${item.color}`}>
              <p className={`font-bold text-sm mb-1 ${item.text}`}>{item.name}</p>
              <p className="text-xs text-text-secondary">{item.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section id="tabla" title="3. Tabla detallada de cookies">
        <Table
          headers={['Cookie', 'Tipo', 'Duración', 'Finalidad']}
          rows={[
            ['sb-*-auth-token', 'Técnica', 'Sesión / 1 año', 'Autenticación de usuario (Supabase Auth)'],
            ['zarpitas_cart', 'Técnica', 'Permanente (localStorage)', 'Mantener el carrito de la compra'],
            ['zarpitas_cookie_consent', 'Técnica', '1 año (localStorage)', 'Guardar tus preferencias de cookies'],
            ['_ga', 'Analítica', '2 años', 'Identificador único de usuario para Google Analytics'],
            ['_ga_*', 'Analítica', '2 años', 'Persistencia del estado de sesión en Google Analytics'],
            ['__stripe_mid', 'Tercero (Stripe)', '1 año', 'Prevención de fraude en pagos (Stripe)'],
            ['__stripe_sid', 'Tercero (Stripe)', '30 minutos', 'Identificador de sesión de pago (Stripe)'],
          ]}
        />
      </Section>

      <Section id="terceros" title="4. Cookies de terceros">
        <P>Algunos servicios de terceros integrados en Zarpitas.es pueden instalar sus propias cookies. A continuación se detallan dichos servicios y sus políticas:</P>
        <UL>
          <LI>
            <strong>Stripe Inc.</strong> — procesador de pagos. Sus cookies se utilizan para la prevención del fraude y la correcta tramitación de los pagos. Más información en{' '}
            <a href="https://stripe.com/es/privacy" target="_blank" rel="noopener noreferrer" className="text-orange font-bold hover:underline">stripe.com/es/privacy</a>.
          </LI>
          <LI>
            <strong>Google Analytics</strong> (si aceptas cookies analíticas) — servicio de análisis web de Google LLC. Puedes optar por no ser rastreado instalando el complemento de inhabilitación para navegadores de Google Analytics disponible en{' '}
            <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" className="text-orange font-bold hover:underline">tools.google.com/dlpage/gaoptout</a>.
          </LI>
        </UL>
        <InfoBox>
          Las transferencias de datos a Google (EE.UU.) se realizan bajo las garantías de las Cláusulas Contractuales Tipo aprobadas por la Comisión Europea.
        </InfoBox>
      </Section>

      <Section id="gestion" title="5. Gestionar tus preferencias de cookies">
        <P>Cuando visitas Zarpitas.es por primera vez, aparece un banner de cookies que te permite elegir:</P>
        <UL>
          <LI><strong>Aceptar todas:</strong> habilita cookies técnicas, analíticas y de terceros.</LI>
          <LI><strong>Solo necesarias:</strong> habilita únicamente las cookies imprescindibles para el funcionamiento del Sitio.</LI>
          <LI><strong>Configurar:</strong> te permite elegir qué categorías de cookies aceptas.</LI>
        </UL>
        <P>Puedes modificar tus preferencias en cualquier momento haciendo clic en el enlace «Gestionar cookies» en el pie de página.</P>
        <InfoBox>
          Las cookies técnicas no pueden desactivarse ya que son imprescindibles para que el sitio funcione correctamente.
        </InfoBox>
      </Section>

      <Section id="navegador" title="6. Configuración del navegador">
        <P>También puedes configurar tu navegador para rechazar todas las cookies o para que te avise cuando se envía una cookie. A continuación encontrarás instrucciones para los navegadores más comunes:</P>
        <UL>
          <LI><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-orange font-bold hover:underline">Google Chrome</a></LI>
          <LI><a href="https://support.mozilla.org/es/kb/habilitar-y-deshabilitar-cookies" target="_blank" rel="noopener noreferrer" className="text-orange font-bold hover:underline">Mozilla Firefox</a></LI>
          <LI><a href="https://support.apple.com/es-es/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-orange font-bold hover:underline">Safari</a></LI>
          <LI><a href="https://support.microsoft.com/es-es/microsoft-edge/eliminar-las-cookies-en-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer" className="text-orange font-bold hover:underline">Microsoft Edge</a></LI>
        </UL>
        <P>Ten en cuenta que deshabilitar las cookies puede afectar al funcionamiento de algunas partes de Zarpitas.es, como el carrito de la compra o el inicio de sesión.</P>
      </Section>
    </LegalPage>
  )
}
