import { NextRequest, NextResponse } from 'next/server';
import { getAllUsers, findUserByQuery, registerUser } from '@/lib/serverStore';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q');

  if (q) {
    const user = findUserByQuery(q);
    return NextResponse.json({ success: true, user: user || null });
  }

  const users = getAllUsers();
  return NextResponse.json({ success: true, users });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, phone, password } = body;

    if (!name || !phone) {
      return NextResponse.json(
        { success: false, error: 'Name and Phone number are required' },
        { status: 400 }
      );
    }

    const user = registerUser(name, phone, password);
    return NextResponse.json({ success: true, user });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
