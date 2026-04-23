import { NextRequest, NextResponse } from 'next/server'
import { calculateOrderPricing, PreviewItemInput } from '@/lib/pricing'

/**
 * POST /api/orders/preview
 *
 * Called by Retell AI BEFORE confirming an order, to get deterministic pricing.
 * This endpoint is READ-ONLY. Nothing is saved to the database.
 *
 * Request body:
 * {
 *   "customer_name": "string (optional)",
 *   "phone": "string (optional)",
 *   "address": "string (optional)",
 *   "order_type": "pickup" | "delivery" (REQUIRED),
 *   "items": [
 *     { "name": "string", "quantity": number, "customizations": "string?" }
 *   ]
 * }
 *
 * Response (200):
 * {
 *   "items": [{ "name", "quantity", "unit_price", "total_price" }],
 *   "subtotal": number,
 *   "tax": number,
 *   "total": number
 * }
 *
 * Response (400) on validation errors:
 * {
 *   "error": "message",
 *   "details": [ ... ]
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate order_type
    if (!body.order_type || !['pickup', 'delivery'].includes(body.order_type)) {
      return NextResponse.json(
        { error: 'order_type is required and must be "pickup" or "delivery"' },
        { status: 400 }
      )
    }

    // Validate items
    if (!Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { error: 'items must be a non-empty array' },
        { status: 400 }
      )
    }

    const items: PreviewItemInput[] = body.items.map((it: any) => ({
      name: String(it?.name ?? ''),
      quantity: typeof it?.quantity === 'number' ? it.quantity : parseInt(it?.quantity) || 1,
      customizations:
        typeof it?.customizations === 'string'
          ? it.customizations
          : Array.isArray(it?.customizations)
          ? it.customizations.join(', ')
          : undefined,
    }))

    const result = calculateOrderPricing(items, { taxRate: 0 })

    // If any item failed to price, return 400 with details
    if (result.errors.length > 0) {
      return NextResponse.json(
        {
          error: 'One or more items could not be priced',
          details: result.errors,
          partial: {
            items: result.items,
            subtotal: result.subtotal,
            tax: result.tax,
            total: result.total,
          },
        },
        { status: 400 }
      )
    }

    // Strict output shape for Retell AI
    return NextResponse.json({
      items: result.items.map((it) => ({
        name: it.name,
        quantity: it.quantity,
        unit_price: it.unit_price,
        total_price: it.total_price,
      })),
      subtotal: result.subtotal,
      tax: result.tax,
      total: result.total,
    })
  } catch (err: any) {
    console.error('Preview pricing error:', err)
    return NextResponse.json(
      { error: 'Invalid request', details: err?.message || String(err) },
      { status: 400 }
    )
  }
}
