'use client';

import {
  Box,
  Button,
  Flex,
  HStack,
  Spinner,
  Stack,
  Text,
} from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import AuditActionBadge from '@/components/core/journal/audit-action-badge';
import AuditDiff from '@/components/core/journal/audit-diff';
import { formatDisplayDateTime } from '@/lib/announcements/dates';
import { AUDIT_MODEL_REGISTRY } from '@/lib/audit/model-registry';
import { tKeys } from '@/localization/tKeys';
import { getAuditLogs } from '@/services/audit-logs';

const DEFAULT_PER_PAGE = 10;

interface AuditHistoryProps {
  /** Record-scoped mode: history of one row (with recordId). */
  tableName?: string;
  recordId?: string;
  /** Actor-scoped mode: recent actions performed by this user, across every table. */
  userId?: string;
  perPage?: number;
}

export default function AuditHistory({
  tableName,
  recordId,
  userId,
  perPage = DEFAULT_PER_PAGE,
}: AuditHistoryProps) {
  const t = useTranslations();
  const locale = useLocale();
  const [page, setPage] = useState(1);

  const { data, isPending, isError, error } = useQuery({
    queryKey: ['journal', tableName, recordId, userId, page, perPage],
    queryFn: () => getAuditLogs({ tableName, recordId, userId, page, perPage }),
  });

  if (isPending) {
    return <Spinner />;
  }

  if (isError) {
    if (error instanceof Error && error.message === 'forbidden') {
      return <Text>{t(tKeys.journal.accessDenied)}</Text>;
    }
    return <Text>{t(tKeys.journal.history.loadError)}</Text>;
  }

  if (data.items.length === 0) {
    return <Text color="fg.muted">{t(tKeys.journal.history.empty)}</Text>;
  }

  // Actor-scoped entries can span several tables, so show what was affected
  // instead of who did it (always the same person on this tab).
  const showType = !tableName;

  return (
    <Stack gap={4}>
      <Stack gap={0}>
        {data.items.map((log, index) => {
          const entry = AUDIT_MODEL_REGISTRY[log.tableName];
          const typeLabel = entry ? t(entry.labelKey) : log.tableName;
          const elementHref =
            entry?.href && log.recordId && log.action !== 'delete'
              ? `/${locale}${entry.href(log.recordId)}`
              : undefined;

          return (
            <Flex key={log.id} gap={4}>
              <Stack align="center" gap={0}>
                <Box
                  w="10px"
                  h="10px"
                  rounded="full"
                  bg="fg.muted"
                  mt="6px"
                  flexShrink={0}
                />
                {index < data.items.length - 1 && (
                  <Box w="2px" flex="1" bg="border" minH="24px" />
                )}
              </Stack>
              <Stack gap={2} pb={6} flex="1">
                <Stack direction="row" gap={2} align="center" wrap="wrap">
                  <AuditActionBadge action={log.action} />
                  <Text fontSize="sm" color="fg.muted">
                    {formatDisplayDateTime(log.createdAt, locale)}
                  </Text>
                  {showType ? (
                    elementHref ? (
                      <Link href={elementHref}>
                        <Text fontSize="sm" color="blue.500">
                          {typeLabel}
                        </Text>
                      </Link>
                    ) : (
                      <Text fontSize="sm" color="fg.muted">
                        {typeLabel}
                      </Text>
                    )
                  ) : (
                    <Text fontSize="sm" fontWeight="medium">
                      {log.userEmail ?? t(tKeys.journal.system)}
                    </Text>
                  )}
                </Stack>
                <AuditDiff log={log} />
              </Stack>
            </Flex>
          );
        })}
      </Stack>

      {data.lastPage > 1 && (
        <HStack justify="space-between">
          <Button
            size="sm"
            variant="ghost"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            {t(tKeys.pagination.previous)}
          </Button>
          <Text fontSize="sm" color="fg.muted">
            {t(tKeys.pagination.pageOf, { page, lastPage: data.lastPage })}
          </Text>
          <Button
            size="sm"
            variant="ghost"
            disabled={page >= data.lastPage}
            onClick={() => setPage((p) => p + 1)}
          >
            {t(tKeys.pagination.next)}
          </Button>
        </HStack>
      )}
    </Stack>
  );
}
