import type { Preferences } from '@/lib/preferences';

export type PreferencesPayload = Partial<Preferences>;

export type PreferencesResult =
  | { ok: true; preferences: Preferences }
  | { ok: false; errors: Record<string, string[]> };
