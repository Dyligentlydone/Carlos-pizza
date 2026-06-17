'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import type { Order } from '@/lib/types'
import { formatDate } from '@/lib/utils'

const KITCHEN_STATUSES: Order['status'][] = ['confirmed', 'in_kitchen']

export default function KitchenDisplayPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchOrders()

    const channel = supabase
      .channel('orders-kitchen-display')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          if (KITCHEN_STATUSES.includes((payload.new as Order).status)) {
            setOrders((prev) => [payload.new as Order, ...prev])
          }
        } else if (payload.eventType === 'UPDATE') {
          setOrders((prev) => {
            const next = [...prev]
            const existingIndex = next.findIndex((order) => order.id === payload.new.id)
            const newStatus = (payload.new as Order).status

            if (KITCHEN_STATUSES.includes(newStatus)) {
              if (existingIndex === -1) {
                return [payload.new as Order, ...next]
              }
              next[existingIndex] = payload.new as Order
              return next
            }

            if (existingIndex >= 0) {
              next.splice(existingIndex, 1)
            }
            return next
          })
        } else if (payload.eventType === 'DELETE') {
          setOrders((prev) => prev.filter((order) => order.id !== payload.old.id))
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  async function fetchOrders() {
    setLoading(true)
    const { data } = await supabase
      .from('orders')
      .select('*')
      .in('status', KITCHEN_STATUSES)
      .order('created_at', { ascending: false })

    if (data) {
      setOrders(data as Order[])
    }

    setLoading(false)
  }

  return (
    <div className="space-y-6">

      <Card>
        <CardHeader>
          <CardTitle>Live Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-8 text-muted-foreground">Loading orders...</p>
          ) : orders.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No active kitchen orders</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>{formatDate(order.created_at)}</TableCell>
                    <TableCell>{order.customer_name}</TableCell>
                    <TableCell>{order.order_type}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 text-sm">
                        {order.items.map((item, index) => (
                          <span key={`${order.id}-item-${index}`}>
                            {item.quantity}x {item.name}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(order.status)}>
                        {order.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function getStatusBadgeVariant(status: Order['status']) {
  switch (status) {
    case 'in_kitchen':
      return 'warning'
    case 'confirmed':
      return 'default'
    default:
      return 'secondary'
  }
}
