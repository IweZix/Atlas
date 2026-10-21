'use client';

import { usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import type { ReactNode } from 'react';

/** Renders children everywhere except under /dashboard. */
export default function PublicOnly({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const locale = useLocale();

  if (pathname.startsWith(`/${locale}/dashboard`)) return null;

  return <>{children}</>;
}
