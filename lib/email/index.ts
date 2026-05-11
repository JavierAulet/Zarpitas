import { Resend } from 'resend'

const FROM = 'Zarpitas <hola@zarpitas.es>'
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'hola@zarpitas.es'

function getResend() {
  return new Resend(process.env.RESEND_API_KEY ?? '')
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OrderEmailData {
  id: string
  customer_email: string
  customer_name: string
  shipping_address: {
    firstName?: string
    address: string
    city: string
    postalCode: string
    province: string
  }
  items: Array<{ name: string; price: number; quantity: number }>
  subtotal: number
  shipping: number
  total: number
}

// ─── Send functions ───────────────────────────────────────────────────────────

export async function sendOrderConfirmation(order: OrderEmailData): Promise<void> {
  try {
    await getResend().emails.send({
      from: FROM,
      to: order.customer_email,
      subject: `¡Pedido confirmado! #${sid(order.id)} — Zarpitas`,
      html: confirmationHtml(order),
    })
  } catch (err) {
    console.error('[Email] sendOrderConfirmation failed:', err)
  }
}

export async function sendAdminNewOrder(order: OrderEmailData): Promise<void> {
  try {
    await getResend().emails.send({
      from: FROM,
      to: ADMIN_EMAIL,
      subject: `🛍️ Nuevo pedido #${sid(order.id)} — ${fmt(order.total)}`,
      html: adminOrderHtml(order),
    })
  } catch (err) {
    console.error('[Email] sendAdminNewOrder failed:', err)
  }
}

export async function sendShippingNotification(order: OrderEmailData): Promise<void> {
  try {
    await getResend().emails.send({
      from: FROM,
      to: order.customer_email,
      subject: `🚀 Tu pedido #${sid(order.id)} está en camino — Zarpitas`,
      html: shippingHtml(order),
    })
  } catch (err) {
    console.error('[Email] sendShippingNotification failed:', err)
  }
}

export async function sendAbandonedCartEmail(
  email: string,
  items: Array<{ name: string; price: number; quantity: number; image?: string | null }>,
  recoverToken: string
): Promise<void> {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://zarpitas.es'
    await getResend().emails.send({
      from: FROM,
      to: email,
      subject: '🛒 Olvidaste algo en tu carrito — Zarpitas',
      html: abandonedCartHtml(items, `${appUrl}/checkout?recover=${recoverToken}`),
    })
  } catch (err) {
    console.error('[Email] sendAbandonedCartEmail failed:', err)
  }
}

export async function sendWelcomeEmail(email: string): Promise<void> {
  try {
    await getResend().emails.send({
      from: FROM,
      to: email,
      subject: '🐾 Tu 10% de descuento te espera — Zarpitas',
      html: welcomeHtml(),
    })
  } catch (err) {
    console.error('[Email] sendWelcomeEmail failed:', err)
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sid(id: string) {
  return id.slice(0, 8).toUpperCase()
}

function fmt(n: number) {
  return n.toFixed(2).replace('.', ',') + '€'
}

function fmtDate(daysFromNow: number) {
  const d = new Date()
  d.setDate(d.getDate() + daysFromNow)
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })
}

function wrap(content: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#F0EDE8;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table width="600" cellpadding="0" cellspacing="0" role="presentation"
               style="max-width:600px;width:100%;background:#FFF8F0;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:#FF6B35;padding:28px 32px;text-align:center;">
              <p style="margin:0;color:#fff;font-size:26px;font-weight:900;letter-spacing:-0.5px;">🐾 Zarpitas</p>
              <p style="margin:5px 0 0;color:rgba(255,255,255,0.75);font-size:12px;letter-spacing:1px;text-transform:uppercase;">Tienda Premium para Mascotas</p>
            </td>
          </tr>
          <tr>
            <td style="padding:36px 32px;">
              ${content}
            </td>
          </tr>
          <tr>
            <td style="background:#1A1A1A;padding:20px 32px;text-align:center;">
              <p style="margin:0;color:#888;font-size:12px;">
                © 2026 <a href="https://zarpitas.es" style="color:#FF6B35;text-decoration:none;">Zarpitas.es</a>
                &nbsp;·&nbsp;
                <a href="mailto:hola@zarpitas.es" style="color:#888;text-decoration:none;">hola@zarpitas.es</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function btn(href: string, label: string): string {
  return `<table cellpadding="0" cellspacing="0" role="presentation" style="margin:28px auto 0;">
    <tr>
      <td style="background:#FF6B35;border-radius:50px;">
        <a href="${href}"
           style="display:inline-block;padding:14px 36px;color:#fff;font-weight:bold;font-size:15px;text-decoration:none;border-radius:50px;">
          ${label}
        </a>
      </td>
    </tr>
  </table>`
}

function itemRows(items: OrderEmailData['items']): string {
  return items.map(i => `
    <tr>
      <td style="padding:11px 0;border-bottom:1px solid #EDE8E0;color:#333;font-size:14px;">${i.name}</td>
      <td style="padding:11px 0;border-bottom:1px solid #EDE8E0;color:#777;font-size:14px;text-align:center;">×${i.quantity}</td>
      <td style="padding:11px 0;border-bottom:1px solid #EDE8E0;color:#FF6B35;font-size:14px;font-weight:bold;text-align:right;">${fmt(i.price * i.quantity)}</td>
    </tr>`).join('')
}

function itemsTable(items: OrderEmailData['items']): string {
  return `<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse:collapse;">
    <tr>
      <th style="text-align:left;padding:0 0 10px;color:#AAA;font-size:11px;font-weight:bold;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #EDE8E0;">Producto</th>
      <th style="text-align:center;padding:0 0 10px;color:#AAA;font-size:11px;font-weight:bold;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #EDE8E0;">Uds.</th>
      <th style="text-align:right;padding:0 0 10px;color:#AAA;font-size:11px;font-weight:bold;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #EDE8E0;">Precio</th>
    </tr>
    ${itemRows(items)}
  </table>`
}

// ─── Templates ────────────────────────────────────────────────────────────────

function confirmationHtml(order: OrderEmailData): string {
  const addr = order.shipping_address
  const firstName = addr.firstName ?? order.customer_name.split(' ')[0]

  return wrap(`
    <h2 style="margin:0 0 6px;color:#1A1A1A;font-size:26px;font-weight:900;">¡Pedido confirmado! 🎉</h2>
    <p style="margin:0 0 26px;color:#666;font-size:15px;">Hola ${firstName}, hemos recibido tu pedido y lo estamos preparando con todo el cariño.</p>

    <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
           style="background:#FFF0E6;border-radius:14px;margin-bottom:28px;">
      <tr>
        <td style="padding:18px 22px;">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
            <tr>
              <td style="color:#888;font-size:13px;">Número de pedido</td>
              <td style="text-align:right;color:#1A1A1A;font-weight:bold;font-size:16px;font-family:monospace;">#${sid(order.id)}</td>
            </tr>
            <tr>
              <td style="color:#888;font-size:13px;padding-top:10px;">Entrega estimada</td>
              <td style="text-align:right;color:#1A1A1A;font-weight:bold;font-size:13px;padding-top:10px;">${fmtDate(5)} – ${fmtDate(15)}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 12px;color:#1A1A1A;font-size:13px;font-weight:bold;text-transform:uppercase;letter-spacing:0.5px;">Tu pedido</p>
    ${itemsTable(order.items)}

    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-top:14px;">
      <tr>
        <td style="color:#777;font-size:14px;padding:5px 0;">Subtotal</td>
        <td style="text-align:right;color:#333;font-size:14px;padding:5px 0;">${fmt(order.subtotal)}</td>
      </tr>
      <tr>
        <td style="color:#777;font-size:14px;padding:5px 0;">Envío</td>
        <td style="text-align:right;font-size:14px;font-weight:${order.shipping === 0 ? 'bold' : 'normal'};color:${order.shipping === 0 ? '#22C55E' : '#333'};padding:5px 0;">
          ${order.shipping === 0 ? 'Gratis 🎉' : fmt(order.shipping)}
        </td>
      </tr>
      <tr>
        <td style="color:#1A1A1A;font-size:18px;font-weight:900;padding:14px 0 0;border-top:2px solid #EDE8E0;">Total</td>
        <td style="text-align:right;color:#FF6B35;font-size:22px;font-weight:900;padding:14px 0 0;border-top:2px solid #EDE8E0;">${fmt(order.total)}</td>
      </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
           style="background:#F5F2EE;border-radius:12px;margin:24px 0;">
      <tr>
        <td style="padding:16px 20px;">
          <p style="margin:0 0 6px;color:#AAA;font-size:11px;font-weight:bold;text-transform:uppercase;letter-spacing:0.5px;">Dirección de envío</p>
          <p style="margin:0;color:#444;font-size:14px;line-height:1.7;">
            ${order.customer_name}<br>
            ${addr.address}<br>
            ${addr.city}, ${addr.postalCode}<br>
            ${addr.province}, España
          </p>
        </td>
      </tr>
    </table>

    ${btn('https://zarpitas.es/mi-cuenta/pedidos', 'Ver mis pedidos →')}
    <p style="margin:20px 0 0;color:#AAA;font-size:12px;text-align:center;">
      ¿Alguna duda? <a href="mailto:hola@zarpitas.es" style="color:#FF6B35;">hola@zarpitas.es</a>
    </p>
  `)
}

function adminOrderHtml(order: OrderEmailData): string {
  const addr = order.shipping_address
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://zarpitas.es'

  return wrap(`
    <h2 style="margin:0 0 6px;color:#1A1A1A;font-size:24px;font-weight:900;">🛍️ Nuevo pedido recibido</h2>
    <p style="margin:0 0 24px;color:#666;font-size:14px;">Se ha procesado un pago exitosamente.</p>

    <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
           style="background:#FFF0E6;border-radius:14px;margin-bottom:24px;">
      <tr>
        <td style="padding:18px 22px;">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
            <tr>
              <td style="color:#888;font-size:13px;">Pedido</td>
              <td style="text-align:right;color:#1A1A1A;font-weight:bold;font-family:monospace;">#${sid(order.id)}</td>
            </tr>
            <tr>
              <td style="color:#888;font-size:13px;padding-top:8px;">Cliente</td>
              <td style="text-align:right;color:#333;font-size:13px;padding-top:8px;">${order.customer_name}</td>
            </tr>
            <tr>
              <td style="color:#888;font-size:13px;padding-top:4px;">Email</td>
              <td style="text-align:right;padding-top:4px;">
                <a href="mailto:${order.customer_email}" style="color:#FF6B35;font-size:13px;text-decoration:none;">${order.customer_email}</a>
              </td>
            </tr>
            <tr>
              <td colspan="2" style="padding:10px 0 0;border-top:1px solid #FFDCC0;margin-top:10px;"></td>
            </tr>
            <tr>
              <td style="color:#1A1A1A;font-size:16px;font-weight:900;padding-top:8px;">Total</td>
              <td style="text-align:right;color:#FF6B35;font-size:22px;font-weight:900;padding-top:8px;">${fmt(order.total)}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 12px;color:#1A1A1A;font-size:13px;font-weight:bold;text-transform:uppercase;letter-spacing:0.5px;">Artículos</p>
    ${itemsTable(order.items)}

    <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
           style="background:#F0F7F0;border-radius:12px;margin-top:20px;">
      <tr>
        <td style="padding:14px 20px;">
          <p style="margin:0 0 5px;color:#AAA;font-size:11px;font-weight:bold;text-transform:uppercase;letter-spacing:0.5px;">Enviar a</p>
          <p style="margin:0;color:#444;font-size:13px;">
            ${addr.address} · ${addr.city} ${addr.postalCode} · ${addr.province}
          </p>
        </td>
      </tr>
    </table>

    ${btn(`${appUrl}/admin/pedidos`, 'Gestionar en el panel →')}
  `)
}

function shippingHtml(order: OrderEmailData): string {
  const firstName = order.shipping_address.firstName ?? order.customer_name.split(' ')[0]

  return wrap(`
    <div style="text-align:center;margin-bottom:28px;">
      <div style="background:#FFF0E6;border-radius:50%;width:72px;height:72px;line-height:72px;font-size:38px;margin:0 auto 18px;">🚀</div>
      <h2 style="margin:0 0 8px;color:#1A1A1A;font-size:26px;font-weight:900;">¡Tu pedido está en camino!</h2>
      <p style="margin:0;color:#666;font-size:15px;">Hola ${firstName}, tu pedido ha salido y pronto llegará a ti.</p>
    </div>

    <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
           style="background:#FFF0E6;border-radius:14px;margin-bottom:28px;">
      <tr>
        <td style="padding:18px 22px;">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
            <tr>
              <td style="color:#888;font-size:13px;">Número de pedido</td>
              <td style="text-align:right;color:#1A1A1A;font-weight:bold;font-family:monospace;">#${sid(order.id)}</td>
            </tr>
            <tr>
              <td style="color:#888;font-size:13px;padding-top:10px;">Entrega estimada</td>
              <td style="text-align:right;color:#1A1A1A;font-weight:bold;font-size:13px;padding-top:10px;">${fmtDate(2)} – ${fmtDate(6)}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 12px;color:#1A1A1A;font-size:13px;font-weight:bold;text-transform:uppercase;letter-spacing:0.5px;">Artículos enviados</p>
    ${itemsTable(order.items)}

    ${btn('https://zarpitas.es/mi-cuenta/pedidos', 'Ver mis pedidos →')}
    <p style="margin:20px 0 0;color:#AAA;font-size:12px;text-align:center;">
      ¿Tienes preguntas sobre tu envío? <a href="mailto:hola@zarpitas.es" style="color:#FF6B35;">hola@zarpitas.es</a>
    </p>
  `)
}

function welcomeHtml(): string {
  return wrap(`
    <div style="text-align:center;">
      <div style="font-size:52px;margin-bottom:18px;">🐾</div>
      <h2 style="margin:0 0 8px;color:#1A1A1A;font-size:28px;font-weight:900;">¡Bienvenido a Zarpitas!</h2>
      <p style="margin:0 0 28px;color:#666;font-size:15px;max-width:380px;margin-left:auto;margin-right:auto;line-height:1.6;">
        Gracias por unirte. Como prometimos, aquí tienes tu código exclusivo para el 10% de descuento en tu primer pedido.
      </p>

      <table cellpadding="0" cellspacing="0" role="presentation" style="margin:0 auto 28px;">
        <tr>
          <td style="background:#FFF0E6;border:2px dashed #FF6B35;border-radius:14px;padding:22px 44px;text-align:center;">
            <p style="margin:0 0 5px;color:#AAA;font-size:11px;font-weight:bold;text-transform:uppercase;letter-spacing:1px;">Tu código de descuento</p>
            <p style="margin:0;color:#FF6B35;font-size:30px;font-weight:900;letter-spacing:4px;font-family:monospace;">BIENVENIDO10</p>
            <p style="margin:7px 0 0;color:#999;font-size:12px;">10% de descuento en tu primer pedido</p>
          </td>
        </tr>
      </table>

      <p style="margin:0 0 6px;color:#555;font-size:14px;">Introduce el código al finalizar tu compra.</p>
      <p style="margin:0 0 0;color:#BBB;font-size:12px;">Válido para primer pedido · No acumulable · Sin fecha de caducidad</p>

      ${btn('https://zarpitas.es/productos', 'Explorar productos →')}

      <p style="margin:20px 0 0;color:#BBB;font-size:12px;">
        ¿Dudas? <a href="mailto:hola@zarpitas.es" style="color:#FF6B35;">hola@zarpitas.es</a>
      </p>
    </div>
  `)
}

function abandonedCartHtml(
  items: Array<{ name: string; price: number; quantity: number }>,
  recoverUrl: string
): string {
  const total = items.reduce((s, i) => s + i.price * i.quantity, 0)
  const rows = items.map(i => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #EDE8E0;color:#333;font-size:14px;">${i.name}</td>
      <td style="padding:10px 0;border-bottom:1px solid #EDE8E0;color:#777;font-size:14px;text-align:center;">×${i.quantity}</td>
      <td style="padding:10px 0;border-bottom:1px solid #EDE8E0;color:#FF6B35;font-size:14px;font-weight:bold;text-align:right;">${fmt(i.price * i.quantity)}</td>
    </tr>`).join('')

  return wrap(`
    <div style="text-align:center;margin-bottom:28px;">
      <div style="font-size:48px;margin-bottom:14px;">🛒</div>
      <h2 style="margin:0 0 8px;color:#1A1A1A;font-size:26px;font-weight:900;">Olvidaste algo en tu carrito</h2>
      <p style="margin:0;color:#666;font-size:15px;">Los artículos que seleccionaste siguen esperándote.</p>
    </div>

    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse:collapse;margin-bottom:20px;">
      <tr>
        <th style="text-align:left;padding:0 0 10px;color:#AAA;font-size:11px;font-weight:bold;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #EDE8E0;">Producto</th>
        <th style="text-align:center;padding:0 0 10px;color:#AAA;font-size:11px;font-weight:bold;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #EDE8E0;">Uds.</th>
        <th style="text-align:right;padding:0 0 10px;color:#AAA;font-size:11px;font-weight:bold;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #EDE8E0;">Precio</th>
      </tr>
      ${rows}
      <tr>
        <td colspan="2" style="padding:14px 0 0;color:#1A1A1A;font-size:16px;font-weight:900;">Total</td>
        <td style="padding:14px 0 0;color:#FF6B35;font-size:20px;font-weight:900;text-align:right;">${fmt(total)}</td>
      </tr>
    </table>

    ${btn(recoverUrl, 'Recuperar mi carrito →')}

    <p style="margin:22px 0 0;color:#AAA;font-size:12px;text-align:center;">
      Tu carrito se guarda durante 48h · <a href="https://zarpitas.es" style="color:#FF6B35;">Seguir comprando</a>
    </p>
  `)
}
