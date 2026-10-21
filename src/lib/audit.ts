import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentUser } from '@/lib/supabase/current-user';
import { createClient } from '@/lib/supabase/server';

export type AuditAction = 'insert' | 'update' | 'delete' | 'restore';

export interface AuditLog {
  id: number;
  createdAt: string;
  userId: string | null;
  userEmail: string | null;
  action: AuditAction;
  tableName: string;
  recordId: string | null;
  oldData: Record<string, unknown> | null;
  newData: Record<string, unknown> | null;
}

export interface AuditLogFilters {
  /** Pass the literal 'system' to filter rows with no author (userId is null). */
  userId?: string;
  tableName?: string;
  action?: AuditAction;
  recordId?: string;
  /** ISO timestamp, inclusive lower bound on createdAt. */
  from?: string;
  /** ISO timestamp, inclusive upper bound on createdAt. */
  to?: string;
}

export interface AuditLogsPage {
  items: AuditLog[];
  page: number;
  perPage: number;
  total: number;
  lastPage: number;
}

/**
 * Server-only. Relies on the `audit_logs_select_admin` RLS policy as the
 * real gate — callers must already have called assertCurrentUserIsAdmin().
 */
export async function getAuditLogs(
  filters: AuditLogFilters,
  pagination: { page: number; perPage: number },
): Promise<AuditLogsPage> {
  const supabase = await createClient();
  const { page, perPage } = pagination;

  let query = supabase
    .from('audit_logs')
    .select(
      'id, createdAt, userId, userEmail, action, tableName, recordId, oldData, newData',
      { count: 'exact' },
    )
    .order('createdAt', { ascending: false })
    .range((page - 1) * perPage, page * perPage - 1);

  if (filters.userId === 'system') {
    query = query.is('userId', null);
  } else if (filters.userId) {
    query = query.eq('userId', filters.userId);
  }
  if (filters.tableName) query = query.eq('tableName', filters.tableName);
  if (filters.action) query = query.eq('action', filters.action);
  if (filters.recordId) query = query.eq('recordId', filters.recordId);
  if (filters.from) query = query.gte('createdAt', filters.from);
  if (filters.to) query = query.lte('createdAt', filters.to);

  const { data, error, count } = await query;
  if (error) throw error;

  const total = count ?? 0;
  return {
    items: (data ?? []) as AuditLog[],
    page,
    perPage,
    total,
    lastPage: Math.max(1, Math.ceil(total / perPage)),
  };
}

export interface LogAuditInput {
  action: AuditAction;
  tableName: string;
  recordId: string;
  oldData?: Record<string, unknown> | null;
  newData?: Record<string, unknown> | null;
}

/**
 * For service-role-only admin operations (auth.admin.*) that never touch a
 * public.* table via .from(), so the DB trigger can't see them — see
 * readme/audit.md. Never exposed to the client. A failed audit write must
 * never break the primary admin action, so errors only reach server logs.
 */
export async function logAudit(input: LogAuditInput): Promise<void> {
  try {
    const user = await getCurrentUser();
    const supabase = createAdminClient(); // only client allowed to insert
    const { error } = await supabase.from('audit_logs').insert({
      userId: user?.id ?? null,
      userEmail: user?.email ?? null,
      action: input.action,
      tableName: input.tableName,
      recordId: input.recordId,
      oldData: input.oldData ?? null,
      newData: input.newData ?? null,
    });
    if (error) throw error;
  } catch (error) {
    console.error('logAudit failed', { input, error });
  }
}
