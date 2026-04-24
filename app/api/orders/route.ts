import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { calculateOrderPricing, PreviewItemInput } from '@/lib/pricing'

export async function POST(request: NextRequest) {
  try {
    // Use service role key for server-side inserts (bypasses RLS)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const raw = await request.json()

    // Retell may send either the flat args OR a wrapped payload:
    //   { name, args: {...}, call: {...} }
    // Normalize to a flat body regardless.
    const body =
      raw && typeof raw === 'object' && raw.args && typeof raw.args === 'object'
        ? raw.args
        : raw

    // Validate required fields (total is NOT required — we calculate it)
    if (!body.customer_name || !body.phone || !body.items) {
      return NextResponse.json(
        { error: 'Missing required fields: customer_name, phone, items' },
        { status: 400 }
      )
    }

    // Validate order_type
    if (body.order_type && !['pickup', 'delivery'].includes(body.order_type)) {
      return NextResponse.json(
        { error: 'Invalid order_type. Must be "pickup" or "delivery"' },
        { status: 400 }
      )
    }

    // Normalize incoming items for the pricing engine
    const pricingInput: PreviewItemInput[] = body.items.map((item: any) => ({
      name: String(item?.name ?? ''),
      quantity: typeof item?.quantity === 'number' ? item.quantity : parseInt(item?.quantity) || 1,
      customizations:
        typeof item?.customizations === 'string'
          ? item.customizations
          : Array.isArray(item?.customizations)
          ? item.customizations.join(', ')
          : undefined,
    }))

    // Server-side pricing — source of truth
    const pricing = calculateOrderPricing(pricingInput, { taxRate: 0 })

    if (pricing.errors.length > 0) {
      return NextResponse.json(
        {
          error: 'One or more items could not be priced',
          details: pricing.errors,
        },
        { status: 400 }
      )
    }

    // Build the items stored on the order with authoritative prices
    const items = pricing.items.map((it) => ({
      name: it.name,
      quantity: it.quantity,
      unit_price: it.unit_price,
      total_price: it.total_price,
      customizations: it.breakdown?.topping_names ?? [],
      size: it.breakdown?.size ?? null,
      category: it.breakdown?.category ?? null,
    }))

    // Create order object (server-calculated subtotal/total)
    const orderData = {
      call_id: body.call_id || null,
      customer_name: body.customer_name,
      phone: body.phone,
      email: body.email || null,
      address: body.address || null,
      order_type: body.order_type || 'pickup',
      items: items,
      subtotal: pricing.subtotal,
      total: pricing.total,
      status: 'pending',
      notes: body.notes || null,
      shop_id: process.env.NEXT_PUBLIC_SHOP_ID || 'shop_001',
    }

    // Insert into database
    const { data, error } = await supabase
      .from('orders')
      .insert([orderData])
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to create order', details: error.message },
        { status: 500 }
      )
    }

    // Return success response
    return NextResponse.json({
      success: true,
      order_id: data.id,
      message: 'Order placed successfully',
      subtotal: pricing.subtotal,
      total: pricing.total,
      order: data,
    }, { status: 201 })

  } catch (error: any) {
    console.error('Error processing order:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
