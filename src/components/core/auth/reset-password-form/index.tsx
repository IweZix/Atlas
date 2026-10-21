'use client';

import { Button, Field, Input, Stack, Text } from '@chakra-ui/react';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { tKeys } from '@/localization/tKeys';

export default function ResetPasswordForm() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [tokens, setTokens] = useState<{
    accessToken: string;
    refreshToken: string;
  } | null>(null);
  const [invalidLink, setInvalidLink] = useState(false);

  useEffect(() => {
    // Recovery links use the implicit flow: the tokens live in the URL hash,
    // which never reaches the server — has to be read here, client-side.
    const params = new URLSearchParams(window.location.hash.slice(1));
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');

    if (accessToken && refreshToken) {
      setTokens({ accessToken, refreshToken });
    } else {
      setInvalidLink(true);
    }
  }, []);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!tokens) return;

      const response = await fetch('/api/auth/update-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...tokens, password }),
      });

      if (!response.ok) {
        throw new Error('update_failed');
      }
    },
    onSuccess: () => {
      router.push(`/${locale}/login`);
    },
  });

  if (invalidLink) {
    return (
      <Stack maxW="sm" mx="auto" mt={16}>
        <Text>{t(tKeys.resetPassword.invalidLink)}</Text>
      </Stack>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        mutation.mutate();
      }}
    >
      <Stack maxW="sm" mx="auto" mt={16} gap={4}>
        <Field.Root>
          <Field.Label>{t(tKeys.resetPassword.newPasswordLabel)}</Field.Label>
          <Input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field.Root>

        {mutation.isError && (
          <Text color="red.500">{t(tKeys.resetPassword.error)}</Text>
        )}

        <Button type="submit" loading={mutation.isPending} disabled={!tokens}>
          {t(tKeys.resetPassword.submit)}
        </Button>
      </Stack>
    </form>
  );
}
