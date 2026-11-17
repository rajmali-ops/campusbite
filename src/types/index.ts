export type OrderStatus = 'received' | 'preparing' | 'ready' | 'collected';

export interface User {
  id: string;
  uniqueCode: string; // e.g. "CB-1042"
  name: string;
  phone: string;
  password?: string;
  createdAt: string;
}

export interface MenuItem {
  id: string;
  name: string;
  category: 'Snacks' | 'Beverages' | 'Quick Meals' | 'Combos';
  price: number;
  stockQuantity: number;
  isAvailable: boolean;
  prepTimeMins: number;
  description?: string;
}

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  tokenNumber: number;
  userId: string;
  uniqueCode: string; // user's unique code e.g. "CB-1042"
  userName: string;
  userPhone: string;
  items: OrderItem[];
  totalAmount: number;
  pickupPin: string; // 4-digit secret PIN e.g. "4821"
  status: OrderStatus;
  estimatedReadyAt: string; // formatted time or minutes
  createdAt: string;
}

export type BroadcastEventType = 
  | 'ORDER_CREATED' 
  | 'ORDER_STATUS_CHANGED' 
  | 'INVENTORY_UPDATED'
  | 'PING_TEST';

export interface BroadcastMessage {
  type: BroadcastEventType;
  payload: any;
  timestamp: number;
}
