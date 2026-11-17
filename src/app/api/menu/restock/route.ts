import { NextRequest, NextResponse } from 'next/server';
import { restockMenuItem, toggleMenuItemAvailability } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { itemId, addQty, isAvailable } = body;

    if (itemId && typeof addQty === 'number') {
      const updated = await restockMenuItem(itemId, addQty);
      return NextResponse.json({ success: true, item: updated });
    }

    if (itemId && typeof isAvailable === 'boolean') {
      const updated = await toggleMenuItemAvailability(itemId, isAvailable);
      return NextResponse.json({ success: true, item: updated });
    }

    return NextResponse.json({ success: false, error: 'Invalid payload' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
