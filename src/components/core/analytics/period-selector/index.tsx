'use client';

import { Button, HStack } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { tKeys } from '@/localization/tKeys';
import type { AnalyticsPeriodDays } from '@/types/Analytics';

const PERIOD_OPTIONS: AnalyticsPeriodDays[] = [7, 30, 90];

const PERIOD_LABEL_KEYS: Record<AnalyticsPeriodDays, string> = {
  7: tKeys.analytics.periodSelector.days7,
  30: tKeys.analytics.periodSelector.days30,
  90: tKeys.analytics.periodSelector.days90,
};

interface AnalyticsPeriodSelectorProps {
  period: AnalyticsPeriodDays;
  isPending: boolean;
  onSelect: (period: AnalyticsPeriodDays) => void;
}

export default function AnalyticsPeriodSelector({
  period,
  isPending,
  onSelect,
}: AnalyticsPeriodSelectorProps) {
  const t = useTranslations();

  return (
    <HStack gap={2}>
      {PERIOD_OPTIONS.map((option) => {
        const isActive = option === period;
        return (
          <Button
            key={option}
            size="sm"
            colorPalette="gray"
            variant={isActive ? 'solid' : 'ghost'}
            bg={isActive ? 'black' : undefined}
            color={isActive ? 'white' : undefined}
            _hover={isActive ? { bg: 'gray.800' } : undefined}
            disabled={isPending}
            onClick={() => onSelect(option)}
          >
            {t(PERIOD_LABEL_KEYS[option])}
          </Button>
        );
      })}
    </HStack>
  );
}
