'use client';

import { useMutation } from '@tanstack/react-query';
import { useLocale } from 'next-intl';
import { useTheme } from 'next-themes';
import { useEffect, useRef } from 'react';
import type { Theme } from '@/lib/preferences';
import { updatePreferences } from '@/services/preferences';
import type { Locale } from '@/types/Locale';

interface PreferencesSyncProps {
  locale: Locale;
  theme: Theme;
  neverCustomized: boolean;
}

/**
 * Silent, mount-only reconciliation between the DB row and this browser.
 *
 * - locale: only acts while the row was never customized — the URL locale
 *   the user is actually on wins, once. The opposite direction (DB wins once
 *   customized) is handled server-side, by the middleware (src/proxy.ts).
 * - theme: never-customized -> the client's pre-existing next-themes value
 *   (its own localStorage) wins, once. Already customized -> DB wins.
 */
export default function PreferencesSync({
  locale,
  theme,
  neverCustomized,
}: PreferencesSyncProps) {
  const urlLocale = useLocale();
  const { theme: clientTheme, setTheme } = useTheme();
  const hasSyncedTheme = useRef(false);
  const mutation = useMutation({ mutationFn: updatePreferences });

  useEffect(() => {
    if (!neverCustomized || urlLocale === locale) return;
    mutation.mutate({ locale: urlLocale as Locale });
  }, [neverCustomized, urlLocale, locale, mutation.mutate]);

  useEffect(() => {
    if (hasSyncedTheme.current || clientTheme === undefined) return;
    hasSyncedTheme.current = true;
    if (clientTheme === theme) return;

    if (neverCustomized) {
      mutation.mutate({ theme: clientTheme as Theme });
    } else {
      setTheme(theme);
    }
  }, [neverCustomized, clientTheme, theme, mutation.mutate, setTheme]);

  return null;
}
