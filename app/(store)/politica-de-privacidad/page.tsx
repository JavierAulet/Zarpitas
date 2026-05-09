import type { Metadata } from 'next'
import LegalPage, { Section, P, UL, LI, Table, InfoBox } from '@/components/legal/LegalPage'

export const metadata: Metadata = {
  title: 'Política de Privacidad | Zarpitas.es',
  description: 'Cómo Zarpitas.es recoge, trata y protege tus datos personales conforme al RGPD y la LOPDGDD.',
}

const sections = [
  { id: 'responsable', title: '1. Responsable del tratamiento' },
  { id: 'datos', title: '2. Datos que recogemos' },
  { id: 'finalidad', title: '3. Finalidad y base legitimadora' },
  { id: 'conservacion', title: '4. Conservación de los datos' },
  { id: 'cesion', title: '5. Cesión de datos a terceros' },
  { id: 'derechos', title: '6. Tus derechos (ARCO+)' },
  { id: 'menores', title: '7. Menores de edad' },
  { id: 'seguridad', title: '8. Seguridad de los datos' },
  { id: 'cambios', title: '9. Cambios en la política' },
]

export default function PoliticaPrivacidadPage() {
  return (
    <LegalPage
      title="Política de Privacidad"
      subtitle="Información sobre el tratamiento de datos personales conforme al RGPD (UE) 2016/679 y la LOPDGDD 3/2018."
      updated="9 de mayo de 2026"
      sections={sections}
    >
      <Section id="responsable" title="1. Responsable del tratamiento">
        <div className="bg-cream-warm border-2 border-cream-deep rounded-2xl p-5 space-y-2">
          {[
            ['Responsable', 'Javier Aulet Fraga'],
            ['Email', 'hola@zarpitas.es'],
            ['Domicilio', 'Madrid, España'],
            ['Actividad', 'Comercio electrónico de productos para mascotas'],
          ].map(([label, value]) => (
            <div key={label} className="flex gap-3 text-sm">
              <span className="font-bold text-text-primary w-36 flex-shrink-0">{label}:</span>
              <span className="text-text-secondary">{value}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section id="datos" title="2. Datos personales que recogemos">
        <P>En función de cómo interactúes con Zarpitas.es, podemos recoger los siguientes datos:</P>
        <Table
          headers={['Dato', 'Cuándo se recoge', 'Obligatorio']}
          rows={[
            ['Nombre y apellidos', 'Al realizar un pedido o crear cuenta', 'Sí'],
            ['Dirección de email', 'Al realizar un pedido, crear cuenta o suscribirse', 'Sí'],
            ['Dirección postal', 'Al realizar un pedido (envío)', 'Sí'],
            ['Número de teléfono', 'Al realizar un pedido', 'Sí'],
            ['Datos de navegación', 'Automáticamente al visitar el Sitio', 'Técnico'],
            ['Historial de pedidos', 'Al completar compras', 'Automático'],
          ]}
        />
        <P>No recogemos datos de tarjeta de crédito directamente: el pago es gestionado íntegramente por <strong>Stripe</strong>, que actúa como procesador de pagos bajo sus propias políticas de privacidad.</P>
      </Section>

      <Section id="finalidad" title="3. Finalidad del tratamiento y base legitimadora">
        <Table
          headers={['Finalidad', 'Base legitimadora', 'Detalle']}
          rows={[
            ['Gestión de pedidos', 'Ejecución de contrato (art. 6.1.b RGPD)', 'Procesar, enviar y gestionar tu pedido'],
            ['Comunicaciones de pedido', 'Ejecución de contrato (art. 6.1.b RGPD)', 'Emails transaccionales: confirmación, envío, entrega'],
            ['Creación de cuenta', 'Ejecución de contrato (art. 6.1.b RGPD)', 'Acceso al área de cliente, historial de pedidos'],
            ['Newsletter y ofertas', 'Consentimiento (art. 6.1.a RGPD)', 'Solo si marcas la casilla de suscripción'],
            ['Cumplimiento legal', 'Obligación legal (art. 6.1.c RGPD)', 'Obligaciones fiscales y contables (5 años)'],
            ['Mejora del servicio', 'Interés legítimo (art. 6.1.f RGPD)', 'Análisis agregado y anónimo de uso del sitio'],
          ]}
        />
        <InfoBox>
          <strong>Newsletter:</strong> si en algún momento deseas dejar de recibir comunicaciones comerciales, puedes darte de baja en cualquier momento haciendo clic en el enlace «Cancelar suscripción» de cualquier email o escribiéndonos a <a href="mailto:hola@zarpitas.es" className="text-orange font-bold hover:underline">hola@zarpitas.es</a>.
        </InfoBox>
      </Section>

      <Section id="conservacion" title="4. Plazo de conservación de los datos">
        <UL>
          <LI><strong>Datos de pedidos:</strong> durante la relación comercial y, finalizada esta, durante <strong>5 años</strong> para cumplir con las obligaciones fiscales y contables (art. 30 Código de Comercio y normativa tributaria).</LI>
          <LI><strong>Cuenta de usuario:</strong> mientras la cuenta esté activa. Si solicitas la eliminación de tu cuenta, eliminaremos los datos en un plazo de 30 días, salvo los que debamos conservar por obligación legal.</LI>
          <LI><strong>Newsletter:</strong> hasta que retires el consentimiento.</LI>
          <LI><strong>Datos de navegación (cookies):</strong> según los plazos indicados en la Política de Cookies.</LI>
        </UL>
      </Section>

      <Section id="cesion" title="5. Cesión de datos a terceros">
        <P>No vendemos ni cedemos tus datos personales a terceros con fines comerciales. Únicamente compartimos los datos necesarios con los siguientes proveedores de servicios, que actúan como <strong>encargados del tratamiento</strong> bajo contrato:</P>
        <Table
          headers={['Proveedor', 'Datos compartidos', 'Finalidad', 'Política']}
          rows={[
            ['Stripe Inc.', 'Email, nombre, dirección de facturación', 'Procesamiento de pagos', 'stripe.com/privacy'],
            ['AliExpress / Alibaba Group', 'Nombre, dirección de envío, teléfono', 'Fulfillment y envío del pedido', 'aliexpress.com/p/privacy-policy'],
            ['Supabase Inc.', 'Todos los datos de la cuenta', 'Infraestructura y base de datos', 'supabase.com/privacy'],
          ]}
        />
        <P>En los casos en que sea legalmente exigible, podremos facilitar datos a autoridades públicas (Agencia Tributaria, Fuerzas de Seguridad, etc.).</P>
        <InfoBox>
          Las transferencias internacionales de datos (Stripe, Supabase) se realizan con las garantías adecuadas conforme al RGPD, incluyendo Cláusulas Contractuales Tipo aprobadas por la Comisión Europea.
        </InfoBox>
      </Section>

      <Section id="derechos" title="6. Tus derechos sobre tus datos (ARCO+)">
        <P>Conforme al RGPD y la LOPDGDD, puedes ejercer en cualquier momento los siguientes derechos:</P>
        <UL>
          <LI><strong>Acceso:</strong> obtener confirmación de si tratamos tus datos y, en su caso, una copia de los mismos.</LI>
          <LI><strong>Rectificación:</strong> solicitar la corrección de datos inexactos o incompletos.</LI>
          <LI><strong>Supresión («derecho al olvido»):</strong> solicitar la eliminación de tus datos cuando, entre otros motivos, ya no sean necesarios para los fines para los que se recogieron.</LI>
          <LI><strong>Oposición:</strong> oponerte al tratamiento de tus datos, en particular para fines de marketing directo.</LI>
          <LI><strong>Limitación:</strong> solicitar que suspendamos el tratamiento de tus datos en determinadas circunstancias.</LI>
          <LI><strong>Portabilidad:</strong> recibir tus datos en formato estructurado y de uso común para transmitirlos a otro responsable.</LI>
          <LI><strong>Retirada del consentimiento:</strong> en cualquier momento, sin que ello afecte a la licitud del tratamiento previo.</LI>
        </UL>
        <P>Para ejercer cualquiera de estos derechos, escríbenos a <a href="mailto:hola@zarpitas.es" className="text-orange font-bold hover:underline">hola@zarpitas.es</a> indicando tu nombre, el derecho que deseas ejercer y adjuntando una copia de tu DNI o documento equivalente. Responderemos en el plazo máximo de <strong>30 días</strong>.</P>
        <P>Si consideras que el tratamiento de tus datos no es conforme a la normativa, puedes presentar una reclamación ante la <strong>Agencia Española de Protección de Datos (AEPD)</strong> en <a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer" className="text-orange font-bold hover:underline">www.aepd.es</a>.</P>
      </Section>

      <Section id="menores" title="7. Menores de edad">
        <P>Zarpitas.es no está dirigido a menores de 14 años. No recogemos conscientemente datos personales de menores de dicha edad. Si eres padre, madre o tutor legal y crees que tu hijo nos ha proporcionado datos personales, contáctanos en <a href="mailto:hola@zarpitas.es" className="text-orange font-bold hover:underline">hola@zarpitas.es</a> y procederemos a eliminarlos.</P>
      </Section>

      <Section id="seguridad" title="8. Seguridad de los datos">
        <P>Aplicamos medidas técnicas y organizativas apropiadas para proteger tus datos personales frente a acceso no autorizado, pérdida o divulgación accidental, incluyendo:</P>
        <UL>
          <LI>Conexión cifrada mediante <strong>HTTPS/TLS</strong> en todo el sitio.</LI>
          <LI>Almacenamiento en servidores con <strong>acceso restringido</strong> (Supabase, infraestructura UE).</LI>
          <LI>Contraseñas almacenadas con <strong>hash seguro</strong> (bcrypt mediante Supabase Auth).</LI>
          <LI>Pagos procesados por <strong>Stripe</strong>, certificado PCI DSS Level 1.</LI>
        </UL>
      </Section>

      <Section id="cambios" title="9. Cambios en esta Política de Privacidad">
        <P>Podemos actualizar esta Política de Privacidad ocasionalmente para reflejar cambios en nuestras prácticas o por razones operativas, legales o regulatorias. Cuando realicemos cambios materiales, te lo notificaremos por email o mediante un aviso destacado en el Sitio antes de que los cambios entren en vigor.</P>
        <P>Te recomendamos revisar periódicamente esta página. La fecha de la última actualización figura en la cabecera de este documento.</P>
      </Section>
    </LegalPage>
  )
}
