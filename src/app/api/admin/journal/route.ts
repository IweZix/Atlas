import { NextResponse } from 'next/server';
import type { AuditAction } from '@/lib/audit';
import { getAuditLogs } from '@/lib/audit';
import {
  assertCurrentUserIsAdmin,
  ForbiddenError,
} from '@/lib/supabase/list-users';

const AUDIT_ACTIONS: AuditAction[] = ['insert', 'update', 'delete', 'restore'];

function isAuditAction(value: string | null): value is AuditAction {
  return AUDIT_ACTIONS.includes(value as AuditAction);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const perPage = Math.min(
    100,
    Math.max(1, Number(searchParams.get('perPage')) || 20),
  );
  const userId = searchParams.get('userId') ?? undefined;
  const tableName = searchParams.get('tableName') ?? undefined;
  const actionParam = searchParams.get('action');
  const action = isAuditAction(actionParam) ? actionParam : undefined;
  const recordId = searchParams.get('recordId') ?? undefined;
  const from = searchParams.get('from') ?? undefined;
  const to = searchParams.get('to') ?? undefined;

  try {
    await assertCurrentUserIsAdmin();
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }
    throw error;
  }

  try {
    const result = await getAuditLogs(
      { userId, tableName, action, recordId, from, to },
      { page, perPage },
    );
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: 'journal_unavailable' }, { status: 503 });
  }
}
