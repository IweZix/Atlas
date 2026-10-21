import type {
  GetAuditLogsParams,
  GetAuditLogsResult,
} from '@/services/types/audit-logs';

/**
 * Fetches a paginated, filtered page of the audit journal from the API.
 * @param params Pagination and filter parameters.
 * @returns A promise resolving to the matching logs and pagination info.
 */
export async function getAuditLogs(
  params: GetAuditLogsParams,
): Promise<GetAuditLogsResult> {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') {
      searchParams.set(key, String(value));
    }
  }

  const response = await fetch(`/api/admin/journal?${searchParams.toString()}`);

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error ?? 'journal_unavailable');
  }

  return response.json();
}
