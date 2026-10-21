'use client';

import {
  Box,
  Button,
  Flex,
  Input,
  SimpleGrid,
  Stack,
  Text,
} from '@chakra-ui/react';
import { useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { toaster } from '@/components/ui/toaster';
import { tKeys } from '@/localization/tKeys';
import { createUser } from '@/services/users';
import { Role } from '@/types/Role';

const ROLE_ORDER = [Role.ADMIN, Role.MANAGER, Role.USER];

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

export default function UserCreateForm() {
  const t = useTranslations();
  const locale = useLocale();
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState<Role>(Role.USER);
  const [copied, setCopied] = useState(false);

  const mutation = useMutation({
    mutationFn: () => createUser({ email, firstName, lastName, role }),
    onError: () => {
      toaster.create({
        title: t(tKeys.users.create.createError),
        type: 'error',
      });
    },
  });

  if (mutation.isSuccess) {
    const { user, temporaryPassword } = mutation.data;

    return (
      <Box borderWidth="1px" borderColor="gray.200" rounded="lg" p={5}>
        <SectionLabel>{t(tKeys.users.create.successTitle)}</SectionLabel>
        <Stack gap={4}>
          <Text>{email}</Text>
          <Stack gap={1}>
            <Text fontSize="sm" color="fg.muted">
              {t(tKeys.users.create.temporaryPasswordLabel)}
            </Text>
            <Flex
              align="center"
              justify="space-between"
              gap={3}
              bg="gray.50"
              borderWidth="1px"
              borderColor="gray.200"
              rounded="md"
              px={3}
              py={2}
            >
              <Text fontFamily="mono">{temporaryPassword}</Text>
              <Button
                size="xs"
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(temporaryPassword);
                  setCopied(true);
                }}
              >
                {copied
                  ? t(tKeys.users.create.copied)
                  : t(tKeys.users.create.copy)}
              </Button>
            </Flex>
          </Stack>
          <Button asChild colorPalette="red" alignSelf="flex-start">
            <Link href={`/${locale}/dashboard/users/${user.id}`}>
              {t(tKeys.users.create.viewUser)}
            </Link>
          </Button>
        </Stack>
      </Box>
    );
  }

  return (
    <Stack gap={6}>
      <Box borderWidth="1px" borderColor="gray.200" rounded="lg" p={5}>
        <SectionLabel>{t(tKeys.users.detail.identityTitle)}</SectionLabel>
        <Stack gap={4}>
          <SimpleGrid columns={{ base: 1, sm: 2 }} gap={4}>
            <Stack gap={1}>
              <Text fontSize="sm" color="fg.muted">
                {t(tKeys.users.detail.firstNameLabel)}
              </Text>
              <Input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </Stack>
            <Stack gap={1}>
              <Text fontSize="sm" color="fg.muted">
                {t(tKeys.users.detail.lastNameLabel)}
              </Text>
              <Input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </Stack>
          </SimpleGrid>
          <Stack gap={1}>
            <Text fontSize="sm" color="fg.muted">
              {t(tKeys.users.detail.emailLabel)}
            </Text>
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Stack>
        </Stack>
      </Box>

      <Box borderWidth="1px" borderColor="gray.200" rounded="lg" p={5}>
        <SectionLabel>{t(tKeys.users.detail.roleTitle)}</SectionLabel>
        <Stack gap={3}>
          {ROLE_ORDER.map((roleOption) => {
            const isSelected = role === roleOption;

            return (
              <Flex
                key={roleOption}
                onClick={() => setRole(roleOption)}
                align="flex-start"
                gap={3}
                p={4}
                borderWidth="1px"
                borderColor={isSelected ? 'red.500' : 'gray.200'}
                bg={isSelected ? 'red.50' : undefined}
                rounded="md"
                cursor="pointer"
              >
                <Box
                  mt="6px"
                  w="8px"
                  h="8px"
                  rounded="full"
                  bg={isSelected ? 'red.500' : 'gray.300'}
                  flexShrink={0}
                />
                <Stack gap={0}>
                  <Text fontWeight="bold">
                    {t(tKeys.users.detail.roles[roleOption].label)}
                  </Text>
                  <Text fontSize="sm" color="fg.muted">
                    {t(tKeys.users.detail.roles[roleOption].description)}
                  </Text>
                </Stack>
              </Flex>
            );
          })}
        </Stack>
      </Box>

      <Button
        onClick={() => mutation.mutate()}
        loading={mutation.isPending}
        disabled={!email}
        colorPalette="red"
        alignSelf="flex-start"
      >
        {t(tKeys.users.create.submit)}
      </Button>
    </Stack>
  );
}
