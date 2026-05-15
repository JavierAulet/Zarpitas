require('dotenv').config()

const express = require('express')
const crypto = require('crypto')

const app = express()
app.use(express.json())

const PORT = process.env.PORT || 3000
const APP_KEY = process.env.ALIEXPRESS_APP_KEY
const APP_SECRET = process.env.ALIEXPRESS_APP_SECRET
const ACCESS_TOKEN = process.env.ALIEXPRESS_ACCESS_TOKEN
const BASE_URL = 'https://api-sg.aliexpress.com/sync'

// ─── Signing ──────────────────────────────────────────────────────────────────

function sign(params) {
  const sorted = Object.keys(params).sort().map((k) => `${k}${params[k]}`).join('')
  return crypto.createHmac('sha256', APP_SECRET).update(sorted).digest('hex').toUpperCase()
}

// ─── Raw AliExpress call ──────────────────────────────────────────────────────

async function callAliExpress(method, extraParams) {
  const params = {
    app_key: APP_KEY,
    timestamp: Date.now().toString(),
    sign_method: 'hmac-sha256',
    format: 'json',
    v: '2.0',
    method,
    session: ACCESS_TOKEN,
    ...extraParams,
  }
  params.sign = sign(params)

  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8' },
    body: new URLSearchParams(params).toString(),
  })

  return res.json()
}

// ─── Address normalization ────────────────────────────────────────────────────

function removeAccents(str) {
  return str.normalize('NFD').replace(/[̀-ͯ]/g, '')
}

// Maps Spanish provinces → autonomous community (what AliExpress accepts)
const PROVINCE_MAP = {
  // Andalucía
  'almeria': 'Andalucia', 'cadiz': 'Andalucia', 'cordoba': 'Andalucia',
  'granada': 'Andalucia', 'huelva': 'Andalucia', 'jaen': 'Andalucia',
  'malaga': 'Andalucia', 'sevilla': 'Andalucia', 'seville': 'Andalucia',
  // Aragón
  'huesca': 'Aragon', 'teruel': 'Aragon', 'zaragoza': 'Aragon',
  // Asturias
  'asturias': 'Asturias',
  // Baleares
  'baleares': 'Balearic Islands', 'islas baleares': 'Balearic Islands', 'illes balears': 'Balearic Islands',
  // País Vasco
  'alava': 'Basque Country', 'guipuzcoa': 'Basque Country', 'vizcaya': 'Basque Country',
  'araba': 'Basque Country', 'gipuzkoa': 'Basque Country', 'bizkaia': 'Basque Country',
  // Canarias
  'las palmas': 'Canary Islands', 'santa cruz de tenerife': 'Canary Islands', 'canarias': 'Canary Islands',
  // Cantabria
  'cantabria': 'Cantabria',
  // Castilla-La Mancha
  'albacete': 'Castilla La Mancha', 'ciudad real': 'Castilla La Mancha',
  'cuenca': 'Castilla La Mancha', 'guadalajara': 'Castilla La Mancha', 'toledo': 'Castilla La Mancha',
  // Castilla y León
  'avila': 'Castilla y Leon', 'burgos': 'Castilla y Leon', 'leon': 'Castilla y Leon',
  'palencia': 'Castilla y Leon', 'salamanca': 'Castilla y Leon', 'segovia': 'Castilla y Leon',
  'soria': 'Castilla y Leon', 'valladolid': 'Castilla y Leon', 'zamora': 'Castilla y Leon',
  // Cataluña
  'barcelona': 'Catalonia', 'girona': 'Catalonia', 'gerona': 'Catalonia',
  'lleida': 'Catalonia', 'lerida': 'Catalonia', 'tarragona': 'Catalonia', 'cataluna': 'Catalonia',
  // Extremadura
  'badajoz': 'Extremadura', 'caceres': 'Extremadura',
  // Galicia
  'a coruna': 'Galicia', 'lugo': 'Galicia', 'ourense': 'Galicia', 'pontevedra': 'Galicia',
  // La Rioja
  'la rioja': 'La Rioja', 'rioja': 'La Rioja',
  // Madrid
  'madrid': 'Madrid',
  // Murcia
  'murcia': 'Murcia',
  // Navarra
  'navarra': 'Navarra', 'navarre': 'Navarra',
  // Comunitat Valenciana
  'valencia': 'Valencia', 'alicante': 'Valencia', 'alacant': 'Valencia',
  'castellon': 'Valencia', 'castello': 'Valencia',
  // Ceuta / Melilla
  'ceuta': 'Ceuta', 'melilla': 'Melilla',
}

function normalizeSpanishAddress(addr) {
  const province = addr.province ?? ''
  const provinceKey = removeAccents(province).toLowerCase().trim()
  const mappedProvince = PROVINCE_MAP[provinceKey] ?? removeAccents(province)

  return {
    ...addr,
    address: removeAccents(addr.address ?? ''),
    city: mappedProvince,  // use mapped province as city — AliExpress validates city against known list
    province: mappedProvince,
    contact_person: removeAccents(addr.contact_person ?? addr.full_name ?? ''),
    full_name: removeAccents(addr.full_name ?? addr.contact_person ?? ''),
  }
}

// ─── SKU lookup: numeric sku_id → sku_attr string ("14:xxx") ─────────────────

async function resolveSkuAttr(productId, skuIdOrAttr) {
  if (!skuIdOrAttr) return undefined
  if (String(skuIdOrAttr).includes(':')) return String(skuIdOrAttr) // already in correct format

  // Numeric sku_id — fetch product to find matching sku_attr
  try {
    const raw = await callAliExpress('aliexpress.ds.product.get', {
      product_id: String(productId),
      local_country: 'ES',
      local_language: 'en',
    })
    const envelope = raw.aliexpress_ds_product_get_response ?? raw
    const result = envelope?.result ?? {}
    // Log keys to find correct SKU path
    console.log(`[sku-lookup] result keys:`, Object.keys(result))
    const skuContainer = result.aeop_ae_product_s_k_us ?? result.ae_item_sku_info_dtos ?? result.skus ?? {}
    console.log(`[sku-lookup] skuContainer keys:`, Object.keys(skuContainer))
    const skus =
      skuContainer.global_aeop_ae_product_sku ??
      skuContainer.ae_item_sku_info_d_t_o ??
      skuContainer.sku ??
      []
    const match = skus.find((s) => String(s.id) === String(skuIdOrAttr) || String(s.sku_id) === String(skuIdOrAttr))
    if (match?.sku_attr) {
      console.log(`[sku-lookup] Resolved ${skuIdOrAttr} → ${match.sku_attr}`)
      return String(match.sku_attr)
    }
    console.log(`[sku-lookup] No match for sku_id=${skuIdOrAttr}, skus:`, JSON.stringify(skus).slice(0, 300))
  } catch (err) {
    console.error('[sku-lookup] Error:', err.message)
  }
  return undefined
}

// ─── Health ───────────────────────────────────────────────────────────────────

app.get('/health', (req, res) => {
  res.json({
    ok: true,
    app_key: APP_KEY ? 'SET' : 'NOT SET',
    app_secret: APP_SECRET ? 'SET' : 'NOT SET',
    access_token: ACCESS_TOKEN ? 'SET' : 'NOT SET',
  })
})

// ─── Order ────────────────────────────────────────────────────────────────────

app.post('/order', async (req, res) => {
  const { out_id, logistics_address, product_items } = req.body

  if (!out_id || !logistics_address || !product_items?.length) {
    return res.status(400).json({ success: false, error: 'Missing required fields' })
  }

  const normalizedAddress = {
    ...normalizeSpanishAddress(logistics_address),
    phone_country_code: logistics_address.phone_country_code ?? logistics_address.phone_country ?? '34',
    phone_country: logistics_address.phone_country ?? logistics_address.phone_country_code ?? '34',
  }

  console.log('[/order] Normalized address:', JSON.stringify(normalizedAddress))

  // Resolve sku_attr for each item (translate numeric sku_id → "14:xxx" format)
  const resolvedItems = await Promise.all(
    product_items.map(async (item) => {
      const skuAttr = await resolveSkuAttr(item.product_id, item.sku_attr ?? item.sku_id)
      const resolved = { product_id: item.product_id, product_count: item.product_count }
      if (skuAttr) resolved.sku_attr = skuAttr
      return resolved
    })
  )
  console.log('[/order] Resolved items:', JSON.stringify(resolvedItems))

  const orderPayload = { out_id, logistics_address: normalizedAddress, product_items: resolvedItems }

  const attempts = [
    // DS API — la API pidió este param key cuando enviamos param_place_ds_order_request
    { method: 'aliexpress.ds.order.create',    paramKey: 'param_place_order_request4_open_api_d_t_o' },
    // DS API — el param key "oficial" de la docs
    { method: 'aliexpress.ds.order.create',    paramKey: 'param_place_ds_order_request' },
    // Trade API con param0 — llega al contenido pero pide address_id (no DS)
    { method: 'aliexpress.trade.order.create', paramKey: 'param0' },
  ]

  for (const attempt of attempts) {
    console.log(`[/order] Trying method=${attempt.method} paramKey=${attempt.paramKey}`)

    try {
      const raw = await callAliExpress(attempt.method, {
        [attempt.paramKey]: JSON.stringify(orderPayload),
      })

      console.log(`[/order] Raw response (${attempt.method}):`, JSON.stringify(raw, null, 2))

      // Unwrap envelope: "aliexpress.ds.order.create" → "aliexpress_ds_order_create_response"
      const responseKey = attempt.method.replace(/\./g, '_') + '_response'
      const envelope = raw[responseKey] ?? raw

      if (raw.error_response) {
        const errMsg = raw.error_response.msg ?? raw.error_response.sub_msg ?? 'API error'
        const errCode = String(raw.error_response.code ?? '')
        const isMissing = errCode === '27' || errMsg.toLowerCase().includes('missing') || errMsg.toLowerCase().includes('parameter')
        console.log(`[/order] error_response via ${attempt.method}: code=${errCode} msg=${errMsg}`)
        if (isMissing) continue
        return res.json({ success: false, method: attempt.method, error: errMsg })
      }

      // DS API result structure
      const result = envelope.result ?? envelope

      const isSuccess =
        result.is_success === true ||
        result.is_success === 'true' ||
        envelope.is_success === true

      if (isSuccess) {
        const wrapper = result.order_list ?? {}
        const orderIds = Array.isArray(wrapper.number)
          ? wrapper.number
          : wrapper.number != null
          ? [wrapper.number]
          : Array.isArray(result.order_list)
          ? result.order_list.map((o) => o.order_id ?? o)
          : []

        console.log(`[/order] SUCCESS via ${attempt.method} — ids:`, orderIds)
        return res.json({
          success: true,
          method: attempt.method,
          order_list: orderIds.map((id) => ({ order_id: id })),
        })
      }

      const errorDesc = result.error_desc ?? result.error_msg ?? String(result.error_code ?? 'Unknown')
      const isMissing = errorDesc.toLowerCase().includes('missing') || String(result.error_code ?? '').includes('27')
      console.log(`[/order] is_success=false via ${attempt.method}: ${errorDesc}`)
      if (isMissing) continue
      return res.json({ success: false, method: attempt.method, error: errorDesc })
    } catch (err) {
      console.error(`[/order] Exception (${attempt.method}):`, err.message ?? err)
    }
  }

  return res.json({ success: false, error: 'All attempts failed — check logs for raw responses' })
})

// ─── Product ──────────────────────────────────────────────────────────────────

app.get('/product/:id?', async (req, res) => {
  const productId = req.params.id ?? req.query.id
  const country = req.query.country ?? 'ES'
  const language = req.query.language ?? 'es'
  if (!productId) return res.status(400).json({ error: 'Missing product id' })

  try {
    const raw = await callAliExpress('aliexpress.ds.product.get', {
      product_id: String(productId),
      local_country: country,
      local_language: language,
    })

    const envelope = raw.aliexpress_ds_product_get_response ?? raw
    const result = envelope?.result ?? {}

    // Normalize to ae_item format that sync-product route expects
    const skus = result.aeop_ae_product_s_k_us?.global_aeop_ae_product_sku ?? []
    const images = (result.image_u_r_ls ?? '').split(';').filter(Boolean)

    const normalized = {
      result: {
        ae_item_base_info_dto: {
          subject: result.product_title ?? '',
          detail: result.aeop_ae_description?.description ?? '',
        },
        ae_multimedia_info_dto: {
          image_urls: images.join(';'),
        },
        ae_item_sku_info_dtos: {
          ae_item_sku_info_d_t_o: skus.map((s) => ({
            sku_id: String(s.id ?? ''),
            sku_attr: s.sku_attr ?? '',
            offer_sale_price: String(s.offer_sale_price ?? s.sku_price ?? '0'),
            sku_available_stock: parseInt(String(s.ipm_sku_stock ?? '0'), 10),
            ae_sku_property_dtos: {
              ae_sku_property_d_t_o: (s.ae_sku_property_dtos?.ae_sku_property_d_t_o ?? []).map((p) => ({
                sku_property_name: p.property_name ?? p.sku_property_name ?? '',
                property_value_definition_name: p.property_value_definition_name ?? p.property_value_id_long_name ?? '',
              })),
            },
          })),
        },
      },
    }

    res.json(normalized)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── Tracking ─────────────────────────────────────────────────────────────────

app.get('/tracking/:order_id', async (req, res) => {
  try {
    const raw = await callAliExpress('aliexpress.logistics.order.trackinginfo.query', {
      logistics_no: req.params.order_id,
    })
    const envelope = raw.aliexpress_logistics_order_trackinginfo_query_response ?? raw
    const details = envelope.result ?? {}
    const events = (details.tracking_info?.module ?? []).map((e) => ({
      event_date: e.time_detail ?? e.event_date ?? '',
      event_desc: e.event_detail ?? e.status ?? '',
      address: e.address ?? '',
    }))
    res.json({
      logistics_no: details.logistics_no ?? req.params.order_id,
      carrier: details.official_website ?? details.company_name ?? '',
      events,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`[zarpitas-api] Listening on port ${PORT}`)
  console.log('[zarpitas-api] APP_KEY=', APP_KEY ? 'SET' : 'NOT SET')
  console.log('[zarpitas-api] APP_SECRET=', APP_SECRET ? 'SET' : 'NOT SET')
  console.log('[zarpitas-api] ACCESS_TOKEN=', ACCESS_TOKEN ? 'SET' : 'NOT SET')
})
