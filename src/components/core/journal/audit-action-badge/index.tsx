import { Badge } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import type { AuditAction } from '@/lib/audit';
import { tKeys } from '@/localization/tKeys';

const ACTION_COLOR_PALETTE: Record<AuditAction, string> = {
  insert: 'green',
  update: 'blue',
  delete: 'red',
  restore: 'gray',
};

interface AuditActionBadgeProps {
  action: AuditAction;
}

export default function AuditActionBadge({ action }: AuditActionBadgeProps) {
  const t = useTranslations();

  return (
    <Badge colorPalette={ACTION_COLOR_PALETTE[action]}>
      {t(tKeys.journal.actions[action])}
    </Badge>
  );
}
