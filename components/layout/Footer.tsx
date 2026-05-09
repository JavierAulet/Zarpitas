import Link from 'next/link'
import { Instagram, Facebook, Youtube, Mail, Phone, Heart } from 'lucide-react'

const footerLinks = {
  tienda: [
    { href: '/productos', label: 'Todos los productos' },
    { href: '/productos?categoria=perros', label: '🐶 Para Perros' },
    { href: '/productos?categoria=gatos', label: '🐱 Para Gatos' },
    { href: '/productos?badge=nuevo', label: '✨ Novedades' },
    { href: '/productos?badge=oferta', label: '🔥 Ofertas' },
  ],
  ayuda: [
    { href: '/envios', label: 'Envíos y devoluciones' },
    { href: '/faq', label: 'Preguntas frecuentes' },
    { href: '/contacto', label: 'Contacto' },
    { href: '/seguimiento', label: 'Seguir mi pedido' },
  ],
  empresa: [
    { href: '/nosotros', label: 'Nuestra historia' },
    { href: '/blog', label: 'Blog de mascotas' },
    { href: '/afiliados', label: 'Afiliados' },
  ],
}

export default function Footer() {
  return (
    <footer className="bg-cream-warm border-t border-cream-deep">
      {/* Top section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Brand col */}
          <div className="col-span-2">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 mb-4 w-fit">
              <div className="w-10 h-10 bg-orange rounded-xl flex items-center justify-center shadow-orange/30 shadow-md">
                <span className="text-xl">🐾</span>
              </div>
              <span className="font-display font-black text-2xl text-text-primary">
                Zarpitas<span className="text-orange">.</span>
              </span>
            </Link>

            <p className="text-text-secondary text-sm leading-relaxed mb-5 max-w-xs">
              La tienda creada por personas que aman a los animales. Porque tu mascota es
              familia y merece lo mejor.
            </p>

            <div className="space-y-2 mb-6">
              <a href="mailto:hola@zarpitas.es" className="flex items-center gap-2 text-sm text-text-muted hover:text-orange transition-colors">
                <Mail size={14} /> hola@zarpitas.es
              </a>
              <a href="tel:+34900000000" className="flex items-center gap-2 text-sm text-text-muted hover:text-orange transition-colors">
                <Phone size={14} /> +34 900 000 000
              </a>
            </div>

            <div className="flex gap-2">
              {[
                { Icon: Instagram, href: '#', label: 'Instagram' },
                { Icon: Facebook, href: '#', label: 'Facebook' },
                { Icon: Youtube, href: '#', label: 'YouTube' },
              ].map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-9 h-9 rounded-xl bg-white border border-cream-deep text-text-muted hover:text-orange hover:border-orange/30 hover:bg-orange-50 flex items-center justify-center transition-all"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Link cols */}
          <div>
            <h4 className="font-display font-black text-text-primary mb-4 text-sm">TIENDA</h4>
            <ul className="space-y-2.5">
              {footerLinks.tienda.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-text-muted hover:text-orange transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display font-black text-text-primary mb-4 text-sm">AYUDA</h4>
            <ul className="space-y-2.5">
              {footerLinks.ayuda.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-text-muted hover:text-orange transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display font-black text-text-primary mb-4 text-sm">EMPRESA</h4>
            <ul className="space-y-2.5 mb-6">
              {footerLinks.empresa.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-text-muted hover:text-orange transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Trust badge */}
            <div className="p-3 rounded-2xl bg-green-50 border border-green/10">
              <p className="text-xs font-bold text-green">🌿 Comprometidos</p>
              <p className="text-xs text-text-muted mt-0.5">con el bienestar animal</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-cream-deep">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-xs text-text-muted flex items-center gap-1.5">
            Hecho con <Heart size={11} fill="#FF6B35" className="text-orange" /> por amantes de las mascotas ·{' '}
            © {new Date().getFullYear()} Zarpitas.es
          </p>
          <div className="flex items-center gap-2">
            {['Visa', 'Mastercard', 'PayPal', 'Bizum'].map((m) => (
              <span key={m} className="px-2.5 py-1 bg-white rounded-lg border border-cream-deep text-xs text-text-muted font-medium">
                {m}
              </span>
            ))}
          </div>
          <div className="flex gap-4">
            <Link href="/politica-de-privacidad" className="text-xs text-text-muted hover:text-orange transition-colors">Privacidad</Link>
            <Link href="/politica-de-cookies" className="text-xs text-text-muted hover:text-orange transition-colors">Cookies</Link>
            <Link href="/terminos-y-condiciones" className="text-xs text-text-muted hover:text-orange transition-colors">Términos</Link>
            <Link href="/aviso-legal" className="text-xs text-text-muted hover:text-orange transition-colors">Aviso legal</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
