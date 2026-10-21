'use client';

import {
  Card,
  createListCollection,
  Portal,
  SegmentGroup,
  Select,
  Stack,
  Text,
} from '@chakra-ui/react';
import { useMutation } from '@tanstack/react-query';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import { useState } from 'react';
import { toaster } from '@/components/ui/toaster';
import type { Theme } from '@/lib/preferences';
import { tKeys } from '@/localization/tKeys';
import { updatePreferences } from '@/services/preferences';
import { Locale } from '@/types/Locale';

interface PreferencesFormProps {
  initialLocale: Locale;
  initialTheme: Theme;
}

export default function PreferencesForm({
  initialLocale,
  initialTheme,
}: PreferencesFormProps) {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const { setTheme } = useTheme();
  const [selectedLocale, setSelectedLocale] = useState<Locale>(initialLocale);
  const [selectedTheme, setSelectedTheme] = useState<Theme>(initialTheme);

  const localeOptions = createListCollection({
    items: [
      { label: t(tKeys.settings.language.options.fr), value: Locale.FR },
      { label: t(tKeys.settings.language.options.en), value: Locale.EN },
    ],
  });

  const themeOptions = [
    { value: 'light', label: t(tKeys.settings.theme.options.light) },
    { value: 'dark', label: t(tKeys.settings.theme.options.dark) },
    { value: 'system', label: t(tKeys.settings.theme.options.system) },
  ];

  const mutation = useMutation({
    mutationFn: updatePreferences,
    onSuccess: (result) => {
      if (!result.ok) {
        toaster.create({
          title: t(tKeys.settings.updateError),
          type: 'error',
        });
      }
    },
    onError: () => {
      toaster.create({ title: t(tKeys.settings.updateError), type: 'error' });
    },
  });

  const handleLocaleChange = (nextLocale: Locale) => {
    setSelectedLocale(nextLocale);
    mutation.mutate({ locale: nextLocale });
    const segments = pathname.split('/');
    segments[1] = nextLocale;
    router.push(segments.join('/'));
  };

  const handleThemeChange = (nextTheme: Theme) => {
    setSelectedTheme(nextTheme);
    setTheme(nextTheme);
    mutation.mutate({ theme: nextTheme });
  };

  return (
    <Card.Root>
      <Card.Body>
        <Stack gap={6}>
          <Stack gap={2}>
            <Text fontWeight="semibold">
              {t(tKeys.settings.language.label)}
            </Text>
            <Text fontSize="sm" color="fg.muted">
              {t(tKeys.settings.language.description)}
            </Text>
            <Select.Root
              collection={localeOptions}
              value={[selectedLocale]}
              onValueChange={(details) =>
                handleLocaleChange(details.value[0] as Locale)
              }
              maxW="240px"
            >
              <Select.HiddenSelect />
              <Select.Control>
                <Select.Trigger>
                  <Select.ValueText />
                </Select.Trigger>
                <Select.IndicatorGroup>
                  <Select.Indicator />
                </Select.IndicatorGroup>
              </Select.Control>
              <Portal>
                <Select.Positioner>
                  <Select.Content>
                    {localeOptions.items.map((item) => (
                      <Select.Item item={item} key={item.value}>
                        {item.label}
                        <Select.ItemIndicator />
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Positioner>
              </Portal>
            </Select.Root>
          </Stack>

          <Stack gap={2}>
            <Text fontWeight="semibold">{t(tKeys.settings.theme.label)}</Text>
            <Text fontSize="sm" color="fg.muted">
              {t(tKeys.settings.theme.description)}
            </Text>
            <SegmentGroup.Root
              value={selectedTheme}
              onValueChange={(details) =>
                handleThemeChange(details.value as Theme)
              }
              maxW="320px"
            >
              <SegmentGroup.Indicator />
              <SegmentGroup.Items items={themeOptions} />
            </SegmentGroup.Root>
          </Stack>
        </Stack>
      </Card.Body>
    </Card.Root>
  );
}
