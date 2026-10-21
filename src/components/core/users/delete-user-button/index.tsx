'use client';

import { Button, Dialog, Input, Portal, Stack, Text } from '@chakra-ui/react';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { toaster } from '@/components/ui/toaster';
import { tKeys } from '@/localization/tKeys';
import { deleteUser } from '@/services/users';

interface DeleteUserButtonProps {
  userId: string;
  email?: string;
  disabled?: boolean;
}

export default function DeleteUserButton({
  userId,
  email,
  disabled,
}: DeleteUserButtonProps) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState('');

  const mutation = useMutation({
    mutationFn: () => deleteUser(userId),
    onSuccess: () => {
      toaster.create({
        title: t(tKeys.users.detail.deleteSuccess),
        type: 'success',
      });
      router.push(`/${locale}/dashboard/users`);
    },
    onError: () => {
      toaster.create({
        title: t(tKeys.users.detail.deleteError),
        type: 'error',
      });
    },
  });

  return (
    <Dialog.Root open={isOpen} onOpenChange={(e) => setIsOpen(e.open)}>
      <Button
        onClick={() => setIsOpen(true)}
        disabled={disabled}
        variant="outline"
        colorPalette="red"
        w="full"
      >
        {t(tKeys.users.detail.delete)}
      </Button>

      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>
                {t(tKeys.users.detail.deleteConfirmTitle)}
              </Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <Stack gap={3}>
                <Text>{t(tKeys.users.detail.deleteConfirmDescription)}</Text>
                <Input
                  placeholder={t(tKeys.users.detail.deleteConfirmPlaceholder)}
                  value={confirmEmail}
                  onChange={(e) => setConfirmEmail(e.target.value)}
                />
              </Stack>
            </Dialog.Body>
            <Dialog.Footer>
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                {t(tKeys.users.detail.deleteCancel)}
              </Button>
              <Button
                colorPalette="red"
                disabled={confirmEmail !== email}
                loading={mutation.isPending}
                onClick={() => mutation.mutate()}
              >
                {t(tKeys.users.detail.deleteConfirmButton)}
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
