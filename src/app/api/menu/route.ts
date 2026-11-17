import { NextResponse } from 'next/server';
import { getAllMenuItems } from '@/lib/serverStore';

export async function GET() {
  const items = getAllMenuItems();
  return NextResponse.json({ success: true, items });
}
