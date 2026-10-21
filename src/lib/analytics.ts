import 'server-only';
import type {
  AnalyticsBarDatum,
  AnalyticsDateRange,
  AnalyticsDimension,
  AnalyticsPeriodDays,
  AnalyticsResult,
  AnalyticsTrendPoint,
  VisitsAggregateRow,
  VisitsCountTotals,
  VisitsTrendRow,
} from '@/types/Analytics';

const ANALYTICS_API_BASE = 'https://api.vercel.com/v1/query/web-analytics';
const DEFAULT_PERIOD_DAYS: AnalyticsPeriodDays = 30;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

async function fetchVercelAnalytics<T>(
  endpoint: 'visits/count' | 'visits/aggregate',
  params: Record<string, string | number | undefined>,
): Promise<T> {
  const projectId = process.env.VERCEL_PROJECT_ID;
  if (!projectId) {
    throw new Error('VERCEL_PROJECT_ID is not configured');
  }

  const search = new URLSearchParams();
  search.set('projectId', projectId);
  if (process.env.VERCEL_TEAM_ID) {
    search.set('teamId', process.env.VERCEL_TEAM_ID);
  }
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      search.set(key, String(value));
    }
  }

  const response = await fetch(
    `${ANALYTICS_API_BASE}/${endpoint}?${search.toString()}`,
    {
      headers: { Authorization: `Bearer ${process.env.VERCEL_TOKEN}` },
      next: { revalidate: 3600 },
    },
  );

  if (!response.ok) {
    throw new Error(`Vercel Web Analytics API error (${response.status})`);
  }

  // The API always wraps the actual payload in an envelope:
  // { version, query, data: T } — never a bare T at the top level.
  const body = (await response.json()) as { data: T };
  return body.data;
}

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error';
}

export async function getVisits<K extends AnalyticsDimension>(opts: {
  by: [K];
  since: string;
  until: string;
  limit?: number;
  filter?: string;
}): Promise<AnalyticsResult<VisitsAggregateRow<K>[]>> {
  try {
    const data = await fetchVercelAnalytics<VisitsAggregateRow<K>[]>(
      'visits/aggregate',
      {
        by: opts.by[0],
        since: opts.since,
        until: opts.until,
        limit: opts.limit,
        filter: opts.filter,
      },
    );
    return { status: 'success', data };
  } catch (error) {
    return { status: 'error', message: toErrorMessage(error) };
  }
}

/**
 * Daily trend breakdown. Kept separate from `getVisits` because a
 * time-granularity query doesn't key its rows by the granularity name
 * (see `VisitsTrendRow`), unlike a dimension breakdown.
 */
export async function getVisitsTrend(opts: {
  since: string;
  until: string;
  filter?: string;
}): Promise<AnalyticsResult<VisitsTrendRow[]>> {
  try {
    const data = await fetchVercelAnalytics<VisitsTrendRow[]>(
      'visits/aggregate',
      { by: 'day', since: opts.since, until: opts.until, filter: opts.filter },
    );
    return { status: 'success', data };
  } catch (error) {
    return { status: 'error', message: toErrorMessage(error) };
  }
}

export async function getVisitsCount(opts: {
  since: string;
  until: string;
  filter?: string;
}): Promise<AnalyticsResult<VisitsCountTotals>> {
  try {
    const data = await fetchVercelAnalytics<VisitsCountTotals>(
      'visits/count',
      opts,
    );
    return { status: 'success', data };
  } catch (error) {
    return { status: 'error', message: toErrorMessage(error) };
  }
}

export function parseAnalyticsPeriod(
  raw: string | undefined,
): AnalyticsPeriodDays {
  const days = Number(raw);
  return days === 7 || days === 30 || days === 90
    ? (days as AnalyticsPeriodDays)
    : DEFAULT_PERIOD_DAYS;
}

function toDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function getCurrentPeriodRange(
  days: AnalyticsPeriodDays,
  now = new Date(),
): AnalyticsDateRange {
  return {
    since: toDateOnly(new Date(now.getTime() - days * MS_PER_DAY)),
    until: toDateOnly(now),
  };
}

export function getPreviousPeriodRange(
  days: AnalyticsPeriodDays,
  now = new Date(),
): AnalyticsDateRange {
  return {
    since: toDateOnly(new Date(now.getTime() - 2 * days * MS_PER_DAY)),
    until: toDateOnly(new Date(now.getTime() - days * MS_PER_DAY)),
  };
}

export function toAnalyticsBarData<K extends AnalyticsDimension>(
  result: AnalyticsResult<VisitsAggregateRow<K>[]>,
  getLabel: (row: VisitsAggregateRow<K>) => string,
): AnalyticsResult<AnalyticsBarDatum[]> {
  if (result.status === 'error') {
    return result;
  }
  const data = result.data
    .map((row) => ({ label: getLabel(row), value: row.visitors }))
    .sort((a, b) => b.value - a.value);
  return { status: 'success', data };
}

export function toAnalyticsTrendData(
  result: AnalyticsResult<VisitsTrendRow[]>,
): AnalyticsResult<AnalyticsTrendPoint[]> {
  if (result.status === 'error') {
    return result;
  }
  const data = [...result.data]
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
    .map((row) => ({
      date: row.timestamp,
      visitors: row.visitors,
      pageviews: row.pageviews,
    }));
  return { status: 'success', data };
}
