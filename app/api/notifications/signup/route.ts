import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { notificationSignups } from '@/db/schema';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { email?: string; type?: string };
    const { email, type } = body;

    if (!email || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    await db
      .insert(notificationSignups)
      .values({ email: email.toLowerCase().trim(), type })
      .onConflictDoNothing();

    return NextResponse.json({ success: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
