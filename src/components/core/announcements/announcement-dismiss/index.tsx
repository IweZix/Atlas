'use client';

import { Box, IconButton } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { LuX } from 'react-icons/lu';
import { VARIANT_COLOR_PALETTE } from '@/components/core/banners/announcement-banner/view';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { tKeys } from '@/localization/tKeys';
import type { AnnouncementVariant } from '@/types/Announcement';

interface AnnouncementDismissProps {
  id: string;
  updatedAt: string;
  variant: AnnouncementVariant;
  children: ReactNode;
}

export default function AnnouncementDismiss({
  id,
  updatedAt,
  variant,
  children,
}: AnnouncementDismissProps) {
  const t = useTranslations();
  const [isDismissed, setIsDismissed] = useLocalStorage(
    `banner-dismissed:${id}:${updatedAt}`,
    false,
  );

  if (isDismissed) return null;

  return (
    <Box position="relative" colorPalette={VARIANT_COLOR_PALETTE[variant]}>
      {children}
      <IconButton
        aria-label={t(tKeys.announcements.public.dismissAriaLabel)}
        onClick={() => setIsDismissed(true)}
        position="absolute"
        top="1"
        right="2"
        size="xs"
        variant="ghost"
        color="colorPalette.contrast"
      >
        <LuX />
      </IconButton>
    </Box>
  );
}
