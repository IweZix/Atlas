import { NextResponse } from 'next/server';
import {
  CannotDeactivateOwnAccountError,
  ForbiddenError,
  setUserActiveForAdmin,
} from '@/lib/supabase/list-users';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const { userId } = await params;
  const body = await request.json().catch(() => null);
  const isActive = body?.isActive;

  if (typeof isActive !== 'boolean') {
    return NextResponse.json({ error: 'invalid_input' }, { status: 400 });
  }

  try {
    const user = await setUserActiveForAdmin(userId, isActive);
    return NextResponse.json({ user });
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }
    if (error instanceof CannotDeactivateOwnAccountError) {
      return NextResponse.json(
        { error: 'cannot_deactivate_own_account' },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: 'status_update_failed' },
      { status: 503 },
    );
  }
}
