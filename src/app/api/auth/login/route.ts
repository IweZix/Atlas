import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === 'string' ? body.email : null;
  const password = typeof body?.password === 'string' ? body.password : null;

  if (!email || !password) {
    return NextResponse.json({ error: 'invalid_credentials' }, { status: 400 });
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return NextResponse.json(
        { error: 'invalid_credentials' },
        { status: 401 },
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'auth_unavailable' }, { status: 503 });
  }
}
