export type OrderStatus = 'pending' | 'confirmed' | 'in_kitchen' | 'completed' | 'cancelled';
export type OrderType = 'pickup' | 'delivery';

export interface OrderItem {
  name: string;
  quantity: number;
  customizations?: string[];
  price?: number;
}

export interface Order {
  id: string;
  call_id?: string;
  customer_name: string;
  phone: string;
  email?: string;
  address?: string;
  order_type: OrderType;
  items: OrderItem[];
  subtotal: number;
  total: number;
  status: OrderStatus;
  notes?: string;
  created_at: string;
  shop_id?: string;
}

export interface DashboardStats {
  todayOrders: number;
  todayRevenue: number;
  weekOrders: number;
  weekRevenue: number;
  recentOrders: Order[];
}

export interface ShopSettings {
  name: string;
  address: string;
  phone: string;
  retell_number?: string;
  webhook_status?: 'connected' | 'disconnected';
}
