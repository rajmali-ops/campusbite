import { NextRequest, NextResponse } from 'next/server';
import { verifyAndCollectOrder } from '@/lib/serverStore';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { pin } = body;

    if (!pin) {
      return NextResponse.json({ success: false, error: 'Pickup PIN is required' }, { status: 400 });
    }

    const result = verifyAndCollectOrder(id, pin);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, order: result.order });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
