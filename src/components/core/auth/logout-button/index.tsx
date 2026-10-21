'use client';

import { Button, IconButton } from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { LuLogOut } from 'react-icons/lu';
import { tKeys } from '@/localization/tKeys';
import { logout } from '@/services/auth';

interface LogoutButtonProps {
  isCollapsed?: boolean;
}

export default function LogoutButton({ isCollapsed }: LogoutButtonProps) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    await logout();
    router.push(`/${locale}/login`);
    router.refresh();
  };

  if (isCollapsed) {
    return (
      <IconButton
        aria-label={t(tKeys.dashboard.logout)}
        onClick={handleLogout}
        loading={isLoading}
        variant="outline"
      >
        <LuLogOut />
      </IconButton>
    );
  }

  return (
    <Button onClick={handleLogout} loading={isLoading} variant="outline">
      {t(tKeys.dashboard.logout)}
    </Button>
  );
}
