import { NextRequest, NextResponse } from 'next/server';
import { updateMenuItemDetails, deleteMenuItemById } from '@/lib/db';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const updated = await updateMenuItemDetails(id, body);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Menu item not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, item: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const success = await deleteMenuItemById(id);
    if (!success) {
      return NextResponse.json({ success: false, error: 'Failed to delete menu item' }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'Item deleted successfully' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
