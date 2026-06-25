'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { formatCurrency, formatDate, formatPhoneNumber } from '@/lib/utils'
import type { Order, OrderItem } from '@/lib/types'
import { MapPin, Phone, Mail, Clock, Package, Edit2, Save, X, Trash2, Plus } from 'lucide-react'

interface OrderDetailsModalProps {
  order: Order
  onClose: () => void
  onUpdateStatus: (orderId: string, status: Order['status']) => void | Promise<void>
  onUpdateOrder?: (orderId: string, updates: Partial<Order>) => Promise<void>
  onDeleteOrder?: (orderId: string) => Promise<void>
}

export function OrderDetailsModal({ order, onClose, onUpdateStatus, onUpdateOrder, onDeleteOrder }: OrderDetailsModalProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedOrder, setEditedOrder] = useState<Order>(order)
  const [isSaving, setIsSaving] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleSave() {
    if (!onUpdateOrder) return
    
    setIsSaving(true)
    try {
      await onUpdateOrder(order.id, {
        customer_name: editedOrder.customer_name,
        phone: editedOrder.phone,
        email: editedOrder.email,
        address: editedOrder.address,
        order_type: editedOrder.order_type,
        items: editedOrder.items,
        notes: editedOrder.notes,
        subtotal: editedOrder.subtotal,
        total: editedOrder.total
      })
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to update order:', error)
    } finally {
      setIsSaving(false)
    }
  }

  function handleCancel() {
    setEditedOrder(order)
    setIsEditing(false)
  }

  async function handleDelete() {
    if (!onDeleteOrder) return
    
    setIsDeleting(true)
    try {
      await onDeleteOrder(order.id)
      onClose()
    } catch (error) {
      console.error('Failed to delete order:', error)
      setIsDeleting(false)
    }
  }

  function updateItem(index: number, updates: Partial<OrderItem>) {
    const newItems = [...editedOrder.items]
    newItems[index] = { ...newItems[index], ...updates }
    
    const subtotal = newItems.reduce((sum, item) => {
      const price = item.unit_price || item.price || 0
      return sum + (price * item.quantity)
    }, 0)
    
    setEditedOrder({ ...editedOrder, items: newItems, subtotal, total: subtotal })
  }

  function removeItem(index: number) {
    const newItems = editedOrder.items.filter((_, i) => i !== index)
    const subtotal = newItems.reduce((sum, item) => {
      const price = item.unit_price || item.price || 0
      return sum + (price * item.quantity)
    }, 0)
    
    setEditedOrder({ ...editedOrder, items: newItems, subtotal, total: subtotal })
  }

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
            <div className="flex items-center gap-2">
              <Badge variant={getStatusBadgeVariant(order.status)}>
                {order.status.replace('_', ' ')}
              </Badge>
              {!isEditing && onUpdateOrder && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsEditing(true)}
                  className="gap-2"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </Button>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Customer Information</h3>
              <div className="space-y-2">
                {isEditing ? (
                  <>
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">Name</label>
                      <Input
                        value={editedOrder.customer_name}
                        onChange={(e) => setEditedOrder({ ...editedOrder, customer_name: e.target.value })}
                        placeholder="Customer name"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">Phone</label>
                      <Input
                        value={editedOrder.phone}
                        onChange={(e) => setEditedOrder({ ...editedOrder, phone: e.target.value })}
                        placeholder="Phone number"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">Email</label>
                      <Input
                        value={editedOrder.email || ''}
                        onChange={(e) => setEditedOrder({ ...editedOrder, email: e.target.value })}
                        placeholder="Email (optional)"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">Address</label>
                      <Input
                        value={editedOrder.address || ''}
                        onChange={(e) => setEditedOrder({ ...editedOrder, address: e.target.value })}
                        placeholder="Delivery address (optional)"
                      />
                    </div>
                  </>
                ) : (
                  <>
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
                  </>
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
                {isEditing ? (
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Order Type</label>
                    <Select
                      value={editedOrder.order_type}
                      onChange={(e) => setEditedOrder({ ...editedOrder, order_type: e.target.value as 'pickup' | 'delivery' })}
                    >
                      <option value="pickup">Pickup</option>
                      <option value="delivery">Delivery</option>
                    </Select>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm">
                    <Badge variant={order.order_type === 'delivery' ? 'default' : 'secondary'}>
                      {order.order_type}
                    </Badge>
                  </div>
                )}
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
              {editedOrder.items.map((item, index) => {
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
                  <div key={index} className="p-4">
                    {isEditing ? (
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, { quantity: parseInt(e.target.value) || 1 })}
                            className="w-20"
                          />
                          <Input
                            value={item.name}
                            onChange={(e) => updateItem(index, { name: e.target.value })}
                            className="flex-1"
                            placeholder="Item name"
                          />
                          <Input
                            type="number"
                            step="0.01"
                            value={unit || 0}
                            onChange={(e) => updateItem(index, { unit_price: parseFloat(e.target.value) || 0 })}
                            className="w-24"
                            placeholder="Price"
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeItem(index)}
                            className="text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        {item.customizations && item.customizations.length > 0 && (
                          <Input
                            value={item.customizations.join(', ')}
                            onChange={(e) => updateItem(index, { customizations: e.target.value.split(',').map(s => s.trim()) })}
                            placeholder="Customizations (comma separated)"
                            className="text-sm"
                          />
                        )}
                      </div>
                    ) : (
                      <div className="flex justify-between items-start">
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
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <div className="space-y-2 border-t pt-4">
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>{formatCurrency(editedOrder.subtotal)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>{formatCurrency(editedOrder.total)}</span>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Notes</h3>
            {isEditing ? (
              <Textarea
                value={editedOrder.notes || ''}
                onChange={(e) => setEditedOrder({ ...editedOrder, notes: e.target.value })}
                placeholder="Add notes..."
                rows={3}
              />
            ) : order.notes ? (
              <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                {order.notes}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground italic">No notes</p>
            )}
          </div>

          {!isEditing && (
            <div className="space-y-3 pt-4 border-t">
              <div className="space-y-2">
                <label className="text-sm font-medium">Update Status</label>
                <Select
                  value={order.status}
                  onChange={(e) =>
                    onUpdateStatus(order.id, e.target.value as Order['status'])
                  }
                  className="w-full"
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="in_kitchen">In Kitchen</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </Select>
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-4 border-t">
            {isEditing ? (
              <>
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1 gap-2"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="gap-2"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </Button>
              </>
            ) : showDeleteConfirm ? (
              <>
                <div className="flex-1 text-sm text-destructive font-medium flex items-center">
                  Are you sure you want to delete this order?
                </div>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  {isDeleting ? 'Deleting...' : 'Confirm Delete'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
              </>
            ) : (
              <>
                {onDeleteOrder && (
                  <Button
                    variant="destructive"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Order
                  </Button>
                )}
                <Button variant="outline" onClick={onClose} className="flex-1">
                  Close
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
