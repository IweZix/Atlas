'use client';

import {
  Box,
  Button,
  Heading,
  SimpleGrid,
  Spinner,
  Stack,
  Tabs,
  Text,
} from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { notFound, useParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import GoBackButton from '@/components/core/go-back-button';
import AuditHistory from '@/components/core/journal/audit-history';
import ProfileCard from '@/components/core/users/profile-card';
import type { AdminUser } from '@/lib/supabase/list-users';
import { tKeys } from '@/localization/tKeys';
import { getUser } from '@/services/users';

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Text
      fontFamily="mono"
      fontSize="xs"
      letterSpacing="wider"
      textTransform="uppercase"
      color="fg.muted"
      pb={3}
      mb={3}
      borderBottomWidth="1px"
    >
      {children}
    </Text>
  );
}

function ReadOnlyField({ label, value }: { label: string; value?: string }) {
  const t = useTranslations();
  return (
    <Stack gap={1}>
      <Text fontSize="sm" color="fg.muted">
        {label}
      </Text>
      <Text>{value || t(tKeys.users.detail.notProvided)}</Text>
    </Stack>
  );
}

function UserInfo({ user }: { user: AdminUser }) {
  const t = useTranslations();

  return (
    <Stack gap={6} direction={{ base: 'column', lg: 'row' }} align="flex-start">
      <Stack gap={6} flex="2" w="full">
        <Box borderWidth="1px" borderColor="gray.200" rounded="lg" p={5}>
          <SectionLabel>{t(tKeys.users.detail.identityTitle)}</SectionLabel>
          <Stack gap={4}>
            <SimpleGrid columns={{ base: 1, sm: 2 }} gap={4}>
              <ReadOnlyField
                label={t(tKeys.users.detail.firstNameLabel)}
                value={user.firstName}
              />
              <ReadOnlyField
                label={t(tKeys.users.detail.lastNameLabel)}
                value={user.lastName}
              />
            </SimpleGrid>
            <ReadOnlyField
              label={t(tKeys.users.detail.emailLabel)}
              value={user.email}
            />
          </Stack>
        </Box>
      </Stack>

      <Stack flex="1" w="full">
        <ProfileCard user={user} />
      </Stack>
    </Stack>
  );
}

export default function UserDetailPage() {
  const t = useTranslations();
  const locale = useLocale();
  const { userId } = useParams<{ userId: string }>();

  const { data, isPending, isError, error } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => getUser(userId),
  });

  if (isPending) {
    return <Spinner />;
  }

  if (isError) {
    if (error instanceof Error && error.message === 'not_found') {
      notFound();
    }
    if (error instanceof Error && error.message === 'forbidden') {
      return <Text>{t(tKeys.users.accessDenied)}</Text>;
    }
    return <Text>{t(tKeys.users.detail.loadError)}</Text>;
  }

  const { user } = data;
  const displayName = user.fullName ?? user.email ?? '';

  return (
    <Stack gap={6}>
      <GoBackButton href={`/${locale}/dashboard/users`} />

      <Stack
        direction="row"
        justify="space-between"
        align="center"
        wrap="wrap"
        gap={4}
      >
        <Heading size="2xl">{displayName}</Heading>
        <Button
          asChild
          colorPalette="gray"
          bg="black"
          color="white"
          _hover={{ bg: 'gray.800' }}
        >
          <Link href={`/${locale}/dashboard/users/${user.id}/update`}>
            {t(tKeys.users.detail.editButton)}
          </Link>
        </Button>
      </Stack>

      <Tabs.Root defaultValue="info">
        <Tabs.List>
          <Tabs.Trigger value="info">
            {t(tKeys.users.detail.tabs.info)}
          </Tabs.Trigger>
          <Tabs.Trigger value="history">
            {t(tKeys.users.detail.tabs.history)}
          </Tabs.Trigger>
          <Tabs.Trigger value="logs">
            {t(tKeys.users.detail.tabs.logs)}
          </Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="info">
          <UserInfo user={user} />
        </Tabs.Content>
        <Tabs.Content value="history">
          <AuditHistory tableName="users" recordId={user.id} />
        </Tabs.Content>
        <Tabs.Content value="logs">
          <AuditHistory userId={user.id} />
        </Tabs.Content>
      </Tabs.Root>
    </Stack>
  );
}
