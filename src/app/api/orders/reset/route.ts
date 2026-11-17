import { NextRequest, NextResponse } from 'next/server';
import { resetDailyTokens } from '@/lib/db';

export async function POST() {
  try {
    const result = await resetDailyTokens();
    return NextResponse.json({ success: true, message: result.message });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
