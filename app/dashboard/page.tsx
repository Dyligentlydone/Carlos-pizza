import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign, ShoppingBag, TrendingUp, Phone } from 'lucide-react'
import { formatCurrency, formatTime } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import type { Order } from '@/lib/types'
import { startOfToday, startOfWeek } from 'date-fns'

async function getDashboardStats() {
  const supabase = await createClient()
  
  const today = startOfToday().toISOString()
  const weekStart = startOfWeek(new Date()).toISOString()

  const { data: todayOrders } = await supabase
    .from('orders')
    .select('*')
    .gte('created_at', today)
    .order('created_at', { ascending: false })

  const { data: weekOrders } = await supabase
    .from('orders')
    .select('*')
    .gte('created_at', weekStart)

  const { data: recentOrders } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5)

  const todayRevenue = (todayOrders || []).reduce((sum, order) => sum + order.total, 0)
  const weekRevenue = (weekOrders || []).reduce((sum, order) => sum + order.total, 0)

  return {
    todayOrders: todayOrders?.length || 0,
    todayRevenue,
    weekOrders: weekOrders?.length || 0,
    weekRevenue,
    recentOrders: (recentOrders || []) as Order[],
  }
}

function getStatusBadgeVariant(status: string) {
  switch (status) {
    case 'completed':
      return 'success'
    case 'in_kitchen':
      return 'warning'
    case 'confirmed':
      return 'default'
    case 'pending':
      return 'secondary'
    default:
      return 'outline'
  }
}

export default async function DashboardPage() {
  const stats = await getDashboardStats()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's your shop overview.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Orders</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayOrders}</div>
            <p className="text-xs text-muted-foreground">Orders received today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.todayRevenue)}</div>
            <p className="text-xs text-muted-foreground">Total sales today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.weekOrders}</div>
            <p className="text-xs text-muted-foreground">{formatCurrency(stats.weekRevenue)} revenue</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Live Status</CardTitle>
            <Phone className="h-4 w-4 text-pizza-green animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-pizza-green">Active</div>
            <p className="text-xs text-muted-foreground">Ready for orders</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.recentOrders.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No orders yet</p>
          ) : (
            <div className="space-y-4">
              {stats.recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{order.customer_name}</p>
                      <Badge variant={order.order_type === 'delivery' ? 'default' : 'secondary'}>
                        {order.order_type}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {order.items[0]?.name}
                      {order.items.length > 1 && ` +${order.items.length - 1} more`}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatTime(order.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-bold">{formatCurrency(order.total)}</p>
                      <Badge variant={getStatusBadgeVariant(order.status)}>
                        {order.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
