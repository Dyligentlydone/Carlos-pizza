import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  
  const shopId = process.env.NEXT_PUBLIC_SHOP_ID || 'shop_001'
  
  const { data, error } = await supabase
    .from('shop_settings')
    .select('*')
    .eq('shop_id', shopId)
    .single()

  if (error) {
    console.error('GET settings error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const body = await request.json()
  
  const shopId = process.env.NEXT_PUBLIC_SHOP_ID || 'shop_001'
  
  const { data, error } = await supabase
    .from('shop_settings')
    .upsert({
      shop_id: shopId,
      shop_name: body.shop_name,
      shop_address: body.shop_address,
      shop_phone: body.shop_phone,
      retell_phone: body.retell_phone,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'shop_id'
    })
    .select()
    .single()

  if (error) {
    console.error('POST settings error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
