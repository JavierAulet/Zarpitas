'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ShoppingBag, User, Star, LogOut } from 'lucide-react'
import { clsx } from 'clsx'
import { createClient } from '@/lib/supabase/client'

const navItems = [
  { href: '/mi-cuenta/pedidos', label: 'Mis pedidos', icon: ShoppingBag },
  { href: '/mi-cuenta/datos', label: 'Mis datos', icon: User },
  { href: '/mi-cuenta/resenas', label: 'Mis reseñas', icon: Star },
]

export default function AccountNav({ userName }: { userName: string }) {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <aside className="w-full lg:w-56 shrink-0">
      {/* User greeting */}
      <div className="bg-white border-2 border-cream-deep rounded-3xl p-5 mb-4 shadow-card">
        <div className="w-12 h-12 bg-orange rounded-2xl flex items-center justify-center text-white font-black text-lg mb-3">
          {userName.charAt(0).toUpperCase()}
        </div>
        <p className="font-bold text-text-primary text-sm line-clamp-1">{userName}</p>
        <p className="text-text-muted text-xs mt-0.5">Mi cuenta</p>
      </div>

      {/* Nav links */}
      <nav className="bg-white border-2 border-cream-deep rounded-3xl overflow-hidden shadow-card">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex items-center gap-3 px-4 py-3.5 text-sm font-medium transition-colors border-b border-cream-deep last:border-0',
                active
                  ? 'bg-orange-50 text-orange font-bold'
                  : 'text-text-secondary hover:bg-cream-warm hover:text-text-primary'
              )}
            >
              <Icon size={16} />
              {label}
              {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-orange" />}
            </Link>
          )
        })}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3.5 text-sm font-medium text-text-muted hover:text-red-500 hover:bg-red-50 transition-colors"
        >
          <LogOut size={16} />
          Cerrar sesión
        </button>
      </nav>
    </aside>
  )
}
