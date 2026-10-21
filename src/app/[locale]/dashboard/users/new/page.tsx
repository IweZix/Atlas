import { Heading, Stack, Text } from '@chakra-ui/react';
import { getLocale, getTranslations } from 'next-intl/server';
import GoBackButton from '@/components/core/go-back-button';
import UserCreateForm from '@/components/core/users/user-create-form';
import {
  assertCurrentUserIsAdmin,
  ForbiddenError,
} from '@/lib/supabase/list-users';
import { tKeys } from '@/localization/tKeys';

export default async function NewUser() {
  const t = await getTranslations();
  const locale = await getLocale();

  try {
    await assertCurrentUserIsAdmin();

    return (
      <Stack gap={6}>
        <GoBackButton href={`/${locale}/dashboard/users`} />
        <Heading size="lg">{t(tKeys.users.create.title)}</Heading>
        <UserCreateForm />
      </Stack>
    );
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return <Text>{t(tKeys.users.accessDenied)}</Text>;
    }
    throw error;
  }
}
