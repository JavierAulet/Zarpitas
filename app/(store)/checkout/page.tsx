'use client'
import { useState, useEffect, useCallback, useRef, Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { ArrowLeft, Lock, ChevronDown, ChevronUp, AlertCircle, Tag, Check, Loader2 } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { useCartStore, useCartTotal } from '@/lib/store/cartStore'
import { createClient } from '@/lib/supabase/client'
import { validateCoupon, incrementCouponUsage } from '@/lib/actions/coupons'
import type { CouponResult } from '@/lib/actions/coupons'
import Button from '@/components/ui/Button'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

const provinces = [
  'Álava','Albacete','Alicante','Almería','Asturias','Ávila','Badajoz','Barcelona',
  'Burgos','Cáceres','Cádiz','Cantabria','Castellón','Ciudad Real','Córdoba','Cuenca',
  'Girona','Granada','Guadalajara','Huelva','Huesca','Jaén','La Coruña','La Rioja',
  'Las Palmas','León','Lleida','Lugo','Madrid','Málaga','Murcia','Navarra','Ourense',
  'Palencia','Pontevedra','Salamanca','Segovia','Sevilla','Soria','Tarragona',
  'Tenerife','Teruel','Toledo','Valencia','Valladolid','Vizcaya','Zamora','Zaragoza',
]

const inputClass =
  'w-full bg-cream-warm border-2 border-cream-deep rounded-2xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-orange/50 transition-colors'
const labelClass = 'block text-xs font-bold text-text-secondary mb-1.5 uppercase tracking-wide'

interface CheckoutForm {
  email: string
  firstName: string
  lastName: string
  address: string
  city: string
  postalCode: string
  province: string
  phone: string
}

// ─── Inner form (needs useStripe + useElements inside <Elements>) ────────────

interface CheckoutInnerProps {
  paymentIntentId: string
  grandTotal: number
  shipping: number
  subtotal: number
  discount: number
  couponCode: string | null
  userId: string | null
  isLoggedIn: boolean
  onSuccess: (orderId: string) => void
}

function CheckoutInner({ paymentIntentId, grandTotal, shipping, subtotal, discount, couponCode, userId, isLoggedIn, onSuccess }: CheckoutInnerProps) {
  const stripe = useStripe()
  const elements = useElements()
  const items = useCartStore((state) => state.items)
  const clearCart = useCartStore((state) => state.clearCart)

  const [loading, setLoading] = useState(false)
  const [stripeReady, setStripeReady] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [summaryOpen, setSummaryOpen] = useState(false)

  const { register, handleSubmit, formState: { errors }, getValues } = useForm<CheckoutForm>()

  const onSubmit = async (data: CheckoutForm) => {
    if (!stripe || !elements) return
    setLoading(true)
    setPaymentError(null)

    // Confirm payment with Stripe
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        payment_method_data: {
          billing_details: {
            name: `${data.firstName} ${data.lastName}`,
            email: data.email,
            phone: data.phone,
            address: {
              line1: data.address,
              city: data.city,
              postal_code: data.postalCode,
              state: data.province,
              country: 'ES',
            },
          },
        },
        return_url: `${window.location.origin}/checkout`,
      },
      redirect: 'if_required',
    })

    if (error) {
      setPaymentError(
        error.type === 'card_error' || error.type === 'validation_error'
          ? (error.message ?? 'Error en el pago')
          : 'El pago no pudo procesarse. Inténtalo de nuevo.'
      )
      setLoading(false)
      return
    }

    if (paymentIntent?.status === 'succeeded') {
      // Save order to Supabase
      try {
        const res = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customer_email: data.email,
            customer_name: `${data.firstName} ${data.lastName}`,
            customer_phone: data.phone,
            shipping_address: {
              firstName: data.firstName,
              lastName: data.lastName,
              address: data.address,
              city: data.city,
              postalCode: data.postalCode,
              province: data.province,
            },
            items: items.map((i) => ({
              id: i.productId,
              name: i.variantName ? `${i.name} — ${i.variantName}` : i.name,
              price: i.price,
              quantity: i.quantity,
              image: i.image ?? null,
              aliexpress_id: i.aliexpressId ?? null,
              aliexpressSkuId: i.aliexpressSkuId ?? null,
              sku_attr: i.sku_attr ?? null,
            })),
            subtotal,
            shipping,
            discount,
            coupon_code: couponCode,
            total: grandTotal,
            user_id: userId,
            stripe_payment_intent_id: paymentIntent.id,
          }),
        })

        if (res.ok) {
          const { id: order_id } = await res.json()
          fetch('/api/orders/confirm', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order_id }),
          }).catch((err) => console.error('[Checkout] Fulfillment error:', err))
          if (couponCode) {
            incrementCouponUsage(couponCode).catch(() => null)
          }
          clearCart()
          onSuccess(order_id)
          return
        }
      } catch (err) {
        console.error('[Checkout] Order save error:', err)
      }

      clearCart()
      onSuccess(paymentIntent.id)
    }

    setLoading(false)
  }

  return (
    <div className="lg:col-span-3">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Contact */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-4xl border-2 border-cream-deep shadow-card p-6 md:p-8"
        >
          <h2 className="font-display font-black text-xl text-text-primary mb-5">📬 Contacto</h2>
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Email</label>
              <input {...register('email', { required: true, pattern: /^\S+@\S+$/ })}
                type="email" placeholder="tu@email.com" className={inputClass} />
              {errors.email && <p className="text-xs text-red-500 mt-1">Email inválido</p>}
            </div>
            <div>
              <label className={labelClass}>Teléfono</label>
              <input {...register('phone', { required: true })}
                type="tel" placeholder="+34 600 000 000" className={inputClass} />
            </div>
          </div>
        </motion.div>

        {/* Shipping */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="bg-white rounded-4xl border-2 border-cream-deep shadow-card p-6 md:p-8"
        >
          <h2 className="font-display font-black text-xl text-text-primary mb-5">🚀 Dirección de envío</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Nombre</label>
                <input {...register('firstName', { required: true })} placeholder="Juan" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Apellidos</label>
                <input {...register('lastName', { required: true })} placeholder="García López" className={inputClass} />
              </div>
            </div>
            <div>
              <label className={labelClass}>Dirección</label>
              <input {...register('address', { required: true })} placeholder="Calle Mayor, 1, 2A" className={inputClass} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Ciudad</label>
                <input {...register('city', { required: true })} placeholder="Madrid" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Código postal</label>
                <input {...register('postalCode', { required: true })} placeholder="28001" className={inputClass} />
              </div>
            </div>
            <div>
              <label className={labelClass}>Provincia</label>
              <select {...register('province', { required: true })} className={`${inputClass} appearance-none`}>
                <option value="">Selecciona...</option>
                {provinces.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
        </motion.div>

        {/* Stripe Payment */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16 }}
          className="bg-white rounded-4xl border-2 border-cream-deep shadow-card p-6 md:p-8"
        >
          <h2 className="font-display font-black text-xl text-text-primary mb-1">💳 Pago</h2>
          <p className="text-xs text-text-muted mb-5 flex items-center gap-1.5">
            <Lock size={10} /> Pago procesado por Stripe — datos cifrados con SSL
          </p>

          <PaymentElement
            onReady={() => setStripeReady(true)}
            options={{
              layout: 'tabs',
              fields: { billingDetails: { address: 'never' } },
            }}
          />

          {paymentError && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-100 rounded-2xl text-sm text-red-600"
            >
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              {paymentError}
            </motion.div>
          )}

          <div className="flex items-center gap-2 mt-5 pt-4 border-t border-cream-deep">
            {['Visa', 'Mastercard', 'Apple Pay', 'Google Pay'].map((m) => (
              <span key={m} className="px-2.5 py-1 bg-cream-warm rounded-xl border border-cream-deep text-xs text-text-muted font-medium">
                {m}
              </span>
            ))}
          </div>
        </motion.div>

        <Button
          type="submit"
          fullWidth
          size="lg"
          loading={loading}
          disabled={!stripe || !stripeReady}
          className="group"
        >
          {loading
            ? 'Procesando pago...'
            : `Pagar ${grandTotal.toFixed(2).replace('.', ',')}€ 🔒`}
        </Button>

        <p className="text-center text-xs text-text-muted">
          Al confirmar aceptas nuestros <Link href="/legal" className="underline hover:text-orange">términos de servicio</Link>.
          Pago procesado por Stripe.
        </p>
      </form>

      {/* Mobile summary toggle */}
      <div className="lg:hidden mt-5">
        <button
          onClick={() => setSummaryOpen(!summaryOpen)}
          className="w-full flex items-center justify-between px-4 py-3 bg-white border-2 border-cream-deep rounded-2xl text-sm font-bold text-orange"
        >
          {summaryOpen ? 'Ocultar resumen' : 'Ver resumen del pedido'}
          {summaryOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>
      </div>
    </div>
  )
}

// ─── Success screen ───────────────────────────────────────────────────────────

function SuccessScreen({ isLoggedIn, orderId }: { isLoggedIn: boolean; orderId: string }) {
  const deliveryFrom = new Date()
  deliveryFrom.setDate(deliveryFrom.getDate() + 5)
  const deliveryTo = new Date()
  deliveryTo.setDate(deliveryTo.getDate() + 15)

  const fmt = (d: Date) =>
    d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })

  const shortId = orderId.slice(0, 8).toUpperCase()

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-md w-full text-center"
      >
        <div className="w-24 h-24 rounded-4xl bg-green-50 border-2 border-green/20 flex items-center justify-center mx-auto mb-6 text-5xl">
          🎉
        </div>
        <h1 className="font-display font-black text-4xl text-text-primary mb-3">¡Pedido confirmado!</h1>
        <p className="text-text-secondary mb-4 leading-relaxed">
          Tu pago se ha procesado correctamente. Recibirás un email de confirmación en breve.
        </p>

        <div className="bg-white border-2 border-cream-deep rounded-3xl p-4 mb-4 text-left space-y-2.5 shadow-card">
          <div className="flex justify-between text-sm">
            <span className="text-text-muted">Nº de pedido</span>
            <span className="font-mono font-bold text-text-primary">#{shortId}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-text-muted">Entrega estimada</span>
            <span className="font-bold text-text-primary">{fmt(deliveryFrom)} – {fmt(deliveryTo)}</span>
          </div>
        </div>

        <div className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-orange-50 border border-orange/10 text-orange font-bold text-sm mb-6">
          🐾 Tu mascota te lo va a agradecer
        </div>

        {!isLoggedIn && (
          <div className="bg-white border-2 border-cream-deep rounded-3xl p-5 mb-6 text-left shadow-card">
            <p className="font-bold text-text-primary text-sm mb-1">¿Quieres seguir tu pedido?</p>
            <p className="text-text-muted text-xs mb-3">
              Crea tu cuenta gratis y verás el estado de envío en tiempo real.
            </p>
            <Link
              href="/mi-cuenta/login"
              className="inline-flex items-center gap-1.5 bg-orange text-white font-bold px-4 py-2 rounded-xl text-xs transition-colors hover:bg-orange-dark"
            >
              Crear cuenta gratis →
            </Link>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {isLoggedIn && (
            <Link href="/mi-cuenta/pedidos">
              <Button fullWidth size="lg">Ver mis pedidos 📦</Button>
            </Link>
          )}
          <Link href="/">
            <Button variant={isLoggedIn ? 'secondary' : 'primary'} fullWidth size="lg">
              Volver al inicio
            </Button>
          </Link>
          <Link href="/productos">
            <Button variant="secondary" fullWidth size="lg">Seguir comprando</Button>
          </Link>
        </div>
      </motion.div>
    </div>
  )
}

// ─── Order summary sidebar ────────────────────────────────────────────────────

function OrderSummary({ total, shipping, grandTotal, freeShipping, discount, coupon, subtotal, onCouponApplied }: {
  total: number
  shipping: number
  grandTotal: number
  freeShipping: boolean
  discount: number
  coupon: CouponResult | null
  subtotal: number
  onCouponApplied: (result: CouponResult | null) => void
}) {
  const items = useCartStore((state) => state.items)
  const [couponInput, setCouponInput] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)
  const [couponError, setCouponError] = useState<string | null>(null)

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return
    setCouponLoading(true)
    setCouponError(null)
    const result = await validateCoupon(couponInput, subtotal)
    if (result.valid) {
      onCouponApplied(result)
    } else {
      setCouponError(result.error ?? 'Código inválido')
      onCouponApplied(null)
    }
    setCouponLoading(false)
  }

  const handleRemoveCoupon = () => {
    onCouponApplied(null)
    setCouponInput('')
    setCouponError(null)
  }

  return (
    <div className="lg:col-span-2">
      <motion.div
        initial={{ opacity: 0, x: 16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.12 }}
        className="bg-white rounded-4xl border-2 border-cream-deep shadow-card sticky top-28 overflow-hidden"
      >
        <div className="p-6 md:p-7">
          <h3 className="font-display font-black text-lg text-text-primary mb-5">Resumen 🧾</h3>

          <div className="space-y-4 mb-5">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-3">
                <div className="relative w-14 h-14 rounded-2xl overflow-hidden flex-shrink-0 bg-cream-warm border-2 border-cream-deep">
                  {item.image && <Image src={item.image} alt={item.name} fill sizes="56px" className="object-cover" />}
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-orange text-white text-[10px] font-black rounded-full flex items-center justify-center">
                    {item.quantity}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-text-primary line-clamp-2">{item.name}</p>
                </div>
                <span className="font-display font-black text-sm text-orange shrink-0">
                  {(item.price * item.quantity).toFixed(2).replace('.', ',')}€
                </span>
              </div>
            ))}
          </div>

          {/* Coupon input */}
          <div className="pt-4 border-t-2 border-cream-deep mb-4">
            {coupon ? (
              <div className="flex items-center justify-between bg-green-50 border border-green/20 rounded-2xl px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <Tag size={13} className="text-green shrink-0" />
                  <span className="text-xs font-bold text-green">{coupon.code}</span>
                  <span className="text-xs text-green">
                    {coupon.type === 'percent' ? `-${coupon.value}%` : `-${coupon.value}€`}
                  </span>
                </div>
                <button onClick={handleRemoveCoupon} className="text-xs text-text-muted hover:text-red-500 transition-colors font-medium">
                  Quitar
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                      placeholder="Código de descuento"
                      className="w-full bg-cream-warm border-2 border-cream-deep rounded-xl pl-8 pr-3 py-2 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-orange/50 transition-colors font-mono"
                    />
                  </div>
                  <button
                    onClick={handleApplyCoupon}
                    disabled={couponLoading || !couponInput.trim()}
                    className="flex items-center gap-1.5 px-3 py-2 bg-text-primary text-white text-xs font-bold rounded-xl hover:bg-text-secondary transition-colors disabled:opacity-50 shrink-0"
                  >
                    {couponLoading ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
                    Aplicar
                  </button>
                </div>
                {couponError && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle size={11} /> {couponError}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2.5">
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">Subtotal</span>
              <span className="font-medium">{total.toFixed(2).replace('.', ',')}€</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-green font-bold flex items-center gap-1">
                  <Tag size={11} /> Descuento
                </span>
                <span className="font-bold text-green">-{discount.toFixed(2).replace('.', ',')}€</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">Envío</span>
              <span className={freeShipping ? 'font-bold text-green' : 'font-medium'}>
                {freeShipping ? 'Gratis 🎉' : `${shipping.toFixed(2).replace('.', ',')}€`}
              </span>
            </div>
            <div className="flex justify-between items-center pt-3 border-t-2 border-cream-deep">
              <span className="font-display font-black text-text-primary">Total</span>
              <span className="font-display font-black text-2xl text-orange">
                {grandTotal.toFixed(2).replace('.', ',')}€
              </span>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-cream-deep space-y-2">
            {[
              { icon: '🔒', text: 'Pago 100% seguro con Stripe' },
              { icon: '🚀', text: 'Envío gratuito con seguimiento' },
              { icon: '↩️', text: 'Devolución 30 días gratis' },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-2 text-xs text-text-muted">
                <span>{icon}</span> {text}
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// ─── Page root ────────────────────────────────────────────────────────────────

// ─── Cart recovery (isolated to satisfy Suspense requirement for useSearchParams) ─

function CartRecovery() {
  const searchParams = useSearchParams()
  const restoreCart = useCartStore((state) => state.restoreCart)
  const recoveredRef = useRef(false)

  useEffect(() => {
    const token = searchParams.get('recover')
    if (!token || recoveredRef.current) return
    recoveredRef.current = true
    fetch(`/api/cart/recover?token=${token}`)
      .then((r) => r.json())
      .then((data) => { if (data.items?.length) restoreCart(data.items) })
      .catch(() => null)
  }, [searchParams, restoreCart])

  return null
}

// ─── Page root ────────────────────────────────────────────────────────────────

export default function CheckoutPage() {
  const items = useCartStore((state) => state.items)
  const total = useCartTotal()
  const freeShipping = total >= 40
  const shipping = freeShipping ? 0 : 4.99

  const [appliedCoupon, setAppliedCoupon] = useState<CouponResult | null>(null)
  const discount = appliedCoupon?.discountAmount ?? 0
  const grandTotal = Math.max(0, total + shipping - discount)

  const [success, setSuccess] = useState(false)
  const [orderId, setOrderId] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [paymentIntentId, setPaymentIntentId] = useState<string>('')
  const [sessionError, setSessionError] = useState<string | null>(null)

  useEffect(() => {
    createClient().auth.getUser().then(({ data: { user } }) => {
      if (user) { setUserId(user.id); setIsLoggedIn(true) }
    })
  }, [])

  const createPaymentIntent = useCallback(async () => {
    if (items.length === 0) return
    setSessionError(null)
    try {
      const res = await fetch('/api/checkout/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Math.round(grandTotal * 100), // convert to cents
          currency: 'eur',
          customer_email: undefined,
          metadata: { item_count: String(items.length) },
        }),
      })

      if (!res.ok) throw new Error('Could not create payment session')
      const data = await res.json()
      setClientSecret(data.client_secret)
      setPaymentIntentId(data.payment_intent_id)
    } catch (err) {
      console.error('[Checkout] PaymentIntent error:', err)
      setSessionError('No se pudo iniciar la sesión de pago. Recarga la página.')
    }
  }, [grandTotal, items.length])

  useEffect(() => {
    createPaymentIntent()
  }, [createPaymentIntent])

  if (success) return <SuccessScreen isLoggedIn={isLoggedIn} orderId={orderId} />

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <p className="text-text-secondary mb-4 font-medium">Tu carrito está vacío</p>
          <Link href="/productos"><Button>Ver productos</Button></Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream pt-20">
      <Suspense fallback={null}><CartRecovery /></Suspense>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="flex items-center gap-4 mb-10">
          <Link
            href="/carrito"
            className="p-2.5 rounded-2xl hover:bg-cream-warm border-2 border-cream-deep text-text-muted hover:text-text-primary transition-all"
          >
            <ArrowLeft size={17} />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-orange rounded-xl flex items-center justify-center">
              <span className="text-lg">🐾</span>
            </div>
            <span className="font-display font-black text-xl text-text-primary">
              Zarpitas<span className="text-orange">.</span>
            </span>
          </div>
          <div className="ml-auto flex items-center gap-1.5 text-xs text-text-muted font-medium">
            <Lock size={11} /> Pago seguro con Stripe
          </div>
        </div>

        {sessionError && (
          <div className="mb-6 flex items-center gap-3 bg-red-50 border border-red-100 rounded-2xl p-4">
            <AlertCircle size={16} className="text-red-500 shrink-0" />
            <p className="text-red-600 text-sm">{sessionError}</p>
            <button onClick={createPaymentIntent} className="ml-auto text-xs font-bold text-red-600 underline">
              Reintentar
            </button>
          </div>
        )}

        <div className="grid lg:grid-cols-5 gap-8">
          {clientSecret ? (
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret,
                appearance: {
                  theme: 'stripe',
                  variables: {
                    colorPrimary: '#FF6B35',
                    colorBackground: '#FFF8F0',
                    colorText: '#1A1A1A',
                    colorDanger: '#E53E3E',
                    fontFamily: 'system-ui, sans-serif',
                    borderRadius: '12px',
                  },
                },
              }}
            >
              <CheckoutInner
                paymentIntentId={paymentIntentId}
                grandTotal={grandTotal}
                shipping={shipping}
                subtotal={total}
                discount={discount}
                couponCode={appliedCoupon?.code ?? null}
                userId={userId}
                isLoggedIn={isLoggedIn}
                onSuccess={(id) => { setOrderId(id); setSuccess(true) }}
              />
            </Elements>
          ) : (
            <div className="lg:col-span-3 space-y-5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-4xl border-2 border-cream-deep shadow-card p-6 md:p-8 animate-pulse">
                  <div className="h-6 bg-cream-deep rounded-full w-40 mb-5" />
                  <div className="space-y-3">
                    <div className="h-12 bg-cream-warm rounded-2xl" />
                    <div className="h-12 bg-cream-warm rounded-2xl" />
                  </div>
                </div>
              ))}
            </div>
          )}

          <OrderSummary
            total={total}
            shipping={shipping}
            grandTotal={grandTotal}
            freeShipping={freeShipping}
            discount={discount}
            coupon={appliedCoupon}
            subtotal={total}
            onCouponApplied={setAppliedCoupon}
          />
        </div>
      </div>
    </div>
  )
}
