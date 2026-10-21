'use client';

import { CloseButton, Drawer, Portal, Stack, Text } from '@chakra-ui/react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import AuditActionBadge from '@/components/core/journal/audit-action-badge';
import AuditDiff from '@/components/core/journal/audit-diff';
import { formatDisplayDateTime } from '@/lib/announcements/dates';
import type { AuditLog } from '@/lib/audit';
import { AUDIT_MODEL_REGISTRY } from '@/lib/audit/model-registry';
import { tKeys } from '@/localization/tKeys';

interface AuditDetailsDrawerProps {
  log: AuditLog | null;
  onClose: () => void;
}

export default function AuditDetailsDrawer({
  log,
  onClose,
}: AuditDetailsDrawerProps) {
  const t = useTranslations();
  const locale = useLocale();

  const entry = log ? AUDIT_MODEL_REGISTRY[log.tableName] : undefined;
  const typeLabel = entry ? t(entry.labelKey) : log?.tableName;
  const href =
    log && entry?.href && log.recordId && log.action !== 'delete'
      ? entry.href(log.recordId)
      : undefined;

  return (
    <Drawer.Root
      open={log !== null}
      onOpenChange={(e) => {
        if (!e.open) onClose();
      }}
      placement="end"
      size="md"
    >
      <Portal>
        <Drawer.Backdrop />
        <Drawer.Positioner>
          <Drawer.Content>
            <Drawer.Header>
              <Drawer.Title>{t(tKeys.journal.detailsPanel.title)}</Drawer.Title>
              <Drawer.CloseTrigger asChild>
                <CloseButton
                  size="sm"
                  aria-label={t(tKeys.journal.detailsPanel.close)}
                />
              </Drawer.CloseTrigger>
            </Drawer.Header>
            <Drawer.Body>
              {log && (
                <Stack gap={4}>
                  <Stack gap={1}>
                    <Text fontSize="sm" color="fg.muted">
                      {formatDisplayDateTime(log.createdAt, locale)}
                    </Text>
                    <Text fontWeight="medium">
                      {log.userEmail ?? t(tKeys.journal.system)}
                    </Text>
                    <Stack direction="row" gap={2} align="center">
                      <AuditActionBadge action={log.action} />
                      <Text fontSize="sm" color="fg.muted">
                        {typeLabel}
                      </Text>
                    </Stack>
                    {href && (
                      <Link href={`/${locale}${href}`}>
                        <Text fontSize="sm" color="blue.500">
                          {log.recordId}
                        </Text>
                      </Link>
                    )}
                  </Stack>
                  <AuditDiff log={log} />
                </Stack>
              )}
            </Drawer.Body>
          </Drawer.Content>
        </Drawer.Positioner>
      </Portal>
    </Drawer.Root>
  );
}
