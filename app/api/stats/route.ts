import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  
  // Get total orders count
  const { count: totalOrders } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })

  // Get this month's orders
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { count: monthlyOrders } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', startOfMonth.toISOString())

  // Get average order value
  const { data: orders } = await supabase
    .from('orders')
    .select('total')

  let avgOrderValue = 0
  if (orders && orders.length > 0) {
    const sum = orders.reduce((acc, order) => acc + Number(order.total), 0)
    avgOrderValue = sum / orders.length
  }

  return NextResponse.json({
    totalOrders: totalOrders || 0,
    monthlyOrders: monthlyOrders || 0,
    avgOrderValue: avgOrderValue || 0
  })
}
