import { Box, Flex, Text } from '@chakra-ui/react';
import Link from 'next/link';
import type { AnnouncementVariant } from '@/types/Announcement';

export const VARIANT_COLOR_PALETTE: Record<AnnouncementVariant, string> = {
  info: 'blue',
  promo: 'purple',
  alerte: 'orange',
};

export interface AnnouncementBannerViewProps {
  message: string;
  variant: AnnouncementVariant;
  linkUrl?: string | null;
  linkLabel?: string | null;
  ariaLabel: string;
}

/**
 * Pure presentational, no hooks, no 'use client', no server-only imports —
 * dual-usable from the public Server Component banner AND the dashboard
 * form's live Client Component preview.
 */
export function AnnouncementBannerView({
  message,
  variant,
  linkUrl,
  linkLabel,
  ariaLabel,
}: AnnouncementBannerViewProps) {
  const showLink = Boolean(linkUrl && linkLabel);
  const isInternal = linkUrl?.startsWith('/');

  return (
    <Box
      as="section"
      aria-label={ariaLabel}
      colorPalette={VARIANT_COLOR_PALETTE[variant]}
      bg="colorPalette.solid"
      color="colorPalette.contrast"
      px={4}
      py={2}
    >
      <Flex
        maxW="7xl"
        mx="auto"
        align="center"
        justify="center"
        gap={3}
        wrap="wrap"
        textAlign="center"
      >
        <Text fontSize="sm" fontWeight="medium" lineClamp={2}>
          {message}
        </Text>
        {showLink &&
          (isInternal ? (
            <Link
              href={linkUrl as string}
              style={{ textDecoration: 'underline', fontWeight: 600 }}
            >
              {linkLabel}
            </Link>
          ) : (
            <a
              href={linkUrl as string}
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: 'underline', fontWeight: 600 }}
            >
              {linkLabel}
            </a>
          ))}
      </Flex>
    </Box>
  );
}
