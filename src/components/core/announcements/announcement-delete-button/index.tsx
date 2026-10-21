'use client';

import { Button, Dialog, Portal, Text } from '@chakra-ui/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toaster } from '@/components/ui/toaster';
import { tKeys } from '@/localization/tKeys';
import { deleteAnnouncement } from '@/services/announcements';

interface AnnouncementDeleteButtonProps {
  id: string;
}

export default function AnnouncementDeleteButton({
  id,
}: AnnouncementDeleteButtonProps) {
  const t = useTranslations();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);

  const mutation = useMutation({
    mutationFn: () => deleteAnnouncement(id),
    onSuccess: (result) => {
      if (!result.ok) {
        toaster.create({
          title: t(tKeys.announcements.deleteError),
          type: 'error',
        });
        return;
      }
      toaster.create({
        title: t(tKeys.announcements.deleteSuccess),
        type: 'success',
      });
      setIsOpen(false);
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
    },
    onError: () => {
      toaster.create({
        title: t(tKeys.announcements.deleteError),
        type: 'error',
      });
    },
  });

  return (
    <Dialog.Root open={isOpen} onOpenChange={(e) => setIsOpen(e.open)}>
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        colorPalette="red"
        size="sm"
      >
        {t(tKeys.announcements.deleteConfirmButton)}
      </Button>

      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>
                {t(tKeys.announcements.deleteConfirmTitle)}
              </Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <Text>{t(tKeys.announcements.deleteConfirmDescription)}</Text>
            </Dialog.Body>
            <Dialog.Footer>
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                {t(tKeys.announcements.deleteCancel)}
              </Button>
              <Button
                colorPalette="red"
                loading={mutation.isPending}
                onClick={() => mutation.mutate()}
              >
                {t(tKeys.announcements.deleteConfirmButton)}
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
