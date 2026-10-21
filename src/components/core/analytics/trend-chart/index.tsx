'use client';

import { Text } from '@chakra-ui/react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import AnalyticsEmptyState from '@/components/core/analytics/empty-state';
import { ANALYTICS_COLORS } from '@/components/core/analytics/palette';
import AnalyticsPanelCard from '@/components/core/analytics/panel-card';
import { useColorModeValue } from '@/components/ui/color-mode';
import type { AnalyticsResult, AnalyticsTrendPoint } from '@/types/Analytics';
import { formatShortDate } from '@/utils/format';

interface AnalyticsTrendChartProps {
  title: string;
  result: AnalyticsResult<AnalyticsTrendPoint[]>;
  visitorsLabel: string;
  pageviewsLabel: string;
  errorLabel: string;
  emptyLabel: string;
  locale: string;
}

export default function AnalyticsTrendChart({
  title,
  result,
  visitorsLabel,
  pageviewsLabel,
  errorLabel,
  emptyLabel,
  locale,
}: AnalyticsTrendChartProps) {
  const visitorsColor = useColorModeValue(
    ANALYTICS_COLORS.visitors.light,
    ANALYTICS_COLORS.visitors.dark,
  );
  const pageviewsColor = useColorModeValue(
    ANALYTICS_COLORS.pageviews.light,
    ANALYTICS_COLORS.pageviews.dark,
  );
  const gridColor = useColorModeValue(
    ANALYTICS_COLORS.grid.light,
    ANALYTICS_COLORS.grid.dark,
  );
  const axisColor = useColorModeValue(
    ANALYTICS_COLORS.axisText.light,
    ANALYTICS_COLORS.axisText.dark,
  );

  if (result.status === 'error') {
    return (
      <AnalyticsPanelCard title={title}>
        <Text color="fg.muted">{errorLabel}</Text>
      </AnalyticsPanelCard>
    );
  }

  if (result.data.length === 0) {
    return (
      <AnalyticsPanelCard title={title}>
        <AnalyticsEmptyState label={emptyLabel} />
      </AnalyticsPanelCard>
    );
  }

  return (
    <AnalyticsPanelCard title={title}>
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={result.data}>
          <CartesianGrid vertical={false} stroke={gridColor} />
          <XAxis
            dataKey="date"
            tickFormatter={(value) => formatShortDate(value, locale)}
            stroke={axisColor}
            fontSize={12}
          />
          <YAxis stroke={axisColor} fontSize={12} />
          <Tooltip
            labelFormatter={(value) => formatShortDate(String(value), locale)}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="visitors"
            name={visitorsLabel}
            stroke={visitorsColor}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="pageviews"
            name={pageviewsLabel}
            stroke={pageviewsColor}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </AnalyticsPanelCard>
  );
}
