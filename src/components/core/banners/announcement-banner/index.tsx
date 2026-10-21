import { getTranslations } from 'next-intl/server';
import AnnouncementDismiss from '@/components/core/announcements/announcement-dismiss';
import { getActiveAnnouncement } from '@/lib/announcements/get-active';
import { tKeys } from '@/localization/tKeys';
import { AnnouncementBannerView } from './view';

export default async function AnnouncementBanner() {
  const announcement = await getActiveAnnouncement();
  if (!announcement) return null;

  const t = await getTranslations();

  return (
    <AnnouncementDismiss
      key={`${announcement.id}:${announcement.updatedAt}`}
      id={announcement.id}
      updatedAt={announcement.updatedAt}
      variant={announcement.variant}
    >
      <AnnouncementBannerView
        message={announcement.message}
        variant={announcement.variant}
        linkUrl={announcement.linkUrl}
        linkLabel={announcement.linkLabel}
        ariaLabel={t(tKeys.announcements.public.ariaLabel)}
      />
    </AnnouncementDismiss>
  );
}
