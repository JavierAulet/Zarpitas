'use strict'

const express = require('express')
const cors = require('cors')
const { createHmac } = require('crypto')

const app = express()
app.use(express.json())

const ALLOWED_ORIGINS = [
  'https://zarpitas.es',
  'https://www.zarpitas.es',
  'http://localhost:3000',
]

app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (curl, Railway health checks)
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true)
    cb(new Error('CORS: origin not allowed'))
  },
}))

// ─── AliExpress Official API ──────────────────────────────────────────────────

const AE_BASE_URL = 'https://api-sg.aliexpress.com/sync'
const APP_KEY = process.env.ALIEXPRESS_APP_KEY ?? ''
const APP_SECRET = (process.env.ALIEXPRESS_APP_SECRET ?? '').trim()

function generateSignature(params, secret) {
  const concatenated = Object.keys(params)
    .sort()
    .map((k) => `${k}${params[k]}`)
    .join('')
  return createHmac('sha256', secret).update(concatenated).digest('hex').toUpperCase()
}

async function callAPI(method, params) {
  const base = {
    app_key: APP_KEY,
    timestamp: Date.now().toString(),
    sign_method: 'hmac-sha256',
    format: 'json',
    v: '2.0',
    method,
    ...params,
  }
  base.sign = generateSignature(base, APP_SECRET)

  const res = await fetch(AE_BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8' },
    body: new URLSearchParams(base).toString(),
  })

  if (!res.ok) throw new Error(`AliExpress API error: ${res.status}`)

  const json = await res.json()
  const responseKey = method.replace(/\./g, '_') + '_response'
  if (json[responseKey]) return json[responseKey]
  if (json.error_response) throw new Error(json.error_response.msg ?? 'AliExpress error')
  return json
}

// ─── Product scraping fallback ────────────────────────────────────────────────

function parseRunParams(html) {
  const patterns = [
    /window\.runParams\s*=\s*(\{[\s\S]*?\});\s*(?:window|var\s|<\/script>)/,
    /"data"\s*:\s*(\{[\s\S]*?"productInfoComponent"[\s\S]*?\})\s*,\s*"[\w]+"\s*:/,
  ]

  for (const pattern of patterns) {
    const match = html.match(pattern)
    if (!match) continue
    try {
      const raw = JSON.parse(match[1])
      const d = raw?.data ?? raw

      const name =
        d?.productInfoComponent?.subject ??
        d?.subject ??
        d?.title ??
        ''

      const priceComp = d?.priceComponent ?? d?.price ?? {}
      const priceStr =
        priceComp?.discountPrice?.minActivityAmount?.value ??
        priceComp?.originalPrice?.minAmount?.value ??
        priceComp?.salePriceString ??
        ''

      const imageComp = d?.imageComponent ?? d?.image ?? {}
      const rawImages =
        imageComp?.imagePathList ??
        imageComp?.images ??
        d?.imagePathList ??
        []

      const images = rawImages.map((img) =>
        img.startsWith('//') ? `https:${img}` : img
      )

      if (!name && !priceStr && !images.length) continue

      return { name, price: priceStr ? parseFloat(priceStr) : 0, images, description: '' }
    } catch {
      continue
    }
  }
  return null
}

async function tryFetch(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.144 Mobile Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'es-ES,es;q=0.9',
      'Cache-Control': 'no-cache',
    },
    redirect: 'follow',
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.text()
}

async function scrapeProduct(productId) {
  const urls = [
    `https://m.aliexpress.com/item/${productId}.html`,
    `https://www.aliexpress.com/item/${productId}.html`,
    `https://es.aliexpress.com/item/${productId}.html`,
  ]

  for (const url of urls) {
    try {
      const html = await tryFetch(url)
      const parsed = parseRunParams(html)
      if (parsed) return { id: productId, ...parsed, originalPrice: null }

      const ogTitle = html.match(/<meta[^>]+property="og:title"[^>]+content="([^"]+)"/)?.[1] ?? ''
      const ogImage = html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/)?.[1] ?? ''
      if (ogTitle) {
        return { id: productId, name: ogTitle, price: 0, originalPrice: null, images: ogImage ? [ogImage] : [], description: '' }
      }
    } catch {
      continue
    }
  }
  throw new Error('BLOCKED')
}

// ─── AliExpress domain functions ──────────────────────────────────────────────

async function getAliExpressProduct(productId) {
  const raw = await callAPI('aliexpress.ds.product.get', {
    product_id: productId,
    local_country: 'ES',
    local_language: 'es',
    country_code: 'ES',
  })

  const result = raw.result
  if (!result) throw new Error('No result in product response')

  const skus = result.aeop_ae_product_s_k_us?.global_aeop_ae_product_sku ?? []
  const imageUrls = (result.image_u_r_ls ?? '').split(';').filter(Boolean)
  const aePrice = result.aeop_ae_product_price ?? {}
  const price = parseFloat(aePrice.min_activity_amount ?? '0')
  const originalPrice = aePrice.min_amount ? parseFloat(aePrice.min_amount) : null

  const variants = skus.map((sku) => ({
    sku_id: String(sku.id ?? ''),
    sku_attr: String(sku.sku_attr ?? ''),
    price: parseFloat(String(sku.offer_sale_price ?? sku.sku_price ?? '0')),
    stock: parseInt(String(sku.ipm_sku_stock ?? '0'), 10),
    image: sku.sku_image ?? undefined,
  }))

  const totalStock = variants.reduce((sum, v) => sum + v.stock, 0)

  return {
    id: productId,
    name: String(result.product_title ?? ''),
    price,
    originalPrice,
    images: imageUrls,
    description: String(result.aeop_ae_description?.description ?? ''),
    variants,
    stock: totalStock,
    category_id: String(result.category_id ?? ''),
  }
}

async function searchAliExpressProducts(keywords, options = {}) {
  const params = {
    keywords,
    local_country: options.local_country ?? 'ES',
    local_language: options.local_language ?? 'es',
    countryCode: options.local_country ?? 'ES',
    currency: 'EUR',
    local: options.local_language ?? 'es',
    sort: options.sort ?? 'LAST_VOLUME_DESC',
    page_index: String(options.page_index ?? 1),
    page_size: String(options.page_size ?? 20),
  }
  if (options.category_id) params.category_id = options.category_id

  const raw = await callAPI('aliexpress.ds.text.search', params)
  const items = raw.data ?? raw
  const list = items.products ?? []
  const total = parseInt(String(items.total_count ?? list.length), 10)

  const products = list.map((p) => ({
    product_id: String(p.product_id ?? ''),
    product_title: String(p.product_title ?? ''),
    sale_price: parseFloat(String(p.target_sale_price ?? p.sale_price ?? '0')),
    original_price: p.original_price ? parseFloat(String(p.original_price)) : null,
    product_main_image_url: String(p.product_main_image_url ?? ''),
    evaluate_rate: String(p.evaluate_rate ?? '0'),
    lastest_volume: parseInt(String(p.lastest_volume ?? '0'), 10),
  }))

  return { products, total, page: options.page_index ?? 1 }
}

async function createAliExpressOrder(orderParams) {
  const params = {
    param_place_order_request4_open_api_d_t_o: JSON.stringify({
      out_order_id: orderParams.out_order_id,
      logistics_address: orderParams.logistics_address,
      product_items: orderParams.product_items,
    }),
  }

  const raw = await callAPI('aliexpress.trade.order.create', params)

  if (raw.result === false || raw.is_success === false) {
    return {
      success: false,
      error: String(raw.error_msg ?? raw.error_code ?? 'Order creation failed'),
    }
  }

  const orderList = Array.isArray(raw.order_list)
    ? raw.order_list
    : raw.order_list ? [raw.order_list] : []

  return {
    success: true,
    order_list: orderList.map((o) => ({
      order_id: parseInt(String(o.order_id ?? '0'), 10),
      product_id: parseInt(String(o.product_id ?? '0'), 10),
    })),
  }
}

async function getTrackingInfo(orderId) {
  const raw = await callAPI('aliexpress.logistics.order.trackinginfo.query', {
    logistics_no: orderId,
  })

  const details = raw.result
  if (!details) return null

  const events = (details.tracking_info?.module ?? []).map((e) => ({
    event_date: String(e.time_detail ?? e.event_date ?? ''),
    event_desc: String(e.event_detail ?? e.status ?? ''),
    address: String(e.address ?? ''),
  }))

  return {
    logistics_no: String(details.logistics_no ?? orderId),
    carrier: String(details.official_website ?? details.company_name ?? ''),
    events,
  }
}

// ─── Routes ───────────────────────────────────────────────────────────────────

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// GET /product?id=1005006100091637
// Uses official API if credentials are set, falls back to scraping
app.get('/product', async (req, res) => {
  const id = req.query.id
  if (!id) return res.status(400).json({ error: 'Missing id parameter' })

  try {
    if (APP_KEY && APP_SECRET) {
      const product = await getAliExpressProduct(id)
      return res.json(product)
    }
    // Scraping fallback when API key not yet approved
    const product = await scrapeProduct(id)
    return res.json(product)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    const status = message === 'BLOCKED' ? 502 : 500
    return res.status(status).json({ error: message })
  }
})

// GET /search?q=collar+perro&page=1&size=20&sort=LAST_VOLUME_DESC&category=...
app.get('/search', async (req, res) => {
  const q = req.query.q
  if (!q) return res.status(400).json({ error: 'Missing q parameter' })

  try {
    const result = await searchAliExpressProducts(q, {
      page_index: parseInt(req.query.page ?? '1', 10),
      page_size: Math.min(parseInt(req.query.size ?? '20', 10), 50),
      sort: req.query.sort ?? 'LAST_VOLUME_DESC',
      category_id: req.query.category ?? undefined,
    })
    return res.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return res.status(502).json({ error: message })
  }
})

// POST /order
// Body: { out_order_id, logistics_address, product_items }
app.post('/order', async (req, res) => {
  const { out_order_id, logistics_address, product_items } = req.body ?? {}
  if (!out_order_id || !logistics_address || !product_items) {
    return res.status(400).json({ error: 'Missing required order fields' })
  }

  try {
    const result = await createAliExpressOrder({ out_order_id, logistics_address, product_items })
    return res.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return res.status(502).json({ error: message })
  }
})

// GET /tracking?order_id=123456789
app.get('/tracking', async (req, res) => {
  const order_id = req.query.order_id
  if (!order_id) return res.status(400).json({ error: 'Missing order_id parameter' })

  try {
    const info = await getTrackingInfo(order_id)
    if (!info) return res.status(404).json({ error: 'No tracking info found' })
    return res.json(info)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return res.status(502).json({ error: message })
  }
})

// ─── Start ────────────────────────────────────────────────────────────────────

const PORT = process.env.PORT ?? 3001
app.listen(PORT, () => {
  console.log(`[zarpitas-api] Running on port ${PORT}`)
  console.log(`[zarpitas-api] AliExpress API key: ${APP_KEY ? `${APP_KEY.slice(0, 4)}****` : 'NOT SET (scraping mode)'}`)
})
