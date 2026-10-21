import { Stack, Text } from '@chakra-ui/react';
import { getTranslations } from 'next-intl/server';
import PageHeader from '@/components/core/page-header';
import { getCurrentUser } from '@/lib/supabase/current-user';
import { getUserMetadata } from '@/lib/supabase/user-metadata';
import { tKeys } from '@/localization/tKeys';

export default async function Dashboard() {
  const t = await getTranslations();
  const user = await getCurrentUser();
  const userMetadata = getUserMetadata(user);

  return (
    <Stack gap={4}>
      <PageHeader title={t(tKeys.dashboard.title)} />
      <Text>
        {t(tKeys.dashboard.welcome, {
          email: `${userMetadata.firstName} ${userMetadata.lastName}`,
        })}
      </Text>
    </Stack>
  );
}
