import { Card, Heading, Stack } from '@chakra-ui/react';
import type { ReactNode } from 'react';

interface AnalyticsPanelCardProps {
  title: string;
  children: ReactNode;
}

export default function AnalyticsPanelCard({
  title,
  children,
}: AnalyticsPanelCardProps) {
  return (
    <Card.Root>
      <Card.Body>
        <Stack gap={3}>
          <Heading size="sm">{title}</Heading>
          {children}
        </Stack>
      </Card.Body>
    </Card.Root>
  );
}
