'use server'
import { createServiceClient } from '@/lib/supabase/server'

export interface CouponResult {
  valid: boolean
  code: string
  type: 'percent' | 'fixed'
  value: number
  discountAmount: number
  error?: string
}

export async function validateCoupon(code: string, subtotal: number): Promise<CouponResult> {
  const db = createServiceClient()
  const normalized = code.trim().toUpperCase()

  const { data: coupon } = await db
    .from('coupons')
    .select('*')
    .eq('code', normalized)
    .eq('active', true)
    .single()

  const fail = (error: string): CouponResult => ({
    valid: false, code: normalized, type: 'percent', value: 0, discountAmount: 0, error,
  })

  if (!coupon) return fail('Código inválido')
  if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) return fail('Código expirado')
  if (coupon.max_uses !== null && coupon.used_count >= coupon.max_uses) return fail('Código agotado')
  if (subtotal < coupon.min_order_amount) return fail(`Pedido mínimo ${coupon.min_order_amount}€`)

  const discountAmount =
    coupon.type === 'percent'
      ? Math.round((subtotal * coupon.value) / 100 * 100) / 100
      : Math.min(coupon.value as number, subtotal)

  return {
    valid: true,
    code: normalized,
    type: coupon.type as 'percent' | 'fixed',
    value: coupon.value as number,
    discountAmount,
  }
}

export async function incrementCouponUsage(code: string): Promise<void> {
  const db = createServiceClient()
  const { data } = await db
    .from('coupons')
    .select('used_count')
    .eq('code', code)
    .single()
  if (data) {
    await db
      .from('coupons')
      .update({ used_count: data.used_count + 1 })
      .eq('code', code)
  }
}
