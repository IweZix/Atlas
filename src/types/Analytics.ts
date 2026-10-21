export type AnalyticsGranularity = 'hour' | 'day' | 'week' | 'month' | 'year';

export type AnalyticsDimension =
  | 'requestPath'
  | 'route'
  | 'referrerHostname'
  | 'country'
  | 'deviceType'
  | 'osName'
  | 'browserName';

export type AnalyticsPeriodDays = 7 | 30 | 90;

export interface AnalyticsDateRange {
  since: string;
  until: string;
}

export type VisitsAggregateRow<K extends AnalyticsDimension> = {
  [P in K]: string;
} & {
  pageviews: number;
  visitors: number;
};

/**
 * A time-granularity breakdown (`by=day` etc.) doesn't key its rows by the
 * granularity name — the API always names that field `timestamp`, an ISO
 * datetime string, regardless of which granularity was requested.
 */
export interface VisitsTrendRow {
  timestamp: string;
  pageviews: number;
  visitors: number;
}

export interface VisitsCountTotals {
  pageviews: number;
  visitors: number;
}

/**
 * A failed fetch is data, not a thrown exception — this is what lets
 * `Promise.all` in the analytics page stay safe: nothing in it ever rejects,
 * so one failing panel never blocks the others from rendering.
 */
export type AnalyticsResult<T> =
  | { status: 'success'; data: T }
  | { status: 'error'; message: string };

export interface AnalyticsBarDatum {
  label: string;
  value: number;
}

export interface AnalyticsTrendPoint {
  date: string;
  visitors: number;
  pageviews: number;
}
