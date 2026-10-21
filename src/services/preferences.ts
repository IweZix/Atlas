import type {
  PreferencesPayload,
  PreferencesResult,
} from '@/services/types/preferences';

export async function updatePreferences(
  payload: PreferencesPayload,
): Promise<PreferencesResult> {
  const response = await fetch('/api/preferences', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  return response.json();
}
