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
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { useState } from 'react';
import DeleteUserButton from '@/components/core/users/delete-user-button';
import ResetPasswordButton from '@/components/core/users/reset-password-button';
import ToggleActiveButton from '@/components/core/users/toggle-active-button';
import { toaster } from '@/components/ui/toaster';
import { tKeys } from '@/localization/tKeys';
import { updateUser } from '@/services/users';
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

interface UserEditFormProps {
  userId: string;
  email?: string;
  initialFirstName?: string;
  initialLastName?: string;
  initialRole: Role | null;
  isOwnAccount: boolean;
  isActive: boolean;
  profileCard: ReactNode;
}

export default function UserEditForm({
  userId,
  email,
  initialFirstName,
  initialLastName,
  initialRole,
  isOwnAccount,
  isActive,
  profileCard,
}: UserEditFormProps) {
  const t = useTranslations();
  const queryClient = useQueryClient();
  const [firstName, setFirstName] = useState(initialFirstName ?? '');
  const [lastName, setLastName] = useState(initialLastName ?? '');
  const [role, setRole] = useState<Role>(initialRole ?? Role.USER);

  const mutation = useMutation({
    mutationFn: () => updateUser(userId, { firstName, lastName, role }),
    onSuccess: () => {
      toaster.create({
        title: t(tKeys.users.detail.saveSuccess),
        type: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['user', userId] });
    },
    onError: () => {
      toaster.create({ title: t(tKeys.users.detail.saveError), type: 'error' });
    },
  });

  return (
    <Flex gap={6} direction={{ base: 'column', lg: 'row' }} align="flex-start">
      <Stack gap={6} flex="2" w="full">
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
              <Box
                bg="gray.50"
                borderWidth="1px"
                borderColor="gray.200"
                rounded="md"
                px={3}
                py={2}
              >
                <Text color="fg.muted">{email}</Text>
              </Box>
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
                  onClick={isOwnAccount ? undefined : () => setRole(roleOption)}
                  align="flex-start"
                  gap={3}
                  p={4}
                  borderWidth="1px"
                  borderColor={isSelected ? 'red.500' : 'gray.200'}
                  bg={isSelected ? 'red.50' : undefined}
                  rounded="md"
                  cursor={isOwnAccount ? 'not-allowed' : 'pointer'}
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
          {isOwnAccount && (
            <Text fontSize="xs" color="fg.muted" pt={3}>
              {t(tKeys.users.detail.cannotChangeOwnRole)}
            </Text>
          )}
        </Box>
      </Stack>

      <Stack flex="1" w="full" gap={4}>
        {profileCard}
        <Button
          onClick={() => mutation.mutate()}
          loading={mutation.isPending}
          colorPalette="gray"
          bg="black"
          color="white"
          _hover={{ bg: 'gray.800' }}
          w="full"
        >
          {t(tKeys.users.detail.save)}
        </Button>
        <ResetPasswordButton userId={userId} email={email} />
        <ToggleActiveButton
          userId={userId}
          isActive={isActive}
          disabled={isOwnAccount}
        />
        <DeleteUserButton
          userId={userId}
          email={email}
          disabled={isOwnAccount}
        />
      </Stack>
    </Flex>
  );
}
