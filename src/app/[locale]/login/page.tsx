'use client';

import { Button, Field, Heading, Input, Stack, Text } from '@chakra-ui/react';
import { useMutation } from '@tanstack/react-query';
import { useFormik } from 'formik';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { tKeys } from '@/localization/tKeys';
import { login } from '@/services/auth';
import { loginSchema } from '@/utils/validations/login-schema';

export default function Login() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const [loginError, setLoginError] = useState(false);

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: () => {
      setLoginError(false);
      router.push(`/${locale}/dashboard`);
    },
    onError: () => {
      setLoginError(true);
    },
  });

  const onSubmit = async (values: { email: string; password: string }) => {
    setLoginError(false);
    mutation.mutate(values);
  };

  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
    },
    onSubmit: onSubmit,
    validationSchema: loginSchema(t),
  });

  return (
    <form onSubmit={formik.handleSubmit}>
      <Stack maxW="sm" mx="auto" mt={16} gap={4}>
        <Heading size="lg">{t(tKeys.login.title)}</Heading>

        <Field.Root invalid={!!formik.errors.email && formik.touched.email}>
          <Field.Label>{t(tKeys.login.emailLabel)}</Field.Label>
          <Input
            name="email"
            type="email"
            value={formik.values.email}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
          />
          <Field.ErrorText>{formik.errors.email}</Field.ErrorText>
        </Field.Root>

        <Field.Root
          invalid={!!formik.errors.password && formik.touched.password}
        >
          <Field.Label>{t(tKeys.login.passwordLabel)}</Field.Label>
          <Input
            name="password"
            type="password"
            value={formik.values.password}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
          />
          <Field.ErrorText>{formik.errors.password}</Field.ErrorText>
        </Field.Root>

        {loginError && (
          <Text color="red.500">{t(tKeys.login.invalidCredentials)}</Text>
        )}

        <Button type="submit" loading={mutation.isPending}>
          {t(tKeys.login.submit)}
        </Button>
      </Stack>
    </form>
  );
}
