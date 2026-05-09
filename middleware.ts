import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

const ADMIN_COOKIE = 'zarpitas_admin'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  let response = NextResponse.next({ request: { headers: request.headers } })

  // --- Admin protection (password cookie) ---
  if (pathname.startsWith('/admin')) {
    if (pathname === '/admin/login') return response
    const session = request.cookies.get(ADMIN_COOKIE)
    if (!session || session.value !== process.env.ADMIN_PASSWORD) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
    return response
  }

  // --- Customer area protection (Supabase session) ---
  if (pathname.startsWith('/mi-cuenta') && pathname !== '/mi-cuenta/login') {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) { return request.cookies.get(name)?.value },
          set(name: string, value: string, options: CookieOptions) {
            response = NextResponse.next({ request: { headers: request.headers } })
            response.cookies.set({ name, value, ...options })
          },
          remove(name: string, options: CookieOptions) {
            response = NextResponse.next({ request: { headers: request.headers } })
            response.cookies.set({ name, value: '', ...options })
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      const url = new URL('/mi-cuenta/login', request.url)
      url.searchParams.set('redirect', pathname)
      return NextResponse.redirect(url)
    }
  }

  return response
}

export const config = {
  matcher: ['/admin/:path*', '/mi-cuenta/:path*'],
}
