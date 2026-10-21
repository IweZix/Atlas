'use client';

import { Box, Flex, Stack, Text } from '@chakra-ui/react';
import { useLocale, useTranslations } from 'next-intl';
import type { AdminUser } from '@/lib/supabase/list-users';
import { tKeys } from '@/localization/tKeys';

function getInitials(user: AdminUser): string {
  if (user.firstName || user.lastName) {
    return (
      `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase() ||
      '?'
    );
  }
  return user.email?.[0]?.toUpperCase() ?? '?';
}

export default function ProfileCard({ user }: { user: AdminUser }) {
  const t = useTranslations();
  const locale = useLocale();

  const displayName = user.fullName ?? user.email ?? '';
  const createdAt = user.createdAt
    ? t(tKeys.users.detail.createdAt, {
        date: new Date(user.createdAt).toLocaleDateString(locale),
      })
    : undefined;
  const lastSignIn = user.lastSignInAt
    ? t(tKeys.users.detail.lastSignIn, {
        date: new Date(user.lastSignInAt).toLocaleDateString(locale),
      })
    : t(tKeys.users.detail.neverSignedIn);

  return (
    <Box w="full" borderWidth="1px" borderColor="gray.200" rounded="lg" p={5}>
      <Flex align="center" gap={3} mb={4}>
        <Flex
          w="48px"
          h="48px"
          rounded="md"
          bg="red.500"
          color="white"
          align="center"
          justify="center"
          fontWeight="bold"
          flexShrink={0}
        >
          {getInitials(user)}
        </Flex>
        <Stack gap={0}>
          <Text fontWeight="bold">{displayName}</Text>
          {user.role && (
            <Text fontSize="sm" color="fg.muted">
              {t(tKeys.users.detail.roles[user.role].label)}
            </Text>
          )}
        </Stack>
      </Flex>

      <Stack gap={2} pt={4} borderTopWidth="1px" fontSize="sm" color="fg.muted">
        {createdAt && <Text>{createdAt}</Text>}
        <Text>{lastSignIn}</Text>
        <Flex align="center" gap={2}>
          <Box
            w="8px"
            h="8px"
            rounded="full"
            bg={user.isActive ? 'green.500' : 'gray.400'}
          />
          <Text>
            {user.isActive
              ? t(tKeys.users.detail.active)
              : t(tKeys.users.detail.inactive)}
          </Text>
        </Flex>
      </Stack>
    </Box>
  );
}
