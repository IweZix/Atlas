import 'server-only';
import { cache } from 'react';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/supabase/current-user';
import { createClient } from '@/lib/supabase/server';
import { Locale } from '@/types/Locale';

export const THEMES = ['light', 'dark', 'system'] as const;
export type Theme = (typeof THEMES)[number];

export interface Preferences {
  locale: Locale;
  theme: Theme;
}

export const DEFAULT_PREFERENCES: Preferences = {
  locale: Locale.FR,
  theme: 'system',
};

export interface PreferencesSyncInfo extends Preferences {
  /** True when the row has never been explicitly updated since creation
   * (createdAt === updatedAt) — i.e. still at the trigger's auto-created
   * default. Drives PreferencesSync's one-time reconciliation. */
  neverCustomized: boolean;
}

export const preferencesUpdateSchema = z
  .object({
    locale: z.enum(['fr', 'en']).optional(),
    theme: z.enum(THEMES).optional(),
  })
  .refine((data) => data.locale !== undefined || data.theme !== undefined, {
    message: 'empty_payload',
  });
export type PreferencesInput = z.infer<typeof preferencesUpdateSchema>;

interface PreferencesRow extends Preferences {
  createdAt: string;
  updatedAt: string;
}

const getPreferencesRow = cache(async (): Promise<PreferencesRow | null> => {
  const user = await getCurrentUser();
  if (!user) return null;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('user_preferences')
      .select('locale, theme, createdAt, updatedAt')
      .eq('userId', user.id)
      .maybeSingle();

    if (error || !data) return null;
    return data as PreferencesRow;
  } catch {
    return null;
  }
});

export const getPreferences = cache(async (): Promise<Preferences> => {
  const row = await getPreferencesRow();
  return row ? { locale: row.locale, theme: row.theme } : DEFAULT_PREFERENCES;
});

export const getPreferencesSyncInfo = cache(
  async (): Promise<PreferencesSyncInfo> => {
    const row = await getPreferencesRow();
    if (!row) return { ...DEFAULT_PREFERENCES, neverCustomized: true };
    return {
      locale: row.locale,
      theme: row.theme,
      neverCustomized: row.createdAt === row.updatedAt,
    };
  },
);
