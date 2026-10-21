'use client';

import { Button } from '@chakra-ui/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { toaster } from '@/components/ui/toaster';
import { tKeys } from '@/localization/tKeys';
import { toggleAnnouncement } from '@/services/announcements';

interface AnnouncementToggleButtonProps {
  id: string;
  isActive: boolean;
}

export default function AnnouncementToggleButton({
  id,
  isActive,
}: AnnouncementToggleButtonProps) {
  const t = useTranslations();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => toggleAnnouncement(id, !isActive),
    onSuccess: (result) => {
      if (!result.ok) {
        toaster.create({
          title: t(tKeys.announcements.toggleError),
          type: 'error',
        });
        return;
      }
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
    },
    onError: () => {
      toaster.create({
        title: t(tKeys.announcements.toggleError),
        type: 'error',
      });
    },
  });

  return (
    <Button
      onClick={() => mutation.mutate()}
      loading={mutation.isPending}
      variant="outline"
      size="sm"
    >
      {isActive
        ? t(tKeys.announcements.toggleOff)
        : t(tKeys.announcements.toggleOn)}
    </Button>
  );
}
