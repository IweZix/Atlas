import type { Announcement } from '@/lib/announcements/repository';

export type AnnouncementStatus =
  | 'live'
  | 'scheduled'
  | 'expired'
  | 'disabled'
  | 'pending';

/**
 * Never re-derives the SQL priority logic (get_active_announcement) — the
 * caller fetches that once and passes its id as activeAnnouncementId, so
 * the dashboard and the public site can never disagree about which
 * announcement is live.
 */
export function getAnnouncementStatus(
  announcement: Pick<Announcement, 'id' | 'isActive' | 'startsAt' | 'endsAt'>,
  activeAnnouncementId: string | null,
  now: Date = new Date(),
): AnnouncementStatus {
  if (!announcement.isActive) return 'disabled';
  if (announcement.endsAt && new Date(announcement.endsAt) <= now) {
    return 'expired';
  }
  if (announcement.startsAt && new Date(announcement.startsAt) > now) {
    return 'scheduled';
  }
  return announcement.id === activeAnnouncementId ? 'live' : 'pending';
}
