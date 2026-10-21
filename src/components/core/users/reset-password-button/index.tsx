'use client';

import { Button } from '@chakra-ui/react';
import { useMutation } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import { toaster } from '@/components/ui/toaster';
import { tKeys } from '@/localization/tKeys';
import { sendPasswordReset } from '@/services/users';

interface ResetPasswordButtonProps {
  userId: string;
  email?: string;
}

export default function ResetPasswordButton({
  userId,
  email,
}: ResetPasswordButtonProps) {
  const t = useTranslations();
  const locale = useLocale();

  const mutation = useMutation({
    mutationFn: () => sendPasswordReset(userId, email ?? '', locale),
    onSuccess: () => {
      toaster.create({
        title: t(tKeys.users.detail.resetPasswordSuccess),
        type: 'success',
      });
    },
    onError: () => {
      toaster.create({
        title: t(tKeys.users.detail.resetPasswordError),
        type: 'error',
      });
    },
  });

  return (
    <Button
      onClick={() => mutation.mutate()}
      loading={mutation.isPending}
      disabled={!email}
      variant="outline"
      w="full"
    >
      {t(tKeys.users.detail.resetPassword)}
    </Button>
  );
}
