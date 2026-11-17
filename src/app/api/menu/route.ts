import { NextRequest, NextResponse } from 'next/server';
import { getAllMenuItems, createMenuItem } from '@/lib/db';

export async function GET() {
  const items = await getAllMenuItems();
  return NextResponse.json({ success: true, items });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, category, price, stockQuantity, prepTimeMins, description } = body;

    if (!name || !category || price === undefined || stockQuantity === undefined) {
      return NextResponse.json(
        { success: false, error: 'Name, Category, Price, and Stock Quantity are required' },
        { status: 400 }
      );
    }

    const newItem = await createMenuItem({
      name,
      category,
      price: Number(price),
      stockQuantity: Number(stockQuantity),
      prepTimeMins: Number(prepTimeMins) || 5,
      isAvailable: Number(stockQuantity) > 0,
      description: description || '',
    });

    return NextResponse.json({ success: true, item: newItem });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
