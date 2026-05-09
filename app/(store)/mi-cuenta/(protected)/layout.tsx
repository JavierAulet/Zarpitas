import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import AccountNav from '@/components/account/AccountNav'

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/mi-cuenta/login')

  const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Cliente'

  return (
    <div className="min-h-screen bg-cream pt-24 pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-6">
          <AccountNav userName={userName} />
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
    </div>
  )
}
