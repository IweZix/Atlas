'use client';

import { Box, Button, Code, Stack, Text } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import type { AuditLog } from '@/lib/audit';
import { tKeys } from '@/localization/tKeys';

const TRUNCATE_LENGTH = 200;

function formatValue(value: unknown): { text: string; isJson: boolean } {
  if (value === null || value === undefined) {
    return { text: '—', isJson: false };
  }
  if (typeof value === 'object') {
    return { text: JSON.stringify(value, null, 2), isJson: true };
  }
  return { text: String(value), isJson: false };
}

function FieldValue({ value }: { value: unknown }) {
  const t = useTranslations();
  const [expanded, setExpanded] = useState(false);
  const { text, isJson } = formatValue(value);

  if (isJson) {
    return (
      <Code
        as="pre"
        p={2}
        rounded="md"
        fontSize="xs"
        whiteSpace="pre-wrap"
        wordBreak="break-word"
      >
        {text}
      </Code>
    );
  }

  const isLong = text.length > TRUNCATE_LENGTH;
  const displayText =
    isLong && !expanded ? `${text.slice(0, TRUNCATE_LENGTH)}…` : text;

  return (
    <Stack gap={1}>
      <Text whiteSpace="pre-wrap" wordBreak="break-word" fontSize="sm">
        {displayText}
      </Text>
      {isLong && (
        <Button
          size="xs"
          variant="ghost"
          alignSelf="flex-start"
          onClick={() => setExpanded((prev) => !prev)}
        >
          {t(
            expanded ? tKeys.journal.diff.seeLess : tKeys.journal.diff.seeMore,
          )}
        </Button>
      )}
    </Stack>
  );
}

function FieldList({ entries }: { entries: [string, unknown][] }) {
  return (
    <Stack gap={3}>
      {entries.map(([key, value]) => (
        <Box key={key}>
          <Text fontSize="sm" fontWeight="medium">
            {key}
          </Text>
          <FieldValue value={value} />
        </Box>
      ))}
    </Stack>
  );
}

interface AuditDiffProps {
  log: AuditLog;
}

export default function AuditDiff({ log }: AuditDiffProps) {
  const t = useTranslations();

  if (log.action === 'insert') {
    return (
      <Stack gap={3}>
        <Text fontSize="sm" fontWeight="semibold" color="fg.muted">
          {t(tKeys.journal.diff.createdValues)}
        </Text>
        <FieldList entries={Object.entries(log.newData ?? {})} />
      </Stack>
    );
  }

  if (log.action === 'delete') {
    return (
      <Stack gap={3}>
        <Text fontSize="sm" fontWeight="semibold" color="fg.muted">
          {t(tKeys.journal.diff.deletedValues)}
        </Text>
        <FieldList entries={Object.entries(log.oldData ?? {})} />
      </Stack>
    );
  }

  // update / restore — show every changed field, old -> new.
  const keys = Array.from(
    new Set([
      ...Object.keys(log.oldData ?? {}),
      ...Object.keys(log.newData ?? {}),
    ]),
  );

  return (
    <Stack gap={4}>
      {keys.map((key) => (
        <Box key={key}>
          <Text fontSize="sm" fontWeight="medium">
            {key}
          </Text>
          <Stack
            direction={{ base: 'column', sm: 'row' }}
            gap={2}
            align="flex-start"
          >
            <FieldValue value={log.oldData?.[key]} />
            <Text color="fg.muted">→</Text>
            <FieldValue value={log.newData?.[key]} />
          </Stack>
        </Box>
      ))}
    </Stack>
  );
}
