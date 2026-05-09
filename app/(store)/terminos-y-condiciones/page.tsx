import type { Metadata } from 'next'
import LegalPage, { Section, P, UL, LI, Table, InfoBox } from '@/components/legal/LegalPage'

export const metadata: Metadata = {
  title: 'Términos y Condiciones | Zarpitas.es',
  description: 'Condiciones generales de contratación de Zarpitas.es: proceso de compra, envíos, devoluciones y garantías.',
}

const sections = [
  { id: 'introduccion', title: '1. Introducción' },
  { id: 'proceso-compra', title: '2. Proceso de compra' },
  { id: 'precios', title: '3. Precios y pago' },
  { id: 'envios', title: '4. Envíos y plazos de entrega' },
  { id: 'devolucion', title: '5. Derecho de desistimiento' },
  { id: 'devoluciones', title: '6. Devoluciones y reembolsos' },
  { id: 'garantia', title: '7. Garantía legal' },
  { id: 'responsabilidad', title: '8. Responsabilidad' },
  { id: 'legislacion', title: '9. Legislación aplicable' },
]

export default function TerminosCondicionesPage() {
  return (
    <LegalPage
      title="Términos y Condiciones"
      subtitle="Condiciones generales de contratación aplicables a todas las compras realizadas en zarpitas.es."
      updated="9 de mayo de 2026"
      sections={sections}
    >
      <Section id="introduccion" title="1. Introducción">
        <P>Las presentes Condiciones Generales de Contratación regulan la adquisición de los productos ofertados en el sitio web <strong>zarpitas.es</strong>, titularidad de Javier Aulet Fraga (en adelante, «Zarpitas»).</P>
        <P>La realización de un pedido en Zarpitas implica la aceptación plena y sin reservas de estas condiciones. Zarpitas se reserva el derecho a modificarlas en cualquier momento, siendo aplicables las vigentes en el momento de la realización del pedido.</P>
        <InfoBox>
          Para cualquier consulta puedes contactarnos en <a href="mailto:hola@zarpitas.es" className="text-orange font-bold hover:underline">hola@zarpitas.es</a> antes de realizar tu compra.
        </InfoBox>
      </Section>

      <Section id="proceso-compra" title="2. Proceso de compra">
        <P>El proceso de compra en Zarpitas.es consta de los siguientes pasos:</P>
        <UL>
          <LI><strong>Selección de producto:</strong> elige el producto y añádelo al carrito de la compra.</LI>
          <LI><strong>Carrito:</strong> revisa los productos seleccionados y sus precios.</LI>
          <LI><strong>Datos de contacto y envío:</strong> introduce tu email, teléfono y dirección de entrega.</LI>
          <LI><strong>Pago:</strong> introduce tus datos de pago a través de nuestra plataforma segura (Stripe).</LI>
          <LI><strong>Confirmación:</strong> recibirás un email de confirmación con el resumen de tu pedido.</LI>
        </UL>
        <P>El contrato de compraventa se perfecciona en el momento en que Zarpitas confirma la recepción del pedido y el pago mediante email. Zarpitas se reserva el derecho a rechazar o cancelar pedidos en casos excepcionales (producto sin stock, error de precio manifiesto, etc.), procediendo en tal caso al reembolso íntegro del importe abonado.</P>
      </Section>

      <Section id="precios" title="3. Precios y métodos de pago">
        <P>Todos los precios indicados en Zarpitas.es están expresados en <strong>euros (€)</strong> e incluyen el <strong>IVA</strong> aplicable conforme a la legislación española vigente.</P>
        <UL>
          <LI>Los gastos de envío se muestran desglosados antes de confirmar el pedido.</LI>
          <LI>Zarpitas se reserva el derecho a modificar los precios en cualquier momento, siendo aplicable el precio vigente en el momento de la realización del pedido.</LI>
        </UL>
        <P>Métodos de pago aceptados:</P>
        <Table
          headers={['Método', 'Procesador', 'Comisión para el cliente']}
          rows={[
            ['Tarjeta de crédito/débito (Visa, Mastercard)', 'Stripe', 'Sin coste adicional'],
            ['Apple Pay', 'Stripe', 'Sin coste adicional'],
            ['Google Pay', 'Stripe', 'Sin coste adicional'],
          ]}
        />
        <P>El pago es gestionado íntegramente por <strong>Stripe Inc.</strong>, con certificación PCI DSS Level 1. Zarpitas no almacena en ningún momento los datos de tu tarjeta.</P>
      </Section>

      <Section id="envios" title="4. Envíos y plazos de entrega">
        <InfoBox>
          <strong>Importante:</strong> Zarpitas.es opera bajo un modelo de <em>dropshipping</em>. Los productos son enviados directamente desde el proveedor hasta tu domicilio.
        </InfoBox>
        <Table
          headers={['Destino', 'Plazo estimado', 'Coste']}
          rows={[
            ['España peninsular', '3–15 días hábiles', 'Gratis desde 40€ / 4,99€'],
            ['Islas Baleares', '5–18 días hábiles', 'Gratis desde 40€ / 4,99€'],
            ['Canarias, Ceuta, Melilla', 'Consultar', 'Consultar en hola@zarpitas.es'],
          ]}
        />
        <UL>
          <LI>Los plazos de entrega son estimados y pueden variar por causas ajenas a Zarpitas (aduanas, transportista, festivos).</LI>
          <LI>Una vez realizado el pedido, recibirás un número de seguimiento para rastrear el envío.</LI>
          <LI>Si el pedido no llega en el plazo máximo indicado, contáctanos en <a href="mailto:hola@zarpitas.es" className="text-orange font-bold hover:underline">hola@zarpitas.es</a> y lo gestionamos sin coste adicional para ti.</LI>
        </UL>
      </Section>

      <Section id="devolucion" title="5. Derecho de desistimiento">
        <P>Conforme al Real Decreto Legislativo 1/2007 y la Directiva 2011/83/UE, tienes derecho a desistir del contrato en un plazo de <strong>14 días naturales</strong> desde la recepción del producto, sin necesidad de justificación y sin penalización alguna.</P>
        <P>Para ejercer el derecho de desistimiento, debes notificárnoslo antes de que expire dicho plazo mediante:</P>
        <UL>
          <LI>Email a <a href="mailto:hola@zarpitas.es" className="text-orange font-bold hover:underline">hola@zarpitas.es</a> con el asunto «DESISTIMIENTO — Pedido #XXXXXXXX».</LI>
          <LI>Indicando tu nombre, dirección, número de pedido y el producto que deseas devolver.</LI>
        </UL>
        <P>Excepciones al derecho de desistimiento (conforme al art. 103 LGDCU):</P>
        <UL>
          <LI>Productos personalizados o a medida.</LI>
          <LI>Productos que por razones de higiene hayan sido desprecintados tras la entrega.</LI>
          <LI>Bienes que, tras su entrega y por su naturaleza, se hayan mezclado de forma indisociable con otros bienes.</LI>
        </UL>
      </Section>

      <Section id="devoluciones" title="6. Política de devoluciones y reembolsos">
        <P>Zarpitas ofrece una política de devoluciones de <strong>30 días</strong> desde la recepción del pedido (ampliando el mínimo legal de 14 días).</P>
        <UL>
          <LI><strong>Gastos de devolución:</strong> Zarpitas asume los gastos de devolución en todos los casos, salvo devoluciones por cambio de opinión (desistimiento), donde podrán aplicarse gastos de retorno.</LI>
          <LI><strong>Estado del producto:</strong> el producto debe devolverse en su embalaje original, sin signos de uso y con todos sus accesorios.</LI>
          <LI><strong>Reembolso:</strong> una vez recibido y verificado el producto, procederemos al reembolso íntegro en un plazo máximo de <strong>14 días</strong> mediante el mismo método de pago utilizado.</LI>
        </UL>
        <InfoBox>
          Para iniciar una devolución, escríbenos a <a href="mailto:hola@zarpitas.es" className="text-orange font-bold hover:underline">hola@zarpitas.es</a> con tu número de pedido y te guiaremos en el proceso.
        </InfoBox>
      </Section>

      <Section id="garantia" title="7. Garantía legal">
        <P>Todos los productos vendidos en Zarpitas.es cuentan con la <strong>garantía legal de 2 años</strong> establecida en el Real Decreto Legislativo 1/2007 (Ley General para la Defensa de los Consumidores y Usuarios).</P>
        <P>Si recibes un producto defectuoso o que no se corresponde con la descripción, tienes derecho a:</P>
        <UL>
          <LI>La reparación o sustitución del producto, a tu elección.</LI>
          <LI>Una reducción del precio o la resolución del contrato, si la reparación o sustitución no fuera posible.</LI>
        </UL>
        <P>Para reclamar la garantía, contáctanos en <a href="mailto:hola@zarpitas.es" className="text-orange font-bold hover:underline">hola@zarpitas.es</a> adjuntando fotografías del defecto y tu número de pedido.</P>
      </Section>

      <Section id="responsabilidad" title="8. Limitación de responsabilidad">
        <P>Zarpitas no será responsable de los daños y perjuicios de cualquier naturaleza que pudieran derivarse del uso de los productos adquiridos, más allá de lo establecido por la legislación de consumidores aplicable.</P>
        <P>La responsabilidad máxima de Zarpitas frente al cliente se limita al importe total abonado por el pedido en cuestión.</P>
      </Section>

      <Section id="legislacion" title="9. Legislación aplicable y jurisdicción">
        <P>Las presentes Condiciones Generales de Contratación se rigen por la legislación española. En particular:</P>
        <UL>
          <LI>Real Decreto Legislativo 1/2007, de 16 de noviembre, por el que se aprueba el Texto Refundido de la Ley General para la Defensa de los Consumidores y Usuarios.</LI>
          <LI>Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Información y del Comercio Electrónico.</LI>
          <LI>Directiva 2011/83/UE sobre los derechos de los consumidores.</LI>
        </UL>
        <P>Para la resolución de conflictos, las partes se someten a los Juzgados y Tribunales del domicilio del consumidor, conforme a lo establecido por la normativa de protección al consumidor.</P>
        <InfoBox>
          Recuerda que también puedes recurrir a la plataforma de resolución de litigios en línea de la UE:{' '}
          <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" className="text-orange font-bold hover:underline">
            ec.europa.eu/consumers/odr
          </a>
        </InfoBox>
      </Section>
    </LegalPage>
  )
}
