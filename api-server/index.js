const express = require('express')
const { DropshipperClient } = require('ae_sdk')

const app = express()
app.use(express.json())

const PORT = process.env.PORT || 3000
const APP_KEY = process.env.ALIEXPRESS_APP_KEY
const APP_SECRET = process.env.ALIEXPRESS_APP_SECRET
const ACCESS_TOKEN = process.env.ALIEXPRESS_ACCESS_TOKEN

function getClient() {
  return new DropshipperClient({
    app_key: APP_KEY,
    app_secret: APP_SECRET,
    session: ACCESS_TOKEN,
  })
}

// ─── Health ───────────────────────────────────────────────────────────────────

app.get('/health', (req, res) => {
  res.json({
    ok: true,
    app_key: APP_KEY ? `${APP_KEY.slice(0, 4)}...` : 'NOT SET',
    app_secret: APP_SECRET ? 'SET' : 'NOT SET',
    access_token: ACCESS_TOKEN ? `${ACCESS_TOKEN.slice(0, 8)}...` : 'NOT SET',
  })
})

// ─── Order ────────────────────────────────────────────────────────────────────

app.post('/order', async (req, res) => {
  const { out_id, logistics_address, product_items } = req.body

  if (!out_id || !logistics_address || !product_items?.length) {
    return res.status(400).json({ success: false, error: 'Missing required fields: out_id, logistics_address, product_items' })
  }

  const orderPayload = {
    out_id,
    logistics_address,
    product_items,
  }

  const attempts = [
    { method: 'aliexpress.ds.order.create',    paramKey: 'param_place_ds_order_request' },
    { method: 'aliexpress.trade.order.create', paramKey: 'param_place_order_request4_open_api_d_t_o' },
    { method: 'aliexpress.trade.order.create', paramKey: 'param0' },
  ]

  const client = getClient()

  for (const attempt of attempts) {
    console.log(`[/order] Trying method=${attempt.method} paramKey=${attempt.paramKey}`)

    try {
      const raw = await client.call(attempt.method, {
        [attempt.paramKey]: JSON.stringify(orderPayload),
      })

      console.log(`[/order] Raw response (${attempt.method}):`, JSON.stringify(raw, null, 2))

      // Unwrap response envelope
      const responseKey = attempt.method.replace(/\./g, '_') + '_response'
      const envelope = raw[responseKey] ?? raw

      // DS API: { result: { is_success, order_list: { number: [...] } } }
      const result = envelope.result ?? envelope

      const isSuccess =
        result.is_success === true ||
        result.is_success === 'true' ||
        envelope.is_success === true

      const errorCode = String(result.error_code ?? result.error_msg ?? envelope.error_code ?? '')
      const isMissingParam =
        errorCode.toLowerCase().includes('missing') ||
        errorCode === '27' ||
        errorCode.includes('MissingParameter')

      if (isSuccess) {
        const orderListWrapper = result.order_list ?? {}
        const orderIds = Array.isArray(orderListWrapper.number)
          ? orderListWrapper.number
          : orderListWrapper.number != null
          ? [orderListWrapper.number]
          : Array.isArray(orderListWrapper)
          ? orderListWrapper.map((o) => o.order_id ?? o)
          : []

        console.log(`[/order] SUCCESS via ${attempt.method} — order_ids:`, orderIds)
        return res.json({
          success: true,
          method: attempt.method,
          order_list: orderIds.map((id) => ({ order_id: id })),
        })
      }

      // If it's not a MissingParameter error, stop trying — real error
      if (!isMissingParam) {
        const errorMsg = result.error_desc ?? result.error_msg ?? errorCode ?? 'Unknown error'
        console.log(`[/order] FAILED (non-retryable) via ${attempt.method}: ${errorMsg}`)
        return res.json({ success: false, method: attempt.method, error: errorMsg })
      }

      console.log(`[/order] MissingParameter via ${attempt.method}, trying next...`)
    } catch (err) {
      console.error(`[/order] Exception (${attempt.method}):`, err.message ?? err)
      // Continue to next attempt on exception
    }
  }

  return res.json({ success: false, error: 'All order placement attempts failed (MissingParameter or exception)' })
})

// ─── Product ──────────────────────────────────────────────────────────────────

app.get('/product/:id', async (req, res) => {
  try {
    const client = getClient()
    const raw = await client.call('aliexpress.ds.product.get', {
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
    const client = getClient()
    const raw = await client.call('aliexpress.logistics.order.trackinginfo.query', {
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
  console.log(`[zarpitas-api] APP_KEY=${APP_KEY ? APP_KEY : 'NOT SET'}`)
  console.log(`[zarpitas-api] ACCESS_TOKEN=${ACCESS_TOKEN ? ACCESS_TOKEN.slice(0, 8) + '...' : 'NOT SET'}`)
})
