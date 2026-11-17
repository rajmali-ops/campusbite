import { getSupabase, isSupabaseConfigured } from './supabase';
import * as localStore from './serverStore';
import { User, MenuItem, Order, OrderStatus } from '@/types';

// =========================================================================
// USERS OPERATIONS
// =========================================================================
export async function getAllUsers(): Promise<User[]> {
  const supabase = getSupabase();
  if (!supabase) return localStore.getAllUsers();

  const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: false });
  if (error || !data) {
    console.error('Supabase getAllUsers error:', error);
    return localStore.getAllUsers();
  }

  return data.map((u: any) => ({
    id: u.id,
    uniqueCode: u.unique_code,
    name: u.name,
    phone: u.phone,
    password: u.password,
    createdAt: u.created_at,
  }));
}

export async function findUserByQuery(query: string): Promise<User | null> {
  const supabase = getSupabase();
  if (!supabase) return localStore.findUserByQuery(query) || null;

  const clean = query.trim().toUpperCase();

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .or(`unique_code.ilike.%${clean}%,phone.eq.${clean},name.ilike.%${clean}%`)
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;

  return {
    id: data.id,
    uniqueCode: data.unique_code,
    name: data.name,
    phone: data.phone,
    password: data.password,
    createdAt: data.created_at,
  };
}

export async function registerUser(name: string, phone: string, password?: string): Promise<User> {
  const supabase = getSupabase();
  if (!supabase) return localStore.registerUser(name, phone, password);

  // Check if phone already registered
  const existing = await findUserByQuery(phone);
  if (existing) return existing;

  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const uniqueCode = `CB-${randomSuffix}`;

  const { data, error } = await supabase
    .from('users')
    .insert([
      {
        unique_code: uniqueCode,
        name: name.trim(),
        phone: phone.trim(),
        password: password || '123456',
      },
    ])
    .select()
    .single();

  if (error || !data) {
    console.error('Supabase registerUser error, falling back to local:', error);
    return localStore.registerUser(name, phone, password);
  }

  return {
    id: data.id,
    uniqueCode: data.unique_code,
    name: data.name,
    phone: data.phone,
    password: data.password,
    createdAt: data.created_at,
  };
}

// =========================================================================
// MENU & INVENTORY OPERATIONS
// =========================================================================
export async function getAllMenuItems(): Promise<MenuItem[]> {
  const supabase = getSupabase();
  if (!supabase) return localStore.getAllMenuItems();

  const { data, error } = await supabase.from('menu_items').select('*').order('name');
  if (error || !data) {
    console.error('Supabase getAllMenuItems error:', error);
    return localStore.getAllMenuItems();
  }

  return data.map((m: any) => ({
    id: m.id,
    name: m.name,
    category: m.category,
    price: Number(m.price),
    stockQuantity: m.stock_quantity,
    isAvailable: m.is_available,
    prepTimeMins: m.prep_time_mins,
    description: m.description,
  }));
}

export async function restockMenuItem(itemId: string, addQty: number): Promise<MenuItem | null> {
  const supabase = getSupabase();
  if (!supabase) return localStore.restockMenuItem(itemId, addQty);

  const { data: item } = await supabase.from('menu_items').select('*').eq('id', itemId).single();
  if (!item) return null;

  const newQty = item.stock_quantity + addQty;
  const { data, error } = await supabase
    .from('menu_items')
    .update({ stock_quantity: newQty, is_available: true })
    .eq('id', itemId)
    .select()
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    name: data.name,
    category: data.category,
    price: Number(data.price),
    stockQuantity: data.stock_quantity,
    isAvailable: data.is_available,
    prepTimeMins: data.prep_time_mins,
    description: data.description,
  };
}

export async function toggleMenuItemAvailability(itemId: string, isAvailable: boolean): Promise<MenuItem | null> {
  const supabase = getSupabase();
  if (!supabase) return localStore.toggleMenuItemAvailability(itemId, isAvailable);

  const { data, error } = await supabase
    .from('menu_items')
    .update({ is_available: isAvailable })
    .eq('id', itemId)
    .select()
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    name: data.name,
    category: data.category,
    price: Number(data.price),
    stockQuantity: data.stock_quantity,
    isAvailable: data.is_available,
    prepTimeMins: data.prep_time_mins,
    description: data.description,
  };
}

// =========================================================================
// ORDERS OPERATIONS
// =========================================================================
export async function getAllOrders(): Promise<Order[]> {
  const supabase = getSupabase();
  if (!supabase) return localStore.getAllOrders();

  const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
  if (error || !data) {
    console.error('Supabase getAllOrders error:', error);
    return localStore.getAllOrders();
  }

  return data.map((o: any) => ({
    id: o.id,
    tokenNumber: o.token_number,
    userId: o.user_id,
    uniqueCode: o.unique_code,
    userName: o.user_name,
    userPhone: o.user_phone,
    items: o.items,
    totalAmount: Number(o.total_amount),
    pickupPin: o.pickup_pin,
    status: o.status,
    estimatedReadyAt: o.estimated_ready_at,
    createdAt: o.created_at,
  }));
}

export async function getActiveOrderByUserId(userId: string): Promise<Order | null> {
  const supabase = getSupabase();
  if (!supabase) return localStore.getActiveOrderByUserId(userId) || null;

  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', userId)
    .neq('status', 'collected')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;

  return {
    id: data.id,
    tokenNumber: data.token_number,
    userId: data.user_id,
    uniqueCode: data.unique_code,
    userName: data.user_name,
    userPhone: data.user_phone,
    items: data.items,
    totalAmount: Number(data.total_amount),
    pickupPin: data.pickup_pin,
    status: data.status,
    estimatedReadyAt: data.estimated_ready_at,
    createdAt: data.created_at,
  };
}

export async function createOrderAtCounter(params: {
  userId: string;
  items: { id: string; quantity: number }[];
}): Promise<{ success: boolean; order?: Order; error?: string }> {
  const supabase = getSupabase();
  if (!supabase) return localStore.createOrderAtCounter(params);

  // 1. Fetch user
  const { data: user } = await supabase.from('users').select('*').eq('id', params.userId).single();
  if (!user) return { success: false, error: 'Student/User not found in Supabase' };

  // 2. Fetch menu items & check stock
  const { data: menuList } = await supabase.from('menu_items').select('*');
  if (!menuList) return { success: false, error: 'Failed to fetch menu from Supabase' };

  const orderItems: { id: string; name: string; price: number; quantity: number }[] = [];
  let totalAmount = 0;
  let maxPrepTime = 5;

  for (const ordered of params.items) {
    const item = menuList.find((m: any) => m.id === ordered.id);
    if (!item) return { success: false, error: `Item ${ordered.id} not found` };
    if (item.stock_quantity < ordered.quantity) {
      return { success: false, error: `Insufficient stock for "${item.name}". Only ${item.stock_quantity} left.` };
    }

    orderItems.push({
      id: item.id,
      name: item.name,
      price: Number(item.price),
      quantity: ordered.quantity,
    });

    totalAmount += Number(item.price) * ordered.quantity;
    if (item.prep_time_mins > maxPrepTime) maxPrepTime = item.prep_time_mins;
  }

  // 3. Atomically decrement stock in Supabase
  for (const ordered of params.items) {
    const item = menuList.find((m: any) => m.id === ordered.id);
    const newQty = Math.max(0, item.stock_quantity - ordered.quantity);
    await supabase
      .from('menu_items')
      .update({ stock_quantity: newQty, is_available: newQty > 0 })
      .eq('id', ordered.id);
  }

  // 4. Token & PIN calculation
  const { data: tokenSetting } = await supabase.from('app_settings').select('value').eq('key', 'next_token_number').single();
  const currentToken = tokenSetting ? parseInt(tokenSetting.value, 10) : 1;
  const nextToken = currentToken + 1;
  await supabase.from('app_settings').upsert({ key: 'next_token_number', value: nextToken.toString() });

  const pickupPin = Math.floor(1000 + Math.random() * 9000).toString();
  const estimatedMins = maxPrepTime + 4;

  const orderId = `ord-${Date.now()}`;
  const newOrderData = {
    id: orderId,
    token_number: currentToken,
    user_id: user.id,
    unique_code: user.unique_code,
    user_name: user.name,
    user_phone: user.phone,
    items: orderItems,
    total_amount: totalAmount,
    pickup_pin: pickupPin,
    status: 'received',
    estimated_ready_at: `~${estimatedMins} mins`,
    created_at: new Date().toISOString(),
  };

  const { data: insertedOrder, error: insertError } = await supabase.from('orders').insert([newOrderData]).select().single();
  if (insertError || !insertedOrder) {
    return { success: false, error: insertError?.message || 'Failed to insert order into Supabase' };
  }

  return {
    success: true,
    order: {
      id: insertedOrder.id,
      tokenNumber: insertedOrder.token_number,
      userId: insertedOrder.user_id,
      uniqueCode: insertedOrder.unique_code,
      userName: insertedOrder.user_name,
      userPhone: insertedOrder.user_phone,
      items: insertedOrder.items,
      totalAmount: Number(insertedOrder.total_amount),
      pickupPin: insertedOrder.pickup_pin,
      status: insertedOrder.status,
      estimatedReadyAt: insertedOrder.estimated_ready_at,
      createdAt: insertedOrder.created_at,
    },
  };
}

export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<Order | null> {
  const supabase = getSupabase();
  if (!supabase) return localStore.updateOrderStatus(orderId, status);

  const updates: any = { status };
  if (status === 'ready') updates.estimated_ready_at = 'Ready for Collection!';

  const { data, error } = await supabase.from('orders').update(updates).eq('id', orderId).select().single();
  if (error || !data) return null;

  return {
    id: data.id,
    tokenNumber: data.token_number,
    userId: data.user_id,
    uniqueCode: data.unique_code,
    userName: data.user_name,
    userPhone: data.user_phone,
    items: data.items,
    totalAmount: Number(data.total_amount),
    pickupPin: data.pickup_pin,
    status: data.status,
    estimatedReadyAt: data.estimated_ready_at,
    createdAt: data.created_at,
  };
}

export async function verifyAndCollectOrder(
  orderId: string,
  enteredPin: string
): Promise<{ success: boolean; order?: Order; error?: string }> {
  const supabase = getSupabase();
  if (!supabase) return localStore.verifyAndCollectOrder(orderId, enteredPin);

  const { data: order } = await supabase.from('orders').select('*').eq('id', orderId).single();
  if (!order) return { success: false, error: 'Order not found' };

  if (order.pickup_pin.trim() !== enteredPin.trim()) {
    return { success: false, error: 'Incorrect Pickup PIN! Handover denied.' };
  }

  const { data: updated, error } = await supabase
    .from('orders')
    .update({ status: 'collected' })
    .eq('id', orderId)
    .select()
    .single();

  if (error || !updated) return { success: false, error: 'Failed to mark collected' };

  return {
    success: true,
    order: {
      id: updated.id,
      tokenNumber: updated.token_number,
      userId: updated.user_id,
      uniqueCode: updated.unique_code,
      userName: updated.user_name,
      userPhone: updated.user_phone,
      items: updated.items,
      totalAmount: Number(updated.total_amount),
      pickupPin: updated.pickup_pin,
      status: updated.status,
      estimatedReadyAt: updated.estimated_ready_at,
      createdAt: updated.created_at,
    },
  };
}

// =========================================================================
// STAFF AUTH OPERATIONS
// =========================================================================
export async function verifyStaffPin(enteredPin: string): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return localStore.verifyStaffPin(enteredPin);

  const { data } = await supabase.from('app_settings').select('value').eq('key', 'staff_pin').single();
  const currentPin = data?.value || '1234';
  return currentPin.trim() === enteredPin.trim();
}

export async function updateStaffPin(oldPin: string, newPin: string): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabase();
  if (!supabase) return localStore.updateStaffPin(oldPin, newPin);

  const isCurrentValid = await verifyStaffPin(oldPin);
  if (!isCurrentValid) return { success: false, error: 'Current PIN is incorrect' };

  if (!newPin || newPin.trim().length < 4) {
    return { success: false, error: 'New PIN must be at least 4 digits' };
  }

  await supabase.from('app_settings').upsert({ key: 'staff_pin', value: newPin.trim() });
  return { success: true };
}
