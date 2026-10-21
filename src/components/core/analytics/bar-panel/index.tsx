'use client';

import { Text } from '@chakra-ui/react';
import {
  Bar,
  BarChart,
  LabelList,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';
import AnalyticsEmptyState from '@/components/core/analytics/empty-state';
import { ANALYTICS_COLORS } from '@/components/core/analytics/palette';
import AnalyticsPanelCard from '@/components/core/analytics/panel-card';
import { useColorModeValue } from '@/components/ui/color-mode';
import type { AnalyticsBarDatum, AnalyticsResult } from '@/types/Analytics';
import { formatCompactNumber } from '@/utils/format';

interface AnalyticsBarPanelProps {
  title: string;
  result: AnalyticsResult<AnalyticsBarDatum[]>;
  errorLabel: string;
  emptyLabel: string;
  locale: string;
}

export default function AnalyticsBarPanel({
  title,
  result,
  errorLabel,
  emptyLabel,
  locale,
}: AnalyticsBarPanelProps) {
  const barColor = useColorModeValue(
    ANALYTICS_COLORS.bar.light,
    ANALYTICS_COLORS.bar.dark,
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
        <BarChart data={result.data} layout="vertical">
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="label"
            width={140}
            stroke={axisColor}
            fontSize={12}
          />
          <Bar
            dataKey="value"
            fill={barColor}
            radius={[0, 4, 4, 0]}
            barSize={20}
          >
            <LabelList
              dataKey="value"
              position="right"
              formatter={(value) => formatCompactNumber(Number(value), locale)}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </AnalyticsPanelCard>
  );
}
