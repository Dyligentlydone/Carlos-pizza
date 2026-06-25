import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Order } from '@/lib/types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const orderId = searchParams.get('order_id')?.trim()
  const phone = searchParams.get('phone')?.trim()

  if (!orderId && !phone) {
    return NextResponse.json(
      { error: 'Provide order_id or phone query param to look up an order.' },
      { status: 400 }
    )
  }

  const supabase = createClient(supabaseUrl, serviceKey)

  let query = supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })

  if (orderId) {
    query = query.eq('id', orderId).limit(1)
  } else {
    // Fetch a reasonable slice to filter in-memory by normalized phone.
    query = query.limit(25)
  }

  const { data, error } = await query

  if (error) {
    console.error('Lookup error:', error)
    return NextResponse.json({ error: 'Failed to look up orders' }, { status: 500 })
  }

  let results = (data as Order[]) || []

  if (phone && !orderId) {
    const normalized = normalizePhone(phone)
    results = results.filter((order) => normalizePhone(order.phone || '') === normalized)
  }

  return NextResponse.json({
    success: true,
    lookup: {
      order_id: orderId || null,
      phone: phone || null,
      matches: results.length,
    },
    orders: results.map((order) => ({
      id: order.id,
      status: order.status,
      customer_name: order.customer_name,
      phone: order.phone,
      order_type: order.order_type,
      subtotal: order.subtotal,
      total: order.total,
      items: order.items,
      address: order.address,
      notes: order.notes,
      created_at: order.created_at,
      estimated_ready: estimateReadyTime(order),
    })),
  })
}

function normalizePhone(value: string) {
  return value.replace(/\D/g, '')
}

function estimateReadyTime(order: Order) {
  if (!order.created_at) return null
  const baseMinutes = order.order_type === 'pickup' ? 25 : 45
  const created = new Date(order.created_at)
  if (Number.isNaN(created.getTime())) return null
  const eta = new Date(created.getTime() + baseMinutes * 60 * 1000)
  return eta.toISOString()
}
