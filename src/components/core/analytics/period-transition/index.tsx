'use client';

import { Box, Center, Spinner, Stack } from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import { type ReactNode, useTransition } from 'react';
import AnalyticsPeriodSelector from '@/components/core/analytics/period-selector';
import PageHeader from '@/components/core/page-header';
import type { AnalyticsPeriodDays } from '@/types/Analytics';

interface AnalyticsPeriodTransitionProps {
  title: string;
  period: AnalyticsPeriodDays;
  locale: string;
  children: ReactNode;
}

export default function AnalyticsPeriodTransition({
  title,
  period,
  locale,
  children,
}: AnalyticsPeriodTransitionProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleSelect = (option: AnalyticsPeriodDays) => {
    startTransition(() => {
      router.push(`/${locale}/dashboard/analytics?period=${option}`);
    });
  };

  return (
    <Stack gap={6}>
      <PageHeader
        title={title}
        action={
          <AnalyticsPeriodSelector
            period={period}
            isPending={isPending}
            onSelect={handleSelect}
          />
        }
      />
      <Box position="relative">
        <Stack
          gap={6}
          opacity={isPending ? 0.5 : 1}
          pointerEvents={isPending ? 'none' : 'auto'}
          transition="opacity 0.15s ease"
        >
          {children}
        </Stack>
        {isPending && (
          <Center position="absolute" inset={0}>
            <Spinner size="lg" />
          </Center>
        )}
      </Box>
    </Stack>
  );
}
