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

  const orderPayload = { out_id, logistics_address, product_items }

  const attempts = [
    { method: 'aliexpress.ds.order.create',    paramKey: 'param_place_ds_order_request' },
    { method: 'aliexpress.trade.order.create', paramKey: 'param_place_order_request4_open_api_d_t_o' },
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

app.get('/product/:id', async (req, res) => {
  try {
    const raw = await callAliExpress('aliexpress.ds.product.get', {
      product_id: req.params.id,
      local_country: 'ES',
      local_language: 'es',
    })
    res.json(raw)
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
