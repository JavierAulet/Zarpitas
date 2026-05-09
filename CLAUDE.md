# CLAUDE.md — Zarpitas.es Design System & Project Rules

## Project Overview
**Zarpitas.es** is a premium Spanish e-commerce store selling dog and cat products.
- Target market: Spain
- Tone: Luxury, emotional, trustworthy — like a high-end pet boutique
- Goal: Maximum conversion rate, professional credibility, memorable experience

---

## Tech Stack (STRICT — do not deviate)
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS + CSS custom properties
- **Animations**: Framer Motion
- **3D Effects**: Three.js + React Three Fiber (@react-three/fiber + @react-three/drei)
- **Icons**: Lucide React
- **Fonts**: Google Fonts (see Typography section)
- **State**: Zustand (cart, UI state)
- **Forms**: React Hook Form

---

## Design System

### Color Palette
```css
:root {
  /* Backgrounds */
  --bg-primary: #080808;
  --bg-secondary: #111111;
  --bg-card: #161616;
  --bg-elevated: #1c1c1c;

  /* Gold Accent System */
  --gold-light: #F5D485;
  --gold-main: #D4AF37;
  --gold-dark: #A8852A;
  --gold-glow: rgba(212, 175, 55, 0.15);

  /* Text */
  --text-primary: #F5F5F0;
  --text-secondary: #A0A0A0;
  --text-muted: #555555;

  /* Functional */
  --border: rgba(255,255,255,0.08);
  --border-gold: rgba(212, 175, 55, 0.3);
  --success: #4ADE80;
  --error: #F87171;

  /* Gradients */
  --gradient-gold: linear-gradient(135deg, #F5D485 0%, #D4AF37 50%, #A8852A 100%);
  --gradient-dark: linear-gradient(180deg, #080808 0%, #111111 100%);
  --gradient-card: linear-gradient(145deg, #1c1c1c 0%, #111111 100%);
}
```

### Typography
```
Display Font: "Playfair Display" (Google Fonts) — headings, hero titles
Body Font: "DM Sans" (Google Fonts) — body text, UI
Accent Font: "Cormorant Garamond" italic — luxury accents, taglines
Mono Font: "JetBrains Mono" — prices, codes
```

**Scale:**
- Hero: clamp(3rem, 8vw, 7rem) — Playfair Display, weight 700
- H1: clamp(2rem, 5vw, 4rem) — Playfair Display
- H2: clamp(1.5rem, 3vw, 2.5rem) — Playfair Display
- H3: 1.25rem — DM Sans, weight 600
- Body: 1rem — DM Sans, weight 400
- Small: 0.875rem — DM Sans
- Price: 1.5rem — JetBrains Mono, color var(--gold-main)

### Spacing System
Use Tailwind spacing. Key values:
- Section padding: py-24 md:py-32
- Container: max-w-7xl mx-auto px-4 sm:px-6 lg:px-8
- Card padding: p-6 md:p-8
- Gap between cards: gap-6 md:gap-8

---

## Component Design Rules

### Buttons
```
Primary: bg gradient-gold, text black, rounded-full, px-8 py-4, font-semibold
         hover: scale-105, shadow-gold glow
         
Secondary: border border-gold/30, text gold, rounded-full, px-8 py-4
           hover: bg-gold/10, border-gold

Ghost: text-secondary, hover: text-primary
```

### Cards (Product Cards)
```
- Background: var(--bg-card) with glass morphism
- Border: 1px solid var(--border)
- Border radius: 1.5rem (rounded-3xl)
- On hover: 
  * border-color transitions to var(--border-gold)
  * subtle gold glow box-shadow
  * image scales 1.05
  * "Añadir al carrito" button slides up from bottom
- Image: aspect-square, object-cover, rounded-2xl
- Price: gold color, JetBrains Mono
- Badge (Nuevo, -20%, Más vendido): gold background, black text, rounded-full
```

### Glass Morphism
```css
.glass {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.08);
}
```

### Navigation
```
- Fixed top, blur backdrop
- Logo: "Zarpitas" in Playfair Display + paw icon in gold
- Links: DM Sans, text-secondary, hover text-primary
- Cart icon: shows item count badge in gold
- Transparent on hero, dark bg on scroll
- Mobile: slide-in menu from right
```

---

## Animation Rules (Framer Motion)

### Page Load
```js
// Staggered reveal for all sections
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
}
```

### Scroll Animations
- Use `whileInView` with `viewport={{ once: true, margin: "-100px" }}`
- Every section animates in from below
- Cards stagger with 0.1s delay between each

### Hover Effects
- Product cards: `whileHover={{ y: -8 }}` 
- Buttons: `whileHover={{ scale: 1.05 }}` + `whileTap={{ scale: 0.98 }}`
- Links: subtle scale 1.02

### Hero 3D (Three.js / React Three Fiber)
```
- Floating 3D paw prints orbiting slowly
- Particle system in gold color (#D4AF37)
- Subtle rotation on mouse move (parallax)
- Canvas fills hero section, z-index behind text
- Performance: use instanced meshes, limit to 60fps
```

---

## Page Structure

### Homepage Sections (in order):
1. **Hero** — Full viewport, 3D canvas bg, headline + CTA
2. **Trust Bar** — Horizontal strip: Envío 24h | Devolución 30 días | Pago seguro | +5000 mascotas felices
3. **Featured Products** — "Los más queridos" — 4 product cards
4. **Categories** — Two large cards: PERROS / GATOS with atmospheric images
5. **Why Zarpitas** — 3 columns: Calidad Premium | Envío Rápido | Atención 24/7
6. **Best Sellers** — Horizontal scroll on mobile, grid on desktop
7. **Testimonials** — 3 cards with star ratings, pet owner names
8. **Newsletter** — Dark section with gold accents, email input
9. **Footer** — Links, social, legal, payment icons

### Product Card Data Structure:
```typescript
interface Product {
  id: string
  name: string
  price: number
  originalPrice?: number
  image: string
  category: 'perros' | 'gatos'
  subcategory: string
  badge?: 'nuevo' | 'oferta' | 'mas-vendido'
  rating: number
  reviews: number
  description: string
  aliexpressId?: string
}
```

### Mock Products to Include:
- Collar GPS para perros (€49.99) — badge: nuevo
- Cama ortopédica premium perro (€89.99) — badge: mas-vendido  
- Comedero inteligente automático (€59.99)
- Rascador árbol gato premium (€79.99) — badge: mas-vendido
- Juguete interactivo gato láser (€29.99)
- Arnés antipull reflectante perro (€34.99)
- Bebedero fuente filtrante gatos (€44.99) — badge: oferta
- Chubasquero impermeable perro (€39.99) — badge: nuevo

---

## SEO Rules
- All meta in Spanish
- Title format: `{Product/Page} | Zarpitas.es — Tienda Premium para Mascotas`
- Description: max 155 chars, include "España", "envío rápido"
- Use Next.js Metadata API
- Structured data: Organization + Product schema (JSON-LD)
- hreflang: es-ES
- Sitemap: auto-generate with next-sitemap

---

## Performance Rules
- Images: always use next/image with proper sizes
- Lazy load everything below the fold
- Three.js canvas: load dynamically with `next/dynamic` (no SSR)
- Target: Lighthouse score 90+ on mobile
- Font loading: `display: swap`

---

## File Structure
```
petshop/
├── app/
│   ├── layout.tsx          # Root layout, fonts, providers
│   ├── page.tsx            # Homepage
│   ├── productos/
│   │   ├── page.tsx        # Products listing
│   │   └── [id]/
│   │       └── page.tsx    # Product detail
│   ├── carrito/
│   │   └── page.tsx        # Cart page
│   └── checkout/
│       └── page.tsx        # Checkout
├── components/
│   ├── ui/                 # Base components (Button, Card, Badge...)
│   ├── layout/             # Navbar, Footer
│   ├── home/               # Hero, TrustBar, FeaturedProducts...
│   ├── product/            # ProductCard, ProductGrid, ProductDetail...
│   └── cart/               # CartPanel, CartItem...
├── lib/
│   ├── store/              # Zustand stores
│   ├── data/               # Mock products data
│   └── aliexpress/         # AliExpress API integration (ready for when API approved)
├── hooks/                  # Custom React hooks
├── types/                  # TypeScript interfaces
└── public/
    └── images/
```

---

## AliExpress Integration (Placeholder — activate when API approved)
```typescript
// lib/aliexpress/client.ts
// AppKey: 533884
// Status: Pending approval — use mock data until approved
// When approved: replace mock data with real API calls
// Endpoints needed:
//   - aliexpress.ds.product.get (product details)
//   - aliexpress.trade.order.create (place order)  
//   - aliexpress.logistics.order.trackinginfo.query (tracking)
```

---

## Spanish Copy Guidelines
- Tone: warm, trustworthy, premium — like talking to a pet lover
- CTA buttons: "Añadir al carrito", "Ver producto", "Comprar ahora", "Descubrir"
- Hero headline ideas: "Todo lo que tu mascota merece" / "El lujo que se merecen"
- Trust: "Envío gratis desde 40€", "Devolución gratuita 30 días", "Pago 100% seguro"
- Never use "cheap" or "barato" — use "precio especial", "oferta exclusiva"

---

## Git & Deploy Rules
- Branch: main (production), develop (working branch)
- Commit format: `feat:`, `fix:`, `style:`, `refactor:`
- Deploy: GitHub → VPS Ubuntu via GitHub Actions
- VPS: PM2 + Nginx reverse proxy
- SSL: Let's Encrypt (Certbot)

---

## DO NOT:
- Use purple gradients or generic AI aesthetics
- Use Inter or Roboto fonts
- Use white backgrounds
- Use generic stock photo URLs — use placeholder services like picsum.photos or unsplash
- Skip TypeScript types
- Hardcode colors outside the CSS variables system
- Use `any` type in TypeScript
