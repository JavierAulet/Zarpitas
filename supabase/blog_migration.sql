-- ─── Blog Posts Table ────────────────────────────────────────────────────────

create table if not exists public.blog_posts (
  id                  uuid primary key default gen_random_uuid(),
  title               text not null,
  slug                text unique not null,
  content             text not null,
  excerpt             text,
  featured_image_url  text,
  category            text default 'general',
  status              text default 'draft' check (status in ('draft', 'published')),
  meta_title          text,
  meta_description    text,
  read_time           integer default 5,
  views               integer default 0,
  related_product_ids text[] default '{}',
  published_at        timestamptz,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

alter table public.blog_posts enable row level security;

create policy "Public read published posts" on public.blog_posts
  for select using (status = 'published');

create policy "Service role full access blog" on public.blog_posts
  using (true) with check (true);

-- ─── Storage bucket for blog images ──────────────────────────────────────────

insert into storage.buckets (id, name, public)
  values ('blog-images', 'blog-images', true)
  on conflict (id) do nothing;

-- ─── Seed: 5 posts from lib/data/blog.ts ─────────────────────────────────────

insert into public.blog_posts (title, slug, content, excerpt, featured_image_url, category, status, meta_title, meta_description, read_time, related_product_ids, published_at, created_at, updated_at)
values

(
  'Los mejores collares GPS para perros en 2026',
  'mejores-collares-gps-perros-2026',
  $$¿Cuántas veces has sentido ese nudo en el estómago al ver que tu perro desaparece en el parque o se escapa por una puerta abierta? Los collares GPS para perros han revolucionado la manera en que cuidamos a nuestras mascotas y, en 2026, la tecnología de rastreo ha alcanzado un nivel de precisión y asequibilidad que los hace imprescindibles para cualquier propietario responsable en España.

## ¿Por qué necesita tu perro un collar GPS?

Cada año, más de 100.000 perros se pierden en España según datos de protectoras de animales. Las causas son variadas: un petardo que asusta al animal en Nochevieja, una puerta que se queda abierta accidentalmente, un paseo por el campo donde el perro sigue un rastro... Lo más angustiante es que muchos de estos animales nunca regresan a casa.

Un collar GPS elimina prácticamente este riesgo. Con un dispositivo de rastreo puedes ver en tu smartphone la posición exacta de tu perro en tiempo real, recibir alertas cuando sale de una zona segura predefinida y compartir su ubicación con tu familia.

## Cómo funciona la tecnología GPS en collares para perros

Los collares GPS modernos funcionan mediante una combinación de tecnologías complementarias. El GPS satelital proporciona la posición geográfica con precisión de metros. Una SIM con datos 4G transmite esa información a los servidores del fabricante, que la muestran en tu aplicación móvil en tiempo real.

La frecuencia de actualización es un dato clave: los mejores modelos actualizan la posición cada 2-10 segundos en modo live tracking, mientras que en modo ahorro de batería lo hacen cada 2-5 minutos.

## Características clave que debes buscar

- Duración de batería: mínimo 24h en uso normal; para excursiones largas o caza, busca 48h o más.
- Resistencia al agua: imprescindible la certificación IPX7 (sumergible a 1m durante 30 minutos) o superior.
- Peso del dispositivo: no debe superar el 5% del peso del perro; para razas pequeñas prioriza modelos compactos de menos de 40g.
- Cobertura de red: verifica compatibilidad con operadoras españolas; los mejores incluyen SIM multinacional para toda Europa.
- Geofencing: zona segura configurable desde la app para recibir alertas instantáneas si el perro la abandona.
- Historial de rutas: fundamental si tienes paseador de perros contratado.
- Cuota mensual de datos: calcula el coste total del primer año antes de comparar precios entre modelos.

## Los mejores collares GPS para perros en España en 2026

### 1. Collar GPS Premium Zarpitas — La mejor relación calidad-precio

El Collar GPS Premium de Zarpitas es nuestra recomendación número uno. Con batería de 48 horas, certificación IPX7, actualizaciones de posición cada 3 segundos y sin cuota mensual adicional, ofrece todo lo necesario a un precio de 49,99€. Funciona en toda España y Europa gracias a su SIM multinacional.

### 2. Tractive GPS DOG 4 — El más popular en Europa

Tractive es la marca de referencia europea con millones de usuarios activos. El modelo DOG 4 es extremadamente ligero (35g), opera en más de 175 países y ofrece seguimiento en vivo ilimitado. Requiere suscripción mensual desde 2,99€/mes con plan anual.

### 3. Garmin TT 15 — Para cazadores y trabajo profesional

El Garmin TT 15 es la opción profesional para perros de caza o trabajo en zonas sin cobertura móvil. Utiliza comunicación directa dispositivo-a-dispositivo sin necesidad de red, con alcance de hasta 14 km.

> 💡 **Consejo Zarpitas**
> Si tu perro pesa menos de 8 kg, prioriza modelos compactos y ligeros. Nuestro Collar GPS Premium es cómodo incluso para perros medianos gracias a su diseño ergonómico de solo 38g.

## Conclusión: ¿vale la pena invertir en un collar GPS?

Sin duda alguna. La tranquilidad de saber dónde está tu perro en todo momento, poder recuperarlo rápidamente si se pierde y recibir alertas automáticas cuando abandona su zona segura no tiene precio. En España, donde los perros perdidos son un problema real especialmente durante festividades con fuegos artificiales, un collar GPS es una de las inversiones más inteligentes que puedes hacer como dueño responsable.$$,
  'Cada año miles de perros se pierden en España. Un collar GPS es la solución definitiva para saber dónde está tu mascota en todo momento. Analizamos los mejores modelos del mercado.',
  '/images/category-dogs.jpg',
  'perros',
  'published',
  'Los mejores collares GPS para perros en 2026 | Zarpitas',
  'Guía completa de los mejores collares GPS para perros disponibles en España en 2026. Comparativa de modelos, precios y consejos para elegir el rastreador ideal.',
  8,
  array['collar-gps-perro', 'arnes-antipull-perro'],
  '2026-04-10T10:00:00Z',
  '2026-04-10T10:00:00Z',
  '2026-05-01T10:00:00Z'
),

(
  'Cómo elegir la cama perfecta para tu perro',
  'como-elegir-cama-perfecta-perro',
  $$La cama de tu perro es mucho más que un simple accesorio decorativo. Es el lugar donde pasa aproximadamente un tercio de su vida durmiendo y descansando, y la calidad de ese descanso influye directamente en su salud, su comportamiento y su bienestar general.

## ¿Por qué es tan importante la cama de tu perro?

Los perros necesitan entre 12 y 14 horas de sueño al día, y los cachorros y los perros mayores pueden dormir hasta 18 horas. Durante ese tiempo, la calidad del soporte que reciben sus articulaciones determina cómo se levantarán al día siguiente. Un perro que duerme en una superficie dura o con un relleno demasiado blando puede desarrollar problemas articulares, dolor de cadera o agravamiento de displasias existentes.

Además, la cama cumple una función psicológica fundamental: es el territorio personal del perro, su refugio seguro donde puede relajarse completamente.

## Tipos de camas para perros

- Cama nido o cueva: con bordes elevados y forma circular; ideal para razas pequeñas y perros que les gusta enroscarse.
- Colchón plano: superficie grande y plana; perfecto para razas grandes que se tumban extendidos.
- Cama ortopédica de memory foam: relleno viscoelástico que se adapta al cuerpo; la mejor opción para perros adultos y senior.
- Cama con bolster (bordes elevados): el perro puede apoyar la cabeza en los bordes; popular en razas braquicéfalas.
- Cama elevada o tipo hamaca: separa al perro del suelo; excelente para climas cálidos.

## Camas ortopédicas: quién las necesita y por qué

Las camas ortopédicas están diseñadas con relleno de espuma viscoelástica (memory foam) o espuma de alta densidad que distribuye el peso del animal de manera uniforme. Son especialmente recomendables para:

- Perros mayores de 7 años.
- Razas grandes predispuestas a la displasia de cadera (Pastor Alemán, Labrador, Rottweiler).
- Perros con artritis, artrosis o que han pasado por cirugías articulares.
- Razas condrodistróficas como el Basset Hound, el Dachshund o el Bulldog Francés.

La Cama Ortopédica Premium de Zarpitas cuenta con tres capas de espuma de distintas densidades: una base firme para soporte estructural, una capa intermedia de transición y una capa superior de memory foam de 5 cm. La funda es completamente extraíble y lavable a máquina.

## Cómo medir a tu perro para elegir el tamaño correcto

Para elegir la talla correcta, mide a tu perro desde la punta del hocico hasta la base de la cola cuando está tumbado. Añade entre 20 y 30 cm a esa medida para obtener la longitud mínima.

- Perros pequeños (hasta 10 kg): cama de 60x50 cm como mínimo.
- Perros medianos (10-25 kg): cama de 80x60 cm como mínimo.
- Perros grandes (25-45 kg): cama de 100x80 cm como mínimo.
- Perros gigantes (más de 45 kg): cama de 120x90 cm o más.

> 💡 **Consejo Zarpitas**
> Coloca la cama de tu perro en un lugar tranquilo, alejado del paso y las corrientes de aire. Un perro que duerme en un lugar de paso o con ruido excesivo no descansará correctamente aunque tenga la mejor cama del mundo.

## Cuánto debería costar una buena cama para perros

Para un perro mediano o grande, una cama de calidad media-alta debería costar entre 60€ y 120€. Una cama bien fabricada dura 3-5 años, lo que supone un coste diario mínimo. El ahorro en una mala cama puede traducirse en facturas veterinarias muy superiores si el animal desarrolla problemas articulares por un soporte deficiente.

## Conclusión: invierte en el descanso de tu perro

Elegir la cama correcta para tu perro es una decisión que impacta directamente en su salud y calidad de vida. La Cama Ortopédica Premium de Zarpitas es la opción que más recomendamos para perros adultos y senior: diseñada con materiales de calidad y con envío rápido a toda España.$$,
  'La cama de tu perro no es un accesorio secundario: es donde pasa un tercio de su vida. Descubre cómo elegir la mejor cama para su tamaño, edad y necesidades.',
  '/images/category-dogs.jpg',
  'perros',
  'published',
  'Cómo elegir la cama perfecta para tu perro | Zarpitas',
  'Guía para elegir la mejor cama para tu perro en 2026. Aprende qué tener en cuenta: tamaño, materiales, camas ortopédicas y cuánto gastar. Consejos de expertos.',
  7,
  array['cama-ortopedica-perro'],
  '2026-04-20T10:00:00Z',
  '2026-04-20T10:00:00Z',
  '2026-05-01T10:00:00Z'
),

(
  'Alimentación automática para gatos: guía completa 2026',
  'alimentacion-automatica-gatos-guia-completa',
  $$El gato es un animal con rutinas muy marcadas, especialmente en lo que respecta a la alimentación. A diferencia de los perros, que pueden adaptarse más fácilmente a horarios variables, los gatos se estresan cuando su comida no aparece a la hora esperada. Los comederos automáticos resuelven este problema de forma elegante.

## ¿Qué es un comedero automático para gatos?

Un comedero automático es un dispensador de alimento programable que sirve la cantidad correcta de pienso en los horarios que tú determines. Los modelos inteligentes conectados al WiFi permiten programar desde el smartphone, ajustar las porciones al gramo, recibir notificaciones cuando el depósito está bajo y hasta grabar mensajes de voz que se reproducen antes de servir la comida.

## Ventajas de la alimentación automática para gatos

- Control de porciones: evita la sobrealimentación y el sobrepeso, uno de los problemas de salud más comunes en gatos domésticos.
- Horarios regulares: el gato sabe exactamente cuándo va a comer, lo que reduce el estrés.
- Independencia: puedes salir a trabajar o hacer una escapada de fin de semana sin preocuparte.
- Múltiples comidas pequeñas: los gatos digieren mejor varias comidas pequeñas al día que una o dos grandes.
- Higiene: el pienso no está en contacto prolongado con el ambiente.
- Gestión de dietas especiales: garantiza el cumplimiento exacto de la dieta prescrita por el veterinario.

## Tipos de comederos automáticos

### Comederos de rueda giratoria

Son los modelos más básicos y económicos. Tienen varios compartimentos separados que rotan a la hora programada. Adecuados para ausencias de pocas horas pero con capacidad limitada.

### Comederos de tornillo sin fin (con tolva)

Son los más populares y versátiles. Un depósito superior almacena el pienso y un mecanismo electrónico sirve la cantidad exacta. Permiten programar hasta 12 comidas al día. El Comedero Inteligente de Zarpitas funciona con este sistema con conectividad WiFi.

## Cómo programar correctamente un comedero automático

- Consulta con tu veterinario la cantidad diaria de pienso recomendada.
- Divide esa cantidad en 3-4 comidas distribuidas a lo largo del día (por ejemplo: 7:00, 12:00, 17:00 y 22:00).
- Programa las horas y las porciones en la app o en el panel del comedero.
- Durante los primeros días, observa si tu gato come bien en los nuevos horarios y ajusta si es necesario.
- Mantén siempre el depósito con al menos un 30% de capacidad.
- Limpia el cuenco dispensador semanalmente.

> 💡 **Consejo Zarpitas**
> Si tienes varios gatos, considera un comedero con reconocimiento de microchip que solo se abre para el gato autorizado. Esto evita que un gato coma la porción de otro, fundamental cuando tienen dietas distintas.

## El mejor comedero automático para gatos en 2026

El Comedero Inteligente Automático de Zarpitas (59,99€) incluye depósito de 3 litros, programación de hasta 12 comidas diarias, control completo por WiFi desde la app, función de porción extra con un solo toque y sensor de nivel bajo con notificación al móvil.

## Conclusión

Un comedero automático para gatos es una inversión en la salud y el bienestar de tu mascota. Alimentación regular, control de porciones y la tranquilidad de saber que tu gato está bien atendido aunque no estés en casa son beneficios que justifican ampliamente el desembolso.$$,
  'Los comederos automáticos para gatos son la solución perfecta para quienes trabajan fuera de casa o viajan con frecuencia. Descubre todo lo que necesitas saber antes de comprar uno.',
  '/images/category-cats.jpg',
  'gatos',
  'published',
  'Alimentación automática para gatos: guía completa 2026 | Zarpitas',
  'Todo sobre los comederos automáticos para gatos en 2026. Qué son, cómo funcionan, cuáles son los mejores modelos y cómo programarlos correctamente.',
  7,
  array['comedero-inteligente', 'bebedero-fuente-gatos'],
  '2026-04-25T10:00:00Z',
  '2026-04-25T10:00:00Z',
  '2026-05-01T10:00:00Z'
),

(
  'Los mejores rascadores para gatos: análisis completo 2026',
  'mejores-rascadores-gatos-2026',
  $$Si has tenido un gato en casa, probablemente ya sabes lo que significa encontrarte el sofá destrozado o las esquinas del armario marcadas. Rascar es una necesidad biológica innegociable para los gatos. La solución no es prohibirles que rasquen, sino ofrecerles un rascador que les resulte irresistible.

## Por qué los gatos necesitan rascar: biología y comportamiento

El rascado cumple tres funciones biológicas esenciales. En primer lugar, permite eliminar las capas externas y desgastadas de las garras, manteniendo las internas afiladas y funcionales. En segundo lugar, al rascar el gato deposita el olor de sus glándulas odoríferas en la superficie, marcando su territorio. En tercer lugar, el acto de rascar implica un estiramiento completo de la columna, los hombros y las extremidades anteriores, fundamental para mantener la flexibilidad.

## Tipos de rascadores para gatos

- Rascador de poste: el más básico y económico; ideal para gatos que prefieren rascar en vertical.
- Árbol rascador: estructura de varios niveles con postes, plataformas, cuevas y juguetes; combina rascador con zona de descanso.
- Rascador de cartón ondulado: muchos gatos lo prefieren para rascar en horizontal; económico y reemplazable.
- Rascador de pared: se fija a la pared y ocupa menos espacio; muy resistente y duradero.
- Rascador de esquina: diseñado para proteger las esquinas de los muebles.

## ¿Árbol rascador o rascador simple?

Para un gato que vive en casa sin acceso al exterior, un árbol rascador de varios niveles es la mejor inversión. No solo le proporciona superficies de rascado sino también plataformas elevadas donde observar su territorio, cuevas donde esconderse y puntos de salto que ejercitan su musculatura.

Lo más importante es que la estructura sea estable, suficientemente alta para que el gato pueda estirarse completamente (al menos 80 cm para gatos adultos) y que esté recubierta de sisal natural.

## Los mejores rascadores para gatos en España en 2026

### Rascador Árbol Premium Zarpitas — Nuestra recomendación

El Rascador Árbol Premium de Zarpitas cuenta con tres niveles de plataformas, dos postes de sisal natural de alta resistencia, una cueva interior y varios juguetes colgantes. La base es extra ancha para garantizar la estabilidad. El conjunto mide 145 cm de altura. Precio: 79,99€.

> 💡 **Consejo Zarpitas**
> Para que tu gato adopte el nuevo rascador desde el primer día, frota un poco de hierba gatera (catnip) sobre el sisal y colócalo inicialmente cerca del lugar donde suele rascar.

## Dónde colocar el rascador: posición estratégica

Los gatos rascan especialmente al despertar y cuando marcan territorio, así que el rascador debe estar en un lugar central y visible, nunca escondido en un rincón. Colócalo cerca de donde duerme el gato para que pueda estirarse al despertarse.

## Materiales: sisal vs moqueta vs cartón

El sisal natural es el material más recomendado por veterinarios y etólogos felinos: es resistente, tiene la textura ideal para las garras y no se deshilacha peligrosamente. Opta siempre por sisal natural de alta densidad para una vida útil máxima.

## Conclusión

Invertir en un buen rascador para gatos es una de las decisiones más rentables que puedes tomar como propietario felino. Protegerás tus muebles, satisfarás las necesidades biológicas del animal y le proporcionarás un espacio propio donde sentirse seguro. El Rascador Árbol Premium de Zarpitas ofrece todo esto en un solo producto, con envío rápido a toda España.$$,
  'Rascar es una necesidad biológica para los gatos, no un capricho. Sin un rascador adecuado, tu sofá pagará las consecuencias. Descubre cuál es el mejor para tu gato.',
  '/images/category-cats.jpg',
  'gatos',
  'published',
  'Los mejores rascadores para gatos 2026 | Zarpitas',
  'Guía de los mejores rascadores y árboles para gatos disponibles en España en 2026. Análisis de modelos, materiales, tamaños y consejos para que tu gato los use desde el primer día.',
  7,
  array['rascador-arbol-gato', 'juguete-interactivo-gato'],
  '2026-04-28T10:00:00Z',
  '2026-04-28T10:00:00Z',
  '2026-05-01T10:00:00Z'
),

(
  'Arnés vs collar para perros: ¿cuál es mejor en 2026?',
  'arnes-vs-collar-perros-cual-es-mejor',
  $$¿Arnés o collar? Es probablemente la pregunta que más se repite en los grupos de propietarios de perros en España. La respuesta correcta depende del tamaño de tu perro, su raza, sus hábitos al pasear y si tiene alguna condición física a tener en cuenta. En los últimos años, la evidencia veterinaria se ha ido decantando claramente hacia el arnés como opción más segura para la mayoría de los perros.

## Diferencias fundamentales entre arnés y collar

La diferencia principal está en cómo se distribuye la fuerza cuando el perro tira de la correa. Con un collar, toda la tensión se concentra en el cuello, específicamente en la tráquea, la columna cervical y los vasos sanguíneos de la zona. Con un arnés, la misma fuerza se distribuye por el pecho, las costillas y los hombros del animal.

Estudios veterinarios demuestran que el uso prolongado de collar en perros que tiran puede causar daños en la tráquea, compresión de venas yugulares, problemas oculares por aumento de la presión intraocular y lesiones en discos intervertebrales del cuello.

## Cuándo usar arnés: la opción más recomendable

- Perros que tiran de la correa: el arnés distribuye la fuerza de manera segura y evita daños cervicales.
- Razas braquicéfalas (Bulldog, Pug, Carlino, Shih Tzu): tienen traqueas estrechas y el collar puede asfixiarlos al tirar.
- Razas con cuello fino y cráneo estrecho (Galgo, Greyhound, Whippet): el collar puede escurrirse fácilmente.
- Cachorros en proceso de aprendizaje: aprenden a caminar con correa sin riesgo de lesiones.
- Perros con problemas de cuello, hernias discales cervicales o cirugías recientes.
- Perros miniatura (Chihuahua, Yorkshire, Maltés): sus huesos y traqueas son muy delicados.

## El arnés antipull: especial para perros que tiran

El arnés antipull tiene un anillo de enganche en el pecho. Cuando el perro tira hacia adelante, la correa redirige su cuerpo hacia un lado, interrumpiendo el movimiento de avance. Este efecto de redirección, sin causar dolor, enseña al perro progresivamente que tirar de la correa no le lleva a avanzar más rápido.

El Arnés Antipull Reflectante de Zarpitas (34,99€) incorpora enganche dual: uno en el pecho para control antipull y uno en el dorso para paseos tranquilos. Las bandas reflectantes aumentan la visibilidad en condiciones de poca luz. Es ajustable en seis puntos.

> 💡 **Consejo Zarpitas**
> Cuando introduzcas el arnés por primera vez, ponlo durante unos minutos en casa sin salir y recompensa al perro con golosinas para que asocie el arnés con algo positivo.

## Cómo ajustar correctamente el arnés

- Debe quedar snug pero no apretado: deben caber dos dedos entre el arnés y el cuerpo del perro en cualquier punto.
- Las correas no deben rozar las axilas del perro al caminar.
- El anillo de enganche dorsal debe quedar en el centro de la espalda, entre los omóplatos.
- Comprueba el ajuste después de los primeros paseos: el cuero puede estirarse ligeramente con el uso.
- Revisa regularmente que los cierres y costuras están en buen estado.

## Cómo elegir el tamaño correcto del arnés

Mide el perímetro del pecho de tu perro en el punto más ancho (justo detrás de las patas delanteras) y el contorno del cuello. Compara con la tabla de tallas del fabricante y, si tu perro está entre dos tallas, elige la más grande.

## Conclusión: el arnés es la opción más segura para la mayoría de perros

Para la mayoría de los perros, especialmente los que tiran, las razas braquicéfalas y los perros en formación, el arnés es significativamente más seguro que el collar. El Arnés Antipull Reflectante de Zarpitas ofrece seguridad, comodidad y control en un diseño de calidad, disponible con envío rápido a toda España.$$,
  '¿Arnés o collar? Es una de las preguntas más frecuentes entre los dueños de perros. La respuesta depende del tamaño, la raza y los hábitos de tu mascota. Te lo explicamos todo.',
  '/images/category-dogs.jpg',
  'perros',
  'published',
  'Arnés vs collar para perros: ¿cuál es mejor? | Zarpitas',
  'Comparativa definitiva: arnés vs collar para perros. Ventajas de cada uno, cuándo usar cada opción y cómo elegir el arnés antipull correcto según la raza de tu perro.',
  8,
  array['arnes-antipull-perro', 'collar-gps-perro'],
  '2026-05-02T10:00:00Z',
  '2026-05-02T10:00:00Z',
  '2026-05-05T10:00:00Z'
)

on conflict (slug) do nothing;
