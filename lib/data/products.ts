import type { Product } from '@/types'

export const products: Product[] = [
  {
    id: 'collar-gps-perro',
    name: 'Collar GPS Premium para Perros',
    price: 49.99,
    originalPrice: 69.99,
    image: null,
    images: [],
    category: 'perros',
    subcategory: 'Collares y Arneses',
    badge: 'nuevo',
    rating: 4.8,
    reviews: 234,
    description:
      'Mantén a tu perro siempre seguro con nuestro collar GPS de última generación. Rastreo en tiempo real con precisión de metros, batería de larga duración y resistente al agua. Compatible con iOS y Android.',
    features: [
      'Rastreo GPS en tiempo real',
      'Resistente al agua IPX7',
      'Batería de 48 horas',
      'Zona segura configurable',
      'Compatible con iOS y Android',
    ],
    aliexpressId: 'ae_collar_gps_001',
    stock: 8,
  },
  {
    id: 'cama-ortopedica-perro',
    name: 'Cama Ortopédica Premium para Perro',
    price: 89.99,
    image: null,
    images: [],
    category: 'perros',
    subcategory: 'Camas y Descanso',
    badge: 'mas-vendido',
    rating: 4.9,
    reviews: 567,
    description:
      'La cama que tu perro merece. Espuma viscoelástica de alta densidad que alivia la presión articular, ideal para perros mayores. Funda extraíble y lavable a máquina con tejido antiácaros.',
    features: [
      'Espuma viscoelástica de memoria',
      'Funda lavable a máquina',
      'Tejido antiácaros e hipoalergénico',
      'Base antideslizante',
      'Disponible en 3 tallas',
    ],
    stock: 5,
  },
  {
    id: 'comedero-inteligente',
    name: 'Comedero Inteligente Automático',
    price: 59.99,
    originalPrice: 79.99,
    image: null,
    images: [],
    category: 'perros',
    subcategory: 'Comederos',
    badge: undefined,
    rating: 4.6,
    reviews: 189,
    description:
      'Alimenta a tu mascota desde cualquier lugar del mundo. Programación de hasta 6 comidas diarias, control por app, cámara HD integrada y compartimento para 6 kg de pienso.',
    features: [
      'Control por aplicación móvil',
      'Cámara HD con micrófono',
      'Programación de 6 comidas/día',
      'Capacidad 6 kg de pienso',
      'Dispensador antipaja',
    ],
    stock: 12,
  },
  {
    id: 'rascador-arbol-gato',
    name: 'Árbol Rascador Premium para Gatos',
    price: 79.99,
    image: null,
    images: [],
    category: 'gatos',
    subcategory: 'Rascadores',
    badge: 'mas-vendido',
    rating: 4.7,
    reviews: 412,
    description:
      'El paraíso de tu gato en casa. Árbol rascador de 5 niveles con postes de sisal natural, hamaca colgante, casita interior y plataformas de observación. Estabilidad garantizada hasta 15 kg.',
    features: [
      'Sisal natural 100%',
      '5 niveles de actividad',
      'Hamaca colgante incluida',
      'Base extra estable',
      'Juguete ratón de regalo',
    ],
    stock: 6,
  },
  {
    id: 'juguete-laser-gato',
    name: 'Juguete Interactivo Láser para Gatos',
    price: 29.99,
    originalPrice: 39.99,
    image: null,
    images: [],
    category: 'gatos',
    subcategory: 'Juguetes',
    badge: undefined,
    rating: 4.5,
    reviews: 298,
    description:
      'Mantén a tu gato activo y feliz con nuestro juguete láser automático de 360°. 5 patrones de movimiento aleatorio, temporizador automático de 15 minutos y ajuste de velocidad.',
    features: [
      'Movimiento 360° automático',
      '5 patrones aleatorios',
      'Temporizador 15 minutos',
      '3 velocidades ajustables',
      'Seguro para ojos de mascotas',
    ],
    stock: 87,
  },
  {
    id: 'arnes-antipull-perro',
    name: 'Arnés Antipull Reflectante para Perro',
    price: 34.99,
    image: null,
    images: [],
    category: 'perros',
    subcategory: 'Collares y Arneses',
    badge: undefined,
    rating: 4.6,
    reviews: 156,
    description:
      'Paseos seguros y cómodos para ti y tu perro. Sistema antipull con doble clip de enganche, franjas reflectantes de alta visibilidad, acolchado ergonómico y ajuste en 4 puntos.',
    features: [
      'Sistema antipull patentado',
      'Franjas reflectantes 360°',
      'Acolchado ergonómico',
      'Ajuste en 4 puntos',
      'Resistente al agua',
    ],
    stock: 63,
  },
  {
    id: 'bebedero-fuente-gato',
    name: 'Bebedero Fuente Filtrante para Gatos',
    price: 44.99,
    originalPrice: 64.99,
    image: null,
    images: [],
    category: 'gatos',
    subcategory: 'Comederos',
    badge: 'oferta',
    rating: 4.8,
    reviews: 334,
    description:
      'Tu gato merece agua fresca y limpia siempre. Fuente de 2,5 L con filtro de carbón activo, flujo silencioso para no alterar el sueño y modo nocturno. Fabricada en acero inoxidable.',
    features: [
      'Filtro de carbón activo',
      'Acero inoxidable grado alimentario',
      'Capacidad 2,5 litros',
      'Modo nocturno silencioso',
      'Indicador de nivel de agua',
    ],
    stock: 41,
  },
  {
    id: 'chubasquero-perro',
    name: 'Chubasquero Impermeable para Perro',
    price: 39.99,
    image: null,
    images: [],
    category: 'perros',
    subcategory: 'Ropa y Accesorios',
    badge: 'nuevo',
    rating: 4.4,
    reviews: 98,
    description:
      'Que la lluvia no detenga vuestros paseos. Chubasquero 100% impermeable con capucha ajustable, tira reflectante dorsal y cierre de velcro fácil. Disponible en 6 tallas.',
    features: [
      'Impermeable 100% (10.000 mm)',
      'Capucha ajustable con visera',
      'Tira reflectante dorsal',
      'Cierre de velcro y botón',
      'Disponible en 6 tallas',
    ],
    stock: 34,
  },
]

export const getFeaturedProducts = () => products.slice(0, 4)

export const getBestSellers = () =>
  products.filter((p) => p.badge === 'mas-vendido' || p.reviews > 300)

export const getProductsByCategory = (category: 'perros' | 'gatos') =>
  products.filter((p) => p.category === category)

export const getProductById = (id: string) =>
  products.find((p) => p.id === id)

export const getRelatedProducts = (product: Product, limit = 4) =>
  products
    .filter((p) => p.id !== product.id && p.category === product.category)
    .slice(0, limit)
