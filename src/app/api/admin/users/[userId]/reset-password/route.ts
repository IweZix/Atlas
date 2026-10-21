import { NextResponse } from 'next/server';
import {
  ForbiddenError,
  sendPasswordResetEmail,
} from '@/lib/supabase/list-users';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === 'string' ? body.email : '';
  const locale = typeof body?.locale === 'string' ? body.locale : 'fr';

  if (!email) {
    return NextResponse.json({ error: 'invalid_input' }, { status: 400 });
  }

  const redirectTo = `${new URL(request.url).origin}/${locale}/reset-password`;

  try {
    await sendPasswordResetEmail(email, redirectTo);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }
    return NextResponse.json({ error: 'reset_failed' }, { status: 503 });
  }
}
