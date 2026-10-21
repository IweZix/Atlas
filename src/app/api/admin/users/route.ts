import { NextResponse } from 'next/server';
import {
  createUserForAdmin,
  ForbiddenError,
  listUsersForAdmin,
  type UserSortField,
} from '@/lib/supabase/list-users';
import { Role } from '@/types/Role';

const SORT_FIELDS: UserSortField[] = ['email', 'name', 'role', 'status'];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const perPage = Math.max(1, Number(searchParams.get('perPage')) || 10);
  const search = searchParams.get('search') ?? undefined;
  const sortByParam = searchParams.get('sortBy');
  const sortBy = SORT_FIELDS.includes(sortByParam as UserSortField)
    ? (sortByParam as UserSortField)
    : undefined;
  const sortOrder = searchParams.get('sortOrder') === 'desc' ? 'desc' : 'asc';

  try {
    const result = await listUsersForAdmin(page, perPage, {
      search,
      sortBy,
      sortOrder,
    });
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }
    return NextResponse.json({ error: 'users_unavailable' }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  const email = typeof body?.email === 'string' ? body.email.trim() : '';
  const firstName =
    typeof body?.firstName === 'string' ? body.firstName : undefined;
  const lastName =
    typeof body?.lastName === 'string' ? body.lastName : undefined;
  const role = body?.role;

  if (!email || !Object.values(Role).includes(role)) {
    return NextResponse.json({ error: 'invalid_input' }, { status: 400 });
  }

  try {
    const result = await createUserForAdmin({
      email,
      firstName,
      lastName,
      role,
    });
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }
    return NextResponse.json({ error: 'create_failed' }, { status: 400 });
  }
}
