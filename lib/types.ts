export type OrderStatus = 'pending' | 'confirmed' | 'in_kitchen' | 'completed' | 'cancelled';
export type OrderType = 'pickup' | 'delivery';

export interface OrderItem {
  name: string;
  quantity: number;
  customizations?: string[];
  /** Legacy field — old orders may have this. New orders use unit_price/total_price. */
  price?: number;
  unit_price?: number;
  total_price?: number;
  size?: 'small' | 'medium' | 'large' | 'xl' | null;
  category?: string | null;
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
