import 'server-only';
import {
  type Announcement,
  getActiveAnnouncementRow,
} from '@/lib/announcements/repository';
import { isEnabled } from '@/lib/features';

export async function getActiveAnnouncement(): Promise<Announcement | null> {
  try {
    if (!(await isEnabled('banner'))) return null;
    return await getActiveAnnouncementRow();
  } catch (err) {
    console.error('[announcements] getActiveAnnouncement failed', err);
    return null;
  }
}
