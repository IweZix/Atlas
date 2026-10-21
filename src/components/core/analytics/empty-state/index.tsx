import { Stack, Text } from '@chakra-ui/react';
import { LuChartBarBig } from 'react-icons/lu';

interface AnalyticsEmptyStateProps {
  label: string;
}

export default function AnalyticsEmptyState({
  label,
}: AnalyticsEmptyStateProps) {
  return (
    <Stack align="center" justify="center" gap={3} py={10} color="fg.muted">
      <LuChartBarBig size={48} strokeWidth={1.5} />
      <Text fontSize="sm">{label}</Text>
    </Stack>
  );
}
