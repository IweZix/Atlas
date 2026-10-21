'use client';

import { Flex, Text } from '@chakra-ui/react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { LuArrowLeft } from 'react-icons/lu';
import { tKeys } from '@/localization/tKeys';

interface GoBackButtonProps {
  href: string;
}

export default function GoBackButton({ href }: GoBackButtonProps) {
  const t = useTranslations();

  return (
    <Link href={href}>
      <Flex align="center" gap={2} color="fg.muted" _hover={{ color: 'fg' }}>
        <LuArrowLeft />
        <Text>{t(tKeys.common.back)}</Text>
      </Flex>
    </Link>
  );
}
