import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Use service role key for server-side inserts (bypasses RLS)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const body = await request.json()

    // Validate required fields
    if (!body.customer_name || !body.phone || !body.items || !body.total) {
      return NextResponse.json(
        { error: 'Missing required fields: customer_name, phone, items, total' },
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

    // Transform items if customizations is a string (convert to array)
    const items = body.items.map((item: any) => ({
      name: item.name,
      quantity: item.quantity,
      customizations: item.customizations 
        ? (typeof item.customizations === 'string' 
            ? item.customizations.split(',').map((s: string) => s.trim())
            : item.customizations)
        : [],
      price: item.price || 0
    }))

    // Create order object
    const orderData = {
      call_id: body.call_id || null,
      customer_name: body.customer_name,
      phone: body.phone,
      email: body.email || null,
      address: body.address || null,
      order_type: body.order_type || 'pickup',
      items: items,
      subtotal: body.subtotal || body.total,
      total: body.total,
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
      order: data
    }, { status: 201 })

  } catch (error: any) {
    console.error('Error processing order:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
