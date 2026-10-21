import type {
  AnnouncementDeleteResult,
  AnnouncementPayload,
  AnnouncementResult,
  GetAnnouncementResult,
  GetAnnouncementsResult,
} from '@/services/types/announcements';

/**
 * Fetches the list of announcements from the API.
 * @returns A promise resolving to the list of announcements and the currently active announcement's id.
 */
export async function getAnnouncements(): Promise<GetAnnouncementsResult> {
  const response = await fetch('/api/admin/announcements');

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error ?? 'announcements_unavailable');
  }

  return response.json();
}

/**
 * Fetches a single announcement from the API.
 * @param announcementId The ID of the announcement to fetch.
 * @returns A promise resolving to the announcement.
 */
export async function getAnnouncement(
  announcementId: string,
): Promise<GetAnnouncementResult> {
  const response = await fetch(`/api/admin/announcements/${announcementId}`);

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error ?? 'announcement_unavailable');
  }

  return response.json();
}

/**
 * Creates a new announcement via the API.
 * @param {AnnouncementPayload} payload The data for the new announcement.
 * @returns {Promise<AnnouncementResult>} A promise resolving to the created announcement, or field-level validation errors.
 */
export async function createAnnouncement(
  payload: AnnouncementPayload,
): Promise<AnnouncementResult> {
  const response = await fetch('/api/admin/announcements', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  return response.json();
}

/**
 * Updates an existing announcement via the API.
 * @param {string} announcementId The ID of the announcement to update.
 * @param {AnnouncementPayload} payload The data to update the announcement with.
 * @returns {Promise<AnnouncementResult>} A promise resolving to the updated announcement, or field-level validation errors.
 */
export async function updateAnnouncement(
  announcementId: string,
  payload: AnnouncementPayload,
): Promise<AnnouncementResult> {
  const response = await fetch(`/api/admin/announcements/${announcementId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  return response.json();
}

/**
 * Sets the active status of an announcement via the API.
 * @param {string} announcementId The ID of the announcement to update.
 * @param {boolean} isActive The new active status of the announcement.
 * @returns {Promise<AnnouncementResult>} A promise resolving to the updated announcement.
 */
export async function toggleAnnouncement(
  announcementId: string,
  isActive: boolean,
): Promise<AnnouncementResult> {
  const response = await fetch(
    `/api/admin/announcements/${announcementId}/status`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive }),
    },
  );

  return response.json();
}

/**
 * Deletes an announcement via the API.
 * @param {string} announcementId The ID of the announcement to delete.
 * @returns {Promise<AnnouncementDeleteResult>} A promise resolving when the deletion is complete.
 */
export async function deleteAnnouncement(
  announcementId: string,
): Promise<AnnouncementDeleteResult> {
  const response = await fetch(`/api/admin/announcements/${announcementId}`, {
    method: 'DELETE',
  });

  return response.json();
}
