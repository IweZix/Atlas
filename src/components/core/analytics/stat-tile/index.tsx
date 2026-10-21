import { Card, Stack, Text } from '@chakra-ui/react';
import { formatCompactNumber, formatSignedPercent } from '@/utils/format';

interface StatTileProps {
  label: string;
  value: number;
  locale: string;
  deltaPercent: number | null;
  previousPeriodCaption: string;
}

export default function StatTile({
  label,
  value,
  locale,
  deltaPercent,
  previousPeriodCaption,
}: StatTileProps) {
  const deltaColor =
    deltaPercent === null
      ? 'fg.muted'
      : deltaPercent >= 0
        ? 'green.600'
        : 'red.500';

  return (
    <Card.Root>
      <Card.Body>
        <Stack gap={1}>
          <Text fontSize="sm" color="fg.muted">
            {label}
          </Text>
          <Text fontSize="2xl" fontWeight="semibold">
            {formatCompactNumber(value, locale)}
          </Text>
          <Text fontSize="sm" color={deltaColor}>
            {deltaPercent === null
              ? '—'
              : formatSignedPercent(deltaPercent, locale)}{' '}
            <Text as="span" color="fg.muted">
              {previousPeriodCaption}
            </Text>
          </Text>
        </Stack>
      </Card.Body>
    </Card.Root>
  );
}
