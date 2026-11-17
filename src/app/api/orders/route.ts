import { NextRequest, NextResponse } from 'next/server';
import { getAllOrders, getActiveOrderByUserId, createOrderAtCounter } from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  const activeOnly = searchParams.get('active');

  if (userId && activeOnly === 'true') {
    const activeOrder = await getActiveOrderByUserId(userId);
    return NextResponse.json({ success: true, order: activeOrder || null });
  }

  const orders = await getAllOrders();
  if (userId) {
    const userOrders = orders.filter((o) => o.userId === userId);
    return NextResponse.json({ success: true, orders: userOrders });
  }

  return NextResponse.json({ success: true, orders });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, items } = body;

    if (!userId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'User ID and items array are required' },
        { status: 400 }
      );
    }

    const result = await createOrderAtCounter({ userId, items });
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, order: result.order });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
