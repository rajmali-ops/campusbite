import { NextResponse } from 'next/server';
import { getAllMenuItems } from '@/lib/db';

export async function GET() {
  const items = await getAllMenuItems();
  return NextResponse.json({ success: true, items });
}
