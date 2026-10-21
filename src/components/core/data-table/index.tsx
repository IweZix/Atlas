import { Box, Table } from '@chakra-ui/react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { RectangleSkeleton } from '@/components/core/skeletons/rectangle';

const SKELETON_ROW_COUNT = 5;

export interface DataTableRow {
  id: string;
  cells: ReactNode[];
  /** When set, the whole row navigates there — every cell becomes part of the link. */
  href?: string;
}

export interface DataTableProps {
  headers: string[];
  rows: DataTableRow[];
  isLoading?: boolean;
}

export default function DataTable({
  headers,
  rows,
  isLoading,
}: DataTableProps) {
  return (
    <Table.Root>
      <Table.Header>
        <Table.Row>
          {headers.map((header) => (
            <Table.ColumnHeader key={header}>{header}</Table.ColumnHeader>
          ))}
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {isLoading
          ? Array.from({ length: SKELETON_ROW_COUNT }).map((_, rowIndex) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: skeleton rows have no stable identity
              <Table.Row key={rowIndex}>
                {headers.map((header) => (
                  <Table.Cell key={header}>
                    <RectangleSkeleton height="16px" />
                  </Table.Cell>
                ))}
              </Table.Row>
            ))
          : rows.map((row) => (
              <Table.Row
                key={row.id}
                _hover={row.href ? { bg: 'bg.muted' } : undefined}
              >
                {row.cells.map((cell, index) =>
                  row.href ? (
                    // biome-ignore lint/suspicious/noArrayIndexKey: cells are positional, matched to `headers` by index
                    <Table.Cell key={index} p={0}>
                      <Link href={row.href}>
                        <Box px={4} py={2}>
                          {cell}
                        </Box>
                      </Link>
                    </Table.Cell>
                  ) : (
                    // biome-ignore lint/suspicious/noArrayIndexKey: cells are positional, matched to `headers` by index
                    <Table.Cell key={index}>{cell}</Table.Cell>
                  ),
                )}
              </Table.Row>
            ))}
      </Table.Body>
    </Table.Root>
  );
}
