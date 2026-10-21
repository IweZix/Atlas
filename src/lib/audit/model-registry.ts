export interface AuditModelEntry {
  /** Dot-path into tKeys.journal.models — resolved client-side via t(). */
  labelKey: string;
  href?: (recordId: string) => string;
}

/**
 * table_name -> { label, href }. A table absent from this map renders with
 * its raw tableName and no link (spec §5). public.user_preferences is
 * intentionally absent — never audited (spec §0). 'users' isn't a real
 * public table; it's the tableName lib/supabase/list-users.ts's logAudit()
 * calls use for the Admin Auth API (auth.admin.*) operations.
 */
export const AUDIT_MODEL_REGISTRY: Record<string, AuditModelEntry> = {
  announcements: {
    labelKey: 'journal.models.announcements',
    href: (id) => `/dashboard/annonces/${id}`,
  },
  users: {
    labelKey: 'journal.models.users',
    href: (id) => `/dashboard/users/${id}`,
  },
};
