import { NextRequest, NextResponse } from 'next/server';
import { verifyStaffPin, updateStaffPin } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { pin } = body;

    if (!pin) {
      return NextResponse.json({ success: false, error: 'Staff PIN is required' }, { status: 400 });
    }

    const isValid = await verifyStaffPin(pin);
    if (!isValid) {
      return NextResponse.json({ success: false, error: 'Invalid Staff PIN. Access denied.' }, { status: 401 });
    }

    return NextResponse.json({ success: true, message: 'Authenticated successfully' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { oldPin, newPin } = body;

    if (!oldPin || !newPin) {
      return NextResponse.json({ success: false, error: 'Both current and new PIN are required' }, { status: 400 });
    }

    const result = await updateStaffPin(oldPin, newPin);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'Staff PIN updated successfully' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
