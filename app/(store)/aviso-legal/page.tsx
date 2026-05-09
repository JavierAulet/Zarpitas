import type { Metadata } from 'next'
import LegalPage, { Section, P, UL, LI, InfoBox } from '@/components/legal/LegalPage'

export const metadata: Metadata = {
  title: 'Aviso Legal | Zarpitas.es',
  description: 'Información legal sobre Zarpitas.es: titular, actividad, condiciones de uso y responsabilidades.',
}

const sections = [
  { id: 'titular', title: '1. Datos del titular' },
  { id: 'objeto', title: '2. Objeto y ámbito' },
  { id: 'condiciones', title: '3. Condiciones de uso' },
  { id: 'propiedad-intelectual', title: '4. Propiedad intelectual' },
  { id: 'responsabilidad', title: '5. Limitación de responsabilidad' },
  { id: 'enlaces', title: '6. Enlaces externos' },
  { id: 'litigios', title: '7. Resolución de litigios' },
  { id: 'legislacion', title: '8. Legislación aplicable' },
]

export default function AvisoLegalPage() {
  return (
    <LegalPage
      title="Aviso Legal"
      subtitle="Información legal del sitio web zarpitas.es conforme a la Ley 34/2002, de 11 de julio (LSSI-CE)."
      updated="9 de mayo de 2026"
      sections={sections}
    >
      <Section id="titular" title="1. Datos identificativos del titular">
        <P>En cumplimiento del artículo 10 de la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Información y del Comercio Electrónico (LSSI-CE), se informa de los datos identificativos del titular de este sitio web:</P>
        <div className="bg-cream-warm border-2 border-cream-deep rounded-2xl p-5 space-y-2">
          {[
            ['Titular', 'Javier Aulet Fraga'],
            ['Actividad', 'Comercio electrónico de productos para mascotas'],
            ['Domicilio', 'Madrid, España'],
            ['Email de contacto', 'hola@zarpitas.es'],
            ['Sitio web', 'https://zarpitas.es'],
          ].map(([label, value]) => (
            <div key={label} className="flex gap-3 text-sm">
              <span className="font-bold text-text-primary w-36 flex-shrink-0">{label}:</span>
              <span className="text-text-secondary">{value}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section id="objeto" title="2. Objeto y ámbito de aplicación">
        <P>El presente Aviso Legal regula el acceso y uso del sitio web <strong>zarpitas.es</strong> (en adelante, «el Sitio»), titularidad de Javier Aulet Fraga, que tiene por objeto la venta de productos para mascotas mediante comercio electrónico.</P>
        <P>El acceso al Sitio implica la aceptación plena y sin reservas de las condiciones establecidas en este Aviso Legal. Si el usuario no está de acuerdo con estas condiciones, deberá abstenerse de utilizar el Sitio.</P>
      </Section>

      <Section id="condiciones" title="3. Condiciones de uso">
        <P>El usuario se compromete a hacer un uso lícito del Sitio, absteniéndose de:</P>
        <UL>
          <LI>Utilizar el Sitio con fines ilícitos o contrarios a la buena fe.</LI>
          <LI>Introducir o difundir contenidos falsos, difamatorios o que vulneren derechos de terceros.</LI>
          <LI>Realizar acciones que puedan dañar, inutilizar o sobrecargar el Sitio.</LI>
          <LI>Intentar acceder a áreas restringidas del Sitio sin autorización.</LI>
          <LI>Reproducir o copiar los contenidos del Sitio sin autorización expresa.</LI>
        </UL>
        <P>El titular se reserva el derecho a interrumpir el acceso al Sitio, temporal o definitivamente, sin previo aviso.</P>
      </Section>

      <Section id="propiedad-intelectual" title="4. Propiedad intelectual e industrial">
        <P>Todos los contenidos del Sitio —incluyendo, sin carácter limitativo, textos, fotografías, gráficos, imágenes, logotipos, diseño gráfico y código fuente— son propiedad de Javier Aulet Fraga o de terceros que han autorizado su uso, y están protegidos por la legislación española e internacional sobre propiedad intelectual e industrial.</P>
        <P>Queda expresamente prohibida la reproducción, distribución, comunicación pública o transformación de dichos contenidos sin autorización expresa del titular, salvo para uso personal y privado.</P>
        <P>La marca «Zarpitas» y el logotipo asociado son signos distintivos del titular. Su uso sin autorización constituye infracción de los derechos de propiedad industrial.</P>
      </Section>

      <Section id="responsabilidad" title="5. Limitación de responsabilidad">
        <P>El titular no se hace responsable de:</P>
        <UL>
          <LI>Interrupciones del servicio debidas a causas ajenas a su control (fuerza mayor, fallos técnicos de terceros, etc.).</LI>
          <LI>Los daños o perjuicios derivados del uso incorrecto del Sitio por parte del usuario.</LI>
          <LI>El contenido de sitios web de terceros enlazados desde el Sitio.</LI>
          <LI>Los errores u omisiones en los contenidos del Sitio, si bien se realizan los esfuerzos razonables para mantenerlos actualizados.</LI>
        </UL>
        <P>El titular realizará los esfuerzos comercialmente razonables para mantener el Sitio disponible, sin garantizar una disponibilidad del 100%.</P>
      </Section>

      <Section id="enlaces" title="6. Política de enlaces externos">
        <P>El Sitio puede contener enlaces a sitios web de terceros. Dichos enlaces se facilitan únicamente a efectos informativos. El titular no controla ni es responsable del contenido de dichos sitios ni de las prácticas de privacidad de los mismos.</P>
        <P>Si el usuario accede a sitios externos a través de enlaces incluidos en el Sitio, lo hace bajo su propia responsabilidad.</P>
      </Section>

      <Section id="litigios" title="7. Resolución de litigios en línea">
        <InfoBox>
          <p className="font-bold text-text-primary mb-1">Plataforma de Resolución de Litigios en Línea (ODR)</p>
          <p>Conforme al Reglamento (UE) nº 524/2013, la Comisión Europea pone a disposición de los consumidores europeos la plataforma de resolución de litigios en línea, accesible en:</p>
          <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" className="text-orange font-bold hover:underline mt-1 inline-block">
            https://ec.europa.eu/consumers/odr
          </a>
        </InfoBox>
        <P>Para cualquier reclamación, el usuario puede dirigirse en primer lugar a <a href="mailto:hola@zarpitas.es" className="text-orange font-bold hover:underline">hola@zarpitas.es</a>, donde nos comprometemos a dar respuesta en un plazo máximo de 15 días hábiles.</P>
      </Section>

      <Section id="legislacion" title="8. Legislación aplicable y jurisdicción">
        <P>Las presentes condiciones se rigen por la legislación española. Para la resolución de cualquier controversia derivada del uso del Sitio, las partes se someten, con renuncia expresa a cualquier otro fuero que pudiera corresponderles, a los Juzgados y Tribunales de Madrid (España), salvo que la normativa de protección al consumidor establezca otro fuero imperativo.</P>
        <P>Normativa aplicable:</P>
        <UL>
          <LI>Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Información y del Comercio Electrónico (LSSI-CE).</LI>
          <LI>Reglamento (UE) 2016/679 del Parlamento Europeo (RGPD).</LI>
          <LI>Ley Orgánica 3/2018, de 5 de diciembre, de Protección de Datos Personales (LOPDGDD).</LI>
          <LI>Real Decreto Legislativo 1/2007, de 16 de noviembre (Ley General para la Defensa de los Consumidores).</LI>
        </UL>
      </Section>
    </LegalPage>
  )
}
