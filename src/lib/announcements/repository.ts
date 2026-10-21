import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import { assertCurrentUserIsAdmin } from '@/lib/supabase/list-users';
import { createClient } from '@/lib/supabase/server';
import type { AnnouncementVariant } from '@/types/Announcement';

const SITE_ID = process.env.SITE_ID as string;

export interface Announcement {
  id: string;
  siteId: string;
  message: string;
  linkUrl: string | null;
  linkLabel: string | null;
  variant: AnnouncementVariant;
  startsAt: string | null;
  endsAt: string | null;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AnnouncementWriteInput {
  message: string;
  linkUrl: string | null;
  linkLabel: string | null;
  variant: AnnouncementVariant;
  /** Already-converted UTC ISO strings (or null) — see lib/announcements/dates.ts. */
  startsAt: string | null;
  endsAt: string | null;
  isActive: boolean;
}

export async function listAnnouncements(): Promise<Announcement[]> {
  await assertCurrentUserIsAdmin();
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .eq('siteId', SITE_ID)
    .eq('isDeleted', false)
    .order('createdAt', { ascending: false });
  if (error) throw error;
  return data as Announcement[];
}

export async function getAnnouncementById(
  id: string,
): Promise<Announcement | null> {
  await assertCurrentUserIsAdmin();
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .eq('id', id)
    .eq('siteId', SITE_ID)
    .eq('isDeleted', false)
    .maybeSingle();
  if (error) throw error;
  return data as Announcement | null;
}

export async function createAnnouncement(
  input: AnnouncementWriteInput,
): Promise<Announcement> {
  await assertCurrentUserIsAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('announcements')
    .insert({ ...input, siteId: SITE_ID })
    .select()
    .single();
  if (error) throw error;
  return data as Announcement;
}

export async function updateAnnouncement(
  id: string,
  input: AnnouncementWriteInput,
): Promise<Announcement> {
  await assertCurrentUserIsAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('announcements')
    .update(input) // AnnouncementWriteInput carries no siteId field — never client-controllable
    .eq('id', id)
    .eq('siteId', SITE_ID)
    .eq('isDeleted', false)
    .select()
    .single();
  if (error) throw error;
  return data as Announcement;
}

export async function toggleAnnouncement(
  id: string,
  isActive: boolean,
): Promise<Announcement> {
  await assertCurrentUserIsAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('announcements')
    .update({ isActive })
    .eq('id', id)
    .eq('siteId', SITE_ID)
    .eq('isDeleted', false)
    .select()
    .single();
  if (error) throw error;
  return data as Announcement;
}

/** Soft delete: a row is never physically removed, only flagged. */
export async function deleteAnnouncement(id: string): Promise<void> {
  await assertCurrentUserIsAdmin();
  const supabase = await createClient();
  const { error } = await supabase
    .from('announcements')
    .update({ isDeleted: true })
    .eq('id', id)
    .eq('siteId', SITE_ID);
  if (error) throw error;
}

/**
 * Deliberately does NOT call assertCurrentUserIsAdmin() — this is the one
 * function in this file called for anonymous public visitors (via
 * lib/announcements/get-active.ts). Do not "fix" this.
 */
export async function getActiveAnnouncementRow(): Promise<Announcement | null> {
  const supabase = createAdminClient();
  // get_active_announcement() returns `setof` — an empty array when no
  // announcement matches, never a phantom all-null row.
  const { data, error } = await supabase.rpc('get_active_announcement', {
    p_site_id: SITE_ID,
  });
  if (error) throw error;
  return (data?.[0] as Announcement | undefined) ?? null;
}
