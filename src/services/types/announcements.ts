import type { Announcement } from '@/lib/announcements/repository';
import type { AnnouncementFormValues } from '@/lib/announcements/schema';

export interface GetAnnouncementsResult {
  announcements: Announcement[];
  activeAnnouncementId: string | null;
}

export interface GetAnnouncementResult {
  announcement: Announcement;
}

export type AnnouncementPayload = AnnouncementFormValues;

export type AnnouncementResult =
  | { ok: true; announcement: Announcement }
  | { ok: false; errors: Record<string, string[]> };

export type AnnouncementDeleteResult =
  | { ok: true }
  | { ok: false; errors: Record<string, string[]> };
