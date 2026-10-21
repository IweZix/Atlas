'use client';

import { Button } from '@chakra-ui/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { toaster } from '@/components/ui/toaster';
import { tKeys } from '@/localization/tKeys';
import { setUserActive } from '@/services/users';

interface ToggleActiveButtonProps {
  userId: string;
  isActive: boolean;
  disabled?: boolean;
}

export default function ToggleActiveButton({
  userId,
  isActive,
  disabled,
}: ToggleActiveButtonProps) {
  const t = useTranslations();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => setUserActive(userId, !isActive),
    onSuccess: () => {
      toaster.create({
        title: t(tKeys.users.detail.statusSuccess),
        type: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['user', userId] });
    },
    onError: () => {
      toaster.create({
        title: t(tKeys.users.detail.statusError),
        type: 'error',
      });
    },
  });

  const handleClick = () => {
    if (isActive && !window.confirm(t(tKeys.users.detail.deactivateConfirm))) {
      return;
    }
    mutation.mutate();
  };

  return (
    <Button
      onClick={handleClick}
      loading={mutation.isPending}
      disabled={disabled}
      variant="outline"
      w="full"
    >
      {isActive
        ? t(tKeys.users.detail.deactivate)
        : t(tKeys.users.detail.reactivate)}
    </Button>
  );
}
