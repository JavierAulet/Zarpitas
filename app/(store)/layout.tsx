import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import CartPanel from '@/components/cart/CartPanel'
import CookieBanner from '@/components/legal/CookieBanner'
import WelcomePopup from '@/components/home/WelcomePopup'

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <CartPanel />
      <main>{children}</main>
      <Footer />
      <CookieBanner />
      <WelcomePopup />
    </>
  )
}
