import { Button, Stack, Text } from '@chakra-ui/react';
import { getLocale, getTranslations } from 'next-intl/server';
import GoBackButton from '@/components/core/go-back-button';
import PageHeader from '@/components/core/page-header';
import { ALL_FEATURES, type Feature } from '@/lib/features';
import { tKeys } from '@/localization/tKeys';

interface UpgradePageProps {
  searchParams: Promise<{ feature?: string }>;
}

function isKnownFeature(value: string | undefined): value is Feature {
  return ALL_FEATURES.includes(value as Feature);
}

export default async function UpgradePage({ searchParams }: UpgradePageProps) {
  const t = await getTranslations();
  const locale = await getLocale();
  const { feature: rawFeature } = await searchParams;
  const feature = isKnownFeature(rawFeature) ? rawFeature : undefined;

  const body = feature
    ? t(tKeys.upgrade.features[feature].body)
    : t(tKeys.upgrade.body);

  return (
    <Stack gap={4}>
      <PageHeader title={t(tKeys.upgrade.title)} />
      <Text>{body}</Text>
      <Button asChild alignSelf="flex-start">
        <a href={`mailto:${process.env.CONTACT_EMAIL}`}>
          {t(tKeys.upgrade.contactButton)}
        </a>
      </Button>
      <GoBackButton href={`/${locale}/dashboard`} />
    </Stack>
  );
}
