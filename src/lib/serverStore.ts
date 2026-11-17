import fs from 'fs';
import path from 'path';
import { User, MenuItem, Order, OrderStatus } from '@/types';

const DATA_FILE_PATH = path.join(process.cwd(), 'src', 'data', 'canteen_data.json');

interface StoreData {
  users: User[];
  menuItems: MenuItem[];
  orders: Order[];
  nextTokenNumber: number;
  staffPin?: string;
}

const DEFAULT_MENU_ITEMS: MenuItem[] = [
  {
    id: 'm1',
    name: 'Hot Crispy Samosa',
    category: 'Snacks',
    price: 15,
    stockQuantity: 25,
    isAvailable: true,
    prepTimeMins: 3,
    description: 'Golden spiced potato stuffed crispy triangles'
  },
  {
    id: 'm2',
    name: 'Mumbai Vada Pav',
    category: 'Snacks',
    price: 20,
    stockQuantity: 20,
    isAvailable: true,
    prepTimeMins: 2,
    description: 'Spicy potato fritter in bun with garlic chutney'
  },
  {
    id: 'm3',
    name: 'Veg Cheese Grilled Sandwich',
    category: 'Snacks',
    price: 55,
    stockQuantity: 12,
    isAvailable: true,
    prepTimeMins: 7,
    description: 'Crisp layered sandwich with veggies and melted cheese'
  },
  {
    id: 'm4',
    name: 'Paneer Tikka Frankie',
    category: 'Quick Meals',
    price: 65,
    stockQuantity: 8,
    isAvailable: true,
    prepTimeMins: 8,
    description: 'Tandoori paneer roll wrapped with onions & mint mayo'
  },
  {
    id: 'm5',
    name: 'Veg Fried Rice Bowl',
    category: 'Quick Meals',
    price: 80,
    stockQuantity: 15,
    isAvailable: true,
    prepTimeMins: 10,
    description: 'Aromatic wok-tossed basmati rice with crunchy veggies'
  },
  {
    id: 'm6',
    name: 'Chole Bhature Platter',
    category: 'Quick Meals',
    price: 85,
    stockQuantity: 6,
    isAvailable: true,
    prepTimeMins: 12,
    description: '2 fluffy bhaturas with rich spiced chickpea curry'
  },
  {
    id: 'm7',
    name: 'Adrak Masala Chai',
    category: 'Beverages',
    price: 12,
    stockQuantity: 40,
    isAvailable: true,
    prepTimeMins: 2,
    description: 'Fresh brewed cardamom & ginger spiced hot tea'
  },
  {
    id: 'm8',
    name: 'Thick Cold Coffee',
    category: 'Beverages',
    price: 35,
    stockQuantity: 18,
    isAvailable: true,
    prepTimeMins: 3,
    description: 'Rich creamy chilled coffee with chocolate drizzle'
  }
];

const DEFAULT_USERS: User[] = [
  {
    id: 'u1',
    uniqueCode: 'CB-1042',
    name: 'Rahul Sharma',
    phone: '9876543210',
    createdAt: new Date().toISOString()
  },
  {
    id: 'u2',
    uniqueCode: 'CB-1088',
    name: 'Priya Patel',
    phone: '9823456789',
    createdAt: new Date().toISOString()
  },
  {
    id: 'u3',
    uniqueCode: 'CB-1015',
    name: 'Aman Verma',
    phone: '9811223344',
    createdAt: new Date().toISOString()
  }
];

function readData(): StoreData {
  try {
    if (fs.existsSync(DATA_FILE_PATH)) {
      const content = fs.readFileSync(DATA_FILE_PATH, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('Error reading canteen data file, initializing fresh:', err);
  }

  const initialData: StoreData = {
    users: DEFAULT_USERS,
    menuItems: DEFAULT_MENU_ITEMS,
    orders: [
      {
        id: 'ord-101',
        tokenNumber: 21,
        userId: 'u1',
        uniqueCode: 'CB-1042',
        userName: 'Rahul Sharma',
        userPhone: '9876543210',
        items: [
          { id: 'm1', name: 'Hot Crispy Samosa', price: 15, quantity: 2 },
          { id: 'm7', name: 'Adrak Masala Chai', price: 12, quantity: 1 }
        ],
        totalAmount: 42,
        pickupPin: '4821',
        status: 'preparing',
        estimatedReadyAt: '5 mins',
        createdAt: new Date(Date.now() - 5 * 60000).toISOString()
      },
      {
        id: 'ord-102',
        tokenNumber: 20,
        userId: 'u2',
        uniqueCode: 'CB-1088',
        userName: 'Priya Patel',
        userPhone: '9823456789',
        items: [
          { id: 'm8', name: 'Thick Cold Coffee', price: 35, quantity: 1 }
        ],
        totalAmount: 35,
        pickupPin: '1392',
        status: 'ready',
        estimatedReadyAt: 'Ready for Collection',
        createdAt: new Date(Date.now() - 10 * 60000).toISOString()
      }
    ],
    nextTokenNumber: 22,
    staffPin: '1234'
  };

  writeData(initialData);
  return initialData;
}

function writeData(data: StoreData): void {
  try {
    const dir = path.dirname(DATA_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving canteen data file:', err);
  }
}

// User Operations
export function getAllUsers(): User[] {
  return readData().users;
}

export function findUserByQuery(query: string): User | undefined {
  const clean = query.trim().toUpperCase();
  const data = readData();
  return data.users.find(
    (u) =>
      u.uniqueCode.toUpperCase() === clean ||
      u.phone === clean ||
      u.name.toUpperCase().includes(clean)
  );
}

export function registerUser(name: string, phone: string, password?: string): User {
  const data = readData();
  
  // Check if phone already registered
  const existing = data.users.find((u) => u.phone === phone.trim());
  if (existing) {
    return existing;
  }

  // Generate unique code e.g. CB-1045
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const uniqueCode = `CB-${randomSuffix}`;

  const newUser: User = {
    id: `user-${Date.now()}`,
    uniqueCode,
    name: name.trim(),
    phone: phone.trim(),
    password: password || '123456',
    createdAt: new Date().toISOString()
  };

  data.users.push(newUser);
  writeData(data);
  return newUser;
}

// Menu and Inventory Operations
export function getAllMenuItems(): MenuItem[] {
  return readData().menuItems;
}

export function restockMenuItem(itemId: string, addQty: number): MenuItem | null {
  const data = readData();
  const item = data.menuItems.find((m) => m.id === itemId);
  if (!item) return null;

  item.stockQuantity += addQty;
  if (item.stockQuantity > 0) {
    item.isAvailable = true;
  }

  writeData(data);
  return item;
}

export function toggleMenuItemAvailability(itemId: string, isAvailable: boolean): MenuItem | null {
  const data = readData();
  const item = data.menuItems.find((m) => m.id === itemId);
  if (!item) return null;

  item.isAvailable = isAvailable;
  writeData(data);
  return item;
}

// Order Operations
export function getAllOrders(): Order[] {
  return readData().orders;
}

export function getOrderById(id: string): Order | undefined {
  return readData().orders.find((o) => o.id === id);
}

export function getActiveOrderByUserId(userId: string): Order | undefined {
  const data = readData();
  // Return the latest order that is not yet 'collected'
  return data.orders
    .filter((o) => o.userId === userId && o.status !== 'collected')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
}

export interface CreateOrderParams {
  userId: string;
  items: { id: string; quantity: number }[];
}

export function createOrderAtCounter(params: CreateOrderParams): {
  success: boolean;
  order?: Order;
  error?: string;
} {
  const data = readData();
  const user = data.users.find((u) => u.id === params.userId);
  if (!user) {
    return { success: false, error: 'Student/User not found' };
  }

  if (!params.items || params.items.length === 0) {
    return { success: false, error: 'No items in order' };
  }

  // Verify stock & calculate total
  const orderItems: { id: string; name: string; price: number; quantity: number }[] = [];
  let totalAmount = 0;
  let maxPrepTime = 5;

  for (const ordered of params.items) {
    const item = data.menuItems.find((m) => m.id === ordered.id);
    if (!item) {
      return { success: false, error: `Item ${ordered.id} not found in menu` };
    }
    if (item.stockQuantity < ordered.quantity) {
      return {
        success: false,
        error: `Insufficient stock for "${item.name}". Only ${item.stockQuantity} remaining.`
      };
    }

    orderItems.push({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: ordered.quantity
    });

    totalAmount += item.price * ordered.quantity;
    if (item.prepTimeMins > maxPrepTime) {
      maxPrepTime = item.prepTimeMins;
    }
  }

  // AUTOMATIC INVENTORY DEDUCTION
  for (const ordered of params.items) {
    const item = data.menuItems.find((m) => m.id === ordered.id)!;
    item.stockQuantity -= ordered.quantity;
    if (item.stockQuantity <= 0) {
      item.stockQuantity = 0;
      item.isAvailable = false;
    }
  }

  // Calculate estimated time: queue load + max item prep time
  const activeOrdersCount = data.orders.filter(
    (o) => o.status === 'received' || o.status === 'preparing'
  ).length;
  const estimatedMins = maxPrepTime + activeOrdersCount * 2;

  // Generate Token and 4-digit PIN
  const tokenNumber = data.nextTokenNumber++;
  const pickupPin = Math.floor(1000 + Math.random() * 9000).toString();

  const newOrder: Order = {
    id: `ord-${Date.now()}`,
    tokenNumber,
    userId: user.id,
    uniqueCode: user.uniqueCode,
    userName: user.name,
    userPhone: user.phone,
    items: orderItems,
    totalAmount,
    pickupPin,
    status: 'received',
    estimatedReadyAt: `~${estimatedMins} mins`,
    createdAt: new Date().toISOString()
  };

  data.orders.unshift(newOrder);
  writeData(data);

  return { success: true, order: newOrder };
}

export function updateOrderStatus(orderId: string, status: OrderStatus): Order | null {
  const data = readData();
  const order = data.orders.find((o) => o.id === orderId);
  if (!order) return null;

  order.status = status;
  if (status === 'ready') {
    order.estimatedReadyAt = 'Ready for Collection!';
  }

  writeData(data);
  return order;
}

export function verifyAndCollectOrder(orderId: string, enteredPin: string): {
  success: boolean;
  order?: Order;
  error?: string;
} {
  const data = readData();
  const order = data.orders.find((o) => o.id === orderId);
  if (!order) {
    return { success: false, error: 'Order not found' };
  }

  if (order.pickupPin.trim() !== enteredPin.trim()) {
    return { success: false, error: 'Incorrect Pickup PIN! Handover denied.' };
  }

  order.status = 'collected';
  writeData(data);
  return { success: true, order };
}

export function verifyStaffPin(enteredPin: string): boolean {
  const data = readData();
  const currentPin = data.staffPin || '1234';
  return currentPin.trim() === enteredPin.trim();
}

export function updateStaffPin(oldPin: string, newPin: string): { success: boolean; error?: string } {
  const data = readData();
  const currentPin = data.staffPin || '1234';

  if (currentPin.trim() !== oldPin.trim()) {
    return { success: false, error: 'Current PIN is incorrect' };
  }

  if (!newPin || newPin.trim().length < 4) {
    return { success: false, error: 'New PIN must be at least 4 digits' };
  }

  data.staffPin = newPin.trim();
  writeData(data);
  return { success: true };
}
