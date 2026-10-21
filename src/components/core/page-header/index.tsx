import { Flex, Heading } from '@chakra-ui/react';
import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  action?: ReactNode;
}

export default function PageHeader({ title, action }: PageHeaderProps) {
  return (
    <Flex justify="space-between" align="center">
      <Heading size="lg">{title}</Heading>
      {action}
    </Flex>
  );
}
