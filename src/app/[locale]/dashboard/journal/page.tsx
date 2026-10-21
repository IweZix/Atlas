'use client';

import {
  Button,
  createListCollection,
  Flex,
  Input,
  Portal,
  Select,
  Stack,
  Text,
} from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import DataTable, { type DataTableRow } from '@/components/core/data-table';
import AuditActionBadge from '@/components/core/journal/audit-action-badge';
import AuditDetailsDrawer from '@/components/core/journal/audit-details-drawer';
import PageHeader from '@/components/core/page-header';
import Pagination from '@/components/core/pagination';
import {
  endDateInputToUtc,
  formatDisplayDateTime,
  startDateInputToUtc,
} from '@/lib/announcements/dates';
import type { AuditAction, AuditLog } from '@/lib/audit';
import { AUDIT_MODEL_REGISTRY } from '@/lib/audit/model-registry';
import { tKeys } from '@/localization/tKeys';
import { getAuditLogs } from '@/services/audit-logs';
import { getUsers } from '@/services/users';

const JOURNAL_PER_PAGE = 20;
const ACTIONS: AuditAction[] = ['insert', 'update', 'delete', 'restore'];
const SYSTEM_USER_VALUE = 'system';
const ALL_VALUE = '__all__';

export default function JournalPage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const userId = searchParams.get('userId') ?? '';
  const tableName = searchParams.get('tableName') ?? '';
  const action = (searchParams.get('action') as AuditAction | null) ?? '';
  const from = searchParams.get('from') ?? '';
  const to = searchParams.get('to') ?? '';
  const hasFilters = Boolean(userId || tableName || action || from || to);

  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  function updateParams(next: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    params.delete('page'); // reset pagination whenever filters change
    router.push(`${pathname}?${params.toString()}`);
  }

  function hrefForPage(targetPage: number): string {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(targetPage));
    return `${pathname}?${params.toString()}`;
  }

  const { data, isPending, isError, error } = useQuery({
    queryKey: ['journal', page, userId, tableName, action, from, to],
    queryFn: () =>
      getAuditLogs({
        page,
        perPage: JOURNAL_PER_PAGE,
        userId: userId || undefined,
        tableName: tableName || undefined,
        action: (action || undefined) as AuditAction | undefined,
        from: from ? startDateInputToUtc(from).toISOString() : undefined,
        to: to ? endDateInputToUtc(to).toISOString() : undefined,
      }),
  });

  const { data: usersData } = useQuery({
    queryKey: ['users', 1, 100],
    queryFn: () => getUsers(1, 100),
  });

  const userOptions = useMemo(
    () =>
      createListCollection({
        items: [
          { value: ALL_VALUE, label: t(tKeys.journal.filters.allUsers) },
          { value: SYSTEM_USER_VALUE, label: t(tKeys.journal.filters.system) },
          ...(usersData?.users.map((u) => ({
            value: u.id,
            label: u.email ?? u.id,
          })) ?? []),
        ],
      }),
    [usersData, t],
  );

  const tableOptions = useMemo(
    () =>
      createListCollection({
        items: [
          { value: ALL_VALUE, label: t(tKeys.journal.filters.allTypes) },
          ...Object.entries(AUDIT_MODEL_REGISTRY).map(([key, entry]) => ({
            value: key,
            label: t(entry.labelKey),
          })),
        ],
      }),
    [t],
  );

  const actionOptions = useMemo(
    () =>
      createListCollection({
        items: [
          { value: ALL_VALUE, label: t(tKeys.journal.filters.allActions) },
          ...ACTIONS.map((a) => ({
            value: a,
            label: t(tKeys.journal.actions[a]),
          })),
        ],
      }),
    [t],
  );

  if (isError) {
    if (error instanceof Error && error.message === 'forbidden') {
      return <Text>{t(tKeys.journal.accessDenied)}</Text>;
    }
    return <Text>{t(tKeys.journal.loadError)}</Text>;
  }

  const rows: DataTableRow[] = (data?.items ?? []).map((log) => {
    const entry = AUDIT_MODEL_REGISTRY[log.tableName];
    const typeLabel = entry ? t(entry.labelKey) : log.tableName;
    const elementHref =
      entry?.href && log.recordId && log.action !== 'delete'
        ? `/${locale}${entry.href(log.recordId)}`
        : undefined;

    return {
      id: String(log.id),
      cells: [
        formatDisplayDateTime(log.createdAt, locale),
        log.userEmail ?? t(tKeys.journal.system),
        <AuditActionBadge key="action" action={log.action} />,
        typeLabel,
        elementHref ? (
          <Link key="element" href={elementHref}>
            <Text color="blue.500">{log.recordId}</Text>
          </Link>
        ) : (
          (log.recordId ?? '—')
        ),
        <Button
          key="details"
          size="xs"
          variant="outline"
          onClick={() => setSelectedLog(log)}
        >
          {t(tKeys.journal.columns.details)}
        </Button>,
      ],
    };
  });

  return (
    <Stack gap={4}>
      <PageHeader title={t(tKeys.journal.title)} />

      <Flex gap={4} wrap="wrap" align="flex-end">
        <Stack gap={1}>
          <Text fontSize="sm" color="fg.muted">
            {t(tKeys.journal.filters.user)}
          </Text>
          <Select.Root
            collection={userOptions}
            value={[userId || ALL_VALUE]}
            onValueChange={(details) =>
              updateParams({
                userId: details.value[0] === ALL_VALUE ? '' : details.value[0],
              })
            }
            minW="200px"
          >
            <Select.HiddenSelect />
            <Select.Control>
              <Select.Trigger>
                <Select.ValueText />
              </Select.Trigger>
              <Select.IndicatorGroup>
                <Select.Indicator />
              </Select.IndicatorGroup>
            </Select.Control>
            <Portal>
              <Select.Positioner>
                <Select.Content>
                  {userOptions.items.map((item) => (
                    <Select.Item item={item} key={item.value}>
                      {item.label}
                      <Select.ItemIndicator />
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Positioner>
            </Portal>
          </Select.Root>
        </Stack>

        <Stack gap={1}>
          <Text fontSize="sm" color="fg.muted">
            {t(tKeys.journal.filters.type)}
          </Text>
          <Select.Root
            collection={tableOptions}
            value={[tableName || ALL_VALUE]}
            onValueChange={(details) =>
              updateParams({
                tableName:
                  details.value[0] === ALL_VALUE ? '' : details.value[0],
              })
            }
            minW="180px"
          >
            <Select.HiddenSelect />
            <Select.Control>
              <Select.Trigger>
                <Select.ValueText />
              </Select.Trigger>
              <Select.IndicatorGroup>
                <Select.Indicator />
              </Select.IndicatorGroup>
            </Select.Control>
            <Portal>
              <Select.Positioner>
                <Select.Content>
                  {tableOptions.items.map((item) => (
                    <Select.Item item={item} key={item.value}>
                      {item.label}
                      <Select.ItemIndicator />
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Positioner>
            </Portal>
          </Select.Root>
        </Stack>

        <Stack gap={1}>
          <Text fontSize="sm" color="fg.muted">
            {t(tKeys.journal.filters.action)}
          </Text>
          <Select.Root
            collection={actionOptions}
            value={[action || ALL_VALUE]}
            onValueChange={(details) =>
              updateParams({
                action: details.value[0] === ALL_VALUE ? '' : details.value[0],
              })
            }
            minW="180px"
          >
            <Select.HiddenSelect />
            <Select.Control>
              <Select.Trigger>
                <Select.ValueText />
              </Select.Trigger>
              <Select.IndicatorGroup>
                <Select.Indicator />
              </Select.IndicatorGroup>
            </Select.Control>
            <Portal>
              <Select.Positioner>
                <Select.Content>
                  {actionOptions.items.map((item) => (
                    <Select.Item item={item} key={item.value}>
                      {item.label}
                      <Select.ItemIndicator />
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Positioner>
            </Portal>
          </Select.Root>
        </Stack>

        <Stack gap={1}>
          <Text fontSize="sm" color="fg.muted">
            {t(tKeys.journal.filters.from)}
          </Text>
          <Input
            type="date"
            value={from}
            onChange={(e) => updateParams({ from: e.target.value })}
          />
        </Stack>

        <Stack gap={1}>
          <Text fontSize="sm" color="fg.muted">
            {t(tKeys.journal.filters.to)}
          </Text>
          <Input
            type="date"
            value={to}
            onChange={(e) => updateParams({ to: e.target.value })}
          />
        </Stack>

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(pathname)}
          >
            {t(tKeys.journal.filters.reset)}
          </Button>
        )}
      </Flex>

      {!isPending && rows.length === 0 ? (
        <Stack align="center" gap={4} py={12}>
          <Text color="fg.muted">{t(tKeys.journal.empty)}</Text>
        </Stack>
      ) : (
        <DataTable
          headers={[
            t(tKeys.journal.columns.date),
            t(tKeys.journal.columns.user),
            t(tKeys.journal.columns.action),
            t(tKeys.journal.columns.type),
            t(tKeys.journal.columns.element),
            t(tKeys.journal.columns.details),
          ]}
          rows={rows}
          isLoading={isPending}
        />
      )}

      <Pagination
        page={page}
        lastPage={data?.lastPage ?? 1}
        hrefForPage={hrefForPage}
      />

      <AuditDetailsDrawer
        log={selectedLog}
        onClose={() => setSelectedLog(null)}
      />
    </Stack>
  );
}
