import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/supabase/current-user';
import {
  CannotChangeOwnRoleError,
  CannotDeleteOwnAccountError,
  deleteUserForAdmin,
  ForbiddenError,
  getUserForAdmin,
  updateUserForAdmin,
} from '@/lib/supabase/list-users';
import { Role } from '@/types/Role';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const { userId } = await params;

  try {
    const [user, currentUser] = await Promise.all([
      getUserForAdmin(userId),
      getCurrentUser(),
    ]);

    if (!user) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }

    return NextResponse.json({
      user,
      isOwnAccount: currentUser?.id === user.id,
    });
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }
    return NextResponse.json({ error: 'user_unavailable' }, { status: 503 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const { userId } = await params;
  const body = await request.json().catch(() => null);

  const firstName =
    typeof body?.firstName === 'string' ? body.firstName : undefined;
  const lastName =
    typeof body?.lastName === 'string' ? body.lastName : undefined;
  const role = body?.role;

  if (!Object.values(Role).includes(role)) {
    return NextResponse.json({ error: 'invalid_role' }, { status: 400 });
  }

  try {
    const user = await updateUserForAdmin(userId, {
      firstName,
      lastName,
      role,
    });
    return NextResponse.json({ user });
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }
    if (error instanceof CannotChangeOwnRoleError) {
      return NextResponse.json(
        { error: 'cannot_change_own_role' },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: 'update_failed' }, { status: 503 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const { userId } = await params;

  try {
    await deleteUserForAdmin(userId);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }
    if (error instanceof CannotDeleteOwnAccountError) {
      return NextResponse.json(
        { error: 'cannot_delete_own_account' },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: 'delete_failed' }, { status: 503 });
  }
}
