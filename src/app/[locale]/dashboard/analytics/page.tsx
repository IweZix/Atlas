import { SimpleGrid, Text } from '@chakra-ui/react';
import { redirect } from 'next/navigation';
import { getLocale, getTranslations } from 'next-intl/server';
import AnalyticsBarPanel from '@/components/core/analytics/bar-panel';
import AnalyticsPeriodTransition from '@/components/core/analytics/period-transition';
import AnalyticsStatHeader from '@/components/core/analytics/stat-header';
import AnalyticsTrendChart from '@/components/core/analytics/trend-chart';
import {
  getCurrentPeriodRange,
  getPreviousPeriodRange,
  getVisits,
  getVisitsCount,
  getVisitsTrend,
  parseAnalyticsPeriod,
  toAnalyticsBarData,
  toAnalyticsTrendData,
} from '@/lib/analytics';
import { isEnabled } from '@/lib/features';
import {
  assertCurrentUserIsAdmin,
  ForbiddenError,
} from '@/lib/supabase/list-users';
import { tKeys } from '@/localization/tKeys';
import { getCountryName, truncateLabel } from '@/utils/format';

interface AnalyticsPageProps {
  searchParams: Promise<{ period?: string }>;
}

export default async function AnalyticsPage({
  searchParams,
}: AnalyticsPageProps) {
  const t = await getTranslations();
  const locale = await getLocale();

  try {
    await assertCurrentUserIsAdmin();
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return <Text>{t(tKeys.users.accessDenied)}</Text>;
    }
    throw error;
  }

  if (!(await isEnabled('analytics'))) {
    redirect(`/${locale}/dashboard/upgrade?feature=analytics`);
  }

  const { period: rawPeriod } = await searchParams;
  const periodDays = parseAnalyticsPeriod(rawPeriod);
  const currentRange = getCurrentPeriodRange(periodDays);
  const previousRange = getPreviousPeriodRange(periodDays);

  const [
    currentTotals,
    previousTotals,
    dailyTrend,
    topPages,
    topReferrers,
    topCountries,
    topDevices,
    topOS,
  ] = await Promise.all([
    getVisitsCount(currentRange),
    getVisitsCount(previousRange),
    getVisitsTrend(currentRange),
    getVisits({ by: ['requestPath'], ...currentRange, limit: 10 }),
    getVisits({ by: ['referrerHostname'], ...currentRange, limit: 10 }),
    getVisits({ by: ['country'], ...currentRange, limit: 10 }),
    getVisits({ by: ['deviceType'], ...currentRange, limit: 10 }),
    getVisits({ by: ['osName'], ...currentRange, limit: 10 }),
  ]);

  const trendData = toAnalyticsTrendData(dailyTrend);
  const pagesData = toAnalyticsBarData(topPages, (row) =>
    truncateLabel(row.requestPath),
  );
  const referrersData = toAnalyticsBarData(
    topReferrers,
    (row) => row.referrerHostname || t(tKeys.analytics.direct),
  );
  const countriesData = toAnalyticsBarData(topCountries, (row) =>
    getCountryName(row.country, locale),
  );
  const devicesData = toAnalyticsBarData(topDevices, (row) => row.deviceType);
  const osData = toAnalyticsBarData(topOS, (row) => row.osName);

  const errorLabel = t(tKeys.analytics.loadError);
  const emptyLabel = t(tKeys.analytics.noData);

  return (
    <AnalyticsPeriodTransition
      title={t(tKeys.analytics.title)}
      period={periodDays}
      locale={locale}
    >
      <AnalyticsStatHeader
        currentTotals={currentTotals}
        previousTotals={previousTotals}
        visitorsLabel={t(tKeys.analytics.stats.visitors)}
        pageviewsLabel={t(tKeys.analytics.stats.pageviews)}
        previousPeriodCaption={t(tKeys.analytics.comparedToPreviousPeriod, {
          days: periodDays,
        })}
        errorLabel={errorLabel}
        emptyLabel={emptyLabel}
        locale={locale}
      />

      <AnalyticsTrendChart
        title={t(tKeys.analytics.chart.title)}
        result={trendData}
        visitorsLabel={t(tKeys.analytics.stats.visitors)}
        pageviewsLabel={t(tKeys.analytics.stats.pageviews)}
        errorLabel={errorLabel}
        emptyLabel={emptyLabel}
        locale={locale}
      />

      <SimpleGrid columns={{ base: 1, lg: 2 }} gap={4}>
        <AnalyticsBarPanel
          title={t(tKeys.analytics.panels.pages)}
          result={pagesData}
          errorLabel={errorLabel}
          emptyLabel={emptyLabel}
          locale={locale}
        />
        <AnalyticsBarPanel
          title={t(tKeys.analytics.panels.referrers)}
          result={referrersData}
          errorLabel={errorLabel}
          emptyLabel={emptyLabel}
          locale={locale}
        />
        <AnalyticsBarPanel
          title={t(tKeys.analytics.panels.countries)}
          result={countriesData}
          errorLabel={errorLabel}
          emptyLabel={emptyLabel}
          locale={locale}
        />
        <AnalyticsBarPanel
          title={t(tKeys.analytics.panels.devices)}
          result={devicesData}
          errorLabel={errorLabel}
          emptyLabel={emptyLabel}
          locale={locale}
        />
        <AnalyticsBarPanel
          title={t(tKeys.analytics.panels.os)}
          result={osData}
          errorLabel={errorLabel}
          emptyLabel={emptyLabel}
          locale={locale}
        />
      </SimpleGrid>
    </AnalyticsPeriodTransition>
  );
}
