'use client';

import {
  Box,
  Button,
  Flex,
  Input,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
} from '@chakra-ui/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { AnnouncementBannerView } from '@/components/core/banners/announcement-banner/view';
import { toaster } from '@/components/ui/toaster';
import {
  utcToEndDateInputValue,
  utcToStartDateInputValue,
} from '@/lib/announcements/dates';
import type { Announcement } from '@/lib/announcements/repository';
import type { AnnouncementFormValues } from '@/lib/announcements/schema';
import { tKeys } from '@/localization/tKeys';
import {
  createAnnouncement,
  updateAnnouncement,
} from '@/services/announcements';
import type { AnnouncementVariant } from '@/types/Announcement';

const VARIANT_ORDER: AnnouncementVariant[] = ['info', 'promo', 'alerte'];
const MESSAGE_MAX_LENGTH = 160;

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

interface AnnouncementFormProps {
  mode: 'create' | 'edit';
  announcement?: Announcement;
}

export default function AnnouncementForm({
  mode,
  announcement,
}: AnnouncementFormProps) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [message, setMessage] = useState(announcement?.message ?? '');
  const [linkUrl, setLinkUrl] = useState(announcement?.linkUrl ?? '');
  const [linkLabel, setLinkLabel] = useState(announcement?.linkLabel ?? '');
  const [variant, setVariant] = useState<AnnouncementVariant>(
    announcement?.variant ?? 'info',
  );
  const [startsAt, setStartsAt] = useState(
    announcement?.startsAt
      ? utcToStartDateInputValue(announcement.startsAt)
      : '',
  );
  const [endsAt, setEndsAt] = useState(
    announcement?.endsAt ? utcToEndDateInputValue(announcement.endsAt) : '',
  );
  const [isActive, setIsActive] = useState(announcement?.isActive ?? false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const values: AnnouncementFormValues = {
    message,
    linkUrl: linkUrl || null,
    linkLabel: linkLabel || null,
    variant,
    startsAt: startsAt || null,
    endsAt: endsAt || null,
    isActive,
  };

  const mutation = useMutation({
    mutationFn: () =>
      mode === 'create'
        ? createAnnouncement(values)
        : updateAnnouncement(announcement?.id as string, values),
    onSuccess: (result) => {
      if (!result.ok) {
        setErrors(result.errors);
        if (result.errors._form) {
          const [code] = result.errors._form;
          toaster.create({
            title: t(
              tKeys.announcements.form.errors[
                code as keyof typeof tKeys.announcements.form.errors
              ] ?? tKeys.announcements.form.errors.unexpected_error,
            ),
            type: 'error',
          });
        }
        return;
      }

      setErrors({});
      toaster.create({
        title: t(
          mode === 'create'
            ? tKeys.announcements.form.createSuccess
            : tKeys.announcements.form.saveSuccess,
        ),
        type: 'success',
      });

      if (mode === 'create') {
        router.push(`/${locale}/dashboard/annonces`);
      } else {
        queryClient.invalidateQueries({
          queryKey: ['announcement', announcement?.id],
        });
      }
    },
  });

  function fieldError(field: string): string | undefined {
    const [code] = errors[field] ?? [];
    if (!code) return undefined;
    return t(
      tKeys.announcements.form.errors[
        code as keyof typeof tKeys.announcements.form.errors
      ] ?? tKeys.announcements.form.errors.unexpected_error,
    );
  }

  return (
    <Flex gap={6} direction={{ base: 'column', lg: 'row' }} align="flex-start">
      <Stack gap={6} flex="2" w="full">
        <Box borderWidth="1px" borderColor="gray.200" rounded="lg" p={5}>
          <SectionLabel>
            {t(tKeys.announcements.form.messageLabel)}
          </SectionLabel>
          <Stack gap={1}>
            <Textarea
              value={message}
              maxLength={MESSAGE_MAX_LENGTH}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
            />
            <Flex justify="space-between">
              <Text fontSize="xs" color="red.500">
                {fieldError('message')}
              </Text>
              <Text fontSize="xs" color="fg.muted">
                {t(tKeys.announcements.form.messageCounter, {
                  count: message.length,
                })}
              </Text>
            </Flex>
          </Stack>
        </Box>

        <Box borderWidth="1px" borderColor="gray.200" rounded="lg" p={5}>
          <SectionLabel>
            {t(tKeys.announcements.form.linkUrlLabel)}
          </SectionLabel>
          <SimpleGrid columns={{ base: 1, sm: 2 }} gap={4}>
            <Stack gap={1}>
              <Text fontSize="sm" color="fg.muted">
                {t(tKeys.announcements.form.linkUrlLabel)}
              </Text>
              <Input
                value={linkUrl}
                placeholder="https://... ou /promo"
                onChange={(e) => setLinkUrl(e.target.value)}
              />
              <Text fontSize="xs" color="red.500">
                {fieldError('linkUrl')}
              </Text>
            </Stack>
            <Stack gap={1}>
              <Text fontSize="sm" color="fg.muted">
                {t(tKeys.announcements.form.linkLabelLabel)}
              </Text>
              <Input
                value={linkLabel}
                onChange={(e) => setLinkLabel(e.target.value)}
              />
              <Text fontSize="xs" color="red.500">
                {fieldError('linkLabel')}
              </Text>
            </Stack>
          </SimpleGrid>
        </Box>

        <Box borderWidth="1px" borderColor="gray.200" rounded="lg" p={5}>
          <SectionLabel>
            {t(tKeys.announcements.form.variantLabel)}
          </SectionLabel>
          <Flex gap={2}>
            {VARIANT_ORDER.map((variantOption) => (
              <Button
                key={variantOption}
                size="sm"
                variant={variant === variantOption ? 'solid' : 'outline'}
                onClick={() => setVariant(variantOption)}
              >
                {t(tKeys.announcements.form.variant[variantOption])}
              </Button>
            ))}
          </Flex>
        </Box>

        <Box borderWidth="1px" borderColor="gray.200" rounded="lg" p={5}>
          <SectionLabel>
            {t(tKeys.announcements.form.startsAtLabel)}
          </SectionLabel>
          <SimpleGrid columns={{ base: 1, sm: 2 }} gap={4}>
            <Stack gap={1}>
              <Text fontSize="sm" color="fg.muted">
                {t(tKeys.announcements.form.startsAtLabel)}
              </Text>
              <Input
                type="date"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
              />
            </Stack>
            <Stack gap={1}>
              <Text fontSize="sm" color="fg.muted">
                {t(tKeys.announcements.form.endsAtLabel)}
              </Text>
              <Input
                type="date"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
              />
              <Text fontSize="xs" color="red.500">
                {fieldError('endsAt')}
              </Text>
            </Stack>
          </SimpleGrid>
          <Text fontSize="xs" color="fg.muted" pt={2}>
            {t(tKeys.announcements.form.dateHelp)}
          </Text>
        </Box>

        <Flex
          align="center"
          justify="space-between"
          borderWidth="1px"
          borderColor="gray.200"
          rounded="lg"
          p={5}
        >
          <Text fontWeight="medium">
            {t(tKeys.announcements.form.isActiveLabel)}
          </Text>
          <Button
            onClick={() => setIsActive((prev) => !prev)}
            variant="outline"
          >
            {isActive
              ? t(tKeys.announcements.toggleOff)
              : t(tKeys.announcements.toggleOn)}
          </Button>
        </Flex>
      </Stack>

      <Stack flex="1" w="full" gap={4} position="sticky" top={4}>
        <SectionLabel>{t(tKeys.announcements.form.previewTitle)}</SectionLabel>
        <Box
          borderWidth="1px"
          borderColor="gray.200"
          rounded="lg"
          overflow="hidden"
        >
          <AnnouncementBannerView
            message={message || t(tKeys.announcements.form.messageLabel)}
            variant={variant}
            linkUrl={linkUrl || null}
            linkLabel={linkLabel || null}
            ariaLabel={t(tKeys.announcements.public.ariaLabel)}
          />
        </Box>

        <Button
          onClick={() => mutation.mutate()}
          loading={mutation.isPending}
          disabled={!message}
          colorPalette="gray"
          bg="black"
          color="white"
          _hover={{ bg: 'gray.800' }}
          w="full"
        >
          {t(
            mode === 'create'
              ? tKeys.announcements.form.submitCreate
              : tKeys.announcements.form.submitEdit,
          )}
        </Button>
      </Stack>
    </Flex>
  );
}
