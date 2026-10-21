'use client';

import { Badge, Button, Spinner, Stack, Text } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect } from 'react';
import AnnouncementDeleteButton from '@/components/core/announcements/announcement-delete-button';
import AnnouncementToggleButton from '@/components/core/announcements/announcement-toggle-button';
import DataTable, { type DataTableRow } from '@/components/core/data-table';
import PageHeader from '@/components/core/page-header';
import {
  formatDisplayDate,
  getAnnouncementPeriod,
} from '@/lib/announcements/dates';
import {
  type AnnouncementStatus,
  getAnnouncementStatus,
} from '@/lib/announcements/status';
import { tKeys } from '@/localization/tKeys';
import { getAnnouncements } from '@/services/announcements';
import { truncateLabel } from '@/utils/format';

const STATUS_COLOR_PALETTE: Record<AnnouncementStatus, string> = {
  live: 'green',
  scheduled: 'blue',
  expired: 'gray',
  disabled: 'gray',
  pending: 'orange',
};

export default function AnnouncementsPage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();

  const { data, isPending, isError, error } = useQuery({
    queryKey: ['announcements'],
    queryFn: getAnnouncements,
  });

  const isFeatureDisabled =
    error instanceof Error && error.message === 'feature_disabled';

  useEffect(() => {
    if (isFeatureDisabled) {
      router.replace(`/${locale}/dashboard/upgrade?feature=banner`);
    }
  }, [isFeatureDisabled, locale, router]);

  if (isFeatureDisabled) {
    return <Spinner />;
  }

  if (isError) {
    if (error instanceof Error && error.message === 'forbidden') {
      return <Text>{t(tKeys.announcements.accessDenied)}</Text>;
    }
    return <Text>{t(tKeys.announcements.loadError)}</Text>;
  }

  const announcements = data?.announcements ?? [];
  const activeAnnouncementId = data?.activeAnnouncementId ?? null;
  const now = new Date();

  function periodText(startsAt: string | null, endsAt: string | null): string {
    const period = getAnnouncementPeriod(startsAt, endsAt);
    if (period.kind === 'from') {
      return t(tKeys.announcements.period.from, {
        date: formatDisplayDate(period.date, locale),
      });
    }
    if (period.kind === 'until') {
      return t(tKeys.announcements.period.until, {
        date: formatDisplayDate(period.date, locale),
      });
    }
    if (period.kind === 'range') {
      return t(tKeys.announcements.period.range, {
        start: formatDisplayDate(period.start, locale),
        end: formatDisplayDate(period.end, locale),
      });
    }
    return t(tKeys.announcements.period.unlimited);
  }

  const rows: DataTableRow[] = announcements.map((announcement) => {
    const status = getAnnouncementStatus(
      announcement,
      activeAnnouncementId,
      now,
    );
    return {
      id: announcement.id,
      cells: [
        <Link
          key="message"
          href={`/${locale}/dashboard/annonces/${announcement.id}`}
        >
          {truncateLabel(announcement.message, 60)}
        </Link>,
        periodText(announcement.startsAt, announcement.endsAt),
        <Badge key="status" colorPalette={STATUS_COLOR_PALETTE[status]}>
          {t(tKeys.announcements.status[status])}
        </Badge>,
        <Stack key="actions" direction="row" gap={2}>
          <AnnouncementToggleButton
            id={announcement.id}
            isActive={announcement.isActive}
          />
          <AnnouncementDeleteButton id={announcement.id} />
        </Stack>,
      ],
    };
  });

  return (
    <Stack gap={4}>
      <PageHeader
        title={t(tKeys.announcements.title)}
        action={
          <Button
            asChild
            colorPalette="gray"
            bg="black"
            color="white"
            _hover={{ bg: 'gray.800' }}
          >
            <Link href={`/${locale}/dashboard/annonces/new`}>
              {t(tKeys.announcements.addButton)}
            </Link>
          </Button>
        }
      />
      {!isPending && announcements.length === 0 ? (
        <Stack align="center" gap={4} py={12}>
          <Text color="fg.muted">
            {t(tKeys.announcements.emptyDescription)}
          </Text>
          <Button
            asChild
            colorPalette="gray"
            bg="black"
            color="white"
            _hover={{ bg: 'gray.800' }}
          >
            <Link href={`/${locale}/dashboard/annonces/new`}>
              {t(tKeys.announcements.addButton)}
            </Link>
          </Button>
        </Stack>
      ) : (
        <DataTable
          headers={[
            t(tKeys.announcements.columns.message),
            t(tKeys.announcements.columns.period),
            t(tKeys.announcements.columns.status),
            t(tKeys.announcements.columns.actions),
          ]}
          rows={rows}
          isLoading={isPending}
        />
      )}
    </Stack>
  );
}
