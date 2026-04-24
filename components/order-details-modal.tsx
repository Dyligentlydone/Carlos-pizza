'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate, formatPhoneNumber } from '@/lib/utils'
import type { Order } from '@/lib/types'
import { MapPin, Phone, Mail, Clock, Package } from 'lucide-react'

interface OrderDetailsModalProps {
  order: Order
  onClose: () => void
  onUpdateStatus: (orderId: string, status: string) => void
}

export function OrderDetailsModal({ order, onClose, onUpdateStatus }: OrderDetailsModalProps) {
  function getStatusBadgeVariant(status: string) {
    switch (status) {
      case 'completed': return 'success'
      case 'in_kitchen': return 'warning'
      case 'confirmed': return 'default'
      case 'pending': return 'secondary'
      default: return 'outline'
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Order Details</span>
            <Badge variant={getStatusBadgeVariant(order.status)}>
              {order.status.replace('_', ' ')}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Customer Information</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Package className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{order.customer_name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span>{formatPhoneNumber(order.phone)}</span>
                </div>
                {order.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span>{order.email}</span>
                  </div>
                )}
                {order.address && (
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <span>{order.address}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Order Information</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span>{formatDate(order.created_at)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant={order.order_type === 'delivery' ? 'default' : 'secondary'}>
                    {order.order_type}
                  </Badge>
                </div>
                {order.call_id && (
                  <div className="text-xs text-muted-foreground">
                    Call ID: {order.call_id}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Order Items</h3>
            <div className="border rounded-lg divide-y">
              {order.items.map((item, index) => {
                // Prefer new server-calculated totals, fall back to legacy `price` field.
                const lineTotal =
                  typeof item.total_price === 'number'
                    ? item.total_price
                    : typeof item.unit_price === 'number'
                    ? item.unit_price * item.quantity
                    : typeof item.price === 'number'
                    ? item.price * item.quantity
                    : null

                const unit =
                  typeof item.unit_price === 'number'
                    ? item.unit_price
                    : typeof item.price === 'number'
                    ? item.price
                    : null

                return (
                  <div key={index} className="p-4 flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{item.quantity}x</span>
                        <span>{item.name}</span>
                      </div>
                      {item.customizations && item.customizations.length > 0 && (
                        <div className="mt-1 text-sm text-muted-foreground">
                          {item.customizations.join(', ')}
                        </div>
                      )}
                      {unit !== null && item.quantity > 1 && (
                        <div className="mt-1 text-xs text-muted-foreground">
                          {formatCurrency(unit)} each
                        </div>
                      )}
                    </div>
                    {lineTotal !== null && (
                      <span className="font-medium">{formatCurrency(lineTotal)}</span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <div className="space-y-2 border-t pt-4">
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>{formatCurrency(order.total)}</span>
            </div>
          </div>

          {order.notes && (
            <div className="space-y-2">
              <h3 className="font-semibold">Notes</h3>
              <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                {order.notes}
              </p>
            </div>
          )}

          <div className="flex gap-2 pt-4 border-t">
            {order.status === 'pending' && (
              <Button
                onClick={() => {
                  onUpdateStatus(order.id, 'confirmed')
                  onClose()
                }}
                className="flex-1"
              >
                Confirm Order
              </Button>
            )}
            {order.status === 'confirmed' && (
              <Button
                onClick={() => {
                  onUpdateStatus(order.id, 'in_kitchen')
                  onClose()
                }}
                className="flex-1 bg-pizza-gold hover:bg-pizza-gold/90"
              >
                Mark In Kitchen
              </Button>
            )}
            {order.status === 'in_kitchen' && (
              <Button
                onClick={() => {
                  onUpdateStatus(order.id, 'completed')
                  onClose()
                }}
                className="flex-1 bg-pizza-green hover:bg-pizza-green/90"
              >
                Mark Completed
              </Button>
            )}
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
