import type { AuditAction, AuditLog } from '@/lib/audit';

export type { AuditAction, AuditLog };

export interface GetAuditLogsParams {
  page?: number;
  perPage?: number;
  /** Pass 'system' to filter rows with no author. */
  userId?: string;
  tableName?: string;
  action?: AuditAction;
  recordId?: string;
  from?: string;
  to?: string;
}

export interface GetAuditLogsResult {
  items: AuditLog[];
  page: number;
  perPage: number;
  total: number;
  lastPage: number;
}
