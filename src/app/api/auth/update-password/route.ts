import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const accessToken =
    typeof body?.accessToken === 'string' ? body.accessToken : '';
  const refreshToken =
    typeof body?.refreshToken === 'string' ? body.refreshToken : '';
  const password = typeof body?.password === 'string' ? body.password : '';

  if (!accessToken || !refreshToken || !password) {
    return NextResponse.json({ error: 'invalid_input' }, { status: 400 });
  }

  try {
    const supabase = await createClient();

    // Recovery links land here with a token pair in the URL hash (implicit
    // flow) — never sent to the server on its own, so the client posts it
    // here and we turn it into a normal session cookie, same as a login.
    const { error: sessionError } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (sessionError) {
      return NextResponse.json({ error: 'invalid_link' }, { status: 401 });
    }

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      return NextResponse.json({ error: 'update_failed' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'auth_unavailable' }, { status: 503 });
  }
}
