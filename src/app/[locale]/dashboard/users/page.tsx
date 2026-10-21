'use client';

import {
  Button,
  createListCollection,
  Flex,
  IconButton,
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
import { useEffect, useMemo, useState } from 'react';
import { LuArrowDown, LuArrowUp } from 'react-icons/lu';
import DataTable from '@/components/core/data-table';
import { mapUserToTableRow } from '@/components/core/mappers/user-table-mapper';
import PageHeader from '@/components/core/page-header';
import Pagination from '@/components/core/pagination';
import type { SortOrder, UserSortField } from '@/lib/supabase/list-users';
import { tKeys } from '@/localization/tKeys';
import { getUsers } from '@/services/users';

const USERS_PER_PAGE = 10;
const ALL_VALUE = '__default__';
const SORT_FIELDS: UserSortField[] = ['email', 'name', 'role', 'status'];

export default function Users() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const search = searchParams.get('search') ?? '';
  const sortByParam = searchParams.get('sortBy');
  const sortBy = SORT_FIELDS.includes(sortByParam as UserSortField)
    ? (sortByParam as UserSortField)
    : undefined;
  const sortOrder: SortOrder =
    searchParams.get('sortOrder') === 'desc' ? 'desc' : 'asc';

  const [searchInput, setSearchInput] = useState(search);

  // Debounce free-text search before committing it to the URL, so we don't
  // fire a request on every keystroke. Select/toggle changes below commit
  // to the URL immediately, since those aren't typed character by character.
  useEffect(() => {
    const handle = setTimeout(() => {
      if (searchInput === search) return;
      const params = new URLSearchParams(searchParams.toString());
      if (searchInput) params.set('search', searchInput);
      else params.delete('search');
      params.delete('page');
      router.push(`${pathname}?${params.toString()}`);
    }, 300);
    return () => clearTimeout(handle);
  }, [searchInput, search, searchParams, pathname, router]);

  function updateParams(next: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    params.delete('page');
    router.push(`${pathname}?${params.toString()}`);
  }

  const { data, isPending, isError, error } = useQuery({
    queryKey: ['users', page, USERS_PER_PAGE, search, sortBy, sortOrder],
    queryFn: () =>
      getUsers(page, USERS_PER_PAGE, { search, sortBy, sortOrder }),
  });

  const users = useMemo(
    () =>
      data?.users.map((user) => {
        return mapUserToTableRow(user, locale, t);
      }) ?? [],
    [data?.users, locale, t],
  );

  const headers = [
    t(tKeys.users.columns.email),
    t(tKeys.users.columns.name),
    t(tKeys.users.columns.role),
    t(tKeys.users.columns.status),
  ];

  const sortOptions = useMemo(
    () =>
      createListCollection({
        items: [
          { value: ALL_VALUE, label: t(tKeys.users.sort.default) },
          { value: 'email', label: t(tKeys.users.columns.email) },
          { value: 'name', label: t(tKeys.users.columns.name) },
          { value: 'role', label: t(tKeys.users.columns.role) },
          { value: 'status', label: t(tKeys.users.columns.status) },
        ],
      }),
    [t],
  );

  if (isError) {
    if (error instanceof Error && error.message === 'forbidden') {
      return <Text>{t(tKeys.users.accessDenied)}</Text>;
    }
    return <Text>{t(tKeys.users.loadError)}</Text>;
  }

  return (
    <Stack gap={4}>
      <PageHeader
        title={t(tKeys.users.title)}
        action={
          <Button
            asChild
            colorPalette="gray"
            bg="black"
            color="white"
            _hover={{ bg: 'gray.800' }}
          >
            <Link href={`/${locale}/dashboard/users/new`}>
              {t(tKeys.users.addButton)}
            </Link>
          </Button>
        }
      />

      <Flex gap={4} wrap="wrap" align="flex-end">
        <Stack gap={1} minW="240px" flex="1">
          <Text fontSize="sm" color="fg.muted">
            {t(tKeys.users.searchPlaceholder)}
          </Text>
          <Input
            value={searchInput}
            placeholder={t(tKeys.users.searchPlaceholder)}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </Stack>

        <Stack gap={1}>
          <Text fontSize="sm" color="fg.muted">
            {t(tKeys.users.sort.label)}
          </Text>
          <Flex gap={2}>
            <Select.Root
              collection={sortOptions}
              value={[sortBy ?? ALL_VALUE]}
              onValueChange={(details) =>
                updateParams({
                  sortBy:
                    details.value[0] === ALL_VALUE ? '' : details.value[0],
                })
              }
              minW="160px"
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
                    {sortOptions.items.map((item) => (
                      <Select.Item item={item} key={item.value}>
                        {item.label}
                        <Select.ItemIndicator />
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Positioner>
              </Portal>
            </Select.Root>
            <IconButton
              aria-label={t(
                sortOrder === 'asc'
                  ? tKeys.users.sort.ascending
                  : tKeys.users.sort.descending,
              )}
              variant="outline"
              disabled={!sortBy}
              onClick={() =>
                updateParams({
                  sortOrder: sortOrder === 'asc' ? 'desc' : 'asc',
                })
              }
            >
              {sortOrder === 'asc' ? <LuArrowUp /> : <LuArrowDown />}
            </IconButton>
          </Flex>
        </Stack>
      </Flex>

      {!isPending && users.length === 0 ? (
        search ? (
          <Stack gap={4}>
            <DataTable headers={headers} rows={[]} isLoading={false} />
            <Stack align="center" py={8}>
              <Text color="fg.muted">{t(tKeys.users.empty.noResults)}</Text>
            </Stack>
          </Stack>
        ) : (
          <Stack align="center" gap={4} py={12}>
            <Button
              asChild
              colorPalette="gray"
              bg="black"
              color="white"
              _hover={{ bg: 'gray.800' }}
            >
              <Link href={`/${locale}/dashboard/users/new`}>
                {t(tKeys.users.empty.createButton)}
              </Link>
            </Button>
          </Stack>
        )
      ) : (
        <DataTable headers={headers} rows={users} isLoading={isPending} />
      )}
      <Pagination
        page={page}
        lastPage={data?.lastPage ?? 1}
        hrefForPage={(targetPage) => {
          const params = new URLSearchParams(searchParams.toString());
          params.set('page', String(targetPage));
          return `${pathname}?${params.toString()}`;
        }}
      />
    </Stack>
  );
}
