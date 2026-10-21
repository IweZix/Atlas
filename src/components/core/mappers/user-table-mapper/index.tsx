import { Box, Flex, Text } from '@chakra-ui/react';
import type { useTranslations } from 'next-intl';
import type { DataTableRow } from '@/components/core/data-table';
import type { AdminUser } from '@/lib/supabase/list-users';
import { tKeys } from '@/localization/tKeys';

type Translator = ReturnType<typeof useTranslations>;

export function mapUserToTableRow(
  user: AdminUser,
  locale: string,
  t: Translator,
): DataTableRow {
  return {
    id: user.id,
    href: `/${locale}/dashboard/users/${user.id}`,
    cells: [
      user.email,
      user.fullName ?? 'N/A',
      user.role ?? 'N/A',
      <Flex key="status" align="center" gap={2}>
        <Box
          w="8px"
          h="8px"
          rounded="full"
          bg={user.isActive ? 'green.500' : 'gray.400'}
        />
        <Text>
          {user.isActive
            ? t(tKeys.users.columns.active)
            : t(tKeys.users.columns.inactive)}
        </Text>
      </Flex>,
    ],
  };
}
